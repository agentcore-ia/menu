alter table if exists public.restaurant_loyalty_rewards
  add column if not exists video_url text;
