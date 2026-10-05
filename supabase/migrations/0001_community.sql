-- ============================================================================
-- GymQuest Community — migration 0001
-- Optional online community for GymQuest. Everything here is additive and does
-- not touch the offline app or its data.
--
-- Run in the Supabase SQL editor, or with the Supabase CLI:
--   supabase db push
--
-- Security model:
--   * All authorization is enforced HERE (RLS + triggers + SECURITY DEFINER
--     functions). The client UI is never trusted.
--   * Users can only ever write their own records/files.
--   * Only APPROVED posts (and their media) are visible to others.
--   * Pending/rejected media is not reachable by a guessed URL.
--   * Reports are visible only to their reporter and moderators.
--   * Nobody can grant themselves a moderator role through the API.
--   * Suspended users cannot post or upload, even via direct API calls.
--   * Posting is disabled until at least one moderator exists (moderation_ready).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text not null,
  bio         text not null default '',
  avatar_path text,
  role        text not null default 'user' check (role in ('user', 'moderator')),
  suspended   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint profiles_username_len check (char_length(username) between 3 and 30),
  constraint profiles_username_chars check (username ~ '^[A-Za-z0-9_.-]+$'),
  constraint profiles_bio_len check (char_length(bio) <= 300)
);
create unique index if not exists profiles_username_lower_idx on public.profiles (lower(username));

create table if not exists public.posts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  image_path   text not null,
  thumb_path   text not null,
  caption      text not null default '',
  status       text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at   timestamptz not null default now(),
  published_at timestamptz,
  constraint posts_caption_len check (char_length(caption) <= 500)
);
create index if not exists posts_status_created_idx on public.posts (status, created_at desc);
create index if not exists posts_user_idx on public.posts (user_id);

create table if not exists public.reports (
  id               uuid primary key default gen_random_uuid(),
  reporter_id      uuid not null references public.profiles(id) on delete cascade,
  post_id          uuid references public.posts(id) on delete cascade,
  reported_user_id uuid references public.profiles(id) on delete cascade,
  reason           text not null default '',
  status           text not null default 'open' check (status in ('open', 'resolved')),
  created_at       timestamptz not null default now(),
  constraint reports_reason_len check (char_length(reason) <= 500),
  constraint reports_target check (post_id is not null or reported_user_id is not null)
);

create table if not exists public.blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint blocks_not_self check (blocker_id <> blocked_id)
);

-- ---------------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER — avoid RLS recursion)
-- ---------------------------------------------------------------------------

create or replace function public.is_moderator()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'moderator' and suspended = false
  );
$$;

create or replace function public.is_suspended()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select suspended from public.profiles where id = auth.uid()), true);
$$;

create or replace function public.active_post_count(uid uuid)
returns integer language sql stable security definer set search_path = public as $$
  select count(*)::int from public.posts
  where user_id = uid and status in ('pending', 'approved');
$$;

create or replace function public.moderation_ready()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where role = 'moderator' and suspended = false);
$$;

-- New auth user -> minimal, unique profile (username set later by the user).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username)
  values (new.id, 'user_' || substr(replace(new.id::text, '-', ''), 1, 10))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Guard: users may edit username/bio/avatar of their own row, but can never
-- change `role` (owner-only via SQL) and only moderators may flip `suspended`.
create or replace function public.profiles_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null then
    raise exception 'changing role is not allowed';
  end if;
  if new.suspended is distinct from old.suspended and auth.uid() is not null and not public.is_moderator() then
    raise exception 'changing suspended is not allowed';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_guard_trg on public.profiles;
create trigger profiles_guard_trg
  before update on public.profiles
  for each row execute function public.profiles_guard();

-- Guard: a post is always created as the caller's own pending post; only
-- moderators may change status, and users may change only the caption.
create or replace function public.posts_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    new.user_id := auth.uid();
    new.status := 'pending';
    new.published_at := null;
    return new;
  end if;
  if not public.is_moderator() then
    new.status := old.status;
    new.published_at := old.published_at;
    new.user_id := old.user_id;
    new.image_path := old.image_path;
    new.thumb_path := old.thumb_path;
    new.created_at := old.created_at;
  end if;
  return new;
