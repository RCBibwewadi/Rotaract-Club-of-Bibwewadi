-- Announcements — club notices shown on the Announcements tab of the mobile
-- app (/app/announcements). Written by admins, read by approved members.
--
-- RLS on, no policies — anon key cannot read/write. Access via service role key
-- through /api/announcements, which authenticates the member's JWT for reads
-- and the admin token for writes.
--
-- Run in: Supabase Dashboard -> SQL Editor

create table if not exists public.announcements (
  announcement_id  uuid primary key default gen_random_uuid(),
  title            text not null,
  body             text not null default '',
  image_url        text,
  posted_by        uuid references public.members(member_id) on delete set null,
  created_at       timestamptz not null default now()
);

create index if not exists announcements_created_at_idx
  on public.announcements (created_at desc);

alter table public.announcements enable row level security;
