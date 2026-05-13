insert into public.restaurant_loyalty_settings (
  restaurant_id,
  enabled,
  points_name,
  spend_amount_step,
  points_per_step,
  minimum_order_total,
  allow_redemption
)
select
  r.id,
  true,
  'puntos',
  1000,
  1,
  0,
  true
from public.restaurants r
where r.slug in ('totta', 'bruder', 'heladeria')
on conflict (restaurant_id) do update
set
  enabled = excluded.enabled,
  points_name = excluded.points_name,
  spend_amount_step = excluded.spend_amount_step,
  points_per_step = excluded.points_per_step,
  minimum_order_total = excluded.minimum_order_total,
  allow_redemption = excluded.allow_redemption;

insert into public.restaurant_loyalty_rewards (
  restaurant_id,
  product_id,
  title,
  description,
  points_cost,
  image_url,
  is_active,
  sort_order
)
select
  r.id,
  p.id,
  p.name,
  coalesce(p.description, 'Premio canjeable por puntos'),
  10,
  p.image_url,
  true,
  0
from public.restaurants r
join lateral (
  select id, name, description, image_url
  from public.products
  where restaurant_id = r.id
  order by category asc, name asc
  limit 1
) p on true
where r.slug in ('totta', 'bruder', 'heladeria')
on conflict do nothing;
