-- Accelerate contains-style keyword searches such as %property manager%.
-- Supabase commonly installs extensions into the dedicated extensions schema.
create extension if not exists pg_trgm with schema extensions;

create index if not exists practice_jobs_search_text_trgm_idx
  on public.practice_jobs using gin (search_text extensions.gin_trgm_ops);
