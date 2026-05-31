alter table if exists public.restaurant_loyalty_rewards
  add column if not exists reward_type text not null default 'product',
  add column if not exists discount_type text,
  add column if not exists discount_value numeric(10,2),
  add column if not exists discount_max_amount numeric(10,2);

update public.restaurant_loyalty_rewards
set reward_type = 'product'
where reward_type is null;

alter table if exists public.restaurant_loyalty_rewards
  drop constraint if exists restaurant_loyalty_rewards_reward_type_check,
  drop constraint if exists restaurant_loyalty_rewards_discount_type_check,
  drop constraint if exists restaurant_loyalty_rewards_discount_value_check,
  drop constraint if exists restaurant_loyalty_rewards_discount_max_amount_check;

alter table if exists public.restaurant_loyalty_rewards
  add constraint restaurant_loyalty_rewards_reward_type_check
    check (reward_type in ('product', 'discount')),
  add constraint restaurant_loyalty_rewards_discount_type_check
    check (discount_type is null or discount_type in ('percent', 'fixed')),
  add constraint restaurant_loyalty_rewards_discount_value_check
    check (
      reward_type <> 'discount'
      or (
        discount_type is not null
        and discount_value is not null
        and discount_value > 0
        and (discount_type <> 'percent' or discount_value <= 100)
      )
    ),
  add constraint restaurant_loyalty_rewards_discount_max_amount_check
    check (discount_max_amount is null or discount_max_amount >= 0);
