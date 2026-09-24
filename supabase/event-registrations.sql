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
  payment_screenshot_path  text not null,              -- storage object path, not a public URL
  screenshot_sha256        text not null,              -- so the same proof can't be submitted twice
  amount_inr               integer not null default 149,
  payment_verified         boolean not null default false,
  created_at               timestamptz not null default now()
);

create index if not exists event_registrations_slug_created_idx
  on public.event_registrations (event_slug, created_at desc);

-- One registration per payment screenshot, so the same proof cannot be
-- submitted twice. There is no transaction-id field: the form asks only what
-- the club's Google Form asked, and the screenshot is the proof.
create unique index if not exists event_reg_unique_screenshot
  on public.event_registrations (event_slug, screenshot_sha256);

alter table public.event_registrations enable row level security;
