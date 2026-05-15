import { resolveMenuPresentation } from './menuPresentation.js'

function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function mergeDeep(base, override) {
  if (!isObject(base) || !isObject(override)) {
    return override ?? base
  }

  const result = { ...base }

  for (const [key, value] of Object.entries(override)) {
    if (isObject(value) && isObject(base[key])) {
      result[key] = mergeDeep(base[key], value)
    } else if (value !== undefined && value !== null) {
      result[key] = value
    }
  }

  return result
}

function isEmptyConfigValue(value) {
  return value === '' || value === undefined || value === null
}

const defaultAdminThemeValues = {
  id: 'ivory-olive',
  background: '#f4efe6',
  surface: '#fffdfa',
  surfaceAlt: '#f8f4ec',
  text: '#1b1b18',
  muted: 'rgba(27, 27, 24, 0.72)',
  primary: '#445d39',
  primaryText: '#fffdf8',
  accent: '#4f6546',
  border: 'rgba(96, 91, 74, 0.12)',
  shadow: 'rgba(45, 38, 24, 0.08)',
  displayFont: 'Cormorant Garamond',
  bodyFont: 'Manrope',
}
const defaultAdminHeroImage = '/dishes/hero-clean-cut.png'

function sanitizePresentationConfig(preset, config, options = {}) {
  if (!config) {
    return null
  }

  const sanitized = structuredClone(config)
  const shouldProtectPreset = Boolean(options.protectPreset)

  if (
    shouldProtectPreset &&
    preset.template &&
    sanitized.template &&
    sanitized.template !== preset.template
  ) {
    delete sanitized.template
  }

  if (
    shouldProtectPreset &&
    preset.layout &&
    sanitized.layout &&
    sanitized.layout !== preset.layout
  ) {
    delete sanitized.layout
  }

  if (
    shouldProtectPreset &&
    preset.cards?.style &&
    sanitized.cards?.style &&
    sanitized.cards.style !== preset.cards.style
  ) {
    delete sanitized.cards.style
  }

  if (
    shouldProtectPreset &&
    preset.preview?.productMedia &&
    sanitized.preview?.productMedia === 'image-with-video-chip' &&
    sanitized.preview.productMedia !== preset.preview.productMedia
  ) {
    delete sanitized.preview.productMedia
  }

  for (const section of ['branding', 'theme', 'hero', 'cards', 'preview']) {
    if (!isObject(sanitized[section])) {
      continue
    }

    sanitized[section] = Object.fromEntries(
      Object.entries(sanitized[section]).filter(([, value]) => !isEmptyConfigValue(value)),
    )
  }

  if (
    preset.hero?.image &&
    sanitized.hero?.image === defaultAdminHeroImage &&
    sanitized.hero.image !== preset.hero.image
  ) {
    delete sanitized.hero.image
  }

  if (preset.theme?.id !== defaultAdminThemeValues.id && isObject(sanitized.theme)) {
    sanitized.theme = Object.fromEntries(
      Object.entries(sanitized.theme).filter(
        ([key, value]) => defaultAdminThemeValues[key] !== value,
      ),
    )
  }

  return sanitized
}

export function enrichMenu(menu) {
  const inheritedPreset = menu.presentationConfig?.theme?.inheritPreset
  const requestedLayout = menu.presentationConfig?.layout
  const usesExplicitLayoutPreset = Boolean(!inheritedPreset && requestedLayout && requestedLayout !== 'editorial')
  const preset = resolveMenuPresentation(
    inheritedPreset || (usesExplicitLayoutPreset ? requestedLayout : menu.accountId),
  )
  const presentationConfig = sanitizePresentationConfig(preset, menu.presentationConfig, {
    protectPreset: Boolean(inheritedPreset || !usesExplicitLayoutPreset),
  })
  const presentation = presentationConfig ? mergeDeep(preset, presentationConfig) : preset

  return {
    ...menu,
    presentation,
    presentationConfig: undefined,
  }
}
