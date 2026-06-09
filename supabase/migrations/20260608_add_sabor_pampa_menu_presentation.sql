alter table if exists public.restaurant_menu_presentations
  drop constraint if exists restaurant_menu_presentations_layout_check;

alter table if exists public.restaurant_menu_presentations
  add constraint restaurant_menu_presentations_layout_check
  check (layout in (
    'editorial',
    'bistro',
    'luxe',
    'gelato',
    'pizzeria',
    'burger',
    'blue-burger',
    'host',
    'kika',
    'florian',
    'sabor-pampa'
  ));

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
    'blue-burger-list',
    'host-grid',
    'kika-cards',
    'florian-list',
    'sabor-pampa-cards'
  ));

insert into public.restaurant_menu_presentations (
  restaurant_id,
  layout,
  theme_id,
  theme_overrides,
  branding_wordmark,
  branding_subtitle,
  hero_image_url,
  hero_title,
  hero_accent,
  hero_description,
  cards_style,
  preview_mode,
  autoplay_videos,
  muted_videos
)
select
  restaurants.id,
  'sabor-pampa',
  'sabor-pampa',
  jsonb_build_object('headerImages', jsonb_build_array(), 'heroVideo', ''),
  'sabor a pampa',
  'cocina casera',
  '',
  'CASERO, GOURMET',
  'y hecho con amor',
  'Platos que reconfortan, sabores que te hacen volver.',
  'sabor-pampa-cards',
  'video-first',
  true,
  true
from public.restaurants
where slug in ('sabor-a-pampa', 'saborapampa', 'sabor-pampa', 'sabor-a-pampa-cocina')
  or lower(name) like '%sabor%pampa%'
on conflict (restaurant_id) do update set
  layout = excluded.layout,
  theme_id = excluded.theme_id,
  theme_overrides = excluded.theme_overrides,
  branding_wordmark = excluded.branding_wordmark,
  branding_subtitle = excluded.branding_subtitle,
  hero_image_url = excluded.hero_image_url,
  hero_title = excluded.hero_title,
  hero_accent = excluded.hero_accent,
  hero_description = excluded.hero_description,
  cards_style = excluded.cards_style,
  preview_mode = excluded.preview_mode,
  autoplay_videos = excluded.autoplay_videos,
  muted_videos = excluded.muted_videos,
  updated_at = now();
