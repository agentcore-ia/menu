import {
  isMissingSupabaseRelationError,
  mapLoyaltySettingsRow,
  mapRewardRow,
} from './loyaltyUtils.js'
import { getBusinessOpenStatus } from '../../shared/businessHours.js'
import { normalizeBusinessLocation } from '../deliveryZones.js'

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
const DAILY_MENU_LABEL = 'Menu del dia'

function getArgentinaDateValue(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))

  return `${values.year}-${values.month}-${values.day}`
}

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

function normalizeProductImageAnimation(value) {
  const normalized = String(value ?? '').trim()
  return ['zoom-loop', 'spin-loop', 'float-loop'].includes(normalized) ? normalized : 'none'
}

function parseProductOptionGroups(product) {
  if (!Array.isArray(product.option_groups)) {
    return []
  }

  return product.option_groups
    .map((group) => {
      const options = Array.isArray(group?.options)
        ? group.options
            .map((option) => ({
              id: option?.id || null,
              value: String(option?.value || option?.productId || option?.label || '').trim(),
              productId: option?.productId || null,
              label: String(option?.label || '').trim(),
              price: Number(option?.price || 0),
              image: String(option?.image || '').trim(),
              video: String(option?.video || '').trim(),
              subtitle: String(option?.subtitle || '').trim(),
            }))
            .filter((option) => option.label && option.value)
        : []

      if (!String(group?.title || '').trim() || options.length === 0) {
        return null
      }

      const selection = group?.selection === 'multiple' ? 'multiple' : 'single'
      const maxSelect =
        selection === 'multiple'
          ? group?.maxSelect && Number(group.maxSelect) > 0
            ? Number(group.maxSelect)
            : null
          : 1

      return {
        id: group?.id || `${String(group?.title || 'grupo').toLowerCase().replace(/\s+/g, '-')}`,
        title: String(group.title).trim(),
        required: Boolean(group?.required),
        selection,
        minSelect: Number(group?.minSelect || 0),
        maxSelect,
        options,
      }
    })
    .filter(Boolean)
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
  if (!['burguer', 'burger', 'brasa', 'el-club', 'blue-burger'].includes(accountId)) {
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

    const [products, presentationConfig, loyalty, stockAvailability, dailyMenu] = await Promise.all([
      this.fetchProducts(restaurant.id),
      this.fetchPresentationConfig(restaurant.id),
      this.fetchLoyaltyProgram(restaurant.id),
      this.fetchStockAvailability(restaurant.id),
      this.fetchDailyMenu(restaurant.id),
    ])

    if (presentationConfig?.isDeleted) {
      return null
    }

    this.accountIdForFallback =
      presentationConfig?.theme?.inheritPreset || presentationConfig?.layout || restaurant.slug
    const stockByProductId = new Map(stockAvailability.map((entry) => [entry.product_id, entry]))
    const productById = new Map(products.map((product) => [product.id, product]))
    const regularCategories = this.groupProductsByCategory(
      products,
      stockByProductId,
      Boolean(restaurant.stock_strict_mode),
    )
    const dailyMenuCategory = this.mapDailyMenuCategory(
      dailyMenu,
      productById,
      stockByProductId,
      Boolean(restaurant.stock_strict_mode),
    )
    const categories = dailyMenuCategory ? [dailyMenuCategory, ...regularCategories] : regularCategories

    const businessLocation = normalizeBusinessLocation(restaurant.horarios)

    const ordering = getBusinessOpenStatus(restaurant.horarios)
    const orderTakingPaused = restaurant.horarios?._settings?.orderTakingPaused === true

    return {
      accountId: restaurant.slug,
      accountName: restaurant.name,
      deliveryFee: Number(restaurant.delivery_fee ?? 0),
      deliveryZones:
        restaurant.horarios?._settings?.deliveryZonesEnabled === true
          ? restaurant.horarios?._settings?.deliveryZones ?? []
          : [],
      deliveryZonesEnabled: restaurant.horarios?._settings?.deliveryZonesEnabled === true,
      city: restaurant.city || '',
      province: businessLocation.province,
      localLocation: businessLocation.coordinates,
      currency: 'USD',
      locale: 'es',
      presentationConfig,
      categories,
      dailyMenu,
      loyalty,
      businessHours: restaurant.horarios ?? null,
      ordering: orderTakingPaused
        ? {
            ...ordering,
            isOpen: false,
            paused: true,
            message:
              restaurant.horarios?._settings?.orderTakingPauseMessage ||
              'El local no esta tomando pedidos por ahora. Podes volver a intentar mas tarde.',
          }
        : ordering,
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

  async fetchStockAvailability(restaurantId) {
    try {
      return this.rpc('get_product_stock_availability', {
        p_restaurant_id: restaurantId,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      if (
        message.includes('get_product_stock_availability') ||
        message.includes('PGRST') ||
        message.includes('42P01') ||
        message.includes('42883')
      ) {
        return []
      }

      throw error
    }
  }

  async fetchDailyMenu(restaurantId) {
    const date = getArgentinaDateValue()

    try {
      const data = await this.rpc('get_restaurant_daily_menu_context', {
        p_restaurant_id: restaurantId,
        p_service_date: date,
      })

      return data && typeof data === 'object' ? data : { date, items: [] }
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      if (
        message.includes('get_restaurant_daily_menu_context') ||
        message.includes('PGRST') ||
        message.includes('42P01') ||
        message.includes('42883')
      ) {
        return { date, items: [] }
      }

      throw error
    }
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

  groupProductsByCategory(products, stockByProductId = new Map(), stockStrictMode = false) {
    const groups = new Map()

    products.forEach((product, index) => {
      const categoryName = product.category?.trim() || 'Menu'
      const categoryId = this.slugify(categoryName)
      const customImage = String(product.image_url ?? '').trim()
      const stockInfo = stockByProductId.get(product.id) ?? null
      const isStockTracked = Boolean(stockInfo?.is_stock_tracked)
      const maxAvailable = stockInfo?.max_available == null ? null : Number(stockInfo.max_available)
      const availableForOrder = !(
        stockStrictMode &&
        isStockTracked &&
        Number(maxAvailable ?? 0) <= 0
      )

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
        imageAnimation: normalizeProductImageAnimation(product.image_animation),
        optionGroups: parseProductOptionGroups(product),
        badge: categoryName,
        dietary: [],
        availableForOrder,
        maxQuantity: stockStrictMode && isStockTracked ? Math.max(0, Number(maxAvailable || 0)) : null,
        stock: {
          strict: stockStrictMode,
          tracked: isStockTracked,
          status: stockInfo?.stock_status ?? 'untracked',
          maxAvailable,
        },
      })
    })

    return [...groups.values()]
  }

  mapDailyMenuCategory(dailyMenu, productById = new Map(), stockByProductId = new Map(), stockStrictMode = false) {
    const dailyItems = Array.isArray(dailyMenu?.items) ? dailyMenu.items : []
    const items = dailyItems
      .filter((item) => item?.available !== false)
      .map((item, index) => {
        const product = item.product_id ? productById.get(item.product_id) : null
        const customImage = String(product?.image_url ?? '').trim()
        const stockInfo = item.product_id ? stockByProductId.get(item.product_id) ?? null : null
        const isStockTracked = Boolean(stockInfo?.is_stock_tracked)
        const maxAvailable = stockInfo?.max_available == null ? null : Number(stockInfo.max_available)
        const stockLimit = item.stock_limit == null ? null : Number(item.stock_limit)
        const availableForOrder = !(
          stockStrictMode &&
          isStockTracked &&
          Number(maxAvailable ?? 0) <= 0
        )

        return {
          id: product?.id || `daily-${item.id || index}`,
          productId: item.product_id || product?.id || null,
          name: item.name || product?.name || DAILY_MENU_LABEL,
          description: item.description ?? product?.description ?? '',
          unitPrice: Number(item.price ?? product?.price ?? 0),
          price: this.formatPrice(Number(item.price ?? product?.price ?? 0)),
          image:
            customImage ||
            getBurgerFallbackImage(this.accountIdForFallback, product || item, index) ||
            getPizzeriaFallbackImage(this.accountIdForFallback, product || item, index) ||
            fallbackImages[index % fallbackImages.length],
          hasCustomImage: Boolean(customImage),
          video: product ? getProductVideo(product) : null,
          imageAnimation: normalizeProductImageAnimation(product?.image_animation),
          optionGroups: product ? parseProductOptionGroups(product) : [],
          badge: DAILY_MENU_LABEL,
          categoryLabel: DAILY_MENU_LABEL,
          dietary: [],
          isDailyMenu: true,
          dailyMenuDate: dailyMenu?.date || null,
          availableForOrder,
          maxQuantity:
            stockLimit != null
              ? Math.max(0, stockLimit)
              : stockStrictMode && isStockTracked
                ? Math.max(0, Number(maxAvailable || 0))
                : null,
          stock: {
            strict: stockStrictMode,
            tracked: isStockTracked,
            status: stockInfo?.stock_status ?? 'untracked',
            maxAvailable,
          },
        }
      })

    if (!items.length) {
      return null
    }

    return {
      id: 'menu-del-dia',
      label: DAILY_MENU_LABEL,
      items,
    }
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
    const headerImages = Array.isArray(themeOverrides.headerImages)
      ? themeOverrides.headerImages.filter(Boolean)
      : []

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
        images: headerImages.length ? headerImages : undefined,
        video: themeOverrides.heroVideo || undefined,
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

  async rpc(functionName, payload = {}) {
    const response = await fetch(`${this.config.supabaseUrl}/rest/v1/rpc/${functionName}`, {
      method: 'POST',
      headers: {
        apikey: this.config.supabaseApiKey,
        Authorization: `Bearer ${this.config.supabaseApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const detail = await response.text()
      throw new Error(`Supabase RPC error: ${response.status} ${detail}`)
    }

    return response.json()
  }
}
