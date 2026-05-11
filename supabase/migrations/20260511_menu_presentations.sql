create table if not exists public.restaurant_menu_presentations (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  layout text not null default 'editorial',
  theme_id text not null default 'ivory-olive',
  theme_overrides jsonb not null default '{}'::jsonb,
  branding_wordmark text,
  branding_subtitle text,
  hero_image_url text,
  hero_title text,
  hero_accent text,
  hero_description text,
  cards_style text not null default 'editorial-list',
  preview_mode text not null default 'image-with-video-chip',
  autoplay_videos boolean not null default false,
  muted_videos boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint restaurant_menu_presentations_restaurant_id_key unique (restaurant_id),
  constraint restaurant_menu_presentations_layout_check
    check (layout in ('editorial', 'bistro', 'luxe')),
  constraint restaurant_menu_presentations_cards_style_check
    check (cards_style in ('editorial-list', 'magazine-list', 'glass-list')),
  constraint restaurant_menu_presentations_preview_mode_check
    check (preview_mode in ('image-with-video-chip', 'video-first'))
);

alter table public.products
  add column if not exists video_url text;

create index if not exists restaurant_menu_presentations_restaurant_id_idx
  on public.restaurant_menu_presentations (restaurant_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_restaurant_menu_presentations_updated_at
  on public.restaurant_menu_presentations;

create trigger trg_restaurant_menu_presentations_updated_at
before update on public.restaurant_menu_presentations
for each row
execute function public.set_updated_at();
