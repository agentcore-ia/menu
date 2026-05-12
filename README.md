# NeuroRest Menu

Menu digital responsive inspirado en BioMenus, preparado para trabajar por cuenta.

## Que hace ahora

- cada cuenta tiene su propio menu digital
- el frontend carga categorias y productos desde `GET /api/accounts/:accountId/menu`
- el frontend puede enviar pedidos reales a NeuroRest desde `POST /api/accounts/:accountId/orders`
- puedes abrir cuentas distintas con `?account=totta`, `?account=bruder`, `?account=sandras-rose`
- tambien soporta rutas limpias como `/totta` y `/bruder`
- incluye modo `mock`, `supabase` y `sql`
- cada cuenta puede tener su propio `template`, `theme`, `layout`, `hero`, `branding` y estilo de cards
- los productos soportan `video_url` para vista previa
- incluye panel interno en `/admin` para crear cuentas y editar presentacion/video sin SQL

## Desarrollo

```bash
npm install
npm run dev
```

Esto levanta:

- frontend Vite
- API local en `http://127.0.0.1:8787`

## Cuentas de ejemplo

- `http://127.0.0.1:5173/?account=sandras-rose`
- `http://127.0.0.1:5173/?account=neurorest-demo`
- `http://127.0.0.1:5173/?account=totta`
- `http://127.0.0.1:5173/?account=bruder`

## Conectar la base real de NeuroRest

Modo actual recomendado:

1. copia `.env.example` a `.env`
2. usa `NEUROREST_DATA_PROVIDER=supabase`
3. completa `NEUROREST_SUPABASE_URL`
4. completa `NEUROREST_SUPABASE_API_KEY` con una key de backend de solo lectura para la API
5. define `NEUROREST_ADMIN_TOKEN` para habilitar el panel interno
6. define `NEUROREST_SUPABASE_STORAGE_BUCKET=menu-videos` para uploads de preview
7. para uploads seguros, define `NEUROREST_SUPABASE_STORAGE_API_KEY` con una key de backend para Storage
8. para crear pedidos reales, define `NEUROREST_SUPABASE_WRITE_API_KEY` con una key de backend con permisos de escritura

El backend lee:

- `restaurants` para resolver la cuenta por `slug`
- `products` para traer los productos activos de ese restaurante

Agrupa automaticamente por `category`.

Para pedidos reales, el backend escribe en:

- `clientes`
- `pedidos`
- `items_pedido`

Asi el pedido aparece en el dashboard de NeuroRest y queda historial por cliente usando `phone`.

## Arquitectura de presentacion por cuenta

La API ahora devuelve:

- `categories`: contenido del menu
- `presentation`: configuracion visual por cuenta

La presentacion soporta:

- `template`: `editorial`, `bistro`, `luxe`
- `layout`: `editorial`, `bistro`, `luxe`
- `branding.wordmark`
- `branding.subtitle`
- `theme`
- `hero.image`
- `hero.title`
- `hero.accent`
- `hero.description`
- `cards.style`
- `preview.productMedia`
- `preview.autoplayVideos`
- `preview.mutedVideos`

Esto permite que cada restaurante tenga una identidad distinta sin duplicar el frontend.
Ahora `template` define la estructura del menu y `theme` define el look.

## Panel interno `/admin`

Rutas:

- `http://127.0.0.1:5173/admin`
- `https://menu-five-red.vercel.app/admin`

Requiere enviar un token en el header `x-admin-token` o `Authorization: Bearer ...`.
La UI ya lo hace automaticamente cuando completas el campo `Token admin`.

Endpoints disponibles:

- `GET /api/admin/accounts`
- `POST /api/admin/accounts`
- `GET /api/admin/accounts/:accountId/editor`
- `PATCH /api/admin/accounts/:accountId/presentation`
- `PATCH /api/admin/products/:productId/media`

Con eso ya puedes:

- crear una cuenta nueva en `restaurants`
- enlazar por `slug` una cuenta ya existente de NeuroRest sin duplicarla
- editar `layout`, `theme`, `branding`, `hero` y `preview`
- guardar `video_url` por producto
- subir videos directo a Supabase Storage desde el panel

## Preparar Supabase Storage para videos

