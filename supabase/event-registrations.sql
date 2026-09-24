-- Ae Haalo 4.0 — Garba Workshop (26 Sep 2026) registrations.
--
-- Follows the same shape as installation_rsvps: RLS on, no policies, so the
-- anon key shipped to browsers can neither read nor write. Everything goes
-- through the server with the service role key.
--
-- Run in: Supabase Dashboard -> SQL Editor

create table if not exists public.event_registrations (
  id                       uuid primary key default gen_random_uuid(),
  event_slug               text not null,              -- 'garba-workshop-2026'
  full_name                text not null,
  phone                    text not null,              -- normalised to 10 digits
  reference                text,                       -- optional: who sent them
  upi_txn_id               text not null,
  payment_screenshot_path  text not null,              -- storage object path, not a public URL
  amount_inr               integer not null default 149,
  payment_verified         boolean not null default false,
  created_at               timestamptz not null default now()
);

create index if not exists event_registrations_slug_created_idx
  on public.event_registrations (event_slug, created_at desc);

-- One registration per transaction id, so a screenshot can't be reused.
create unique index if not exists event_reg_unique_txn
  on public.event_registrations (event_slug, upi_txn_id);

alter table public.event_registrations enable row level security;
