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
    const profile = account ? await this.fetchCustomerProfile(restaurant.id, account) : this.getEmptyProfile()

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
      profile,
      rewards: rewards.map((reward) => ({
        ...reward,
        redeemable: settings.allowRedemption && (account?.pointsBalance ?? 0) >= reward.pointsCost,
      })),
    }
  }

  async joinCommunityByAccountId(accountId, member) {
    const restaurant = await this.fetchRestaurant(accountId)

    if (!restaurant) {
      return null
    }

    const normalizedPhone = normalizePhone(member.phone)

    if (!normalizedPhone) {
      throw new Error('Ingresa un celular valido.')
    }

    const customerName = String(member.name ?? '').trim()
    const birthDate = String(member.birthDate ?? '').trim()
    const [settings, rewards] = await Promise.all([
      this.fetchLoyaltySettings(restaurant.id),
      this.fetchRewards(restaurant.id),
    ])
    const customer = await this.upsertCommunityCustomer(restaurant.id, {
      name: customerName,
      phone: normalizedPhone,
      birthDate,
    })
    const account = await this.upsertCommunityLoyaltyAccount(restaurant.id, customer, birthDate)
    const profile = await this.fetchCustomerProfile(restaurant.id, account)

    return {
      accountId: restaurant.slug,
      accountName: restaurant.name,
      settings,
      customer: {
        phone: account.phone,
        name: account.customerName,
        birthDate: account.birthDate ?? birthDate,
      },
      balance: account.pointsBalance ?? 0,
      profile,
      rewards: rewards.map((reward) => ({
        ...reward,
        redeemable: settings.allowRedemption && (account.pointsBalance ?? 0) >= reward.pointsCost,
      })),
    }
  }

  async fetchRestaurant(accountId) {
    const slug = slugify(accountId)
    const select = 'id,slug,name'
    const exactRows = await this.request(
      `/restaurants?slug=eq.${encodeURIComponent(slug)}&select=${select}&limit=1`,
    )

    if (exactRows[0]) {
      return exactRows[0]
    }

    const insensitiveRows = await this.request(
      `/restaurants?slug=ilike.${encodeURIComponent(slug)}&select=${select}&limit=1`,
    )
    return insensitiveRows[0] ?? null
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

      return this.mapLoyaltyAccountRow(row)
    } catch (error) {
      if (isMissingSupabaseRelationError(error, 'customer_loyalty_accounts')) {
        return null
      }

      throw error
    }
  }

  async upsertCommunityCustomer(restaurantId, member) {
    const rows = await this.request(
      `/clientes?restaurant_id=eq.${restaurantId}&phone=eq.${encodeURIComponent(member.phone)}&select=*&limit=1`,
    )
    const existing = rows[0] ?? null
    const payload = {
      restaurant_id: restaurantId,
      name: member.name || existing?.name || null,
      phone: member.phone,
    }
    const payloadWithBirthDate = member.birthDate
      ? {
          ...payload,
          birth_date: member.birthDate,
        }
      : payload

    if (existing) {
      const [updated] = await this.writeWithOptionalBirthDate(
        `/clientes?id=eq.${existing.id}`,
        {
          method: 'PATCH',
          headers: {
            Prefer: 'return=representation',
          },
          body: JSON.stringify(payloadWithBirthDate),
        },
        payload,
      )

      return updated
    }

    const [created] = await this.writeWithOptionalBirthDate(
      '/clientes',
      {
        method: 'POST',
        headers: {
          Prefer: 'return=representation',
        },
        body: JSON.stringify([payloadWithBirthDate]),
      },
      [payload],
    )

    return created
  }

  async upsertCommunityLoyaltyAccount(restaurantId, customer, birthDate) {
    const rows = await this.request(
      `/customer_loyalty_accounts?restaurant_id=eq.${restaurantId}&phone=eq.${encodeURIComponent(customer.phone)}&select=*&limit=1`,
    )
    const existing = rows[0] ?? null
    const payload = {
      restaurant_id: restaurantId,
      cliente_id: customer.id,
      phone: customer.phone,
      customer_name: customer.name || null,
      last_activity_at: new Date().toISOString(),
    }
    const payloadWithBirthDate = birthDate
      ? {
          ...payload,
          birth_date: birthDate,
        }
      : payload

    if (existing) {
      const [updated] = await this.writeWithOptionalBirthDate(
        `/customer_loyalty_accounts?id=eq.${existing.id}`,
        {
          method: 'PATCH',
          headers: {
            Prefer: 'return=representation',
          },
          body: JSON.stringify(payloadWithBirthDate),
        },
        payload,
      )

      return this.mapLoyaltyAccountRow(updated)
    }

    const [created] = await this.writeWithOptionalBirthDate(
      '/customer_loyalty_accounts',
      {
        method: 'POST',
        headers: {
          Prefer: 'return=representation',
        },
        body: JSON.stringify([payloadWithBirthDate]),
      },
      [payload],
    )

    return this.mapLoyaltyAccountRow(created)
  }

  async writeWithOptionalBirthDate(path, options, fallbackBody) {
    try {
      return await this.request(path, { ...options, write: true })
    } catch (error) {
      if (!String(error?.message ?? '').includes('birth_date')) {
        throw error
      }

      return this.request(path, {
        ...options,
        body: JSON.stringify(fallbackBody),
        write: true,
      })
    }
  }

  async fetchProductsMapByIds(productIds) {
    const rows = await this.request(
      `/products?id=in.(${productIds.join(',')})&select=id,name,image_url,video_url`,
    )

    return new Map(rows.map((row) => [row.id, row]))
  }

  async fetchCustomerProfile(restaurantId, account) {
    const [orders, transactions] = await Promise.all([
      this.fetchCustomerOrders(restaurantId, account),
      this.fetchLoyaltyTransactions(account),
    ])
    const redemptions = transactions.filter((transaction) => transaction.kind === 'redeem')

    return {
      summary: {
        totalOrders: orders.length,
        totalSpent: orders.reduce((total, order) => total + Number(order.total || 0), 0),
        totalPointsEarned: account.totalPointsEarned ?? 0,
        totalPointsRedeemed: account.totalPointsRedeemed ?? 0,
      },
      orders,
      transactions,
      redemptions,
    }
  }

  getEmptyProfile() {
    return {
      summary: {
        totalOrders: 0,
        totalSpent: 0,
        totalPointsEarned: 0,
        totalPointsRedeemed: 0,
      },
      orders: [],
      transactions: [],
      redemptions: [],
    }
  }

  async fetchCustomerOrders(restaurantId, account) {
    if (!account?.customerId && !account?.phone) {
      return []
    }

    const filters = []

    if (account.customerId) {
      filters.push(`cliente_id.eq.${account.customerId}`)
    }

    if (account.phone) {
      filters.push(`customer_phone.eq.${encodeURIComponent(account.phone)}`)
    }

    try {
      const rows = await this.request(
        `/pedidos?restaurant_id=eq.${restaurantId}&or=(${filters.join(',')})&select=id,order_number,status,total,subtotal,discount_amount,delivery_type,created_at&order=created_at.desc&limit=8`,
      )
      const orderIds = rows.map((row) => row.id).filter(Boolean)
      const itemsByOrderId = orderIds.length
        ? await this.fetchOrderItemsMap(orderIds)
        : new Map()

      return rows.map((row) => ({
        id: row.id,
        orderNumber: row.order_number ?? null,
        status: row.status ?? '',
        total: Number(row.total ?? 0),
        subtotal: Number(row.subtotal ?? 0),
        discountAmount: Number(row.discount_amount ?? 0),
        deliveryType: row.delivery_type ?? '',
        createdAt: row.created_at ?? null,
        items: itemsByOrderId.get(row.id) ?? [],
      }))
    } catch (error) {
      if (String(error?.message ?? '').includes('customer_phone') && account.customerId) {
        return this.fetchCustomerOrdersByCustomerId(restaurantId, account.customerId)
      }

      if (isMissingSupabaseRelationError(error, 'pedidos')) {
        return []
      }

      throw error
    }
  }

  async fetchCustomerOrdersByCustomerId(restaurantId, customerId) {
    try {
      const rows = await this.request(
        `/pedidos?restaurant_id=eq.${restaurantId}&cliente_id=eq.${customerId}&select=id,order_number,status,total,subtotal,discount_amount,delivery_type,created_at&order=created_at.desc&limit=8`,
      )
      const orderIds = rows.map((row) => row.id).filter(Boolean)
      const itemsByOrderId = orderIds.length
        ? await this.fetchOrderItemsMap(orderIds)
        : new Map()

      return rows.map((row) => ({
        id: row.id,
        orderNumber: row.order_number ?? null,
        status: row.status ?? '',
        total: Number(row.total ?? 0),
        subtotal: Number(row.subtotal ?? 0),
        discountAmount: Number(row.discount_amount ?? 0),
        deliveryType: row.delivery_type ?? '',
        createdAt: row.created_at ?? null,
        items: itemsByOrderId.get(row.id) ?? [],
      }))
    } catch (error) {
      if (isMissingSupabaseRelationError(error, 'pedidos')) {
        return []
      }

      throw error
    }
  }

  async fetchOrderItemsMap(orderIds) {
    try {
      const rows = await this.request(
        `/items_pedido?pedido_id=in.(${orderIds.join(',')})&select=pedido_id,name,quantity,price,notes`,
      )
      const map = new Map()

      rows.forEach((row) => {
        const items = map.get(row.pedido_id) ?? []
        items.push({
          name: row.name ?? 'Producto',
          quantity: parseInteger(row.quantity, 1),
          price: Number(row.price ?? 0),
          notes: row.notes ?? '',
        })
        map.set(row.pedido_id, items)
      })

      return map
    } catch (error) {
      if (isMissingSupabaseRelationError(error, 'items_pedido')) {
        return new Map()
      }

      throw error
    }
  }

  async fetchLoyaltyTransactions(account) {
    if (!account?.id) {
      return []
    }

    try {
      const rows = await this.request(
        `/customer_loyalty_transactions?account_id=eq.${account.id}&select=id,kind,points_delta,balance_after,description,metadata,created_at,reward_id&order=created_at.desc&limit=12`,
      )

      return rows.map((row) => ({
        id: row.id,
        kind: row.kind ?? '',
        pointsDelta: parseInteger(row.points_delta, 0),
        balanceAfter: parseInteger(row.balance_after, 0),
        description: row.description ?? '',
        metadata: row.metadata ?? null,
        rewardId: row.reward_id ?? null,
        createdAt: row.created_at ?? null,
      }))
    } catch (error) {
      if (isMissingSupabaseRelationError(error, 'customer_loyalty_transactions')) {
        return []
      }

      throw error
    }
  }

  mapLoyaltyAccountRow(row) {
    if (!row) {
      return null
    }

    return {
      id: row.id,
      customerId: row.cliente_id ?? null,
      phone: row.phone,
      customerName: row.customer_name ?? null,
      birthDate: row.birth_date ?? null,
      pointsBalance: parseInteger(row.points_balance, 0),
      totalPointsEarned: parseInteger(row.total_points_earned, 0),
      totalPointsRedeemed: parseInteger(row.total_points_redeemed, 0),
    }
  }

  async request(path, options = {}) {
    const apiKey = options.write
      ? this.config.supabaseWriteApiKey || this.config.supabaseApiKey
      : this.config.supabaseApiKey
    const fetchOptions = { ...options }
    delete fetchOptions.write
    const headers = {
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : null),
      ...(options.headers ?? {}),
    }
    const response = await fetch(`${this.config.supabaseUrl}/rest/v1${path}`, {
      ...fetchOptions,
      headers,
    })

    if (!response.ok) {
      const detail = await response.text()
      throw new Error(`Supabase loyalty error: ${response.status} ${detail}`)
    }

    return response.json()
  }
}

function slugify(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