Bucket recomendado:

- `menu-videos`

Requisitos:

- bucket publico
- videos cortos en `.mp4`
- ideal: usar `NEUROREST_SUPABASE_STORAGE_API_KEY` para que el upload salga desde backend y no abrir permisos publicos de escritura

Variables:

- `NEUROREST_SUPABASE_STORAGE_BUCKET=menu-videos`
- `NEUROREST_SUPABASE_STORAGE_API_KEY=...`

Flujo en `/admin`:

1. elegir cuenta
2. ir a `Videos por producto`
3. seleccionar un archivo
4. click en `Subir a Storage`
5. el panel sube el archivo al bucket y guarda `video_url` en `products`

Ruta interna usada:

- `POST /api/admin/products/:productId/video-upload`

## Modelo Supabase recomendado

Se agrego una migracion lista para aplicar:

- [supabase/migrations/20260511_menu_presentations.sql](C:/Users/matii/Documents/menu/supabase/migrations/20260511_menu_presentations.sql)

La migracion crea:

- `restaurant_menu_presentations`
- `products.video_url` si todavia no existe

Seeds incluidos:

- [supabase/seeds/restaurant_menu_presentations.sql](C:/Users/matii/Documents/menu/supabase/seeds/restaurant_menu_presentations.sql)
- [supabase/seeds/product_video_url_examples.sql](C:/Users/matii/Documents/menu/supabase/seeds/product_video_url_examples.sql)

### Tabla `restaurant_menu_presentations`

Campos principales:

- `restaurant_id`
- `layout`
- `theme_id`
- `theme_overrides` (`jsonb`)
- `branding_wordmark`
- `branding_subtitle`
- `hero_image_url`
- `hero_title`
- `hero_accent`
- `hero_description`
- `cards_style`
- `preview_mode`
- `autoplay_videos`
- `muted_videos`

### `products.video_url`

Si un producto tiene `video_url`, el frontend ya puede:

- mostrar badge de video en la card
- usar autoplay muted en cuentas configuradas con `video-first`
- abrir el detalle con preview real en video

Nota:

- `totta`, `bruder` y `sandras-rose` ya quedaron cargados en la base real con presentacion propia

## Templates listos

Quedaron tres presets listos para usar como base:

- `premium claro`
- `bistro calido`
- `nocturno elegante`

Hoy se resuelven desde:

- [server/presentation/menuPresentation.js](C:/Users/matii/Documents/menu/server/presentation/menuPresentation.js)

Y se mezclan con overrides de base desde:

- [server/presentation/enrichMenu.js](C:/Users/matii/Documents/menu/server/presentation/enrichMenu.js)

## Vercel

Si en Vercel ves un error como:

- `Unexpected token '<'`
- `is not valid JSON`

significa que estaba publicado solo el frontend y no habia endpoint `/api/...`.

Este repo ahora ya incluye funciones serverless en:

- `api/health.js`
- `api/accounts/[accountId]/menu.js`

En Vercel solo necesitas cargar estas variables de entorno y redeploy:

- `NEUROREST_DATA_PROVIDER=supabase`
- `NEUROREST_SUPABASE_URL=https://eqnjyygokjinmsfvogxi.supabase.co`
- `NEUROREST_SUPABASE_API_KEY=...`
- `NEUROREST_ADMIN_TOKEN=...`

Alternativa:

- puedes seguir usando `NEUROREST_DATA_PROVIDER=sql` si en el futuro quieres leer directo desde Postgres/MySQL sin pasar por Supabase REST

El adaptador SQL espera este modelo base:

- `accounts`: `id`, `slug`, `name`, `currency`, `locale`
- `menu_categories`: `id`, `account_id`, `slug`, `name`, `sort_order`
- `menu_products`: `id`, `account_id`, `category_id`, `name`, `description`, `price`, `price_display`, `image_url`, `video_url`, `badge`, `dietary_tags`, `is_active`, `sort_order`

## Importante

La conexion real a la base de NeuroRest queda preparada, pero para enchufarla de verdad todavia hace falta confirmar:

- motor real de base de datos
- credenciales
- nombres reales de tablas y columnas
- si los productos ya tienen imagen/video o si eso sale de otra tabla
