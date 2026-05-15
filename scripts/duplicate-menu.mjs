import fs from 'node:fs'
import { getServerConfig } from '../server/config.js'
import { SupabaseAdminRepository } from '../server/admin/supabaseAdminRepository.js'

function loadDotEnv() {
  if (!fs.existsSync('.env')) {
    return
  }

  const text = fs.readFileSync('.env', 'utf8')

  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^([^#=]+)=(.*)$/)
    if (!match) {
      continue
    }

    const [, key, value] = match

    if (!process.env[key.trim()]) {
      process.env[key.trim()] = value.trim()
    }
  }
}

function parseArgs(argv) {
  const args = {
    replaceProducts: true,
    keepTargetHero: false,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]

    if (token === '--source') {
      args.source = argv[index + 1]
      index += 1
    } else if (token === '--target') {
      args.target = argv[index + 1]
      index += 1
    } else if (token === '--keep-target-hero') {
      args.keepTargetHero = true
    } else if (token === '--append-products') {
      args.replaceProducts = false
    }
  }

  if (!args.source || !args.target) {
    throw new Error(
      'Uso: node scripts/duplicate-menu.mjs --source burguer --target el-club [--keep-target-hero]',
    )
  }

  return args
}

async function request(config, path, options = {}) {
  const response = await fetch(`${config.supabaseUrl}/rest/v1${path}`, {
    method: options.method ?? 'GET',
    headers: {
      apikey: config.supabaseWriteApiKey,
      Authorization: `Bearer ${config.supabaseWriteApiKey}`,
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    body: options.body,
  })
  const text = await response.text()

  if (!response.ok) {
    throw new Error(`Supabase error: ${response.status} ${text}`)
  }

  return text ? JSON.parse(text) : []
}

async function fetchPresentation(config, restaurantId) {
  const rows = await request(
    config,
    `/restaurant_menu_presentations?restaurant_id=eq.${restaurantId}&select=*&limit=1`,
  )
  return rows[0] ?? null
}

async function upsertPresetInheritance(config, { target, source, keepTargetHero }) {
  const currentPresentation = await fetchPresentation(config, target.id)
  const heroImageUrl = keepTargetHero ? currentPresentation?.hero_image_url ?? null : null

  const rows = await request(config, '/restaurant_menu_presentations?on_conflict=restaurant_id', {
    method: 'POST',
    headers: {
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify([
      {
        restaurant_id: target.id,
        layout: 'editorial',
        theme_id: `inherits-${source.slug}`,
        theme_overrides: {
          inheritPreset: source.slug,
        },
        branding_wordmark: null,
        branding_subtitle: null,
        hero_image_url: heroImageUrl,
        hero_title: null,
        hero_accent: null,
        hero_description: null,
        cards_style: 'editorial-list',
        preview_mode: 'image-with-video-chip',
        autoplay_videos: false,
        muted_videos: true,
      },
    ]),
  })

  return rows[0] ?? null
}

loadDotEnv()

const args = parseArgs(process.argv.slice(2))
const config = getServerConfig()
const repository = new SupabaseAdminRepository(config)
const result = await repository.copyProductsFromAccount(args.target, args.source, {
  replaceExisting: args.replaceProducts,
})

if (!result) {
  throw new Error(`No se encontro el menu destino: ${args.target}`)
}

const presentation = await upsertPresetInheritance(config, {
  target: result.target,
  source: result.source,
  keepTargetHero: args.keepTargetHero,
})

console.log(
  JSON.stringify(
    {
      copiedProducts: result.copied,
      source: result.source.slug,
      target: result.target.slug,
      inheritedPreset: presentation?.theme_overrides?.inheritPreset ?? result.source.slug,
      heroImage: presentation?.hero_image_url ?? null,
      keepTargetHero: args.keepTargetHero,
    },
    null,
    2,
  ),
)
