-- Membership interest list — people who reached out while registrations were closed.
--
-- The public /join page no longer registers members: it shows a "we have
-- surpassed our membership limit" notice and collects name, phone and email so
-- the club can reach out if memberships reopen. Those rows land here.
--
-- Run in: Supabase Dashboard -> SQL Editor
--
-- RLS is enabled with no policies, so the anon key shipped to browsers can
-- neither read nor write this table. Writes go through /api/membership-interest
-- using the service role key; reading the rows means the Supabase dashboard.

create table if not exists public.membership_interest (
  interest_id uuid primary key default gen_random_uuid(),
  full_name   text not null,
  phone       text not null,
  email       text not null,
  created_at  timestamptz not null default now()
);

-- One row per person; the API upserts on this key and stores the address
-- lowercased, so a plain unique index on the column is enough.
create unique index if not exists membership_interest_email_key
  on public.membership_interest (email);

create index if not exists membership_interest_created_at_idx
  on public.membership_interest (created_at desc);

alter table public.membership_interest enable row level security;
