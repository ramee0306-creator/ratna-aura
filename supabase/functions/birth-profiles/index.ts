// Save, list, update and delete the people (self + family) a user has added.
// Personal details are encrypted before they reach the database.
//
//   GET    /birth-profiles            -> list
//   POST   /birth-profiles            -> create   (body: BirthProfileInput)
//   PATCH  /birth-profiles?id=<uuid>  -> replace  (body: BirthProfileInput)
//   DELETE /birth-profiles?id=<uuid>  -> delete
import { splitForStorage, validateBirthProfile } from '../_shared/birth-details.ts';
import { encryptJson } from '../_shared/crypto.ts';
import { corsHeaders, errorResponse, json, readJson } from '../_shared/http.ts';
import { keyRing, PROFILE_COLUMNS, type ProfileRow, toPublic, UUID } from '../_shared/profiles.ts';
import { admin, getUser } from '../_shared/supabase.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const user = await getUser(req);
  if (!user) return errorResponse(401, 'Please sign in again');

  const db = admin();
  const id = new URL(req.url).searchParams.get('id');
  if (id !== null && !UUID.test(id)) return errorResponse(400, 'Invalid id');

  try {
    if (req.method === 'GET') {
      const { data, error } = await db
        .from('birth_profiles')
        .select(PROFILE_COLUMNS)
        .eq('owner_id', user.id)
        .order('is_primary', { ascending: false })
        .order('created_at');
      if (error) throw error;
      return json({ profiles: await Promise.all((data as ProfileRow[]).map((r) => toPublic(r, user.id))) });
    }

    if (req.method === 'POST' || req.method === 'PATCH') {
      if (req.method === 'PATCH' && !id) return errorResponse(400, 'Missing id');
      const result = validateBirthProfile(await readJson(req));
      if (!result.ok) return errorResponse(422, 'Please check the details', result.errors);

      const { details, columns } = splitForStorage(result.value);
      const data_enc = await encryptJson(await keyRing(), details, user.id);

      // Only one "primary" person per account: clear the old one first.
      if (columns.is_primary) {
        const clear = db.from('birth_profiles').update({ is_primary: false }).eq('owner_id', user.id);
        const { error } = await (id ? clear.neq('id', id) : clear);
        if (error) throw error;
      }

      const query =
        req.method === 'POST'
          ? db.from('birth_profiles').insert({ owner_id: user.id, ...columns, data_enc })
          : db.from('birth_profiles').update({ ...columns, data_enc }).eq('id', id).eq('owner_id', user.id);
      const { data, error } = await query.select(PROFILE_COLUMNS).maybeSingle();
      if (error) {
        if (error.message.includes('up to 20')) return errorResponse(409, 'You can save up to 20 profiles');
        throw error;
      }
      if (!data) return errorResponse(404, 'Profile not found');
      return json({ profile: await toPublic(data as ProfileRow, user.id) }, req.method === 'POST' ? 201 : 200);
    }

    if (req.method === 'DELETE') {
      if (!id) return errorResponse(400, 'Missing id');
      const { error, count } = await db
        .from('birth_profiles')
        .delete({ count: 'exact' })
        .eq('id', id)
        .eq('owner_id', user.id);
      if (error) throw error;
      if (!count) return errorResponse(404, 'Profile not found');
      return json({ deleted: true });
    }

    return errorResponse(405, 'Method not allowed');
  } catch (err) {
    // Log the technical error on the server only; never echo personal data back.
    console.error('birth-profiles failed', err instanceof Error ? err.message : err);
    return errorResponse(500, 'Something went wrong. Please try again.');
  }
});
