-- ============================================================================
-- GymQuest Community — migration 0003
-- ----------------------------------------------------------------------------
-- Fixes two review findings:
--  1. Moderators could not actually suspend anyone: 0001 only had a
--     profiles_update_own policy, so a moderator updating another profile's
--     `suspended` was filtered to 0 rows. This adds the moderator policy (the
--     `suspended` column grant already exists in 0002; the guard trigger still
--     rejects non-moderators).
--  2. The 10-post quota counted `posts` rows, not stored objects, so a direct
--     caller could upload unlimited objects without inserting a post. This adds
--     a per-user object cap (10 posts x 2 files + margin) enforced on upload.
-- Safe to run once after 0002.
-- ============================================================================

drop policy if exists profiles_update_moderator on public.profiles;
create policy profiles_update_moderator on public.profiles for update
  using (public.is_moderator()) with check (public.is_moderator());

create or replace function public.community_object_count(uid uuid)
returns integer language sql stable security definer set search_path = public as $$
  select count(*)::int from storage.objects
  where bucket_id = 'community' and (storage.foldername(name))[1] = uid::text;
$$;

grant execute on function public.community_object_count(uuid) to authenticated;

drop policy if exists community_insert_own on storage.objects;
create policy community_insert_own on storage.objects for insert with check (
  bucket_id = 'community'
  and (storage.foldername(name))[1] = auth.uid()::text
  and not public.is_suspended()
  and public.moderation_ready()
  and public.active_post_count(auth.uid()) < 10
  and public.community_object_count(auth.uid()) < 20
);
