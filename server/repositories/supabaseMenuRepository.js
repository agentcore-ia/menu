const fallbackImages = [
  '/dishes/brioche.svg',
  '/dishes/croquetas.svg',
  '/dishes/hummus.svg',
  '/dishes/panajo.svg',
  '/dishes/lomo.svg',
  '/dishes/ravioles.svg',
  '/dishes/volcan.svg',
  '/dishes/tonica.svg',
]

export class SupabaseMenuRepository {
  constructor(config) {
    this.config = config
  }

  async getMenuByAccountId(accountId) {
    const restaurant = await this.fetchRestaurant(accountId)

    if (!restaurant) {
      return null
    }

    const products = await this.fetchProducts(restaurant.id)
    const categories = this.groupProductsByCategory(products)

    return {
      accountId: restaurant.slug,
      accountName: restaurant.name,
      currency: 'USD',
      locale: 'es',
      categories,
    }
  }

  async fetchRestaurant(accountId) {
    const rows = await this.request(
      `/restaurants?slug=eq.${encodeURIComponent(accountId)}&select=*`,
    )

    return rows[0] ?? null
  }

  async fetchProducts(restaurantId) {
    return this.request(
      `/products?restaurant_id=eq.${restaurantId}&available=eq.true&select=*&order=category.asc,name.asc`,
    )
  }

  groupProductsByCategory(products) {
    const groups = new Map()

    products.forEach((product, index) => {
      const categoryName = product.category?.trim() || 'Menu'
      const categoryId = this.slugify(categoryName)

      if (!groups.has(categoryId)) {
        groups.set(categoryId, {
          id: categoryId,
          label: categoryName,
          items: [],
        })
      }

      groups.get(categoryId).items.push({
        id: product.id,
        name: product.name,
        description: product.description ?? '',
        price: this.formatPrice(product.price),
        image: product.image_url || fallbackImages[index % fallbackImages.length],
        video: null,
        badge: categoryName,
        dietary: [],
      })
    })

    return [...groups.values()]
  }

  formatPrice(price) {
    if (typeof price !== 'number') {
      return '$0'
    }

    const normalized = Number.isInteger(price) ? price : Number(price.toFixed(2))
    return `$${normalized.toLocaleString('es-AR')}`
  }

  slugify(value) {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
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
      throw new Error(`Supabase error: ${response.status} ${detail}`)
    }

    return response.json()
  }
}
