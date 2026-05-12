import { useEffect, useMemo, useState } from 'react'
import './App.css'

const emptyCategories = []

const defaultPresentation = {
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

function IconSpark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4l1.8 4.8L18.6 10l-4.8 1.2L12 16l-1.8-4.8L5.4 10l4.8-1.2z" />
    </svg>
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

function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function toNumericPrice(value) {
  const amount = Number.parseFloat(String(value).replace(/[^\d.,-]/g, '').replace(',', '.'))
  return Number.isFinite(amount) ? amount : 0
}

function formatPrice(value, currencySymbol = '$') {
  return `${currencySymbol}${value.toFixed(2)}`
}

function getHeroImage(presentation, heroDish) {
  return presentation.hero?.image ?? heroDish?.image ?? '/dishes/hero-clean-cut.png'
}

function getCategoryIcon(label) {
  const key = slugify(label)

  if (key.includes('entrada')) return IconLeafMark
  if (key.includes('pasta')) return IconLeafMark
  if (key.includes('pizza')) return IconPizza
  if (key.includes('postre')) return IconDessert
  if (key.includes('bebida')) return IconDrink
  return IconServe
}

function buildDetailOptions(dish) {
  const tags = dish.dietary?.map((tag) => tag.toLowerCase()) ?? []

  if (tags.includes('vegan')) {
    return {
      accompaniments: ['Mix de hojas', 'Vegetales grillados', 'Pure de calabaza'],
      doneness: ['Suave', 'Clasico', 'Intenso'],
    }
  }

  if (dish.categoryLabel?.toLowerCase().includes('bebida')) {
    return {
      accompaniments: ['Con hielo', 'Sin azucar', 'Rodaja de limon'],
      doneness: ['Frio', 'Muy frio', 'Natural'],
    }
  }

  return {
    accompaniments: ['Papas rostizadas', 'Pure de papas', 'Ensalada mixta'],
    doneness: ['3/4 Termino', 'A punto', 'Bien cocido'],
  }
}

function getPresentationStyles(presentation) {
  const theme = presentation.theme

  return {
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
  }
}

function shouldAutoplayPreview(item, presentation) {
  return Boolean(
    item.video &&
      presentation.preview?.productMedia === 'video-first' &&
      presentation.preview?.autoplayVideos,
  )
}

export default function MenuApp() {
  const [accountId] = useState(getInitialAccountId)
  const [menu, setMenu] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedDish, setSelectedDish] = useState(null)
  const [status, setStatus] = useState('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [cart, setCart] = useState({})
  const [detailQuantity, setDetailQuantity] = useState(1)
  const [selectedSide, setSelectedSide] = useState('')
  const [selectedDoneness, setSelectedDoneness] = useState('')
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [checkoutStatus, setCheckoutStatus] = useState('idle')
  const [checkoutMessage, setCheckoutMessage] = useState('')
  const [lastOrder, setLastOrder] = useState(null)
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
        const response = await fetch(`/api/accounts/${accountId}/menu`)
        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload.message ?? 'No se pudo cargar el menu.')
        }

        if (cancelled) {
          return
        }

        setMenu(payload)
        setSelectedCategory(payload.categories[0]?.id ?? '')
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

  const presentation = menu?.presentation ?? defaultPresentation
  const categories = menu?.categories ?? emptyCategories
  const currentCategory =
    categories.find((category) => category.id === selectedCategory) ?? categories[0] ?? null
  const categoryItems = currentCategory?.items ?? []
  const heroDish = categoryItems[0] ?? categories.flatMap((category) => category.items)[0] ?? null
  const recommendations = categories
    .flatMap((category) => category.items)
    .filter((item) => item.id !== selectedDish?.id)
    .slice(0, 4)
  const allItems = categories.flatMap((category) => category.items)

  const cartCount = useMemo(
    () => Object.values(cart).reduce((total, quantity) => total + quantity, 0),
    [cart],
  )

  const cartTotal = useMemo(() => {
    return Object.entries(cart).reduce((total, [itemId, quantity]) => {
      const item = allItems.find((entry) => entry.id === itemId)

      if (!item) {
        return total
      }

      return total + toNumericPrice(item.price) * quantity
    }, 0)
  }, [allItems, cart])

  const cartItems = useMemo(() => {
    return Object.entries(cart)
      .map(([itemId, quantity]) => {
        const item = allItems.find((entry) => entry.id === itemId)

        if (!item) {
          return null
        }

        return {
          ...item,
          quantity,
          total: toNumericPrice(item.price) * quantity,
        }
      })
      .filter(Boolean)
  }, [allItems, cart])

  function handleAddItem(item, quantity = 1) {
    setCart((current) => ({
      ...current,
      [item.id]: (current[item.id] ?? 0) + quantity,
    }))
  }

  function handleSetItemQuantity(itemId, quantity) {
    setCart((current) => {
      if (quantity <= 0) {
        const next = { ...current }
        delete next[itemId]
        return next
      }

      return {
        ...current,
        [itemId]: quantity,
      }
    })
  }

  function handleOpenDish(item) {
    const nextDish = { ...item, categoryLabel: currentCategory?.label }
    const options = buildDetailOptions(nextDish)
    setSelectedDish(nextDish)
    setDetailQuantity(1)
    setSelectedSide(options.accompaniments[0] ?? '')
    setSelectedDoneness(options.doneness[0] ?? '')
  }

  function renderProductMedia(item) {
    if (shouldAutoplayPreview(item, presentation)) {
      return (
        <video
          className="dish-thumb"
          src={item.video}
          poster={item.image}
          autoPlay
          muted={presentation.preview?.mutedVideos ?? true}
          loop
          playsInline
        />
      )
    }

    return <img src={item.image} alt={item.name} className="dish-thumb" />
  }

  function updateOrderForm(field, value) {
    setOrderForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function handleSubmitOrder(event) {
    event.preventDefault()

    if (!cartItems.length) {
      setCheckoutMessage('Agrega productos antes de enviar el pedido.')
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
        unitPrice: toNumericPrice(item.price),
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
      setCart({})
      setIsCheckoutOpen(false)
    } catch (error) {
      setCheckoutStatus('error')
      setCheckoutMessage(error instanceof Error ? error.message : 'No se pudo enviar el pedido.')
    }
  }

  const detailOptions = selectedDish ? buildDetailOptions(selectedDish) : null
  const currencySymbol = menu?.currencySymbol ?? '$'
  const appClassName = [
    'menu-app',
    `layout-${presentation.layout}`,
    `cards-${presentation.cards?.style ?? 'editorial-list'}`,
    `theme-${presentation.theme.id}`,
  ].join(' ')

  return (
    <>
      <div className="app-shell">
        <div className={`phone-surface ${appClassName}`} style={getPresentationStyles(presentation)}>
          <header className="hero">
            <div className="hero-topbar">
              <button type="button" className="icon-button" aria-label="Abrir menu">
                <IconMenu />
              </button>

              <button
                type="button"
                className="cart-button"
                aria-label="Ver pedido"
                onClick={() => setIsCheckoutOpen(true)}
              >
                <IconCart />
                <span className="cart-badge">{cartCount || 2}</span>
              </button>
            </div>

            <div className="brand hero-brand">
              <span className="brand-mark">
                <IconLeafMark />
              </span>
              <span className="brand-name">{presentation.branding?.wordmark ?? menu?.accountName}</span>
              <span className="brand-subtitle">
                {presentation.branding?.subtitle ?? 'DIGITAL MENU'}
              </span>
            </div>

            {heroDish ? (
              <section className="hero-content">
                <div className="hero-copy">
                  <h1>
                    <span className="hero-line">{presentation.hero?.title ?? 'Buen sabor,'}</span>
                    <span className="hero-accent">
                      {presentation.hero?.accent ?? 'buen momento'}
                    </span>
                  </h1>
                  <div className="hero-divider" />
                  <p>
                    {presentation.hero?.description ??
                      'Descubre nuestra seleccion de platos hechos para ti.'}
                  </p>
                </div>

                <div className="hero-plate">
                  <img src={getHeroImage(presentation, heroDish)} alt={heroDish.name} />
                </div>
              </section>
            ) : null}
          </header>

          <main className="content-panel">
            {status === 'loading' ? (
              <section className="state-panel">
                <p>Cargando menu digital...</p>
              </section>
            ) : null}

            {status === 'error' ? (
              <section className="state-panel">
                <p>{errorMessage}</p>
                <span>Revisa la cuenta o intenta nuevamente.</span>
              </section>
            ) : null}

            {status === 'ready' ? (
              <>
                <section className="section-block" data-section="categories">
                  <div className="section-heading">
                    <h2>Categorias</h2>
                    <button type="button">Ver todas</button>
                  </div>

                  <div className="category-row">
                    {categories.map((category) => {
                      const Icon = getCategoryIcon(category.label)
                      const isActive = category.id === currentCategory?.id

                      return (
                        <button
                          key={category.id}
                          type="button"
                          className={`category-chip ${isActive ? 'active' : ''}`}
                          onClick={() => setSelectedCategory(category.id)}
                        >
                          <span className="category-icon">
                            <Icon />
                          </span>
                          <span className="category-label">{category.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </section>

                <section className="section-block">
                  <div className="section-heading">
                    <h2>{(currentCategory?.label ?? 'Entradas').toUpperCase()}</h2>
                    <button type="button">Ver todas</button>
                  </div>

                  <div className="dish-list">
                    {categoryItems.map((item, index) => (
                      <article key={item.id} className="dish-card">
                        <button
                          type="button"
                          className="dish-media-button"
                          onClick={() => handleOpenDish(item)}
                        >
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
                          <button
                            type="button"
                            className="dish-main"
                            onClick={() => handleOpenDish(item)}
                          >
                            <h3>{item.name}</h3>
                            <p>{item.description}</p>
                          </button>

                          <div className="dish-footer">
                            <strong>{item.price}</strong>
                            <button
                              type="button"
                              className="add-button"
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
              </>
            ) : null}
          </main>

          <footer className="order-bar">
            <button type="button" className="order-bar-button" onClick={() => setIsCheckoutOpen(true)}>
              <div className="order-bar-copy">
                <span className="order-icon-wrap">
                  <IconCart />
                  <span className="order-badge">{cartCount || 2}</span>
                </span>
                <span>Ver mi pedido</span>
              </div>
              <div className="order-bar-price">
                {formatPrice(cartTotal || 28.7, currencySymbol)}
                <span className="order-arrow">{'>'}</span>
              </div>
            </button>
          </footer>
        </div>
      </div>

      {selectedDish ? (
        <div className="detail-screen" role="presentation" onClick={() => setSelectedDish(null)}>
          <div
            className={`detail-phone ${appClassName}`}
            style={getPresentationStyles(presentation)}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="detail-hero">
              {selectedDish.video ? (
                <video
                  src={selectedDish.video}
                  poster={selectedDish.image}
                  autoPlay={presentation.preview?.autoplayVideos ?? false}
                  muted={presentation.preview?.mutedVideos ?? true}
                  loop={presentation.preview?.autoplayVideos ?? false}
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
                  <strong>{selectedDish.price}</strong>
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

              <div className="option-group">
                <h3>Acompanamientos</h3>
                <p>Obligatorio: elige uno</p>
                <div className="option-grid">
                  {detailOptions?.accompaniments.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={`option-card ${selectedSide === option ? 'selected' : ''}`}
                      onClick={() => setSelectedSide(option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div className="option-group">
                <h3>Termino de la carne</h3>
                <p>Obligatorio: elige uno</p>
                <div className="option-grid">
                  {detailOptions?.doneness.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={`option-card ${
                        selectedDoneness === option ? 'selected' : ''
                      }`}
                      onClick={() => setSelectedDoneness(option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

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
                onClick={() => {
                  handleAddItem(selectedDish, detailQuantity)
                  setSelectedDish(null)
                }}
              >
                <span>Agregar al pedido</span>
                <strong>
                  {formatPrice(toNumericPrice(selectedDish.price) * detailQuantity, currencySymbol)}
                </strong>
              </button>

              <p className="detail-note">Pide a nuestro mesero por la preparacion de la carne.</p>

              <div className="option-group recommendation-group">
                <h3>Tambien te puede gustar</h3>
                <div className="recommendation-row">
                  {recommendations.map((item) => (
                    <article key={item.id} className="mini-card">
                      {item.video && presentation.preview?.productMedia === 'video-first' ? (
                        <video
                          src={item.video}
                          poster={item.image}
                          autoPlay
                          muted={presentation.preview?.mutedVideos ?? true}
                          loop
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

            <footer className="detail-order-bar">
              <button type="button" className="order-bar-button" onClick={() => setIsCheckoutOpen(true)}>
                <div className="order-bar-copy">
                  <span className="order-icon-wrap">
                    <IconCart />
                    <span className="order-badge">{cartCount || 2}</span>
                  </span>
                  <span>Ver mi pedido</span>
                </div>
                <div className="order-bar-price">
                  {formatPrice(cartTotal || 28.7, currencySymbol)}
                  <span className="order-arrow">{'>'}</span>
                </div>
              </button>
            </footer>
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
                  onClick={() => setIsCheckoutOpen(false)}
                  aria-label="Cerrar pedido"
                >
                  <IconBack />
                </button>
                <div>
                  <h2>Confirmar pedido</h2>
                  <p>Se envia directo al dashboard de NeuroRest.</p>
                </div>
              </div>

              <div className="checkout-summary">
                {cartItems.map((item) => (
                  <div key={item.id} className="checkout-item">
                    <div>
                      <strong>{item.name}</strong>
                      <span>{formatPrice(toNumericPrice(item.price), currencySymbol)} c/u</span>
                    </div>
                    <div className="checkout-item-controls">
                      <button type="button" onClick={() => handleSetItemQuantity(item.id, item.quantity - 1)}>
                        <IconMinus />
                      </button>
                      <span>{item.quantity}</span>
                      <button type="button" onClick={() => handleSetItemQuantity(item.id, item.quantity + 1)}>
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
                  <strong>{formatPrice(cartTotal, currencySymbol)}</strong>
                </button>
              </form>
            </section>
          </div>
        </div>
      ) : null}
    </>
  )
}
