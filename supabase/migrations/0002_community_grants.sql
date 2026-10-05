-- ============================================================================
-- GymQuest Community — migration 0002: explicit API privileges (GRANTs)
-- ----------------------------------------------------------------------------
-- WHY: if "Automatically expose new tables" is turned OFF in the project, the
-- tables created by 0001 have NO privileges for the `authenticated` role, so
-- PostgREST/Storage cannot reach them at all and every policy is moot.
--
-- This migration grants the minimum the API needs. RLS still decides rows, and
-- the guard triggers still decide columns — privileges here are the outer layer.
--
-- Safe to run once after 0001. If 0001 was already applied, run ONLY this file
-- (never re-run an already-applied migration).
-- ============================================================================

grant usage on schema public to authenticated;

-- Profiles: anyone signed in may read (this table holds no email). A user may
-- update only their own row (RLS) and only these columns. `role` is intentionally
-- NOT granted, so it can only ever be changed by the owner via SQL.
-- `suspended` is granted because moderators must be able to suspend through the
-- API — the `profiles_guard` trigger rejects it for non-moderators.
grant select on public.profiles to authenticated;
grant update (username, bio, avatar_path, suspended) on public.profiles to authenticated;

-- Posts: full DML for signed-in users; RLS restricts rows and the posts_guard
-- trigger forces status='pending' on insert and blocks non-moderator status edits.
grant select, insert, update, delete on public.posts to authenticated;

-- Reports: file and read (RLS: reporter or moderator); moderators resolve.
grant select, insert, update on public.reports to authenticated;

-- Blocks: manage one's own (RLS).
grant select, insert, delete on public.blocks to authenticated;

-- Helper functions used by RLS and by the Storage policies (the Storage policy
-- subquery on public.posts also relies on the SELECT grant above).
grant execute on function public.is_moderator() to authenticated;
grant execute on function public.is_suspended() to authenticated;
grant execute on function public.active_post_count(uuid) to authenticated;
grant execute on function public.moderation_ready() to authenticated;
