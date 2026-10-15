-- Repair profile schemas where contact-detail columns were never created.
-- Idempotent so it is safe to apply to databases with some or all columns present.
alter table public.profiles
  add column if not exists city text not null default '',
  add column if not exists contact_email text not null default '',
  add column if not exists phone text not null default '',
  add column if not exists state text not null default '',
  add column if not exists zip_code text not null default '';

-- Refresh PostgREST's schema cache so the new columns are available to the app.
notify pgrst, 'reload schema';
