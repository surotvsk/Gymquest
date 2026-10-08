// ============================================================================
// GymQuest — Edge Function: delete-account
// ----------------------------------------------------------------------------
// Privileged. Two modes, both authenticated by the caller's JWT:
//
//   mode = 'community'  -> "Leave Community": removes the caller's posts,
//                          community/avatar media, reports and blocks, and
//                          clears bio + avatar. KEEPS the auth account and the
//                          private cloud backup. (No auth user deletion.)
//
//   mode = 'full'       -> "Delete my account and all cloud data": removes the
//                          caller's community artifacts AND the private backup
//                          (backups bucket objects + backups row via cascade),
//                          then deletes the auth user.
//
// It never touches the user's private ON-DEVICE workouts (the app keeps those).
// The service_role key lives ONLY here (function secrets) and is never exposed
// to the browser.
//
// Deploy (as the project owner):
//   supabase functions deploy delete-account
// SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are RESERVED
// secrets Supabase provides automatically — never set them manually.
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

  const body = await req.json().catch(() => ({}));
  const mode = body && body.mode === 'community' ? 'community' : 'full';

  // 1. Identify the caller from their JWT (never trust a body-supplied id).
  const authHeader = req.headers.get('Authorization') ?? '';
  const caller = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await caller.auth.getUser();
  const uid = userData?.user?.id;
  if (userErr || !uid) return json({ error: 'unauthorized' }, 401);

  const admin = createClient(supabaseUrl, serviceKey);

  // 2. Remove the caller's storage objects.
  const buckets = mode === 'full'
    ? ['community', 'avatars', 'backups']
    : ['community', 'avatars'];
  for (const bucket of buckets) {
    // Recursive + paginated: handles nested backups media paths <uid>/media/<id>/<hash>.
    const paths = await listAllRecursive(admin, bucket, uid);
    if (paths.length) {
      // Never silently ignore a Storage failure — a partial deletion must surface.
      const { error: rmErr } = await admin.storage.from(bucket).remove(paths);
      if (rmErr) return json({ error: 'storage_delete_failed', bucket }, 500);
    }
  }

  // 3. Community content: posts, reports and blocks authored/owned by the caller.
  await admin.from('posts').delete().eq('user_id', uid);
  await admin.from('reports').delete().eq('reporter_id', uid);
  await admin.from('blocks').delete().eq('blocker_id', uid);
  await admin.from('blocks').delete().eq('blocked_id', uid);

  if (mode === 'community') {
    // Keep the account and the private backup; just clear the public profile bits.
    await admin.from('profiles').update({ bio: '', avatar_path: null }).eq('id', uid);
    return json({ ok: true, mode: 'community' }, 200);
  }

  // 4. Full delete: private backup row (cascade) + the auth user.
  //    profiles/posts/reports/blocks cascade from auth.users.
  await admin.from('backups').delete().eq('user_id', uid);
  const { error: delErr } = await admin.auth.admin.deleteUser(uid);
  if (delErr) return json({ error: 'delete_failed' }, 500);

  return json({ ok: true, mode: 'full' }, 200);
});

async function listAllRecursive(admin: ReturnType<typeof createClient>, bucket: string, prefix: string): Promise<string[]> {
  const out: string[] = [];
  let offset = 0;
  while (true) {
    const { data, error } = await admin.storage.from(bucket).list(prefix, { limit: 1000, offset });
    if (error) throw new Error('storage_list_failed: ' + bucket + ': ' + error.message);
    if (!data || data.length === 0) break;
    for (const f of data) {
      const path = `${prefix}/${f.name}`;
      if (f && f.id) out.push(path);              // a file
      else out.push(...await listAllRecursive(admin, bucket, path));   // a folder → recurse
    }
    if (data.length < 1000) break;                // last page
    offset += data.length;                        // paginate
  }
  return out;
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}
