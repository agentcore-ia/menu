import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

const emptyCategories = []

const defaultPresentation = {
  template: 'editorial',
  layout: 'editorial',
  branding: {
    wordmark: 'NEUROREST',
    subtitle: 'DIGITAL MENU',
  },
  theme: {
    id: 'ivory-olive',
    background: '#f4efe6',
    surface: '#fffdfa',
    surfaceAlt: '#f8f4ec',
    text: '#1b1b18',
    muted: 'rgba(27, 27, 24, 0.72)',
    primary: '#445d39',
    primaryText: '#fffdf8',
    accent: '#4f6546',
    border: 'rgba(96, 91, 74, 0.12)',
    shadow: 'rgba(45, 38, 24, 0.08)',
    displayFont: 'Cormorant Garamond',
    bodyFont: 'Manrope',
  },
  hero: {
    image: '/dishes/hero-clean-cut.png',
    title: 'Buen sabor,',
    accent: 'buen momento',
    description: 'Descubre nuestra seleccion de platos hechos para ti.',
  },
  cards: {
    style: 'editorial-list',
  },
  preview: {
    productMedia: 'image-with-video-chip',
    autoplayVideos: false,
    mutedVideos: true,
  },
}

function IconMenu() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  )
}

function IconCart() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 5h2l1.5 9h10.8l1.7-6.5H7.2" />
      <circle cx="10" cy="18.5" r="1.35" />
      <circle cx="17.2" cy="18.5" r="1.35" />
    </svg>
  )
}

function IconBack() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M15 6l-6 6 6 6" />
    </svg>
  )
}

function IconHeart() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 20s-6.7-4.3-8.7-8C1.5 8.9 3.1 5.5 6.9 5.5c2 0 3.3 1 4.1 2.2.8-1.2 2.1-2.2 4.1-2.2 3.8 0 5.4 3.4 3.6 6.5C18.7 15.7 12 20 12 20z" />
    </svg>
  )
}

function IconPlus() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function IconMinus() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h14" />
    </svg>
  )
}

function IconLeafMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 20V9" />
      <path d="M12 13c-3.2 0-5.8-2.5-5.8-5.7 3.4 0 5.8 2.2 5.8 5.7z" />
      <path d="M12 13c3.2 0 5.8-2.5 5.8-5.7-3.4 0-5.8 2.2-5.8 5.7z" />
      <path d="M12 9.5C9.6 9.5 7.7 7.6 7.7 5.2c2.4 0 4.3 1.8 4.3 4.3z" />
    </svg>
  )
}

function IconServe() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4.5 13.5h15" />
      <path d="M6.5 13.5a5.5 5.5 0 0 1 11 0" />
      <path d="M3.5 17.5h17" />
    </svg>
  )
}

function IconPizza() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4c3.5 0 6.5.8 8.3 1.9L12 20 3.7 5.9C5.5 4.8 8.5 4 12 4z" />
      <circle cx="10" cy="10" r="1" />
      <circle cx="14" cy="12" r="1" />
      <circle cx="12" cy="15" r="1" />
    </svg>
  )
}

function IconDessert() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 10h14" />
      <path d="M7.5 10a4.5 4.5 0 0 1 9 0" />
      <path d="M6 10l1.5 7h9L18 10" />
    </svg>
  )
}

function IconDrink() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 5h10l-1 13H8L7 5z" />
      <path d="M10 5V3h4" />
      <path d="M15 8l3-3" />
    </svg>
  )
}

function IconShare() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="18" cy="5.5" r="2.1" />
      <circle cx="6" cy="12" r="2.1" />
      <circle cx="18" cy="18.5" r="2.1" />
      <path d="M7.8 11l8-4.1" />
      <path d="M7.8 13l8 4.1" />
    </svg>
  )
}

function IconDrumstick() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M13.8 5.3c2.3 0 4.1 1.7 4.1 4 0 1.5-.7 2.6-1.8 3.5l-3.5 2.9a4.4 4.4 0 0 1-2.8 1H8.9" />
      <path d="M8.9 16.7a1.9 1.9 0 1 1 0 3.8 1.9 1.9 0 0 1 0-3.8z" />
      <path d="M6.1 14.5a1.8 1.8 0 0 1 2.5 2.5" />
      <path d="M10.8 18.4a1.8 1.8 0 0 1-2.5 2.5" />
      <path d="M11.3 7.6c.8-1.5 2-2.3 2.5-2.3" />
    </svg>
  )
}

function HostIconFlame() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 21c-3.9 0-6.6-2.6-6.6-6.3 0-2.5 1.4-4.2 2.9-5.8 1.2-1.4 2.2-2.8 2.2-4.8 2.9 1.5 4.6 3.8 4.6 6.6.8-.6 1.4-1.4 1.7-2.5 1.6 1.4 2.6 3.5 2.6 5.8 0 4.3-3 7-7.4 7z" />
      <path d="M12.2 18.3c-1.5 0-2.5-1-2.5-2.3 0-.9.5-1.6 1.1-2.3.5-.6.9-1.2 1-2 1.4.9 2.3 2.1 2.3 3.7 0 1.8-.9 2.9-1.9 2.9z" />
    </svg>
  )
}

function HostIconDrumstick() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14.6 5.4c2.5 0 4.5 2 4.5 4.5 0 1.6-.7 2.8-1.9 3.8l-3.8 3a4.8 4.8 0 0 1-3.1 1.1H9.4" />
      <path d="M9 16.9a1.75 1.75 0 1 1 0 3.5 1.75 1.75 0 0 1 0-3.5Z" />
      <path d="M6.7 15.4a1.45 1.45 0 0 1 2.05 2.05" />
      <path d="M10.95 18.95A1.45 1.45 0 0 1 8.9 21" />
      <path d="M12.1 8.35c.75-1.35 1.8-2.35 2.5-2.95" />
    </svg>
  )
}

function HostIconBurger() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5.2 11.2c.7-2.8 3-4.3 6.8-4.3s6.1 1.5 6.8 4.3H5.2z" />
      <path d="M5.5 14.2h13" />
      <path d="M6.7 17.3h10.6" />
      <path d="M8.1 11.2c1.2.7 2.4.7 3.6 0 1.3.7 2.6.7 3.9 0" />
    </svg>
  )
}

function HostIconFries() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 9.2l1.1 10h7.8L17 9.2" />
      <path d="M6.3 9.2h11.4" />
      <path d="M8.1 8.4L7.5 4.9M10.9 8.4V4.3M13.7 8.4l.7-3.5M16.4 8.4l1.2-3" />
    </svg>
  )
}

function HostIconDrink() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8.1 5.2h7.8l-.9 12.5H9L8.1 5.2z" />
      <path d="M10.4 5.2V3.8h3.7" />
      <path d="M15 8l2.6-2.6" />
    </svg>
  )
}

function HostIconPlusCircle() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="7.3" />
      <path d="M12 8.5v7M8.5 12h7" />
    </svg>
  )
}

function HostIconCloche() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5.2 13.4h13.6" />
      <path d="M6.9 13.4a5.1 5.1 0 0 1 10.2 0" />
      <path d="M4.3 17.1h15.4" />
      <path d="M12 8.1v-.7" />
    </svg>
  )
}

function IconBurger() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 11c.8-3.1 3.2-4.8 7-4.8s6.2 1.7 7 4.8H5z" />
      <path d="M5.2 14.5h13.6" />
      <path d="M6 17.5h12" />
      <path d="M7.2 11.2c1.4.8 2.7.8 4.1 0 1.5.8 3 .8 4.5 0" />
    </svg>
  )
}

function IconHome() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4.5 11.5L12 5l7.5 6.5" />
      <path d="M7 10.5V20h10v-9.5" />
    </svg>
  )
}

function IconFlame() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 21c-3.8 0-6.4-2.5-6.4-6.2 0-2.6 1.6-4.4 3.1-6.1 1.1-1.3 2-2.6 2-4.3 2.6 1.4 4.3 3.5 4.3 6.2 1-.6 1.7-1.6 1.9-2.9 1.6 1.4 2.5 3.4 2.5 5.7 0 4.5-3.2 7.6-7.4 7.6z" />
      <path d="M12.1 18.5c-1.5 0-2.5-1-2.5-2.5 0-1 .6-1.8 1.3-2.5.5-.6.9-1.1.9-1.8 1.4.8 2.4 2.1 2.4 3.6 0 1.9-.9 3.2-2.1 3.2z" />
    </svg>
  )
}

function IconFries() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 9l1.2 11h7.6L17 9" />
      <path d="M6 9h12" />
      <path d="M8 8l-.6-4M11 8V3M14 8l.8-4M17 8l1.4-3.5" />
    </svg>
  )
}

function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="10.8" cy="10.8" r="5.9" />
      <path d="M15.3 15.3L20 20" />
    </svg>
  )
}

function IconTicket() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 8.5V6h16v2.5a2.5 2.5 0 0 0 0 5V16H4v-2.5a2.5 2.5 0 0 0 0-5z" />
      <path d="M9 9h.01M15 15h.01M15 9l-6 6" />
    </svg>
  )
}

function IconAward() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8.5" r="5" />
      <path d="M9.3 13.1L7.8 21l4.2-2.4 4.2 2.4-1.5-7.9" />
      <path d="M10.2 8.5l1.2 1.2 2.4-2.5" />
    </svg>
  )
}

function IconSpark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4l1.8 4.8L18.6 10l-4.8 1.2L12 16l-1.8-4.8L5.4 10l4.8-1.2z" />
    </svg>
  )
}

function IconPizzaOutline() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4c3.8 0 6.8.8 8.5 2l-8.5 14-8.5-14C5.2 4.8 8.2 4 12 4z" />
      <circle cx="10.1" cy="10.2" r="1" />
      <circle cx="13.9" cy="11.8" r="1" />
      <circle cx="12.1" cy="15.1" r="1" />
    </svg>
  )
}

function IconEmpanada() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path
        className="empanada-shell"
        d="M4.2 18.7c2.7-7.8 8.7-11.8 16-10.2 4.9 1.1 7.8 4.8 7.8 10.2H4.2z"
      />
      <path
        className="empanada-crimp"
        d="M7.9 16.4c.8-1.2 1.6-1.8 2.4-1.8s1.4.7 2.2 1.8c.8-1.2 1.6-1.8 2.4-1.8s1.4.7 2.2 1.8c.8-1.2 1.6-1.8 2.4-1.8s1.4.7 2.2 1.8"
      />
      <path className="empanada-crimp" d="M10.6 20.6c1.7 1.2 3.6 1.8 5.8 1.8 2.1 0 3.9-.6 5.5-1.8" />
    </svg>
  )
}

function PizzeriaLogo() {
  return (
    <div className="pizzeria-logo" aria-label="La Buona Pizzeria">
      <span className="pizzeria-logo-oven" aria-hidden="true">
        <span className="pizzeria-logo-bricks" />
        <span className="pizzeria-logo-flame" />
      </span>
      <span className="pizzeria-logo-wordmark">LA BUONA</span>
      <span className="pizzeria-logo-subtitle">PIZZERIA</span>
    </div>
  )
}

function IconPlay() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 6l10 6-10 6z" />
    </svg>
  )
}

function getInitialAccountId() {
  const pathAccount = window.location.pathname
    .split('/')
    .filter(Boolean)
    .at(0)

  if (pathAccount && pathAccount !== 'admin') {
    return decodeURIComponent(pathAccount)
  }

  const params = new URLSearchParams(window.location.search)
  return params.get('account') ?? 'sandras-rose'
}

function getLoadingTemplate(accountId) {
  const key = slugify(accountId)

  if (key.includes('host')) {
    return 'host'
  }

  if (
    key.includes('burger') ||
    key.includes('burguer') ||
    ['brasa', 'el-club', 'owen'].includes(key)
  ) {
    return 'burger'
  }

  if (key.includes('heladeria') || key.includes('dolce')) {
    return 'gelato'
  }

  if (key.includes('esquina') || key.includes('pizzeria')) {
    return 'pizzeria'
  }

  if (key.includes('sandra') || key.includes('rose')) {
    return 'luxe'
  }

  if (key.includes('bruder') || key.includes('bistro')) {
    return 'bistro'
  }

  return 'default'
}

function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function toNumericPrice(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  const raw = String(value ?? '').replace(/[^\d.,-]/g, '').trim()

  if (!raw) {
    return 0
  }

  let normalized = raw

  if (raw.includes('.') && raw.includes(',')) {
    normalized = raw.replace(/\./g, '').replace(',', '.')
  } else if (raw.includes(',')) {
    normalized = raw.replace(',', '.')
  } else if (/\.\d{3}(\.|$)/.test(raw)) {
    normalized = raw.replace(/\./g, '')
  }

  const amount = Number.parseFloat(normalized)
  return Number.isFinite(amount) ? amount : 0
}

function formatPrice(value, currencySymbol = '$') {
  const amount = Number(value ?? 0)
  const hasDecimals = Math.abs(amount % 1) > 0.001

  return `${currencySymbol}${amount.toLocaleString('es-AR', {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  })}`
}

function getHeroImage(presentation, heroDish) {
  return presentation.hero?.image ?? heroDish?.image ?? '/dishes/hero-clean-cut.png'
}

function getHostHeroArtImage(presentation, heroDish) {
  const customHeroImage = String(presentation.hero?.image ?? '').trim()

  if (customHeroImage) {
    return customHeroImage
  }

  if (heroDish?.video && heroDish?.image) {
    return heroDish.image
  }

  if (heroDish?.hasCustomImage && heroDish?.image) {
    return heroDish.image
  }

  return ''
}

function getInitialCategoryId(payload) {
  const templateId = payload?.presentation?.template ?? payload?.presentation?.layout
  const useHostCategorySet = shouldUseHostCategorySet(
    payload?.accountId,
    templateId,
    payload?.categories ?? [],
  )

  if (useHostCategorySet) {
    return (
      payload.categories.find((category) => slugify(category.label).includes('combo'))?.id ??
      payload.categories.find((category) => slugify(category.label).includes('pollo'))?.id ??
      payload.categories.find((category) => {
        const key = slugify(category.label)
        return key.includes('hamburgues') || key.includes('burger')
      })?.id ??
      payload.categories[0]?.id ??
      ''
    )
  }

  if (templateId === 'pizzeria') {
    return (
      payload.categories.find((category) => slugify(category.label).includes('pizza'))?.id ??
      payload.categories[0]?.id ??
      ''
    )
  }

  if (templateId === 'burger') {
    return (
      payload.categories.find((category) => {
        const key = slugify(category.label)
        return key.includes('hamburgues') || key.includes('burger')
      })?.id ??
      payload.categories[0]?.id ??
      ''
    )
  }

  if (templateId === 'blue-burger') {
    return (
      payload.categories.find((category) => {
        const key = slugify(category.label)
        return key.includes('hamburgues') || key.includes('burger')
      })?.id ??
      payload.categories[0]?.id ??
      ''
    )
  }

  return payload?.categories?.[0]?.id ?? ''
}

function getCategoryIcon(label) {
  const key = slugify(label)

  if (key.includes('entrada')) return IconLeafMark
  if (key.includes('pasta')) return IconLeafMark
  if (key.includes('pizza')) return IconPizza
  if (key.includes('postre')) return IconDessert
  if (key.includes('bebida')) return IconDrink
  if (key.includes('combo')) return IconBurger
  if (key.includes('entrada') || key.includes('papas')) return IconFries
  if (key.includes('hamburgues') || key.includes('burger')) return IconBurger
  return IconServe
}

function getProductKind(dish) {
  const category = `${dish.categoryLabel ?? ''} ${dish.badge ?? ''}`.toLowerCase()
  const fallback = `${dish.name ?? ''} ${dish.description ?? ''}`.toLowerCase()

  if (/pizza/.test(category)) return 'pizza'
  if (/empanada/.test(category)) return 'empanada'
  if (/(bebida|drink)/.test(category)) return 'bebida'
  if (/(postre|torta|helado|brownie|flan)/.test(category)) return 'postre'
  if (/(pasta|fideo|raviol|sorrentino|noqui)/.test(category)) return 'pasta'
  if (/(hamburguesa|burger)/.test(category)) return 'hamburguesa'
  if (/(carne|pollo|milanesa)/.test(category)) return 'carne'
  if (/(ensalada|veggie|vegetal|falafel|hummus)/.test(category)) return 'vegetal'

  if (/(pizza|muzza|mozzarella|fugazza|napolitana)/.test(fallback)) return 'pizza'
  if (/empanada/.test(fallback)) return 'empanada'
  if (/(bebida|agua|gaseosa|jugo|limonada|cerveza|vino|cafe|\bte\b)/.test(fallback)) {
    return 'bebida'
  }
  if (/(pasta|fideo|raviol|sorrentino|noqui)/.test(fallback)) return 'pasta'
  if (/(postre|torta|helado|brownie|flan)/.test(fallback)) return 'postre'
  if (/(ensalada|veggie|vegetal|falafel|hummus)/.test(fallback)) return 'vegetal'
  if (/(burger|hamburguesa)/.test(fallback)) return 'hamburguesa'
  if (/(carne|bife|filete|lomo|milanesa|pollo)/.test(fallback)) {
    return 'carne'
  }

  return 'comida'
}

