-- Inventory and stock control for menu products.
-- Kept in the public menu repo too because the digital menu consumes this schema.

alter table if exists public.restaurants
  add column if not exists stock_strict_mode boolean not null default false;

create table if not exists public.restaurant_inventory_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  unit text not null default 'unidad',
  quantity_on_hand numeric(14, 3) not null default 0,
  low_stock_threshold numeric(14, 3) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint restaurant_inventory_items_name_not_empty check (length(trim(name)) > 0),
  constraint restaurant_inventory_items_unit_not_empty check (length(trim(unit)) > 0),
  constraint restaurant_inventory_items_low_stock_non_negative check (low_stock_threshold >= 0)
);

create unique index if not exists idx_inventory_items_restaurant_name
  on public.restaurant_inventory_items(restaurant_id, lower(trim(name)));

create index if not exists idx_inventory_items_restaurant
  on public.restaurant_inventory_items(restaurant_id, is_active, name);

create table if not exists public.product_inventory_recipes (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  inventory_item_id uuid not null references public.restaurant_inventory_items(id) on delete cascade,
  quantity_per_unit numeric(14, 3) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_inventory_recipes_quantity_positive check (quantity_per_unit > 0)
);

create unique index if not exists idx_product_inventory_recipes_unique
  on public.product_inventory_recipes(product_id, inventory_item_id);

create index if not exists idx_product_inventory_recipes_restaurant
  on public.product_inventory_recipes(restaurant_id, product_id);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  inventory_item_id uuid not null references public.restaurant_inventory_items(id) on delete cascade,
  pedido_id uuid references public.pedidos(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  movement_type text not null,
  quantity_delta numeric(14, 3) not null,
  balance_after numeric(14, 3) not null,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint inventory_movements_type_check check (
    movement_type in ('manual_adjustment', 'order_consumption', 'order_reversal')
  )
);

create index if not exists idx_inventory_movements_restaurant
  on public.inventory_movements(restaurant_id, created_at desc);

create index if not exists idx_inventory_movements_item
  on public.inventory_movements(inventory_item_id, created_at desc);

create index if not exists idx_inventory_movements_order
  on public.inventory_movements(pedido_id);

alter table if exists public.items_pedido
  add column if not exists stock_components jsonb not null default '[]'::jsonb;

create or replace function public.touch_inventory_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_inventory_items_updated_at on public.restaurant_inventory_items;
create trigger trg_inventory_items_updated_at
before update on public.restaurant_inventory_items
for each row execute function public.touch_inventory_updated_at();

drop trigger if exists trg_product_inventory_recipes_updated_at on public.product_inventory_recipes;
create trigger trg_product_inventory_recipes_updated_at
before update on public.product_inventory_recipes
for each row execute function public.touch_inventory_updated_at();

create or replace function public.resolve_inventory_product_id(
  p_restaurant_id uuid,
  p_product_id uuid,
  p_name text
)
returns uuid
language plpgsql
stable
as $$
declare
  v_product_id uuid;
begin
  if p_product_id is not null then
    select id into v_product_id
      from public.products
     where id = p_product_id
       and restaurant_id = p_restaurant_id
     limit 1;

    if v_product_id is not null then
      return v_product_id;
    end if;
  end if;

  if nullif(trim(coalesce(p_name, '')), '') is null then
    return null;
  end if;

  select id into v_product_id
    from public.products
   where restaurant_id = p_restaurant_id
     and lower(trim(name)) = lower(trim(p_name))
   order by available desc, created_at desc nulls last
   limit 1;

  return v_product_id;
end;
$$;

