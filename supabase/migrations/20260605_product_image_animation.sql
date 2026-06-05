alter table if exists public.products
  add column if not exists image_animation text not null default 'none';

alter table if exists public.products
  drop constraint if exists products_image_animation_check;

alter table if exists public.products
  add constraint products_image_animation_check
  check (image_animation in ('none', 'zoom-loop', 'spin-loop', 'float-loop'));

notify pgrst, 'reload schema';
