-- Add a denormalized searchable field so keyword searches include skills and duties.
-- Existing rows are backfilled here; the GitHub Actions seed workflow refreshes it on upsert.
alter table public.practice_jobs
  add column if not exists search_text text not null default '';

update public.practice_jobs
set search_text = concat_ws(
  ' ',
  title,
  employer,
  industry,
  location,
  summary,
  array_to_string(responsibilities, ' '),
  array_to_string(required_qualifications, ' '),
  array_to_string(preferred_qualifications, ' ')
)
where search_text = '';
