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
