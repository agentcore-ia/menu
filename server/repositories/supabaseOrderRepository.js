import {
  calculateEarnedPoints,
  isMissingSupabaseRelationError,
  mapLoyaltySettingsRow,
  normalizePhone,
  parseInteger,
} from './loyaltyUtils.js'

export class SupabaseOrderRepository {
  constructor(config) {
    this.config = config
  }

  async createOrder(accountId, payload) {
    const restaurant = await this.fetchRestaurant(accountId)

    if (!restaurant) {
      return null
    }

    const loyaltySettings = await this.fetchLoyaltySettings(restaurant.id)
    const customer = await this.upsertCustomer(restaurant, payload.customer)
    const conversation = await this.ensureWhatsappConversation(restaurant, customer)
    const orderProducts = Array.isArray(payload.items) ? payload.items : []
    const subtotal = orderProducts.reduce(
      (total, item) => total + Number(item.unitPrice ?? 0) * Number(item.quantity ?? 0),
      0,
    )
    const shouldChargeDelivery = payload.deliveryType === 'delivery'
    const deliveryFee = shouldChargeDelivery ? Number(restaurant.delivery_fee ?? 0) : 0
    const total = subtotal + deliveryFee
    const redemptionPreview = await this.prepareRewardRedemptions({
      restaurant,
      customer,
      redemptions: payload.redemptions,
      loyaltySettings,
    })

    const [pedido] = await this.request('/pedidos', {
      method: 'POST',
      headers: {
        Prefer: 'return=representation',
      },
      body: JSON.stringify([
        {
          restaurant_id: restaurant.id,
          cliente_id: customer.id,
          conversacion_id: conversation.id,
          status: 'new',
          delivery_type: payload.deliveryType,
          payment_method: payload.paymentMethod,
          address: payload.customer.address || null,
          subtotal,
          delivery_fee: deliveryFee,
          total,
          notes: payload.notes || null,
          customer_name: customer.name || payload.customer.name || null,
          customer_phone: customer.phone,
          source: 'menu_digital',
          transcription: {
            channel: 'menu_digital',
            customer: payload.customer,
            items: orderProducts,
            redemptions: redemptionPreview?.lineItems ?? [],
          },
        },
      ]),
    })

    const orderItems = [
      ...orderProducts.map((item) => ({
        pedido_id: pedido.id,
        product_id: item.productId || null,
        name: item.name,
        price: item.unitPrice,
        quantity: item.quantity,
        notes: item.notes || null,
      })),
      ...(redemptionPreview?.lineItems ?? []).map((item) => ({
        pedido_id: pedido.id,
        product_id: item.productId || null,
        name: item.name,
        price: 0,
        quantity: item.quantity,
        notes: item.notes || null,
      })),
    ]

    await this.request('/items_pedido', {
      method: 'POST',
      headers: {
        Prefer: 'return=representation',
      },
      body: JSON.stringify(orderItems),
    })

    const redemptionResult = await this.commitRewardRedemptions({
      preview: redemptionPreview,
      restaurant,
      customer,
      pedido,
    })

    const loyaltyEarn = await this.applyLoyaltyEarn({
      restaurant,
      customer,
      pedido,
      subtotal,
      loyaltySettings,
      existingAccount: redemptionResult?.account ?? redemptionPreview?.account ?? null,
      startingBalance:
        redemptionResult?.balanceAfter ??
        redemptionPreview?.balanceAfter ??
        redemptionPreview?.account?.pointsBalance ??
        null,
    })

    const confirmationMessage = this.buildWhatsappConfirmation({
      orderNumber: pedido.order_number,
      restaurant,
      customer,
      items: orderProducts,
      redemptionItems: redemptionPreview?.lineItems ?? [],
      total,
      deliveryType: payload.deliveryType,
      paymentMethod: payload.paymentMethod,
      address: payload.customer.address,
      notes: payload.notes,
      loyalty: loyaltyEarn,
    })

    const whatsappMessage = await this.createOutgoingWhatsappMessage(
      conversation.id,
      confirmationMessage,
    )
    const whatsappDispatch = await this.dispatchWhatsappWebhook({
      restaurant,
      customer,
      pedido,
      conversation,
      message: whatsappMessage,
      content: confirmationMessage,
      items: orderProducts,
      redemptionItems: redemptionPreview?.lineItems ?? [],
      total,
      deliveryType: payload.deliveryType,
      paymentMethod: payload.paymentMethod,
    })
    await this.touchConversation(conversation.id)

    return {
      id: pedido.id,
      orderNumber: pedido.order_number,
      status: pedido.status,
      total,
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
      },
      loyalty: loyaltyEarn
        ? {
            enabled: true,
            pointsName: loyaltySettings.pointsName,
            pointsEarned: loyaltyEarn.pointsEarned,
            balance: loyaltyEarn.balance,
          }
        : {
            enabled: Boolean(loyaltySettings?.enabled),
            pointsName: loyaltySettings?.pointsName ?? 'puntos',
            pointsEarned: 0,
            balance:
              redemptionResult?.balanceAfter ??
              redemptionPreview?.balanceAfter ??
              redemptionPreview?.account?.pointsBalance ??
              0,
          },
      whatsapp: whatsappDispatch,
    }
  }

  async fetchRestaurant(accountId) {
    const rows = await this.request(
      `/restaurants?slug=eq.${encodeURIComponent(accountId)}&select=id,slug,name,delivery_fee,city&limit=1`,
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

  async upsertCustomer(restaurant, customer) {
    const normalizedPhone = normalizePhone(customer.phone)

    const existingRows = await this.request(
      `/clientes?restaurant_id=eq.${restaurant.id}&phone=eq.${encodeURIComponent(normalizedPhone)}&select=*&limit=1`,
    )
    const existing = existingRows[0] ?? null
    const customerPayload = {
      restaurant_id: restaurant.id,
      name: customer.name || existing?.name || null,
      phone: normalizedPhone,
      address: customer.address || existing?.address || null,
      neighborhood: customer.neighborhood || existing?.neighborhood || null,
      city: customer.city || existing?.city || restaurant.city || null,
      last_order_at: new Date().toISOString(),
    }

    if (existing) {
      const [updated] = await this.request(`/clientes?id=eq.${existing.id}`, {
        method: 'PATCH',
        headers: {
          Prefer: 'return=representation',
        },
        body: JSON.stringify(customerPayload),
      })

      return updated
    }

    const [created] = await this.request('/clientes', {
      method: 'POST',
      headers: {
        Prefer: 'return=representation',
      },
      body: JSON.stringify([customerPayload]),
    })

    return created
  }

  async prepareRewardRedemptions({ restaurant, customer, redemptions, loyaltySettings }) {
    if (!loyaltySettings.enabled || loyaltySettings.allowRedemption === false) {
      return null
    }

    if (!Array.isArray(redemptions) || redemptions.length === 0) {
      return null
    }

    const normalized = redemptions
      .map((redemption) => ({
        rewardId: redemption.rewardId || redemption.id || null,
        quantity: Math.max(1, parseInteger(redemption.quantity, 1)),
      }))
      .filter((redemption) => redemption.rewardId)

    if (!normalized.length) {
      return null
    }

    const rewards = await this.fetchRewardsByIds(restaurant.id, normalized.map((item) => item.rewardId))

    if (rewards.length !== normalized.length) {
      throw new Error('Uno o mas premios seleccionados ya no estan disponibles para canje.')
    }

    const account = await this.fetchLoyaltyAccountByPhone(restaurant.id, customer.phone)

    if (!account) {
      throw new Error('El numero todavia no tiene puntos acumulados para canjear.')
    }

    const rewardsById = new Map(rewards.map((reward) => [reward.id, reward]))
    const selectedRewards = normalized.map((item) => ({
      ...item,
      reward: rewardsById.get(item.rewardId),
    }))
    const totalPointsCost = selectedRewards.reduce(
      (sum, item) => sum + item.reward.pointsCost * item.quantity,
      0,
    )

    if (account.pointsBalance < totalPointsCost) {
      throw new Error('No alcanzan los puntos disponibles para completar el canje.')
    }

    return {
      account,
      selectedRewards,
      totalPointsCost,
      balanceAfter: account.pointsBalance - totalPointsCost,
      lineItems: selectedRewards.map((item) => ({
        rewardId: item.reward.id,
        productId: item.reward.productId,
        quantity: item.quantity,
        name: item.reward.title,
        notes: `Canje por ${item.reward.pointsCost * item.quantity} ${loyaltySettings.pointsName}`,
      })),
    }
  }

  async commitRewardRedemptions({ preview, restaurant, customer, pedido }) {
    if (!preview) {
      return null
    }

    let runningBalance = preview.account.pointsBalance

    for (const item of preview.selectedRewards) {
      runningBalance -= item.reward.pointsCost * item.quantity

      await this.request('/customer_loyalty_transactions', {
        method: 'POST',
        headers: {
          Prefer: 'return=representation',
        },
        body: JSON.stringify([
          {
            account_id: preview.account.id,
            restaurant_id: restaurant.id,
            cliente_id: customer.id,
            pedido_id: pedido.id,
            reward_id: item.reward.id,
            kind: 'redeem',
            points_delta: -(item.reward.pointsCost * item.quantity),
            balance_after: runningBalance,
            description: `Canje de ${item.reward.title}`,
            metadata: {
              quantity: item.quantity,
              points_cost_per_unit: item.reward.pointsCost,
              source: 'menu_digital',
            },
          },
        ]),
      })
    }

    const [updatedAccount] = await this.request(`/customer_loyalty_accounts?id=eq.${preview.account.id}`, {
      method: 'PATCH',
      headers: {
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        points_balance: preview.balanceAfter,
        total_points_redeemed: preview.account.totalPointsRedeemed + preview.totalPointsCost,
        last_order_id: pedido.id,
        last_activity_at: new Date().toISOString(),
      }),
    })

    return {
      account: this.mapLoyaltyAccountRow(updatedAccount),
      balanceAfter: preview.balanceAfter,
      redeemedPoints: preview.totalPointsCost,
    }
  }

  async applyLoyaltyEarn({
    restaurant,
    customer,
    pedido,
    subtotal,
    loyaltySettings,
    existingAccount,
    startingBalance,
  }) {
    if (!loyaltySettings.enabled) {
      return null
    }

    const pointsEarned = calculateEarnedPoints(subtotal, loyaltySettings)
    const account =
      existingAccount ?? (await this.ensureLoyaltyAccount(restaurant.id, customer))
    const baseBalance =
      typeof startingBalance === 'number' ? startingBalance : account.pointsBalance
    const nextBalance = baseBalance + pointsEarned

    const [updatedAccount] = await this.request(`/customer_loyalty_accounts?id=eq.${account.id}`, {
      method: 'PATCH',
      headers: {
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        cliente_id: customer.id,
        customer_name: customer.name || account.customerName || null,
        last_order_id: pedido.id,
        last_activity_at: new Date().toISOString(),
        points_balance: nextBalance,
        total_points_earned: account.totalPointsEarned + pointsEarned,
      }),
    })

    if (pointsEarned > 0) {
      await this.request('/customer_loyalty_transactions', {
        method: 'POST',
        headers: {
          Prefer: 'return=representation',
        },
        body: JSON.stringify([
          {
            account_id: account.id,
            restaurant_id: restaurant.id,
            cliente_id: customer.id,
            pedido_id: pedido.id,
            kind: 'earn',
            points_delta: pointsEarned,
            balance_after: nextBalance,
            description: `Compra menu digital #${pedido.order_number}`,
            metadata: {
              subtotal,
              source: 'menu_digital',
            },
          },
        ]),
      })
    }

    return {
      accountId: account.id,
      pointsEarned,
      balance: nextBalance,
      account: this.mapLoyaltyAccountRow(updatedAccount),
    }
  }

  async fetchRewardsByIds(restaurantId, rewardIds) {
    try {
      const rows = await this.request(
        `/restaurant_loyalty_rewards?restaurant_id=eq.${restaurantId}&id=in.(${rewardIds.join(',')})&is_active=eq.true&select=*`,
      )

      const productIds = rows.map((row) => row.product_id).filter(Boolean)
      const productMap = productIds.length
        ? await this.fetchProductsMapByIds(productIds)
        : new Map()

      return rows.map((row) => ({
        id: row.id,
        productId: row.product_id ?? null,
        title: row.title || productMap.get(row.product_id)?.name || 'Canje',
        pointsCost: parseInteger(row.points_cost, 0),
      }))
    } catch (error) {
      if (isMissingSupabaseRelationError(error, 'restaurant_loyalty_rewards')) {
        throw new Error('El programa de puntos todavia no esta configurado para este restaurante.', {
          cause: error,
        })
      }

      throw error
    }
  }

  async fetchProductsMapByIds(productIds) {
    const rows = await this.request(
      `/products?id=in.(${productIds.join(',')})&select=id,name`,
    )

    return new Map(rows.map((row) => [row.id, row]))
  }

  async ensureLoyaltyAccount(restaurantId, customer) {
    const existing = await this.fetchLoyaltyAccountByPhone(restaurantId, customer.phone)

    if (existing) {
      return existing
    }

    const [created] = await this.request('/customer_loyalty_accounts', {
      method: 'POST',
      headers: {
        Prefer: 'return=representation',
      },
      body: JSON.stringify([
        {
          restaurant_id: restaurantId,
          cliente_id: customer.id,
          phone: customer.phone,
          customer_name: customer.name || null,
        },
      ]),
    })

    return this.mapLoyaltyAccountRow(created)
  }

  async fetchLoyaltyAccountByPhone(restaurantId, phone) {
    try {
      const rows = await this.request(
        `/customer_loyalty_accounts?restaurant_id=eq.${restaurantId}&phone=eq.${encodeURIComponent(phone)}&select=*&limit=1`,
      )

      return this.mapLoyaltyAccountRow(rows[0] ?? null)
    } catch (error) {
      if (isMissingSupabaseRelationError(error, 'customer_loyalty_accounts')) {
        return null
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
      customerName: row.customer_name ?? null,
      pointsBalance: parseInteger(row.points_balance, 0),
      totalPointsEarned: parseInteger(row.total_points_earned, 0),
      totalPointsRedeemed: parseInteger(row.total_points_redeemed, 0),
    }
  }

  buildWhatsappConfirmation({
    orderNumber,
    restaurant,
    customer,
    items,
    redemptionItems,
    total,
    deliveryType,
    paymentMethod,
    address,
    notes,
    loyalty,
  }) {
    const lines = items.map((item) => {
      const itemTotal = Number(item.unitPrice ?? 0) * Number(item.quantity ?? 0)
      const noteText = item.notes ? ` (${item.notes})` : ''
      return `- ${item.quantity} x ${item.name}${noteText}: $${this.formatMoney(itemTotal)}`
    })
    const rewardLines = redemptionItems.map((item) => `- ${item.quantity} x ${item.name} (canje)`)

    const deliveryLine =
      deliveryType === 'delivery'
        ? `Entrega: Delivery${address ? ` a ${address}` : ''}`
        : 'Entrega: Retiro en local'

    const paymentLabel = this.getPaymentLabel(paymentMethod)

    return [
      `Hola ${customer.name || 'cliente'}, recibimos tu pedido #${orderNumber} en ${restaurant.name}.`,
      '',
      'Detalle:',
      ...lines,
      rewardLines.length ? '' : null,
      rewardLines.length ? 'Canjes:' : null,
      ...rewardLines,
      '',
      deliveryLine,
      `Pago: ${paymentLabel}`,
      notes ? `Notas: ${notes}` : null,
      `Total: $${this.formatMoney(total)}`,
      loyalty?.pointsEarned
        ? `Ganaste ${loyalty.pointsEarned} ${loyalty.pointsEarned === 1 ? 'punto' : 'puntos'}.`
        : null,
      typeof loyalty?.balance === 'number' ? `Saldo actual: ${loyalty.balance} puntos.` : null,
      '',
      'Te avisamos por este medio cuando avance.',
    ]
      .filter(Boolean)
      .join('\n')
  }

  getPaymentLabel(value) {
    if (value === 'mercado_pago') return 'Mercado Pago'
    if (value === 'transferencia') return 'Transferencia'
    if (value === 'cash') return 'Efectivo'
    return value || 'No informado'
  }

  formatMoney(value) {
    return Number(value ?? 0).toLocaleString('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })
  }

  async ensureWhatsappConversation(restaurant, customer) {
    const rows = await this.request(
      `/conversaciones?restaurant_id=eq.${restaurant.id}&cliente_id=eq.${customer.id}&source=eq.whatsapp&select=*&limit=1`,
    )
    const existing = rows[0] ?? null

    if (existing) {
      return existing
    }

    const [created] = await this.request('/conversaciones', {
      method: 'POST',
      headers: {
        Prefer: 'return=representation',
      },
      body: JSON.stringify([
        {
          restaurant_id: restaurant.id,
          cliente_id: customer.id,
          status: 'active',
          ai_active: true,
          ai_mode: 'normal',
          source: 'whatsapp',
          last_message_at: new Date().toISOString(),
        },
      ]),
    })

    return created
  }

  async createOutgoingWhatsappMessage(conversationId, content) {
    const [created] = await this.request('/mensajes', {
      method: 'POST',
      headers: {
        Prefer: 'return=representation',
      },
      body: JSON.stringify([
        {
          conversacion_id: conversationId,
          content,
          type: 'text',
          sender: 'ai',
          read: false,
          pending_approval: false,
        },
      ]),
    })

    return created
  }

  async dispatchWhatsappWebhook({
    restaurant,
    customer,
    pedido,
    conversation,
    message,
    content,
    items,
    redemptionItems,
    total,
    deliveryType,
    paymentMethod,
  }) {
    if (!this.config.n8nWhatsappWebhookUrl) {
      return {
        status: 'skipped',
        reason: 'N8N_WEBHOOK_NOT_CONFIGURED',
      }
    }

    try {
      const response = await fetch(this.config.n8nWhatsappWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.n8nWebhookSecret
            ? { 'x-neurorest-webhook-secret': this.config.n8nWebhookSecret }
            : {}),
        },
        body: JSON.stringify({
          event: 'menu.order.whatsapp_confirmation',
          restaurant: {
            id: restaurant.id,
            slug: restaurant.slug,
            name: restaurant.name,
          },
          customer: {
            id: customer.id,
            name: customer.name,
            phone: customer.phone,
          },
          order: {
            id: pedido.id,
            number: pedido.order_number,
            total,
            deliveryType,
            paymentMethod,
            items,
            redemptions: redemptionItems,
          },
          conversation: {
            id: conversation.id,
          },
          message: {
            id: message?.id ?? null,
            content,
          },
          whatsapp: {
            to: customer.phone,
            text: content,
          },
        }),
      })

      if (!response.ok) {
        const detail = await response.text()
        throw new Error(`n8n webhook error: ${response.status} ${detail}`)
      }

      return {
        status: 'sent',
      }
    } catch (error) {
      return {
        status: 'failed',
        reason: error instanceof Error ? error.message : 'No se pudo disparar n8n.',
      }
    }
  }

  async touchConversation(conversationId) {
    await this.request(`/conversaciones?id=eq.${conversationId}`, {
      method: 'PATCH',
      headers: {
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        last_message_at: new Date().toISOString(),
      }),
    })
  }

  async request(path, options = {}) {
    const apiKey = this.config.supabaseWriteApiKey

    const response = await fetch(`${this.config.supabaseUrl}/rest/v1${path}`, {
      method: options.method ?? 'GET',
      headers: {
        apikey: apiKey,
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...(options.headers ?? {}),
      },
      body: options.body,
    })

    if (!response.ok) {
      const detail = await response.text()
      throw new Error(`Supabase order error: ${response.status} ${detail}`)
    }

    if (response.status === 204) {
      return []
    }

    return response.json()
  }
}
