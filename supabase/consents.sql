-- Consent — DPDP record of what each member agreed to (/app consent gate).
--
-- The table is append-only: every acceptance, change and withdrawal inserts a
-- row, and the newest row per member is the member's current position. That
-- gives the auditable history the law expects without a second history table,
-- and a withdrawal can never silently overwrite the acceptance it replaces.
--
-- personal_data_consent is required to use the app. ai_training_consent is
-- optional and defaults to false: a member with no row at all has given no
-- training permission, which is the same as declining.
--
-- RLS on, no policies — anon key cannot read/write. Access via service role key
-- through /api/consent, which authenticates the member's JWT.
--
-- Run in: Supabase Dashboard -> SQL Editor

create table if not exists public.member_consents (
  consent_id            uuid primary key default gen_random_uuid(),
  member_id             uuid not null references public.members(member_id) on delete cascade,
  personal_data_consent boolean not null,
  ai_training_consent   boolean not null default false,
  consent_version       text not null,
  -- When the member made this decision, and when the row was written. They
  -- match on insert; the pair is kept because a correction to a historical
  -- record must stay distinguishable from the moment of consent itself.
  accepted_at           timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- The gate reads the newest row per member on every cold start.
create index if not exists member_consents_member_idx
  on public.member_consents (member_id, accepted_at desc, consent_id desc);

alter table public.member_consents enable row level security;

-- The only rows a future training pipeline may use.
--
-- A member appears here when their LATEST decision says yes to training and
-- they still hold the required personal-data consent. Members who declined,
-- never answered, or withdrew are absent by construction, so the pipeline must
-- join ideas/conversations against this view rather than reading a table whole.
-- security_invoker keeps the view under the caller's RLS: the anon key sees
-- nothing through it either.
create or replace view public.ai_training_eligible_members
with (security_invoker = on) as
select member_id, consent_version, accepted_at
from (
  select distinct on (member_id) *
  from public.member_consents
  order by member_id, accepted_at desc, consent_id desc
) latest
where personal_data_consent and ai_training_consent;
