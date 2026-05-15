import {
  isMissingSupabaseRelationError,
  mapLoyaltySettingsRow,
  mapRewardRow,
  normalizePhone,
  parseInteger,
} from './loyaltyUtils.js'

export class SupabaseLoyaltyRepository {
  constructor(config) {
    this.config = config
  }

  async getLoyaltyByAccountId(accountId, phone) {
    const restaurant = await this.fetchRestaurant(accountId)

    if (!restaurant) {
      return null
    }

    const normalizedPhone = normalizePhone(phone)
    const [settings, rewards, account] = await Promise.all([
      this.fetchLoyaltySettings(restaurant.id),
      this.fetchRewards(restaurant.id),
      normalizedPhone ? this.fetchAccountByPhone(restaurant.id, normalizedPhone) : null,
    ])

    return {
      accountId: restaurant.slug,
      accountName: restaurant.name,
      settings,
      customer: account
        ? {
            phone: account.phone,
            name: account.customerName,
          }
        : null,
      balance: account?.pointsBalance ?? 0,
      rewards: rewards.map((reward) => ({
        ...reward,
        redeemable: settings.allowRedemption && (account?.pointsBalance ?? 0) >= reward.pointsCost,
      })),
    }
  }

  async fetchRestaurant(accountId) {
    const rows = await this.request(
      `/restaurants?slug=eq.${encodeURIComponent(accountId)}&select=id,slug,name&limit=1`,
    )
    return rows[0] ?? null
  }

  async fetchLoyaltySettings(restaurantId) {
    try {
      const rows = await this.request(
        `/restaurant_loyalty_settings?restaurant_id=eq.${restaurantId}&select=*&limit=1`,
      )
      return mapLoyaltySettingsRow(rows[0] ?? null)
    } catch (error) {
      if (isMissingSupabaseRelationError(error, 'restaurant_loyalty_settings')) {
        return mapLoyaltySettingsRow(null)
      }

      throw error
    }
  }

  async fetchRewards(restaurantId) {
    try {
      const rows = await this.request(
        `/restaurant_loyalty_rewards?restaurant_id=eq.${restaurantId}&is_active=eq.true&select=*&order=sort_order.asc,created_at.asc`,
      )
      const productIds = rows.map((row) => row.product_id).filter(Boolean)
      const productMap = productIds.length ? await this.fetchProductsMapByIds(productIds) : new Map()

      return rows
        .map((row) => {
          const reward = mapRewardRow(row)

          if (!reward) {
            return null
          }

          const product = reward.productId ? productMap.get(reward.productId) : null

          return {
            ...reward,
            title: reward.title || product?.name || 'Canje',
            imageUrl: reward.imageUrl || product?.image_url || null,
            videoUrl: reward.videoUrl || product?.video_url || null,
          }
        })
        .filter(Boolean)
    } catch (error) {
      if (isMissingSupabaseRelationError(error, 'restaurant_loyalty_rewards')) {
        return []
      }

      throw error
    }
  }

  async fetchAccountByPhone(restaurantId, phone) {
    try {
      const rows = await this.request(
        `/customer_loyalty_accounts?restaurant_id=eq.${restaurantId}&phone=eq.${encodeURIComponent(phone)}&select=*&limit=1`,
      )
      const row = rows[0] ?? null

      if (!row) {
        return null
      }

      return {
        phone: row.phone,
        customerName: row.customer_name ?? null,
        pointsBalance: parseInteger(row.points_balance, 0),
      }
    } catch (error) {
      if (isMissingSupabaseRelationError(error, 'customer_loyalty_accounts')) {
        return null
      }

      throw error
    }
  }

  async fetchProductsMapByIds(productIds) {
    const rows = await this.request(
      `/products?id=in.(${productIds.join(',')})&select=id,name,image_url,video_url`,
    )

    return new Map(rows.map((row) => [row.id, row]))
  }

  async request(path) {
    const response = await fetch(`${this.config.supabaseUrl}/rest/v1${path}`, {
      headers: {
        apikey: this.config.supabaseApiKey,
        Authorization: `Bearer ${this.config.supabaseApiKey}`,
      },
    })

    if (!response.ok) {
      const detail = await response.text()
      throw new Error(`Supabase loyalty error: ${response.status} ${detail}`)
    }

    return response.json()
  }
}
