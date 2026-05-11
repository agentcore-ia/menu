# NeuroRest Menu

Menu digital responsive inspirado en BioMenus, preparado para trabajar por cuenta.

## Que hace ahora

- cada cuenta tiene su propio menu digital
- el frontend carga categorias y productos desde `GET /api/accounts/:accountId/menu`
- puedes abrir cuentas distintas con `?account=totta`, `?account=bruder`, `?account=sandras-rose`
- incluye modo `mock`, `supabase` y `sql`

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

El backend lee:

- `restaurants` para resolver la cuenta por `slug`
- `products` para traer los productos activos de ese restaurante

Agrupa automaticamente por `category`.

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
