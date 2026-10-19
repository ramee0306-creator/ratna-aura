// Calling Claude (Anthropic's AI) from the server. The API key is a server secret
// (ANTHROPIC_API_KEY in Supabase → Edge Functions → Secrets); it never reaches the app.
import Anthropic from 'npm:@anthropic-ai/sdk@0.131.0';

import { admin } from './supabase.ts';

/** The model used unless the admin changes it (app_settings table) or the AI_MODEL secret is set.
 *  Haiku is the cheapest Claude model (about ₹0.1 per rashifal); Sonnet or Opus write richer text for more. */
export const DEFAULT_MODEL = 'claude-haiku-5-5';

export class AiNotConfigured extends Error {}
/** Claude declined to write this (safety). */
export class AiRefused extends Error {}

let client: Anthropic | null = null;
function anthropic(): Anthropic {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) throw new AiNotConfigured('ANTHROPIC_API_KEY is not set');
  return (client ??= new Anthropic({ apiKey, maxRetries: 2, timeout: 120_000 }));
}

/** Model for a feature: app_settings row `<feature>_model`, else the AI_MODEL secret, else the default. */
export async function modelFor(feature: 'rashifal' | 'chat'): Promise<string> {
  const { data } = await admin().from('app_settings').select('value').eq('key', `${feature}_model`).maybeSingle();
  const fromTable = typeof data?.value === 'string' ? data.value : null;
  return fromTable || Deno.env.get('AI_MODEL') || DEFAULT_MODEL;
}

export const hasServerFallback = (model: string) => !model.startsWith('claude-haiku');

/** Asks Claude for a JSON answer that follows `schema`. */
export async function generateJson(opts: {
  model: string;
  system: string;
  prompt: string;
  schema: Record<string, unknown>;
  maxTokens?: number;
}): Promise<{ data: unknown; model: string; inputTokens: number; outputTokens: number }> {
  const response = await anthropic().beta.messages.create({
    model: opts.model,
    max_tokens: opts.maxTokens ?? 8000,
    system: opts.system,
    messages: [{ role: 'user', content: opts.prompt }],
    // Short, everyday writing: low effort is enough and keeps it quick and cheap.
    output_config: { effort: 'low', format: { type: 'json_schema', schema: opts.schema } },
    // On Opus/Sonnet, if the safety system declines, the API retries on its recommended fallback model.
    // Haiku has no server-side fallback (the option would be ignored or rejected), so it is left out there.
    ...(hasServerFallback(opts.model) ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' as const } : {}),
  });
  if (response.stop_reason === 'refusal') throw new AiRefused('Claude declined this request');
  if (response.stop_reason === 'max_tokens') throw new Error('The AI answer was cut off');
  const text = response.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('');
  return {
    data: JSON.parse(text),
    model: response.model,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };
}
