function normalizePhone(value) {
  return String(value ?? '').replace(/[^\d+]/g, '').trim()
}

export class SupabaseOrderRepository {
  constructor(config) {
    this.config = config
  }

  async createOrder(accountId, payload) {
    const restaurant = await this.fetchRestaurant(accountId)

    if (!restaurant) {
      return null
    }

    const customer = await this.upsertCustomer(restaurant, payload.customer)
    const conversation = await this.ensureWhatsappConversation(restaurant, customer)
    const subtotal = payload.items.reduce(
      (total, item) => total + Number(item.unitPrice ?? 0) * Number(item.quantity ?? 0),
      0,
    )
    const shouldChargeDelivery = payload.deliveryType === 'delivery'
    const deliveryFee = shouldChargeDelivery ? Number(restaurant.delivery_fee ?? 0) : 0
    const total = subtotal + deliveryFee

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
            items: payload.items,
          },
        },
      ]),
    })

    await this.request('/items_pedido', {
      method: 'POST',
      headers: {
        Prefer: 'return=representation',
      },
      body: JSON.stringify(
        payload.items.map((item) => ({
          pedido_id: pedido.id,
          product_id: item.productId || null,
          name: item.name,
          price: item.unitPrice,
          quantity: item.quantity,
          notes: item.notes || null,
        })),
      ),
    })

    const confirmationMessage = this.buildWhatsappConfirmation({
      orderNumber: pedido.order_number,
      restaurant,
      customer,
      items: payload.items,
      total,
      deliveryType: payload.deliveryType,
      paymentMethod: payload.paymentMethod,
      address: payload.customer.address,
      notes: payload.notes,
    })

    await this.createOutgoingWhatsappMessage(conversation.id, confirmationMessage)
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
    }
  }

  async fetchRestaurant(accountId) {
    const rows = await this.request(
      `/restaurants?slug=eq.${encodeURIComponent(accountId)}&select=id,slug,name,delivery_fee,city&limit=1`,
    )

    return rows[0] ?? null
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

  buildWhatsappConfirmation({ orderNumber, restaurant, customer, items, total, deliveryType, paymentMethod, address, notes }) {
    const lines = items.map((item) => {
      const itemTotal = Number(item.unitPrice ?? 0) * Number(item.quantity ?? 0)
      const noteText = item.notes ? ` (${item.notes})` : ''
      return `- ${item.quantity} x ${item.name}${noteText}: $${this.formatMoney(itemTotal)}`
    })

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
      '',
      deliveryLine,
      `Pago: ${paymentLabel}`,
      notes ? `Notas: ${notes}` : null,
      `Total: $${this.formatMoney(total)}`,
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
    await this.request('/mensajes', {
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
