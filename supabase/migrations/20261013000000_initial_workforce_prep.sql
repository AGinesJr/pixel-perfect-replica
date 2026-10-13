-- Workforce Prep initial private data schema.
-- Apply this migration in the Supabase SQL Editor or with the Supabase CLI.
-- All rows are private to the authenticated user who owns them.

create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 160),
  resume_text text not null default '' check (char_length(resume_text) <= 15000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.practice_data (
  user_id uuid primary key references auth.users (id) on delete cascade,
  saved_jobs jsonb not null default '[]'::jsonb check (jsonb_typeof(saved_jobs) = 'array'),
  applications jsonb not null default '[]'::jsonb check (jsonb_typeof(applications) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists practice_data_set_updated_at on public.practice_data;
create trigger practice_data_set_updated_at
before update on public.practice_data
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.practice_data enable row level security;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
on public.profiles for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own profile" on public.profiles;
create policy "Users can create their own profile"
on public.profiles for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own profile" on public.profiles;
create policy "Users can delete their own profile"
on public.profiles for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can read their own practice data" on public.practice_data;
create policy "Users can read their own practice data"
on public.practice_data for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own practice data" on public.practice_data;
create policy "Users can create their own practice data"
on public.practice_data for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own practice data" on public.practice_data;
create policy "Users can update their own practice data"
on public.practice_data for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own practice data" on public.practice_data;
create policy "Users can delete their own practice data"
on public.practice_data for delete
to authenticated
using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.practice_data to authenticated;

-- Do not add policies for anon. Never expose a service-role key in browser code.
