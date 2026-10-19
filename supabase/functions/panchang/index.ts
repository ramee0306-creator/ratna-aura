// The panchang (Hindu almanac) for one date and place.
//
//   POST /panchang   body: { "date": "2026-10-19", "latitude": 28.61, "longitude": 77.21, "timezone": "Asia/Kolkata" }
//   -> { panchang }
//
// Nothing personal is involved and nothing is stored. Signing in is required only to stop misuse.
import { ephemeris } from '../_shared/engine.ts';
import { corsHeaders, errorResponse, json, readJson } from '../_shared/http.ts';
import { buildPanchang } from '../_shared/kundli/index.ts';
import { parsePlaceRequest } from '../_shared/requests.ts';
import { getUser } from '../_shared/supabase.ts';

const WASM = new URL('./swiss_eph.wasm', import.meta.url);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return errorResponse(405, 'Method not allowed');

  const user = await getUser(req);
  if (!user) return errorResponse(401, 'Please sign in again');

  const input = parsePlaceRequest(await readJson(req));
  if (typeof input === 'string') return errorResponse(400, input);

  try {
    return json({ panchang: buildPanchang(input, await ephemeris(WASM)) });
  } catch (err) {
    console.error('panchang failed', err instanceof Error ? err.message : err);
    return errorResponse(500, 'Could not prepare the panchang. Please try again.');
  }
});