function getUniqueMenuOptionEntries(items, matcher) {
  const seen = new Set()
  const entries = []

  items.forEach((item) => {
    const itemText = `${item.categoryLabel ?? ''} ${item.name ?? ''} ${item.description ?? ''}`.toLowerCase()

    if (!matcher(itemText, item)) {
      return
    }

    const label = String(item.name ?? '').trim()

    if (!label) {
      return
    }

    const key = slugify(label)

    if (seen.has(key)) {
      return
    }

    seen.add(key)
    entries.push({
      value: label,
      label,
      image: item.hasCustomImage ? item.image : '',
      video: item.video ?? '',
      hasMedia: Boolean(item.video || item.hasCustomImage),
      subtitle: item.description ?? '',
    })
  })

  return entries
}

function normalizeOptionEntry(option) {
  if (typeof option === 'string') {
    return {
      value: option,
      label: option,
      price: 0,
      image: '',
      video: '',
      hasMedia: false,
      subtitle: '',
    }
  }

  return {
    value: String(option.value ?? option.label ?? ''),
    label: String(option.label ?? option.value ?? ''),
    price: Number(option.price ?? 0),
    image: option.image ?? '',
    video: option.video ?? '',
    hasMedia: Boolean(option.hasMedia ?? option.video ?? option.image),
    subtitle: option.subtitle ?? '',
  }
}

function getHostMenuOptionPools(allItems = []) {
  const sideOptions = getUniqueMenuOptionEntries(
    allItems,
    (_text, item) => {
      const categoryKey = slugify(item.categoryLabel ?? '')
      return /(guarnicion|guarniciones|acompa|acompanamiento|ensalada)/.test(categoryKey)
    },
  )

  const sauceOptions = getUniqueMenuOptionEntries(
    allItems,
    (_text, item) => {
      const categoryKey = slugify(item.categoryLabel ?? '')
      return /(extra|extras|salsa|salsas)/.test(categoryKey)
    },
  )

  const drinkOptions = getUniqueMenuOptionEntries(
    allItems,
    (_text, item) => {
      const categoryKey = slugify(item.categoryLabel ?? '')
      return /bebida/.test(categoryKey)
    },
  )

  return {
    sideOptions,
    sauceOptions,
    drinkOptions,
  }
}

function parseSelectionCount(text, regex, fallback = 0) {
  const directMatch = text.match(regex)

  if (directMatch?.[1]) {
    return Number(directMatch[1])
  }

  const wordCounts = [
    ['una', 1],
    ['un', 1],
    ['dos', 2],
    ['tres', 3],
    ['cuatro', 4],
  ]

  for (const [word, count] of wordCounts) {
    if (new RegExp(`\\b${word}\\b`).test(text)) {
      return count
    }
  }

  return fallback
}

function getHostComboOptionGroups(dish, allItems = []) {
  const text = `${dish.categoryLabel ?? ''} ${dish.name ?? ''} ${dish.description ?? ''}`.toLowerCase()
  const isHostCombo = /(bucket|box|combo|duo|familiar|individual|maxi)/.test(text)

  if (!isHostCombo) {
    return null
  }

  const { sideOptions, sauceOptions, drinkOptions } = getHostMenuOptionPools(allItems)
  const sauceCount = parseSelectionCount(text, /(\d+)\s*salsas?/, sauceOptions.length ? 1 : 0)
  const drinkCount = parseSelectionCount(text, /(\d+)\s*bebidas?/, 0)
  const groups = []

  if (sideOptions.length) {
    groups.push({
      id: 'guarnicion',
      title: 'Elegi tu acompanamiento',
      required: true,
      options: sideOptions,
    })
  }

  if (sauceOptions.length) {
    groups.push({
      id: 'salsa',
      title: 'Elegi tu salsa',
      required: true,
      selectionLimit: sauceCount > 1 ? sauceCount : 1,
      options: sauceOptions,
    })
  }

  if (drinkCount > 0 && drinkOptions.length) {
    groups.push({
      id: 'bebida',
      title: 'Elegi tus bebidas',
      required: true,
      selectionLimit: drinkCount,
      options: drinkOptions,
    })
  }

  return groups.length ? groups : null
}

function buildProductOptionGroups(dish, allItems = []) {
  if (Array.isArray(dish.optionGroups) && dish.optionGroups.length > 0) {
    return dish.optionGroups
  }
  const text = `${dish.categoryLabel ?? ''} ${dish.name ?? ''} ${dish.description ?? ''}`.toLowerCase()
  const kind = getProductKind(dish)
  const hostComboGroups = getHostComboOptionGroups(dish, allItems)

  if (hostComboGroups) {
    return hostComboGroups
  }

  if (kind === 'bebida') {
    return [
      {
        id: 'temperatura',
        title: 'Temperatura',
        required: true,
        options: ['Fria', 'Natural', 'Con hielo'],
      },
      {
        id: 'extra',
        title: 'Extra',
        required: false,
        options: ['Sin azucar', 'Rodaja de limon', 'Sin extra'],
      },
    ]
  }

  if (kind === 'hamburguesa') {
    return [
      {
        id: 'punto',
        title: 'Punto de la carne',
        required: true,
        options: ['Jugosa', 'A punto', 'Bien cocida'],
      },
      {
        id: 'combo',
        title: 'Convertir en combo',
        required: false,
        options: ['Solo burger', 'Con papas', 'Papas + bebida'],
      },
      {
        id: 'extra',
        title: 'Extra',
        required: false,
        options: ['Sin extra', 'Cheddar extra', 'Bacon extra'],
      },
    ]
  }

  if (kind === 'pizza') {
    return [
      {
        id: 'tamano',
        title: 'Tamano',
        required: true,
        options: ['Individual', 'Mediana', 'Grande'],
      },
      {
        id: 'masa',
        title: 'Tipo de masa',
        required: true,
        options: ['Clasica', 'Fina', 'Extra crocante'],
      },
    ]
  }

  if (kind === 'empanada') {
    return [
      {
        id: 'salsa',
        title: 'Salsa',
        required: true,
        options: ['Sin salsa', 'Criolla', 'Picante'],
      },
      {
        id: 'coccion',
        title: 'Punto',
        required: true,
        options: ['Normal', 'Bien cocida', 'Suave'],
      },
    ]
  }

  if (kind === 'pasta') {
    return [
      {
        id: 'salsa',
        title: 'Salsa',
        required: true,
        options: ['Crema', 'Fileto', 'Mixta'],
      },
      {
        id: 'terminacion',
        title: 'Terminacion',
        required: false,
        options: ['Queso extra', 'Pimienta', 'Sin extra'],
      },
    ]
  }

  if (kind === 'postre') {
    return [
      {
        id: 'topping',
        title: 'Topping',
        required: true,
        options: ['Sin topping', 'Chocolate', 'Dulce de leche'],
      },
      {
        id: 'servicio',
        title: 'Servicio',
        required: false,
        options: ['Para llevar', 'Consumir en salon', 'Con cubiertos'],
      },
    ]
  }

  if (kind === 'vegetal' || /(vegano|vegan|falafel|ensalada)/.test(text)) {
    return [
      {
        id: 'acompanamiento',
        title: 'Acompanamiento',
        required: true,
        options: ['Mix de hojas', 'Vegetales grillados', 'Pure de calabaza'],
      },
      {
        id: 'salsa',
        title: 'Salsa',
        required: false,
        options: ['Tahini', 'Limon y oliva', 'Sin salsa'],
      },
    ]
  }

  if (kind === 'carne') {
    return [
      {
        id: 'acompanamiento',
        title: 'Acompanamientos',
        required: true,
        options: ['Papas rostizadas', 'Pure de papas', 'Ensalada mixta'],
      },
      {
        id: 'punto',
        title: 'Termino de la carne',
        required: true,
        options: ['3/4 Termino', 'A punto', 'Bien cocido'],
      },
    ]
  }

  return [
    {
      id: 'preferencia',
      title: 'Preferencia',
      required: true,
      options: ['Receta original', 'Suave', 'Intenso'],
    },
  ]
}

function getGroupSelectionLimit(group) {
  if (group.selection === 'multiple') {
    if (group.maxSelect && Number(group.maxSelect) > 0) {
      return Number(group.maxSelect)
    }
    if (group.selectionLimit && Number(group.selectionLimit) > 0) {
      return Number(group.selectionLimit)
    }
    return null
  }

  if (group.selectionLimit && Number(group.selectionLimit) > 1) {
    return Number(group.selectionLimit)
  }

  return 1
}

function isGroupMultiple(group) {
  const limit = getGroupSelectionLimit(group)
  return group.selection === 'multiple' || (typeof limit === 'number' && limit > 1)
}

function buildInitialSelections(groups) {
  return Object.fromEntries(
    groups.map((group) => {
      const options = group.options.map(normalizeOptionEntry)

      if (isGroupMultiple(group)) {
        return [group.id, []]
      }

      if (group.required) {
        return [group.id, options[0]?.value ?? '']
      }

      return [group.id, '']
    }),
  )
}

function buildSelectionSummary(groups, selections) {
  return groups
    .map((group) => {
      const value = selections[group.id]
      const options = group.options.map(normalizeOptionEntry)

      if (Array.isArray(value)) {
        const labels = value
          .map((entry) => options.find((option) => option.value === entry)?.label ?? entry)
          .filter(Boolean)
        return labels.length ? `${group.title}: ${labels.join(', ')}` : null
      }

      const label = options.find((option) => option.value === value)?.label ?? value
      return label ? `${group.title}: ${label}` : null
    })
    .filter(Boolean)
    .join(' | ')
}

function getOptionPrice(group, optionLabel) {
  const option = group.options.map(normalizeOptionEntry).find((entry) => entry.value === optionLabel)

  if (!option) {
    return 0
  }

  return Number(option.price || 0)
}

function calculateSelectionsExtraTotal(groups, selections) {
  return groups.reduce((total, group) => {
    const value = selections[group.id]

    if (Array.isArray(value)) {
      return (
        total +
        value.reduce((groupTotal, optionLabel) => groupTotal + getOptionPrice(group, optionLabel), 0)
      )
    }

    return total + (value ? getOptionPrice(group, value) : 0)
  }, 0)
}

function isSelectionValid(group, value) {
  if (isGroupMultiple(group)) {
    const selectedCount = Array.isArray(value) ? value.length : 0
    const selectionLimit = getGroupSelectionLimit(group)
    const min = Number(group.minSelect || (group.required ? 1 : 0))
    const max = typeof selectionLimit === 'number' ? selectionLimit : null

    if (group.required && selectedCount < Math.max(1, min)) {
      return false
    }

    if (selectedCount < min) {
      return false
    }

    if (max && selectedCount > max) {
      return false
    }

    return true
  }

  if (group.required) {
    return Boolean(value)
  }

  return true
}

function areSelectionsValid(groups, selections) {
  return groups.every((group) => isSelectionValid(group, selections[group.id]))
}

function getDetailNote(dish) {
  const kind = getProductKind(dish)
  const text = `${dish.categoryLabel ?? ''} ${dish.name ?? ''} ${dish.description ?? ''}`.toLowerCase()

  if (/(bucket|box|combo|duo|familiar|individual|maxi)/.test(text)) {
    return 'Vamos a enviar tu combo con la guarnicion y las salsas que elijas.'
  }

  if (kind === 'carne') {
    return 'Vamos a enviar tu punto de coccion y acompanamientos tal como los elegiste.'
  }

  if (kind === 'hamburguesa') {
    return 'Vamos a preparar tu burger con el punto, combo y extras que elegiste.'
  }

  if (kind === 'bebida') {
    return 'Tu preferencia de temperatura y extras se suma al pedido.'
  }

  if (kind === 'pizza') {
    return 'Vamos a preparar tu pizza con el tamano, masa y extras que elegiste.'
  }

  if (kind === 'empanada') {
    return 'Vamos a enviar tus empanadas con la salsa y coccion elegidas.'
  }

  return 'Las preferencias que elijas se guardan en el detalle del pedido.'
}

function buildWhatsappNumberPreview(phone) {
  const digits = String(phone ?? '').replace(/\D/g, '')
  return digits ? `+${digits}` : ''
}

function renderDetailOptionMedia(option, presentation) {
  const entry = normalizeOptionEntry(option)

  if (entry.video) {
    return (
      <video
        src={getVideoFrameSrc(entry.video)}
        preload="auto"
        autoPlay={shouldAutoplayVideoPreview(presentation)}
        muted={presentation.preview?.mutedVideos ?? true}
        loop={shouldAutoplayVideoPreview(presentation)}
        playsInline
      />
    )
  }

  if (entry.image) {
    return <img src={entry.image} alt={entry.label} />
  }

  return null
}

function getHostOptionKind(group) {
  const key = slugify(group.id || group.title || '')

  if (key.includes('salsa')) return 'sauce'
  if (key.includes('bebida')) return 'drink'
  if (key.includes('guarnicion') || key.includes('acompa')) return 'side'
  return 'default'
}

function buildCartRecommendations(cartItems, allItems) {
  const cartIds = new Set(cartItems.map((item) => item.id))
  const cartCategories = new Set(cartItems.map((item) => item.categoryLabel).filter(Boolean))

  const crossSell = allItems.filter(
    (item) => !cartIds.has(item.id) && !cartCategories.has(item.categoryLabel),
  )
  const sameFlow = allItems.filter((item) => !cartIds.has(item.id))

  return (crossSell.length ? crossSell : sameFlow).slice(0, 4)
}

function buildCartPairingSuggestions(cartItems) {
  const text = cartItems
    .map((item) => `${item.categoryLabel ?? ''} ${item.name ?? ''} ${item.notes ?? ''}`.toLowerCase())
    .join(' ')

  const suggestions = []

  if (/(carne|bife|filete|lomo|burger|hamburguesa|milanesa|pollo)/.test(text)) {
    suggestions.push('Papas rostizadas', 'Ensalada fresca', 'Gaseosa fria')
  }

  if (/pizza/.test(text)) {
    suggestions.push('Faina crocante', 'Dip picante', 'Limonada de la casa')
  }

  if (/(pasta|raviol|sorrentino|fideo|ñoqui|noqui)/.test(text)) {
    suggestions.push('Queso extra', 'Pan de ajo', 'Tonica botanica')
  }

  if (/(postre|torta|helado|brownie|flan)/.test(text)) {
    suggestions.push('Cafe espresso', 'Agua con gas')
  }

  if (!suggestions.length) {
    suggestions.push('Bebida fresca', 'Postre del dia', 'Extra de salsa')
  }

  return [...new Set(suggestions)].slice(0, 4)
}

function getGelatoFlavorLimit(sizeName) {
  const text = String(sizeName ?? '').toLowerCase()
  if (text.includes('1 kilo') || text === '1 kg' || text.includes('1kg')) return 5
  if (text.includes('3/4')) return 4
  if (text.includes('1/2')) return 3
  if (text.includes('1/4')) return 2
  return 3
}

function getGelatoFlavorCategory(flavorName) {
  const text = String(flavorName ?? '').toLowerCase()
  if (/(frutilla|limon|frutos|fruta)/.test(text)) return 'Frutales'
  if (/chocolate/.test(text)) return 'Chocolate'
  if (/(dulce de leche|tramontana|cookies|menta)/.test(text)) return 'Especiales'
  return 'Clasicos'
}

function getGelatoFormats() {
  return [
    {
      id: 'kilo',
      title: 'Helado por kilo',
      description: 'Elegi tu tamano y combina tus sabores favoritos.',
      accent: '#ff5a92',
      tint: '#ffe8f0',
      icon: '⚖',
      image: '/gelato/hero-kilo.png',
      video: '/gelato/hero-kilo.mp4',
      action: 'Abrir formato',
      enabled: true,
    },
    {
      id: 'conos',
      title: 'Conos y copas',
      description: 'Clasicos, irresistibles y perfectos para cualquier momento.',
      accent: '#b96ed8',
      tint: '#f4eaff',
      icon: '🍦',
      image: '/gelato/hero-cone.png',
      secondaryImage: '/gelato/hero-copa.png',
      action: 'Abrir formato',
      enabled: true,
    },
    {
      id: 'promos',
      title: 'Promos y combos',
      description: 'Descubri nuestras promociones y ahorra mas.',
      accent: '#ff9e1b',
      tint: '#fff5dc',
      icon: '✨',
      image: '/gelato/hero-promos.png',
      action: 'Abrir formato',
      enabled: true,
    },
  ]
}

