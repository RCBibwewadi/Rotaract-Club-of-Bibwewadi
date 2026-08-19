-- The Vault — RSVP responses for the 10th Installation Ceremony (30 Aug).
--
-- Run in: Supabase Dashboard -> SQL Editor
--
-- Writes come from POST /api/rsvp and reads from GET /api/admin/rsvps, both of
-- which use the service role key (bypasses RLS), so RLS stays fully closed —
-- the anon key shipped to browsers can neither read nor write this table.

create table if not exists public.installation_rsvps (
  rsvp_id       uuid primary key default gen_random_uuid(),
  full_name     text not null,
  is_rotaractor boolean not null,
  club_name     text not null,
  designation   text not null default 'Member',
  phone         text not null,
  email         text not null,
  created_at    timestamptz not null default now()
);

-- One RSVP per email; a re-submit updates the existing row (see POST /api/rsvp,
-- which lowercases the address before writing so this plain index is enough).
create unique index if not exists installation_rsvps_email_key
  on public.installation_rsvps (email);

create index if not exists installation_rsvps_created_at_idx
  on public.installation_rsvps (created_at desc);

alter table public.installation_rsvps enable row level security;
