alter table if exists public.clientes
  add column if not exists birth_date date;

alter table if exists public.customer_loyalty_accounts
  add column if not exists birth_date date;
