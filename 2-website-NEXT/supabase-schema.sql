-- ═══════════════════════════════════════════════════════════════
-- Orvel — database schema and security.
--
-- Safe to run more than once: every statement is guarded, so this
-- doubles as the migration file. Re-run it after any change here.
--
-- Supabase -> SQL Editor -> paste -> Run.
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Orders ────────────────────────────────────────────────
-- Written by the Razorpay webhook, never by the browser.
create table if not exists public.orders (
  id             bigserial primary key,
  order_ref      text unique,
  payment_ref    text unique not null,
  package_id     text not null,
  amount_cents   integer,
  currency       text,
  email          text,
  full_name      text,
  status         text not null default 'paid',
  brief_received boolean not null default false,
  paid_at        timestamptz default now(),
  brief_at       timestamptz,
  created_at     timestamptz default now()
);

create index if not exists idx_orders_followup
  on public.orders (status, brief_received, paid_at);

-- ── 2. Email log ─────────────────────────────────────────────
-- The de-duplication guard. The unique index is what makes
-- "send exactly once" true even when Razorpay retries a webhook.
create table if not exists public.email_log (
  id      bigserial primary key,
  kind    text not null,
  ref     text not null,
  sent_at timestamptz not null default now()
);

create unique index if not exists uq_email_log_kind_ref
  on public.email_log (kind, ref);

-- ── 3. Brief submissions ─────────────────────────────────────
-- Written ONLY by /api/submit-brief using the service role, and
-- only after a payment token has been verified.
create table if not exists public.shift_track_submissions (
  id                 bigserial primary key,
  full_name          text,
  email              text,
  phone_number       text,
  country            text,
  shift_pattern      text,
  playback           text,
  wake_sensitivity   text,
  masking_targets    text[] default '{}',
  sound_families     text[] default '{}',
  aversions          text[] default '{}',
  texture            text,
  tone               text,
  depth              text,
  character          text,
  calm_place         text,
  system_name        text,
  answers_json       jsonb  default '{}'::jsonb,
  production_brief   jsonb  default '{}'::jsonb,
  subscribed_refresh boolean not null default false,
  package_id         text,
  payment_ref        text,
  order_ref          text,
  amount_cents       integer,
  submitted_at       timestamptz default now(),
  created_at         timestamptz default now()
);

-- Kept for databases created before these columns existed.
alter table public.shift_track_submissions
  add column if not exists order_ref    text,
  add column if not exists amount_cents integer;

create index if not exists idx_stsub_payment_ref
  on public.shift_track_submissions (payment_ref);

-- One brief per payment. Blocks replay of a single valid token.
create unique index if not exists uq_stsub_payment_ref
  on public.shift_track_submissions (payment_ref)
  where payment_ref is not null;

-- ── 4. Row level security ────────────────────────────────────
-- The publishable key is visible in browser JS, so these tables
-- must refuse anon access outright. RLS on with NO policy = deny
-- everything. The service role bypasses RLS by design, so the
-- serverless functions still work.

alter table public.orders                    enable row level security;
alter table public.email_log                 enable row level security;
alter table public.shift_track_submissions   enable row level security;

drop policy if exists "anon can insert"       on public.shift_track_submissions;
drop policy if exists "public insert"         on public.shift_track_submissions;
drop policy if exists "Enable insert for all" on public.shift_track_submissions;

-- ── 5. Analytics ─────────────────────────────────────────────
-- Write-only from the browser: events can be added, never read back.
create table if not exists public.analytics_events (
  id         bigserial primary key,
  event      text,
  properties jsonb default '{}'::jsonb,
  timestamp  timestamptz default now()
);

alter table public.analytics_events enable row level security;

drop policy if exists "anon insert events" on public.analytics_events;
create policy "anon insert events"
  on public.analytics_events
  for insert to anon
  with check (true);

-- ── 6. Studio view ───────────────────────────────────────────
-- What to work on, oldest first. Query this in the admin console.
create or replace view public.studio_queue as
select o.payment_ref,
       o.package_id,
       o.full_name,
       o.email,
       o.paid_at,
       o.brief_received,
       s.submitted_at,
       s.shift_pattern,
       s.playback,
       extract(epoch from (now() - s.submitted_at)) / 3600 as hours_since_brief
from public.orders o
left join public.shift_track_submissions s
       on s.payment_ref = o.payment_ref
where o.status = 'paid'
order by s.submitted_at asc nulls last;
