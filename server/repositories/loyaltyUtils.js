export const defaultLoyaltySettings = {
  enabled: false,
  pointsName: 'puntos',
  spendAmountStep: 1000,
  pointsPerStep: 1,
  minimumOrderTotal: 0,
  allowRedemption: true,
}

export function normalizePhone(value) {
  return String(value ?? '').replace(/[^\d+]/g, '').trim()
}

export function parseInteger(value, fallback = 0) {
  const parsed = Number.parseInt(String(value ?? ''), 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function parseAmount(value, fallback = 0) {
  const parsed = Number(value ?? fallback)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function isMissingSupabaseRelationError(error, relationName) {
  const message = error instanceof Error ? error.message : String(error ?? '')
  return (
    message.includes(relationName) ||
    message.includes('PGRST') ||
    message.includes('42P01')
  )
}

export function mapLoyaltySettingsRow(row) {
  if (!row) {
    return { ...defaultLoyaltySettings }
  }

  return {
    enabled: Boolean(row.enabled),
    pointsName: row.points_name || defaultLoyaltySettings.pointsName,
    spendAmountStep: parseAmount(row.spend_amount_step, defaultLoyaltySettings.spendAmountStep),
    pointsPerStep: parseInteger(row.points_per_step, defaultLoyaltySettings.pointsPerStep),
    minimumOrderTotal: parseAmount(
      row.minimum_order_total,
      defaultLoyaltySettings.minimumOrderTotal,
    ),
    allowRedemption:
      typeof row.allow_redemption === 'boolean'
        ? row.allow_redemption
        : defaultLoyaltySettings.allowRedemption,
  }
}

export function normalizeLoyaltySettingsInput(input) {
  return {
    enabled: Boolean(input?.enabled),
    points_name: String(input?.pointsName || defaultLoyaltySettings.pointsName).trim() || 'puntos',
    spend_amount_step: Math.max(1, parseAmount(input?.spendAmountStep, 1000)),
    points_per_step: Math.max(1, parseInteger(input?.pointsPerStep, 1)),
    minimum_order_total: Math.max(0, parseAmount(input?.minimumOrderTotal, 0)),
    allow_redemption: input?.allowRedemption !== false,
  }
}

export function calculateEarnedPoints(subtotal, settings) {
  if (!settings?.enabled) {
    return 0
  }

  const eligibleSubtotal = parseAmount(subtotal, 0)
  const minimumOrderTotal = Math.max(0, parseAmount(settings.minimumOrderTotal, 0))
  const spendAmountStep = Math.max(1, parseAmount(settings.spendAmountStep, 1))
  const pointsPerStep = Math.max(1, parseInteger(settings.pointsPerStep, 1))

  if (eligibleSubtotal < minimumOrderTotal) {
    return 0
  }

  return Math.max(0, Math.floor(eligibleSubtotal / spendAmountStep) * pointsPerStep)
}

export function mapRewardRow(row) {
  if (!row) {
    return null
  }

  return {
    id: row.id,
    restaurantId: row.restaurant_id,
    productId: row.product_id ?? null,
    title: row.title ?? '',
    description: row.description ?? '',
    pointsCost: parseInteger(row.points_cost, 0),
    imageUrl: row.image_url ?? null,
    isActive: row.is_active !== false,
    sortOrder: parseInteger(row.sort_order, 0),
    productName: row.product_name ?? null,
  }
}

export function normalizeRewardInput(input) {
  return {
    product_id: input?.productId || null,
    title: String(input?.title || '').trim() || null,
    description: String(input?.description || '').trim() || null,
    points_cost: Math.max(1, parseInteger(input?.pointsCost, 0)),
    image_url: String(input?.imageUrl || '').trim() || null,
    is_active: input?.isActive !== false,
    sort_order: Math.max(0, parseInteger(input?.sortOrder, 0)),
  }
}