end;
$$;

drop trigger if exists posts_guard_trg on public.posts;
create trigger posts_guard_trg
  before insert or update on public.posts
  for each row execute function public.posts_guard();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.posts    enable row level security;
alter table public.reports  enable row level security;
alter table public.blocks   enable row level security;

-- profiles: readable by everyone (this table holds NO email); users update only
-- their own row; the guard trigger protects role/suspended.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select using (true);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

-- posts: approved are public; owners see their own; moderators see all.
-- Insert: only the caller's own post, must be pending, not suspended, moderation
-- configured, and within the 10-active-post quota (all enforced server-side).
drop policy if exists posts_select on public.posts;
create policy posts_select on public.posts for select using (
  status = 'approved' or user_id = auth.uid() or public.is_moderator()
);

drop policy if exists posts_insert_own on public.posts;
create policy posts_insert_own on public.posts for insert with check (
  user_id = auth.uid()
  and not public.is_suspended()
  and public.moderation_ready()
  and public.active_post_count(auth.uid()) < 10
);

drop policy if exists posts_update_own on public.posts;
create policy posts_update_own on public.posts for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists posts_update_moderator on public.posts;
create policy posts_update_moderator on public.posts for update
  using (public.is_moderator()) with check (public.is_moderator());

drop policy if exists posts_delete_own on public.posts;
create policy posts_delete_own on public.posts for delete
  using (user_id = auth.uid() or public.is_moderator());

-- reports: a user may file a report and read their own; moderators read/update all.
drop policy if exists reports_insert on public.reports;
create policy reports_insert on public.reports for insert with check (
  reporter_id = auth.uid() and not public.is_suspended() and public.moderation_ready()
);

drop policy if exists reports_select on public.reports;
create policy reports_select on public.reports for select using (
  reporter_id = auth.uid() or public.is_moderator()
);

drop policy if exists reports_update_moderator on public.reports;
create policy reports_update_moderator on public.reports for update
  using (public.is_moderator()) with check (public.is_moderator());

-- blocks: private to the blocker.
drop policy if exists blocks_all_own on public.blocks;
create policy blocks_all_own on public.blocks for all
  using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Storage
--   * bucket "community"  — private, files uploaded as <uid>/<postId>.jpg and
--     <uid>/<postId>_thumb.jpg ; readable only by the owner, a moderator, or
--     when an APPROVED post references that exact object path.
--   * bucket "avatars"    — public read (avatars are shown in the feed).
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('community', 'community', false, 6291456, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = 6291456,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = true, file_size_limit = 2097152,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists community_read on storage.objects;
create policy community_read on storage.objects for select using (
  bucket_id = 'community' and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_moderator()
    or exists (
      select 1 from public.posts p
      where p.status = 'approved'
        and (p.image_path = name or p.thumb_path = name)
    )
  )
);

drop policy if exists community_insert_own on storage.objects;
create policy community_insert_own on storage.objects for insert with check (
  bucket_id = 'community'
  and (storage.foldername(name))[1] = auth.uid()::text
  and not public.is_suspended()
  and public.moderation_ready()
  and public.active_post_count(auth.uid()) < 10
);

drop policy if exists community_delete_own on storage.objects;
create policy community_delete_own on storage.objects for delete using (
  bucket_id = 'community'
  and ((storage.foldername(name))[1] = auth.uid()::text or public.is_moderator())
);

drop policy if exists avatars_insert_own on storage.objects;
create policy avatars_insert_own on storage.objects for insert with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
  and not public.is_suspended()
);

drop policy if exists avatars_update_own on storage.objects;
create policy avatars_update_own on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists avatars_delete_own on storage.objects;
create policy avatars_delete_own on storage.objects for delete using (
  bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
);

-- ---------------------------------------------------------------------------
-- Owner-only: grant the first moderator (run manually, replace the username):
--   update public.profiles set role = 'moderator' where username = 'YOUR_NAME';
--   -- (run as the project owner / service role; the API cannot do this)
-- ---------------------------------------------------------------------------
