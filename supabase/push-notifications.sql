-- Push notifications and "what's new" badges for the members' app.
--
-- push_subscriptions holds one row per browser a member has granted
-- notification permission in (a member may install the PWA on a phone and a
-- laptop). The endpoint is the primary key because that is what the push
-- service hands us, and what a 404/410 from it identifies when the
-- subscription dies — /api/notifications/subscribe deletes it by endpoint.
--
-- tab_reads is the read-watermark behind the little numbers on the tab bar:
-- one row per member per tab, holding the moment they last looked at it.
-- Unread counts are derived from it, so nothing has to be written when
-- content is posted — only when a member opens a tab.
--
-- RLS on, no policies — anon key cannot read/write. Access via service role key
-- through /api/notifications/*, which authenticates the member's JWT.
--
-- Run in: Supabase Dashboard -> SQL Editor

create table if not exists public.push_subscriptions (
  endpoint    text primary key,
  member_id   uuid not null references public.members(member_id) on delete cascade,
  p256dh      text not null,
  auth        text not null,
  created_at  timestamptz not null default now()
);

create index if not exists push_subscriptions_member_idx
  on public.push_subscriptions (member_id);

create table if not exists public.tab_reads (
  member_id     uuid not null references public.members(member_id) on delete cascade,
  -- 'ideas' | 'schedule' | 'announcements' | 'referrals'
  tab           text not null,
  last_seen_at  timestamptz not null default now(),
  primary key (member_id, tab)
);

alter table public.push_subscriptions enable row level security;
alter table public.tab_reads enable row level security;
