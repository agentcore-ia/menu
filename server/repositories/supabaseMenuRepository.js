import {
  isMissingSupabaseRelationError,
  mapLoyaltySettingsRow,
  mapRewardRow,
} from './loyaltyUtils.js'

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

const DELETED_MENU_THEME_ID = 'menu-deleted'
const INHERITED_THEME_PREFIX = 'inherits-'

function getInheritedPresetFromThemeId(themeId) {
  if (typeof themeId !== 'string' || !themeId.startsWith(INHERITED_THEME_PREFIX)) {
    return undefined
  }

  return themeId.slice(INHERITED_THEME_PREFIX.length) || undefined
}

function getProductVideo(product) {
  return (
    product.video_url ||
    product.preview_video_url ||
    product.media_video_url ||
    product.video ||
    null
  )
}

function getPizzeriaFallbackImage(accountId, product, index) {
  if (!['la-esquina', 'laesquina', 'laesquinacba'].includes(accountId)) {
    return null
  }

  const category = String(product.category ?? '').toLowerCase()

  if (category.includes('pizza')) return '/dishes/pizza.jpg'
  if (category.includes('empanada')) return '/dishes/bruschetta.jpg'
  if (category.includes('hamburg')) return '/dishes/hero-steak.jpg'
  if (category.includes('bebida')) return '/dishes/lemonade.jpg'

  return fallbackImages[index % fallbackImages.length]
}

function getBurgerFallbackImage(accountId, product, index) {
  if (!['burguer', 'burger', 'brasa', 'el-club'].includes(accountId)) {
    return null
  }

  const category = String(product.category ?? '').toLowerCase()

  if (category.includes('bebida')) return '/burger/drink.svg'
  if (category.includes('postre')) return '/burger/dessert.svg'
  if (category.includes('combo')) return '/burger/burger-2.svg'
  if (category.includes('entrada')) return '/burger/burger-3.svg'
  if (category.includes('hamburg') || category.includes('burger')) {
    return `/burger/burger-${(index % 3) + 1}.svg`
  }

  return `/burger/burger-${(index % 3) + 1}.svg`
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

    const [products, presentationConfig, loyalty] = await Promise.all([
      this.fetchProducts(restaurant.id),
      this.fetchPresentationConfig(restaurant.id),
      this.fetchLoyaltyProgram(restaurant.id),
    ])

    if (presentationConfig?.isDeleted) {
      return null
    }

    this.accountIdForFallback = presentationConfig?.theme?.inheritPreset || restaurant.slug
    const categories = this.groupProductsByCategory(products)

    return {
      accountId: restaurant.slug,
      accountName: restaurant.name,
      currency: 'USD',
      locale: 'es',
      presentationConfig,
      categories,
      loyalty,
    }
  }

  async fetchRestaurant(accountId) {
    const slug = this.slugify(accountId)
    const exactRows = await this.request(
      `/restaurants?slug=eq.${encodeURIComponent(slug)}&select=*&limit=1`,
    )

    if (exactRows[0]) {
      return exactRows[0]
    }

    const insensitiveRows = await this.request(
      `/restaurants?slug=ilike.${encodeURIComponent(slug)}&select=*&limit=1`,
    )

    return insensitiveRows[0] ?? null
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

  async fetchLoyaltyProgram(restaurantId) {
    try {
      const [settingsRows, rewardRows] = await Promise.all([
        this.request(
          `/restaurant_loyalty_settings?restaurant_id=eq.${restaurantId}&select=*&limit=1`,
        ),
        this.request(
          `/restaurant_loyalty_rewards?restaurant_id=eq.${restaurantId}&is_active=eq.true&select=*&order=sort_order.asc,created_at.asc`,
        ),
      ])

      const productIds = rewardRows.map((row) => row.product_id).filter(Boolean)
      const productMap = productIds.length
        ? await this.fetchProductsMapByIds(productIds)
        : new Map()

      return {
        settings: mapLoyaltySettingsRow(settingsRows[0] ?? null),
        rewards: rewardRows
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
          .filter(Boolean),
      }
    } catch (error) {
      if (
        isMissingSupabaseRelationError(error, 'restaurant_loyalty_settings') ||
        isMissingSupabaseRelationError(error, 'restaurant_loyalty_rewards')
      ) {
        return {
          settings: mapLoyaltySettingsRow(null),
          rewards: [],
        }
      }

      throw error
    }
  }

  groupProductsByCategory(products) {
    const groups = new Map()

    products.forEach((product, index) => {
      const categoryName = product.category?.trim() || 'Menu'
      const categoryId = this.slugify(categoryName)
      const customImage = String(product.image_url ?? '').trim()

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
        image:
          customImage ||
          getBurgerFallbackImage(this.accountIdForFallback, product, index) ||
          getPizzeriaFallbackImage(this.accountIdForFallback, product, index) ||
          fallbackImages[index % fallbackImages.length],
        hasCustomImage: Boolean(customImage),
        video: getProductVideo(product),
        badge: categoryName,
        dietary: [],
      })
    })

    return [...groups.values()]
  }

  async fetchProductsMapByIds(productIds) {
    const rows = await this.request(
      `/products?id=in.(${productIds.join(',')})&select=id,name,image_url,video_url`,
    )

    return new Map(rows.map((row) => [row.id, row]))
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
    const inheritedPreset =
      themeOverrides.inheritPreset || getInheritedPresetFromThemeId(config.theme_id)

    return {
      isDeleted: config.theme_id === DELETED_MENU_THEME_ID,
      template: config.layout || undefined,
      layout: config.layout || undefined,
      branding: {
        wordmark: config.branding_wordmark || undefined,
        subtitle: config.branding_subtitle || undefined,
      },
      theme: {
        ...themeOverrides,
        ...(inheritedPreset ? { inheritPreset: inheritedPreset } : {}),
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
