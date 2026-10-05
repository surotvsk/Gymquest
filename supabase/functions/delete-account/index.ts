// ============================================================================
// GymQuest Community — Edge Function: delete-account
// ----------------------------------------------------------------------------
// Privileged: removes the CALLER's own community profile, posts and stored
// media. The service_role key lives ONLY here (in the function's secrets) and
// is never exposed to the browser.
//
// This deletes community data only. It does NOT and cannot touch the user's
// private on-device workouts; and it cannot remove copies other people already
// saved.
//
// Deploy (as the project owner):
//   supabase functions deploy delete-account
//   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...   # never commit this
// SUPABASE_URL and SUPABASE_ANON_KEY are provided by the platform.
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!serviceKey) return json({ error: 'server_not_configured' }, 500);

  // 1. Identify the caller from their JWT (never trust a body-supplied id).
  const authHeader = req.headers.get('Authorization') ?? '';
  const caller = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await caller.auth.getUser();
  const uid = userData?.user?.id;
  if (userErr || !uid) return json({ error: 'unauthorized' }, 401);

  // 2. Admin client (service_role) — remove the caller's storage objects.
  const admin = createClient(supabaseUrl, serviceKey);
  for (const bucket of ['community', 'avatars']) {
    const { data: list } = await admin.storage.from(bucket).list(uid, { limit: 1000 });
    const paths = (list ?? []).map((f) => `${uid}/${f.name}`);
    if (paths.length) await admin.storage.from(bucket).remove(paths);
  }

  // 3. Delete the auth user; profiles/posts/reports/blocks cascade from it.
  const { error: delErr } = await admin.auth.admin.deleteUser(uid);
  if (delErr) return json({ error: 'delete_failed' }, 500);

  return json({ ok: true }, 200);
});

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}
