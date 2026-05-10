import { useMemo, useState } from 'react'
import './App.css'

const dietaryOptions = [
  { id: 'allergens', label: 'Alergenos' },
  { id: 'vegetarian', label: 'Vegetariano' },
  { id: 'vegan', label: 'Vegano' },
]

const categories = [
  { id: 'entrantes', label: 'Entrantes' },
  { id: 'principales', label: 'Platos Principales' },
  { id: 'postres', label: 'Postres' },
  { id: 'bebidas', label: 'Bebidas' },
]

const menuItems = [
  {
    id: 1,
    category: 'entrantes',
    name: 'Brioche de hongos al jerez',
    description:
      'Pan brioche tostado, ragout de hongos, aceite de trufa y brotes frescos.',
    price: '$12',
    image:
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80',
    badge: 'Nuevo',
    dietary: ['vegetarian'],
  },
  {
    id: 2,
    category: 'entrantes',
    name: 'Croquetas de quinoa crocante',
    description:
      'Croquetas doradas con crema de limon, hierbas y terminacion ahumada.',
    price: '$11',
    image:
      'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80',
    video:
      'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    badge: 'Video',
    dietary: ['vegetarian'],
  },
  {
    id: 3,
    category: 'principales',
    name: 'Lomo glaseado NeuroRest',
    description:
      'Coccion lenta, pure de coliflor, zanahorias baby y salsa de vino tinto.',
    price: '$26',
    image:
      'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80',
    video:
      'https://www.w3schools.com/html/mov_bbb.mp4',
    badge: 'Chef pick',
    dietary: [],
  },
  {
    id: 4,
    category: 'principales',
    name: 'Ravioles verdes de ricota',
    description:
      'Pasta fresca con manteca de salvia, pistachos y ralladura citrica.',
    price: '$21',
    image:
      'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=900&q=80',
    badge: 'Top',
    dietary: ['vegetarian'],
  },
  {
    id: 5,
    category: 'postres',
    name: 'Volcan de cacao amargo',
    description:
      'Centro tibio de chocolate, helado artesanal y caramelo especiado.',
    price: '$9',
    image:
      'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=900&q=80',
    dietary: ['vegetarian'],
  },
  {
    id: 6,
    category: 'bebidas',
    name: 'Tonica botanica de la casa',
    description:
      'Pepino, lima, romero y burbujas suaves para maridar platos frescos.',
    price: '$7',
    image:
      'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=900&q=80',
    dietary: ['vegan'],
  },
]

const heroSlides = [
  {
    id: 1,
    title: 'Una experiencia digital para menus que venden mejor',
    description:
      'Visual premium, filtros utiles y contenido corto en video para despertar apetito.',
    image:
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1400&q=80',
  },
]

function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.6-3.6" />
    </svg>
  )
}

function IconFilter() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 6h16l-6 7v5l-4 2v-7z" />
    </svg>
  )
}

function IconLeaf() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18 5c-6 0-11 4.3-11 10 0 2.2.7 3.5 2.2 4.7 1.1-3.3 3.2-5.7 6.5-7.2-2 1.6-3.5 3.8-4.3 6.6 5.1.4 8.6-2.9 8.6-8.3V5z" />
    </svg>
  )
}

function IconSpark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
    </svg>
  )
}

function IconGrid() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />
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

function IconPlay() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 6l10 6-10 6z" />
    </svg>
  )
}

function IconClose() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