create or replace function public.get_product_stock_availability(p_restaurant_id uuid)
returns table (
  product_id uuid,
  is_stock_tracked boolean,
  max_available integer,
  stock_status text,
  required_items jsonb
)
language sql
stable
as $$
  with recipe_rows as (
    select
      r.product_id,
      r.inventory_item_id,
      r.quantity_per_unit,
      i.name,
      i.unit,
      coalesce(i.quantity_on_hand, 0) as quantity_on_hand,
      coalesce(i.low_stock_threshold, 0) as low_stock_threshold,
      i.is_active
    from public.product_inventory_recipes r
    join public.restaurant_inventory_items i
      on i.id = r.inventory_item_id
     and i.restaurant_id = r.restaurant_id
    where r.restaurant_id = p_restaurant_id
      and i.is_active = true
  ),
  aggregate_rows as (
    select
      p.id as product_id,
      count(rr.inventory_item_id) > 0 as is_stock_tracked,
      case
        when count(rr.inventory_item_id) = 0 then null::integer
        else greatest(0, floor(min(rr.quantity_on_hand / nullif(rr.quantity_per_unit, 0)))::integer)
      end as max_available,
      coalesce(
        jsonb_agg(
          jsonb_build_object(
            'inventoryItemId', rr.inventory_item_id,
            'name', rr.name,
            'unit', rr.unit,
            'quantityPerUnit', rr.quantity_per_unit,
            'quantityOnHand', rr.quantity_on_hand,
            'lowStockThreshold', rr.low_stock_threshold
          )
          order by rr.name
        ) filter (where rr.inventory_item_id is not null),
        '[]'::jsonb
      ) as required_items
    from public.products p
    left join recipe_rows rr on rr.product_id = p.id
    where p.restaurant_id = p_restaurant_id
    group by p.id
  )
  select
    ar.product_id,
    ar.is_stock_tracked,
    ar.max_available,
    case
      when not ar.is_stock_tracked then 'untracked'
      when ar.max_available <= 0 then 'out'
      when exists (
        select 1
          from jsonb_array_elements(ar.required_items) entry
         where coalesce((entry->>'quantityOnHand')::numeric, 0)
             <= coalesce((entry->>'lowStockThreshold')::numeric, 0)
      ) then 'low'
      else 'available'
    end as stock_status,
    ar.required_items
  from aggregate_rows ar;
$$;

create or replace function public.validate_order_stock(
  p_restaurant_id uuid,
  p_items jsonb
)
returns jsonb
language plpgsql
stable
as $$
declare
  v_strict boolean := false;
  v_problem record;
begin
  select coalesce(stock_strict_mode, false)
    into v_strict
    from public.restaurants
   where id = p_restaurant_id;

  if not v_strict then
    return jsonb_build_object('ok', true, 'strict', false, 'message', null, 'details', '[]'::jsonb);
  end if;

  with raw_items as (
    select
      nullif(item->>'productId', '')::uuid as product_id,
      coalesce(item->>'name', '') as name,
      greatest(0, coalesce((item->>'quantity')::numeric, 0)) as quantity
    from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) item
  ),
  resolved_items as (
    select
      public.resolve_inventory_product_id(p_restaurant_id, product_id, name) as product_id,
      name,
      quantity
    from raw_items
    where quantity > 0
  ),
  product_totals as (
    select product_id, max(name) as name, sum(quantity) as quantity
    from resolved_items
    where product_id is not null
    group by product_id
  ),
  requirements as (
    select
      r.inventory_item_id,
      i.name as inventory_name,
      i.unit,
      i.quantity_on_hand,
      sum(pt.quantity * r.quantity_per_unit) as required_quantity
    from product_totals pt
    join public.product_inventory_recipes r
      on r.product_id = pt.product_id
     and r.restaurant_id = p_restaurant_id
    join public.restaurant_inventory_items i
      on i.id = r.inventory_item_id
     and i.restaurant_id = r.restaurant_id
     and i.is_active = true
    group by r.inventory_item_id, i.name, i.unit, i.quantity_on_hand
  )
  select * into v_problem
    from requirements
   where quantity_on_hand < required_quantity
   order by inventory_name
   limit 1;

  if v_problem.inventory_item_id is not null then
    return jsonb_build_object(
      'ok', false,
      'strict', true,
      'message', format(
        'No hay stock suficiente de %s. Disponible: %s %s. Necesario: %s %s.',
        v_problem.inventory_name,
        trim(to_char(v_problem.quantity_on_hand, 'FM999999990.###')),
        v_problem.unit,
        trim(to_char(v_problem.required_quantity, 'FM999999990.###')),
        v_problem.unit
      ),
      'details', jsonb_build_array(
        jsonb_build_object(
          'inventoryItemId', v_problem.inventory_item_id,
          'name', v_problem.inventory_name,
          'available', v_problem.quantity_on_hand,
          'required', v_problem.required_quantity,
          'unit', v_problem.unit
        )
      )
    );
  end if;

  return jsonb_build_object('ok', true, 'strict', true, 'message', null, 'details', '[]'::jsonb);
