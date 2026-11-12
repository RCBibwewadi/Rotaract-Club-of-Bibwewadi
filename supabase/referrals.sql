-- Referrals — member-posted requests for help in the mobile app (/app/referrals).
--
-- A referral belongs to a member and collects "interests" from other members.
-- Interest counts are not denormalised: the feed reads the interest rows
-- alongside each referral and counts them, which is accurate by construction
-- and fine at club scale (a few hundred members).
--
-- The poster's contact details are NOT copied here: they are read from the
-- member's profile when an interest is registered, so a member who changes
-- their number does not leave stale contacts behind.
--
-- RLS on, no policies — anon key cannot read/write. Access via service role key
-- through /api/referrals/*, which authenticates the member's JWT.
--
-- Run in: Supabase Dashboard -> SQL Editor

create table if not exists public.referrals (
  referral_id    uuid primary key default gen_random_uuid(),
  member_id      uuid not null references public.members(member_id) on delete cascade,
  title          text not null,
  description    text not null,
  location       text not null,
  budget         text,
  contact_method text not null default 'phone'
                   check (contact_method in ('email', 'phone', 'whatsapp')),
  status         text not null default 'open' check (status in ('open', 'closed')),
  created_at     timestamptz not null default now()
);

create index if not exists referrals_created_at_idx on public.referrals (created_at desc);
create index if not exists referrals_member_idx on public.referrals (member_id);

-- One interest per member per referral: the primary key enforces it, so a
-- duplicate submission is a conflict rather than a second row.
create table if not exists public.referral_interests (
  referral_id  uuid not null references public.referrals(referral_id) on delete cascade,
  member_id    uuid not null references public.members(member_id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (referral_id, member_id)
);

create index if not exists referral_interests_member_idx
  on public.referral_interests (member_id);

alter table public.referrals enable row level security;
alter table public.referral_interests enable row level security;
