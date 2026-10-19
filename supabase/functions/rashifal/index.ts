// Daily rashifal for one Moon sign, in the user's language, written by AI.
//
//   POST /rashifal   body: { "sign": 0-11, "language": "hi", "date"?: "YYYY-MM-DD" (India date: today or tomorrow) }
//   -> { rashifal, date, sign, language, generatedAt }      or 202 { pending: true } — ask again in a few seconds
//
// Each (day, sign, language) is written ONCE, the first time someone asks, and saved for everyone.
// So the AI cost is at most 12 signs × 31 languages per day, however many people use the app.
import Anthropic from 'npm:@anthropic-ai/sdk@0.131.0';

import { AiNotConfigured, AiRefused, generateJson, modelFor } from '../_shared/claude.ts';
import { ephemeris } from '../_shared/engine.ts';
import { corsHeaders, errorResponse, json, readJson } from '../_shared/http.ts';
import { buildPanchang } from '../_shared/kundli/index.ts';
import { isLanguage, LANGUAGE_NAMES } from '../_shared/languages.ts';
import { cleanRashifal, RASHIFAL_SCHEMA, RASHIFAL_SYSTEM, rashifalPrompt, skyNotes } from '../_shared/rashifal.ts';
import { addDays, isCalendarDate, todayIn } from '../_shared/requests.ts';
import { admin, getUser } from '../_shared/supabase.ts';

const WASM = new URL('./swiss_eph.wasm', import.meta.url);
const INDIA = 'Asia/Kolkata';
// The day's sky is read for New Delhi, as most national panchangs do.
const DELHI = { latitude: 28.6139, longitude: 77.209, timezone: INDIA };
/** A 'generating' row older than this is treated as abandoned (the writer crashed). */
const STALE_MS = 3 * 60_000;

type Row = { status: 'generating' | 'ready'; content: unknown; created_at: string };

async function readRow(day: string, sign: number, language: string): Promise<Row | null> {
  const { data, error } = await admin()
    .from('rashifal')
    .select('status, content, created_at')
    .match({ day, sign, language })
    .maybeSingle();
  if (error) throw error;
  return data as Row | null;
}

/** Tries to become the one who writes this reading. */
async function claim(day: string, sign: number, language: string, existing: Row | null): Promise<boolean> {
  const db = admin();
  if (!existing) {
    const { error } = await db.from('rashifal').insert({ day, sign, language, status: 'generating' });
    if (!error) return true;
    if (error.code === '23505') return false; // someone else just started it
    throw error;
  }
  if (existing.status === 'generating' && Date.now() - Date.parse(existing.created_at) > STALE_MS) {
    const { data, error } = await db
      .from('rashifal')
      .update({ created_at: new Date().toISOString() })
      .match({ day, sign, language, status: 'generating', created_at: existing.created_at })
      .select('day');
    if (error) throw error;
    return (data ?? []).length === 1;
  }
  return false;
}

async function write(day: string, sign: number, language: string) {
  const eph = await ephemeris(WASM);
  const panchang = buildPanchang({ date: day, ...DELHI }, eph);
  const model = await modelFor('rashifal');
  const answer = await generateJson({
    model,
    system: RASHIFAL_SYSTEM,
    prompt: rashifalPrompt({ sign, date: day, language: LANGUAGE_NAMES[language], sky: skyNotes(sign, eph, panchang) }),
    schema: RASHIFAL_SCHEMA,
  });
  const content = cleanRashifal(answer.data);
  if (!content) throw new Error('The AI answer was incomplete');
  console.log('rashifal written', { day, sign, language, model: answer.model, in: answer.inputTokens, out: answer.outputTokens });
  const { error } = await admin()
    .from('rashifal')
    .update({ status: 'ready', content, model: answer.model })
    .match({ day, sign, language });
  if (error) throw error;
  return content;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return errorResponse(405, 'Method not allowed');

  const user = await getUser(req);
  if (!user) return errorResponse(401, 'Please sign in again');

  const body = ((await readJson(req)) ?? {}) as { sign?: unknown; language?: unknown; date?: unknown };
  const sign = body.sign;
  if (typeof sign !== 'number' || !Number.isInteger(sign) || sign < 0 || sign > 11) return errorResponse(400, 'sign must be 0–11');
  if (!isLanguage(body.language)) return errorResponse(400, 'unknown language');
  const language = body.language;
  const today = todayIn(INDIA);
  const day = body.date === undefined ? today : body.date;
  // Only today and tomorrow, so nobody can make the server write thousands of readings.
  if (!isCalendarDate(day) || (day !== today && day !== addDays(today, 1))) return errorResponse(400, 'date must be today or tomorrow');

  const reply = (content: unknown, createdAt: string) => json({ rashifal: content, date: day, sign, language, generatedAt: createdAt });

  try {
    let row = await readRow(day, sign, language);
    if (row?.status === 'ready') return reply(row.content, row.created_at);

    if (await claim(day, sign, language, row)) {
      try {
        return reply(await write(day, sign, language), new Date().toISOString());
      } catch (err) {
        // Let the next request try again.
        await admin().from('rashifal').delete().match({ day, sign, language, status: 'generating' });
        throw err;
      }
    }

    // Someone else is writing it right now: wait for them (up to about 40 seconds).
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      row = await readRow(day, sign, language);
      if (row?.status === 'ready') return reply(row.content, row.created_at);
      if (!row) break;
    }
    return json({ pending: true }, 202);
  } catch (err) {
    if (err instanceof AiNotConfigured) return errorResponse(503, 'Daily rashifal is not switched on yet');
    if (err instanceof AiRefused) return errorResponse(502, 'Could not write today’s rashifal. Please try again later.');
    if (err instanceof Anthropic.RateLimitError || err instanceof Anthropic.InternalServerError) {
      return errorResponse(503, 'The AI is busy. Please try again in a minute.');
    }
    console.error('rashifal failed', err instanceof Error ? err.message : err);
    return errorResponse(500, 'Could not prepare the rashifal. Please try again.');
  }
});