function getGelatoFlavorAsset(flavorName) {
  const key = slugify(flavorName ?? '')

  if (key.includes('frut') || key.includes('fresa') || key.includes('frutilla')) {
    return '/gelato/flavor-fresa.png'
  }

  if (key.includes('cookie') || key.includes('oreo') || key.includes('cream')) {
    return '/gelato/flavor-cookies.png'
  }

  if (key.includes('menta')) {
    return '/gelato/flavor-menta.png'
  }

  if (key.includes('vainilla') || key.includes('americana') || key.includes('crema')) {
    return '/gelato/flavor-vainilla.png'
  }

  return '/gelato/flavor-chocolate.png'
}

function getPizzeriaDishTitle(item) {
  return String(item?.name ?? '')
    .replace(/^pizza\s+/i, '')
    .replace(/^empanada\s+/i, '')
    .replace(/^hamburguesa\s+/i, '')
    .trim()
}

function getPizzeriaCategoryLabel(label) {
  const key = slugify(label)
  if (key.includes('pizza')) return 'Pizzas'
  if (key.includes('empanada')) return 'Empanadas'
  if (key.includes('bebida')) return 'Bebidas'
  if (key.includes('postre')) return 'Postres'
  return label
}

function shouldShowPizzeriaCategory(category) {
  const key = slugify(category.label)
  return !key.includes('hamburgues') && !key.includes('burger')
}

function getPizzeriaOrderedCategories(categories) {
  const order = ['pizza', 'empanada', 'bebida', 'postre']

  return categories.filter(shouldShowPizzeriaCategory).sort((left, right) => {
    const leftKey = slugify(left.label)
    const rightKey = slugify(right.label)
    const leftIndex = order.findIndex((token) => leftKey.includes(token))
    const rightIndex = order.findIndex((token) => rightKey.includes(token))

    return (leftIndex === -1 ? 99 : leftIndex) - (rightIndex === -1 ? 99 : rightIndex)
  })
}

function getBurgerCategoryLabel(label) {
  const key = slugify(label)
  if (key.includes('hamburgues') || key.includes('burger')) return 'Hamburguesas'
  if (key.includes('combo')) return 'Combos'
  if (key.includes('entrada') || key.includes('papa')) return 'Entradas'
  if (key.includes('bebida')) return 'Bebidas'
  if (key.includes('postre')) return 'Postres'
  return label
}

function getBurgerCategoryIcon(label) {
  const key = slugify(label)
  if (key.includes('hamburgues') || key.includes('burger')) return IconBurger
  if (key.includes('combo')) return IconBurger
  if (key.includes('entrada') || key.includes('papa')) return IconFries
  if (key.includes('bebida')) return IconDrink
  if (key.includes('postre')) return IconDessert
  return IconServe
}

function getBurgerOrderedCategories(categories) {
  const order = ['hamburgues', 'burger', 'combo', 'entrada', 'papa', 'bebida', 'postre']

  return [...categories].sort((left, right) => {
    const leftKey = slugify(left.label)
    const rightKey = slugify(right.label)
    const leftIndex = order.findIndex((token) => leftKey.includes(token))
    const rightIndex = order.findIndex((token) => rightKey.includes(token))

    return (leftIndex === -1 ? 99 : leftIndex) - (rightIndex === -1 ? 99 : rightIndex)
  })
}

function getBurgerDishParts(item) {
  const name = String(item?.name ?? '').replace(/^hamburguesa\s+/i, '').trim()
  const words = name.split(/\s+/).filter(Boolean)

  if (words.length <= 1) {
    return [name || 'Brasa', 'Clasica']
  }

  return [words.slice(0, -1).join(' '), words.at(-1)]
}

function getBlueBurgerTitle(item) {
  return (
    String(item?.name ?? '')
      .replace(/^hamburguesa\s+/i, '')
      .replace(/\s+burger$/i, '')
      .trim() || 'Clasica Burger'
  )
}

function getHostCategoryLabel(label) {
  const key = slugify(label)
  if (key.includes('combo')) return 'Combos'
  if (key.includes('pollo')) return 'Pollo frito'
  if (key.includes('hamburgues') || key.includes('burger')) return 'Burgers'
  if (key.includes('guarnicion') || key.includes('papa') || key.includes('acompa')) return 'Guarniciones'
  if (key.includes('bebida')) return 'Bebidas'
  if (key.includes('extra') || key.includes('salsa')) return 'Extras'
  return label
}

function getHostCategoryIcon(label) {
  const key = slugify(label)
  if (key.includes('combo')) return HostIconFlame
  if (key.includes('pollo')) return HostIconDrumstick
  if (key.includes('hamburgues') || key.includes('burger')) return HostIconBurger
  if (key.includes('guarnicion') || key.includes('papa') || key.includes('acompa')) return HostIconFries
  if (key.includes('bebida')) return HostIconDrink
  if (key.includes('extra') || key.includes('salsa')) return HostIconPlusCircle
  return HostIconCloche
}

function getHostOrderedCategories(categories) {
  const order = ['combo', 'pollo', 'hamburgues', 'burger', 'guarnicion', 'papa', 'bebida', 'extra', 'salsa']

  return [...categories].sort((left, right) => {
    const leftKey = slugify(left.label)
    const rightKey = slugify(right.label)
    const leftIndex = order.findIndex((token) => leftKey.includes(token))
    const rightIndex = order.findIndex((token) => rightKey.includes(token))

    return (leftIndex === -1 ? 99 : leftIndex) - (rightIndex === -1 ? 99 : rightIndex)
  })
}

function getHostSectionSubtitle(label) {
  const key = slugify(label)
  if (key.includes('combo')) return 'Lo mejor para compartir (o no)'
  if (key.includes('pollo')) return 'Crujiente real, recien hecho para vos'
  if (key.includes('hamburgues') || key.includes('burger')) return 'Burgers con actitud y mucho sabor'
  if (key.includes('guarnicion') || key.includes('papa') || key.includes('acompa')) {
    return 'El acompanamiento ideal para sumar al pedido'
  }
  if (key.includes('bebida')) return 'El complemento perfecto para cada combo'
  if (key.includes('extra') || key.includes('salsa')) return 'Salsas y extras para llevar el combo mas lejos'
  return 'Todo el sabor de la casa listo para pedir'
}

function shouldUseHostCategorySet(accountId, templateId, categories = []) {
  if (templateId === 'host') {
    return true
  }

  if (templateId !== 'burger') {
    return false
  }

  const normalizedAccountId = slugify(accountId || '')

  if (
    normalizedAccountId === 'host' ||
    normalizedAccountId === 'host-demo' ||
    normalizedAccountId.startsWith('host-')
  ) {
    return true
  }

  const keys = categories.map((category) => slugify(category.label))
  return keys.some((key) => key.includes('pollo')) && keys.some((key) => key.includes('salsa'))
}

function getHostBadgeText(item, index, categoryLabel) {
  const nameKey = slugify(item?.name ?? '')
  const categoryKey = slugify(categoryLabel ?? '')

  if (index === 0) return 'Mas elegido'
  if (nameKey.includes('duo') || nameKey.includes('para-2')) return 'Para 2'
  if (nameKey.includes('individual') || nameKey.includes('para-1')) return 'Para 1'
  if (nameKey.includes('familiar') || nameKey.includes('maxi')) return 'Maxi Host'
  if (categoryKey.includes('burger') || categoryKey.includes('hamburgues')) return 'Host burger'
  if (categoryKey.includes('bebida')) return 'Bien fria'
  return 'Host'
}

function getHostDisplayTitle(item) {
  return String(item?.name ?? 'Combo Host').replace(/^combo\s+/i, 'Combo ').trim() || 'Combo Host'
}

function HostMediaPlaceholder() {
  return (
    <div className="host-dish-placeholder" aria-hidden="true">
      <IconDrumstick />
    </div>
  )
}

function getPresentationStyles(presentation) {
  const theme = presentation.theme

  return {
    '--menu-page-background':
      theme.pageBackground ||
      `linear-gradient(180deg, ${theme.surfaceAlt} 0%, ${theme.background} 100%)`,
    '--theme-bg': theme.background,
    '--theme-surface': theme.surface,
    '--theme-surface-alt': theme.surfaceAlt,
    '--theme-text': theme.text,
    '--theme-muted': theme.muted,
    '--theme-primary': theme.primary,
    '--theme-primary-text': theme.primaryText,
    '--theme-accent': theme.accent,
    '--theme-border': theme.border,
    '--theme-shadow': theme.shadow,
    '--font-display': `"${theme.displayFont}", serif`,
    '--font-body': `"${theme.bodyFont}", sans-serif`,
    '--custom-hero-background': theme.heroBackground || undefined,
    '--custom-hero-radius': theme.heroRadius || undefined,
    '--custom-hero-min-height': theme.heroMinHeight || undefined,
    '--custom-header-object-fit': theme.headerObjectFit || undefined,
    '--custom-content-background': theme.contentBackground || undefined,
    '--custom-category-bg': theme.categoryBackground || undefined,
    '--custom-category-active-bg': theme.categoryActiveBackground || undefined,
    '--custom-category-text': theme.categoryText || undefined,
    '--custom-category-active-text': theme.categoryActiveText || undefined,
    '--custom-category-border': theme.categoryBorder || undefined,
    '--custom-category-radius': theme.categoryRadius || undefined,
    '--custom-card-bg': theme.cardBackground || undefined,
    '--custom-card-text': theme.cardText || undefined,
    '--custom-card-muted': theme.cardMuted || undefined,
    '--custom-card-price': theme.cardPrice || undefined,
    '--custom-card-border': theme.cardBorder || undefined,
    '--custom-card-radius': theme.cardRadius || undefined,
    '--custom-card-shadow': theme.cardShadow || undefined,
    '--custom-product-image-height': theme.productImageHeight || undefined,
    '--custom-add-bg': theme.addButtonBackground || undefined,
    '--custom-add-text': theme.addButtonText || undefined,
  }
}

function shouldRenderPreviewVideo(item, presentation) {
  return Boolean(
    item.video && presentation.preview?.productMedia === 'video-first',
  )
}

function shouldAutoplayVideoPreview(presentation) {
  return presentation.preview?.productMedia === 'video-first'
}

function shouldForceVideoPreviewForBurgerHost(accountId, templateId, categories = []) {
  return shouldUseHostCategorySet(accountId, templateId, categories)
}

function getVideoFrameSrc(videoUrl) {
  if (!videoUrl) {
    return videoUrl
  }

  if (videoUrl.includes('#t=')) {
    return videoUrl
  }

  return `${videoUrl}#t=0.001`
}

