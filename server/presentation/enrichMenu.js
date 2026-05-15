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
  const presentation = menu.presentationConfig ? mergeDeep(preset, menu.presentationConfig) : preset

  return {
    ...menu,
    presentation,
    presentationConfig: undefined,
  }
}
