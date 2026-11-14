-- Ideas — the community feed in the members-only mobile app (/app/ideas).
--
-- A post belongs to a member, carries at most one vote per member (+1/-1) and
-- any number of comments. Vote counts are not denormalised: the feed reads the
-- vote rows alongside each post and tallies them, which is accurate by
-- construction and fine at club scale (a few hundred members).
--
-- RLS on, no policies — anon key cannot read/write. Access via service role key
-- through /api/ideas/*, which authenticates the member's JWT.
--
-- Run in: Supabase Dashboard -> SQL Editor

create table if not exists public.ideas (
  idea_id      uuid primary key default gen_random_uuid(),
  member_id    uuid not null references public.members(member_id) on delete cascade,
  title        text not null,
  description  text not null default '',
  image_url    text,
  tag          text not null default 'General',
  created_at   timestamptz not null default now()
);

create index if not exists ideas_created_at_idx on public.ideas (created_at desc);
create index if not exists ideas_member_idx on public.ideas (member_id);

-- One vote per member per idea: the primary key enforces it, so an upsert on
-- (idea_id, member_id) is the only write path needed.
create table if not exists public.idea_votes (
  idea_id      uuid not null references public.ideas(idea_id) on delete cascade,
  member_id    uuid not null references public.members(member_id) on delete cascade,
  value        smallint not null check (value in (-1, 1)),
  created_at   timestamptz not null default now(),
  primary key (idea_id, member_id)
);

create table if not exists public.idea_comments (
  comment_id   uuid primary key default gen_random_uuid(),
  idea_id      uuid not null references public.ideas(idea_id) on delete cascade,
  member_id    uuid not null references public.members(member_id) on delete cascade,
  body         text not null,
  created_at   timestamptz not null default now()
);

create index if not exists idea_comments_idea_idx
  on public.idea_comments (idea_id, created_at);

alter table public.ideas enable row level security;
alter table public.idea_votes enable row level security;
alter table public.idea_comments enable row level security;
