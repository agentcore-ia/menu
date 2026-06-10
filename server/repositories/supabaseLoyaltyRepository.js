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
      rewards: rewards.map((reward) => ({
        ...reward,
        redeemable: settings.allowRedemption && (account.pointsBalance ?? 0) >= reward.pointsCost,
      })),
    }
  }

  async getLoyaltyCommunityByAccountId(accountId) {
    const restaurant = await this.fetchRestaurant(accountId)

    if (!restaurant) {
      return null
    }

    const settings = await this.fetchLoyaltySettings(restaurant.id)

    if (!settings.enabled) {
      return {
        accountId: restaurant.slug,
        accountName: restaurant.name,
        settings,
        enabled: false,
        summary: {
          totalMembers: 0,
          totalActivePoints: 0,
          totalPointsEarned: 0,
          totalPointsRedeemed: 0,
          activeThisMonth: 0,
        },
        members: [],
      }
    }

    const accounts = await this.fetchCommunityAccounts(restaurant.id)
    const lastTransactionsByAccount = await this.fetchLastTransactionsByAccount(
      restaurant.id,
      accounts.map((account) => account.id),
    )
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const members = accounts.map((account, index) => {
      const lastTransaction = lastTransactionsByAccount.get(account.id) ?? null

      return {
        rank: index + 1,
        id: account.id,
        name: account.customerName || 'Cliente de la comunidad',
        phone: maskPhone(account.phone),
        phoneLast4: getPhoneLast4(account.phone),
        pointsBalance: account.pointsBalance,
        totalPointsEarned: account.totalPointsEarned,
        totalPointsRedeemed: account.totalPointsRedeemed,
        lastActivityAt: account.lastActivityAt,
        memberSince: account.createdAt,
        updatedAt: account.updatedAt,
        lastMovement: lastTransaction
          ? {
              kind: lastTransaction.kind,
              pointsDelta: lastTransaction.pointsDelta,
              balanceAfter: lastTransaction.balanceAfter,
              description: lastTransaction.description,
              createdAt: lastTransaction.createdAt,
            }
          : null,
      }
    })

    return {
      accountId: restaurant.slug,
      accountName: restaurant.name,
      settings,
      enabled: true,
      summary: {
        totalMembers: members.length,
        totalActivePoints: members.reduce((total, member) => total + member.pointsBalance, 0),
        totalPointsEarned: members.reduce((total, member) => total + member.totalPointsEarned, 0),
        totalPointsRedeemed: members.reduce((total, member) => total + member.totalPointsRedeemed, 0),
        activeThisMonth: members.filter((member) => {
          const activityDate = member.lastActivityAt ? new Date(member.lastActivityAt) : null
          return activityDate && activityDate >= monthStart
        }).length,
      },
      members,
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

      return {
        phone: row.phone,
        customerName: row.customer_name ?? null,
        birthDate: row.birth_date ?? null,
        pointsBalance: parseInteger(row.points_balance, 0),
      }
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

  async fetchCommunityAccounts(restaurantId) {
    try {
      const rows = await this.request(
        `/customer_loyalty_accounts?restaurant_id=eq.${restaurantId}&select=id,phone,customer_name,points_balance,total_points_earned,total_points_redeemed,last_activity_at,created_at,updated_at&order=points_balance.desc,last_activity_at.desc&limit=150`,
      )

      return rows.map((row) => ({
        id: row.id,
        phone: row.phone ?? '',
        customerName: row.customer_name ?? '',
        pointsBalance: parseInteger(row.points_balance, 0),
        totalPointsEarned: parseInteger(row.total_points_earned, 0),
        totalPointsRedeemed: parseInteger(row.total_points_redeemed, 0),
        lastActivityAt: row.last_activity_at ?? null,
        createdAt: row.created_at ?? null,
        updatedAt: row.updated_at ?? null,
      }))
    } catch (error) {
      if (isMissingSupabaseRelationError(error, 'customer_loyalty_accounts')) {
        return []
      }

      throw error
    }
  }

  async fetchLastTransactionsByAccount(restaurantId, accountIds) {
    if (!accountIds.length) {
      return new Map()
    }

    try {
      const rows = await this.request(
        `/customer_loyalty_transactions?restaurant_id=eq.${restaurantId}&account_id=in.(${accountIds.join(',')})&select=account_id,kind,points_delta,balance_after,description,created_at&order=created_at.desc&limit=300`,
      )
      const transactionsByAccount = new Map()

      rows.forEach((row) => {
        if (transactionsByAccount.has(row.account_id)) {
          return
        }

        transactionsByAccount.set(row.account_id, {
          kind: row.kind,
          pointsDelta: parseInteger(row.points_delta, 0),
          balanceAfter: parseInteger(row.balance_after, 0),
          description: row.description ?? '',
          createdAt: row.created_at ?? null,
        })
      })

      return transactionsByAccount
    } catch (error) {
      if (isMissingSupabaseRelationError(error, 'customer_loyalty_transactions')) {
        return new Map()
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

function getPhoneLast4(phone) {
  const digits = String(phone ?? '').replace(/\D/g, '')
  return digits.slice(-4)
}

function maskPhone(phone) {
  const digits = String(phone ?? '').replace(/\D/g, '')

  if (digits.length <= 4) {
    return digits || 'Sin telefono'
  }

  const prefix = digits.startsWith('549') ? '+54 9' : '+'
  return `${prefix} *** *** ${digits.slice(-4)}`
}
