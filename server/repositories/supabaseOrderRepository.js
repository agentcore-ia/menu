import {
  calculateEarnedPoints,
  isMissingSupabaseRelationError,
  mapLoyaltySettingsRow,
  normalizePhone,
  parseInteger,
} from './loyaltyUtils.js'
import { getBusinessOpenStatus } from '../../shared/businessHours.js'
import { resolveDeliveryQuote } from '../deliveryZones.js'

export class SupabaseOrderRepository {
  constructor(config) {
    this.config = config
  }

  async createOrder(accountId, payload) {
    const restaurant = await this.fetchRestaurant(accountId)

    if (!restaurant) {
      return null
    }

    if (restaurant.horarios?._settings?.orderTakingPaused === true) {
      const error = new Error(
        restaurant.horarios?._settings?.orderTakingPauseMessage ||
          'El local no esta tomando pedidos por ahora. Podes volver a intentar mas tarde.',
      )
      error.code = 'ORDER_TAKING_PAUSED'
      error.statusCode = 409
      error.ordering = {
        configured: true,
        isOpen: false,
        paused: true,
        message: error.message,
      }
      throw error
    }

    const orderingStatus = getBusinessOpenStatus(restaurant.horarios)

    if (orderingStatus.configured && !orderingStatus.isOpen) {
      const error = new Error(
        orderingStatus.message ||
          'El local esta cerrado ahora. Los pedidos se habilitan en horario de atencion.',
      )
      error.code = 'RESTAURANT_CLOSED'
      error.statusCode = 409
      error.ordering = orderingStatus
      throw error
    }

    const loyaltySettings = await this.fetchLoyaltySettings(restaurant.id)
    const customer = await this.upsertCustomer(restaurant, payload.customer)
    const conversation = await this.ensureWhatsappConversation(restaurant, customer)
    const orderProducts = Array.isArray(payload.items) ? payload.items : []
    await this.validateStockForOrder(restaurant, orderProducts)
    const subtotal = orderProducts.reduce(
      (total, item) => total + Number(item.unitPrice ?? 0) * Number(item.quantity ?? 0),
      0,
    )
    const redemptionPreview = await this.prepareRewardRedemptions({
      restaurant,
      customer,
      redemptions: payload.redemptions,
      loyaltySettings,
      subtotal,
    })
    const discountAmount = redemptionPreview?.discountAmount ?? 0
    const discountedSubtotal = Math.max(0, subtotal - discountAmount)
    const shouldChargeDelivery = payload.deliveryType === 'delivery'
    const deliveryQuote = shouldChargeDelivery
      ? await resolveDeliveryQuote({
          horarios: restaurant.horarios,
          fallbackFee: restaurant.delivery_fee,
          address: payload.customer?.address,
          neighborhood: payload.customer?.neighborhood,
          city: payload.customer?.city || restaurant.city,
          province: restaurant.horarios?._settings?.businessLocation?.province,
          originCoordinates: restaurant.horarios?._settings?.businessLocation ?? null,
          confirmed: Boolean(payload.deliveryQuote?.coordinates),
          coordinates: payload.deliveryQuote?.coordinates ?? null,
        })
      : null

    if (shouldChargeDelivery && deliveryQuote?.allowed === false) {
      const error = new Error(deliveryQuote.message || 'La direccion esta fuera del area de entrega.')
      error.code = 'DELIVERY_OUT_OF_AREA'
      error.statusCode = 422
      error.deliveryQuote = deliveryQuote
      throw error
    }

    const deliveryFee = shouldChargeDelivery ? Number(deliveryQuote?.fee ?? restaurant.delivery_fee ?? 0) : 0
    const total = discountedSubtotal + deliveryFee

    let resolvedTableId = null;
    let resolvedTableName = null;
    if (payload.mesa_id) {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(payload.mesa_id);
      if (isUUID) {
        resolvedTableId = payload.mesa_id;
      } else {
        try {
          const decodedName = decodeURIComponent(payload.mesa_id).toLowerCase().trim();
          const tablesResponse = await this.request(
            `/mesas?restaurant_id=eq.${restaurant.id}&select=id,name`,
            { method: 'GET' }
          );
          const matchedTable = (tablesResponse || []).find(t =>
            t.name?.toLowerCase().trim() === decodedName ||
            t.name?.toLowerCase().trim() === `mesa ${decodedName}` ||
            t.name?.toLowerCase().trim() === `mesa${decodedName}`
          );
          if (matchedTable) {
            resolvedTableId = matchedTable.id;
            resolvedTableName = matchedTable.name;
          } else {
            // No encontramos la mesa por UUID - guardamos al menos el nombre del param
            resolvedTableName = `Mesa ${decodeURIComponent(payload.mesa_id)}`;
          }
        } catch(e) {
          console.error('Error resolving table:', e);
          resolvedTableName = `Mesa ${payload.mesa_id}`;
        }
      }
    }

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
          discount_amount: discountAmount,
          discount_percent: redemptionPreview?.discountPercent ?? null,
          discount_label: redemptionPreview?.discountLabel ?? null,
          discount_source: discountAmount > 0 ? 'loyalty' : null,
          total,
          notes: resolvedTableName ? `Pedido de ${resolvedTableName}` : (payload.notes || null),
          customer_name: customer.name || payload.customer.name || null,
          customer_phone: customer.phone,
          source: payload.mesa_id ? 'qr_mesa' : 'menu_digital',
          table_id: resolvedTableId,
          transcription: {
            channel: payload.mesa_id ? 'qr_mesa' : 'menu_digital',
            mesa_name: resolvedTableName || null,
            customer: payload.customer,
            items: orderProducts,
            redemptions: redemptionPreview?.allRedemptions ?? redemptionPreview?.lineItems ?? [],
            deliveryQuote,
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

    try {
      await this.request('/items_pedido', {
        method: 'POST',
        headers: {
          Prefer: 'return=representation',
        },
        body: JSON.stringify(orderItems),
      })
    } catch (error) {
      await this.request(`/pedidos?id=eq.${pedido.id}`, {
        method: 'DELETE',
        headers: {
          Prefer: 'return=minimal',
        },
      }).catch(() => null)
      throw error
    }

    const mercadoPagoPreference = await this.createMercadoPagoPreferenceForOrder({
      pedido,
      paymentMethod: payload.paymentMethod,
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
      subtotal: discountedSubtotal,
      loyaltySettings,
      existingAccount: redemptionResult?.account ?? redemptionPreview?.account ?? null,
      startingBalance:
        redemptionResult?.balanceAfter ??
        redemptionPreview?.balanceAfter ??
        redemptionPreview?.account?.pointsBalance ??
        null,
    })

    const shouldNotifyCustomer = this.hasRealCustomerPhone(customer.phone)
    const confirmationMessage = shouldNotifyCustomer
      ? this.buildWhatsappConfirmation({
          orderNumber: pedido.order_number,
          restaurant,
          customer,
          items: orderProducts,
          redemptionItems: redemptionPreview?.lineItems ?? [],
          discountItems: redemptionPreview?.discountItems ?? [],
          total,
          deliveryType: payload.deliveryType,
          paymentMethod: payload.paymentMethod,
          address: payload.customer.address,
          notes: payload.notes,
          loyalty: loyaltyEarn,
          paymentLink: mercadoPagoPreference?.paymentLink,
        })
      : ''

    const whatsappMessage = shouldNotifyCustomer
      ? await this.createOutgoingWhatsappMessage(conversation.id, confirmationMessage)
      : null
    const whatsappDispatch = shouldNotifyCustomer
      ? await this.dispatchWhatsappWebhook({
          restaurant,
          customer,
          pedido,
          conversation,
          message: whatsappMessage,
          content: confirmationMessage,
          items: orderProducts,
          redemptionItems: redemptionPreview?.lineItems ?? [],
          discountItems: redemptionPreview?.discountItems ?? [],
          total,
          deliveryType: payload.deliveryType,
          paymentMethod: payload.paymentMethod,
          paymentLink: mercadoPagoPreference?.paymentLink,
        })
      : {
          status: 'skipped',
          reason: 'CUSTOMER_PHONE_NOT_PROVIDED',
        }
    await this.touchConversation(conversation.id)

    const customerWhatsapp = this.buildCustomerToBusinessWhatsapp({
      orderNumber: pedido.order_number,
      restaurant,
      customer,
      items: orderProducts,
      redemptionItems: redemptionPreview?.lineItems ?? [],
      discountItems: redemptionPreview?.discountItems ?? [],
      total,
      deliveryType: payload.deliveryType,
      paymentMethod: payload.paymentMethod,
      address: payload.customer.address,
      neighborhood: payload.customer.neighborhood,
      city: payload.customer.city,
      notes: payload.notes,
    })

    // Aviso del pedido al WhatsApp del dueno (locales sin computadora). El
    // dashboard decide si corresponde segun su configuracion; nunca puede
    // romper la creacion del pedido.
    void this.notifyOwnerOnDashboard(restaurant.id, pedido.id)

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
      customerWhatsapp,
      payment:
        payload.paymentMethod === 'mercado_pago'
          ? {
              provider: 'mercadopago',
              status: mercadoPagoPreference?.paymentLink ? 'pending' : 'failed',
              paymentLink: mercadoPagoPreference?.paymentLink ?? null,
              preferenceId: mercadoPagoPreference?.preferenceId ?? null,
              externalReference: mercadoPagoPreference?.externalReference ?? null,
              expiresAt: mercadoPagoPreference?.expiresAt ?? null,
              warning: mercadoPagoPreference?.warning ?? null,
            }
          : null,
      paymentLink: mercadoPagoPreference?.paymentLink ?? null,
      paymentWarning: mercadoPagoPreference?.warning ?? null,
    }
  }

