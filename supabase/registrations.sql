-- Generic event registrations: admin-configured forms, the home page offer
-- card that advertises the active form, and the submissions people make on
-- /register.
--
-- Run in: Supabase Dashboard -> SQL Editor
--
-- RLS is enabled with no policies (same as every other table, see
-- rls-lockdown.sql): the anon key can neither read nor write. All access goes
-- through the API routes with the service role key, which decide what each
-- caller may see.

create table if not exists public.registration_forms (
  form_id                  uuid primary key default gen_random_uuid(),
  title                    text not null,
  description              text not null default '',
  offer_title              text not null,
  offer_description        text not null default '',
  image_url                text,                 -- public URL in the media bucket
  video_url                text,                 -- public URL in the media bucket
  payment_enabled          boolean not null default false,
  payment_amount           numeric(10,2) check (payment_amount is null or payment_amount > 0),
  -- optional "was" price, shown struck through on the offer card
  payment_original_amount  numeric(10,2) check (payment_original_amount is null or payment_original_amount > 0),
  payment_qr_url           text,                 -- public URL in the media bucket
  auth_required            boolean not null default false,
  -- [{ id, label, type, required, options? }]; type is one of
  -- text | email | phone | number | dropdown | checkbox | textarea
  questions                jsonb not null default '[]'::jsonb,
  is_active                boolean not null default false,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

-- At most one active form.
create unique index if not exists registration_forms_one_active
  on public.registration_forms ((true)) where is_active;

alter table public.registration_forms enable row level security;

create table if not exists public.registrations (
  registration_id     uuid primary key default gen_random_uuid(),
  -- restrict: a form with submissions cannot be deleted, only deactivated,
  -- so historical counts are never lost.
  form_id             uuid not null references public.registration_forms(form_id) on delete restrict,
  member_id           uuid references public.members(member_id) on delete set null,
  -- Email is the one fixed (required) field. Name and phone are taken from the
  -- admin's questions (phone by type, name by label) or the member's profile.
  full_name           text,
  email               text not null,        -- stored lowercased
  phone               text,
  -- [{ question_id, label, type, value }]; label/type are snapshotted so
  -- later edits to the form's questions do not change past answers.
  answers             jsonb not null default '[]'::jsonb,
  payment_proof_path  text,                 -- path in the private registration-proofs bucket
  payment_status      text not null default 'not_required'
                      check (payment_status in ('not_required', 'submitted', 'verified')),
  status              text not null default 'pending'
                      check (status in ('pending', 'approved', 'rejected')),
  approved_at         timestamptz,
  created_at          timestamptz not null default now()
);

-- One registration per person per form (by email, and per member).
create unique index if not exists registrations_form_email_key
  on public.registrations (form_id, email);
create unique index if not exists registrations_form_member_key
  on public.registrations (form_id, member_id) where member_id is not null;

-- Already ran an earlier version of this file? These make it match.
alter table public.registrations alter column full_name drop not null;
alter table public.registrations alter column phone drop not null;
alter table public.registrations drop column if exists email_status;
alter table public.registrations drop column if exists email_id;
alter table public.registrations drop column if exists email_error;
-- Fails if any existing row has no email: delete or fix those rows first.
alter table public.registrations alter column email set not null;

create index if not exists registrations_form_created_idx
  on public.registrations (form_id, created_at desc);

alter table public.registrations enable row level security;

-- Activating a form deactivates every other one in the same transaction.
create or replace function public.activate_registration_form(p_form_id uuid)
returns void
language plpgsql
as $$
begin
  if not exists (select 1 from public.registration_forms where form_id = p_form_id) then
    raise exception 'form not found';
  end if;
  update public.registration_forms
     set is_active = false, updated_at = now()
   where is_active and form_id <> p_form_id;
  update public.registration_forms
     set is_active = true, updated_at = now()
   where form_id = p_form_id;
end;
$$;

-- Only the service role may call it.
revoke all on function public.activate_registration_form(uuid) from public, anon, authenticated;

-- Private bucket for payment screenshots. No storage policies: only the
-- service role can read/write; admins see them through short-lived signed URLs.
insert into storage.buckets (id, name, public)
values ('registration-proofs', 'registration-proofs', false)
on conflict (id) do nothing;
