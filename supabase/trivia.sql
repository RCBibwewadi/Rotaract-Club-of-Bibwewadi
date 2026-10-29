-- Trivia Proto: question bank for the projector trivia at /trivia.
-- Run once in the Supabase SQL Editor. RLS on, no policies: the API reads and
-- writes with the service role, same as every other table (see rls-lockdown.sql).

create table if not exists trivia_questions (
  id           uuid primary key default gen_random_uuid(),
  phase        text not null check (phase in ('quick', 'image', 'video', 'song')),
  position     int  not null default 0,
  prompt       text not null,
  media_url    text,
  media_start  int,
  media_end    int,
  options      jsonb not null,
  answer_index int  not null check (answer_index between 0 and 3),
  points       int  not null default 10,
  created_at   timestamptz not null default now()
);

create index if not exists trivia_questions_phase_position on trivia_questions (phase, position);

alter table trivia_questions enable row level security;

-- Starter set (5 per phase). Only seeds an empty table, so re-running is safe.
insert into trivia_questions (phase, position, prompt, media_url, media_start, media_end, options, answer_index)
select * from (values
  ('quick', 0, 'Which film features the dialogue "Mogambo khush hua"?', null, null, null, '["Mr. India","Sholay","Karma","Tezaab"]'::jsonb, 0),
  ('quick', 1, 'Who directed "Dilwale Dulhania Le Jayenge"?', null, null, null, '["Karan Johar","Yash Chopra","Aditya Chopra","Sooraj Barjatya"]'::jsonb, 2),
  ('quick', 2, 'In "Sholay", what is the name of Basanti''s horse?', null, null, null, '["Dhanno","Rani","Bijli","Chandni"]'::jsonb, 0),
  ('quick', 3, 'Which was India''s official Oscar entry that got nominated in 2002?', null, null, null, '["Devdas","Lagaan","Dil Chahta Hai","Rang De Basanti"]'::jsonb, 1),
  ('quick', 4, 'Which actor is known as the "Shahenshah" of Bollywood?', null, null, null, '["Dilip Kumar","Rajesh Khanna","Amitabh Bachchan","Dharmendra"]'::jsonb, 2),

  ('image', 0, 'Name the film from this frame', 'https://img.youtube.com/vi/BddP6PYo2gs/hq2.jpg', null, null, '["Brahmastra","Rockstar","Barfi!","Gully Boy"]'::jsonb, 0),
  ('image', 1, 'Name the film from this frame', 'https://img.youtube.com/vi/hoNb6HuNmU0/hq2.jpg', null, null, '["Kedarnath","Chhichhore","MS Dhoni","Kai Po Che!"]'::jsonb, 1),
  ('image', 2, 'Name the film from this frame', 'https://img.youtube.com/vi/xRb8hxwN5zc/hq2.jpg', null, null, '["Yeh Jawaani Hai Deewani","Bachna Ae Haseeno","Tamasha","Piku"]'::jsonb, 2),
  ('image', 3, 'Name the film from this frame', 'https://img.youtube.com/vi/Umqb9KENgmk/hq2.jpg', null, null, '["Half Girlfriend","Aashiqui 2","Ek Villain","OK Jaanu"]'::jsonb, 1),
  ('image', 4, 'Name the film from this frame', 'https://img.youtube.com/vi/II2EO3Nw4m0/hq2.jpg', null, null, '["Ae Dil Hai Mushkil","Tamasha","Yeh Jawaani Hai Deewani","Wake Up Sid"]'::jsonb, 2),

  ('video', 0, 'Which film is this scene from?', 'https://www.youtube.com/watch?v=udra3Mfw2oo', 40, 55, '["Tanu Weds Manu","Queen","Fashion","Simran"]'::jsonb, 1),
  ('video', 1, 'Which film is this scene from?', 'https://www.youtube.com/watch?v=jCEdTq3j-0U', 60, 75, '["Zindagi Na Milegi Dobara","Dil Dhadakne Do","Kapoor & Sons","Baar Baar Dekho"]'::jsonb, 1),
  ('video', 2, 'Who is the lead actor in this clip?', 'https://www.youtube.com/watch?v=qFkNATtc3mc', 30, 45, '["Tiger Shroff","Ranveer Singh","Hrithik Roshan","Varun Dhawan"]'::jsonb, 2),
  ('video', 3, 'Which film is this scene from?', 'https://www.youtube.com/watch?v=k4yXQkG2s1E', 50, 65, '["Bang Bang","Baar Baar Dekho","Zero","Fitoor"]'::jsonb, 1),
  ('video', 4, 'Who is the actress in this clip?', 'https://www.youtube.com/watch?v=II2EO3Nw4m0', 30, 45, '["Katrina Kaif","Anushka Sharma","Deepika Padukone","Sonam Kapoor"]'::jsonb, 2),

  ('song', 0, 'Guess the song!', 'https://www.youtube.com/watch?v=Umqb9KENgmk', 60, 75, '["Sun Raha Hai","Tum Hi Ho","Channa Mereya","Hawayein"]'::jsonb, 1),
  ('song', 1, 'Guess the song!', 'https://www.youtube.com/watch?v=BddP6PYo2gs', 45, 60, '["Raataan Lambiyan","Kesariya","Apna Bana Le","Tum Kya Mile"]'::jsonb, 1),
  ('song', 2, 'Guess the song!', 'https://www.youtube.com/watch?v=hoNb6HuNmU0', 40, 55, '["Khairiyat","Kabira","Tera Yaar Hoon Main","Phir Le Aaya Dil"]'::jsonb, 0),
  ('song', 3, 'Guess the song!', 'https://www.youtube.com/watch?v=xRb8hxwN5zc', 50, 65, '["Matargashti","Agar Tum Saath Ho","Ilahi","Kabira"]'::jsonb, 1),
  ('song', 4, 'Guess the song!', 'https://www.youtube.com/watch?v=jCEdTq3j-0U', 30, 45, '["London Thumakda","Gallan Goodiyaan","Kar Gayi Chull","Nachde Ne Saare"]'::jsonb, 1)
) as seed
where not exists (select 1 from trivia_questions);
