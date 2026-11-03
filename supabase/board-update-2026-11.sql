-- Board update (Nov 2026) + close Royal Jashn registration.
-- Run once in the Supabase SQL editor. Avatars are served from apps/web/public/board.
begin;

-- 1) Club Service Director: Nitansh Porwal takes over Rohit's slot (same designation/order).
insert into public.bod (full_name, designation, avatar_url, riy_year, is_current, sort_order,
                        linkedin_url, instagram_url, gmail, description)
select 'Nitansh Porwal', designation, '/board/nitansh-porwal.jpg', riy_year, true, sort_order,
       '', '', '', ''
from public.bod
where is_current and full_name ilike '%rohit%' and designation ilike '%club service%';

-- Rohit moves to the Legacy page under RIY 2026-27.
update public.bod
set is_current = false, riy_year = '2026-27'
where is_current and full_name ilike '%rohit%' and designation ilike '%club service%';

-- 2) New director: Ayush Lunkad, Public Image Director, added at the end of the board.
insert into public.bod (full_name, designation, avatar_url, riy_year, is_current, sort_order,
                        linkedin_url, instagram_url, gmail, description)
select 'Ayush Lunkad', 'Public Image Director', '/board/ayush-lunkad.jpg',
       (select riy_year from public.bod where is_current limit 1), true,
       coalesce((select max(sort_order) from public.bod where is_current), 0) + 1,
       '', '', '', 'Club''s Aura Farmer';

-- 3) Royal Jashn: deactivating the form removes the home-page popup and closes /register.
update public.registration_forms
set is_active = false, updated_at = now()
where is_active and (title ilike '%jashn%' or offer_title ilike '%jashn%');

commit;
