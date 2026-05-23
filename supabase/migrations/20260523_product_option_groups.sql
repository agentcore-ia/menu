alter table if exists public.products
  add column if not exists option_groups jsonb not null default '[]'::jsonb;
