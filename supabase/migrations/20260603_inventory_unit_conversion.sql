alter table public.product_inventory_recipes
  add column if not exists quantity_unit text;

create or replace function public.normalize_inventory_unit(p_unit text)
returns text
language sql
immutable
as $$
  select case regexp_replace(lower(trim(coalesce(p_unit, 'unidad'))), '[\s\.]+', '', 'g')
    when '' then 'unidad'
    when 'u' then 'unidad'
    when 'un' then 'unidad'
    when 'ud' then 'unidad'
    when 'uds' then 'unidad'
    when 'unidad' then 'unidad'
    when 'unidades' then 'unidad'
    when 'kg' then 'kg'
    when 'kgs' then 'kg'
    when 'kilo' then 'kg'
    when 'kilos' then 'kg'
    when 'kilogramo' then 'kg'
    when 'kilogramos' then 'kg'
    when 'g' then 'g'
    when 'gr' then 'g'
    when 'grs' then 'g'
    when 'gramo' then 'g'
    when 'gramos' then 'g'
    when 'mg' then 'mg'
    when 'miligramo' then 'mg'
    when 'miligramos' then 'mg'
    when 'l' then 'l'
    when 'lt' then 'l'
    when 'lts' then 'l'
    when 'litro' then 'l'
    when 'litros' then 'l'
    when 'ml' then 'ml'
    when 'cc' then 'ml'
    when 'cm3' then 'ml'
    when 'mililitro' then 'ml'
    when 'mililitros' then 'ml'
    else regexp_replace(lower(trim(coalesce(p_unit, 'unidad'))), '[\s\.]+', '', 'g')
  end;
$$;

create or replace function public.inventory_unit_family(p_unit text)
returns text
language sql
immutable
as $$
  select case
    when public.normalize_inventory_unit(p_unit) in ('mg', 'g', 'kg') then 'mass'
    when public.normalize_inventory_unit(p_unit) in ('ml', 'l') then 'volume'
    when public.normalize_inventory_unit(p_unit) = 'unidad' then 'count'
    else 'custom:' || public.normalize_inventory_unit(p_unit)
  end;
$$;

create or replace function public.inventory_unit_factor_to_base(p_unit text)
returns numeric
language sql
immutable
as $$
  select case public.normalize_inventory_unit(p_unit)
    when 'mg' then 0.001
    when 'g' then 1
    when 'kg' then 1000
    when 'ml' then 1
    when 'l' then 1000
    else 1
  end;
$$;

create or replace function public.convert_inventory_quantity(
  p_quantity numeric,
  p_from_unit text,
  p_to_unit text
)
returns numeric
language plpgsql
immutable
as $$
declare
  v_from text := public.normalize_inventory_unit(coalesce(nullif(trim(p_from_unit), ''), p_to_unit));
  v_to text := public.normalize_inventory_unit(coalesce(nullif(trim(p_to_unit), ''), p_from_unit));
begin
  if p_quantity is null then
    return 0;
  end if;

  if v_from = v_to then
    return p_quantity;
  end if;

  if public.inventory_unit_family(v_from) <> public.inventory_unit_family(v_to) then
    raise exception 'No se puede convertir de % a % para calcular stock.', p_from_unit, p_to_unit;
  end if;

  return p_quantity
    * public.inventory_unit_factor_to_base(v_from)
    / nullif(public.inventory_unit_factor_to_base(v_to), 0);
end;
$$;

create or replace function public.format_inventory_quantity(p_quantity numeric)
returns text
language sql
immutable
as $$
  select trim(trailing '.' from trim(trailing '0' from to_char(coalesce(p_quantity, 0), 'FM999999990.999')));
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
      coalesce(nullif(trim(r.quantity_unit), ''), i.unit) as quantity_unit,
      public.convert_inventory_quantity(
        r.quantity_per_unit,
        coalesce(nullif(trim(r.quantity_unit), ''), i.unit),
        i.unit
      ) as inventory_quantity_per_unit,
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
        else greatest(0, floor(min(rr.quantity_on_hand / nullif(rr.inventory_quantity_per_unit, 0)))::integer)
      end as max_available,
      coalesce(
        jsonb_agg(
          jsonb_build_object(
            'inventoryItemId', rr.inventory_item_id,
            'name', rr.name,
            'unit', rr.unit,
            'quantityPerUnit', rr.quantity_per_unit,
            'quantityUnit', rr.quantity_unit,
            'inventoryQuantityPerUnit', rr.inventory_quantity_per_unit,
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
      sum(
        pt.quantity * public.convert_inventory_quantity(
          r.quantity_per_unit,
          coalesce(nullif(trim(r.quantity_unit), ''), i.unit),
          i.unit
        )
      ) as required_quantity
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
  select *
    into v_problem
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
        public.format_inventory_quantity(v_problem.quantity_on_hand),
        v_problem.unit,
        public.format_inventory_quantity(v_problem.required_quantity),
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
      coalesce(nullif(trim(r.quantity_unit), ''), i.unit) as quantity_unit,
      public.convert_inventory_quantity(
        r.quantity_per_unit,
        coalesce(nullif(trim(r.quantity_unit), ''), i.unit),
        i.unit
      ) as inventory_quantity_per_unit,
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
    v_required := p_quantity * v_recipe.inventory_quantity_per_unit;

    if p_direction < 0 and v_strict and v_recipe.quantity_on_hand < v_required then
      raise exception 'No hay stock suficiente de %. Disponible: % %. Necesario: % %.',
        v_recipe.name,
        public.format_inventory_quantity(v_recipe.quantity_on_hand),
        v_recipe.unit,
        public.format_inventory_quantity(v_required),
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
        'quantity_per_unit', v_recipe.quantity_per_unit,
        'quantity_unit', v_recipe.quantity_unit,
        'inventory_quantity_per_unit', v_recipe.inventory_quantity_per_unit,
        'inventory_unit', v_recipe.unit
      )
    );
  end loop;
end;
$$;
