-- The Vault — RSVP responses for the 10th Installation Ceremony (30 Aug 2026).
--
-- The event is over and the RSVP form has been removed from the site: there is
-- no longer a page, a public endpoint or an admin view for this table. The table
-- and its rows are kept deliberately, as a record of who registered.
--
-- Already applied to the live project; kept here as the schema record.
-- Run in: Supabase Dashboard -> SQL Editor
--
-- RLS is fully closed and no policies exist, so the anon key shipped to
-- browsers can neither read nor write this table. Reading the rows now means
-- going through the Supabase dashboard or the service role key.

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

-- One RSVP per email; the form upserted on this key, and stored the address
-- lowercased, so a plain index on the column was enough.
create unique index if not exists installation_rsvps_email_key
  on public.installation_rsvps (email);

create index if not exists installation_rsvps_created_at_idx
  on public.installation_rsvps (created_at desc);

alter table public.installation_rsvps enable row level security;
