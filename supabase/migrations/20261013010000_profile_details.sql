-- Add optional career-profile details to existing Workforce Prep accounts.
-- Existing rows are preserved; new fields receive empty defaults.

alter table public.profiles
  add column if not exists contact_email text not null default '' check (char_length(contact_email) <= 254),
  add column if not exists phone text not null default '' check (char_length(phone) <= 40),
  add column if not exists city text not null default '' check (char_length(city) <= 100),
  add column if not exists state text not null default '' check (char_length(state) <= 2),
  add column if not exists zip_code text not null default '' check (char_length(zip_code) <= 10),
  add column if not exists avatar_data_url text not null default '' check (char_length(avatar_data_url) <= 400000);

-- The existing profiles RLS policies remain in force; no public access is added.
