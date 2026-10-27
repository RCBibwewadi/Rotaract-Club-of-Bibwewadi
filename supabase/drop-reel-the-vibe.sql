-- Remove all Reel the Vibe data. The feature's code has been deleted.
--
-- !! IRREVERSIBLE !! Deploy the code removal first, then run this.
-- Run in: Supabase Dashboard -> SQL Editor

drop table if exists public.reel_the_vibe_votes;
drop table if exists public.reel_the_vibe_teams;
drop table if exists public.reel_the_vibe;
drop table if exists public.reel_config;

-- Registration photos uploaded to the media bucket under reel-the-vibe/.
-- Supabase blocks direct deletes on storage.objects; remove the folder via
-- Dashboard -> Storage -> media -> reel-the-vibe instead.
