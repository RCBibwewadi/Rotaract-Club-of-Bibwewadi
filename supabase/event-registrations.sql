-- Per-event registrations for the members' app (/app/schedule).
--
-- The event's category is NOT a new column: events.event_avenue already holds
-- exactly the four Rotaract avenues the app offers, so the admin screen writes
-- that field and the app badges and filters on it.
--
-- Capacity is events.event_strength when it is set: the registration endpoint
-- refuses a member once that many have signed up.
--
-- RLS on, no policies — anon key cannot read/write. Access via service role key
-- through /api/events/*, which authenticates the member's JWT.
--
-- Run in: Supabase Dashboard -> SQL Editor

alter table public.events
  add column if not exists registration_enabled boolean not null default false;

-- One registration per member per event: the primary key enforces it, so a
-- second tap is a conflict rather than a duplicate row.
create table if not exists public.event_registrations (
  event_id    uuid not null references public.events(event_id) on delete cascade,
  member_id   uuid not null references public.members(member_id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (event_id, member_id)
);

create index if not exists event_registrations_member_idx
  on public.event_registrations (member_id);

alter table public.event_registrations enable row level security;
