const fallbackImages = [
  '/dishes/hero-steak.jpg',
  '/dishes/bruschetta.jpg',
  '/dishes/carpaccio.jpg',
  '/dishes/burrata.jpg',
  '/dishes/salmon.jpg',
  '/dishes/pasta.jpg',
  '/dishes/pizza.jpg',
  '/dishes/lemonade.jpg',
]

function getProductVideo(product) {
  return (
    product.video_url ||
    product.preview_video_url ||
    product.media_video_url ||
    product.video ||
    null
  )
}

export class SupabaseMenuRepository {
  constructor(config) {
    this.config = config
  }

  async getMenuByAccountId(accountId) {
    const restaurant = await this.fetchRestaurant(accountId)

    if (!restaurant) {
      return null
    }

    const [products, presentationConfig] = await Promise.all([
      this.fetchProducts(restaurant.id),
      this.fetchPresentationConfig(restaurant.id),
    ])
    const categories = this.groupProductsByCategory(products)

    return {
      accountId: restaurant.slug,
      accountName: restaurant.name,
      currency: 'USD',
      locale: 'es',
      presentationConfig,
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

  async fetchPresentationConfig(restaurantId) {
    try {
      const rows = await this.request(
        `/restaurant_menu_presentations?restaurant_id=eq.${restaurantId}&select=*&limit=1`,
      )

      return this.mapPresentationConfig(rows[0] ?? null)
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      if (
        message.includes('restaurant_menu_presentations') ||
        message.includes('PGRST') ||
        message.includes('42P01')
      ) {
        return null
      }

      throw error
    }
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
        unitPrice: Number(product.price ?? 0),
        price: this.formatPrice(product.price),
        image: product.image_url || fallbackImages[index % fallbackImages.length],
        video: getProductVideo(product),
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

  mapPresentationConfig(config) {
    if (!config) {
      return null
    }

    const themeOverrides =
      config.theme_overrides && typeof config.theme_overrides === 'object'
        ? config.theme_overrides
        : {}

    return {
      layout: config.layout || undefined,
      branding: {
        wordmark: config.branding_wordmark || undefined,
        subtitle: config.branding_subtitle || undefined,
      },
      theme: {
        ...themeOverrides,
        id: config.theme_id || themeOverrides.id || undefined,
      },
      hero: {
        image: config.hero_image_url || undefined,
        title: config.hero_title || undefined,
        accent: config.hero_accent || undefined,
        description: config.hero_description || undefined,
      },
      cards: {
        style: config.cards_style || undefined,
      },
      preview: {
        productMedia: config.preview_mode || undefined,
        autoplayVideos:
          typeof config.autoplay_videos === 'boolean' ? config.autoplay_videos : undefined,
        mutedVideos:
          typeof config.muted_videos === 'boolean' ? config.muted_videos : undefined,
      },
    }
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
