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
values
(
  'cbd4593c-446c-4378-91f0-d3f95681a099',
  'editorial',
  'ivory-olive',
  '{"primary":"#445d39","accent":"#4f6546","displayFont":"Cormorant Garamond","bodyFont":"Manrope"}'::jsonb,
  'SABORE',
  'COCINA DE AUTOR',
  '/dishes/hero-clean-cut.png',
  'Buen sabor,',
  'buen momento',
  'Descubre nuestra seleccion de platos hechos para ti.',
  'editorial-list',
  'video-first',
  true,
  true
),
(
  '2a4a8576-e92d-413e-8666-0997bf7ba228',
  'bistro',
  'charcoal-spritz',
  '{"primary":"#8c4b2f","accent":"#41583f","displayFont":"Fraunces","bodyFont":"DM Sans"}'::jsonb,
  'BRUDER',
  'KITCHEN HOUSE',
  '/dishes/hero-clean-cut.png',
  'Cocina honesta,',
  'mesa vibrante',
  'Sabores directos, visual fuerte y una carta hecha para convertir.',
  'magazine-list',
  'image-with-video-chip',
  false,
  true
)
on conflict (restaurant_id)
do update set
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
  muted_videos = excluded.muted_videos;
