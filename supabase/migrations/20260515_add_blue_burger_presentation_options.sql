alter table if exists public.restaurant_menu_presentations
  drop constraint if exists restaurant_menu_presentations_layout_check;

alter table if exists public.restaurant_menu_presentations
  add constraint restaurant_menu_presentations_layout_check
  check (layout in ('editorial', 'bistro', 'luxe', 'gelato', 'pizzeria', 'burger', 'blue-burger'));

alter table if exists public.restaurant_menu_presentations
  drop constraint if exists restaurant_menu_presentations_cards_style_check;

alter table if exists public.restaurant_menu_presentations
  add constraint restaurant_menu_presentations_cards_style_check
  check (cards_style in (
    'editorial-list',
    'magazine-list',
    'glass-list',
    'gelato-cards',
    'pizzeria-grid',
    'burger-grid',
    'blue-burger-list'
  ));
