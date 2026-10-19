-- Ensure profile photo sync works even if the earlier profile-details migration
-- was applied before avatar support was added to it.
alter table public.profiles
  add column if not exists avatar_data_url text not null default ''
  check (char_length(avatar_data_url) <= 400000);

-- Ask PostgREST to refresh its cached schema so the new column is visible immediately.
notify pgrst, 'reload schema';
