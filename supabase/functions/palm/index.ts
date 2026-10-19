// Palm reading (hast rekha) from photos, paid before the reading is made.
//
//   GET  /palm                          -> { price, premiumIncludes, wallet, readings: [{ id, createdAt, reading }] }
//   POST /palm { photos, language }     -> { id, createdAt, reading, wallet }
//        photos: [{ hand: 'left'|'right', mediaType: 'image/jpeg', data: <base64> }] (one or two)
//        -> 402 { error, wallet }                 not enough credits
//        -> 422 { notPalm: true, message, wallet } no clear palm in the photos (credits given back)
//
// The photos go to Claude for this one reading and are never stored. The reading is stored encrypted.
import { chatErrorResponse } from '../_shared/chat-errors.ts';
import { generateJson, modelFor } from '../_shared/claude.ts';
import { decryptJson, encryptJson } from '../_shared/crypto.ts';
import { corsHeaders, errorResponse, json, readJson } from '../_shared/http.ts';
import { isLanguage, LANGUAGE_NAMES } from '../_shared/languages.ts';
import { cleanReading, PALM_SCHEMA, palmSystem, parsePhotos } from '../_shared/palm.ts';
import { keyRing } from '../_shared/profiles.ts';
import { admin, getUser } from '../_shared/supabase.ts';
import { keyHash } from '../_shared/unlocks.ts';
import { featurePrices, getWallet, premiumIncludesTools } from '../_shared/wallet.ts';

/** Readings per user per day (also for Premium, where readings are included). */
const READINGS_PER_DAY = 5;

type Row = { id: string; reading_enc: string; created_at: string };

async function recentReadings(userId: string) {
  const { data, error } = await admin()
    .from('palm_readings')
    .select('id, reading_enc, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);
  if (error) throw error;
  const ring = await keyRing();
  return Promise.all(
    (data as Row[]).map(async (r) => ({ id: r.id, createdAt: r.created_at, reading: (await decryptJson<{ text: string }>(ring, r.reading_enc, userId)).text })),
  );
}

async function readingsToday(userId: string) {
  const { count, error } = await admin()
    .from('palm_readings')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', new Date(Date.now() - 24 * 3600_000).toISOString());
  if (error) throw error;
  return count ?? 0;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const user = await getUser(req);
  if (!user) return errorResponse(401, 'Please sign in again');
  const db = admin();
  const [prices, premiumIncludes] = await Promise.all([featurePrices(), premiumIncludesTools()]);
  const price = prices.palm;

  if (req.method === 'GET') {
    try {
      return json({ price: price ?? null, premiumIncludes, wallet: await getWallet(user.id), readings: await recentReadings(user.id) });
    } catch (err) {
      console.error('palm list failed', err);
      return errorResponse(500, 'Something went wrong. Please try again.');
    }
  }
  if (req.method !== 'POST') return errorResponse(405, 'Method not allowed');

  const body = ((await readJson(req)) ?? {}) as { photos?: unknown; language?: unknown };
  if (!isLanguage(body.language)) return errorResponse(400, 'unknown language');
  const photos = parsePhotos(body.photos);
  if (typeof photos === 'string') return errorResponse(400, photos);
  if (price === undefined) return errorResponse(503, 'Palm reading is not available right now');
  if ((await readingsToday(user.id)) >= READINGS_PER_DAY) return errorResponse(429, 'Daily limit reached. Please try again tomorrow.');

  // Pay first (each reading is its own unlock), then read; any failure gives the credits back.
  const id = crypto.randomUUID();
  const hash = await keyHash('palm', id);
  const { data: status, error: payError } = await db.rpc('unlock_feature', {
    p_user: user.id,
    p_feature: 'palm',
    p_key_hash: hash,
    p_price: price,
    p_premium_included: premiumIncludes,
  });
  if (payError) {
    console.error('palm payment failed', payError);
    return errorResponse(500, 'Something went wrong. Please try again. You were not charged.');
  }
  if (status === 'none') return json({ error: 'Not enough credits', wallet: await getWallet(user.id) }, 402);
  const refund = () => db.rpc('undo_unlock', { p_user: user.id, p_feature: 'palm', p_key_hash: hash });

  try {
    const result = await generateJson({
      model: await modelFor('chat'),
      system: palmSystem(LANGUAGE_NAMES[body.language]),
      prompt: [
        {
          role: 'user',
          content: [
            ...photos.flatMap((p) => [
              { type: 'text' as const, text: `Photo of the ${p.hand} palm:` },
              { type: 'image' as const, source: { type: 'base64' as const, media_type: p.mediaType, data: p.data } },
            ]),
            { type: 'text' as const, text: 'Please read my palm.' },
          ],
        },
      ],
      schema: PALM_SCHEMA,
      maxTokens: 6000,
    });
    const reading = cleanReading(result.data);
    if (!reading) throw new Error('The AI answer was empty');
    if (!reading.isPalm) {
      await refund();
      return json({ notPalm: true, message: reading.reading, wallet: await getWallet(user.id) }, 422);
    }
    const { data: row, error } = await db
      .from('palm_readings')
      .insert({ user_id: user.id, language: body.language, reading_enc: await encryptJson(await keyRing(), { text: reading.reading }, user.id) })
      .select('id, created_at')
      .single();
    if (error) throw error;
    return json({ id: row.id, createdAt: row.created_at, reading: reading.reading, wallet: await getWallet(user.id) });
  } catch (err) {
    await refund();
    return chatErrorResponse(err, 'palm');
  }
});
