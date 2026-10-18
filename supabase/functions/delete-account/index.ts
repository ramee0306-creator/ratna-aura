// "Delete my account and data": permanently removes the signed-in user.
// The database cascades the delete to their profile and all saved birth profiles.
//
//   POST /delete-account   body: { "confirm": "DELETE" }
import { corsHeaders, errorResponse, json, readJson } from '../_shared/http.ts';
import { admin, getUser } from '../_shared/supabase.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return errorResponse(405, 'Method not allowed');

  const user = await getUser(req);
  if (!user) return errorResponse(401, 'Please sign in again');

  const body = (await readJson(req)) as { confirm?: unknown } | undefined;
  if (body?.confirm !== 'DELETE') return errorResponse(400, 'Confirmation missing');

  const { error } = await admin().auth.admin.deleteUser(user.id);
  if (error) {
    console.error('delete-account failed', error.message);
    return errorResponse(500, 'Could not delete the account. Please try again.');
  }
  return json({ deleted: true });
});