function App() {
  const [selectedCategory, setSelectedCategory] = useState('entrantes')
  const [query, setQuery] = useState('')
  const [activeFilters, setActiveFilters] = useState([])
  const [selectedDish, setSelectedDish] = useState(null)

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      if (item.category !== selectedCategory) return false

      const searchTarget = `${item.name} ${item.description}`.toLowerCase()
      if (query && !searchTarget.includes(query.toLowerCase())) return false

      if (activeFilters.length === 0) return true
      return activeFilters.every((filter) => item.dietary.includes(filter))
    })
  }, [activeFilters, query, selectedCategory])

  const toggleFilter = (filterId) => {
    setActiveFilters((current) =>
      current.includes(filterId)
        ? current.filter((item) => item !== filterId)
        : [...current, filterId],
    )
  }

  return (
    <>
      <div className="app-shell">
        <header className="hero-panel">
          <nav className="topbar">
            <div className="brand-lockup">
              <span className="brand-script">NeuroRest</span>
              <span className="brand-mark">Digital Menu</span>
            </div>

            <div className="topbar-actions">
              <button type="button" className="ghost-pill">
                USD
              </button>
              <button type="button" className="ghost-pill">
                ES
              </button>
              <button type="button" className="ghost-icon">
                <span />
                <span />
                <span />
              </button>
            </div>
          </nav>

          {heroSlides.map((slide) => (
            <article
              key={slide.id}
              className="hero-card"
              style={{ '--hero-image': `url(${slide.image})` }}
            >
              <div className="hero-overlay" />
              <div className="hero-copy">
                <p className="eyebrow">Menu principal</p>
                <h1>{slide.title}</h1>
                <p>{slide.description}</p>
              </div>
              <button type="button" className="hero-info">
                i
              </button>
            </article>
          ))}
        </header>

        <main className="menu-layout">
          <section className="search-panel glass-card">
            <label className="searchbar" htmlFor="menu-search">
              <IconSearch />
              <input
                id="menu-search"
                type="search"
                placeholder="Buscar en el menu"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
          </section>

          <section className="filter-panel glass-card">
            <div className="section-heading">
              <h2>Filtra tus opciones dieteticas</h2>
              <p>Ayuda a cada cliente a encontrar su plato ideal en segundos.</p>
            </div>

            <div className="chip-row">
              {dietaryOptions.map((option) => {
                const isActive = activeFilters.includes(option.id)
                const Icon =
                  option.id === 'allergens'
                    ? IconFilter
                    : option.id === 'vegetarian'
                      ? IconSpark
                      : IconLeaf

                return (
                  <button
                    key={option.id}
                    type="button"
                    className={`chip ${isActive ? 'active' : ''}`}
                    onClick={() => toggleFilter(option.id)}
                  >
                    <Icon />
                    <span>{option.label}</span>
                  </button>
                )
              })}
            </div>
          </section>

          <section className="tabs-panel glass-card">
            <div className="tabs-row">
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  className={`tab-pill ${
                    selectedCategory === category.id ? 'active' : ''
                  }`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </section>

          <section className="items-section">
            <div className="section-heading large">
              <h2>
                {categories.find((category) => category.id === selectedCategory)
                  ?.label ?? 'Menu'}
              </h2>
              <p>Cards grandes, visuales y listas para convertir desde mobile.</p>
            </div>

            <div className="items-grid">
              {filteredItems.map((item) => (
                <article key={item.id} className="dish-card glass-card">
                  <div className="media-wrap">
                    {item.video ? (
                      <video
                        className="dish-media"
                        src={item.video}
                        poster={item.image}
                        muted
                        loop
                        playsInline
                        autoPlay
                      />
                    ) : (
                      <img className="dish-media" src={item.image} alt={item.name} />
                    )}

                    <div className="media-top">
                      <span className="media-badge">{item.badge}</span>
                      {item.video ? (
                        <button
                          type="button"
                          className="round-action"
                          onClick={() => setSelectedDish(item)}
                          aria-label={`Ver video de ${item.name}`}
                        >
                          <IconPlay />
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="round-action"
                          onClick={() => setSelectedDish(item)}
                          aria-label={`Ver detalle de ${item.name}`}
                        >
                          <IconPlus />
                        </button>
                      )}
                    </div>

                    <div className="media-side-actions">
                      <button type="button" className="mini-action violet">
                        <IconSpark />
                      </button>
                      <button type="button" className="mini-action muted">
                        <IconGrid />
                      </button>
                    </div>
                  </div>

                  <div className="dish-content">
                    <div className="dish-header">
                      <div>
                        <h3>{item.name}</h3>
                        <p>{item.description}</p>
                      </div>
                      <strong>{item.price}</strong>
                    </div>

                    <button
                      type="button"
                      className="detail-link"
                      onClick={() => setSelectedDish(item)}
                    >
                      {item.video ? 'Ver video del plato' : 'Ver detalle'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </main>
      </div>

      {selectedDish ? (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setSelectedDish(null)}
        >
          <section
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dish-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="modal-close"
              onClick={() => setSelectedDish(null)}
              aria-label="Cerrar"
            >
              <IconClose />
            </button>

            <div className="modal-media">
              {selectedDish.video ? (
                <video
                  src={selectedDish.video}
                  poster={selectedDish.image}
                  controls
                  autoPlay
                  muted
                  playsInline
                />
              ) : (
                <img src={selectedDish.image} alt={selectedDish.name} />
              )}
            </div>

            <div className="modal-copy">
              <p className="eyebrow">NeuroRest showcase</p>
              <h3 id="dish-title">{selectedDish.name}</h3>
              <p>{selectedDish.description}</p>
              <div className="modal-meta">
                <span>{selectedDish.price}</span>
                <span>{selectedDish.video ? 'Incluye video corto' : 'Imagen premium'}</span>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </>
  )
}

export default App
