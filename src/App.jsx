import { useEffect, useMemo, useState } from 'react'
import './App.css'

const emptyCategories = []

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

function IconChevron() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 10l5 5 5-5" />
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

function getInitialAccountId() {
  const pathAccount = window.location.pathname
    .split('/')
    .filter(Boolean)
    .at(0)

  if (pathAccount) {
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

function App() {
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

  const categories = menu?.categories ?? emptyCategories
  const currentCategory =
    categories.find((category) => category.id === selectedCategory) ?? categories[0] ?? null
  const categoryItems = currentCategory?.items ?? []
  const heroDish = categoryItems[0] ?? categories.flatMap((category) => category.items)[0] ?? null
  const recommendations = categories
    .flatMap((category) => category.items)
    .filter((item) => item.id !== selectedDish?.id)
    .slice(0, 4)

  const cartCount = useMemo(
    () => Object.values(cart).reduce((total, quantity) => total + quantity, 0),
    [cart],
  )

  const cartTotal = useMemo(() => {
    return Object.entries(cart).reduce((total, [itemId, quantity]) => {
      const item = categories.flatMap((category) => category.items).find((entry) => entry.id === itemId)

      if (!item) {
        return total
      }

      return total + toNumericPrice(item.price) * quantity
    }, 0)
  }, [cart, categories])

  function handleAddItem(item, quantity = 1) {
    setCart((current) => ({
      ...current,
      [item.id]: (current[item.id] ?? 0) + quantity,
    }))
  }

  function handleOpenDish(item) {
    const nextDish = { ...item, categoryLabel: currentCategory?.label }
    const options = buildDetailOptions(nextDish)
    setSelectedDish(nextDish)
    setDetailQuantity(1)
    setSelectedSide(options.accompaniments[0] ?? '')
    setSelectedDoneness(options.doneness[0] ?? '')
  }

  const detailOptions = selectedDish ? buildDetailOptions(selectedDish) : null
  const currencySymbol = menu?.currencySymbol ?? '$'

  return (
    <>
      <div className="app-shell">
        <div className="phone-surface">
          <header className="hero">
            <div className="hero-topbar">
              <button type="button" className="icon-button" aria-label="Abrir menu">
                <IconMenu />
              </button>

              <button type="button" className="cart-button" aria-label="Ver pedido">
                <IconCart />
                <span className="cart-badge">{cartCount || 2}</span>
              </button>
            </div>

            <div className="brand hero-brand">
              <span className="brand-mark">
                <IconLeafMark />
              </span>
              <span className="brand-name">SABORÉ</span>
              <span className="brand-subtitle">COCINA DE AUTOR</span>
            </div>

            {heroDish ? (
              <section className="hero-content">
                <div className="hero-copy">
                  <h1>
                    <span className="hero-line">Buen sabor,</span>
                    <span className="hero-accent">buen momento</span>
                  </h1>
                  <div className="hero-divider" />
                  <p>Descubre nuestra seleccion de platos hechos para ti.</p>
                  <button
                    type="button"
                    className="hero-cta"
                    onClick={() => {
                      document
                        .querySelector('[data-section="categories"]')
                        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }}
                  >
                    Ver categorias
                    <IconChevron />
                  </button>
                </div>

                <div className="hero-plate">
                  <img src={heroDish.image} alt={heroDish.name} />
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
                          <img src={item.image} alt={item.name} className="dish-thumb" />
                          {index === 0 ? <span className="dish-badge">Mas pedido</span> : null}
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
          </footer>
        </div>
      </div>

      {selectedDish ? (
        <div
          className="detail-screen"
          role="presentation"
          onClick={() => setSelectedDish(null)}
        >
          <div className="detail-phone" onClick={(event) => event.stopPropagation()}>
            <div className="detail-hero">
              <img src={selectedDish.image} alt={selectedDish.name} />

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
                <span className="detail-badge">
                  <IconSpark />
                  Mas pedido
                </span>
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
              </div>
            </section>

            <footer className="detail-order-bar">
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
            </footer>
          </div>
        </div>
      ) : null}
    </>
  )
}

export default App
