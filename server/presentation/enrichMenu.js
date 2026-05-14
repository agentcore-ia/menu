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

export function enrichMenu(menu) {
  const preset = resolveMenuPresentation(menu.accountId)
  const presentationConfig =
    ['pizzeria', 'burger'].includes(preset.template) && menu.presentationConfig
      ? {
          preview: menu.presentationConfig.preview,
        }
      : menu.presentationConfig

  const presentation = presentationConfig ? mergeDeep(preset, presentationConfig) : preset

  return {
    ...menu,
    presentation,
    presentationConfig: undefined,
  }
}
