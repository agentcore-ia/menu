import { useMemo, useState } from 'react'
import './App.css'

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
      'https://www.w3schools.com/html/mov_bbb.mp4',
    badge: 'Video',
    dietary: ['vegetarian', 'glutenfree'],
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
    dietary: ['vegan', 'glutenfree', 'light'],
  },
]

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
  const [selectedDish, setSelectedDish] = useState(null)

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      if (item.category !== selectedCategory) return false
      return true
    })
  }, [selectedCategory])

  return (
    <>
      <div className="app-shell">
        <header className="hero-panel">
          <nav className="topbar">
            <div className="brand-lockup">
              <span className="brand-script">NeuroRest</span>
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
        </header>

        <main className="menu-layout">
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
            <div className="items-grid">
              {filteredItems.map((item) => (
                <article key={item.id} className="dish-card glass-card">
                  <div className="media-wrap">
                    <img className="dish-media" src={item.image} alt={item.name} />

                    <div className="media-top">
                      <div className="badge-cluster">
                        <span className="media-badge">{item.badge}</span>
                        {item.dietary.slice(0, 3).map((tag) => (
                          <span key={tag} className="dietary-dot">
                            {tag === 'vegetarian' ? (
                              <IconSpark />
                            ) : tag === 'vegan' ? (
                              <IconLeaf />
                            ) : (
                              <IconGrid />
                            )}
                          </span>
                        ))}
                      </div>
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
                    <button
                      type="button"
                      className="dish-caption"
                      onClick={() => setSelectedDish(item)}
                    >
                      <h3>{item.name}</h3>
                      <strong>{item.price}</strong>
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
