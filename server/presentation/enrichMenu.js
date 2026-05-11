import { resolveMenuPresentation } from './menuPresentation.js'

export function enrichMenu(menu) {
  return {
    ...menu,
    presentation: resolveMenuPresentation(menu.accountId),
  }
}
