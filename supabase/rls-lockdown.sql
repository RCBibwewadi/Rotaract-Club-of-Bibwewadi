-- RLS lockdown: deny all database access to the public anon key.
--
-- The website's API routes use the service role key (SUPABASE_SERVICE_ROLE_KEY),
-- which bypasses RLS, so the site keeps working. The anon key shipped to
-- browsers (NEXT_PUBLIC_SUPABASE_PUBLIC_KEY) will no longer be able to read
-- or write anything directly.
--
-- !! ORDER MATTERS !!
-- Run this ONLY AFTER:
--   1. SUPABASE_SERVICE_ROLE_KEY is set in Vercel env vars (and .env.local)
--   2. The code change in apps/web/app/api/lib/supabase.ts is deployed
-- Otherwise the live site will lose database access.
--
-- Run in: Supabase Dashboard -> SQL Editor

-- 1. Enable RLS on every table in the public schema.
--    With RLS enabled and no policies, anon/authenticated roles are denied.
do $$
declare r record;
begin
  for r in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', r.tablename);
  end loop;
end $$;

-- 2. Drop any existing (permissive) policies on public tables.
do $$
declare p record;
begin
  for p in select tablename, policyname from pg_policies where schemaname = 'public' loop
    execute format('drop policy %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;

-- 3. Lock down storage uploads: drop user-created policies on storage.objects.
--    Uploads go through the API routes with the service role key (bypasses RLS);
--    public buckets still serve files via their public URLs.
do $$
declare p record;
begin
  for p in select policyname from pg_policies where schemaname = 'storage' and tablename = 'objects' loop
    execute format('drop policy %I on storage.objects', p.policyname);
  end loop;
end $$;

-- 4. Verify: both queries should return zero rows.
select tablename from pg_tables
where schemaname = 'public'
  and rowsecurity = false;

select schemaname, tablename, policyname from pg_policies
where schemaname in ('public', 'storage');