  // Pide al dashboard que avise el pedido por WhatsApp al dueno. Se autentica
  // con la service key que este servicio ya tiene; si falla, el pedido igual
  // queda creado (el dashboard reintenta en su barrido).
  async notifyOwnerOnDashboard(restaurantId, orderId) {
    const baseUrl = String(this.config.dashboardUrl || '').replace(/\/+$/, '')
    const key = this.config.internalServiceKey
    if (!baseUrl || !key || !restaurantId || !orderId) return
    try {
      await fetch(`${baseUrl}/api/orders/notify-owner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-order-secret': key },
        body: JSON.stringify({ restaurantId, orderId, kind: 'new' }),
      })
    } catch {
      // el aviso nunca rompe la creacion del pedido
    }
  }

  async fetchRestaurant(accountId) {
    const slug = slugify(accountId)
    const select = 'id,slug,name,phone,delivery_fee,city,horarios,plan_code,stock_strict_mode'
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

  async upsertCustomer(restaurant, customer) {
    const rawPhone = String(customer.phone ?? '').trim()
    const normalizedPhone = rawPhone
      ? normalizePhone(rawPhone)
      : `menu-sin-telefono-${restaurant.slug}-${Date.now()}`

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

  async prepareRewardRedemptions({ restaurant, customer, redemptions, loyaltySettings, subtotal }) {
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
    })).map((item) => ({
      ...item,
      quantity: item.reward?.rewardType === 'discount' ? 1 : item.quantity,
    }))
    const hasDiscountOnly =
      selectedRewards.length > 0 &&
      selectedRewards.every((item) => item.reward.rewardType === 'discount') &&
      Number(subtotal || 0) <= 0

    if (hasDiscountOnly) {
      throw new Error('Agrega productos al pedido para poder usar un descuento.')
    }
    const totalPointsCost = selectedRewards.reduce(
      (sum, item) => sum + item.reward.pointsCost * item.quantity,
      0,
    )

    if (account.pointsBalance < totalPointsCost) {
      throw new Error('No alcanzan los puntos disponibles para completar el canje.')
    }

    const discountItems = selectedRewards
      .filter((item) => item.reward.rewardType === 'discount')
      .map((item) => {
        const amount = this.calculateRewardDiscountAmount(item.reward, subtotal)
        return {
          rewardId: item.reward.id,
          productId: null,
          quantity: 1,
          name: item.reward.title,
          notes: `Canje por ${item.reward.pointsCost} ${loyaltySettings.pointsName}`,
          discountType: item.reward.discountType,
          discountValue: item.reward.discountValue,
          discountMaxAmount: item.reward.discountMaxAmount,
          discountAmount: amount,
        }
      })
    const discountAmount = Math.min(
      Number(subtotal || 0),
      discountItems.reduce((sum, item) => sum + item.discountAmount, 0),
    )
    const discountPercent =
      discountItems.length === 1 && discountItems[0].discountType === 'percent'
        ? Math.round(Number(discountItems[0].discountValue || 0))
        : null
    const discountLabel =
      discountItems.length > 0 ? discountItems.map((item) => item.name).join(' + ') : null
    const productLineItems = selectedRewards
      .filter((item) => item.reward.rewardType !== 'discount')
      .map((item) => ({
        rewardId: item.reward.id,
        productId: item.reward.productId,
        quantity: item.quantity,
        name: item.reward.title,
        notes: `Canje por ${item.reward.pointsCost * item.quantity} ${loyaltySettings.pointsName}`,
      }))

    return {
      account,
      selectedRewards,
      totalPointsCost,
      balanceAfter: account.pointsBalance - totalPointsCost,
      lineItems: productLineItems,
      discountItems,
      discountAmount,
      discountPercent,
      discountLabel,
      allRedemptions: [...productLineItems, ...discountItems],
    }
  }

  async validateStockForOrder(restaurant, orderProducts) {
    try {
      const result = await this.rpc('validate_order_stock', {
        p_restaurant_id: restaurant.id,
        p_items: orderProducts.map((item) => ({
          productId: item.productId || null,
          name: item.name,
          quantity: Number(item.quantity || 0),
        })),
      })

      if (result && result.ok === false) {
        const error = new Error(result.message || 'No hay stock suficiente para completar el pedido.')
        error.code = 'OUT_OF_STOCK'
        error.statusCode = 409
        error.stock = result
        throw error
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      if (
        message.includes('validate_order_stock') ||
        message.includes('PGRST') ||
        message.includes('42P01') ||
        message.includes('42883')
      ) {
        return
      }

      throw error
    }
  }

  calculateRewardDiscountAmount(reward, subtotal) {
    const base = Math.max(0, Number(subtotal || 0))
    const value = Math.max(0, Number(reward.discountValue || 0))
    const maxAmount = Number(reward.discountMaxAmount || 0)
    let amount = reward.discountType === 'fixed'
      ? value
      : Math.round((base * value) / 100)

    if (maxAmount > 0) {
      amount = Math.min(amount, maxAmount)
    }

    return Math.min(base, Math.max(0, amount))
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
              reward_type: item.reward.rewardType,
              discount_type: item.reward.discountType,
              discount_value: item.reward.discountValue,
              discount_amount: item.reward.rewardType === 'discount'
                ? this.calculateRewardDiscountAmount(item.reward, pedido.subtotal)
                : 0,
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
    if (!loyaltySettings.enabled || !this.hasRealCustomerPhone(customer.phone)) {
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
        rewardType: row.reward_type === 'discount' ? 'discount' : 'product',
        title: row.title || productMap.get(row.product_id)?.name || 'Canje',
        pointsCost: parseInteger(row.points_cost, 0),
        discountType: row.discount_type === 'fixed' ? 'fixed' : row.discount_type === 'percent' ? 'percent' : null,
        discountValue: row.discount_value == null ? null : Number(row.discount_value),
        discountMaxAmount: row.discount_max_amount == null ? null : Number(row.discount_max_amount),
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
    discountItems,
    total,
    deliveryType,
    paymentMethod,
    address,
    notes,
    loyalty,
    paymentLink,
  }) {
    const isMenuOnlyPlan = restaurant.plan_code === 'menu'
    const lines = items.map((item) => {
      const itemTotal = Number(item.unitPrice ?? 0) * Number(item.quantity ?? 0)
      const noteText = item.notes ? ` (${item.notes})` : ''
      return `- ${item.quantity} x ${item.name}${noteText}: $${this.formatMoney(itemTotal)}`
    })
    const rewardLines = redemptionItems.map((item) => `- ${item.quantity} x ${item.name} (canje)`)
    const discountLines = (discountItems ?? []).map(
      (item) => `- ${item.name}: -$${this.formatMoney(item.discountAmount)}`,
    )

    const deliveryLine =
      deliveryType === 'mesa'
        ? 'Pedido desde la mesa'
        : deliveryType === 'delivery'
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
      discountLines.length ? '' : null,
      discountLines.length ? 'Descuentos:' : null,
      ...discountLines,
      '',
      deliveryLine,
      paymentLabel ? `Pago: ${paymentLabel}` : null,
      paymentLink ? `Link de pago: ${paymentLink}` : null,
      notes ? `Notas: ${notes}` : null,
      `Total: $${this.formatMoney(total)}`,
      loyalty?.pointsEarned
        ? `Ganaste ${loyalty.pointsEarned} ${loyalty.pointsEarned === 1 ? 'punto' : 'puntos'}.`
        : null,
      typeof loyalty?.balance === 'number' ? `Saldo actual: ${loyalty.balance} puntos.` : null,
      isMenuOnlyPlan ? null : '',
      isMenuOnlyPlan ? null : 'Te avisamos por este medio cuando avance.',
    ]
      .filter(Boolean)
      .join('\n')
  }

  buildCustomerToBusinessWhatsapp({
    orderNumber,
    restaurant,
  }) {
    const businessPhone = this.normalizeWhatsappDialNumber(restaurant.phone)

    if (!businessPhone) {
      return {
        status: 'missing_business_phone',
      }
    }

    const text = `Hola! Confirmo mi pedido #${orderNumber}.`

    return {
      status: 'ready',
      to: businessPhone,
      text,
      url: `https://api.whatsapp.com/send/?phone=${businessPhone}&text=${encodeURIComponent(text)}&type=phone_number&app_absent=0`,
    }
  }

  normalizeWhatsappDialNumber(value) {
    const digits = String(value ?? '').replace(/\D/g, '').replace(/^00/, '')

    if (!digits) {
      return ''
    }

    if (digits.startsWith('54') || digits.length <= 10 || digits.startsWith('0')) {
      return normalizePhone(digits)
    }

    return digits
  }

  formatPhoneDisplay(value) {
    if (!this.hasRealCustomerPhone(value)) {
      return 'Se envia desde este chat'
    }

    const digits = String(value ?? '').replace(/\D/g, '')
    return digits ? `+${digits}` : 'No informado'
  }

  hasRealCustomerPhone(value) {
    const phone = String(value ?? '')
    return phone && !phone.startsWith('menu-sin-telefono-')
  }

  getPaymentLabel(value) {
    if (value === 'mesa') return ''
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
    const isMenuOnlyPlan = restaurant.plan_code === 'menu'
    const rows = await this.request(
      `/conversaciones?restaurant_id=eq.${restaurant.id}&cliente_id=eq.${customer.id}&source=eq.whatsapp&select=*&limit=1`,
    )
    const existing = rows[0] ?? null

    if (existing) {
      if (isMenuOnlyPlan && (existing.ai_active !== false || existing.ai_mode !== 'disabled')) {
        const [updated] = await this.request(`/conversaciones?id=eq.${existing.id}`, {
          method: 'PATCH',
          headers: {
            Prefer: 'return=representation',
          },
          body: JSON.stringify({
            ai_active: false,
            ai_mode: 'disabled',
          }),
        })

        return updated
      }

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
          ai_active: !isMenuOnlyPlan,
          ai_mode: isMenuOnlyPlan ? 'disabled' : 'normal',
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
    discountItems,
    total,
    deliveryType,
    paymentMethod,
    paymentLink,
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
            planCode: restaurant.plan_code ?? null,
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
            paymentLink: paymentLink ?? null,
            items,
            redemptions: redemptionItems,
            discounts: discountItems ?? [],
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

  async createMercadoPagoPreferenceForOrder({ pedido, paymentMethod }) {
    if (paymentMethod !== 'mercado_pago') {
      return null
    }

    const baseUrl = String(this.config.dashboardUrl || '').replace(/\/+$/, '')
    const serviceKey = this.config.internalServiceKey || this.config.supabaseWriteApiKey

    if (!baseUrl || !serviceKey) {
      return {
        warning: 'No esta configurada la conexion interna para generar el link de Mercado Pago.',
      }
    }

    try {
      const response = await fetch(`${baseUrl}/api/payments/mercadopago/create-preference`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-capta-service-key': serviceKey,
        },
        body: JSON.stringify({
          orderId: pedido.id,
        }),
      })
      const text = await response.text()
      const data = text ? JSON.parse(text) : {}

      if (!response.ok) {
        throw new Error(data?.error || `Mercado Pago respondio ${response.status}`)
      }

      return {
        paymentLink: data.paymentLink ?? null,
        preferenceId: data.preferenceId ?? null,
        externalReference: data.externalReference ?? null,
        expiresAt: data.expiresAt ?? null,
      }
    } catch (error) {
      return {
        warning: error instanceof Error ? error.message : 'No se pudo generar el link de Mercado Pago.',
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

  async rpc(functionName, payload = {}) {
    const apiKey = this.config.supabaseWriteApiKey

    const response = await fetch(`${this.config.supabaseUrl}/rest/v1/rpc/${functionName}`, {
      method: 'POST',
      headers: {
        apikey: apiKey,
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const detail = await response.text()
      throw new Error(`Supabase order RPC error: ${response.status} ${detail}`)
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
