-- ═══════════════════════════════════════════════════════════════
-- Orvel — lock the brief table at the data layer.
-- Run this in Supabase → SQL Editor.
--
-- The publishable key is visible in the browser, so the table must
-- refuse anon writes outright. Only /api/submit-brief writes, using
-- the service role key, which bypasses RLS by design.
-- ═══════════════════════════════════════════════════════════════

alter table public.shift_track_submissions enable row level security;

-- Drop any permissive policy left over from the anon-insert version.
drop policy if exists "anon can insert"        on public.shift_track_submissions;
drop policy if exists "public insert"          on public.shift_track_submissions;
drop policy if exists "Enable insert for all"  on public.shift_track_submissions;

-- No policy is created for anon or authenticated. With RLS on and no
-- policy, every request carrying the publishable key is denied. The
-- service role is unaffected.

-- Columns the server sets and the browser must never supply.
alter table public.shift_track_submissions
  add column if not exists order_ref    text,
  add column if not exists amount_cents integer;

create index if not exists idx_stsub_payment_ref
  on public.shift_track_submissions (payment_ref);

-- One brief per payment. Blocks replay of a single valid token.
create unique index if not exists uq_stsub_payment_ref
  on public.shift_track_submissions (payment_ref)
  where payment_ref is not null;

-- ── Analytics table stays anon-insertable (write-only, no reads) ──
alter table public.analytics_events enable row level security;

drop policy if exists "anon insert events" on public.analytics_events;
create policy "anon insert events"
  on public.analytics_events
  for insert to anon
  with check (true);
-- deliberately no SELECT policy: the browser can write events, never read them.
