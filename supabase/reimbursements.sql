-- Reimbursements — tracks money owed back to members for event expenses.
--
-- Rows are ingested from a Google Form response sheet. The form_timestamp
-- column is the unique key that prevents re-importing the same submission.
-- Screenshots are downloaded from Google Drive and stored in the Supabase
-- Storage "media" bucket under reimbursements/.
-- A single person can have multiple entries (different events, different dates).
-- RLS on, no policies — anon key cannot read/write. Access via service role key.
--
-- Run in: Supabase Dashboard -> SQL Editor

create table if not exists public.reimbursements (
  id                    uuid primary key default gen_random_uuid(),
  form_timestamp        timestamptz not null unique,   -- Google Form submission timestamp (dedup key)
  person_name           text not null,
  designation           text not null default '',
  person_email          text not null default '',
  event_name            text not null default '',
  purpose               text not null default '',       -- what the money was spent on
  amount_inr            integer not null default 0,     -- whole rupees; 0 = not yet filled
  screenshot_paths      text not null default '',       -- comma-separated Supabase Storage paths
  expense_date          date,                           -- date expense was incurred
  status                text not null default 'Fetched'
                        check (status in (
                          'Fetched',
                          'Verification_Pending',
                          'Payment_Pending',
                          'Rejected',
                          'Payment_Done',
                          'Acknowledged',
                          'Email_Sent'
                        )),
  created_at            timestamptz not null default now()
);

-- Fast lookup: all reimbursements for a person, newest first.
create index if not exists reimbursements_name_idx
  on public.reimbursements (person_name, expense_date desc);

-- Fast lookup: all reimbursements for an event.
create index if not exists reimbursements_event_idx
  on public.reimbursements (event_name, expense_date desc);

-- Status-based queries (e.g. "show all pending").
create index if not exists reimbursements_status_idx
  on public.reimbursements (status);

alter table public.reimbursements enable row level security;
