// Makes the kundli (birth chart) for one of the signed-in user's saved people.
//
//   POST /kundli   body: { "profileId": "<uuid>" }
//   -> { profile: { id, fullName, relation, birthDate, birthTime, birthPlace }, kundli }
//
// Nothing is stored: the chart is calculated fresh each time from the encrypted birth details.
import { ephemeris } from '../_shared/engine.ts';
import { corsHeaders, errorResponse, json, readJson } from '../_shared/http.ts';
import { buildKundli } from '../_shared/kundli/index.ts';
import { loadProfile, UUID } from '../_shared/profiles.ts';
import { admin, getUser } from '../_shared/supabase.ts';

const WASM = new URL('./swiss_eph.wasm', import.meta.url);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return errorResponse(405, 'Method not allowed');

  const user = await getUser(req);
  if (!user) return errorResponse(401, 'Please sign in again');

  const body = (await readJson(req)) as { profileId?: unknown } | undefined;
  const profileId = typeof body?.profileId === 'string' ? body.profileId : '';
  if (!UUID.test(profileId)) return errorResponse(400, 'profileId is required');

  try {
    const profile = await loadProfile(admin(), user.id, profileId);
    if (!profile) return errorResponse(404, 'Profile not found');
    const kundli = buildKundli(
      {
        birthDate: profile.birthDate,
        birthTime: profile.birthTime,
        latitude: profile.birthPlace.latitude,
        longitude: profile.birthPlace.longitude,
        timezone: profile.birthPlace.timezone,
      },
      await ephemeris(WASM),
    );
    return json({ profile, kundli });
  } catch (err) {
    console.error('kundli failed', err instanceof Error ? err.message : err);
    return errorResponse(500, 'Could not prepare the kundli. Please try again.');
  }
});
