-- Ejemplos para cargar previews en video por producto.
-- Reemplaza las URLs por archivos reales de cada restaurante.

update public.products
set video_url = 'https://cdn.neurorest.com/previews/totta/carne-suave.mp4'
where restaurant_id = 'cbd4593c-446c-4378-91f0-d3f95681a099'
  and lower(name) = lower('Carne Suave');

update public.products
set video_url = 'https://cdn.neurorest.com/previews/bruder/beast-classic.mp4'
where restaurant_id = '2a4a8576-e92d-413e-8666-0997bf7ba228'
  and lower(name) = lower('Beast Classic');
