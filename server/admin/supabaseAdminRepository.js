function mapPresentationConfig(config) {
  if (!config) {
    return null
  }

  const themeOverrides =
    config.theme_overrides && typeof config.theme_overrides === 'object'
      ? config.theme_overrides
      : {}

  return {
    template: config.layout || undefined,
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

const DELETED_MENU_THEME_ID = 'menu-deleted'

function normalizePresentationInput(input) {
  return {
    layout: input.layout ?? 'editorial',
    theme_id: input.theme?.id ?? 'ivory-olive',
    theme_overrides: {
      primary: input.theme?.primary,
      accent: input.theme?.accent,
      displayFont: input.theme?.displayFont,
      bodyFont: input.theme?.bodyFont,
      surface: input.theme?.surface,
      surfaceAlt: input.theme?.surfaceAlt,
      text: input.theme?.text,
      muted: input.theme?.muted,
      primaryText: input.theme?.primaryText,
      border: input.theme?.border,
      shadow: input.theme?.shadow,
    },
    branding_wordmark: input.branding?.wordmark ?? null,
    branding_subtitle: input.branding?.subtitle ?? null,
    hero_image_url: input.hero?.image ?? null,
    hero_title: input.hero?.title ?? null,
    hero_accent: input.hero?.accent ?? null,
    hero_description: input.hero?.description ?? null,
    cards_style: input.cards?.style ?? 'editorial-list',
    preview_mode: input.preview?.productMedia ?? 'image-with-video-chip',
    autoplay_videos: Boolean(input.preview?.autoplayVideos),
    muted_videos: input.preview?.mutedVideos !== false,
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

function encodeStoragePath(path) {
  return String(path)
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')
}

function getFileExtension(fileName, fallback) {
  const normalizedFileName = String(fileName ?? '')

  if (!normalizedFileName.includes('.')) {
    return fallback
  }

  const extension = normalizedFileName
    .split('.')
    .pop()
    ?.toLowerCase()
    .replace(/[^a-z0-9]/g, '')

  return extension || fallback
}

export class SupabaseAdminRepository {
  constructor(config) {
    this.config = config
  }

  async listAccounts() {
    const [restaurants, deletedRestaurantIds] = await Promise.all([
      this.request('/restaurants?select=id,slug,name,city,business_type&order=name.asc'),
      this.fetchDeletedMenuRestaurantIds(),
    ])

    return restaurants.filter((restaurant) => !deletedRestaurantIds.has(restaurant.id))
  }

  async getAccountEditorData(accountId) {
    const restaurant = await this.fetchRestaurantBySlug(accountId)

    if (!restaurant) {
      return null
    }

    const [presentationRow, products] = await Promise.all([
      this.fetchPresentationByRestaurantId(restaurant.id),
      this.fetchProductsByRestaurantId(restaurant.id),
    ])

    return {
      restaurant,
      presentation: mapPresentationConfig(presentationRow),
      products,
    }
  }

  async createAccount(payload) {
    const existingRestaurant = await this.fetchRestaurantBySlug(payload.slug)

    if (existingRestaurant) {
      await this.restoreMenu(existingRestaurant.id)

      if (payload.sourceAccountId) {
        const copyResult = await this.copyProductsFromAccount(existingRestaurant.slug, payload.sourceAccountId, {
          replaceExisting: Boolean(payload.replaceProducts),
        })

        return {
          ...existingRestaurant,
          linkedExisting: true,
          demo: Boolean(payload.demo),
          copiedProducts: copyResult.copied,
        }
      }

      return {
        ...existingRestaurant,
        linkedExisting: true,
        demo: Boolean(payload.demo),
        copiedProducts: 0,
      }
    }

    const [restaurant] = await this.request('/restaurants', {
      method: 'POST',
      headers: {
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        name: payload.name,
        slug: payload.slug,
        business_type: payload.demo ? 'demo_menu' : payload.business_type ?? 'restaurant',
        city: payload.city ?? null,
        address: payload.address ?? null,
      }),
    })

    let copiedProducts = 0

    if (payload.sourceAccountId) {
      const copyResult = await this.copyProductsFromAccount(restaurant.slug, payload.sourceAccountId, {
        replaceExisting: Boolean(payload.replaceProducts),
      })
      copiedProducts = copyResult.copied
    }

    return {
      ...restaurant,
      linkedExisting: false,
      demo: Boolean(payload.demo),
      copiedProducts,
    }
  }

  async copyProductsFromAccount(targetAccountId, sourceAccountId, options = {}) {
    const [targetRestaurant, sourceRestaurant] = await Promise.all([
      this.fetchRestaurantBySlug(targetAccountId),
      this.fetchRestaurantBySlug(sourceAccountId),
    ])

    if (!targetRestaurant) {
      return null
    }

    if (!sourceRestaurant) {
      throw new Error('No se encontro el menu origen para copiar productos.')
    }

    if (targetRestaurant.id === sourceRestaurant.id) {
      throw new Error('El menu origen y destino no pueden ser el mismo.')
    }

    const sourceProducts = await this.fetchProductsForCopy(sourceRestaurant.id)

    if (options.replaceExisting) {
      await this.request(`/products?restaurant_id=eq.${targetRestaurant.id}`, {
        method: 'DELETE',
        headers: {
          Prefer: 'return=minimal',
        },
      })
    }

    if (!sourceProducts.length) {
      return {
        copied: 0,
        source: sourceRestaurant,
        target: targetRestaurant,
      }
    }

    const rowsToCreate = sourceProducts.map((product) => ({
      restaurant_id: targetRestaurant.id,
      name: product.name,
      description: product.description ?? null,
      price: product.price ?? 0,
      category: product.category ?? null,
      available: product.available !== false,
      image_url: product.image_url ?? null,
      video_url: product.video_url ?? null,
    }))

    const createdProducts = await this.request('/products', {
      method: 'POST',
      headers: {
        Prefer: 'return=representation',
      },
      body: JSON.stringify(rowsToCreate),
    })

    return {
      copied: createdProducts.length,
      source: sourceRestaurant,
      target: targetRestaurant,
    }
  }

  async savePresentation(accountId, input) {
    const restaurant = await this.fetchRestaurantBySlug(accountId)

    if (!restaurant) {
      return null
    }

    const payload = normalizePresentationInput(input)
    const [row] = await this.request(
      '/restaurant_menu_presentations?on_conflict=restaurant_id',
      {
        method: 'POST',
        headers: {
          Prefer: 'resolution=merge-duplicates,return=representation',
        },
        body: JSON.stringify([
          {
            restaurant_id: restaurant.id,
            ...payload,
          },
        ]),
      },
    )

    return mapPresentationConfig(row)
  }

  async deleteMenu(accountId) {
    const restaurant = await this.fetchRestaurantBySlug(accountId)

    if (!restaurant) {
      return null
    }

    await this.request('/restaurant_menu_presentations?on_conflict=restaurant_id', {
      method: 'POST',
      headers: {
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify([
        {
          restaurant_id: restaurant.id,
          layout: 'editorial',
          theme_id: DELETED_MENU_THEME_ID,
          theme_overrides: {},
          branding_wordmark: null,
          branding_subtitle: null,
          hero_image_url: null,
          hero_title: null,
          hero_accent: null,
          hero_description: null,
          cards_style: 'editorial-list',
          preview_mode: 'image-with-video-chip',
          autoplay_videos: false,
          muted_videos: true,
        },
      ]),
    })

    return {
      id: restaurant.id,
      slug: restaurant.slug,
      name: restaurant.name,
      deleted: true,
    }
  }

  async restoreMenu(restaurantId) {
    await this.request(
      `/restaurant_menu_presentations?restaurant_id=eq.${restaurantId}&theme_id=eq.${DELETED_MENU_THEME_ID}`,
      {
        method: 'DELETE',
        headers: {
          Prefer: 'return=minimal',
        },
      },
    )
  }

  async updateProductMedia(productId, media) {
    const payload = {}

    if (Object.prototype.hasOwnProperty.call(media, 'video_url')) {
      const videoUrl = String(media.video_url ?? '').trim()
      payload.video_url = videoUrl || null
    }

    if (Object.prototype.hasOwnProperty.call(media, 'image_url')) {
      const imageUrl = String(media.image_url ?? '').trim()
      payload.image_url = imageUrl || null
    }

    const [row] = await this.request(`/products?id=eq.${productId}`, {
      method: 'PATCH',
      headers: {
        Prefer: 'return=representation',
      },
      body: JSON.stringify(payload),
    })

    return row
  }

  async uploadProductVideo(productId, file) {
    const product = await this.fetchProductById(productId)

    if (!product) {
      return null
    }

    const restaurant = await this.fetchRestaurantById(product.restaurant_id)
    const extension = getFileExtension(file.fileName, 'mp4')
    const safeName = slugify(product.name) || 'product'
    const folder = slugify(restaurant?.slug || 'general')
    const path = `products/${folder}/${product.id}-${safeName}-${Date.now()}.${extension}`

    const uploadResponse = await fetch(
      `${this.config.supabaseUrl}/storage/v1/object/${this.config.storageBucket}/${path}`,
      {
        method: 'POST',
        headers: {
          apikey: this.config.supabaseStorageApiKey,
          Authorization: `Bearer ${this.config.supabaseStorageApiKey}`,
          'Content-Type': file.contentType || 'video/mp4',
          'x-upsert': 'true',
        },
        body: file.buffer,
      },
    )

    if (!uploadResponse.ok) {
      const detail = await uploadResponse.text()
      throw new Error(
        `Supabase storage error: ${uploadResponse.status} ${detail || 'No se pudo subir el video.'}`,
      )
    }

    const publicUrl = `${this.config.supabaseUrl}/storage/v1/object/public/${this.config.storageBucket}/${path}`
    return this.updateProductMedia(productId, { video_url: publicUrl })
  }

  async createProductVideoUpload(productId, file = {}) {
    const product = await this.fetchProductById(productId)

    if (!product) {
      return null
    }

    const restaurant = await this.fetchRestaurantById(product.restaurant_id)
    const extension = getFileExtension(file.fileName, 'mp4')
    const safeName = slugify(product.name) || 'product'
    const folder = slugify(restaurant?.slug || 'general')
    const path = `products/${folder}/${product.id}-${safeName}-${Date.now()}.${extension}`
    const uploadUrl = await this.createSignedStorageUploadUrl(path)
    const publicUrl = `${this.config.supabaseUrl}/storage/v1/object/public/${this.config.storageBucket}/${path}`

    return {
      uploadUrl,
      publicUrl,
      path,
      method: 'PUT',
    }
  }

  async createSignedStorageUploadUrl(path) {
    const uploadResponse = await fetch(
      `${this.config.supabaseUrl}/storage/v1/object/upload/sign/${this.config.storageBucket}/${encodeStoragePath(path)}`,
      {
        method: 'POST',
        headers: {
          apikey: this.config.supabaseStorageApiKey,
          Authorization: `Bearer ${this.config.supabaseStorageApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ upsert: true }),
      },
    )

    if (!uploadResponse.ok) {
      const detail = await uploadResponse.text()
      throw new Error(
        `Supabase signed upload error: ${uploadResponse.status} ${
          detail || 'No se pudo preparar la subida directa.'
        }`,
      )
    }

    const payload = await uploadResponse.json()
    const signedPath = payload.signedURL ?? payload.signedUrl ?? payload.url

    if (!signedPath) {
      throw new Error('Supabase no devolvio una URL firmada para subir el video.')
    }

    return signedPath.startsWith('http')
      ? signedPath
      : `${this.config.supabaseUrl}/storage/v1${signedPath}`
  }

  async uploadProductImage(productId, file) {
    const product = await this.fetchProductById(productId)

    if (!product) {
      return null
    }

    const restaurant = await this.fetchRestaurantById(product.restaurant_id)
    const extension = getFileExtension(file.fileName, 'jpg')
    const safeName = slugify(product.name) || 'product'
    const folder = slugify(restaurant?.slug || 'general')
    const path = `products/${folder}/images/${product.id}-${safeName}-${Date.now()}.${extension}`

    const uploadResponse = await fetch(
      `${this.config.supabaseUrl}/storage/v1/object/${this.config.storageBucket}/${path}`,
      {
        method: 'POST',
        headers: {
          apikey: this.config.supabaseStorageApiKey,
          Authorization: `Bearer ${this.config.supabaseStorageApiKey}`,
          'Content-Type': file.contentType || 'image/jpeg',
          'x-upsert': 'true',
        },
        body: file.buffer,
      },
    )

    if (!uploadResponse.ok) {
      const detail = await uploadResponse.text()
      throw new Error(
        `Supabase storage error: ${uploadResponse.status} ${detail || 'No se pudo subir la imagen.'}`,
      )
    }

    const publicUrl = `${this.config.supabaseUrl}/storage/v1/object/public/${this.config.storageBucket}/${path}`
    return this.updateProductMedia(productId, { image_url: publicUrl })
  }

  async fetchRestaurantBySlug(accountId) {
    const rows = await this.request(
      `/restaurants?slug=eq.${encodeURIComponent(accountId)}&select=id,slug,name,city,business_type,address&limit=1`,
    )
    return rows[0] ?? null
  }

  async fetchRestaurantById(restaurantId) {
    const rows = await this.request(
      `/restaurants?id=eq.${restaurantId}&select=id,slug,name&limit=1`,
    )
    return rows[0] ?? null
  }

  async fetchPresentationByRestaurantId(restaurantId) {
    try {
      const rows = await this.request(
        `/restaurant_menu_presentations?restaurant_id=eq.${restaurantId}&select=*&limit=1`,
      )
      return rows[0] ?? null
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

  async fetchDeletedMenuRestaurantIds() {
    try {
      const rows = await this.request(
        `/restaurant_menu_presentations?theme_id=eq.${DELETED_MENU_THEME_ID}&select=restaurant_id`,
      )

      return new Set(rows.map((row) => row.restaurant_id).filter(Boolean))
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      if (
        message.includes('restaurant_menu_presentations') ||
        message.includes('PGRST') ||
        message.includes('42P01')
      ) {
        return new Set()
      }

      throw error
    }
  }

  async fetchProductsByRestaurantId(restaurantId) {
    return this.request(
      `/products?restaurant_id=eq.${restaurantId}&select=id,name,category,image_url,video_url,available&order=category.asc,name.asc`,
    )
  }

  async fetchProductsForCopy(restaurantId) {
    return this.request(
      `/products?restaurant_id=eq.${restaurantId}&select=name,description,price,category,image_url,video_url,available&order=category.asc,name.asc`,
    )
  }

  async fetchProductById(productId) {
    const rows = await this.request(
      `/products?id=eq.${productId}&select=id,name,restaurant_id,video_url,image_url&limit=1`,
    )
    return rows[0] ?? null
  }

  async request(path, options = {}) {
    const response = await fetch(`${this.config.supabaseUrl}/rest/v1${path}`, {
      method: options.method ?? 'GET',
      headers: {
        apikey: this.config.supabaseApiKey,
        Authorization: `Bearer ${this.config.supabaseApiKey}`,
        'Content-Type': 'application/json',
        ...(options.headers ?? {}),
      },
      body: options.body,
    })

    if (!response.ok) {
      const detail = await response.text()
      throw new Error(`Supabase admin error: ${response.status} ${detail}`)
    }

    if (response.status === 204) {
      return []
    }

    return response.json()
  }
}
