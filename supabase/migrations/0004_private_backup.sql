-- ============================================================================
-- GymQuest — migration 0004: private per-user cloud backup
-- ----------------------------------------------------------------------------
-- Additive. Safe to run once after 0003. Never re-run an applied migration.
--
-- Creates:
--   * public.backups          — one row per user: the whole app state (minus
--                               live session fields) as jsonb + a media manifest.
--   * public.backup_versions  — bounded version history (newest 5 kept).
--   * public.save_backup()    — atomic write with optimistic-concurrency
--                               (revision) conflict detection.
--   * private Storage bucket 'backups' with OWNER-ONLY policies.
--
-- SECURITY: everything here is owner-only. There is deliberately NO
-- is_moderator() term anywhere — moderators must never read a user's private
-- plans, measurements, photos or backups. The frontend uses only the
-- publishable (anon) key; the service_role key is used only by the
-- delete-account Edge Function.
-- ============================================================================

-- 1. Current backup (one row per authenticated user) ------------------------
create table if not exists public.backups (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  revision       bigint not null default 0,
  schema_version integer not null,
  payload        jsonb not null,
  bytes          integer not null default 0,
  device_id      text,
  app_version    text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- 2. Bounded version history ------------------------------------------------
create table if not exists public.backup_versions (
  id             bigserial primary key,
  user_id        uuid not null references auth.users(id) on delete cascade,
  revision       bigint not null,
  schema_version integer not null,
  payload        jsonb not null,
  created_at     timestamptz not null default now()
);
create index if not exists backup_versions_user_idx
  on public.backup_versions (user_id, revision desc);

-- 3. Retention: keep only the newest 5 versions per user --------------------
create or replace function public.prune_backup_versions()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from public.backup_versions v
  where v.user_id = new.user_id
    and v.id not in (
      select bv.id from public.backup_versions bv
      where bv.user_id = new.user_id
      order by bv.revision desc, bv.id desc
      limit 5
    );
  return null;
end $$;
drop trigger if exists backup_versions_prune on public.backup_versions;
create trigger backup_versions_prune
  after insert on public.backup_versions
  for each row execute function public.prune_backup_versions();

-- 4. Row Level Security: owner-only (NO is_moderator anywhere) --------------
alter table public.backups enable row level security;
alter table public.backup_versions enable row level security;

drop policy if exists backups_select_own on public.backups;
create policy backups_select_own on public.backups for select
  using (user_id = auth.uid());
drop policy if exists backups_insert_own on public.backups;
create policy backups_insert_own on public.backups for insert
  with check (user_id = auth.uid());
drop policy if exists backups_update_own on public.backups;
create policy backups_update_own on public.backups for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists backups_delete_own on public.backups;
create policy backups_delete_own on public.backups for delete
  using (user_id = auth.uid());

drop policy if exists backup_versions_select_own on public.backup_versions;
create policy backup_versions_select_own on public.backup_versions for select
  using (user_id = auth.uid());
drop policy if exists backup_versions_insert_own on public.backup_versions;
create policy backup_versions_insert_own on public.backup_versions for insert
  with check (user_id = auth.uid());
drop policy if exists backup_versions_delete_own on public.backup_versions;
create policy backup_versions_delete_own on public.backup_versions for delete
  using (user_id = auth.uid());

-- 5. Explicit API privileges (RLS still decides rows) -----------------------
-- Required because "Automatically expose new tables" is OFF (see 0002).
grant select, insert, update, delete on public.backups to authenticated;
grant select, insert, delete on public.backup_versions to authenticated;
grant usage, select on sequence public.backup_versions_id_seq to authenticated;

-- 6. Atomic save with optimistic concurrency --------------------------------
-- Returns the row's authoritative revision and whether the write CONFLICTED.
-- A stale caller (p_base_revision < current) is never allowed to overwrite:
-- it gets conflict = true and the current revision, so the client can ask the
-- user instead of clobbering newer data from another device.
create or replace function public.save_backup(
  p_payload jsonb,
  p_schema integer,
  p_base_revision bigint,
  p_device text,
  p_app_version text
) returns table (revision bigint, conflict boolean)
language plpgsql security invoker set search_path = public as $$
declare
  uid uuid := auth.uid();
  cur bigint;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  select b.revision into cur from public.backups b where b.user_id = uid for update;

  if cur is null then
    insert into public.backups
      (user_id, revision, schema_version, payload, bytes, device_id, app_version, updated_at)
    values
      (uid, 1, p_schema, p_payload, length(p_payload::text), p_device, p_app_version, now());
    insert into public.backup_versions (user_id, revision, schema_version, payload)
      values (uid, 1, p_schema, p_payload);
    return query select 1::bigint, false;
    return;
  end if;

  if cur = p_base_revision then
    update public.backups b
      set revision = cur + 1,
          schema_version = p_schema,
          payload = p_payload,
          bytes = length(p_payload::text),
          device_id = p_device,
          app_version = p_app_version,
          updated_at = now()
      where b.user_id = uid;
    insert into public.backup_versions (user_id, revision, schema_version, payload)
      values (uid, cur + 1, p_schema, p_payload);
    return query select (cur + 1)::bigint, false;
  else
    return query select cur, true;
  end if;
end $$;
grant execute on function public.save_backup(jsonb, integer, bigint, text, text) to authenticated;

-- 7. Private Storage bucket 'backups' — owner-only, moderator-inaccessible ---
insert into storage.buckets (id, name, public, file_size_limit)
values ('backups', 'backups', false, 52428800)   -- 50 MB per file (Free-plan default)
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit;

drop policy if exists backups_read on storage.objects;
create policy backups_read on storage.objects for select
  using (bucket_id = 'backups' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists backups_insert on storage.objects;
create policy backups_insert on storage.objects for insert
  with check (bucket_id = 'backups' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists backups_update on storage.objects;
create policy backups_update on storage.objects for update
  using (bucket_id = 'backups' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'backups' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists backups_delete on storage.objects;
create policy backups_delete on storage.objects for delete
  using (bucket_id = 'backups' and (storage.foldername(name))[1] = auth.uid()::text);
