const presentationPresets = {
  default: {
    layout: 'editorial',
    branding: {
      wordmark: 'SABORE',
      subtitle: 'COCINA DE AUTOR',
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
      productMedia: 'video-first',
      autoplayVideos: true,
      mutedVideos: true,
    },
  },
  bistro: {
    layout: 'bistro',
    branding: {
      wordmark: 'BRUDER',
      subtitle: 'KITCHEN HOUSE',
    },
    theme: {
      id: 'charcoal-spritz',
      background: '#f5efe8',
      surface: '#fff9f3',
      surfaceAlt: '#f3eadf',
      text: '#241d17',
      muted: 'rgba(36, 29, 23, 0.68)',
      primary: '#8c4b2f',
      primaryText: '#fff9f3',
      accent: '#41583f',
      border: 'rgba(140, 75, 47, 0.14)',
      shadow: 'rgba(68, 43, 28, 0.1)',
      displayFont: 'Fraunces',
      bodyFont: 'DM Sans',
    },
    hero: {
      image: '/dishes/hero-clean-cut.png',
      title: 'Cocina honesta,',
      accent: 'mesa vibrante',
      description: 'Sabores directos, visual fuerte y una carta hecha para convertir.',
    },
    cards: {
      style: 'magazine-list',
    },
    preview: {
      productMedia: 'image-with-video-chip',
      autoplayVideos: false,
      mutedVideos: true,
    },
  },
  luxe: {
    layout: 'luxe',
    branding: {
      wordmark: "SANDRA'S",
      subtitle: 'DINING EXPERIENCE',
    },
    theme: {
      id: 'night-gold',
      background: '#161311',
      surface: '#221c18',
      surfaceAlt: '#1b1613',
      text: '#f7f0e4',
      muted: 'rgba(247, 240, 228, 0.72)',
      primary: '#b88c54',
      primaryText: '#1a1410',
      accent: '#d3b17a',
      border: 'rgba(211, 177, 122, 0.18)',
      shadow: 'rgba(0, 0, 0, 0.24)',
      displayFont: 'Playfair Display',
      bodyFont: 'Manrope',
    },
    hero: {
      image: '/dishes/hero-steak.jpg',
      title: 'Una carta',
      accent: 'con atmosfera',
      description: 'Experiencia nocturna, tipografia elegante y foco total en el producto.',
    },
    cards: {
      style: 'glass-list',
    },
    preview: {
      productMedia: 'video-first',
      autoplayVideos: true,
      mutedVideos: true,
    },
  },
}

const accountPresentations = {
  totta: presentationPresets.default,
  'sandras-rose': presentationPresets.luxe,
  bruder: presentationPresets.bistro,
  'neurorest-demo': presentationPresets.default,
}

export function resolveMenuPresentation(accountId) {
  return accountPresentations[accountId] ?? presentationPresets.default
}