end;
$$;

create or replace function public.adjust_inventory_item(
  p_inventory_item_id uuid,
  p_quantity_delta numeric,
  p_notes text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns public.restaurant_inventory_items
language plpgsql
as $$
declare
  v_item public.restaurant_inventory_items;
  v_updated public.restaurant_inventory_items;
begin
  if p_quantity_delta is null or p_quantity_delta = 0 then
    raise exception 'El ajuste de stock debe ser distinto de 0.';
  end if;

  select * into v_item
    from public.restaurant_inventory_items
   where id = p_inventory_item_id
   for update;

  if v_item.id is null then
    raise exception 'No se encontro el insumo.';
  end if;

  update public.restaurant_inventory_items
     set quantity_on_hand = quantity_on_hand + p_quantity_delta
   where id = p_inventory_item_id
   returning * into v_updated;

  insert into public.inventory_movements (
    restaurant_id,
    inventory_item_id,
    movement_type,
    quantity_delta,
    balance_after,
    notes,
    metadata
  ) values (
    v_updated.restaurant_id,
    v_updated.id,
    'manual_adjustment',
    p_quantity_delta,
    v_updated.quantity_on_hand,
    p_notes,
    coalesce(p_metadata, '{}'::jsonb)
  );

  return v_updated;
end;
$$;

create or replace function public.apply_inventory_for_order_item(
  p_item_id uuid,
  p_pedido_id uuid,
  p_product_id uuid,
  p_name text,
  p_quantity numeric,
  p_direction integer
)
returns void
language plpgsql
as $$
declare
  v_restaurant_id uuid;
  v_strict boolean := false;
  v_product_id uuid;
  v_recipe record;
  v_required numeric;
  v_updated_quantity numeric;
  v_has_consumption boolean;
begin
  if p_pedido_id is null or coalesce(p_quantity, 0) <= 0 or p_direction = 0 then
    return;
  end if;

  select p.restaurant_id, coalesce(r.stock_strict_mode, false)
    into v_restaurant_id, v_strict
    from public.pedidos p
    join public.restaurants r on r.id = p.restaurant_id
   where p.id = p_pedido_id;

  if v_restaurant_id is null then
    return;
  end if;

  if p_direction > 0 then
    select exists (
      select 1
        from public.inventory_movements
       where movement_type = 'order_consumption'
         and metadata->>'items_pedido_id' = p_item_id::text
    ) into v_has_consumption;

    if not v_has_consumption then
      return;
    end if;
  end if;

  v_product_id := public.resolve_inventory_product_id(v_restaurant_id, p_product_id, p_name);

  if v_product_id is null then
    return;
  end if;

  for v_recipe in
    select
      r.product_id,
      r.inventory_item_id,
      r.quantity_per_unit,
      i.name,
      i.unit,
      i.quantity_on_hand
    from public.product_inventory_recipes r
    join public.restaurant_inventory_items i
      on i.id = r.inventory_item_id
     and i.restaurant_id = r.restaurant_id
     and i.is_active = true
    where r.restaurant_id = v_restaurant_id
      and r.product_id = v_product_id
    for update of i
  loop
    v_required := p_quantity * v_recipe.quantity_per_unit;

    if p_direction < 0 and v_strict and v_recipe.quantity_on_hand < v_required then
      raise exception 'No hay stock suficiente de %. Disponible: % %. Necesario: % %.',
        v_recipe.name,
        trim(to_char(v_recipe.quantity_on_hand, 'FM999999990.###')),
        v_recipe.unit,
        trim(to_char(v_required, 'FM999999990.###')),
        v_recipe.unit;
    end if;

    update public.restaurant_inventory_items
       set quantity_on_hand = quantity_on_hand + (p_direction * v_required)
     where id = v_recipe.inventory_item_id
     returning quantity_on_hand into v_updated_quantity;

    insert into public.inventory_movements (
      restaurant_id,
      inventory_item_id,
      pedido_id,
      product_id,
      movement_type,
      quantity_delta,
      balance_after,
      notes,
      metadata
    ) values (
      v_restaurant_id,
      v_recipe.inventory_item_id,
      p_pedido_id,
      v_product_id,
      case when p_direction < 0 then 'order_consumption' else 'order_reversal' end,
      p_direction * v_required,
      v_updated_quantity,
      case when p_direction < 0 then 'Consumo por pedido' else 'Reversion por cambio de pedido' end,
      jsonb_build_object(
        'items_pedido_id', p_item_id,
        'item_name', p_name,
        'item_quantity', p_quantity,
        'quantity_per_unit', v_recipe.quantity_per_unit
      )
    );
  end loop;
end;
$$;

create or replace function public.inventory_items_pedido_insert_trigger()
returns trigger
language plpgsql
as $$
begin
  perform public.apply_inventory_for_order_item(new.id, new.pedido_id, new.product_id, new.name, new.quantity, -1);
  return new;
end;
$$;

create or replace function public.inventory_items_pedido_update_trigger()
returns trigger
language plpgsql
as $$
begin
  if old.product_id is distinct from new.product_id
     or old.name is distinct from new.name
     or old.quantity is distinct from new.quantity then
    perform public.apply_inventory_for_order_item(old.id, old.pedido_id, old.product_id, old.name, old.quantity, 1);
    perform public.apply_inventory_for_order_item(new.id, new.pedido_id, new.product_id, new.name, new.quantity, -1);
  end if;

  return new;
end;
$$;

create or replace function public.inventory_items_pedido_delete_trigger()
returns trigger
language plpgsql
as $$
begin
  perform public.apply_inventory_for_order_item(old.id, old.pedido_id, old.product_id, old.name, old.quantity, 1);
  return old;
end;
$$;

drop trigger if exists trg_inventory_items_pedido_insert on public.items_pedido;
create trigger trg_inventory_items_pedido_insert
after insert on public.items_pedido
for each row execute function public.inventory_items_pedido_insert_trigger();

drop trigger if exists trg_inventory_items_pedido_update on public.items_pedido;
create trigger trg_inventory_items_pedido_update
after update on public.items_pedido
for each row execute function public.inventory_items_pedido_update_trigger();

drop trigger if exists trg_inventory_items_pedido_delete on public.items_pedido;
create trigger trg_inventory_items_pedido_delete
after delete on public.items_pedido
for each row execute function public.inventory_items_pedido_delete_trigger();

create or replace view public.agent_menu_products as
select
  p.*,
  coalesce(r.stock_strict_mode, false) as stock_strict_mode,
  coalesce(a.is_stock_tracked, false) as is_stock_tracked,
  a.max_available,
  coalesce(a.stock_status, 'untracked') as stock_status,
  case
    when coalesce(r.stock_strict_mode, false)
     and coalesce(a.is_stock_tracked, false)
     and coalesce(a.max_available, 0) <= 0
    then false
    else coalesce(p.available, true)
  end as available_for_order
from public.products p
join public.restaurants r on r.id = p.restaurant_id
left join lateral public.get_product_stock_availability(p.restaurant_id) a
  on a.product_id = p.id;

create or replace function public.n8n_get_menu(p_restaurant_id uuid)
returns json
language plpgsql
as $$
declare
  result json;
begin
  select coalesce(json_agg(row_to_json(menu_row)), '[]'::json)
    into result
    from (
      select
        p.*,
        coalesce(r.stock_strict_mode, false) as stock_strict_mode,
        coalesce(a.is_stock_tracked, false) as is_stock_tracked,
        a.max_available,
        coalesce(a.stock_status, 'untracked') as stock_status,
        case
          when coalesce(r.stock_strict_mode, false)
           and coalesce(a.is_stock_tracked, false)
           and coalesce(a.max_available, 0) <= 0
          then false
          else coalesce(p.available, true)
        end as available_for_order,
        case
          when coalesce(r.stock_strict_mode, false)
           and coalesce(a.is_stock_tracked, false)
           and coalesce(a.max_available, 0) <= 0
          then 'Sin stock'
          when coalesce(r.stock_strict_mode, false)
           and coalesce(a.is_stock_tracked, false)
          then 'Stock disponible: ' || a.max_available::text
          else null
        end as stock_message
      from public.products p
      join public.restaurants r on r.id = p.restaurant_id
      left join lateral public.get_product_stock_availability(p.restaurant_id) a
        on a.product_id = p.id
      where p.restaurant_id = p_restaurant_id
        and p.available = true
      order by p.category asc, p.name asc
    ) menu_row;

  return result;
end;
$$;
