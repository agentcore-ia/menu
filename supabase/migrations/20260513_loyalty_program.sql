create table if not exists public.restaurant_loyalty_settings (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  enabled boolean not null default false,
  points_name text not null default 'puntos',
  spend_amount_step numeric(12,2) not null default 1000,
  points_per_step integer not null default 1,
  minimum_order_total numeric(12,2) not null default 0,
  allow_redemption boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint restaurant_loyalty_settings_restaurant_id_key unique (restaurant_id),
  constraint restaurant_loyalty_settings_spend_amount_step_check
    check (spend_amount_step > 0),
  constraint restaurant_loyalty_settings_points_per_step_check
    check (points_per_step > 0),
  constraint restaurant_loyalty_settings_minimum_order_total_check
    check (minimum_order_total >= 0)
);

create table if not exists public.restaurant_loyalty_rewards (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  title text,
  description text,
  points_cost integer not null,
  image_url text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint restaurant_loyalty_rewards_points_cost_check
    check (points_cost > 0)
);

create table if not exists public.customer_loyalty_accounts (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  cliente_id uuid references public.clientes(id) on delete set null,
  phone text not null,
  customer_name text,
  points_balance integer not null default 0,
  total_points_earned integer not null default 0,
  total_points_redeemed integer not null default 0,
  last_order_id uuid references public.pedidos(id) on delete set null,
  last_activity_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customer_loyalty_accounts_phone_key unique (restaurant_id, phone),
  constraint customer_loyalty_accounts_points_balance_check
    check (points_balance >= 0),
  constraint customer_loyalty_accounts_total_points_earned_check
    check (total_points_earned >= 0),
  constraint customer_loyalty_accounts_total_points_redeemed_check
    check (total_points_redeemed >= 0)
);

create table if not exists public.customer_loyalty_transactions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.customer_loyalty_accounts(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  cliente_id uuid references public.clientes(id) on delete set null,
  pedido_id uuid references public.pedidos(id) on delete set null,
  reward_id uuid references public.restaurant_loyalty_rewards(id) on delete set null,
  kind text not null,
  points_delta integer not null,
  balance_after integer not null,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint customer_loyalty_transactions_kind_check
    check (kind in ('earn', 'redeem', 'manual_adjustment')),
  constraint customer_loyalty_transactions_balance_after_check
    check (balance_after >= 0)
);

create index if not exists restaurant_loyalty_settings_restaurant_id_idx
  on public.restaurant_loyalty_settings (restaurant_id);

create index if not exists restaurant_loyalty_rewards_restaurant_id_idx
  on public.restaurant_loyalty_rewards (restaurant_id, is_active, sort_order);

create index if not exists customer_loyalty_accounts_restaurant_phone_idx
  on public.customer_loyalty_accounts (restaurant_id, phone);

create index if not exists customer_loyalty_transactions_account_created_idx
  on public.customer_loyalty_transactions (account_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_restaurant_loyalty_settings_updated_at
  on public.restaurant_loyalty_settings;

create trigger trg_restaurant_loyalty_settings_updated_at
before update on public.restaurant_loyalty_settings
for each row
execute function public.set_updated_at();

drop trigger if exists trg_restaurant_loyalty_rewards_updated_at
  on public.restaurant_loyalty_rewards;

create trigger trg_restaurant_loyalty_rewards_updated_at
before update on public.restaurant_loyalty_rewards
for each row
execute function public.set_updated_at();

drop trigger if exists trg_customer_loyalty_accounts_updated_at
  on public.customer_loyalty_accounts;

create trigger trg_customer_loyalty_accounts_updated_at
before update on public.customer_loyalty_accounts
for each row
execute function public.set_updated_at();