function TemplateHero({ templateId, presentation, heroDish }) {
  const hasStandaloneHeroImage = Boolean(presentation?.hero?.image)

  if (!heroDish && !(templateId === 'host' && hasStandaloneHeroImage)) {
    return null
  }

  if (templateId === 'gelato') {
    return (
      <section className="hero-content hero-content-gelato">
        <img
          className="gelato-brand-image"
          src={presentation.theme?.logoImage || '/gelato/logo-dolce.png'}
          alt={presentation.branding?.wordmark ?? 'Dolce Heladeria'}
        />

        <div className="gelato-welcome">
          <h1>{presentation.hero?.title ?? 'Hola!'}</h1>
          <p>{presentation.hero?.accent ?? 'Que se te antoja hoy?'}</p>
        </div>
      </section>
    )
  }

  if (templateId === 'pizzeria') {
    return (
      <section className="hero-content hero-content-pizzeria">
        <img
          className="pizzeria-header-image"
          src={presentation.hero?.image ?? '/pizzeria/header.png'}
          alt="La Buona Pizzeria. Nuestro menu. Sabor que te hace volver."
        />
      </section>
    )
  }

  if (templateId === 'burger') {
    return (
      <section className="hero-content hero-content-burger">
        <img
          className="burger-header-image"
          src={getHeroImage(presentation, heroDish)}
          alt="Grill House Burger Co. Hechas para gustar."
        />
      </section>
    )
  }

  if (templateId === 'host') {
    const heroImage = getHostHeroArtImage(presentation, heroDish) || presentation.hero?.image

    return (
      <section className="hero-content hero-content-host">
        {heroImage ? (
          <img
            className="host-header-image"
            src={heroImage}
            alt={presentation.branding?.wordmark ?? heroDish?.name ?? 'Host'}
          />
        ) : (
          <div className="host-hero-placeholder" aria-hidden="true" />
        )}
      </section>
    )
  }

  if (templateId === 'blue-burger') {
    return (
      <section className="hero-content hero-content-blue-burger">
        <img
          className="blue-burger-header-image"
          src={getHeroImage(presentation, heroDish)}
          alt={`${presentation.branding?.wordmark ?? 'JBurger'} menu`}
        />
      </section>
    )
  }

  if (templateId === 'pizzeria') {
    return (
      <section className="hero-content hero-content-pizzeria">
        <div className="pizzeria-hero-crest">
          <PizzeriaLogo />
        </div>

        <div className="pizzeria-hero-copy">
          <h1>{presentation.hero?.title ?? 'NUESTRO MENÚ'}</h1>
          <p>{presentation.hero?.accent ?? 'Sabor que te hace volver'}</p>
          <span className="pizzeria-hero-underline" aria-hidden="true" />
        </div>
      </section>
    )
  }

  if (templateId === 'bistro') {
    return (
      <section className="hero-content hero-content-bistro">
        <div className="hero-copy hero-copy-bistro">
          <span className="hero-kicker">MENU DESTACADO</span>
          <h1>
            <span className="hero-line">{presentation.hero?.title ?? 'Cocina honesta,'}</span>
            <span className="hero-accent">{presentation.hero?.accent ?? 'mesa vibrante'}</span>
          </h1>
          <p>
            {presentation.hero?.description ??
              'Platos directos, producto fuerte y una carta pensada para convertir.'}
          </p>
        </div>

        <div className="hero-bistro-media">
          <img src={getHeroImage(presentation, heroDish)} alt={heroDish.name} />
          <div className="hero-bistro-caption">
            <strong>{heroDish.name}</strong>
            <span>{heroDish.price}</span>
          </div>
        </div>
      </section>
    )
  }

  if (templateId === 'luxe') {
    return (
      <section className="hero-content hero-content-luxe">
        <div className="hero-luxe-media">
          <img src={getHeroImage(presentation, heroDish)} alt={heroDish.name} />
        </div>
        <div className="hero-copy hero-copy-luxe">
          <span className="hero-kicker">EXPERIENCIA</span>
          <h1>
            <span className="hero-line">{presentation.hero?.title ?? 'Una carta'}</span>
            <span className="hero-accent">{presentation.hero?.accent ?? 'con atmosfera'}</span>
          </h1>
          <p>
            {presentation.hero?.description ??
              'Visual nocturno, foco en el producto y una experiencia mas cinematica.'}
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="hero-content">
      <div className="hero-copy">
        <h1>
          <span className="hero-line">{presentation.hero?.title ?? 'Buen sabor,'}</span>
          <span className="hero-accent">{presentation.hero?.accent ?? 'buen momento'}</span>
        </h1>
        <div className="hero-divider" />
        <p>
          {presentation.hero?.description ?? 'Descubre nuestra seleccion de platos hechos para ti.'}
        </p>
      </div>

      <div className="hero-plate">
        <img src={getHeroImage(presentation, heroDish)} alt={heroDish.name} />
      </div>
    </section>
  )
}

function MenuLoadingScreen({ accountId }) {
  const loadingTemplate = getLoadingTemplate(accountId)
  const loadingCopy = {
    burger: {
      title: 'BRASA',
      subtitle: 'burger co.',
      icon: <IconFlame />,
      kicker: 'A la parrilla',
      headline: 'Encendiendo la cocina',
      message: 'Estamos cargando hamburguesas, combos y promos con todo el sabor de la casa.',
      chips: ['Hamburguesas', 'Combos', 'Bebidas'],
      section: 'NUESTRO MENU',
    },
    host: {
      title: 'HOST',
      subtitle: 'crispy house',
      icon: <IconFlame />,
      kicker: 'Crispy chicken',
      headline: 'Subiendo el calor',
      message: 'Estamos preparando combos, pollo frito, burgers y extras para que elijas sin esperar.',
      chips: ['Combos', 'Pollo frito', 'Burgers'],
      section: 'COMBOS',
    },
    gelato: {
      title: 'Dolce',
      subtitle: 'heladeria',
      icon: <IconDessert />,
      kicker: 'Helado artesanal',
      headline: 'Sirviendo sabores',
      message: 'Preparamos el menu con formatos, tamanos y sabores para que empieces a elegir.',
      chips: ['Por kilo', 'Conos', 'Promos'],
      section: 'SABORES',
    },
    pizzeria: {
      title: 'La Buona',
      subtitle: 'pizzeria',
      icon: <IconPizzaOutline />,
      kicker: 'Horno encendido',
      headline: 'Calentando el horno',
      message: 'Estamos dejando listas las pizzas, empanadas y bebidas para tu pedido.',
      chips: ['Pizzas', 'Empanadas', 'Bebidas'],
      section: 'NUESTRO MENU',
    },
    luxe: {
      title: "Sandra's",
      subtitle: 'rose',
      icon: <IconSpark />,
      kicker: 'Experiencia premium',
      headline: 'Encendiendo la noche',
      message: 'Montamos la carta, las sugerencias y los destacados para una experiencia impecable.',
      chips: ['Entrantes', 'Principales', 'Postres'],
      section: 'SELECCION',
    },
    bistro: {
      title: 'Bruder',
      subtitle: 'bistro',
      icon: <IconServe />,
      kicker: 'Cocina de casa',
      headline: 'Preparando la mesa',
      message: 'Cargamos el menu, las categorias y los productos para que elijas sin esperar.',
      chips: ['Especiales', 'Platos', 'Bebidas'],
      section: 'RECOMENDADOS',
    },
    default: {
      title: 'NeuroRest',
      subtitle: 'digital menu',
      icon: <IconLeafMark />,
      kicker: 'Menu digital',
      headline: 'Cargando tu experiencia',
      message: 'Estamos dejando listo el menu, las categorias y el carrito para que empieces a pedir.',
      chips: ['Menu', 'Destacados', 'Carrito'],
      section: 'PRODUCTOS',
    },
  }
  const copy = loadingCopy[loadingTemplate] ?? loadingCopy.default
  const previewRows = Array.from({ length: 3 }, (_, index) => index)

  if (loadingTemplate === 'host') {
    return (
      <div className="app-shell">
        <div className="phone-surface menu-loading-screen loading-host-minimal">
          <div className="host-loading-minimal" role="status" aria-live="polite" aria-label="Cargando menu">
            <span className="host-loading-spinner" aria-hidden="true">
              <span className="host-loading-spinner-core">
                <IconFlame />
              </span>
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <div className={`phone-surface menu-loading-screen loading-${loadingTemplate}`}>
        <div className="menu-loader-orbit" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="menu-loading-shell" role="status" aria-live="polite">
          <div className="menu-loading-topbar">
            <span className="menu-loading-top-icon" aria-hidden="true">
              <IconMenu />
            </span>
            <div className="menu-loading-brand-lockup">
              <span className="menu-loading-mark">{copy.icon}</span>
              <div className="menu-loading-brand-copy">
                <strong>{copy.title}</strong>
                <p>{copy.subtitle}</p>
              </div>
            </div>
            <span className="menu-loading-top-icon" aria-hidden="true">
              <IconCart />
            </span>
          </div>

          <section className="menu-loading-hero-card">
            <div className="menu-loading-hero-copy">
              <span className="menu-loading-kicker">{copy.kicker}</span>
              <h2>{copy.headline}</h2>
              <p>{copy.message}</p>
              <div className="menu-loading-bar" aria-hidden="true">
                <span />
              </div>
              <div className="menu-loading-chip-row" aria-hidden="true">
                {copy.chips.map((chip) => (
                  <span key={chip}>{chip}</span>
                ))}
              </div>
            </div>

            <div className="menu-loading-visual" aria-hidden="true">
              <span className="menu-loading-visual-glow" />
              <span className="menu-loading-visual-card menu-loading-visual-card-back" />
              <span className="menu-loading-visual-card menu-loading-visual-card-front" />
              <span className="menu-loading-visual-icon">{copy.icon}</span>
            </div>
          </section>

          <div className="menu-loading-category-row" aria-hidden="true">
            {copy.chips.map((chip, index) => (
              <span key={chip} className={index === 0 ? 'active' : ''}>
                {chip}
              </span>
            ))}
          </div>

          <section className="menu-loading-feed" aria-hidden="true">
            <div className="menu-loading-section-head">
              <span />
              <strong>{copy.section}</strong>
              <span />
            </div>

            <div className="menu-loading-list">
              {previewRows.map((row) => (
                <article key={row} className="menu-loading-item">
                  <span className="menu-loading-item-media" />
                  <div className="menu-loading-item-copy">
                    <span className="menu-loading-item-title" />
                    <span className="menu-loading-item-line short" />
                    <span className="menu-loading-item-line" />
                    <div className="menu-loading-item-footer">
                      <span className="menu-loading-item-price" />
                      <span className="menu-loading-item-button" />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <div className="menu-loading-dock" aria-hidden="true">
            <span className="menu-loading-dock-item active" />
            <span className="menu-loading-dock-item" />
            <span className="menu-loading-dock-core" />
            <span className="menu-loading-dock-item" />
            <span className="menu-loading-dock-item" />
          </div>
        </div>
      </div>
    </div>
  )
}

function TemplateCategorySelector({
  accountId,
  templateId,
  categories,
  currentCategory,
  onSelectCategory,
}) {
  if (templateId === 'gelato') {
    return null
  }

  if (templateId === 'burger') {
    const useHostCategorySet = shouldUseHostCategorySet(accountId, templateId, categories)
    const orderedCategories = useHostCategorySet
      ? getHostOrderedCategories(categories)
      : getBurgerOrderedCategories(categories)

    return (
      <div className="burger-menu-head">
        <div className="burger-menu-title-row">
          <h2>NUESTRO MENU</h2>
          <button type="button" className="burger-search-button" aria-label="Buscar">
            <IconSearch />
          </button>
        </div>

        <div className="burger-category-row">
          {orderedCategories.map((category) => {
            const Icon = useHostCategorySet
              ? getHostCategoryIcon(category.label)
              : getBurgerCategoryIcon(category.label)
            const isActive = category.id === currentCategory?.id

            return (
              <button
                key={category.id}
                type="button"
                className={`burger-category-pill ${isActive ? 'active' : ''}`}
                onClick={() => onSelectCategory(category.id)}
              >
                <Icon />
                <span>
                  {useHostCategorySet
                    ? getHostCategoryLabel(category.label)
                    : getBurgerCategoryLabel(category.label)}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  if (templateId === 'host') {
    const orderedCategories = getHostOrderedCategories(categories)

    return (
      <div className="host-category-shell" data-host-categories>
        <div className="host-category-row">
          {orderedCategories.map((category) => {
            const Icon = getHostCategoryIcon(category.label)
            const isActive = category.id === currentCategory?.id

            return (
              <button
                key={category.id}
                type="button"
                className={`host-category-pill ${isActive ? 'active' : ''}`}
                onClick={() => onSelectCategory(category.id)}
              >
                <Icon />
                <span>{getHostCategoryLabel(category.label)}</span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  if (templateId === 'pizzeria') {
    const orderedCategories = getPizzeriaOrderedCategories(categories)
    return (
      <div className="pizzeria-category-row">
        {orderedCategories.map((category) => {
          const key = slugify(category.label)
          const isActive = category.id === currentCategory?.id
          const categoryKind = key.includes('pizza')
            ? 'pizzas'
            : key.includes('empanada')
              ? 'empanadas'
              : key.includes('bebida')
                ? 'bebidas'
                : key.includes('postre')
                  ? 'postres'
                  : 'otros'
          const Icon = key.includes('pizza')
            ? IconPizzaOutline
            : key.includes('empanada')
              ? IconEmpanada
              : key.includes('bebida')
                ? IconDrink
                : key.includes('postre')
                  ? IconDessert
                  : IconServe

          return (
            <button
              key={category.id}
              type="button"
              className={`pizzeria-category-pill pizzeria-category-pill-${categoryKind} ${isActive ? 'active' : ''}`}
              onClick={() => onSelectCategory(category.id)}
            >
              <span className="pizzeria-category-icon">
                <Icon />
              </span>
              <span>{getPizzeriaCategoryLabel(category.label)}</span>
            </button>
          )
        })}
      </div>
    )
  }

  if (templateId === 'bistro') {
    return (
      <div className="bistro-category-row">
        {categories.map((category) => {
          const Icon = getCategoryIcon(category.label)
          const isActive = category.id === currentCategory?.id

          return (
            <button
              key={category.id}
              type="button"
              className={`bistro-category-chip ${isActive ? 'active' : ''}`}
              onClick={() => onSelectCategory(category.id)}
            >
              <span className="bistro-category-icon">
                <Icon />
              </span>
              <span>{category.label}</span>
              <small>{category.items.length}</small>
            </button>
          )
        })}
      </div>
    )
  }

  if (templateId === 'luxe') {
    return (
      <div className="luxe-category-row">
        {categories.map((category) => {
          const isActive = category.id === currentCategory?.id

          return (
            <button
              key={category.id}
              type="button"
              className={`luxe-category-pill ${isActive ? 'active' : ''}`}
              onClick={() => onSelectCategory(category.id)}
            >
              {category.label}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="category-row">
      {categories.map((category) => {
        const Icon = getCategoryIcon(category.label)
        const isActive = category.id === currentCategory?.id

        return (
          <button
            key={category.id}
            type="button"
            className={`category-chip ${isActive ? 'active' : ''}`}
            onClick={() => onSelectCategory(category.id)}
          >
            <span className="category-icon">
              <Icon />
            </span>
            <span className="category-label">{category.label}</span>
          </button>
        )
      })}
    </div>
  )
}

function TemplateMenuCollection({
  templateId,
  categories,
  currentCategory,
  categoryItems,
  presentation,
  renderProductMedia,
  onOpenDish,
  onAddItem,
  onSelectCategory,
  onOpenCart,
  onOpenLoyalty,
  onNavigateHome,
  onNavigateMenu,
  onNavigatePromos,
  gelatoFormats,
  onOpenGelatoBuilder,
}) {
  if (templateId === 'burger') {
    const highlightedItems = categoryItems
    const comboTarget =
      categories.find((category) => slugify(category.label).includes('combo')) ??
      categories.find((category) => slugify(category.label).includes('bebida')) ??
      currentCategory

    return (
      <section className="section-block section-block-burger">
        <div className="burger-card-grid">
          {highlightedItems.map((item) => {
            const [title, accent] = getBurgerDishParts(item)

            return (
              <article key={item.id} className="burger-dish-card">
                <button type="button" className="burger-favorite" aria-label="Guardar favorito">
                  <IconHeart />
                </button>

                <button
                  type="button"
                  className="burger-dish-media"
                  onClick={() => onOpenDish(item)}
                  aria-label={`Ver ${item.name}`}
                >
                  {renderProductMedia(item)}
                </button>

                <div className="burger-dish-body">
                  <button
                    type="button"
                    className="burger-dish-copy"
                    onClick={() => onOpenDish(item)}
                  >
                    <h3>
                      <span>{title}</span>
                      <strong>{accent}</strong>
                    </h3>
                    <p>{item.description}</p>
                  </button>

                  <div className="burger-dish-footer">
                    <strong>{item.price}</strong>
                    <button
                      type="button"
                      className="burger-add-button"
                      onClick={() => onAddItem(item)}
                      aria-label={`Agregar ${item.name}`}
                    >
                      <IconPlus />
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>

        <article className="burger-combo-banner burger-footer-banner" data-burger-promos>
          <button
            type="button"
            onClick={() => {
              onSelectCategory?.(comboTarget?.id)
              onNavigatePromos?.()
            }}
            aria-label="Ver combo clasico"
          >
            <img src="/burger/footer.png" alt="El match perfecto. Combo clasico." />
          </button>
        </article>

        <nav className="burger-bottom-nav" aria-label="Navegacion del menu">
          <button type="button" className="active" onClick={onNavigateHome}>
            <IconFlame />
            <span>Inicio</span>
          </button>
          <button type="button" onClick={onNavigateMenu}>
            <IconBurger />
            <span>Menu</span>
          </button>
          <button type="button" className="burger-bottom-primary" onClick={onOpenCart}>
            <IconFlame />
          </button>
          <button type="button" onClick={onNavigatePromos}>
            <IconTicket />
            <span>Promos</span>
          </button>
          <button type="button" onClick={onOpenLoyalty}>
            <IconAward />
            <span>Mis puntos</span>
          </button>
        </nav>
      </section>
    )
  }

  if (templateId === 'blue-burger') {
    const highlightedItems = categoryItems.slice(0, 3)
    const comboTarget =
      categories.find((category) => slugify(category.label).includes('combo')) ??
      categories.find((category) => slugify(category.label).includes('bebida')) ??
      currentCategory

    return (
      <section className="section-block section-block-blue-burger" data-menu-categories>
        <div className="blue-burger-section-title">
          <span aria-hidden="true" />
          <h2>Nuestras hamburguesas</h2>
          <span aria-hidden="true" />
        </div>

        <div className="blue-burger-list">
          {highlightedItems.map((item, index) => (
            <article key={item.id} className="blue-burger-card">
              <button
                type="button"
                className="blue-burger-card-media"
                onClick={() => onOpenDish(item)}
                aria-label={`Ver ${item.name}`}
              >
                {index === 0 ? <span className="blue-burger-card-badge">Mas pedida</span> : null}
                {slugify(item.name).includes('veggie') ? (
                  <span className="blue-burger-card-badge is-veggie">Veggie</span>
                ) : null}
                {renderProductMedia(item)}
              </button>

              <div className="blue-burger-card-body">
                <button
                  type="button"
                  className="blue-burger-card-copy"
                  onClick={() => onOpenDish(item)}
                >
                  <h3>{getBlueBurgerTitle(item)}</h3>
                  <p>{item.description}</p>
                  <strong>{item.price}</strong>
                </button>
                <button
                  type="button"
                  className="blue-burger-add-button"
                  onClick={() => onAddItem(item)}
                  aria-label={`Agregar ${item.name}`}
                >
                  <IconPlus />
                </button>
              </div>
            </article>
          ))}
        </div>

        <article className="blue-burger-combo-card" data-burger-promos>
          <div>
            <h3>Combos que te encantan</h3>
            <button
              type="button"
              onClick={() => {
                onSelectCategory?.(comboTarget?.id)
                onNavigatePromos?.()
              }}
            >
              <IconTicket />
              Ver combos
            </button>
          </div>
          <div className="blue-burger-combo-art" aria-hidden="true">
            <IconFries />
            <IconDrink />
          </div>
        </article>

        <nav className="blue-burger-bottom-nav" aria-label="Navegacion del menu">
          <button type="button" className="active" onClick={onNavigateHome}>
            <IconHome />
            <span>Inicio</span>
          </button>
          <button type="button" onClick={onNavigateMenu}>
            <IconBurger />
            <span>Menu</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onSelectCategory?.(comboTarget?.id)
              onNavigatePromos?.()
            }}
          >
            <IconFries />
            <span>Combos</span>
          </button>
          <button type="button" onClick={onOpenLoyalty}>
            <IconAward />
            <span>Mis puntos</span>
          </button>
          <button type="button" onClick={onOpenCart}>
            <IconCart />
            <span>Contacto</span>
          </button>
        </nav>
      </section>
    )
  }

  if (templateId === 'host') {
    const highlightedItems = categoryItems
    const extrasTarget =
      categories.find((category) => {
        const key = slugify(category.label)
        return key.includes('extra') || key.includes('salsa')
      }) ??
      categories.find((category) => {
        const key = slugify(category.label)
        return key.includes('guarnicion') || key.includes('papa')
      }) ??
      currentCategory
    const hostBannerImage = getHostHeroArtImage(
      presentation,
      highlightedItems[0] ?? currentCategory?.items?.[0] ?? null,
    )

    return (
      <section className="section-block section-block-host" data-menu-categories>
        <div className="host-section-head">
          <div className="host-section-heading-row">
            <span className="host-section-flame-wrap">
              <span className="host-section-flame">
                <IconFlame />
              </span>
              <span className="host-section-flame-line" aria-hidden="true" />
            </span>
            <div className="host-section-title-copy">
              <h2>{String(currentCategory?.label ?? 'Combos').toUpperCase()}</h2>
              <p>{getHostSectionSubtitle(currentCategory?.label)}</p>
            </div>
          </div>
        </div>

        <div className="host-card-grid">
          {highlightedItems.map((item, index) => (
            <article key={item.id} className="host-dish-card">
              <span className="host-dish-badge">{getHostBadgeText(item, index, currentCategory?.label)}</span>

              <button
                type="button"
                className="host-dish-media"
                onClick={() => onOpenDish(item)}
                aria-label={`Ver ${item.name}`}
              >
                {renderProductMedia(item)}
              </button>

              <div className="host-dish-body">
                <button
                  type="button"
                  className="host-dish-copy"
                  onClick={() => onOpenDish(item)}
                >
                  <h3>{getHostDisplayTitle(item)}</h3>
                  <p>{item.description}</p>
                </button>

                <div className="host-dish-footer">
                  <strong>{item.price}</strong>
                  <button
                    type="button"
                    className="host-add-button"
                    onClick={() => onAddItem(item)}
                    aria-label={`Agregar ${item.name}`}
                  >
                    <IconPlus />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <article className="host-extra-banner" data-host-extras>
          <div className="host-extra-copy">
            <h3>
              <span>EXTRA</span>
              <strong>CRYSPY?</strong>
            </h3>
            <p>Suma mas sabor a tu combo!</p>
            <button
              type="button"
              onClick={() => {
                onSelectCategory?.(extrasTarget?.id)
                onNavigatePromos?.()
              }}
            >
              Ver extras
              <span>{'>'}</span>
            </button>
          </div>
          <div className="host-extra-art" aria-hidden="true">
            <span className="host-extra-sauce host-extra-sauce-light" />
            <span className="host-extra-sauce host-extra-sauce-dark" />
            {hostBannerImage ? (
              <img src={hostBannerImage} alt="" />
            ) : (
              <HostMediaPlaceholder />
            )}
          </div>
        </article>

        <nav className="host-bottom-nav" aria-label="Navegacion del menu">
          <button type="button" className="active" onClick={onNavigateHome}>
            <IconHome />
            <span>Inicio</span>
          </button>
          <button type="button" onClick={onNavigatePromos}>
            <IconSpark />
            <span>Promos</span>
          </button>
          <button type="button" className="host-bottom-primary" onClick={onOpenCart}>
            <IconFlame />
            <span>Pedi ahora</span>
          </button>
          <button type="button" onClick={onNavigateMenu}>
            <IconCart />
            <span>Pedidos</span>
          </button>
          <button type="button" onClick={onOpenLoyalty}>
            <IconAward />
            <span>Mis puntos</span>
          </button>
        </nav>
      </section>
    )
  }

  if (templateId === 'pizzeria') {
    const highlightedItems = categoryItems.slice(0, 4)

    return (
      <section className="section-block section-block-pizzeria">
        <div className="pizzeria-card-grid">
          {highlightedItems.map((item) => (
            <article key={item.id} className="pizzeria-dish-card">
              <button type="button" className="pizzeria-dish-media" onClick={() => onOpenDish(item)}>
                {renderProductMedia(item)}
              </button>

              <div className="pizzeria-dish-body">
                <button type="button" className="pizzeria-dish-copy" onClick={() => onOpenDish(item)}>
                  <h3>{getPizzeriaDishTitle(item)}</h3>
                  <p>{item.description}</p>
                </button>

                <div className="pizzeria-dish-footer">
                  <strong>{item.price}</strong>
                  <button
                    type="button"
                    className="pizzeria-add-button"
                    onClick={() => onAddItem(item)}
                    aria-label={`Agregar ${item.name}`}
                  >
                    <IconPlus />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <article className="pizzeria-drinks-banner">
          <img className="pizzeria-footer-art" src="/pizzeria/footer2.png" alt="" aria-hidden="true" />
          <button
            type="button"
            className="pizzeria-footer-hitbox"
            onClick={() =>
              onSelectCategory?.(
                categories.find((category) => slugify(category.label).includes('bebida'))?.id ??
                  currentCategory?.id,
              )
            }
            aria-label="Ver bebidas"
          />
          <div className="pizzeria-drinks-copy">
            <strong>¿ALGO PARA TOMAR?</strong>
            <button
              type="button"
              className="pizzeria-drinks-button"
              onClick={() =>
                onSelectCategory?.(
                  categories.find((category) => slugify(category.label).includes('bebida'))?.id ??
                    currentCategory?.id,
                )
              }
            >
              VER BEBIDAS
              <span className="pizzeria-drinks-icon">
                <IconDrink />
              </span>
            </button>
          </div>
        </article>
      </section>
    )
  }

  if (templateId === 'gelato') {
    return (
      <section className="section-block">
        <div className="gelato-format-stack">
          {gelatoFormats.map((format) => (
            <button
              key={format.id}
              type="button"
              className={`gelato-format-card ${format.enabled ? 'active' : 'disabled'}`}
              onClick={() => format.enabled && onOpenGelatoBuilder(format.id, 2)}
              disabled={!format.enabled}
            >
              <div className="gelato-format-copy">
                <h3>
                  {format.title.split(' ').slice(0, 1).join(' ')}
                  <br />
                  {format.title.split(' ').slice(1).join(' ')}
                </h3>
                <p>{format.description}</p>
              </div>

              <div className={`gelato-format-visual gelato-format-visual-${format.id}`}>
                <img className="gelato-format-image gelato-format-image-main" src={format.image} alt={format.title} />
                {format.secondaryImage ? (
                  <img
                    className="gelato-format-image gelato-format-image-secondary"
                    src={format.secondaryImage}
                    alt=""
                    aria-hidden="true"
                  />
                ) : null}
              </div>
            </button>
          ))}
        </div>

        <article className="gelato-loyalty-banner">
          <img
            className="gelato-loyalty-mascot"
            src="/gelato/heladito.png"
            alt=""
            aria-hidden="true"
          />
          <span className="gelato-loyalty-spark" aria-hidden="true">
            ♡
          </span>
          <div className="gelato-loyalty-copy">
            <strong>¡Acumulá puntos!</strong>
            <p>Por cada compra ganás puntos canjeables por helados gratis.</p>
          </div>
          <button type="button" className="gelato-loyalty-action" aria-label="Ver puntos">
            {'>'}
          </button>
        </article>
      </section>
    )
  }

  if (templateId === 'bistro') {
    const featuredItem = categoryItems[0]
    const secondaryItems = categoryItems.slice(1)

    return (
      <section className="section-block">
        <div className="section-heading">
          <h2>{(currentCategory?.label ?? 'Seleccion').toUpperCase()}</h2>
          <button type="button">Ver todo</button>
        </div>

        {featuredItem ? (
          <article className="bistro-feature-card">
            <button type="button" className="bistro-feature-media" onClick={() => onOpenDish(featuredItem)}>
              {renderProductMedia(featuredItem)}
            </button>
            <div className="bistro-feature-body">
              <span className="bistro-feature-badge">DESTACADO</span>
              <button type="button" className="dish-main" onClick={() => onOpenDish(featuredItem)}>
                <h3>{featuredItem.name}</h3>
                <p>{featuredItem.description}</p>
              </button>
              <div className="dish-footer">
                <strong>{featuredItem.price}</strong>
                <button
                  type="button"
                  className="add-button"
                  onClick={() => onAddItem(featuredItem)}
                  aria-label={`Agregar ${featuredItem.name}`}
                >
                  <IconPlus />
                </button>
              </div>
            </div>
          </article>
        ) : null}

        <div className="bistro-stack">
          {secondaryItems.map((item) => (
            <article key={item.id} className="bistro-stack-card">
              <button type="button" className="bistro-stack-main" onClick={() => onOpenDish(item)}>
                <h3>{item.name}</h3>
                <p>{item.description}</p>
              </button>
              <div className="bistro-stack-side">
                <strong>{item.price}</strong>
                <button
                  type="button"
                  className="mini-add"
                  onClick={() => onAddItem(item)}
                  aria-label={`Agregar ${item.name}`}
                >
                  <IconPlus />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    )
  }

  if (templateId === 'luxe') {
    return (
      <section className="section-block">
        <div className="section-heading">
          <h2>{(currentCategory?.label ?? 'Seleccion').toUpperCase()}</h2>
          <button type="button">Explorar</button>
        </div>

        <div className="luxe-card-grid">
          {categoryItems.map((item, index) => (
            <article key={item.id} className="luxe-card">
              <button type="button" className="luxe-card-media" onClick={() => onOpenDish(item)}>
                {renderProductMedia(item)}
                {index === 0 ? <span className="dish-badge">Signature</span> : null}
                {item.video && presentation.preview?.productMedia === 'image-with-video-chip' ? (
                  <span className="video-badge">
                    <IconPlay />
                    Video
                  </span>
                ) : null}
              </button>
              <div className="luxe-card-body">
                <button type="button" className="dish-main" onClick={() => onOpenDish(item)}>
                  <h3>{item.name}</h3>
                  <p>{item.description}</p>
                </button>
                <div className="dish-footer">
                  <strong>{item.price}</strong>
                  <button
                    type="button"
                    className="mini-add"
                    onClick={() => onAddItem(item)}
                    aria-label={`Agregar ${item.name}`}
                  >
                    <IconPlus />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className="section-block">
      <div className="section-heading">
        <h2>{(currentCategory?.label ?? 'Entradas').toUpperCase()}</h2>
        <button type="button">Ver todas</button>
      </div>

      <div className="dish-list">
        {categoryItems.map((item, index) => (
          <article key={item.id} className="dish-card">
            <button type="button" className="dish-media-button" onClick={() => onOpenDish(item)}>
              {renderProductMedia(item)}
              {index === 0 ? <span className="dish-badge">Mas pedido</span> : null}
              {item.video && presentation.preview?.productMedia === 'image-with-video-chip' ? (
                <span className="video-badge">
                  <IconPlay />
                  Video
                </span>
              ) : null}
            </button>

            <div className="dish-body">
              <button type="button" className="dish-main" onClick={() => onOpenDish(item)}>
                <h3>{item.name}</h3>
                <p>{item.description}</p>
              </button>

              <div className="dish-footer">
                <strong>{item.price}</strong>
                <button
                  type="button"
                  className="add-button"
                  onClick={() => onAddItem(item)}
                  aria-label={`Agregar ${item.name}`}
                >
                  <IconPlus />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default function MenuApp() {
  const [accountId] = useState(getInitialAccountId)
  const [menu, setMenu] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedDish, setSelectedDish] = useState(null)
  const [status, setStatus] = useState('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [cart, setCart] = useState([])
  const [rewardRedemptions, setRewardRedemptions] = useState([])
  const [detailQuantity, setDetailQuantity] = useState(1)
  const [selectedOptions, setSelectedOptions] = useState({})
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [checkoutStatus, setCheckoutStatus] = useState('idle')
  const [checkoutMessage, setCheckoutMessage] = useState('')
  const [lastOrder, setLastOrder] = useState(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [isLoyaltyOpen, setIsLoyaltyOpen] = useState(false)
  const [loyaltyPhone, setLoyaltyPhone] = useState('')
  const [loyaltyStatus, setLoyaltyStatus] = useState('idle')
  const [loyaltyMessage, setLoyaltyMessage] = useState('')
  const [loyaltyData, setLoyaltyData] = useState(null)
  const [cartFeedback, setCartFeedback] = useState(null)
  const cartFeedbackIdRef = useRef(0)
  const [gelatoBuilderOpen, setGelatoBuilderOpen] = useState(false)
  const [gelatoStep, setGelatoStep] = useState(1)
  const [gelatoFormat, setGelatoFormat] = useState('kilo')
  const [gelatoSizeId, setGelatoSizeId] = useState('')
  const [gelatoFlavorFilter, setGelatoFlavorFilter] = useState('Todos')
  const [gelatoSelectedFlavors, setGelatoSelectedFlavors] = useState([])
  const [orderForm, setOrderForm] = useState({
    name: '',
    phone: '',
    address: '',
    neighborhood: '',
    city: '',
    deliveryType: 'delivery',
    paymentMethod: 'cash',
    notes: '',
  })

  useEffect(() => {
    let cancelled = false

    async function loadMenu() {
      setStatus('loading')
      setErrorMessage('')

      try {
        const response = await fetch(`/api/accounts/${accountId}/menu`, { cache: 'no-store' })
        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload.message ?? 'No se pudo cargar el menu.')
        }

        if (cancelled) {
          return
        }

        setMenu(payload)
        setSelectedCategory(getInitialCategoryId(payload))
        setStatus('ready')
      } catch (error) {
        if (cancelled) {
          return
        }

        setStatus('error')
        setErrorMessage(
          error instanceof Error ? error.message : 'No se pudo cargar el menu.',
        )
      }
    }

    loadMenu()

    return () => {
      cancelled = true
    }
  }, [accountId])

  useEffect(() => {
    if (!cartFeedback) {
      return undefined
    }

    const timeout = window.setTimeout(() => {
      setCartFeedback(null)
    }, 1700)

    return () => window.clearTimeout(timeout)
  }, [cartFeedback])

  const presentation = menu?.presentation ?? defaultPresentation
  const categories = menu?.categories ?? emptyCategories
  const currentCategory =
    categories.find((category) => category.id === selectedCategory) ?? categories[0] ?? null
  const categoryItems = currentCategory?.items ?? []
  const heroDish = categoryItems[0] ?? categories.flatMap((category) => category.items)[0] ?? null
  const allItems = categories.flatMap((category) =>
    category.items.map((item) => ({
      ...item,
      categoryLabel: category.label,
    })),
  )
  const gelatoFormats = getGelatoFormats()
  const gelatoSizeOptions = [
    ...(categories.find((category) => slugify(category.label).includes('formato-tamano'))?.items ?? []),
  ].sort((a, b) => a.unitPrice - b.unitPrice)
  const gelatoFlavorOptions =
    categories.find((category) => slugify(category.label).includes('sabores'))?.items.map((item) => ({
      ...item,
      flavorCategory: getGelatoFlavorCategory(item.name),
    })) ?? []
  const selectedGelatoSize =
    gelatoSizeOptions.find((item) => item.id === gelatoSizeId) ?? gelatoSizeOptions[0] ?? null
  const gelatoFlavorLimit = getGelatoFlavorLimit(selectedGelatoSize?.name)
  const gelatoFlavorCategories = ['Todos', 'Frutales', 'Clasicos', 'Chocolate', 'Especiales']
  const filteredGelatoFlavors =
    gelatoFlavorFilter === 'Todos'
      ? gelatoFlavorOptions
      : gelatoFlavorOptions.filter((item) => item.flavorCategory === gelatoFlavorFilter)
  const recommendations = allItems
    .filter((item) => item.id !== selectedDish?.id)
    .slice(0, 4)
  const currencySymbol = menu?.currencySymbol ?? '$'

  const cartCount = useMemo(() => cart.reduce((total, line) => total + line.quantity, 0), [cart])

  const cartTotal = useMemo(
    () => cart.reduce((total, line) => total + line.unitPrice * line.quantity, 0),
    [cart],
  )

  const cartItems = cart
  const redemptionCount = useMemo(
    () => rewardRedemptions.reduce((total, line) => total + line.quantity, 0),
    [rewardRedemptions],
  )
  const redemptionPointsTotal = useMemo(
    () => rewardRedemptions.reduce((total, line) => total + line.pointsCost * line.quantity, 0),
    [rewardRedemptions],
  )
  const orderCount = cartCount + redemptionCount
  const hasOrderItems = orderCount > 0
  const orderTotalLabel = cartTotal > 0
    ? formatPrice(cartTotal, currencySymbol)
    : redemptionCount > 0
      ? 'Canje'
      : 'Sin productos'
  const pointsName = loyaltyData?.settings?.pointsName ?? menu?.loyalty?.settings?.pointsName ?? 'puntos'
  const cartRecommendations = buildCartRecommendations(cartItems, allItems)
  const cartPairings = buildCartPairingSuggestions(cartItems)

  function handleAddItem(item, quantity = 1, configuration = null) {
    const unitPrice = configuration?.unitPrice ?? item.unitPrice ?? toNumericPrice(item.price)
    const notes = configuration?.summary ?? ''
    const lineId = `${item.id}::${notes || 'default'}`

    cartFeedbackIdRef.current += 1

    setCartFeedback({
      id: `${lineId}-${cartFeedbackIdRef.current}`,
      name: item.name,
      quantity,
    })

    setCart((current) => {
      const existingIndex = current.findIndex((line) => line.lineId === lineId)

      if (existingIndex >= 0) {
        return current.map((line, index) =>
          index === existingIndex
            ? {
                ...line,
                quantity: line.quantity + quantity,
              }
            : line,
        )
      }

      return [
        ...current,
        {
          lineId,
          id: item.id,
          name: item.name,
          price: formatPrice(unitPrice, currencySymbol),
          unitPrice,
          quantity,
          notes,
          image: item.image,
          categoryLabel: item.categoryLabel ?? currentCategory?.label ?? '',
        },
      ]
    })
  }

  function handleSetItemQuantity(lineId, quantity) {
    setCart((current) => {
      if (quantity <= 0) {
        return current.filter((line) => line.lineId !== lineId)
      }

      return current.map((line) =>
        line.lineId === lineId
          ? {
              ...line,
              quantity,
            }
          : line,
      )
    })
  }

  function handleOpenDish(item) {
    const nextDish = { ...item, categoryLabel: item.categoryLabel ?? currentCategory?.label }
    const groups = buildProductOptionGroups(nextDish, allItems)
    setSelectedDish(nextDish)
    setDetailQuantity(1)
    setSelectedOptions(buildInitialSelections(groups))
  }

  function handleSelectDetailOption(group, optionValue) {
    const limit = getGroupSelectionLimit(group)

    setSelectedOptions((current) => {
      if (isGroupMultiple(group)) {
        const currentValues = Array.isArray(current[group.id]) ? current[group.id] : []

        if (currentValues.includes(optionValue)) {
          return {
            ...current,
            [group.id]: currentValues.filter((entry) => entry !== optionValue),
          }
        }

        if (limit && currentValues.length >= limit) {
          return current
        }

        const nextValues = [...currentValues, optionValue]

        return {
          ...current,
          [group.id]: nextValues,
        }
      }

      return {
        ...current,
        [group.id]: current[group.id] === optionValue && !group.required ? '' : optionValue,
      }
    })
  }

  function handleOpenGelatoBuilder(formatId = 'kilo', initialStep = 1) {
    setGelatoFormat(formatId)
    setGelatoStep(initialStep)
    setGelatoSizeId(gelatoSizeOptions[0]?.id ?? '')
    setGelatoFlavorFilter('Todos')
    setGelatoSelectedFlavors([])
    setGelatoBuilderOpen(true)
  }

  function handleToggleGelatoFlavor(flavorId) {
    setGelatoSelectedFlavors((current) => {
      if (current.includes(flavorId)) {
        return current.filter((entry) => entry !== flavorId)
      }

      if (current.length >= gelatoFlavorLimit) {
        return current
      }

      return [...current, flavorId]
    })
  }

  function handleAddGelatoOrder() {
    if (!selectedGelatoSize || !gelatoSelectedFlavors.length) {
      return
    }

    const selectedFlavorNames = gelatoFlavorOptions
      .filter((item) => gelatoSelectedFlavors.includes(item.id))
      .map((item) => item.name)

    handleAddItem(
      {
        ...selectedGelatoSize,
        categoryLabel: 'Helados',
      },
      1,
      {
        summary: `Formato: ${gelatoFormat} | Sabores: ${selectedFlavorNames.join(', ')}`,
      },
    )

    setGelatoBuilderOpen(false)
    setGelatoStep(1)
    setGelatoSelectedFlavors([])
  }

  function renderProductMedia(item) {
    if (templateId === 'host' && !item.video && !item.hasCustomImage) {
      return <HostMediaPlaceholder />
    }

    const useForcedHostVideoPreview = shouldForceVideoPreviewForBurgerHost(
      accountId,
      templateId,
      categories,
    )

    if (shouldRenderPreviewVideo(item, presentation) || (item.video && useForcedHostVideoPreview)) {
      return (
        <video
          className="dish-thumb"
          src={getVideoFrameSrc(item.video)}
          preload="auto"
          autoPlay={shouldAutoplayVideoPreview(presentation) || useForcedHostVideoPreview}
          muted={presentation.preview?.mutedVideos ?? true}
          loop={shouldAutoplayVideoPreview(presentation) || useForcedHostVideoPreview}
          playsInline
        />
      )
    }

    return <img src={item.image} alt={item.name} className="dish-thumb" />
  }

  function renderRewardMedia(reward) {
    if (reward.videoUrl) {
      return (
        <video
          src={getVideoFrameSrc(reward.videoUrl)}
          preload="auto"
          autoPlay
          muted
          loop
          playsInline
        />
      )
    }

    if (reward.imageUrl) {
      return <img src={reward.imageUrl} alt="" />
    }

    return (
      <span className="loyalty-reward-placeholder">
        <IconAward />
      </span>
    )
  }

  function updateOrderForm(field, value) {
    setOrderForm((current) => ({
      ...current,
      [field]: value,
    }))

    if (field === 'phone') {
      setLoyaltyPhone(value)
    }
  }

  function handleAddRewardRedemption(reward) {
    const availablePoints = loyaltyData?.balance ?? 0
    const pointsCost = Number(reward.pointsCost ?? 0)

    if (!reward.redeemable || redemptionPointsTotal + pointsCost > availablePoints) {
      setLoyaltyMessage('Todavia no alcanzan los puntos para sumar este canje.')
      return
    }

    cartFeedbackIdRef.current += 1
    setCartFeedback({
      id: `reward-${reward.id}-${cartFeedbackIdRef.current}`,
      name: `Canje: ${reward.title}`,
      quantity: 1,
    })
    setLoyaltyMessage('Canje agregado al pedido.')

    setRewardRedemptions((current) => {
      const existing = current.find((line) => line.rewardId === reward.id)

      if (existing) {
        return current.map((line) =>
          line.rewardId === reward.id
            ? {
                ...line,
                quantity: line.quantity + 1,
              }
            : line,
        )
      }

      return [
        ...current,
        {
          rewardId: reward.id,
          title: reward.title,
          pointsCost,
          quantity: 1,
          imageUrl: reward.imageUrl,
          videoUrl: reward.videoUrl,
        },
      ]
    })
  }

  function handleSetRewardQuantity(rewardId, quantity) {
    const availablePoints = loyaltyData?.balance ?? 0

    setRewardRedemptions((current) => {
      if (quantity <= 0) {
        return current.filter((line) => line.rewardId !== rewardId)
      }

      const lineToUpdate = current.find((line) => line.rewardId === rewardId)

      if (!lineToUpdate) {
        return current
      }

      const otherPoints = current
        .filter((line) => line.rewardId !== rewardId)
        .reduce((total, line) => total + line.pointsCost * line.quantity, 0)

      if (otherPoints + lineToUpdate.pointsCost * quantity > availablePoints) {
        return current
      }

      return current.map((line) =>
        line.rewardId === rewardId
          ? {
              ...line,
              quantity,
            }
          : line,
      )
    })
  }

  function scrollToMenuTarget(selector, block = 'start') {
    window.requestAnimationFrame(() => {
      document.querySelector(selector)?.scrollIntoView({
        behavior: 'smooth',
        block,
      })
    })
  }

  function handleNavigateHome() {
    scrollToMenuTarget('[data-menu-hero]')
  }

  function handleNavigateMenu() {
    scrollToMenuTarget('[data-menu-categories]')
  }

  function handleNavigatePromos() {
    scrollToMenuTarget('[data-burger-promos]', 'center')
  }

  function handleOpenLoyalty() {
    setLoyaltyPhone((current) => current || orderForm.phone)
    setLoyaltyMessage('')
    setIsLoyaltyOpen(true)
  }

  async function handleCheckLoyalty(event) {
    event.preventDefault()

    const phone = loyaltyPhone.trim()

    if (!phone) {
      setLoyaltyStatus('error')
      setLoyaltyMessage('Ingresa tu numero de celular para consultar tus puntos.')
      return
    }

    setLoyaltyStatus('loading')
    setLoyaltyMessage('')

    try {
      const response = await fetch(
        `/api/accounts/${accountId}/loyalty?phone=${encodeURIComponent(phone)}`,
        { cache: 'no-store' },
      )
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.message ?? 'No se pudieron consultar los puntos.')
      }

      setLoyaltyData(payload)
      setLoyaltyStatus('ready')
    } catch (error) {
      setLoyaltyData(null)
      setLoyaltyStatus('error')
      setLoyaltyMessage(
        error instanceof Error ? error.message : 'No se pudieron consultar los puntos.',
      )
    }
  }

  async function handleSubmitOrder(event) {
    event.preventDefault()

    if (!hasOrderItems) {
      setCheckoutMessage('Agrega productos o canjes antes de enviar el pedido.')
      return
    }

    if (orderForm.deliveryType === 'delivery' && !orderForm.address.trim()) {
      setCheckoutStatus('error')
      setCheckoutMessage('Si eliges delivery, debes ingresar la direccion.')
      return
    }

    setCheckoutStatus('submitting')
    setCheckoutMessage('')

    const payload = {
      customer: {
        name: orderForm.name.trim(),
        phone: orderForm.phone.trim(),
        address: orderForm.address.trim(),
        neighborhood: orderForm.neighborhood.trim(),
        city: orderForm.city.trim(),
      },
      deliveryType: orderForm.deliveryType,
      paymentMethod: orderForm.paymentMethod,
      notes: orderForm.notes.trim(),
      items: cartItems.map((item) => ({
        productId: item.id,
        name: item.name,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        notes: item.notes || '',
      })),
      redemptions: rewardRedemptions.map((item) => ({
        rewardId: item.rewardId,
        quantity: item.quantity,
      })),
    }

    try {
      const response = await fetch(`/api/accounts/${accountId}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message ?? 'No se pudo enviar el pedido.')
      }

      setLastOrder(result)
      setCheckoutStatus('success')
      setCheckoutMessage(`Pedido enviado. Numero #${result.orderNumber}`)
      setCart([])
      setRewardRedemptions([])
      setLoyaltyData((current) =>
        current
          ? {
              ...current,
              balance: result.loyalty?.balance ?? current.balance,
              rewards: current.rewards?.map((reward) => ({
                ...reward,
                redeemable:
                  current.settings?.allowRedemption &&
                  (result.loyalty?.balance ?? current.balance) >= reward.pointsCost,
              })),
            }
          : current,
      )
      setIsCheckoutOpen(false)
      setSelectedDish(null)
      setShowConfirmation(true)
    } catch (error) {
      setCheckoutStatus('error')
      setCheckoutMessage(error instanceof Error ? error.message : 'No se pudo enviar el pedido.')
    }
  }

  const detailOptionGroups = selectedDish ? buildProductOptionGroups(selectedDish, allItems) : []
  const detailExtraTotal = selectedDish
    ? calculateSelectionsExtraTotal(detailOptionGroups, selectedOptions)
    : 0
  const detailSelectionsValid = selectedDish
    ? areSelectionsValid(detailOptionGroups, selectedOptions)
    : true
  const templateId = presentation.template ?? presentation.layout ?? 'editorial'
  const isHostDetail = templateId === 'host' && Boolean(selectedDish)
  const detailHasHeroMedia = Boolean(selectedDish?.video || selectedDish?.hasCustomImage)
  const appClassName = [
    'menu-app',
    `template-${templateId}`,
    `layout-${presentation.layout}`,
    `cards-${presentation.cards?.style ?? 'editorial-list'}`,
    `theme-${presentation.theme.id}`,
  ].join(' ')

  if (status === 'loading') {
    return <MenuLoadingScreen accountId={accountId} />
  }

  return (
    <>
      <div className="app-shell">
        <div className={`phone-surface ${appClassName}`} style={getPresentationStyles(presentation)}>
          <header className={`hero hero-${templateId}`} data-menu-hero>
            {templateId !== 'host' ? (
              <div className="hero-topbar">
                <button
                  type="button"
                  className="icon-button"
                  aria-label="Abrir menu"
                  onClick={handleNavigateMenu}
                >
                  <IconMenu />
                </button>

                <button
                  type="button"
                  className="cart-button"
                  aria-label="Ver pedido"
                  onClick={() => setIsCartOpen(true)}
                >
                  <IconCart />
                  {orderCount > 0 ? <span className="cart-badge">{orderCount}</span> : null}
                </button>
              </div>
            ) : null}

            {templateId !== 'gelato' &&
            templateId !== 'pizzeria' &&
            templateId !== 'burger' &&
            templateId !== 'blue-burger' &&
            templateId !== 'host' ? (
              <div className="brand hero-brand">
                <span className="brand-mark">
                  <IconLeafMark />
                </span>
                <span className="brand-name">{presentation.branding?.wordmark ?? menu?.accountName}</span>
                <span className="brand-subtitle">
                  {presentation.branding?.subtitle ?? 'DIGITAL MENU'}
                </span>
              </div>
            ) : null}

            <TemplateHero
              templateId={templateId}
              presentation={presentation}
              heroDish={heroDish}
              onPrimaryAction={handleNavigateMenu}
            />
          </header>

          <main className="content-panel">
            {status === 'error' ? (
              <section className="state-panel">
                <p>{errorMessage}</p>
                <span>Revisa la cuenta o intenta nuevamente.</span>
              </section>
            ) : null}

            {status === 'ready' ? (
              <>
                {templateId === 'pizzeria' || templateId === 'burger' || templateId === 'host' ? (
                  <div data-menu-categories>
                    <TemplateCategorySelector
                      accountId={accountId}
                      templateId={templateId}
                      categories={categories}
                      currentCategory={currentCategory}
                      onSelectCategory={setSelectedCategory}
                    />
                  </div>
                ) : null}

                {templateId !== 'gelato' &&
                templateId !== 'pizzeria' &&
                templateId !== 'burger' &&
                templateId !== 'blue-burger' &&
                templateId !== 'host' ? (
                  <section className="section-block" data-section="categories">
                    <div className="section-heading">
                      <h2>Categorias</h2>
                      <button type="button">Ver todas</button>
                    </div>

                    <TemplateCategorySelector
                      templateId={templateId}
                      categories={categories}
                      currentCategory={currentCategory}
                      onSelectCategory={setSelectedCategory}
                    />
                  </section>
                ) : null}

                <TemplateMenuCollection
                  templateId={templateId}
                  categories={categories}
                  currentCategory={currentCategory}
                  categoryItems={categoryItems}
                  presentation={presentation}
                  renderProductMedia={renderProductMedia}
                  onOpenDish={handleOpenDish}
                  onAddItem={handleAddItem}
                  onSelectCategory={setSelectedCategory}
                  onOpenCart={() => setIsCartOpen(true)}
                  onOpenLoyalty={handleOpenLoyalty}
                  onNavigateHome={handleNavigateHome}
                  onNavigateMenu={handleNavigateMenu}
                  onNavigatePromos={handleNavigatePromos}
                  gelatoFormats={gelatoFormats}
                  onOpenGelatoBuilder={handleOpenGelatoBuilder}
                />
              </>
            ) : null}
          </main>

          {templateId !== 'gelato' &&
          templateId !== 'burger' &&
          templateId !== 'blue-burger' &&
          templateId !== 'host' &&
          (templateId !== 'pizzeria' || hasOrderItems) ? (
            <footer className="order-bar">
              <button type="button" className="order-bar-button" onClick={() => setIsCartOpen(true)}>
                <div className="order-bar-copy">
                  <span className="order-icon-wrap">
                    <IconCart />
                    {orderCount > 0 ? <span className="order-badge">{orderCount}</span> : null}
                  </span>
                  <span>Ver mi pedido</span>
                </div>
                <div className="order-bar-price">
                  {orderTotalLabel}
                  <span className="order-arrow">{'>'}</span>
                </div>
              </button>
            </footer>
          ) : null}
        </div>
      </div>

      {cartFeedback ? (
        <div
          key={cartFeedback.id}
          className={`cart-added-toast ${templateId === 'burger' || templateId === 'host' ? 'cart-added-toast-burger' : ''}`}
          role="status"
          aria-live="polite"
        >
          <span className="cart-added-icon">
            <IconCart />
          </span>
          <div>
            <strong>Agregado al pedido</strong>
            <p>
              {cartFeedback.quantity > 1 ? `${cartFeedback.quantity} x ` : ''}
              {cartFeedback.name}
            </p>
          </div>
        </div>
      ) : null}

      {templateId === 'gelato' && gelatoBuilderOpen ? (
        <div className="detail-screen" role="presentation" onClick={() => setGelatoBuilderOpen(false)}>
          <div
            className={`detail-phone ${appClassName}`}
            style={getPresentationStyles(presentation)}
            onClick={(event) => event.stopPropagation()}
          >
            <section className="gelato-builder">
              <div className="gelato-builder-top">
                <button
                  type="button"
                  className="floating-button light"
                  onClick={() => {
                    if (gelatoStep === 1) {
                      setGelatoBuilderOpen(false)
                      return
                    }

                    setGelatoStep((current) => Math.max(1, current - 1))
                  }}
                  aria-label="Volver"
                >
                  <IconBack />
                </button>

                <div className="gelato-builder-brand">
                  <img className="gelato-builder-brand-image" src="/gelato/logo-dolce.png" alt="Dolce Heladeria" />
                </div>

                <button type="button" className="cart-button" onClick={() => setIsCartOpen(true)}>
                  <IconCart />
                  {orderCount > 0 ? <span className="cart-badge">{orderCount}</span> : null}
                </button>
              </div>

              <div className="gelato-stepper">
                {[
                  ['1', 'Elegi tipo'],
                  ['2', 'Elegi tamano'],
                  ['3', 'Elegi sabores'],
                ].map(([number, label], index) => {
                  const stepNumber = index + 1
                  const isActive = stepNumber === gelatoStep
                  const isDone = stepNumber < gelatoStep

                  return (
                    <div key={label} className={`gelato-step ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}>
                      <span>{number}</span>
                      <small>{label}</small>
                    </div>
                  )
                })}
              </div>

              {gelatoStep === 1 ? (
                <div className="gelato-builder-section">
                  <div className="gelato-builder-copy">
                    <span className="gelato-builder-icon" aria-hidden="true" />
                    <h2>Elegi el formato</h2>
                    <p>Escoge como quieres disfrutar tu helado antes de seguir.</p>
                  </div>

                  <div className="gelato-size-list gelato-format-select-list">
                    {gelatoFormats.map((format) => (
                      <button
                        key={format.id}
                        type="button"
                        className={`gelato-size-card gelato-format-select-card ${
                          gelatoFormat === format.id ? 'selected' : ''
                        }`}
                        style={{
                          '--gelato-size-accent': format.accent,
                          '--gelato-size-tint': format.tint,
                        }}
                        onClick={() => format.enabled && setGelatoFormat(format.id)}
                        disabled={!format.enabled}
                      >
                        <div className="gelato-size-visual">
                          <span className="gelato-size-scoop">{format.icon}</span>
                        </div>
                        <div className="gelato-size-copy">
                          <strong>{format.title}</strong>
                          <span>{format.enabled ? 'Disponible ahora' : 'Muy pronto'}</span>
                          <small>{format.description}</small>
                        </div>
                        <span className="gelato-size-check" />
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="primary-action gelato-continue"
                    onClick={() => setGelatoStep(2)}
                  >
                    <span>Continuar</span>
                    <strong>{'>'}</strong>
                  </button>
                </div>
              ) : null}

              {gelatoStep === 2 ? (
                <div className="gelato-builder-section">
                  <div className="gelato-builder-copy">
                    <span className="gelato-builder-icon" aria-hidden="true" />
                    <h2>Elegi tu tamano</h2>
                    <p>Todos nuestros helados son artesanales y hechos con amor.</p>
                  </div>

                  <div className="gelato-size-list">
                    {gelatoSizeOptions.map((item, index) => {
                      const isSelected = item.id === selectedGelatoSize?.id
                      const tones = [
                        ['#ff5a92', '#fff0f5'],
                        ['#b96ed8', '#f6efff'],
                        ['#65d5c8', '#eefdfa'],
                      ]
                      const [accent, tint] = tones[index % tones.length]

                      return (
                        <button
                          key={item.id}
                          type="button"
                          className={`gelato-size-card ${isSelected ? 'selected' : ''}`}
                          style={{ '--gelato-size-accent': accent, '--gelato-size-tint': tint }}
                          onClick={() => setGelatoSizeId(item.id)}
                        >
                          <div className="gelato-size-visual">
                            <span className="gelato-size-scoop" />
                          </div>
                          <div className="gelato-size-copy">
                            <strong>{item.name}</strong>
                            <span>{item.price}</span>
                            <small>Hasta {getGelatoFlavorLimit(item.name)} sabores</small>
                          </div>
                          <span className="gelato-size-check" />
                        </button>
                      )
                    })}
                  </div>

                  <button
                    type="button"
                    className="primary-action gelato-continue"
                    onClick={() => setGelatoStep(3)}
                  >
                    <span>Continuar</span>
                    <strong>{'>'}</strong>
                  </button>

                  <article className="gelato-info-card">
                    <span className="gelato-info-icon">!</span>
                    <div>
                      <strong>Importante</strong>
                      <p>
                        Puedes elegir diferentes sabores dentro del limite permitido para cada tamano.
                      </p>
                    </div>
                  </article>
                </div>
              ) : null}

              {gelatoStep === 3 ? (
                <div className="gelato-builder-section">
                  <div className="gelato-builder-copy">
                    <span className="gelato-builder-icon" aria-hidden="true" />
                    <h2>Elegi tus sabores</h2>
                    <p>
                      Puedes elegir hasta <strong>{gelatoFlavorLimit}</strong> sabores para{' '}
                      <strong>{selectedGelatoSize?.name}</strong>.
                    </p>
                  </div>

                  <div className="gelato-flavor-filters">
                    {gelatoFlavorCategories.map((category) => (
                      <button
                        key={category}
                        type="button"
                        className={`gelato-filter-chip ${gelatoFlavorFilter === category ? 'active' : ''}`}
                        onClick={() => setGelatoFlavorFilter(category)}
                      >
                        {category}
                      </button>
                    ))}
                  </div>

                  <div className="gelato-flavor-grid">
                    {filteredGelatoFlavors.map((flavor) => {
                      const isSelected = gelatoSelectedFlavors.includes(flavor.id)

                      return (
                        <button
                          key={flavor.id}
                          type="button"
                          className={`gelato-flavor-card ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleToggleGelatoFlavor(flavor.id)}
                        >
                          <span className="gelato-flavor-plus">{isSelected ? '' : '+'}</span>
                          <img
                            className="gelato-flavor-image"
                            src={getGelatoFlavorAsset(flavor.name)}
                            alt={flavor.name}
                          />
                          <strong>{flavor.name}</strong>
                          <p>{flavor.description}</p>
                          <small>{flavor.flavorCategory}</small>
                        </button>
                      )
                    })}
                  </div>

                  <div className="gelato-builder-footer">
                    <span>{gelatoSelectedFlavors.length} / {gelatoFlavorLimit} sabores elegidos</span>
                    <button
                      type="button"
                      className="primary-action gelato-continue"
                      onClick={handleAddGelatoOrder}
                      disabled={!gelatoSelectedFlavors.length}
                    >
                      <span>Agregar al pedido</span>
                      <strong>{selectedGelatoSize?.price ?? ''}</strong>
                    </button>
                  </div>
                </div>
              ) : null}
            </section>
          </div>
        </div>
      ) : null}

      {selectedDish ? (
        <div className="detail-screen" role="presentation" onClick={() => setSelectedDish(null)}>
          <div
            className={`detail-phone ${appClassName}`}
            style={getPresentationStyles(presentation)}
            onClick={(event) => event.stopPropagation()}
          >
            {isHostDetail ? (
              <>
                {detailHasHeroMedia ? (
                  <div className="detail-hero host-detail-hero">
                    {selectedDish.video ? (
                      <video
                        src={getVideoFrameSrc(selectedDish.video)}
                        preload="auto"
                        autoPlay={shouldAutoplayVideoPreview(presentation)}
                        muted={presentation.preview?.mutedVideos ?? true}
                        loop={shouldAutoplayVideoPreview(presentation)}
                        playsInline
                      />
                    ) : (
                      <img src={selectedDish.image} alt={selectedDish.name} />
                    )}

                    <div className="detail-topbar host-detail-topbar">
                      <button
                        type="button"
                        className="floating-button dark"
                        onClick={() => setSelectedDish(null)}
                        aria-label="Volver"
                      >
                        <IconBack />
                      </button>
                      <div className="host-detail-topbar-actions">
                        <button type="button" className="floating-button dark" aria-label="Compartir">
                          <IconShare />
                        </button>
                        <button type="button" className="floating-button dark" aria-label="Favorito">
                          <IconHeart />
                        </button>
                      </div>
                    </div>

                    <span className="host-detail-hero-badge">Mas elegido</span>
                  </div>
                ) : null}

                <section className={`detail-sheet host-detail-sheet ${detailHasHeroMedia ? '' : 'no-hero'}`}>
                  {!detailHasHeroMedia ? (
                    <div className="detail-topbar host-detail-topbar host-detail-topbar-inline">
                      <button
                        type="button"
                        className="floating-button dark"
                        onClick={() => setSelectedDish(null)}
                        aria-label="Volver"
                      >
                        <IconBack />
                      </button>
                      <div className="host-detail-topbar-actions">
                        <button type="button" className="floating-button dark" aria-label="Compartir">
                          <IconShare />
                        </button>
                        <button type="button" className="floating-button dark" aria-label="Favorito">
                          <IconHeart />
                        </button>
                      </div>
                    </div>
                  ) : null}

                  <div className="host-detail-head">
                    <div className="host-detail-copy">
                      <h2>{String(selectedDish.name ?? '').toUpperCase()}</h2>
                      <p className="host-detail-summary">{selectedDish.description}</p>
                      <p className="host-detail-note">{getDetailNote(selectedDish)}</p>
                    </div>

                    <div className="host-detail-price-stack">
                      <strong>
                        {formatPrice(
                          selectedDish.unitPrice ?? toNumericPrice(selectedDish.price),
                          currencySymbol,
                        )}
                      </strong>

                      <div className="quantity-stepper host-quantity-stepper">
                        <button
                          type="button"
                          onClick={() => setDetailQuantity((current) => Math.max(1, current - 1))}
                          aria-label="Disminuir cantidad"
                        >
                          <IconMinus />
                        </button>
                        <span>{detailQuantity}</span>
                        <button
                          type="button"
                          onClick={() => setDetailQuantity((current) => current + 1)}
                          aria-label="Aumentar cantidad"
                        >
                          <IconPlus />
                        </button>
                      </div>
                    </div>
                  </div>

                  {detailOptionGroups.map((group, index) => (
                    <div
                      key={group.id}
                      className={`option-group host-option-group host-option-group-${getHostOptionKind(group)}`}
                    >
                      <div className="host-option-head">
                        <h3>
                          {index + 1}. {String(group.title ?? '').toUpperCase()}
                          {getHostOptionKind(group) === 'drink' && (group.selectionLimit ?? 1) > 1
                            ? ` (${group.selectionLimit})`
                            : ''}
                        </h3>
                        <span>{group.required ? 'Obligatorio' : 'Opcional'}</span>
                      </div>

                      <div className={`option-grid host-option-grid host-option-grid-${getHostOptionKind(group)}`}>
                        {group.options.map((rawOption) => {
                          const option = normalizeOptionEntry(rawOption)
                          const selectedValue = selectedOptions[group.id]
                          const isSelected = Array.isArray(selectedValue)
                            ? selectedValue.includes(option.value)
                            : selectedValue === option.value
                          const optionMedia = renderDetailOptionMedia(option, presentation)
                          const optionKind = getHostOptionKind(group)

                          return (
                            <button
                              key={option.value}
                              type="button"
                              className={`option-card host-option-card ${
                                isSelected ? 'selected' : ''
                              } ${optionMedia ? 'has-media' : 'no-media'} host-option-card-${optionKind}`}
                              onClick={() => handleSelectDetailOption(group, option.value)}
                            >
                              {optionMedia ? (
                                <span className={`host-option-media host-option-media-${optionKind}`}>
                                  {optionMedia}
                                </span>
                              ) : null}
                              <span className="host-option-label">{option.label}</span>
                              {option.subtitle && optionKind === 'drink' ? (
                                <small className="host-option-subtitle">{option.subtitle}</small>
                              ) : null}
                              {Number(option.price || 0) > 0 ? (
                                <small>{formatPrice(Number(option.price || 0), currencySymbol)}</small>
                              ) : null}
                              {isSelected ? <span className="host-option-check">✓</span> : null}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </section>
              </>
            ) : (
              <>
                <div className="detail-hero">
                  {selectedDish.video ? (
                    <video
                      src={getVideoFrameSrc(selectedDish.video)}
                      preload="auto"
                      autoPlay={shouldAutoplayVideoPreview(presentation)}
                      muted={presentation.preview?.mutedVideos ?? true}
                      loop={shouldAutoplayVideoPreview(presentation)}
                      playsInline
                    />
                  ) : (
                    <img src={selectedDish.image} alt={selectedDish.name} />
                  )}

                  <div className="detail-topbar">
                    <button
                      type="button"
                      className="floating-button light"
                      onClick={() => setSelectedDish(null)}
                      aria-label="Volver"
                    >
                      <IconBack />
                    </button>
                    <button type="button" className="floating-button dark" aria-label="Favorito">
                      <IconHeart />
                    </button>
                  </div>
                </div>

                <section className="detail-sheet">
                  <div className="sheet-handle" />

                  <div className="detail-head">
                    <div>
                      <h2>{selectedDish.name}</h2>
                      <strong>
                        {formatPrice(
                          selectedDish.unitPrice ?? toNumericPrice(selectedDish.price),
                          currencySymbol,
                        )}
                      </strong>
                    </div>
                    {selectedDish.video ? (
                      <span className="detail-badge">
                        <IconPlay />
                        Vista previa
                      </span>
                    ) : (
                      <span className="detail-badge">
                        <IconSpark />
                        Mas pedido
                      </span>
                    )}
                  </div>

                  <p className="detail-description">{selectedDish.description}</p>

                  {detailOptionGroups.map((group) => (
                    <div key={group.id} className="option-group">
                      <h3>{group.title}</h3>
                      <p>
                        {isGroupMultiple(group)
                          ? group.required
                            ? `Obligatorio: elige ${group.minSelect || 1}${getGroupSelectionLimit(group) ? ` a ${getGroupSelectionLimit(group)}` : ' o más'}`
                            : `Opcional${getGroupSelectionLimit(group) ? `: hasta ${getGroupSelectionLimit(group)}` : ''}`
                          : group.required
                            ? 'Obligatorio: elige uno'
                            : 'Opcional'}
                      </p>
                      <div className="option-grid">
                        {group.options.map((rawOption) => {
                          const option = normalizeOptionEntry(rawOption)
                          const selectedValue = selectedOptions[group.id]
                          const isSelected = Array.isArray(selectedValue)
                            ? selectedValue.includes(option.value)
                            : selectedValue === option.value
                          const optionMedia = renderDetailOptionMedia(option, presentation)

                          return (
                            <button
                              key={option.value}
                              type="button"
                              className={`option-card ${isSelected ? 'selected' : ''} ${optionMedia ? 'has-media' : ''}`}
                              onClick={() => handleSelectDetailOption(group, option.value)}
                            >
                              {optionMedia ? optionMedia : null}
                              <span>{option.label}</span>
                              {Number(option.price || 0) > 0 ? (
                                <small>{formatPrice(Number(option.price || 0), currencySymbol)}</small>
                              ) : null}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}

                  <div className="quantity-stepper">
                    <button
                      type="button"
                      onClick={() => setDetailQuantity((current) => Math.max(1, current - 1))}
                      aria-label="Disminuir cantidad"
                    >
                      <IconMinus />
                    </button>
                    <span>{detailQuantity}</span>
                    <button
                      type="button"
                      onClick={() => setDetailQuantity((current) => current + 1)}
                      aria-label="Aumentar cantidad"
                    >
                      <IconPlus />
                    </button>
                  </div>

                  <button
                    type="button"
                    className="primary-action"
                    disabled={!detailSelectionsValid}
                    onClick={() => {
                      handleAddItem(selectedDish, detailQuantity, {
                        summary: buildSelectionSummary(detailOptionGroups, selectedOptions),
                        unitPrice:
                          (selectedDish.unitPrice ?? toNumericPrice(selectedDish.price)) + detailExtraTotal,
                      })
                      setSelectedDish(null)
                    }}
                  >
                    <span>Agregar al pedido</span>
                    <strong>
                      {formatPrice(
                        ((selectedDish.unitPrice ?? toNumericPrice(selectedDish.price)) + detailExtraTotal) *
                          detailQuantity,
                        currencySymbol,
                      )}
                    </strong>
                  </button>

                  {!detailSelectionsValid ? (
                    <p className="detail-note">Completa los opcionales obligatorios antes de agregar este producto.</p>
                  ) : null}

                  <p className="detail-note">{getDetailNote(selectedDish)}</p>

                  <div className="option-group recommendation-group">
                    <h3>Tambien te puede gustar</h3>
                    <div className="recommendation-row">
                      {recommendations.map((item) => (
                        <article key={item.id} className="mini-card">
                          {shouldRenderPreviewVideo(item, presentation) ? (
                            <video
                              src={getVideoFrameSrc(item.video)}
                              preload="auto"
                              autoPlay={shouldAutoplayVideoPreview(presentation)}
                              muted={presentation.preview?.mutedVideos ?? true}
                              loop={shouldAutoplayVideoPreview(presentation)}
                              playsInline
                            />
                          ) : (
                            <img src={item.image} alt={item.name} />
                          )}

                          <div className="mini-card-body">
                            <h4>{item.name}</h4>
                            <div className="mini-card-footer">
                              <strong>{item.price}</strong>
                              <button
                                type="button"
                                className="mini-add"
                                onClick={() => handleAddItem(item)}
                                aria-label={`Agregar ${item.name}`}
                              >
                                <IconPlus />
                              </button>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                </section>
              </>
            )}

            {(!isHostDetail && (templateId !== 'pizzeria' || hasOrderItems)) ? (
              <footer className="detail-order-bar">
                <button type="button" className="order-bar-button" onClick={() => setIsCartOpen(true)}>
                  <div className="order-bar-copy">
                    <span className="order-icon-wrap">
                      <IconCart />
                      {orderCount > 0 ? <span className="order-badge">{orderCount}</span> : null}
                    </span>
                    <span>Ver mi pedido</span>
                  </div>
                  <div className="order-bar-price">
                    {orderTotalLabel}
                    <span className="order-arrow">{'>'}</span>
                  </div>
                </button>
              </footer>
            ) : null}

            {isHostDetail ? (
              <footer className="detail-order-bar host-detail-order-bar">
                <div className="host-detail-total">
                  <span>Total</span>
                  <strong>
                    {formatPrice(
                      ((selectedDish.unitPrice ?? toNumericPrice(selectedDish.price)) + detailExtraTotal) *
                        detailQuantity,
                      currencySymbol,
                    )}
                  </strong>
                </div>
                <button
                  type="button"
                  className="host-detail-cart-button"
                  disabled={!detailSelectionsValid}
                  onClick={() => {
                    handleAddItem(selectedDish, detailQuantity, {
                      summary: buildSelectionSummary(detailOptionGroups, selectedOptions),
                      unitPrice:
                        (selectedDish.unitPrice ?? toNumericPrice(selectedDish.price)) + detailExtraTotal,
                    })
                    setSelectedDish(null)
                  }}
                >
                  <IconCart />
                  <span>Agregar al carrito</span>
                </button>
              </footer>
            ) : null}
          </div>
        </div>
      ) : null}

      {isCartOpen ? (
        <div className="detail-screen" role="presentation" onClick={() => setIsCartOpen(false)}>
          <div
            className={`detail-phone ${appClassName}`}
            style={getPresentationStyles(presentation)}
            onClick={(event) => event.stopPropagation()}
          >
            <section className="checkout-sheet">
              <div className="checkout-head">
                <button
                  type="button"
                  className="floating-button light"
                  onClick={() => setIsCartOpen(false)}
                  aria-label="Cerrar pedido"
                >
                  <IconBack />
                </button>
                <div>
                  <h2>Tu pedido</h2>
                  <p>Revisa el carrito y suma algo mas antes de confirmar.</p>
                </div>
              </div>

              <div className="checkout-summary">
                {hasOrderItems ? (
                  <>
                    {cartItems.map((item) => (
                      <div key={item.lineId} className="checkout-item">
                        <div>
                          <strong>{item.name}</strong>
                          <span>{formatPrice(item.unitPrice, currencySymbol)} c/u</span>
                          {item.notes ? <span className="checkout-item-notes">{item.notes}</span> : null}
                        </div>
                        <div className="checkout-item-controls">
                          <button
                            type="button"
                            onClick={() => handleSetItemQuantity(item.lineId, item.quantity - 1)}
                          >
                            <IconMinus />
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => handleSetItemQuantity(item.lineId, item.quantity + 1)}
                          >
                            <IconPlus />
                          </button>
                        </div>
                      </div>
                    ))}
                    {rewardRedemptions.map((item) => (
                      <div key={item.rewardId} className="checkout-item checkout-item-redemption">
                        <div>
                          <strong>{item.title}</strong>
                          <span>
                            Canje: {item.pointsCost} {pointsName} c/u
                          </span>
                        </div>
                        <div className="checkout-item-controls">
                          <button
                            type="button"
                            onClick={() => handleSetRewardQuantity(item.rewardId, item.quantity - 1)}
                          >
                            <IconMinus />
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => handleSetRewardQuantity(item.rewardId, item.quantity + 1)}
                          >
                            <IconPlus />
                          </button>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <section className="state-panel">
                    <p>Tu carrito esta vacio.</p>
                    <span>Agrega productos del menu para empezar tu pedido.</span>
                  </section>
                )}
              </div>

              {hasOrderItems ? (
                <>
                  {cartRecommendations.length ? (
                    <section className="cart-panel">
                      <div className="section-heading compact">
                        <h2>Recomendados para sumar</h2>
                      </div>
                      <div className="recommendation-row">
                        {cartRecommendations.map((item) => (
                          <article key={item.id} className="mini-card">
                            <img src={item.image} alt={item.name} />
                            <div className="mini-card-body">
                              <h4>{item.name}</h4>
                              <div className="mini-card-footer">
                                <strong>{item.price}</strong>
                                <button
                                  type="button"
                                  className="mini-add"
                                  onClick={() => handleAddItem(item)}
                                  aria-label={`Agregar ${item.name}`}
                                >
                                  <IconPlus />
                                </button>
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    </section>
                  ) : null}

                  {cartPairings.length ? (
                    <section className="cart-panel">
                      <div className="section-heading compact">
                        <h2>Acompanamientos sugeridos</h2>
                      </div>
                      <div className="pairing-grid">
                        {cartPairings.map((pairing) => (
                          <span key={pairing} className="pairing-chip">
                            {pairing}
                          </span>
                        ))}
                      </div>
                    </section>
                  ) : null}

                  <div className="cart-summary-card">
                    <div>
                      <span>Total actual</span>
                      {redemptionPointsTotal > 0 ? (
                        <small>
                          Canje: {redemptionPointsTotal} {pointsName}
                        </small>
                      ) : null}
                    </div>
                    <strong>{formatPrice(cartTotal, currencySymbol)}</strong>
                  </div>

                  <button
                    type="button"
                    className="primary-action"
                    onClick={() => {
                      setIsCartOpen(false)
                      setIsCheckoutOpen(true)
                    }}
                  >
                    <span>Continuar con tus datos</span>
                    <strong>{orderTotalLabel}</strong>
                  </button>
                </>
              ) : null}
            </section>
          </div>
        </div>
      ) : null}

      {isCheckoutOpen ? (
        <div className="detail-screen" role="presentation" onClick={() => setIsCheckoutOpen(false)}>
          <div
            className={`detail-phone ${appClassName}`}
            style={getPresentationStyles(presentation)}
            onClick={(event) => event.stopPropagation()}
          >
            <section className="checkout-sheet">
              <div className="checkout-head">
                <button
                  type="button"
                  className="floating-button light"
                  onClick={() => {
                    setIsCheckoutOpen(false)
                    setIsCartOpen(true)
                  }}
                  aria-label="Cerrar pedido"
                >
                  <IconBack />
                </button>
                <div>
                  <h2>Confirmar pedido</h2>
                  <p>Completa tus datos para terminar el pedido.</p>
                </div>
              </div>

              <div className="checkout-summary">
                {cartItems.map((item) => (
                  <div key={item.lineId} className="checkout-item">
                    <div>
                      <strong>{item.name}</strong>
                      <span>{formatPrice(item.unitPrice, currencySymbol)} c/u</span>
                      {item.notes ? <span className="checkout-item-notes">{item.notes}</span> : null}
                    </div>
                    <div className="checkout-item-controls">
                      <button
                        type="button"
                        onClick={() => handleSetItemQuantity(item.lineId, item.quantity - 1)}
                      >
                        <IconMinus />
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => handleSetItemQuantity(item.lineId, item.quantity + 1)}
                      >
                        <IconPlus />
                      </button>
                    </div>
                  </div>
                ))}
                {rewardRedemptions.map((item) => (
                  <div key={item.rewardId} className="checkout-item checkout-item-redemption">
                    <div>
                      <strong>{item.title}</strong>
                      <span>
                        Canje: {item.pointsCost} {pointsName} c/u
                      </span>
                    </div>
                    <div className="checkout-item-controls">
                      <button
                        type="button"
                        onClick={() => handleSetRewardQuantity(item.rewardId, item.quantity - 1)}
                      >
                        <IconMinus />
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => handleSetRewardQuantity(item.rewardId, item.quantity + 1)}
                      >
                        <IconPlus />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <form className="checkout-form" onSubmit={handleSubmitOrder}>
                <label className="checkout-field">
                  <span>Nombre</span>
                  <input
                    value={orderForm.name}
                    onChange={(event) => updateOrderForm('name', event.target.value)}
                    placeholder="Tu nombre"
                    required
                  />
                </label>

                <label className="checkout-field">
                  <span>Celular</span>
                  <input
                    value={orderForm.phone}
                    onChange={(event) => updateOrderForm('phone', event.target.value)}
                    placeholder="549..."
                    required
                  />
                </label>

                <div className="checkout-grid">
                  <label className="checkout-field">
                    <span>Entrega</span>
                    <select
                      value={orderForm.deliveryType}
                      onChange={(event) => updateOrderForm('deliveryType', event.target.value)}
                    >
                      <option value="delivery">Delivery</option>
                      <option value="retiro">Retiro</option>
                    </select>
                  </label>

                  <label className="checkout-field">
                    <span>Pago</span>
                    <select
                      value={orderForm.paymentMethod}
                      onChange={(event) => updateOrderForm('paymentMethod', event.target.value)}
                    >
                      <option value="cash">Efectivo</option>
                      <option value="transferencia">Transferencia</option>
                      <option value="mercado_pago">Mercado Pago</option>
                    </select>
                  </label>
                </div>

                {orderForm.deliveryType === 'delivery' ? (
                  <>
                    <label className="checkout-field">
                      <span>Direccion</span>
                      <input
                        value={orderForm.address}
                        onChange={(event) => updateOrderForm('address', event.target.value)}
                        placeholder="Calle 123"
                        required={orderForm.deliveryType === 'delivery'}
                      />
                    </label>

                    <div className="checkout-grid">
                      <label className="checkout-field">
                        <span>Barrio</span>
                        <input
                          value={orderForm.neighborhood}
                          onChange={(event) => updateOrderForm('neighborhood', event.target.value)}
                          placeholder="Barrio"
                        />
                      </label>

                      <label className="checkout-field">
                        <span>Ciudad</span>
                        <input
                          value={orderForm.city}
                          onChange={(event) => updateOrderForm('city', event.target.value)}
                          placeholder="Ciudad"
                        />
                      </label>
                    </div>
                  </>
                ) : null}

                <label className="checkout-field">
                  <span>Notas</span>
                  <textarea
                    rows="3"
                    value={orderForm.notes}
                    onChange={(event) => updateOrderForm('notes', event.target.value)}
                    placeholder="Aclaraciones del pedido"
                  />
                </label>

                {checkoutMessage ? <p className={`checkout-message ${checkoutStatus}`}>{checkoutMessage}</p> : null}
                {lastOrder ? <p className="checkout-message success">Ultimo pedido confirmado: #{lastOrder.orderNumber}</p> : null}

                <button
                  type="submit"
                  className="primary-action"
                  disabled={checkoutStatus === 'submitting'}
                >
                  <span>{checkoutStatus === 'submitting' ? 'Enviando pedido...' : 'Enviar pedido'}</span>
                  <strong>{orderTotalLabel}</strong>
                </button>
              </form>
            </section>
          </div>
        </div>
      ) : null}

      {isLoyaltyOpen ? (
        <div className="detail-screen" role="presentation" onClick={() => setIsLoyaltyOpen(false)}>
          <div
            className={`detail-phone ${appClassName}`}
            style={getPresentationStyles(presentation)}
            onClick={(event) => event.stopPropagation()}
          >
            <section className="checkout-sheet loyalty-sheet">
              <div className="checkout-head">
                <button
                  type="button"
                  className="floating-button light"
                  onClick={() => setIsLoyaltyOpen(false)}
                  aria-label="Cerrar puntos"
                >
                  <IconBack />
                </button>
                <div>
                  <h2>Mis puntos</h2>
                  <p>Ingresa tu celular y consulta el saldo acumulado en este menu.</p>
                </div>
              </div>

              <form className="checkout-form loyalty-form" onSubmit={handleCheckLoyalty}>
                <label className="checkout-field">
                  <span>Celular</span>
                  <input
                    value={loyaltyPhone}
                    onChange={(event) => setLoyaltyPhone(event.target.value)}
                    placeholder="549..."
                    inputMode="tel"
                    required
                  />
                </label>

                {loyaltyMessage ? (
                  <p className={`checkout-message ${loyaltyStatus}`}>{loyaltyMessage}</p>
                ) : null}

                <button
                  type="submit"
                  className="primary-action"
                  disabled={loyaltyStatus === 'loading'}
                >
                  <span>{loyaltyStatus === 'loading' ? 'Consultando...' : 'Consultar puntos'}</span>
                  <strong>
                    <IconAward />
                  </strong>
                </button>
              </form>

              {loyaltyStatus === 'ready' && loyaltyData ? (
                <div className="loyalty-result">
                  {loyaltyData.settings?.enabled ? (
                    <>
                      <div className="loyalty-balance-card">
                        <span>Saldo disponible</span>
                        <strong>
                          {loyaltyData.balance ?? 0} {loyaltyData.settings?.pointsName ?? 'puntos'}
                        </strong>
                        <small>
                          {loyaltyData.customer
                            ? `Numero asociado: ${loyaltyData.customer.phone}`
                            : 'Todavia no habia puntos asociados a este numero.'}
                        </small>
                      </div>

                      {loyaltyData.rewards?.length ? (
                        <section className="cart-panel">
                          <div className="section-heading compact">
                            <h2>Canjes disponibles</h2>
                          </div>
                          <div className="loyalty-reward-list">
                            {loyaltyData.rewards.map((reward) => {
                              const selectedReward = rewardRedemptions.find(
                                (line) => line.rewardId === reward.id,
                              )
                              const selectedPoints =
                                redemptionPointsTotal - (selectedReward?.pointsCost ?? 0) * (selectedReward?.quantity ?? 0)
                              const canAdd =
                                reward.redeemable &&
                                selectedPoints +
                                  (selectedReward?.pointsCost ?? reward.pointsCost) *
                                    ((selectedReward?.quantity ?? 0) + 1) <=
                                  (loyaltyData.balance ?? 0)

                              return (
                                <article
                                  key={reward.id}
                                  className={`loyalty-reward-card ${reward.redeemable ? 'redeemable' : ''}`}
                                >
                                  {renderRewardMedia(reward)}
                                  <div>
                                    <strong>{reward.title}</strong>
                                    <span>
                                      {reward.pointsCost} {loyaltyData.settings?.pointsName ?? 'puntos'}
                                    </span>
                                    {selectedReward ? (
                                      <em>{selectedReward.quantity} en tu pedido</em>
                                    ) : null}
                                  </div>
                                  <button
                                    type="button"
                                    className="loyalty-reward-action"
                                    disabled={!canAdd}
                                    onClick={() => handleAddRewardRedemption(reward)}
                                  >
                                    {canAdd ? 'Canjear' : 'Sin puntos'}
                                  </button>
                                </article>
                              )
                            })}
                          </div>
                        </section>
                      ) : (
                        <p className="loyalty-empty">Este restaurante todavia no cargo productos para canjear.</p>
                      )}
                    </>
                  ) : (
                    <div className="loyalty-balance-card">
                      <span>Programa de puntos</span>
                      <strong>No activo</strong>
                      <small>Este restaurante todavia no habilito puntos para clientes.</small>
                    </div>
                  )}
                </div>
              ) : null}
            </section>
          </div>
        </div>
      ) : null}

      {showConfirmation && lastOrder ? (
        <div
          className="confirmation-overlay"
          role="presentation"
        >
          <div
            className={`confirmation-card confirmation-card-${templateId}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="confirmation-hero" aria-hidden="true">
              {templateId === 'gelato' ? (
                <div className="confirmation-gelato-top">
                  <img className="confirmation-gelato-brand" src="/gelato/logo-dolce.png" alt="" />
                  <span className="confirmation-gelato-pill">Pedido enviado</span>
                  <img className="confirmation-gelato-scoop" src="/gelato/flavor-fresa.png" alt="" />
                </div>
              ) : templateId === 'burger' ? (
                <div className="confirmation-burger-top">
                  <span className="confirmation-burger-flame">
                    <IconFlame />
                  </span>
                  <strong>BRASA</strong>
                  <small>Pedido al fuego</small>
                </div>
              ) : templateId === 'pizzeria' ? (
                <div className="confirmation-pizzeria-top">
                  <span className="confirmation-pizzeria-oven">
                    <IconPizzaOutline />
                  </span>
                  <strong>LA BUONA</strong>
                  <small>Pedido al horno</small>
                </div>
              ) : (
                <div className="confirmation-ticket">
                  <span className="confirmation-ticket-dot confirmation-ticket-dot-left" />
                  <span className="confirmation-ticket-dot confirmation-ticket-dot-right" />
                  <div className="confirmation-ticket-mark">
                    <span className="confirmation-ticket-mark-line" />
                    <span className="confirmation-ticket-mark-line confirmation-ticket-mark-line-short" />
                  </div>
                  <span className="confirmation-ticket-status">Confirmado</span>
                </div>
              )}
            </div>
            <span className="confirmation-kicker">
              {templateId === 'gelato'
                ? 'Listo para preparar'
                : templateId === 'burger'
                  ? 'Hecho a la parrilla'
                  : templateId === 'pizzeria'
                    ? 'Directo al horno'
                    : 'Pedido enviado'}
            </span>
            <h3>Pedido #{lastOrder.orderNumber} confirmado</h3>
            <p>Ya recibimos tu pedido y vamos a seguir informandote por WhatsApp.</p>
            <div className="confirmation-meta">
              <div>
                <span>Total</span>
                <strong>{formatPrice(lastOrder.total ?? 0, currencySymbol)}</strong>
              </div>
              <div>
                <span>WhatsApp</span>
                <strong>{buildWhatsappNumberPreview(lastOrder.customer?.phone)}</strong>
              </div>
            </div>
            {lastOrder.loyalty?.enabled ? (
              <div className="confirmation-meta confirmation-meta-loyalty">
                <div>
                  <span>Ganaste</span>
                  <strong>
                    {lastOrder.loyalty.pointsEarned ?? 0} {lastOrder.loyalty.pointsName || 'puntos'}
                  </strong>
                </div>
                <div>
                  <span>Saldo actual</span>
                  <strong>
                    {lastOrder.loyalty.balance ?? 0} {lastOrder.loyalty.pointsName || 'puntos'}
                  </strong>
                </div>
              </div>
            ) : null}
            <div className="confirmation-timeline">
              <div className="confirmation-step active">
                <span />
                <div>
                  <strong>Pedido recibido</strong>
                  <small>Ya quedo cargado correctamente.</small>
                </div>
              </div>
              <div className="confirmation-step">
                <span />
                <div>
                  <strong>Confirmacion por WhatsApp</strong>
                  <small>Te avisaremos el estado del pedido por ese canal.</small>
                </div>
              </div>
            </div>
            <button
              type="button"
              className="confirmation-button"
              onClick={() => setShowConfirmation(false)}
            >
              Volver al menu
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}
