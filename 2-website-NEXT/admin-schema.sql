-- ═══════════════════════════════════════════════════════════════
-- Orvel — admin layer.
-- Run AFTER supabase-schema.sql. Purely additive: it does not drop or
-- recreate shift_track_submissions, and it is safe to re-run.
--
-- supabase-schema.sql leaves the table with RLS on and NO policies, so
-- nothing can read it — including you. This file adds the studio
-- read/update path, keyed to an admins table rather than to a
-- password sitting in the codebase.
-- ═══════════════════════════════════════════════════════════════

-- ---------- who counts as studio ----------

create table if not exists public.admins (
  email      text primary key,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- ---------- fulfilment columns ----------
-- The browser never writes these; submit-brief whitelists its columns
-- and none of these are on that list.

alter table public.shift_track_submissions
  add column if not exists status       text not null default 'new',
  add column if not exists delivery_url text,
  add column if not exists studio_notes text,
  add column if not exists delivered_at timestamptz,
  add column if not exists is_test      boolean not null default false;

do $$ begin
  alter table public.shift_track_submissions
    add constraint shift_track_submissions_status_chk
    check (status in ('new','in_production','delivered',
                      'revision_requested','revision_delivered'));
exception when duplicate_object then null; end $$;

create index if not exists idx_stsub_status
  on public.shift_track_submissions (status);
create index if not exists idx_stsub_submitted
  on public.shift_track_submissions (submitted_at desc);

-- ---------- policies ----------

drop policy if exists admin_read_briefs   on public.shift_track_submissions;
drop policy if exists admin_update_briefs on public.shift_track_submissions;
drop policy if exists admin_read_admins   on public.admins;

create policy admin_read_briefs
  on public.shift_track_submissions
  for select to authenticated
  using (public.is_admin());

create policy admin_update_briefs
  on public.shift_track_submissions
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy admin_read_admins
  on public.admins
  for select to authenticated
  using (public.is_admin());

-- Deliberately no INSERT policy for authenticated: briefs arrive only
-- through /api/submit-brief on the service role. Deliberately nothing
-- at all for anon.

-- ---------- grants ----------
-- Supabase adds default grants; stating them makes the anon revoke a
-- decision rather than an assumption.

grant usage on schema public to anon, authenticated, service_role;
grant select, update on public.shift_track_submissions to authenticated;
grant select on public.admins to authenticated;

revoke all on public.shift_track_submissions from anon;
revoke all on public.admins from anon;

-- ---------- your studio account ----------
-- Create the Auth user first (Authentication → Users → Add user),
-- then run this. Being in Auth is not enough; this table is what
-- is_admin() checks.
--
--   insert into public.admins(email) values ('advay2939@gmail.com')
--     on conflict (email) do nothing;
