create table if not exists public.practice_jobs (
 id text primary key,title text not null check(char_length(title) between 2 and 180),
 employer text not null check(char_length(employer) between 2 and 180),industry text not null,
 location text not null,country_code char(2) not null default 'US' check(country_code='US'),
 workplace_type text not null check(workplace_type in ('Remote','Hybrid','On-site')),
 employment_type text not null check(employment_type in ('Full-time','Part-time','Contract','Temporary','Internship','Apprenticeship')),
 experience_level text not null check(experience_level in ('Entry','Junior','Mid','Senior','Lead','Manager','Director','Executive')),
 salary_min integer not null check(salary_min>=0),salary_max integer not null check(salary_max>=salary_min),
 posted_label text not null default 'Sample posting',summary text not null,
 responsibilities text[] not null default '{}',required_qualifications text[] not null default '{}',
 preferred_qualifications text[] not null default '{}',difficulty smallint not null check(difficulty between 1 and 5),
 source_type text not null default 'simulated' check(source_type='simulated'),is_active boolean not null default true,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create index if not exists practice_jobs_active_industry_level_idx on public.practice_jobs(is_active,industry,experience_level);
create index if not exists practice_jobs_active_location_idx on public.practice_jobs(is_active,location);
create index if not exists practice_jobs_active_salary_idx on public.practice_jobs(is_active,salary_min,salary_max);
create index if not exists practice_jobs_search_idx on public.practice_jobs using gin(to_tsvector('english',coalesce(title,'')||' '||coalesce(employer,'')||' '||coalesce(industry,'')||' '||coalesce(summary,'')||' '||coalesce(array_to_string(required_qualifications,' '),'')||' '||coalesce(array_to_string(preferred_qualifications,' '),'')));
create or replace function public.set_practice_jobs_updated_at() returns trigger language plpgsql set search_path='' as $$ begin new.updated_at=now();return new;end;$$;
drop trigger if exists practice_jobs_set_updated_at on public.practice_jobs;
create trigger practice_jobs_set_updated_at before update on public.practice_jobs for each row execute function public.set_practice_jobs_updated_at();
alter table public.practice_jobs enable row level security;
drop policy if exists "Anyone can read active simulated practice jobs" on public.practice_jobs;
create policy "Anyone can read active simulated practice jobs" on public.practice_jobs for select to anon,authenticated using(is_active=true and source_type='simulated');
revoke all on public.practice_jobs from anon,authenticated;
grant select on public.practice_jobs to anon,authenticated;
grant select,insert,update,delete on public.practice_jobs to service_role;
