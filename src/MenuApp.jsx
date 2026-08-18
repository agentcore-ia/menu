import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { getBusinessOpenStatus } from '../shared/businessHours.js'

import QRLanding from './QRLanding.jsx'
import QRBill from './QRBill.jsx'
import QRFeedback from './QRFeedback.jsx'

const emptyCategories = []

const defaultPresentation = {
  template: 'editorial',
  layout: 'editorial',
  branding: {
    wordmark: 'capta',
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
    video: '',
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

function getOrderingClosedMessage(orderingStatus) {
  const baseMessage =
    orderingStatus?.message ||
    'El local esta cerrado ahora. Podes ver el menu, pero los pedidos se habilitan en horario de atencion.'
  const nextOpenText = orderingStatus?.nextOpenText ? ` ${orderingStatus.nextOpenText}.` : ''

  return `${baseMessage}${nextOpenText}`
}

function IconMenu() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  )
}

function IconExternalLink() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14 5h5v5" />
      <path d="M19 5l-9 9" />
      <path d="M19 14v4.5H5.5V5H10" />
    </svg>
  )
}

function IconInstagram() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="5" width="14" height="14" rx="4" />
      <circle cx="12" cy="12" r="3.2" />
      <path d="M16.7 7.4h.01" />
    </svg>
  )
}

function IconFacebook() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14.5 8.2h2V5.3c-.6-.1-1.4-.2-2.4-.2-2.4 0-4 1.5-4 4.2v2.1H7.5v3.2h2.6V20h3.3v-5.4h2.5l.4-3.2h-2.9V9.6c0-.9.3-1.4 1.1-1.4z" />
    </svg>
  )
}

function IconTiktok() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14 5v9.2a4 4 0 1 1-3.2-3.9" />
      <path d="M14 5c.7 2.4 2.3 3.9 5 4.1" />
    </svg>
  )
}

function IconWhatsapp() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5.3 19l1-3.1A7.5 7.5 0 1 1 9 18.3z" />
      <path d="M9.2 8.9c.3 3 2.1 4.8 5.4 5.7l1.2-1.4" />
    </svg>
  )
}

function KikaHeroOverlay() {
  return (
    <div className="kika-hero-overlay" aria-label="Kika Cafe. Tu nuevo lugar favorito.">
      <div className="kika-hero-copy">
        <h1>
          <span>Tu nuevo</span>
          <span>lugar favorito</span>
        </h1>
        <p className="kika-hero-script" aria-label="Café, pastelería y buenos momentos">
          <span className="kika-handwrite-line kika-handwrite-line-one">Café, pastelería</span>
          <span className="kika-handwrite-line kika-handwrite-line-two">y buenos momentos</span>
        </p>
      </div>
    </div>
  )
}

function IconWebsite() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <path d="M4 12h16" />
      <path d="M12 4c2 2.2 3 4.8 3 8s-1 5.8-3 8c-2-2.2-3-4.8-3-8s1-5.8 3-8z" />
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

function IconStar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
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
    <svg className="host-drumstick-icon" viewBox="0 0 28.458 28.458" aria-hidden="true">
      <path d="M13.271,20.469c-1.59,0-2.98-0.394-3.934-1.348l0,0C5.797,15.58,9.967,6.017,13.403,2.58c3.439-3.44,9.036-3.439,12.476,0c3.439,3.439,3.439,9.036,0,12.476C23.368,17.567,17.585,20.469,13.271,20.469z M10.044,18.414c2.972,2.97,11.967-0.906,15.127-4.065c3.049-3.05,3.049-8.012,0-11.062c-3.049-3.049-8.011-3.05-11.062,0C10.951,6.448,7.075,15.444,10.044,18.414L10.044,18.414z" />
      <path d="M6.454,28.457c-0.845,0-1.689-0.321-2.333-0.965c-0.593-0.594-0.927-1.372-0.956-2.199c-0.827-0.029-1.606-0.362-2.2-0.956C0.343,23.714,0,22.886,0,22.004c0-0.881,0.343-1.709,0.966-2.332c1.218-1.217,3.323-1.251,4.578-0.085l2.831-2.831c0.195-0.195,0.512-0.195,0.707,0s0.195,0.512,0,0.707l-3.209,3.21c-0.103,0.102-0.245,0.156-0.388,0.146c-0.145-0.01-0.277-0.082-0.364-0.197c-0.086-0.114-0.134-0.182-0.194-0.241c-0.87-0.871-2.382-0.87-3.252-0.001C1.239,20.814,1,21.391,1,22.005c0,0.613,0.239,1.19,0.673,1.625c0.511,0.511,1.225,0.744,1.949,0.641c0.155-0.021,0.313,0.03,0.424,0.142c0.111,0.111,0.164,0.268,0.142,0.424c-0.103,0.729,0.13,1.438,0.641,1.949c0.896,0.896,2.355,0.896,3.251,0c0.896-0.896,0.896-2.354,0-3.251c-0.06-0.06-0.126-0.107-0.191-0.156c-0.116-0.088-0.213-0.239-0.223-0.384s0.018-0.305,0.121-0.407l3.209-3.21c0.195-0.195,0.512-0.195,0.707,0s0.195,0.512,0,0.707l-2.831,2.831c1.201,1.292,1.172,3.32-0.085,4.577C8.144,28.135,7.299,28.457,6.454,28.457z" />
      <path d="M24.989,10.531c-0.081,0-0.163-0.02-0.239-0.062c-0.242-0.131-0.331-0.433-0.201-0.675c0.032-0.063,0.699-1.382-0.283-3.16c-0.133-0.241-0.045-0.546,0.196-0.679c0.242-0.136,0.546-0.046,0.68,0.196c1.259,2.282,0.327,4.044,0.286,4.118C25.338,10.437,25.167,10.531,24.989,10.531z" />
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

function IconKikaCup() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M9 13.5h11.8l-1.1 10.1H10.3L9 13.5z" />
      <path d="M20.7 15.4h2.1c1.6 0 2.8 1.1 2.8 2.6s-1.2 2.6-2.8 2.6h-2.2" />
      <path d="M12 13.4c-.9-1.1-.4-2 .4-2.8M15.4 13.4c-.9-1.1-.4-2 .4-2.8M18.8 13.4c-.9-1.1-.4-2 .4-2.8" />
      <path d="M8.2 24.8h12.7" />
    </svg>
  )
}

function IconKikaCake() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M7.8 16.3h16.4l-1.7 8H9.5l-1.7-8z" />
      <path d="M10.1 16.1c1.1-3.3 3-5 5.9-5s4.8 1.7 5.9 5" />
      <path d="M16 8.2v3" />
      <path d="M15.1 8.6c.8-2.1 2.3-2.3 3.3-1.3-1 .5-2.1.8-3.3 1.3z" />
      <path d="M8.4 20h15.1" />
    </svg>
  )
}

function IconAlmendraCookie() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M24.6 15.8c.6 5.1-3.1 9.5-8.2 9.9-5.3.4-9.8-3.5-10.2-8.7-.4-5.1 3.3-9.6 8.3-10.1.4 2.5 2.5 4.3 5.1 4.2.6 2.4 2.5 4.1 5 4.7z" />
      <path d="M13 13.2h.01M17.5 17.1h.01M12.2 20.2h.01M20.3 21.1h.01M9.8 16.6h.01" />
      <path d="M18.8 6.8c.5 1.3 1.8 2.2 3.4 2.1M22.7 10.4c.3 1.2 1.3 2 2.6 2.1" />
    </svg>
  )
}

function IconAlmendraPastry() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M9.2 15.8h13.6l-1.4 9.4H10.6L9.2 15.8z" />
      <path d="M10.5 15.7c.8-3.3 2.6-5.1 5.5-5.1s4.7 1.8 5.5 5.1" />
      <path d="M12.5 19.5c1.1 1 2.3 1 3.5 0 1.1 1 2.3 1 3.5 0" />
      <path d="M16 7.2v3.4" />
      <path d="M14.7 7.7c.7-1.9 2.2-2.3 3.5-1.2-.9.6-2.1.9-3.5 1.2z" />
    </svg>
  )
}

function IconKikaCroissant() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M8.2 17.7c1.3-5 5-7.9 10.7-7.4 3.6.3 5.4 2.3 5.8 5.2-1.8-.6-4.3-.6-6.6 1.1-2 1.4-2.8 3.6-2.5 6.2-4.4-.2-7.1-2-7.4-5.1z" />
      <path d="M8.3 17.6c-1.3.4-2.7.2-3.2-1.1-.5-1.4.7-2.8 2.4-2.7" />
      <path d="M16 22.8c.1 1.4-1 2.5-2.4 2.2-1.2-.2-1.7-1.2-1.5-2.4" />
      <path d="M13.1 11.8c1.8 1 3.1 2.7 3.7 5" />
    </svg>
  )
}

function IconKikaLeaf() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M8.2 22.8c9.8-.3 14.7-6.2 16.4-15.6-8.9 1.2-14.3 5.2-16.4 15.6z" />
      <path d="M8.2 22.8c3.2-4.6 7.4-8 12.8-10.1" />
      <path d="M11.6 18.3c-2.6-.2-4.8-1.2-6.3-3.6" />
    </svg>
  )
}

function IconKikaSandwich() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M7.5 14.4h17.8c.2-4.1-3.4-6.8-9-6.8-5.8 0-9.4 2.7-8.8 6.8z" />
      <path d="M6.5 17.3h19" />
      <path d="M8.2 20.7h16" />
      <path d="M10.3 17.4c1.2 1.1 2.4 1.1 3.7 0 1.2 1.1 2.6 1.1 3.8 0 1.2 1.1 2.5 1.1 3.7 0" />
    </svg>
  )
}

function IconKikaSalad() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M7.8 16.3h16.4l-1.5 7.5H9.3l-1.5-7.5z" />
      <path d="M10 15.8c-.5-3 1.4-5.2 4.4-5.2.9-2 3.8-2.2 5 .1 2.7.2 4.2 2.1 3.5 5.1" />
      <path d="M12.5 12.7l3.2 3.1M18.3 12.7l-3.2 3.1" />
    </svg>
  )
}

function IconKikaBook() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 5.5h6.3c1 0 1.7.4 2.2 1.1.5-.7 1.2-1.1 2.2-1.1H21v14h-5.7c-1.1 0-1.9.3-2.3 1-.4-.7-1.2-1-2.3-1H5z" />
      <path d="M13 6.6v13.9" />
    </svg>
  )
}

function IconKikaBag() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6.5 9h13l-1 11h-11z" />
      <path d="M9.5 9V7a3 3 0 0 1 6 0v2" />
    </svg>
  )
}

function IconKikaPin() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 21s6-5.4 6-11a6 6 0 1 0-12 0c0 5.6 6 11 6 11z" />
      <circle cx="12" cy="10" r="2.2" />
    </svg>
  )
}

function IconKikaUsers() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="9" cy="8" r="3" />
      <path d="M3.8 19c.7-3.2 2.5-4.8 5.2-4.8s4.5 1.6 5.2 4.8" />
      <path d="M15.5 11.2a2.6 2.6 0 1 0-.2-5.2" />
      <path d="M15.7 14.5c2.4.3 3.8 1.8 4.5 4.5" />
    </svg>
  )
}

function IconAlmendraMark() {
  return (
    <svg viewBox="0 0 48 64" aria-hidden="true">
      <path d="M24 4C11.8 15.8 5.7 27.1 5.7 38c0 12.5 8.2 20 18.3 22 10.1-2 18.3-9.5 18.3-22C42.3 27.1 36.2 15.8 24 4z" />
      <path d="M24 8v49" />
      <path d="M24 18L12.2 42.5" />
      <path d="M24 18l11.8 24.5" />
      <path d="M24 31L13.6 48.5" />
      <path d="M24 31l10.4 17.5" />
    </svg>
  )
}

function IconAlmendraGift() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M7 13h18v12H7z" />
      <path d="M5.5 9.5h21v5H5.5z" />
      <path d="M16 9.5V25" />
      <path d="M16 9.5c-3.8-.2-6.1-1.2-6.1-3 0-1.4 1.1-2.3 2.5-2.3 2 0 3.1 2.1 3.6 5.3z" />
      <path d="M16 9.5c3.8-.2 6.1-1.2 6.1-3 0-1.4-1.1-2.3-2.5-2.3-2 0-3.1 2.1-3.6 5.3z" />
    </svg>
  )
}

function IconKikaHazelnut() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M8.2 17.1c1.5-5.4 5.6-8.6 10.1-8 4 .5 6.4 3.4 6 7.1-.4 4.4-4.1 7.5-9.1 7.8-4.6.2-7.9-2.4-7-6.9z" />
      <path d="M14.2 9.6c.8-2.5 2.4-3.9 4.7-4.4 0 1.8-.9 3.2-2.8 4.3" />
      <path d="M18.9 16.5c-1.3 1.6-3.2 2.5-5.5 2.7" />
    </svg>
  )
}

function IconKikaCoconut() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M8.4 20.1c.2-5.7 4.1-10.6 10.3-11.5 2.7 4.4 2 10.4-2.1 13.7-2.7 2.2-6.2 1.4-8.2-2.2z" />
      <path d="M10.5 18.9c1.8-2.5 4-4.5 6.8-6" />
      <path d="M19.8 8.7c1.7.9 2.8 2.2 3.2 3.9" />
      <path d="M7.6 20.4c-1.3.1-2.3-.6-2.5-1.8" />
    </svg>
  )
}

function IconKikaCaramel() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M10.1 9.6h11.8v11.8H10.1z" />
      <path d="M10.1 12.4L6.8 10.7v9.6l3.3-1.7" />
      <path d="M21.9 12.4l3.3-1.7v9.6l-3.3-1.7" />
      <path d="M13 13.5h5.9M13 17.2h5.9" />
    </svg>
  )
}

function IconKikaPistachio() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M10.8 20.7c-1.6-3.9-.4-8.3 3.6-12.9 4.6 3 6.9 6.7 6.2 10.5-.6 3.4-3.5 5.6-6.3 5-1.6-.3-2.8-1.2-3.5-2.6z" />
      <path d="M15.4 8.4c-.3 5.5.6 9.5 2.8 12" />
      <path d="M9.1 22.2c3.9.5 7.6.4 11-.5" />
    </svg>
  )
}

function IconKikaVanilla() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M16 7.6l2.4 5.9 6.4.5-4.9 4.1 1.5 6.2-5.4-3.3-5.4 3.3 1.5-6.2L7.2 14l6.4-.5z" />
      <path d="M16 11.4v6.8" />
      <path d="M12.6 15.3l6.8 3.5" />
      <path d="M19.4 15.3l-6.8 3.5" />
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

function IconSteak() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M7.1 17.5c.4-5.5 5.4-9.6 11.2-9.1 4.7.4 7.3 3.4 6.7 7.4-.7 4.7-5.6 8.2-11.2 7.6-4.2-.4-7-2.7-6.7-5.9z" />
      <path d="M14.4 14.9c.3-1.7 2-2.8 3.7-2.5 1.6.3 2.5 1.5 2.2 2.9-.3 1.5-1.9 2.5-3.6 2.2-1.6-.2-2.6-1.3-2.3-2.6z" />
      <path d="M8.4 19.8c3.8.3 7.4-.4 10.9-2.1" />
    </svg>
  )
}

function IconMilanesa() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M6.1 16.8c.7-4.1 5.1-7 10.8-7 5.4 0 9.1 2.6 9 6.4-.1 4.1-4.3 6.7-10.2 6.7-6.1 0-10.3-2.3-9.6-6.1z" />
      <path d="M9.8 15.3c2.1-.9 4.4-1.2 6.9-.9M11.1 19.2c2.8.6 5.8.5 9-.2M20.2 13.1c1.2.5 2.1 1.2 2.8 2.1" />
    </svg>
  )
}

function IconOmelette() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M6.8 17.2c1.5-4.8 5.4-7.5 10.2-7 4.6.5 7.9 3.8 8.2 8.6-4.4 2.8-11.1 3.5-16.2 1.3-1.5-.6-2.2-1.6-2.2-2.9z" />
      <path d="M12.5 16.2c1.1-1.9 3.5-2.4 5.1-1.1 1.4 1.1 1.1 3.1-.6 3.9-1.9.9-4.2-.3-4.5-2.8z" />
    </svg>
  )
}

function IconPasta() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M7.7 15.5h16.6l-1.7 8.1H9.4l-1.7-8.1z" />
      <path d="M9.8 15.1c1.3-2.7 3.4-4.1 6.2-4.1s4.9 1.4 6.2 4.1" />
      <path d="M11.4 12.5c.9.9 1.9.9 2.8 0 .9.9 1.9.9 2.8 0 .9.9 1.9.9 2.8 0" />
      <path d="M12.5 18.2h7M11.6 21h8.8" />
    </svg>
  )
}

function IconSauce() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M12.4 9.2h7.2l1.4 14.3H11L12.4 9.2z" />
      <path d="M13.4 6.6h5.2v2.6h-5.2z" />
      <path d="M12.3 14.2h7.4" />
      <path d="M14.1 18.3c1.1-.9 2.7-.9 3.8 0" />
    </svg>
  )
}

function IconTart() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M6.5 14.8h19l-2.1 8.4H8.6l-2.1-8.4z" />
      <path d="M8.8 14.5c1-3.6 3.4-5.5 7.2-5.5s6.2 1.9 7.2 5.5" />
      <path d="M10.2 18.1c1.1.8 2.2.8 3.3 0 1.1.8 2.2.8 3.3 0 1.1.8 2.2.8 3.3 0" />
    </svg>
  )
}

function IconChefHat() {
  return (
    <svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
      <path d="M9.2 14.5c-1.8-.3-3.1-1.8-3.1-3.6 0-2.1 1.7-3.7 3.8-3.7.8 0 1.5.2 2.1.6 1-1.7 2.5-2.6 4.4-2.6 2.4 0 4.2 1.4 5 3.5.5-.2 1.1-.4 1.7-.4 2.1 0 3.8 1.7 3.8 3.8 0 1.8-1.3 3.3-3.1 3.6" />
      <path d="M9.2 14.3h14.6l-1 10.1H10.2L9.2 14.3z" />
      <path d="M12.2 18.1h7.6M12.6 21h6.8" />
    </svg>
  )
}

function IconSideDish() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M7.6 16.3h16.8l-1.8 7H9.4l-1.8-7z" />
      <path d="M10.1 15.9c.3-2.8 2.6-4.7 5.2-4 .8-1.8 3.7-2.2 4.9.1 2.2.2 3.5 1.6 3.3 3.9" />
      <path d="M11.8 19h8.5" />
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
  const hostname = window.location.hostname.toLowerCase()
  const domainSuffix = '.menu.net.ar'

  if (hostname.endsWith(domainSuffix)) {
    const subdomain = hostname.slice(0, -domainSuffix.length).split('.').filter(Boolean).at(-1)

    if (subdomain && subdomain !== 'www') {
      return normalizeAccountAlias(decodeURIComponent(subdomain))
    }
  }

  const pathAccount = window.location.pathname
    .split('/')
    .filter(Boolean)
    .at(0)

  if (pathAccount && pathAccount !== 'admin') {
    return normalizeAccountAlias(decodeURIComponent(pathAccount))
  }

  const params = new URLSearchParams(window.location.search)
  return normalizeAccountAlias(params.get('account') ?? 'sandras-rose')
}

function normalizeAccountAlias(accountId) {
  const key = slugify(accountId ?? '')

  if (key === 'saborapampa') {
    return 'sabor-a-pampa'
  }

  // El subdominio pedido (lodetoto.menu.net.ar) se escribe distinto al
  // slug real de la cuenta en la base (lo-de-totto).
  if (key === 'lodetoto') {
    return 'lo-de-totto'
  }

  return accountId
}

function getAccountFaviconHref(accountId) {
  const key = slugify(accountId)

  if (key === 'kika' || key.includes('kika')) {
    return '/kika/favicon.svg'
  }

  if (key === 'almendra' || key.includes('almendra')) {
    return '/almendra/logo.png'
  }

  if (key.includes('sabor') && key.includes('pampa')) {
    return '/sabor-a-pampa/logo.png'
  }

  if (key.includes('totto')) {
    return '/lo-de-totto/logo.svg'
  }

  return key === 'host' || key.startsWith('host-') ? '/assets/host-favicon.png' : '/favicon.svg'
}

// iOS ignora los icons del manifest.webmanifest al hacer "Agregar a inicio":
// solo lee <link rel="apple-touch-icon">, y tiene que ser PNG (nada de SVG).
function getAccountAppleTouchIconHref(accountId) {
  const key = slugify(accountId)

  if (key === 'almendra' || key.includes('almendra')) {
    return '/almendra/logo.png'
  }

  if (key.includes('sabor') && key.includes('pampa')) {
    return '/sabor-a-pampa/logo.png'
  }

  if (key.includes('totto')) {
    return '/lo-de-totto/icon-512.png'
  }

  return '/assets/capta-pwa-icon.png'
}

function getAccountDocumentTitle(accountId, presentation) {
  const key = slugify(accountId)

  if (key === 'almendra' || key.includes('almendra')) {
    return 'Almendra | Menu digital'
  }

  if (key === 'kika' || key.includes('kika')) {
    return 'Kika | Menu digital'
  }

  if (key.includes('sabor') && key.includes('pampa')) {
    return 'Sabor a Pampa | Menu digital'
  }

  if (key.includes('totto')) {
    return 'Lo de Toto | Menu digital'
  }

  if (key === 'host' || key.startsWith('host-')) {
    return 'HOST | Menu digital'
  }

  const brand = String(presentation?.branding?.wordmark ?? '')
    .trim()
    .replace(/\s+/g, ' ')

  if (brand) {
    return `${brand} | Menu digital`
  }

  const accountTitle = String(accountId ?? '')
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

  return `${accountTitle || 'capta'} | Menu digital`
}

function setDocumentFavicon(href) {
  let link = document.querySelector('link[rel="icon"]')

  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    document.head.appendChild(link)
  }

  link.type = href.endsWith('.svg') ? 'image/svg+xml' : 'image/png'
  link.href = href
}

function setDocumentTitle(title) {
  document.title = title
}

function setDocumentManifest(href) {
  let link = document.querySelector('link[rel="manifest"]')

  if (!link) {
    link = document.createElement('link')
    link.rel = 'manifest'
    document.head.appendChild(link)
  }

  link.href = href
}

function setDocumentAppleTouchIcon(href) {
  let link = document.querySelector('link[rel="apple-touch-icon"]')

  if (!link) {
    link = document.createElement('link')
    link.rel = 'apple-touch-icon'
    document.head.appendChild(link)
  }

  link.href = href
}

function setDocumentThemeColor(color) {
  const normalizedColor = typeof color === 'string' && color.trim() ? color.trim() : '#ff6a00'
  let meta = document.querySelector('meta[name="theme-color"]')

  if (!meta) {
    meta = document.createElement('meta')
    meta.name = 'theme-color'
    document.head.appendChild(meta)
  }

  meta.content = normalizedColor
}

function registerMenuServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return
  }

  navigator.serviceWorker.register('/service-worker.js').catch(() => undefined)
}

function isStandalonePwa() {
  return Boolean(
    window.matchMedia?.('(display-mode: standalone)').matches ||
      window.matchMedia?.('(display-mode: fullscreen)').matches ||
      window.navigator?.standalone,
  )
}

function getPwaInstallPlatform() {
  const userAgent = window.navigator.userAgent || ''
  const isIos =
    /iphone|ipad|ipod/i.test(userAgent) ||
    (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1)
  const isAndroid = /android/i.test(userAgent)

  if (isIos) return 'ios'
  if (isAndroid) return 'android'
  return 'desktop'
}

function getSessionFlag(key) {
  try {
    return window.sessionStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

function setSessionFlag(key) {
  try {
    window.sessionStorage.setItem(key, '1')
  } catch {
    // Storage can be disabled in private browsing.
  }
}

function getLoadingTemplate(accountId) {
  const key = slugify(accountId)

  if (key.includes('host')) {
    return 'host'
  }

  if (key.includes('kika')) {
    return 'kika'
  }

  if (key.includes('almendra')) {
    return 'almendra'
  }

  if (key.includes('totto')) {
    return 'toto'
  }

  if (key.includes('florian')) {
    return 'florian'
  }

  if (key.includes('sabor') && key.includes('pampa')) {
    return 'sabor-pampa'
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

function isPromoCategoryLabel(label) {
  const key = slugify(label ?? '')
  return key.includes('promo') || key.includes('oferta') || key.includes('descuento')
}

function isDailyMenuCategoryLabel(label) {
  const key = slugify(label ?? '')
  return key === 'menu-del-dia' || key === 'menu-diario' || key.includes('plato-del-dia') || key.includes('menu-gourmet') || key.includes('menu-saludable') || key.includes('menu-especial')
}

function isDailyMenuItem(item) {
  return Boolean(
    item?.isDailyMenu ||
      isDailyMenuCategoryLabel(item?.categoryLabel) ||
      isDailyMenuCategoryLabel(item?.badge),
  )
}

function isComboCategoryLabel(label) {
  return slugify(label ?? '').includes('combo')
}

function findPromosCategory(categories = []) {
  return (
    categories.find((category) => isPromoCategoryLabel(category.label)) ??
    categories.find((category) => isComboCategoryLabel(category.label)) ??
    null
  )
}

function findExplicitPromosCategory(categories = []) {
  return categories.find((category) => isPromoCategoryLabel(category.label) && category.items?.length) ?? null
}

function findCombosCategory(categories = []) {
  return categories.find((category) => isComboCategoryLabel(category.label) && category.items?.length) ?? null
}

function normalizeSearchText(value) {
  return slugify(value ?? '').replace(/-/g, ' ').trim()
}

function getMenuItemSearchText(item) {
  return normalizeSearchText([
    item.name,
    item.description,
    item.categoryLabel,
    item.price,
    item.badge,
  ].filter(Boolean).join(' '))
}

function searchMenuItems(items, query) {
  const tokens = normalizeSearchText(query).split(/\s+/).filter(Boolean)

  if (!tokens.length) {
    return []
  }

  return items.filter((item) => {
    const haystack = getMenuItemSearchText(item)
    return tokens.every((token) => haystack.includes(token))
  })
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

function getPaymentSurchargeLabel(paymentMethod) {
  if (paymentMethod === 'mercado_pago') return 'Mercado Pago'
  if (paymentMethod === 'transferencia') return 'transferencia'
  return 'pago'
}

function formatShortDate(value) {
  if (!value) {
    return ''
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
  })
}

function getLoyaltyTransactionLabel(transaction) {
  if (transaction.kind === 'earn') {
    return 'Puntos ganados'
  }

  if (transaction.kind === 'redeem') {
    return 'Canje realizado'
  }

  return 'Movimiento de puntos'
}

function parsePositiveNumber(value, fallback = 0) {
  const parsed = Number(value ?? fallback)
  return Number.isFinite(parsed) ? parsed : fallback
}

function parsePositiveInteger(value, fallback = 0) {
  const parsed = Number.parseInt(String(value ?? ''), 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

function calculateLoyaltyEarnPreview(subtotal, settings) {
  if (!settings?.enabled) {
    return 0
  }

  const eligibleSubtotal = Math.max(0, parsePositiveNumber(subtotal, 0))
  const minimumOrderTotal = Math.max(0, parsePositiveNumber(settings.minimumOrderTotal, 0))
  const spendAmountStep = Math.max(1, parsePositiveNumber(settings.spendAmountStep, 1))
  const pointsPerStep = Math.max(1, parsePositiveInteger(settings.pointsPerStep, 1))

  if (eligibleSubtotal < minimumOrderTotal) {
    return 0
  }

  return Math.max(0, Math.floor(eligibleSubtotal / spendAmountStep) * pointsPerStep)
}

function getLoyaltyEarnPreviewText(points, pointsName, subtotal, settings, currencySymbol) {
  if (!settings?.enabled) {
    return ''
  }

  if (points > 0) {
    return `Esta compra suma ${points} ${pointsName}.`
  }

  const minimumOrderTotal = Math.max(0, parsePositiveNumber(settings.minimumOrderTotal, 0))

  if (minimumOrderTotal > subtotal) {
    return `Esta compra suma 0 ${pointsName}. Sumás desde ${formatPrice(minimumOrderTotal, currencySymbol)}.`
  }

  return `Esta compra suma 0 ${pointsName}.`
}

function getProductLoyaltyPoints(product, settings) {
  if (!settings?.enabled) {
    return 0
  }

  const unitPrice = product?.unitPrice ?? toNumericPrice(product?.price)
  return calculateLoyaltyEarnPreview(unitPrice, {
    ...settings,
    minimumOrderTotal: 0,
  })
}

function calculateRedemptionDiscountTotal(redemptions, subtotal) {
  const base = Math.max(0, Number(subtotal || 0))
  const total = (redemptions || []).reduce((sum, reward) => {
    if (reward.rewardType !== 'discount') {
      return sum
    }

    const value = Math.max(0, Number(reward.discountValue || 0))
    const maxAmount = Math.max(0, Number(reward.discountMaxAmount || 0))
    const rawDiscount =
      reward.discountType === 'fixed'
        ? value
        : Math.round((base * value) / 100)
    const cappedDiscount = maxAmount > 0 ? Math.min(rawDiscount, maxAmount) : rawDiscount

    return sum + Math.max(0, cappedDiscount)
  }, 0)

  return Math.min(base, total)
}

function normalizeImageList(...groups) {
  return Array.from(
    new Set(
      groups
        .flatMap((group) => (Array.isArray(group) ? group : [group]))
        .map((item) => String(item ?? '').trim())
        .filter(Boolean),
    ),
  )
}

function getHeroImage(presentation, heroDish) {
  return presentation.hero?.image ?? heroDish?.image ?? '/dishes/hero-clean-cut.png'
}

function getHeroImages(presentation, fallbackImage) {
  const customImages = normalizeImageList(
    presentation.hero?.images,
    presentation.theme?.headerImages,
  )

  if (customImages.length) {
    return customImages
  }

  return normalizeImageList(
    presentation.hero?.image,
    fallbackImage,
  )
}

function getBurgerHeroImages(presentation, fallbackImage) {
  const headerImages = normalizeImageList(
    presentation.hero?.images,
    presentation.theme?.headerImages,
  )

  if (headerImages.length) {
    return headerImages
  }

  const heroImage = String(presentation.hero?.image ?? '').trim()

  if (heroImage) {
    return [heroImage]
  }

  return normalizeImageList(fallbackImage)
}
function getHeroVideo(presentation) {
  return String(
    presentation.hero?.video ||
      presentation.theme?.headerVideo ||
      '',
  ).trim()
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
    // Al entrar sin categoria elegida se muestra la carta completa (ver
    // showsFullMenuByDefault), asi que aca no hay que forzar "Hamburguesas".
    return ''
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

  if (templateId === 'kika') {
    return ''
  }

  if (templateId === 'almendra') {
    return ''
  }

  if (templateId === 'florian') {
    return getFlorianOrderedCategories(payload?.categories ?? [])[0]?.id ?? payload?.categories?.[0]?.id ?? ''
  }

  if (templateId === 'sabor-pampa') {
    return ''
  }

  return payload?.categories?.[0]?.id ?? ''
}

function getCategoryIcon(label) {
  const key = slugify(label)

  if (isPromoCategoryLabel(label)) return IconTicket
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

const kikaCategoryOrder = [
  'cafeteria',
  'pasteleria',
  'panaderia',
  'sin-gluten',
  'sandwiches',
  'ensaladas',
  'brunch',
  'tapeos',
  'omelettes',
]

const kikaPrimaryCategoryKeys = new Set(['cafeteria', 'pasteleria', 'panaderia', 'sin-gluten'])

const kikaCanonicalCategoryLabels = {
  cafeteria: 'Cafetería',
  pasteleria: 'Pastelería',
  panaderia: 'Panadería',
  'sin-gluten': 'Sin Gluten',
  sandwiches: 'Sandwiches',
  ensaladas: 'Ensaladas',
  brunch: 'Brunch',
  tapeos: 'Tapeos',
  omelettes: 'Omelettes',
}

function getKikaCanonicalCategoryKey(label) {
  const key = slugify(label ?? '')

  if (!key) return ''
  if (key.includes('sin-gluten') || key.includes('sin-tacc') || key.includes('gluten')) return 'sin-gluten'
  if (key.includes('pasteleria') || key.includes('postre') || key.includes('torta') || key.includes('cheesecake') || key.includes('tiramisu')) return 'pasteleria'
  if (key.includes('panaderia') || key.includes('medialuna') || key.includes('chipa') || key.includes('scon') || key.includes('vigilante')) return 'panaderia'
  if (key.includes('sandwich') || key.includes('sandwiche') || key.includes('ciabatta') || key.includes('baguette') || key.includes('tostado')) return 'sandwiches'
  if (key.includes('ensalada') || key.includes('cesar') || key.includes('quinoa')) return 'ensaladas'
  if (key.includes('brunch') || key.includes('toast') || key.includes('keto') || key.includes('huevo') || key.includes('pizza-de-masa-madre')) return 'brunch'
  if (key.includes('tapeo') || key.includes('tapas') || key.includes('queso') || key.includes('jamon') || key.includes('mortadela') || key.includes('aceituna') || key.includes('tortilla') || key.includes('chorizo') || key.includes('salame')) return 'tapeos'
  if (key.includes('omelette') || key.includes('omelet')) return 'omelettes'
  if (key.includes('cafeteria') || key.includes('cafe') || key.includes('bebida') || key.includes('latte') || key.includes('espresso') || key.includes('capuccino') || key.includes('cappuccino') || key.includes('americano') || key.includes('cortado') || key.includes('ristretto') || key.includes('moka') || key.includes('macchiato') || key.includes('monaco') || key.includes('afogato') || key.includes('frio') || key.includes('licuado') || key.includes('limonada') || key.includes('jugo') || key.includes('agua') || key.includes('gaseosa') || key.includes('energizante')) return 'cafeteria'

  return key
}

function getKikaCategoryRank(label) {
  const key = getKikaCanonicalCategoryKey(label)
  const index = kikaCategoryOrder.findIndex((entry) => key.includes(entry))
  return index === -1 ? kikaCategoryOrder.length : index
}

function getKikaOrderedCategories(categories = []) {
  return [...categories].sort((a, b) => {
    const rankDiff = getKikaCategoryRank(a.label) - getKikaCategoryRank(b.label)
    return rankDiff || String(a.label).localeCompare(String(b.label), 'es')
  })
}

function normalizeKikaCategories(categories = []) {
  const groupedCategories = new Map()
  const seenItems = new Set()

  categories.forEach((category, categoryIndex) => {
    const canonicalKey =
      getKikaCanonicalCategoryKey(category.label) ||
      slugify(category.label ?? category.id ?? `categoria-${categoryIndex}`)
    const canonicalLabel = kikaCanonicalCategoryLabels[canonicalKey] ?? category.label

    if (!groupedCategories.has(canonicalKey)) {
      groupedCategories.set(canonicalKey, {
        ...category,
        id: canonicalKey,
        label: canonicalLabel,
        items: [],
      })
    }

    const groupedCategory = groupedCategories.get(canonicalKey)

    ;(category.items ?? []).forEach((item, itemIndex) => {
      const itemKey = item.id ?? `${canonicalKey}-${item.name ?? itemIndex}`

      if (seenItems.has(itemKey)) {
        return
      }

      seenItems.add(itemKey)
      groupedCategory.items.push({
        ...item,
        categoryLabel: canonicalLabel,
      })
    })
  })

  return getKikaOrderedCategories([...groupedCategories.values()]).filter(
    (category) => category.items?.length,
  )
}

function getKikaCategoryMeta(label) {
  const key = getKikaCanonicalCategoryKey(label)

  if (key.includes('cafeteria')) {
    return {
      label: 'Cafetería',
      sectionTitle: 'Cafetería',
      subtitle: 'Café de especialidad, bebidas y momentos suaves para acompañar el día.',
      icon: IconKikaCup,
      art: 'coffee',
      featured: true,
    }
  }

  if (key.includes('pasteleria')) {
    return {
      label: 'Pastelería',
      sectionTitle: 'Pastelería',
      subtitle: 'Postres artesanales para cada antojo.',
      icon: IconKikaCake,
      art: 'cake',
      featured: true,
    }
  }

  if (key.includes('panaderia')) {
    return {
      label: 'Panadería',
      sectionTitle: 'Panadería',
      subtitle: 'Hecho cada día, con ingredientes de calidad.',
      icon: IconKikaCroissant,
      art: 'bread',
      featured: true,
    }
  }

  if (key.includes('sin-gluten')) {
    return {
      label: 'Sin Gluten',
      sectionTitle: 'Sin Gluten',
      subtitle: 'Opciones simples para consultar variedades disponibles.',
      icon: IconKikaLeaf,
      art: 'leaf',
      featured: true,
    }
  }

  if (key.includes('sandwich')) {
    return {
      label: 'Sandwiches',
      sectionTitle: 'Sandwiches',
      subtitle: 'Pan fresco, rellenos nobles y combinaciones listas para disfrutar.',
      icon: IconKikaSandwich,
      art: 'sandwich',
    }
  }

  if (key.includes('ensalada')) {
    return {
      label: 'Ensaladas',
      sectionTitle: 'Ensaladas',
      subtitle: 'Frescas, livianas y preparadas al momento.',
      icon: IconKikaSalad,
      art: 'salad',
    }
  }

  if (key.includes('brunch')) {
    return {
      label: 'Brunch',
      sectionTitle: 'Brunch',
      subtitle: 'A toda hora, con sabores suaves y abundantes.',
      icon: IconKikaSandwich,
      art: 'brunch',
    }
  }

  if (key.includes('tapeo')) {
    return {
      label: 'Tapeos',
      sectionTitle: 'Tapeos',
      subtitle: 'Para compartir con panera y buenos momentos.',
      icon: IconServe,
      art: 'tapas',
    }
  }

  if (key.includes('omelette')) {
    return {
      label: 'Omelettes',
      sectionTitle: 'Omelettes',
      subtitle: 'Hechos al momento y combinados como quieras.',
      icon: IconKikaSalad,
      art: 'omelette',
    }
  }

  return {
    label,
    sectionTitle: label,
    subtitle: 'Selección especial de Kika Café.',
    icon: IconServe,
    art: 'default',
  }
}

function getKikaPrimaryCategories(categories = []) {
  const orderedCategories = normalizeKikaCategories(categories)
  const primaryCategories = orderedCategories.filter((category) =>
    kikaPrimaryCategoryKeys.has(slugify(category.label)),
  )

  return primaryCategories.length ? primaryCategories : orderedCategories.slice(0, 4)
}

function KikaProductVisual({ item, category }) {
  if (item.video) {
    return (
      <video
        src={getVideoFrameSrc(item.video)}
        preload="auto"
        autoPlay
        muted
        loop
        playsInline
      />
    )
  }

  if (item.hasCustomImage) {
    return <img src={item.image} alt={item.name} />
  }

  const meta = getKikaCategoryMeta(category?.label ?? item.badge)
  const Icon = meta.icon

  return (
    <span className={`kika-product-placeholder kika-product-placeholder-${meta.art}`} aria-hidden="true">
      <Icon />
    </span>
  )
}

const almendraCategoryOrder = [
  'cafe',
  'pasteleria',
  'cocina',
  'bebidas',
  'granos',
  'take-away',
]

const almendraCanonicalCategoryLabels = {
  cafe: 'Café',
  pasteleria: 'Pastelería',
  cocina: 'Cocina',
  bebidas: 'Bebidas',
  granos: 'Granos',
  'take-away': 'Take Away',
}

function getAlmendraFallbackCategories() {
  const fallbackItems = [
    {
      id: 'almendra-placeholder-flat-white',
      name: 'Flat White',
      description: 'Equilibrado y sedoso. Doble shot de espresso con leche texturizada.',
      price: '$2.600',
      unitPrice: 2600,
      availableForOrder: false,
      maxQuantity: 0,
      categoryLabel: 'Café',
    },
    {
      id: 'almendra-placeholder-cold-brew',
      name: 'Cold Brew',
      description: 'Suave, refrescante y naturalmente dulce. Extraccion en frio.',
      price: '$2.900',
      unitPrice: 2900,
      availableForOrder: false,
      maxQuantity: 0,
      categoryLabel: 'Café',
    },
    {
      id: 'almendra-placeholder-cappuccino',
      name: 'Cappuccino',
      description: 'Clasico italiano. Espresso, leche vaporizada y espuma ligera.',
      price: '$2.500',
      unitPrice: 2500,
      availableForOrder: false,
      maxQuantity: 0,
      categoryLabel: 'Café',
    },
  ]

  return almendraCategoryOrder.map((key) => ({
    id: key,
    label: almendraCanonicalCategoryLabels[key],
    items:
      key === 'cafe'
        ? fallbackItems
        : [
            {
              id: `almendra-placeholder-${key}`,
              name: almendraCanonicalCategoryLabels[key],
              description: 'Espacio preparado para cargar productos reales desde el admin.',
              price: '$0',
              unitPrice: 0,
              availableForOrder: false,
              maxQuantity: 0,
              categoryLabel: almendraCanonicalCategoryLabels[key],
            },
          ],
  }))
}

function getAlmendraCategoryKey(label) {
  const key = slugify(label ?? '')

  if (!key) return ''
  if (key.includes('pasteleria') || key.includes('postre') || key.includes('torta') || key.includes('croissant') || key.includes('medialuna')) return 'pasteleria'
  if (key.includes('cocina') || key.includes('sandwich') || key.includes('tostado') || key.includes('brunch') || key.includes('almuerzo')) return 'cocina'
  if (key.includes('bebida') || key.includes('jugo') || key.includes('agua') || key.includes('limonada') || key.includes('licuado')) return 'bebidas'
  if (key.includes('grano') || key.includes('blend') || key.includes('molido') || key.includes('espresso')) return 'granos'
  if (key.includes('take') || key.includes('away') || key.includes('regalo') || key.includes('tienda')) return 'take-away'
  if (key.includes('cafe') || key.includes('cafeteria') || key.includes('latte') || key.includes('flat') || key.includes('cold') || key.includes('cappuccino') || key.includes('capuccino')) return 'cafe'

  return key
}

function getAlmendraReadableCategoryLabel(label) {
  const text = String(label ?? '').trim()

  if (!text) return 'Categoria'

  return text.charAt(0).toUpperCase() + text.slice(1)
}

function getAlmendraOrderedCategories(categories = []) {
  return [...categories].sort((a, b) => {
    const firstRank = almendraCategoryOrder.indexOf(getAlmendraCategoryKey(a.label))
    const secondRank = almendraCategoryOrder.indexOf(getAlmendraCategoryKey(b.label))
    const normalizedFirstRank = firstRank === -1 ? almendraCategoryOrder.length : firstRank
    const normalizedSecondRank = secondRank === -1 ? almendraCategoryOrder.length : secondRank

    return normalizedFirstRank - normalizedSecondRank || String(a.label).localeCompare(String(b.label), 'es')
  })
}

function normalizeAlmendraCategories(categories = []) {
  const hasRealItems = categories.some((category) => category.items?.length)

  if (!hasRealItems) {
    return getAlmendraFallbackCategories()
  }

  const groupedCategories = new Map()
  const seenItems = new Set()

  categories.forEach((category, categoryIndex) => {
    const rawCategoryLabel = category.label ?? category.name ?? category.id ?? `categoria-${categoryIndex}`
    const canonicalKey =
      getAlmendraCategoryKey(rawCategoryLabel) ||
      slugify(rawCategoryLabel)
    const canonicalLabel = almendraCanonicalCategoryLabels[canonicalKey] ?? rawCategoryLabel

    if (!groupedCategories.has(canonicalKey)) {
      groupedCategories.set(canonicalKey, {
        ...category,
        id: canonicalKey,
        label: canonicalLabel,
        items: [],
      })
    }

    const groupedCategory = groupedCategories.get(canonicalKey)

    ;(category.items ?? []).forEach((item, itemIndex) => {
      const itemKey = item.id ?? `${canonicalKey}-${item.name ?? itemIndex}`

      if (seenItems.has(itemKey)) {
        return
      }

      seenItems.add(itemKey)
      groupedCategory.items.push({
        ...item,
        categoryLabel: canonicalLabel,
      })
    })
  })

  return getAlmendraOrderedCategories([...groupedCategories.values()]).filter(
    (category) => category.items?.length,
  )
}

function getAlmendraCategoryMeta(label) {
  const key = getAlmendraCategoryKey(label)
  const displayLabel = getAlmendraReadableCategoryLabel(label)

  if (key === 'pasteleria') {
    return {
      label: 'Pastelería',
      sectionTitle: 'Pastelería de autor',
      subtitle: 'Dulces simples, texturas delicadas y recetas para acompañar el café.',
      icon: IconAlmendraPastry,
      art: 'pastry',
    }
  }

  if (key === 'cocina') {
    return {
      label: 'Cocina',
      sectionTitle: 'Cocina simple',
      subtitle: 'Preparaciones honestas, frescas y listas para disfrutar.',
      icon: IconKikaSandwich,
      art: 'kitchen',
    }
  }

  if (key === 'bebidas') {
    return {
      label: 'Bebidas',
      sectionTitle: 'Bebidas',
      subtitle: 'Frías, naturales y elegidas para cada momento del día.',
      icon: IconDrink,
      art: 'drink',
    }
  }

  if (key === 'granos') {
    return {
      label: 'Granos',
      sectionTitle: 'Granos seleccionados',
      subtitle: 'Café para llevar la experiencia Almendra a casa.',
      icon: IconKikaHazelnut,
      art: 'beans',
    }
  }

  if (key === 'take-away') {
    return {
      label: 'Take Away',
      sectionTitle: 'Take away',
      subtitle: 'Productos seleccionados para regalar o disfrutar después.',
      icon: IconAlmendraGift,
      art: 'gift',
    }
  }

  if (key.includes('cookie') || key.includes('galleta')) {
    return {
      label: displayLabel,
      sectionTitle: displayLabel,
      subtitle: 'Cookies y dulces para acompanar el cafe.',
      icon: IconAlmendraCookie,
      art: 'pastry',
    }
  }

  if (key && !almendraCategoryOrder.includes(key)) {
    return {
      label: displayLabel,
      sectionTitle: displayLabel,
      subtitle: 'Productos seleccionados de la carta.',
      icon: IconKikaLeaf,
      art: 'generic',
    }
  }

  return {
    label: 'Café',
    sectionTitle: 'Café de especialidad',
    subtitle: 'Granos seleccionados, preparados con dedicación.',
    icon: IconKikaCup,
    art: 'coffee',
  }
}

function AlmendraProductVisual({ item, category }) {
  if (item.video) {
    return (
      <video
        src={getVideoFrameSrc(item.video)}
        preload="auto"
        autoPlay
        muted
        loop
        playsInline
      />
    )
  }

  if (item.hasCustomImage) {
    return <img src={item.image} alt={item.name} />
  }

  const meta = getAlmendraCategoryMeta(category?.label ?? item.badge)
  const Icon = meta.icon

  return (
    <span className={`almendra-product-placeholder almendra-product-placeholder-${meta.art}`} aria-hidden="true">
      <Icon />
    </span>
  )
}

const florianCategoryOrder = [
  'cafes',
  'filtrados',
  'frios',
  'bebidas',
  'te-infusiones',
  'desayunos',
  'almuerzos',
  'dulces',
]

function getFlorianCategoryKey(label) {
  const key = slugify(label ?? '')

  if (!key) return ''
  if (key.includes('frio') || key.includes('cold') || key.includes('limonada') || key.includes('licuado')) return 'frios'
  if (key.includes('bebida') || key.includes('agua') || key.includes('gaseosa')) return 'bebidas'
  if (key.includes('pasteleria') || key.includes('panaderia') || key.includes('dulce') || key.includes('postre') || key.includes('torta')) return 'dulces'
  if (key === 'te' || key.startsWith('te-') || key.endsWith('-te') || key.includes('infusion')) return 'te-infusiones'
  if (key.includes('desayuno') || key.includes('tostada') || key.includes('croissant')) return 'desayunos'
  if (key.includes('almuerzo') || key.includes('sandwich') || key.includes('ensalada')) return 'almuerzos'
  if (key.includes('filtrado')) return 'filtrados'
  if (key.includes('cafe') || key.includes('cafeteria') || key.includes('espresso') || key.includes('latte')) return 'cafes'

  return key
}

function getFlorianCategoryRank(label) {
  const key = getFlorianCategoryKey(label)
  const index = florianCategoryOrder.findIndex((entry) => key.includes(entry))
  return index === -1 ? florianCategoryOrder.length : index
}

function getFlorianOrderedCategories(categories = []) {
  return [...categories].sort((a, b) => {
    const rankDiff = getFlorianCategoryRank(a.label) - getFlorianCategoryRank(b.label)
    return rankDiff || String(a.label).localeCompare(String(b.label), 'es')
  })
}

function getFlorianCategoryMeta(label) {
  const key = getFlorianCategoryKey(label)

  if (key === 'cafes') {
    return {
      label: 'Cafes',
      sectionTitle: 'CAFES CLASICOS',
      subtitle: 'Hechos con granos seleccionados.',
      icon: IconKikaCup,
      art: 'coffee',
    }
  }

  if (key === 'frios') {
    return {
      label: 'Frios',
      sectionTitle: 'BEBIDAS FRIAS',
      subtitle: 'Refrescantes, cremosas y listas para disfrutar.',
      icon: IconDrink,
      art: 'cold',
    }
  }

  if (key === 'bebidas') {
    return {
      label: 'Bebidas',
      sectionTitle: 'BEBIDAS',
      subtitle: 'Opciones frescas para acompanar tu pedido.',
      icon: IconDrink,
      art: 'cold',
    }
  }

  if (key === 'filtrados') {
    return {
      label: 'Filtrados',
      sectionTitle: 'FILTRADOS',
      subtitle: 'Metodos suaves, granos elegidos y tiempo justo.',
      icon: IconKikaCup,
      art: 'coffee',
    }
  }

  if (key === 'te-infusiones') {
    return {
      label: 'Te & Infusiones',
      sectionTitle: 'TE & INFUSIONES',
      subtitle: 'Rituales simples para bajar un cambio.',
      icon: IconServe,
      art: 'tea',
    }
  }

  if (key === 'desayunos') {
    return {
      label: 'Desayunos',
      sectionTitle: 'DESAYUNOS',
      subtitle: 'Para empezar el dia con algo rico.',
      icon: IconKikaCroissant,
      art: 'breakfast',
    }
  }

  if (key === 'almuerzos') {
    return {
      label: 'Almuerzos',
      sectionTitle: 'ALMUERZOS',
      subtitle: 'Cocina simple, fresca y con buen cafe.',
      icon: IconBurger,
      art: 'lunch',
    }
  }

  if (key === 'dulces') {
    return {
      label: 'Dulces',
      sectionTitle: 'DULCES',
      subtitle: 'Pasteleria para acompanar cualquier momento.',
      icon: IconKikaCake,
      art: 'sweet',
    }
  }

  return {
    label,
    sectionTitle: String(label ?? 'MENU').toUpperCase(),
    subtitle: 'Seleccion Florian para pedir ahora.',
    icon: IconServe,
    art: 'default',
  }
}

function FlorianProductVisual({ item, category }) {
  if (item?.video) {
    return (
      <video
        src={getVideoFrameSrc(item.video)}
        preload="auto"
        autoPlay
        muted
        loop
        playsInline
      />
    )
  }

  if (item?.hasCustomImage) {
    return <img src={item.image} alt={item.name} />
  }

  const meta = getFlorianCategoryMeta(category?.label ?? item?.categoryLabel ?? item?.badge)
  const Icon = meta.icon

  return (
    <span className={`florian-product-placeholder florian-product-placeholder-${meta.art}`} aria-hidden="true">
      <Icon />
    </span>
  )
}

function FlorianHeroFallback() {
  return (
    <div className="florian-hero-fallback" aria-hidden="true">
      <div className="florian-storefront">
        <span className="florian-storefront-roof" />
        <span className="florian-storefront-body" />
        <span className="florian-storefront-awning awning-one" />
        <span className="florian-storefront-awning awning-two" />
        <span className="florian-storefront-tree" />
      </div>
      <div className="florian-cup-art">
        <span className="florian-cup-coffee" />
        <span className="florian-cup-handle" />
        <span className="florian-cup-saucer" />
      </div>
    </div>
  )
}

function getKikaOptionIcon(label) {
  const key = slugify(label)

  if (key.includes('avellana')) return <IconKikaHazelnut />
  if (key.includes('coco')) return <IconKikaCoconut />
  if (key.includes('caramelo')) return <IconKikaCaramel />
  if (key.includes('pistacho')) return <IconKikaPistachio />
  if (key.includes('vainilla')) return <IconKikaVanilla />
  if (key.includes('almendra') || key.includes('avena')) return <IconKikaLeaf />
  if (key.includes('fria') || key.includes('hielo')) return <IconKikaCup />

  return <IconKikaCup />
}

function getTemplateProductOptionGroups(_templateId, dish) {
  return buildProductOptionGroups(dish)
}

function getKikaDetailDescription(dish) {
  const description = String(dish?.description ?? '').trim()

  if (description) {
    return description
  }

  const categoryKey = slugify(`${dish?.categoryLabel ?? ''} ${dish?.badge ?? ''}`)

  if (categoryKey.includes('bebida') || categoryKey.includes('cafeteria')) {
    return 'Bebida preparada al momento con ingredientes frescos y el estilo suave de Kika Café.'
  }

  if (categoryKey.includes('pasteleria')) {
    return 'Preparación artesanal, pensada para acompañar café, encuentros y momentos tranquilos.'
  }

  if (categoryKey.includes('panaderia')) {
    return 'Elaborado cada dia con ingredientes simples, textura suave y sabor casero.'
  }

  return 'Preparación seleccionada por Kika Café para disfrutar en cualquier momento del día.'
}

function KikaDetailHeroVisual({ dish, presentation }) {
  if (dish?.video) {
    return (
      <video
        src={getVideoFrameSrc(dish.video)}
        preload="auto"
        autoPlay={shouldAutoplayVideoPreview(presentation)}
        muted={presentation.preview?.mutedVideos ?? true}
        loop={shouldAutoplayVideoPreview(presentation)}
        playsInline
      />
    )
  }

  if (dish?.hasCustomImage) {
    return <img src={dish.image} alt={dish.name} className={getImageAnimationClass(dish)} />
  }

  return (
    <span className="kika-detail-hero-fallback" aria-hidden="true">
      <span className="kika-detail-fallback-plant" />
      <span className="kika-detail-fallback-glass">
        <span />
      </span>
      <span className="kika-detail-fallback-plate" />
    </span>
  )
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

function normalizeOptionEntry(option) {
  if (typeof option === 'string') {
    return {
      value: option,
      label: option,
      price: 0,
      quantity: 1,
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
    quantity: Math.max(1, Number(option.quantity ?? 1)),
    image: option.image ?? '',
    video: option.video ?? '',
    hasMedia: Boolean(option.hasMedia ?? option.video ?? option.image),
    subtitle: option.subtitle ?? '',
  }
}

function buildProductOptionGroups(dish) {
  if (Array.isArray(dish?.optionGroups) && dish.optionGroups.length > 0) {
    return dish.optionGroups
  }

  return []
}

function isIncludedOptionGroup(group) {
  const key = slugify(`${group?.display ?? ''} ${group?.type ?? ''} ${group?.title ?? ''}`)
  return key.includes('included') || key.includes('incluye')
}

function getSelectableOptionGroups(groups = []) {
  return groups.filter((group) => !isIncludedOptionGroup(group))
}

function getIncludedOptionGroups(groups = []) {
  return groups.filter(isIncludedOptionGroup)
}

// --- Plan semanal -----------------------------------------------------------
// Algunos negocios (viandas, meal prep) venden un pack donde el cliente elige
// un producto para cada dia de la semana. Eso se modela con un grupo de
// opciones por dia (`kind: 'day'`), y se muestra como planificador en vez de
// como lista larga de chips.

const WEEKDAY_SEQUENCE = [
  { key: 'lunes', label: 'Lunes', short: 'Lun' },
  { key: 'martes', label: 'Martes', short: 'Mar' },
  { key: 'miercoles', label: 'Miercoles', short: 'Mie' },
  { key: 'jueves', label: 'Jueves', short: 'Jue' },
  { key: 'viernes', label: 'Viernes', short: 'Vie' },
  { key: 'sabado', label: 'Sabado', short: 'Sab' },
  { key: 'domingo', label: 'Domingo', short: 'Dom' },
]

function normalizeDayKey(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

function getGroupWeekday(group) {
  const explicit = normalizeDayKey(group?.day)
  const fromTitle = normalizeDayKey(group?.title)

  return (
    WEEKDAY_SEQUENCE.find((day) => day.key === explicit) ??
    WEEKDAY_SEQUENCE.find((day) => day.key === fromTitle) ??
    null
  )
}

function getWeeklyPlanDays(groups = []) {
  return groups
    .map((group) => {
      const weekday = getGroupWeekday(group)

      if (!weekday && String(group?.kind ?? '') !== 'day') {
        return null
      }

      return {
        group,
        weekday: weekday ?? {
          key: slugify(group.title),
          label: group.title,
          short: String(group.title).slice(0, 3),
        },
      }
    })
    .filter(Boolean)
}

// Un dia puede estar configurado como single (un plato) o multiple (varios).
// Estas dos funciones normalizan esa diferencia para que el planificador lea
// siempre una lista: sin esto, un grupo multiple guarda [] y `Boolean([])` es
// true, con lo cual los dias figuraban elegidos sin que el cliente eligiera.
function getDaySelectedValues(group, selections) {
  const value = selections?.[group.id]

  if (Array.isArray(value)) {
    return value.filter(Boolean)
  }

  return value ? [value] : []
}

// Precio de entrada de un pack: si el producto no tiene precio propio, sale de
// la vianda mas barata que se pueda elegir.
function getPlanStartingPrice(dish, days) {
  const base = dish.unitPrice ?? toNumericPrice(dish.price)

  if (base > 0) {
    return 0
  }

  const precios = days
    .flatMap((entry) => entry.group.options.map((option) => Number(option?.price || 0)))
    .filter((precio) => precio > 0)

  return precios.length ? Math.min(...precios) : 0
}

function getDaySelectedOptions(group, selections) {
  const values = getDaySelectedValues(group, selections)

  if (!values.length) {
    return []
  }

  const options = group.options.map(normalizeOptionEntry)
  return values.map((value) => options.find((option) => option.value === value)).filter(Boolean)
}

function WeeklyPlanDetail({
  dish,
  days,
  selections,
  onSelectOption,
  currencySymbol,
  extraTotal,
  quantity,
  onQuantityChange,
  onClose,
  onAdd,
  addDisabled,
  addLabel,
}) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [activeTag, setActiveTag] = useState('')

  const activeEntry = days[activeIndex] ?? days[0]
  const activeGroup = activeEntry.group
  const activeValues = getDaySelectedValues(activeGroup, selections)
  const activeIsMultiple = isGroupMultiple(activeGroup)
  const basePrice = dish.unitPrice ?? toNumericPrice(dish.price)

  const activeOptions = useMemo(
    () =>
      activeGroup.options.map((rawOption) => ({
        ...normalizeOptionEntry(rawOption),
        tag: String(rawOption?.tag ?? '').trim(),
      })),
    [activeGroup],
  )
  const tags = useMemo(() => {
    const unique = []
    activeOptions.forEach((option) => {
      if (option.tag && !unique.includes(option.tag)) {
        unique.push(option.tag)
      }
    })
    return unique
  }, [activeOptions])

  const visibleOptions = activeTag
    ? activeOptions.filter((option) => option.tag === activeTag)
    : activeOptions

  const chosenDays = days.filter((entry) => getDaySelectedValues(entry.group, selections).length)
  const missingRequired = days.filter(
    (entry) => entry.group.required && !getDaySelectedValues(entry.group, selections).length,
  )
  const progress = Math.round((chosenDays.length / days.length) * 100)

  function handlePick(option) {
    onSelectOption(activeGroup, option.value)
    setActiveTag('')

    // En un dia de seleccion multiple el cliente puede seguir sumando platos,
    // asi que no se avanza solo; en uno de un plato, si se acaba de elegir, se
    // salta al proximo dia que todavia no tiene nada.
    if (activeIsMultiple || activeValues.includes(option.value)) {
      return
    }

    const nextPending = days.findIndex(
      (entry, index) =>
        index > activeIndex && !getDaySelectedValues(entry.group, selections).length,
    )

    if (nextPending >= 0) {
      setActiveIndex(nextPending)
    }
  }

  return (
    <section className="weekly-plan">
      <header className="weekly-plan-head">
        <button type="button" className="floating-button light" onClick={onClose} aria-label="Volver">
          <IconBack />
        </button>
        <div className="weekly-plan-headline">
          <span className="weekly-plan-eyebrow">Arma tu semana</span>
          <h2>{dish.name}</h2>
        </div>
      </header>

      <div className="weekly-plan-progress">
        <div className="weekly-plan-progress-track">
          <span style={{ width: `${progress}%` }} />
        </div>
        <p>
          {missingRequired.length === 0
            ? chosenDays.length === days.length
              ? 'Semana completa'
              : `${chosenDays.length} de ${days.length} dias elegidos`
            : `${chosenDays.length} de ${days.length} dias · falta ${missingRequired[0].weekday.label.toLowerCase()}`}
        </p>
      </div>

      <nav className="weekly-plan-rail" aria-label="Dias de la semana">
        {days.map((entry, index) => {
          const elegidas = getDaySelectedValues(entry.group, selections).length
          const classes = [
            'weekly-plan-day',
            index === activeIndex ? 'active' : '',
            elegidas ? 'filled' : '',
            entry.group.required ? 'required' : 'optional',
          ]
            .filter(Boolean)
            .join(' ')

          return (
            <button
              key={entry.group.id}
              type="button"
              className={classes}
              onClick={() => {
                setActiveIndex(index)
                setActiveTag('')
              }}
              aria-current={index === activeIndex}
            >
              <span className="weekly-plan-day-short">{entry.weekday.short}</span>
              <span className="weekly-plan-day-state" aria-hidden="true">
                {elegidas > 1 ? `${elegidas}` : elegidas ? '✓' : entry.group.required ? '•' : '+'}
              </span>
            </button>
          )
        })}
      </nav>

      <div className="weekly-plan-body">
        <div className="weekly-plan-day-head">
          <h3>{activeEntry.weekday.label}</h3>
          <p>
            {activeGroup.required
              ? 'Elegi la vianda de este dia'
              : activeIsMultiple
                ? 'Dia opcional: podes sumar mas de una vianda'
                : 'Dia opcional: sumalo solo si lo necesitas'}
          </p>
        </div>

        {tags.length > 1 ? (
          <div className="weekly-plan-filters" role="tablist">
            <button
              type="button"
              className={activeTag ? '' : 'active'}
              onClick={() => setActiveTag('')}
            >
              Todas
            </button>
            {tags.map((tag) => (
              <button
                key={tag}
                type="button"
                className={activeTag === tag ? 'active' : ''}
                onClick={() => setActiveTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        ) : null}

        <div className="weekly-plan-grid">
          {visibleOptions.map((option) => {
            const isSelected = activeValues.includes(option.value)

            return (
              <button
                key={option.value}
                type="button"
                className={`weekly-plan-option ${isSelected ? 'selected' : ''}`}
                onClick={() => handlePick(option)}
              >
                <span className="weekly-plan-option-media">
                  {option.image ? <img src={option.image} alt="" loading="lazy" /> : null}
                  {isSelected ? (
                    <span className="weekly-plan-option-check" aria-hidden="true">
                      ✓
                    </span>
                  ) : null}
                </span>
                <span className="weekly-plan-option-body">
                  <strong>{option.label}</strong>
                  {option.subtitle ? <small>{option.subtitle}</small> : null}
                </span>
                <span className="weekly-plan-option-price">
                  {option.price > 0 ? `+${formatPrice(option.price, currencySymbol)}` : 'Incluida'}
                </span>
              </button>
            )
          })}
        </div>

        {!activeGroup.required && activeValues.length ? (
          <button
            type="button"
            className="weekly-plan-clear"
            onClick={() => activeValues.forEach((value) => onSelectOption(activeGroup, value))}
          >
            Quitar el {activeEntry.weekday.label.toLowerCase()}
          </button>
        ) : null}
      </div>

      <div className="weekly-plan-summary">
        <div className="weekly-plan-summary-head">
          <h3>Tu semana</h3>
          <div className="weekly-plan-quantity">
            <button
              type="button"
              onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
              aria-label="Menos packs"
            >
              <IconMinus />
            </button>
            <span>{quantity}</span>
            <button type="button" onClick={() => onQuantityChange(quantity + 1)} aria-label="Mas packs">
              <IconPlus />
            </button>
          </div>
        </div>

        <ul>
          {days.map((entry, index) => {
            const elegidas = getDaySelectedOptions(entry.group, selections)
            const extraDelDia = elegidas.reduce((total, option) => total + Number(option.price || 0), 0)

            return (
              <li key={entry.group.id} className={elegidas.length ? 'filled' : ''}>
                <button
                  type="button"
                  onClick={() => {
                    setActiveIndex(index)
                    setActiveTag('')
                  }}
                >
                  <span className="weekly-plan-summary-day">{entry.weekday.label}</span>
                  <span className="weekly-plan-summary-dish">
                    {elegidas.length
                      ? elegidas.map((option) => option.label).join(' + ')
                      : entry.group.required
                        ? 'Sin elegir'
                        : 'Sin vianda'}
                  </span>
                  {extraDelDia > 0 ? (
                    <span className="weekly-plan-summary-price">
                      +{formatPrice(extraDelDia, currencySymbol)}
                    </span>
                  ) : null}
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      <footer className="weekly-plan-footer">
        <div className="weekly-plan-total">
          <span>Total</span>
          <strong>{formatPrice((basePrice + extraTotal) * quantity, currencySymbol)}</strong>
        </div>
        <button type="button" className="weekly-plan-add" disabled={addDisabled} onClick={onAdd}>
          {addLabel}
        </button>
      </footer>
    </section>
  )
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
      if (isGroupMultiple(group)) {
        return [group.id, []]
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
  if (String(phone ?? '').startsWith('menu-sin-telefono-')) {
    return 'WhatsApp del chat'
  }

  const digits = String(phone ?? '').replace(/\D/g, '')
  return digits ? `+${digits}` : ''
}

function getFavoriteProductFromOrders(orders) {
  const productTotals = new Map()

  orders.forEach((order) => {
    const items = Array.isArray(order.items) ? order.items : []

    items.forEach((item) => {
      const name = String(item.name ?? '').trim()

      if (!name) return

      const key = name.toLowerCase()
      const current = productTotals.get(key) ?? { name, quantity: 0 }
      productTotals.set(key, {
        name: current.name,
        quantity: current.quantity + Math.max(1, Number(item.quantity ?? 1)),
      })
    })
  })

  return [...productTotals.values()].sort((first, second) => second.quantity - first.quantity)[0] ?? null
}

function openWhatsappOrderChat(url, targetWindow) {
  if (!url) {
    if (targetWindow && !targetWindow.closed) {
      targetWindow.close()
    }

    return
  }

  if (targetWindow && !targetWindow.closed) {
    targetWindow.location.href = url
    targetWindow.focus()
    return
  }

  const opened = window.open(url, '_blank', 'noopener,noreferrer')

  if (!opened) {
    window.location.href = url
  }
}

const socialLinkDefinitions = [
  { key: 'instagram', label: 'Instagram', icon: IconInstagram },
  { key: 'facebook', label: 'Facebook', icon: IconFacebook },
  { key: 'tiktok', label: 'TikTok', icon: IconTiktok },
  { key: 'whatsapp', label: 'WhatsApp', icon: IconWhatsapp },
  { key: 'website', label: 'Web', icon: IconWebsite },
]

function normalizeSocialUsername(value) {
  return String(value ?? '')
    .trim()
    .replace(/^@+/, '')
    .replace(/^\/+|\/+$/g, '')
}

function normalizeSocialUrl(key, value) {
  const raw = String(value ?? '').trim()
  if (!raw) return ''
  if (/^https?:\/\//i.test(raw)) return raw

  if (key === 'instagram') {
    const username = normalizeSocialUsername(raw)
    return username ? `https://instagram.com/${encodeURIComponent(username)}` : ''
  }

  if (key === 'tiktok') {
    const username = normalizeSocialUsername(raw)
    return username ? `https://www.tiktok.com/@${encodeURIComponent(username)}` : ''
  }

  if (key === 'facebook') {
    const username = normalizeSocialUsername(raw)
    return username ? `https://facebook.com/${encodeURIComponent(username)}` : ''
  }

  if (key === 'whatsapp') {
    const digits = raw.replace(/\D/g, '')
    return digits ? `https://wa.me/${digits}` : ''
  }

  if (key === 'website') {
    return `https://${raw.replace(/^\/+/, '')}`
  }

  return ''
}

function getMenuSocialLinks(presentation) {
  const rawLinks = presentation?.theme?.socialLinks
  const links = rawLinks && typeof rawLinks === 'object' && !Array.isArray(rawLinks) ? rawLinks : {}

  return socialLinkDefinitions
    .map((definition) => {
      const href = normalizeSocialUrl(definition.key, links[definition.key])
      return href ? { ...definition, href } : null
    })
    .filter(Boolean)
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

function findPairingProduct(allItems, cartItems, matchers) {
  const cartIds = new Set(cartItems.map((item) => item.id))

  return allItems.find((item) => {
    if (cartIds.has(item.id)) return false

    const text = slugify(`${item.categoryLabel ?? ''} ${item.name ?? ''} ${item.description ?? ''}`)
    return matchers.some((matcher) => text.includes(matcher))
  })
}

function buildCartPairingSuggestions(cartItems, allItems) {
  const text = cartItems
    .map((item) => `${item.categoryLabel ?? ''} ${item.name ?? ''} ${item.notes ?? ''}`.toLowerCase())
    .join(' ')

  const suggestions = []

  if (/(carne|bife|filete|lomo|burger|hamburguesa|milanesa|pollo)/.test(text)) {
    suggestions.push(
      { label: 'Papas rostizadas', matchers: ['papa', 'papas', 'frita', 'fries'] },
      { label: 'Ensalada fresca', matchers: ['ensalada'] },
      { label: 'Gaseosa fria', matchers: ['gaseosa', 'coca', 'sprite', 'fanta', 'bebida', 'agua'] },
    )
  }

  if (/pizza/.test(text)) {
    suggestions.push(
      { label: 'Faina crocante', matchers: ['faina'] },
      { label: 'Dip picante', matchers: ['dip', 'salsa'] },
      { label: 'Limonada de la casa', matchers: ['limonada', 'bebida'] },
    )
  }

  if (/(pasta|raviol|sorrentino|fideo|ñoqui|noqui)/.test(text)) {
    suggestions.push(
      { label: 'Queso extra', matchers: ['queso'] },
      { label: 'Pan de ajo', matchers: ['pan-de-ajo', 'ajo'] },
      { label: 'Tonica botanica', matchers: ['tonica', 'bebida', 'agua'] },
    )
  }

  if (/(postre|torta|helado|brownie|flan)/.test(text)) {
    suggestions.push(
      { label: 'Cafe espresso', matchers: ['cafe'] },
      { label: 'Agua con gas', matchers: ['agua-con-gas', 'agua'] },
    )
  }

  if (!suggestions.length) {
    suggestions.push(
      { label: 'Bebida fresca', matchers: ['bebida', 'gaseosa', 'coca', 'sprite', 'agua'] },
      { label: 'Postre del dia', matchers: ['postre', 'torta', 'helado', 'brownie', 'flan'] },
      { label: 'Extra de salsa', matchers: ['salsa', 'dip'] },
    )
  }

  const uniqueProducts = new Map()

  suggestions.forEach((suggestion) => {
    const product = findPairingProduct(allItems, cartItems, suggestion.matchers)
    if (product && !uniqueProducts.has(product.id)) {
      uniqueProducts.set(product.id, { label: suggestion.label, product })
    }
  })

  return [...uniqueProducts.values()].slice(0, 4)
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
  if (isPromoCategoryLabel(label)) return 'Promos'
  if (key.includes('bebida')) return 'Bebidas'
  if (key.includes('postre')) return 'Postres'
  return label
}

function shouldShowPizzeriaCategory(category) {
  const key = slugify(category.label)
  return !key.includes('hamburgues') && !key.includes('burger')
}

function getPizzeriaOrderedCategories(categories) {
  const order = ['pizza', 'empanada', 'promo', 'oferta', 'descuento', 'bebida', 'postre']

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
  if (isPromoCategoryLabel(label)) return 'Promos'
  if (key.includes('combo')) return 'Combos'
  if (key.includes('entrada') || key.includes('papa')) return 'Entradas'
  if (key.includes('bebida')) return 'Bebidas'
  if (key.includes('postre')) return 'Postres'
  return label
}

// getBurgerCategoryLabel simplifica nombres largos ("Bebida con alcohol" ->
// "Bebidas") pensado para cartas chicas de hamburgueseria. En una carta mas
// amplia (pizzeria, bar) dos categorias reales distintas pueden colapsar al
// mismo texto simplificado ("Bebidas" y "Bebidas con alcohol" -> ambas
// "Bebidas"), dejando dos chips identicos e indistinguibles. Si el nombre
// simplificado de una categoria coincide con el de otra categoria real de la
// misma cuenta, se muestra el nombre real en vez del simplificado.
function getBurgerCategoryChipLabel(category, allCategories) {
  const simplified = getBurgerCategoryLabel(category.label)
  const collides = allCategories.some(
    (other) => other.id !== category.id && getBurgerCategoryLabel(other.label) === simplified,
  )

  return collides ? category.label : simplified
}

function getBurgerCategoryIcon(label) {
  const key = slugify(label)
  if (key.includes('hamburgues') || key.includes('burger')) return IconBurger
  if (isPromoCategoryLabel(label)) return IconTicket
  if (key.includes('combo')) return IconBurger
  if (key.includes('entrada') || key.includes('papa')) return IconFries
  if (key.includes('bebida')) return IconDrink
  if (key.includes('postre')) return IconDessert
  return IconServe
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
  if (isPromoCategoryLabel(label)) return 'Promos'
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
  if (isPromoCategoryLabel(label)) return HostIconFlame
  if (key.includes('combo')) return HostIconFlame
  if (key.includes('pollo')) return HostIconDrumstick
  if (key.includes('hamburgues') || key.includes('burger')) return HostIconBurger
  if (key.includes('guarnicion') || key.includes('papa') || key.includes('acompa')) return HostIconFries
  if (key.includes('bebida')) return HostIconDrink
  if (key.includes('extra') || key.includes('salsa')) return HostIconPlusCircle
  return HostIconCloche
}

function getHostOrderedCategories(categories) {
  const order = ['promo', 'oferta', 'descuento', 'combo', 'pollo', 'hamburgues', 'burger', 'guarnicion', 'papa', 'bebida', 'extra', 'salsa']

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
  if (isPromoCategoryLabel(label)) return 'Promos especiales para aprovechar hoy'
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

function getSaborPampaCategoryMeta(label) {
  const key = slugify(label)

  if (isPromoCategoryLabel(label)) {
    return { label: 'Promos', icon: IconSpark, tone: 'promo' }
  }

  if (key.includes('sugerencia') || key.includes('chef')) {
    return { label, icon: IconChefHat, tone: 'chef' }
  }

  if (key.includes('sandwich')) {
    return { label, icon: IconKikaSandwich, tone: 'sandwich' }
  }

  if (key.includes('para-pedir') || key.includes('pedido') || key.includes('combo')) {
    return { label: 'Para pedir', icon: IconCart, tone: 'pedido' }
  }

  if (key.includes('hamburgues') || key.includes('burger')) {
    return { label, icon: IconBurger, tone: 'burger' }
  }

  if (key.includes('empanada')) {
    return { label, icon: IconEmpanada, tone: 'empanada' }
  }

  if (key.includes('milanesa')) {
    return { label, icon: IconMilanesa, tone: 'milanesa' }
  }

  if (key.includes('suprema')) {
    return { label, icon: IconDrumstick, tone: 'pollo' }
  }

  if (key.includes('carne')) {
    return { label, icon: IconSteak, tone: 'carne' }
  }

  if (key.includes('pollo')) {
    return { label, icon: IconDrumstick, tone: 'pollo' }
  }

  if (key.includes('pasta')) {
    return { label, icon: IconPasta, tone: 'pasta' }
  }

  if (key.includes('pizza') || key.includes('fugazzeta') || key.includes('fugazza')) {
    return { label, icon: IconPizzaOutline, tone: 'pizza' }
  }

  if (key.includes('calzon')) {
    return { label, icon: IconEmpanada, tone: 'empanada' }
  }

  if (key.includes('helado')) {
    return { label, icon: IconDessert, tone: 'helado' }
  }

  if (key.includes('tarta')) {
    return { label, icon: IconTart, tone: 'tarta' }
  }

  if (key.includes('tortilla') || key.includes('omelette')) {
    return { label, icon: IconOmelette, tone: 'omelette' }
  }

  if (key.includes('ensalada')) {
    return { label, icon: IconKikaSalad, tone: 'ensalada' }
  }

  if (key.includes('guarnicion') || key.includes('acompan')) {
    return { label, icon: IconSideDish, tone: 'guarnicion' }
  }

  if (key.includes('papa')) {
    return { label, icon: IconFries, tone: 'papa' }
  }

  if (key.includes('salsa')) {
    return { label, icon: IconSauce, tone: 'salsa' }
  }

  if (key.includes('postre') || key.includes('dulce')) {
    return { label, icon: IconKikaCake, tone: 'postre' }
  }

  if (key.includes('bebida')) {
    return { label, icon: HostIconDrink, tone: 'bebida' }
  }

  if (key.includes('verdura') || key.includes('vegetal')) {
    return { label, icon: IconKikaLeaf, tone: 'verdura' }
  }

  return { label, icon: IconServe, tone: 'default' }
}

function getSaborPampaSectionSubtitle(label) {
  const key = slugify(label)

  if (isPromoCategoryLabel(label)) return 'Opciones destacadas para pedir hoy.'
  if (key.includes('empanada')) return 'Masa casera, rellenos abundantes y mucho sabor.'
  if (key.includes('sandwich')) return 'Pan fresco, sabores caseros y combinaciones generosas.'
  if (key.includes('burger') || key.includes('hamburgues')) return 'Burgers con identidad de casa.'
  if (key.includes('ensalada')) return 'Frescas, completas y listas para acompañar.'
  return 'Platos caseros preparados para volver.'
}

function shouldShowSaborPampaBulkActions(item) {
  const key = slugify(`${item?.categoryLabel ?? ''} ${item?.name ?? ''}`)

  return key.includes('empanada') || (key.includes('sandwich') && key.includes('miga'))
}

function getSaborPampaBadgeText(item, index, categoryLabel) {
  const itemKey = slugify(item?.name ?? '')
  const categoryKey = slugify(categoryLabel ?? '')

  if (isDailyMenuCategoryLabel(categoryLabel)) return categoryLabel
  if (isDailyMenuItem({ ...item, categoryLabel })) return 'Menu del dia'
  if (isPromoCategoryLabel(categoryLabel) || itemKey.includes('promo')) return 'Promo'
  if (index === 0) return 'Recomendado'
  if (itemKey.includes('combo')) return 'Combo'
  if (categoryKey.includes('empanada')) return 'Casero'
  return ''
}

function isDarkSolidColor(value) {
  const raw = String(value ?? '').trim()
  const match = raw.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)

  if (!match) {
    return false
  }

  const hex = match[1].length === 3
    ? match[1].split('').map((digit) => digit + digit).join('')
    : match[1]
  const red = Number.parseInt(hex.slice(0, 2), 16)
  const green = Number.parseInt(hex.slice(2, 4), 16)
  const blue = Number.parseInt(hex.slice(4, 6), 16)
  const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255

  return luminance < 0.18
}

function isHostLikeAccount(accountId, templateId) {
  const accountKey = slugify(accountId ?? '')
  return templateId === 'host' || accountKey === 'host' || accountKey.startsWith('host-')
}

function getThemeBackground(theme, templateId, accountId) {
  if (isHostLikeAccount(accountId, templateId) && isDarkSolidColor(theme.background)) {
    return '#000000'
  }

  return theme.background
}

function getMenuPageBackground(theme, templateId, accountId) {
  if (theme.pageBackground) {
    return isHostLikeAccount(accountId, templateId) && isDarkSolidColor(theme.pageBackground)
      ? '#000000'
      : theme.pageBackground
  }

  const background = getThemeBackground(theme, templateId, accountId)

  if (isDarkSolidColor(background)) {
    return background
  }

  return `linear-gradient(180deg, ${theme.surfaceAlt} 0%, ${background} 100%)`
}

function getPresentationStyles(presentation, accountId) {
  const theme = presentation.theme
  const templateId = presentation.template ?? presentation.layout
  const forceHostBlack = isHostLikeAccount(accountId, templateId)
  const contentBackground =
    forceHostBlack && isDarkSolidColor(theme.contentBackground)
      ? '#000000'
      : theme.contentBackground

  return {
    '--menu-page-background': getMenuPageBackground(theme, templateId, accountId),
    '--theme-bg': getThemeBackground(theme, templateId, accountId),
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
    '--custom-content-background': contentBackground || undefined,
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
    item.video && presentation.preview?.productMedia !== 'image-only',
  )
}

function shouldAutoplayVideoPreview(presentation) {
  return presentation.preview?.productMedia !== 'image-only'
}

function shouldForceVideoPreviewForBurgerHost(accountId, templateId, categories = []) {
  return shouldUseHostCategorySet(accountId, templateId, categories)
}

function HeroImageSlider({ images, video, imageClassName, alt, placeholderClassName, usePoster = true }) {
  const safeImages = normalizeImageList(images)
  const safeVideo = String(video ?? '').trim()
  const [activeIndex, setActiveIndex] = useState(0)
  const visibleIndex = safeImages.length ? activeIndex % safeImages.length : 0

  useEffect(() => {
    if (safeVideo || safeImages.length <= 1) return undefined

    const intervalId = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % safeImages.length)
    }, 4500)

    return () => window.clearInterval(intervalId)
  }, [safeImages.length, safeVideo])

  if (safeVideo) {
    return (
      <div className="hero-image-slider hero-video-shell" data-video="true">
        <video
          className={`${imageClassName} hero-slider-video is-active`}
          src={getVideoFrameSrc(safeVideo)}
          poster={usePoster ? safeImages[0] : undefined}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-label={alt}
        />
      </div>
    )
  }

  if (!safeImages.length) {
    return placeholderClassName ? <div className={placeholderClassName} aria-hidden="true" /> : null
  }

  return (
    <div className="hero-image-slider" data-slider={safeImages.length > 1 ? 'true' : 'false'}>
      {safeImages.map((image, index) => (
        <img
          key={image}
          className={`${imageClassName} hero-slider-image ${index === visibleIndex ? 'is-active' : ''}`}
          src={image}
          alt={alt}
        />
      ))}
      {safeImages.length > 1 ? (
        <div className="hero-slider-dots" aria-hidden="true">
          {safeImages.map((image, index) => (
            <span key={image} className={index === visibleIndex ? 'is-active' : ''} />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function HeaderVideo({ src, className = '', poster, label }) {
  const safeSrc = String(src ?? '').trim()

  if (!safeSrc) {
    return null
  }

  return (
    <video
      className={className}
      src={getVideoFrameSrc(safeSrc)}
      poster={poster}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      aria-label={label}
    />
  )
}

function hasProductMedia(item) {
  return Boolean(item?.video || item?.hasCustomImage)
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

function getImageAnimationClass(item) {
  const animation = String(item?.imageAnimation ?? '').trim()

  if (!['zoom-loop', 'spin-loop', 'float-loop'].includes(animation)) {
    return ''
  }

  return `product-image-animation product-image-animation-${animation}`
}

function TemplateHero({ templateId, presentation, heroDish, onCommunityAction }) {
  const standaloneHeroImages = getHeroImages(presentation)
  const hasStandaloneHeroImage = standaloneHeroImages.length > 0
  const heroVideo = getHeroVideo(presentation)
  const hasStandaloneHeroMedia = hasStandaloneHeroImage || Boolean(heroVideo)
  const isDailyHero = isDailyMenuItem(heroDish)

  if (
    templateId !== 'almendra' &&
    templateId !== 'florian' &&
    templateId !== 'sabor-pampa' &&
    !heroDish &&
    !hasStandaloneHeroMedia
  ) {
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
        <HeroImageSlider
          images={getHeroImages(presentation, '/pizzeria/header.png')}
          video={heroVideo}
          imageClassName="pizzeria-header-image"
          alt="La Buona Pizzeria. Nuestro menu. Sabor que te hace volver."
        />
      </section>
    )
  }

  if (templateId === 'burger') {
    return (
      <section className="hero-content hero-content-burger">
        <HeroImageSlider
          images={getBurgerHeroImages(presentation, heroDish?.image ?? '/dishes/hero-clean-cut.png')}
          video={heroVideo}
          imageClassName="burger-header-image"
          alt="Grill House Burger Co. Hechas para gustar."
        />
      </section>
    )
  }

  if (templateId === 'host') {
    const heroImages = getHeroImages(
      presentation,
      getHostHeroArtImage(presentation, heroDish) || undefined,
    )

    return (
      <section className="hero-content hero-content-host">
        <HeroImageSlider
          images={heroImages}
          video={heroVideo}
          imageClassName="host-header-image"
          alt={presentation.branding?.wordmark ?? heroDish?.name ?? 'Host'}
          placeholderClassName="host-hero-placeholder"
        />
      </section>
    )
  }

  if (templateId === 'blue-burger') {
    return (
      <section className="hero-content hero-content-blue-burger">
        <HeroImageSlider
          images={getBurgerHeroImages(presentation, heroDish?.image ?? '/dishes/hero-clean-cut.png')}
          video={heroVideo}
          imageClassName="blue-burger-header-image"
          alt={`${presentation.branding?.wordmark ?? 'JBurger'} menu`}
        />
      </section>
    )
  }

  if (templateId === 'kika') {
    const hasKikaHeroVideo = Boolean(heroVideo)

    return (
      <section className={`hero-content hero-content-kika ${hasKikaHeroVideo ? 'has-video' : ''}`}>
        <HeroImageSlider
          images={getHeroImages(presentation, '/kika/header.png')}
          video={heroVideo}
          imageClassName="kika-header-image"
          alt="Kika Cafe. Tu nuevo lugar favorito."
          usePoster={!hasKikaHeroVideo}
        />
        {hasKikaHeroVideo ? (
          <>
            <img className="kika-hero-bottom-asset" src="/kika/asset.png" alt="" aria-hidden="true" />
            <KikaHeroOverlay />
          </>
        ) : null}
      </section>
    )
  }

  if (templateId === 'almendra') {
    const almendraHeroTitle =
      presentation.hero?.title === 'DISFRUTA' ? 'DISFRUTÁ' : presentation.hero?.title ?? 'DISFRUTÁ'

    return (
      <section className="hero-content hero-content-almendra">
        <div className="almendra-brand-lockup">
          <img src={presentation.theme?.logoImage || '/almendra/logo.png'} alt={presentation.branding?.wordmark ?? 'Almendra'} />
        </div>

        <div className="almendra-hero-media" aria-hidden={!hasStandaloneHeroMedia}>
          <HeroImageSlider
            images={standaloneHeroImages}
            video={heroVideo}
            imageClassName="almendra-header-image"
            alt="Almendra cafe de especialidad. Header preparado para imagen o video."
            placeholderClassName="almendra-hero-placeholder"
            usePoster={false}
          />
        </div>

        <div className="almendra-hero-copy">
          <h1>
            <span>{almendraHeroTitle}</span>
            <span>{presentation.hero?.accent ?? 'LO SIMPLE,'}</span>
            <span>{presentation.hero?.description ?? 'LO ESENCIAL.'}</span>
          </h1>
          <i aria-hidden="true" />
          <p>Café de especialidad, hecho con dedicación.</p>
        </div>

        <button
          type="button"
          className="almendra-community-card"
          onClick={onCommunityAction}
          aria-label="Sumarte a la comunidad Almendra"
        >
          <img src="/almendra/puntos.png" alt="Sumate a nuestra comunidad Almendra y acumulá puntos." />
        </button>
      </section>
    )
  }

  if (templateId === 'florian') {
    const florianHeroImages = getHeroImages(presentation)
    const hasFlorianHeroMedia = heroVideo || florianHeroImages.length > 0

    return (
      <section className={`hero-content hero-content-florian ${hasFlorianHeroMedia ? 'has-media' : 'no-media'}`}>
        {hasFlorianHeroMedia ? (
          <div className="florian-hero-media" aria-hidden="true">
            <HeroImageSlider
              images={florianHeroImages}
              video={heroVideo}
              imageClassName="florian-header-image"
              alt="Florian cafe de especialidad."
              usePoster={false}
            />
          </div>
        ) : (
          <FlorianHeroFallback />
        )}

        <div className="florian-hero-brand">
          <strong>FLORIAN</strong>
          <span>CAFE DE ESPECIALIDAD</span>
        </div>

        <span className="florian-location-pill">
          <IconKikaPin />
          Gral. Frias 1
        </span>

        <div className="florian-hero-copy">
          <h1>
            <span>{presentation.hero?.title ?? 'BUEN CAFE,'}</span>
            <strong>{presentation.hero?.accent ?? 'BUENOS MOMENTOS.'}</strong>
          </h1>
          <span className="florian-bean-divider" aria-hidden="true" />
          <p>
            {presentation.hero?.description ??
              'Cafe de especialidad y cocina simple, hecha con pasion en Chivilcoy.'}
          </p>
          <button type="button" className="florian-location-button">
            <IconKikaPin />
            Ver ubicacion
          </button>
        </div>
      </section>
    )
  }

  if (templateId === 'sabor-pampa') {
    const features = [
      { icon: IconServe, title: 'Pedi facil', text: 'y rapido' },
      { icon: IconCart, title: 'Elaboracion', text: 'diaria' },
      { icon: IconLeafMark, title: 'Ingredientes', text: 'seleccionados' },
      { icon: IconHeart, title: 'Hecho', text: 'con amor' },
    ]

    return (
      <section className="hero-content hero-content-sabor-pampa">
        <div className="pampa-hero-media" aria-hidden="true">
          <HeroImageSlider
            images={standaloneHeroImages}
            video={heroVideo}
            imageClassName="pampa-header-media"
            alt="Sabor a Pampa. Header preparado para imagen o video."
            placeholderClassName="pampa-hero-placeholder"
            usePoster={false}
          />
        </div>

        <div className="pampa-brand-lockup">
          <img
            src={presentation.theme?.logoImage || '/sabor-a-pampa/logo.png'}
            alt={presentation.branding?.wordmark ?? 'Sabor a Pampa'}
          />
        </div>

        <div className="pampa-hero-copy">
          <h1>{presentation.hero?.title ?? 'CASERO, GOURMET'}</h1>
          <p className="pampa-hero-script">{presentation.hero?.accent ?? 'y hecho con amor'}</p>
          <p>{presentation.hero?.description ?? 'Platos que reconfortan, sabores que te hacen volver.'}</p>
        </div>

        <div className="pampa-feature-strip" aria-label="Beneficios Sabor a Pampa">
          {features.map((feature) => {
            const FeatureIcon = feature.icon

            return (
              <span key={feature.title}>
                <FeatureIcon />
                <strong>{feature.title}</strong>
                <small>{feature.text}</small>
              </span>
            )
          })}
        </div>
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
          <span className="hero-kicker">{isDailyHero ? 'MENU DEL DIA' : 'MENU DESTACADO'}</span>
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
          {heroVideo ? (
            <HeaderVideo
              src={heroVideo}
              poster={getHeroImage(presentation, heroDish)}
              label={heroDish?.name ?? presentation.branding?.wordmark ?? 'Header'}
            />
          ) : (
            <img src={getHeroImage(presentation, heroDish)} alt={heroDish?.name ?? 'Header'} />
          )}
          <div className="hero-bistro-caption">
            <strong>{heroDish?.name ?? presentation.branding?.wordmark ?? (isDailyHero ? 'Menu del dia' : 'Menu destacado')}</strong>
            <span>{heroDish?.price ?? ''}</span>
          </div>
        </div>
      </section>
    )
  }

  if (templateId === 'luxe') {
    return (
      <section className="hero-content hero-content-luxe">
        <div className="hero-luxe-media">
          {heroVideo ? (
            <HeaderVideo
              src={heroVideo}
              poster={getHeroImage(presentation, heroDish)}
              label={heroDish?.name ?? presentation.branding?.wordmark ?? 'Header'}
            />
          ) : (
            <img src={getHeroImage(presentation, heroDish)} alt={heroDish?.name ?? 'Header'} />
          )}
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
        {heroVideo ? (
          <HeaderVideo
            src={heroVideo}
            poster={getHeroImage(presentation, heroDish)}
            label={heroDish?.name ?? presentation.branding?.wordmark ?? 'Header'}
          />
        ) : (
          <img src={getHeroImage(presentation, heroDish)} alt={heroDish?.name ?? 'Header'} />
        )}
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
    kika: {
      title: 'KIKA',
      subtitle: 'cafe',
      icon: <IconKikaCup />,
      kicker: 'Café y pastelería',
      headline: 'Preparando tu momento',
      message: 'Estamos sirviendo café, pastelería y panadería para que elijas tranquilo.',
      chips: ['Cafetería', 'Pastelería', 'Panadería'],
      section: 'KIKA CAFE',
    },
    florian: {
      title: 'FLORIAN',
      subtitle: 'cafe de especialidad',
      icon: <IconKikaCup />,
      kicker: 'Cafe de especialidad',
      headline: 'Preparando buen cafe',
      message: 'Estamos cargando cafes, frios, desayunos y dulces para pedir sin vueltas.',
      chips: ['Cafes', 'Frios', 'Dulces'],
      section: 'CAFES CLASICOS',
    },
    'sabor-pampa': {
      title: 'Sabor a Pampa',
      subtitle: 'cocina casera',
      icon: <IconEmpanada />,
      kicker: 'Cocina casera',
      headline: 'Preparando el menu',
      message: 'Estamos cargando categorias, destacados y pedidos con el sabor de la casa.',
      chips: ['Promos', 'Empanadas', 'Burgers'],
      section: 'NUESTRO MENU',
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
      title: 'capta',
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
            <div className="host-loading-brand">
              <img src="/assets/host-logo-transparent.png" alt="HOST" />
            </div>
            <div className="host-loading-ring" aria-hidden="true">
              <span className="host-loading-ring-orbit" />
              <span className="host-loading-spinner">
                <span className="host-loading-spinner-core">
                  <IconFlame />
                </span>
              </span>
            </div>
            <div className="host-loading-copy">
              <strong>Cargando menú</strong>
            </div>
            <div className="host-loading-progress" aria-hidden="true">
              <span />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loadingTemplate === 'kika') {
    return (
      <div className="app-shell">
        <div className="phone-surface menu-loading-screen loading-kika-simple">
          <div className="kika-loading-simple" role="status" aria-live="polite" aria-label="Cargando menu de Kika">
            <div className="kika-loading-brand">
              <strong>KIKA</strong>
              <span>cafe</span>
            </div>

            <div className="kika-loading-cup" aria-hidden="true">
              <span className="kika-loading-steam steam-one" />
              <span className="kika-loading-steam steam-two" />
              <span className="kika-loading-steam steam-three" />
              <IconKikaCup />
            </div>

            <p>Cargando menú</p>

            <div className="kika-loading-progress" aria-hidden="true">
              <span />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loadingTemplate === 'almendra') {
    return (
      <div className="app-shell">
        <div className="phone-surface menu-loading-screen loading-almendra-simple">
          <div className="almendra-loading-simple" role="status" aria-live="polite" aria-label="Cargando menu de Almendra">
            <div className="almendra-loading-brand">
              <img src="/almendra/logo.png" alt="Almendra" />
            </div>

            <p>Cargando menu</p>

            <div className="almendra-loading-progress" aria-hidden="true">
              <span />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loadingTemplate === 'sabor-pampa') {
    return (
      <div className="app-shell">
        <div className="phone-surface menu-loading-screen loading-sabor-pampa-simple">
          <div className="pampa-loading-simple" role="status" aria-live="polite" aria-label="Cargando menu de Sabor a Pampa">
            <div className="pampa-loading-brand">
              <strong>sabor a pampa</strong>
            </div>

            <div className="pampa-loading-plate" aria-hidden="true">
              <span className="pampa-loading-glow" />
              <span className="pampa-loading-icon">
                <IconEmpanada />
              </span>
            </div>

            <div className="pampa-loading-progress" aria-hidden="true">
              <span />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loadingTemplate === 'toto') {
    return (
      <div className="app-shell">
        <div className="phone-surface menu-loading-screen loading-toto-simple">
          <div className="toto-loading-simple" role="status" aria-live="polite" aria-label="Cargando menu de Lo de Toto">
            <div className="toto-loading-brand">
              <strong>lo de toto</strong>
              <span>pizza bar</span>
            </div>

            <div className="toto-loading-oven" aria-hidden="true">
              <span className="toto-loading-ember" />
              <span className="toto-loading-icon">
                <IconFlame />
              </span>
            </div>

            <div className="toto-loading-progress" aria-hidden="true">
              <span />
            </div>
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

function SocialMenuDrawer({ open, links, accountName, onClose }) {
  if (!open) return null

  return (
    <div className="social-menu-overlay" role="presentation" onClick={onClose}>
      <aside
        className="social-menu-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Redes del negocio"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="social-menu-handle" aria-hidden="true" />
        <div className="social-menu-heading">
          <span>Redes</span>
          <h2>{accountName || 'Menu digital'}</h2>
          <p>Conecta con el negocio desde sus canales oficiales.</p>
        </div>

        <div className="social-menu-links">
          {links.length ? (
            links.map((link) => {
              const LinkIcon = link.icon

              return (
                <a key={link.key} href={link.href} target="_blank" rel="noopener noreferrer">
                  <span className="social-menu-link-icon">
                    <LinkIcon />
                  </span>
                  <span>{link.label}</span>
                  <IconExternalLink />
                </a>
              )
            })
          ) : (
            <p className="social-menu-empty">Este negocio todavia no cargo sus redes.</p>
          )}
        </div>

        <button type="button" className="social-menu-close" onClick={onClose}>
          Volver al menu
        </button>
      </aside>
    </div>
  )
}

function InstallAppPrompt({
  open,
  accountName,
  loyaltyEnabled,
  platform,
  canInstall,
  showSteps,
  style,
  onInstall,
  onClose,
}) {
  if (!open) return null

  const isIos = platform === 'ios'
  const benefits = loyaltyEnabled
    ? ['Menu siempre a mano', 'Pedidos mas rapidos', 'Tus puntos y canjes en un toque']
    : ['Menu siempre a mano', 'Pedidos mas rapidos', 'Acceso directo desde el celular']
  const buttonLabel = canInstall ? 'Instalar app' : isIos ? 'Ver como instalar' : 'Como instalar'

  return (
    <div className="install-app-overlay" role="presentation" style={style} onClick={onClose}>
      <section
        className="install-app-card"
        role="dialog"
        aria-modal="true"
        aria-label={`Instalar app de ${accountName || 'este negocio'}`}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="install-app-close"
          aria-label="Cerrar aviso de instalacion"
          onClick={onClose}
        >
          x
        </button>

        <div className="install-app-hero">
          <span className="install-app-icon" aria-hidden="true">
            <IconCart />
          </span>
          <div>
            <span>App del local</span>
            <h2>Instala {accountName || 'este menu'} en tu celular</h2>
            <p>
              Entra directo al menu, arma pedidos mas rapido
              {loyaltyEnabled ? ' y consulta tus puntos sin buscar el link.' : ' sin buscar el link.'}
            </p>
          </div>
        </div>

        <div className="install-app-benefits">
          {benefits.map((benefit) => (
            <span key={benefit}>{benefit}</span>
          ))}
        </div>

        {showSteps ? (
          <div className="install-app-steps">
            {isIos ? (
              <>
                <p>En iPhone se instala desde Safari:</p>
                <ol>
                  <li>Toca el boton compartir.</li>
                  <li>Elegí "Agregar a pantalla de inicio".</li>
                  <li>Confirmá con "Agregar".</li>
                </ol>
              </>
            ) : (
              <>
                <p>Si no aparece el instalador automatico:</p>
                <ol>
                  <li>Abrí el menu del navegador.</li>
                  <li>Elegí "Instalar app" o "Agregar a pantalla principal".</li>
                  <li>Confirmá la instalación.</li>
                </ol>
              </>
            )}
          </div>
        ) : null}

        <div className="install-app-actions">
          <button type="button" className="install-app-primary" onClick={onInstall}>
            <IconPlus />
            <span>{buttonLabel}</span>
          </button>
          <button type="button" className="install-app-secondary" onClick={onClose}>
            Ahora no
          </button>
        </div>
      </section>
    </div>
  )
}

function TemplateCategorySelector({
  accountId,
  templateId,
  categories,
  currentCategory,
  onSelectCategory,
  searchQuery = '',
  onSearchQueryChange,
  isSearchOpen = false,
  onOpenSearch,
  onCloseSearch,
}) {
  if (templateId === 'gelato') {
    return null
  }

  if (templateId === 'burger') {
    const useHostCategorySet = shouldUseHostCategorySet(accountId, templateId, categories)
    // El orden ya viene resuelto del backend (menuCategories del dashboard,
    // o category.asc por defecto): antes se pisaba con un heuristico fijo
    // (hamburguesa/combo/entrada/bebida/postre primero) que no dejaba
    // ordenar la carta a mano para cuentas con un menu mas amplio.
    const orderedCategories = useHostCategorySet ? getHostOrderedCategories(categories) : categories

    return (
      <div className="burger-menu-head">
        <div className="burger-menu-title-row">
          <h2>NUESTRO MENU</h2>
          {isSearchOpen || searchQuery ? (
            <form
              className="burger-search-form"
              role="search"
              onSubmit={(event) => event.preventDefault()}
            >
              <IconSearch />
              <input
                value={searchQuery}
                onChange={(event) => onSearchQueryChange?.(event.target.value)}
                placeholder="Buscar productos..."
                aria-label="Buscar productos"
                autoFocus
              />
              <button
                type="button"
                className="burger-search-clear"
                aria-label="Cerrar busqueda"
                onClick={() => {
                  onSearchQueryChange?.('')
                  onCloseSearch?.()
                }}
              >
                x
              </button>
            </form>
          ) : (
            <button
              type="button"
              className="burger-search-button"
              aria-label="Buscar"
              onClick={onOpenSearch}
            >
              <IconSearch />
            </button>
          )}
        </div>

        <div className="burger-category-row">
          {orderedCategories.filter((category) => !category?.hiddenFromBar).map((category) => {
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
                    : getBurgerCategoryChipLabel(category, orderedCategories)}
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
          {orderedCategories.filter((category) => !category?.hiddenFromBar).map((category) => {
            const Icon = getHostCategoryIcon(category.label)
            const isActive = category.id === currentCategory?.id

            return (
              <button
                key={category.id}
                type="button"
                className={`host-category-pill ${isActive ? 'active' : ''}`}
                onClick={() => onSelectCategory(isActive ? '' : category.id)}
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

  if (templateId === 'kika') {
    return (
      <div className="kika-category-row" aria-label="Categorias de Kika">
        {getKikaPrimaryCategories(categories).filter((category) => !category?.hiddenFromBar).map((category) => {
          const meta = getKikaCategoryMeta(category.label)
          const Icon = meta.icon
          const isActive = category.id === currentCategory?.id

          return (
            <button
              key={category.id}
              type="button"
              className={`kika-category-button ${isActive ? 'active' : ''}`}
              onClick={() => onSelectCategory(category.id)}
            >
              <span className="kika-category-icon">
                <Icon />
              </span>
              <span>{meta.label}</span>
            </button>
          )
        })}
      </div>
    )
  }

  if (templateId === 'almendra') {
    return (
      <div className="almendra-menu-head" aria-label="Categorias de Almendra">
        <div className="almendra-menu-title">
          <IconKikaLeaf />
          <h2>Explorá nuestro menú</h2>
        </div>
        <div className="almendra-category-row">
          {getAlmendraOrderedCategories(categories).filter((category) => !category?.hiddenFromBar).map((category) => {
            const meta = getAlmendraCategoryMeta(category.label)
            const Icon = meta.icon
            const isActive = category.id === currentCategory?.id

            return (
              <button
                key={category.id}
                type="button"
                className={`almendra-category-button ${isActive ? 'active' : ''}`}
                onClick={() => onSelectCategory(category.id)}
              >
                <span className="almendra-category-icon">
                  <Icon />
                </span>
                <span>{meta.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  if (templateId === 'florian') {
    const orderedCategories = getFlorianOrderedCategories(categories)

    return (
      <div className="florian-category-shell" aria-label="Categorias de Florian">
        {orderedCategories.filter((category) => !category?.hiddenFromBar).map((category) => {
          const meta = getFlorianCategoryMeta(category.label)
          const Icon = meta.icon
          const isActive = category.id === currentCategory?.id

          return (
            <button
              key={category.id}
              type="button"
              className={`florian-category-button ${isActive ? 'active' : ''}`}
              onClick={() => onSelectCategory(category.id)}
            >
              <span className="florian-category-icon">
                <Icon />
              </span>
              <span>{meta.label}</span>
            </button>
          )
        })}
      </div>
    )
  }

  if (templateId === 'sabor-pampa') {
    const orderedCategories = categories

    return (
      <div className="pampa-menu-head" aria-label="Categorias de Sabor a Pampa">
        <div className="pampa-menu-title-row">
          <div className="pampa-menu-title">
            <span aria-hidden="true" />
            <h2>Nuestro menu</h2>
            <span aria-hidden="true" />
          </div>

          {isSearchOpen || searchQuery ? null : (
            <button
              type="button"
              className="pampa-search-button"
              aria-label="Buscar productos"
              onClick={onOpenSearch}
            >
              <IconSearch />
            </button>
          )}
        </div>

        {isSearchOpen || searchQuery ? (
          <form
            className="pampa-search-form"
            role="search"
            onSubmit={(event) => event.preventDefault()}
          >
            <IconSearch />
            <input
              value={searchQuery}
              onChange={(event) => onSearchQueryChange?.(event.target.value)}
              placeholder="Buscar productos..."
              aria-label="Buscar productos"
              autoFocus
            />
            <button
              type="button"
              className="pampa-search-clear"
              aria-label="Cerrar busqueda"
              onClick={() => {
                onSearchQueryChange?.('')
                onCloseSearch?.()
              }}
            >
              x
            </button>
          </form>
        ) : null}

        <div className="pampa-category-row">
          {orderedCategories.filter((category) => !category?.hiddenFromBar).map((category) => {
            const meta = getSaborPampaCategoryMeta(category.label)
            const Icon = meta.icon
            const isActive = category.id === currentCategory?.id

            return (
              <button
                key={category.id}
                type="button"
                className={`pampa-category-pill ${isActive ? 'active' : ''}`}
                data-tone={meta.tone}
                onClick={() => onSelectCategory(category.id)}
              >
                <span className="pampa-category-icon">
                  <Icon />
                </span>
                <span>{meta.label}</span>
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
        {orderedCategories.filter((category) => !category?.hiddenFromBar).map((category) => {
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
        {categories.filter((category) => !category?.hiddenFromBar).map((category) => {
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
        {categories.filter((category) => !category?.hiddenFromBar).map((category) => {
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
      {categories.filter((category) => !category?.hiddenFromBar).map((category) => {
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
  accountId,
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
  onOpenCommunity,
  onOpenSocialMenu,
  onNavigateHome,
  onNavigatePromos,
  gelatoFormats,
  onOpenGelatoBuilder,
  searchQuery = '',
  isSearchActive = false,
  loyaltySettings = null,
  pointsName = 'puntos',
  orderCount = 0,
  currencySymbol = '$',
}) {
  const [dailyMenuFilter, setDailyMenuFilter] = useState('all')
  const [activeFeaturedIndex, setActiveFeaturedIndex] = useState(0)
  if (templateId === 'kika') {
    const sections = isSearchActive
      ? [
          {
            id: 'busqueda',
            label: `Resultados para "${searchQuery}"`,
            items: categoryItems,
          },
        ]
      : currentCategory
        ? [
            {
              ...currentCategory,
              items: categoryItems,
            },
          ]
        : categories.map((category) => ({
            ...category,
            items: category.items ?? [],
          }))
    const glutenTarget =
      categories.find((category) => slugify(category.label).includes('sin-gluten')) ??
      currentCategory

    return (
      <section className="section-block section-block-kika" data-menu-categories>
        {isSearchActive ? (
          <p className="kika-search-results">
            {categoryItems.length
              ? `${categoryItems.length} resultado${categoryItems.length === 1 ? '' : 's'} para "${searchQuery}"`
              : `No encontramos productos para "${searchQuery}"`}
          </p>
        ) : null}

        {!isSearchActive ? (
          <button
            type="button"
            className="kika-community-banner"
            onClick={onOpenCommunity}
            aria-label="Sumarte a la comunidad Kika"
          >
            <img src="/kika/banner2.png" alt="Sumate a la comunidad Kika" />
          </button>
        ) : null}

        {sections.map((section) => {
          const meta = getKikaCategoryMeta(section.label)
          const visibleItems = section.items
          const isCompact = !isSearchActive && !currentCategory

          if (!visibleItems.length) {
            return null
          }

          return (
            <article
              key={section.id}
              className={`kika-menu-section ${isCompact ? 'is-compact' : 'is-featured'}`}
              data-kika-section={section.id}
            >
              <div className="kika-section-head">
                <div>
                  <h2>
                    {meta.sectionTitle}
                    <span aria-hidden="true">
                      <IconKikaLeaf />
                    </span>
                  </h2>
                  <p>{meta.subtitle}</p>
                </div>
              </div>

              <div className={`kika-card-row ${isCompact ? 'compact' : 'featured'}`}>
                {visibleItems.map((item) => {
                  const productPoints = getProductLoyaltyPoints(item, loyaltySettings)
                  const hasProductPoints = Boolean(loyaltySettings?.enabled && productPoints > 0)

                  return (
                    <article key={item.id} className="kika-product-card">
                      <button
                        type="button"
                        className="kika-product-media"
                        onClick={() => onOpenDish(item)}
                        aria-label={`Ver ${item.name}`}
                      >
                        <KikaProductVisual item={item} category={section} />
                      </button>
                      <div className="kika-product-body">
                        <button
                          type="button"
                          className="kika-product-copy"
                          onClick={() => onOpenDish(item)}
                        >
                          <h3>{item.name}</h3>
                          {hasProductPoints ? (
                            <span className="kika-product-points">
                              +{productPoints} {pointsName}
                            </span>
                          ) : null}
                          {item.description ? <p>{item.description}</p> : null}
                        </button>
                        <button
                          type="button"
                          className="kika-favorite"
                          onClick={() => onAddItem(item)}
                          aria-label={`Agregar ${item.name}`}
                        >
                          <span aria-hidden="true">+</span>
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            </article>
          )
        })}

        {!isSearchActive ? (
          <button
            type="button"
            className="kika-gluten-banner"
            onClick={() => onSelectCategory?.(glutenTarget?.id)}
          >
            <span>
              <IconKikaLeaf />
            </span>
            <strong>
              Opciones sin gluten
              <small>y saludables</small>
            </strong>
            <em>{'>'}</em>
          </button>
        ) : null}

        <nav className="kika-bottom-nav" aria-label="Navegacion del menu">
          <button type="button" className="active" onClick={onNavigateHome}>
            <IconHome />
            <span>Inicio</span>
          </button>
          <button type="button" onClick={onNavigatePromos}>
            <IconKikaBook />
            <span>Menu</span>
          </button>
          <button
            type="button"
            className={orderCount > 0 ? 'has-order' : ''}
            onClick={onOpenCart}
          >
            <IconKikaBag />
            {orderCount > 0 ? <strong className="kika-nav-badge">{orderCount}</strong> : null}
            <span>Pedidos</span>
          </button>
          <button type="button" onClick={onOpenLoyalty}>
            <IconAward />
            <span>Premios</span>
          </button>
          <button type="button" onClick={onOpenSocialMenu}>
            <IconKikaUsers />
            <span>Nosotros</span>
          </button>
        </nav>
      </section>
    )
  }

  if (templateId === 'almendra') {
    const allItems = categories.flatMap((category) =>
      (category.items ?? []).map((item) => ({
        ...item,
        categoryLabel: item.categoryLabel ?? category.label,
      })),
    )
    const sections = isSearchActive
      ? [
          {
            id: 'busqueda',
            label: 'Resultados',
            items: categoryItems,
          },
        ]
      : currentCategory
        ? [
            {
              ...currentCategory,
              items: categoryItems,
            },
          ]
        : [
            {
              id: 'almendra-all',
              label: categories[0]?.label ?? 'Cafe',
              items: allItems,
            },
          ]

    return (
      <section className="section-block section-block-almendra" data-menu-categories>
        {isSearchActive ? (
          <p className="almendra-search-results">
            {categoryItems.length
              ? `${categoryItems.length} resultado${categoryItems.length === 1 ? '' : 's'} para "${searchQuery}"`
              : `No encontramos productos para "${searchQuery}"`}
          </p>
        ) : null}

        {sections.map((section) => {
          const sectionMeta = getAlmendraCategoryMeta(section.label)
          const visibleItems = section.items ?? []

          if (!visibleItems.length) {
            return isSearchActive ? (
              <p key={section.id} className="almendra-empty-category">
                No hay productos para mostrar.
              </p>
            ) : null
          }

          return (
            <article key={section.id} className="almendra-menu-section">
              <div className="almendra-section-head">
                <h2>
                  {isSearchActive ? 'Resultados' : sectionMeta.sectionTitle}
                  <IconKikaLeaf />
                </h2>
                <p>{isSearchActive ? 'Coincidencias de nuestra carta.' : sectionMeta.subtitle}</p>
              </div>

              <div className="almendra-product-list">
                {visibleItems.map((item) => (
                  <article key={item.id} className="almendra-product-item">
                    <button
                      type="button"
                      className="almendra-product-media"
                      onClick={() => onOpenDish(item)}
                      aria-label={`Ver ${item.name}`}
                    >
                      <AlmendraProductVisual item={item} category={{ label: item.categoryLabel ?? section.label }} />
                    </button>

                    <button
                      type="button"
                      className="almendra-product-copy"
                      onClick={() => onOpenDish(item)}
                    >
                      <h3>{item.name}</h3>
                      {item.description ? <p>{item.description}</p> : <p>Preparado con dedicacion.</p>}
                    </button>

                    <strong className="almendra-product-price">{item.price}</strong>

                    <button
                      type="button"
                      className="almendra-add-button"
                      onClick={() => onAddItem(item)}
                      aria-label={`Agregar ${item.name}`}
                    >
                      <IconPlus />
                    </button>
                  </article>
                ))}
              </div>
            </article>
          )
        })}

        {!isSearchActive ? (
          <article className="almendra-store-banner">
            <span className="almendra-store-media" aria-hidden="true">
              <IconAlmendraMark />
            </span>
            <div>
              <h3>Lleva la experiencia</h3>
              <p>Productos seleccionados para disfrutar en casa o regalar.</p>
            </div>
            <button type="button" onClick={onOpenSocialMenu}>
              Ver tienda
              <span>{'->'}</span>
            </button>
          </article>
        ) : null}

        <p className="almendra-footer-note">Gracias por ser parte de esta historia.</p>
      </section>
    )
  }

  if (templateId === 'florian') {
    const selectedCategory = currentCategory ?? categories[0] ?? null
    const sectionMeta = getFlorianCategoryMeta(selectedCategory?.label)

    return (
      <section className="section-block section-block-florian" data-menu-categories>
        {isSearchActive ? (
          <p className="florian-search-results">
            {categoryItems.length
              ? `${categoryItems.length} resultado${categoryItems.length === 1 ? '' : 's'} para "${searchQuery}"`
              : `No encontramos productos para "${searchQuery}"`}
          </p>
        ) : null}

        <div className="florian-section-head">
          <div>
            <h2>{isSearchActive ? 'RESULTADOS' : sectionMeta.sectionTitle}</h2>
            <span aria-hidden="true" />
          </div>
          <p>{isSearchActive ? 'Coincidencias del menu.' : sectionMeta.subtitle}</p>
        </div>

        {categoryItems.length ? (
          <div className="florian-product-grid">
            {categoryItems.map((item) => (
              <article key={item.id} className="florian-product-card">
                <button
                  type="button"
                  className="florian-product-media"
                  onClick={() => onOpenDish(item)}
                  aria-label={`Ver ${item.name}`}
                >
                  <FlorianProductVisual item={item} category={selectedCategory} />
                </button>

                <div className="florian-product-body">
                  <button
                    type="button"
                    className="florian-product-copy"
                    onClick={() => onOpenDish(item)}
                  >
                    <h3>{item.name}</h3>
                    {item.description ? <p>{item.description}</p> : null}
                  </button>
                  <div className="florian-product-footer">
                    <strong>{item.price}</strong>
                    <button
                      type="button"
                      className="florian-add-button"
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
        ) : (
          <p className="florian-empty-category">Todavia no hay productos en esta categoria.</p>
        )}

        {!isSearchActive ? (
          <>
            <article className="florian-takeaway-banner">
              <span className="florian-takeaway-cup" aria-hidden="true">
                <IconKikaCup />
              </span>
              <div>
                <h3>¿Vas con prisa?</h3>
                <p>Pedi para llevar y disfruta donde quieras.</p>
              </div>
              <button type="button" onClick={onOpenCart}>
                Pedir ahora
                <span>{'>'}</span>
              </button>
            </article>

            <div className="florian-benefits" aria-label="Beneficios Florian">
              <span>
                <IconLeafMark />
                Granos seleccionados
              </span>
              <span>
                <IconHeart />
                Hecho con pasion
              </span>
              <span>
                <IconKikaCup />
                Experiencia Florian
              </span>
            </div>
          </>
        ) : null}

        <nav className="florian-bottom-nav" aria-label="Navegacion del menu">
          <button type="button" className="active" onClick={onNavigateHome}>
            <IconHome />
            <span>Inicio</span>
          </button>
          <button type="button" onClick={onNavigatePromos}>
            <IconKikaBook />
            <span>Menu</span>
          </button>
          <button type="button" onClick={onNavigatePromos}>
            <IconTicket />
            <span>Promos</span>
          </button>
          <button type="button" onClick={onNavigateHome}>
            <IconKikaPin />
            <span>Ubicacion</span>
          </button>
        </nav>
      </section>
    )
  }


  if (templateId === 'sabor-pampa') {
    const orderedCategories = categories
    const selectedCategory = currentCategory
    const getItemsWithCategoryLabel = (category) =>
      (category?.items ?? []).map((item) => ({
        ...item,
        categoryLabel: item.categoryLabel ?? category.label,
      }))
    const dailyMenuCategories = orderedCategories.filter((category) => isDailyMenuCategoryLabel(category.label))
    let dailyMenuItems = dailyMenuCategories.flatMap(cat => getItemsWithCategoryLabel(cat))
    const hasAnyDailyMenuItems = dailyMenuItems.length > 0
    
    if (dailyMenuFilter !== 'all') {
      dailyMenuItems = dailyMenuItems.filter(item => {
        const catLabel = slugify(item.categoryLabel ?? '')
        const badge = slugify(item.badge ?? '')
        return catLabel.includes(dailyMenuFilter) || badge.includes(dailyMenuFilter)
      })
    }

    const selectedCategoryItems = selectedCategory ? getItemsWithCategoryLabel(selectedCategory) : []
    const homeCategorySections = orderedCategories
      .map((category) => ({
        ...category,
        items: getItemsWithCategoryLabel(category),
      }))
      .filter((category) => category.items.length && (!hasAnyDailyMenuItems || !isDailyMenuCategoryLabel(category.label)))
    const homeItems = homeCategorySections.flatMap((category) => category.items)
    const highlightedItems = isSearchActive
      ? categoryItems
      : [
          ...(categories.find((category) => isPromoCategoryLabel(category.label))?.items ?? []),
          ...(selectedCategory ? selectedCategoryItems : homeItems),
        ].filter(Boolean)
    const uniqueHighlightedItems = highlightedItems.filter(
      (item, index, list) => list.findIndex((entry) => entry.id === item.id) === index,
    )
    const uniqueDailyMenuItems = dailyMenuItems.filter(
      (item, index, list) => list.findIndex((entry) => entry.id === item.id) === index,
    )
    const featuredItems = hasAnyDailyMenuItems ? uniqueDailyMenuItems : uniqueHighlightedItems.slice(0, 4)
    const featuredTitle = hasAnyDailyMenuItems ? 'Menu del dia' : 'Destacados'
    const listItems = isSearchActive ? categoryItems : selectedCategoryItems

    const renderPampaProductCards = (items, { showRibbon = true } = {}) => (
      <div className="pampa-product-list">
        {items.map((item, index) => {
          const productMedia = renderProductMedia(item)
          const hasMedia = Boolean(productMedia)
          const shouldShowRibbon = showRibbon && index === 0

          return (
            <article
              key={item.id}
              className={`pampa-product-card${hasMedia ? '' : ' no-media'}${
                !hasMedia && shouldShowRibbon ? ' has-ribbon' : ''
              }`}
            >
              {hasMedia ? (
                <button
                  type="button"
                  className="pampa-product-media"
                  onClick={() => onOpenDish(item)}
                  aria-label={`Ver ${item.name}`}
                >
                  {shouldShowRibbon ? <span className="pampa-favorite-ribbon">Mas pedida</span> : null}
                  {productMedia}
                </button>
              ) : shouldShowRibbon ? (
                <span className="pampa-favorite-ribbon">Mas pedida</span>
              ) : null}

              <div className="pampa-product-body">
                <button
                  type="button"
                  className="pampa-product-copy"
                  onClick={() => onOpenDish(item)}
                >
                  <h3>{item.name}</h3>
                  {item.categoryLabel ? (
                    <span className="pampa-product-category">{item.categoryLabel}</span>
                  ) : null}
                  {item.description ? <p>{item.description}</p> : null}
                </button>
                <div className="pampa-product-footer">
                  <strong>{item.price}</strong>
                  <button
                    type="button"
                    className="pampa-add-button"
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
    )

    const renderPampaProductSection = ({
      id,
      title,
      subtitle,
      items,
      showRibbon = true,
      isHomeSection = false,
    }) => (
      <article key={id} className={`pampa-product-section${isHomeSection ? ' is-home-section' : ''}`}>
        <div className="pampa-section-heading">
          <h2>{title}</h2>
          <span aria-hidden="true" />
        </div>
        {subtitle ? <p>{subtitle}</p> : null}

        {items.length ? (
          renderPampaProductCards(items, { showRibbon })
        ) : (
          <p className="pampa-empty-category">Todavia no hay productos en esta categoria.</p>
        )}
      </article>
    )

    return (
      <section className="section-block section-block-sabor-pampa" data-menu-categories>
        {isSearchActive ? (
          <p className="pampa-search-results">
            {categoryItems.length
              ? `${categoryItems.length} resultado${categoryItems.length === 1 ? '' : 's'} para "${searchQuery}"`
              : `No encontramos productos para "${searchQuery}"`}
          </p>
        ) : null}

        {!isSearchActive && (featuredItems.length || hasAnyDailyMenuItems) ? (
          <article className="pampa-featured-section">
            <div className="pampa-section-heading">
              <h2>{featuredTitle}</h2>
              <span aria-hidden="true" />
            </div>

            {hasAnyDailyMenuItems && (
              <div className="pampa-daily-filter-row">
                <button
                  type="button"
                  className={`pampa-daily-filter-pill ${dailyMenuFilter === 'gourmet' ? 'active' : ''}`}
                  onClick={() => setDailyMenuFilter(dailyMenuFilter === 'gourmet' ? 'all' : 'gourmet')}
                >
                  <IconChefHat />
                  <span>Menú gourmet</span>
                </button>
                <button
                  type="button"
                  className={`pampa-daily-filter-pill ${dailyMenuFilter === 'saludable' ? 'active' : ''}`}
                  onClick={() => setDailyMenuFilter(dailyMenuFilter === 'saludable' ? 'all' : 'saludable')}
                >
                  <IconLeafMark />
                  <span>Menú saludable</span>
                </button>
                <button
                  type="button"
                  className={`pampa-daily-filter-pill ${dailyMenuFilter === 'especial' ? 'active' : ''}`}
                  onClick={() => setDailyMenuFilter(dailyMenuFilter === 'especial' ? 'all' : 'especial')}
                >
                  <IconStar />
                  <span>Menú especial</span>
                </button>
              </div>
            )}

            <div 
              className="pampa-featured-row"
              onScroll={(e) => {
                const child = e.target.firstElementChild
                if (!child) return
                const scrollLeft = e.target.scrollLeft
                const width = child.offsetWidth + 16
                const newActive = Math.round(scrollLeft / width)
                if (newActive !== activeFeaturedIndex) {
                  setActiveFeaturedIndex(newActive)
                }
              }}
            >
              {featuredItems.map((item, index) => {
                const productMedia = renderProductMedia(item)
                const hasMedia = Boolean(productMedia)

                return (
                  <article key={item.id} className={`pampa-featured-card${hasMedia ? '' : ' no-media'}`}>
                    {hasMedia ? (
                      <button
                        type="button"
                        className="pampa-featured-media"
                        onClick={() => onOpenDish(item)}
                        aria-label={`Ver ${item.name}`}
                      >
                        {(() => {
                          const badge = getSaborPampaBadgeText(item, index, item.categoryLabel)
                          return badge ? <span className="pampa-card-badge">{badge}</span> : null
                        })()}
                        {productMedia}
                      </button>
                    ) : (
                      (() => {
                        const badge = getSaborPampaBadgeText(item, index, item.categoryLabel)
                        return badge ? <span className="pampa-card-badge">{badge}</span> : null
                      })()
                    )}
                    <button
                      type="button"
                      className="pampa-featured-copy"
                      onClick={() => onOpenDish(item)}
                    >
                      <h3>{item.name}</h3>
                      {item.categoryLabel ? (
                        <span className="pampa-product-category">{item.categoryLabel}</span>
                      ) : null}
                      {item.description ? <p>{item.description}</p> : null}
                      <strong>{item.price}</strong>
                    </button>
                  </article>
                )
              })}
            </div>

            <div className="pampa-slider-dots" aria-hidden="true">
              {featuredItems.map((item, index) => (
                <span key={item.id} className={index === activeFeaturedIndex ? 'active' : ''} />
              ))}
            </div>
          </article>
        ) : null}

        {isSearchActive || selectedCategory
          ? renderPampaProductSection({
              id: 'selected-products',
              title: isSearchActive ? 'Resultados' : selectedCategory?.label ?? 'Elegi tu favorita',
              subtitle: !isSearchActive ? getSaborPampaSectionSubtitle(selectedCategory?.label) : '',
              items: listItems,
            })
          : homeCategorySections.length
            ? homeCategorySections.map((category) =>
                renderPampaProductSection({
                  id: category.id,
                  title: category.label,
                  subtitle: getSaborPampaSectionSubtitle(category.label),
                  items: category.items,
                  showRibbon: false,
                  isHomeSection: true,
                }),
              )
            : renderPampaProductSection({
                id: 'empty-products',
                title: 'Nuestro menu',
                subtitle: '',
                items: [],
              })}

      </section>
    )
  }

  if (templateId === 'burger') {
    const promoTarget = findExplicitPromosCategory(categories)
    const comboBannerSrc = isHostLikeAccount(accountId, templateId)
      ? '/host/banner.png'
      : '/burger/footer.png'
    const comboBannerAlt = isHostLikeAccount(accountId, templateId)
      ? 'Banner promocional Host.'
      : 'El match perfecto. Combo clasico.'
    const comboTarget =
      promoTarget ??
      findCombosCategory(categories) ??
      categories.find((category) => slugify(category.label).includes('bebida')) ??
      currentCategory

    // Recien entrando (sin categoria ni busqueda activa) se arma una seccion
    // por categoria, cada una con su titulo, en vez de un unico grid con
    // solo los productos de la primera categoria. Sin esto el cliente
    // aterrizaba viendo unicamente "Hamburguesas" y el resto de la carta
    // quedaba escondido hasta tocar otro chip.
    const showAllSections = !isSearchActive && !currentCategory
    const sections = showAllSections
      ? categories
          .filter((category) => !category?.hiddenFromBar && category.items?.length)
          .map((category) => ({
            id: category.id,
            // Mismo texto que su chip (getBurgerCategoryChipLabel ya
            // resuelve colisiones tipo "Bebidas" vs "Bebidas con alcohol").
            label: getBurgerCategoryChipLabel(category, categories),
            items: category.items,
          }))
      : [{ id: currentCategory?.id ?? 'resultados', label: currentCategory?.label ?? '', items: categoryItems }]

    function renderBurgerCard(item) {
      const [title, accent] = getBurgerDishParts(item)
      const hasActualMedia = Boolean(item.video || item.hasCustomImage)
      // Sin foto/video real, la caja de media quedaba vacia (el fallback de
      // renderProductMedia no dibuja nada, solo el <button> hueco). Antes
      // esto solo se corregia para cuentas detectadas como Host; se aplica
      // a cualquier producto sin media, sea la cuenta que sea.
      const hideEmptyMedia = !hasActualMedia

      return (
        <article key={item.id} className={`burger-dish-card ${hideEmptyMedia ? 'no-media' : ''}`}>
          <button type="button" className="burger-favorite" aria-label="Guardar favorito">
            <IconHeart />
          </button>

          {!hideEmptyMedia ? (
            <button
              type="button"
              className="burger-dish-media"
              onClick={() => onOpenDish(item)}
              aria-label={`Ver ${item.name}`}
            >
              {renderProductMedia(item)}
            </button>
          ) : null}

          <div className="burger-dish-body">
            <button type="button" className="burger-dish-copy" onClick={() => onOpenDish(item)}>
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
    }

    return (
      <section className="section-block section-block-burger">
        {isSearchActive ? (
          <p className="burger-search-results">
            {categoryItems.length
              ? `${categoryItems.length} resultado${categoryItems.length === 1 ? '' : 's'} para "${searchQuery}"`
              : `No encontramos productos para "${searchQuery}"`}
          </p>
        ) : null}

        {sections.map((section) =>
          section.items.length ? (
            <div key={section.id} className="burger-section">
              {showAllSections ? <h2 className="burger-section-title">{section.label}</h2> : null}
              <div className="burger-card-grid">{section.items.map(renderBurgerCard)}</div>
            </div>
          ) : null,
        )}

        {comboTarget && !isSearchActive ? (
          <article className="burger-combo-banner burger-footer-banner" data-burger-promos>
            <button
              type="button"
              onClick={() => {
                onSelectCategory?.(comboTarget?.id)
                onNavigatePromos?.()
              }}
              aria-label="Ver combo clasico"
            >
              <img src={comboBannerSrc} alt={comboBannerAlt} />
            </button>
          </article>
        ) : null}

        <nav
          className={`burger-bottom-nav ${promoTarget ? 'has-secondary-action' : 'no-secondary-action'}`}
          aria-label="Navegacion del menu"
        >
          <button type="button" className="active bottom-nav-home" onClick={onNavigateHome}>
            <IconFlame />
            <span>Inicio</span>
          </button>
          <button type="button" className="burger-bottom-primary" onClick={onOpenCart}>
            <IconFlame />
          </button>
          {promoTarget ? (
            <button
              type="button"
              className="bottom-nav-promo"
              onClick={() => {
                onSelectCategory?.(promoTarget.id)
                onNavigatePromos?.()
              }}
            >
              <IconTicket />
              <span>Promos</span>
            </button>
          ) : null}
          <button type="button" className="bottom-nav-points" onClick={onOpenLoyalty}>
            <IconAward />
            <span>Mis puntos</span>
          </button>
        </nav>
      </section>
    )
  }

  if (templateId === 'blue-burger') {
    const highlightedItems = categoryItems.slice(0, 3)
    const comboCategory = findCombosCategory(categories) ?? findExplicitPromosCategory(categories)
    const comboTarget =
      comboCategory ??
      categories.find((category) => slugify(category.label).includes('bebida') && category.items?.length) ??
      null

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

        {comboTarget ? (
          <article className="blue-burger-combo-card" data-burger-promos>
            <div>
              <h3>Combos que te encantan</h3>
              <button
                type="button"
                onClick={() => {
                  onSelectCategory?.(comboTarget.id)
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
        ) : null}

        <nav
          className={`blue-burger-bottom-nav ${comboTarget ? 'has-secondary-action' : 'no-secondary-action'}`}
          aria-label="Navegacion del menu"
        >
          <button type="button" className="active bottom-nav-home" onClick={onNavigateHome}>
            <IconHome />
            <span>Inicio</span>
          </button>
          {comboTarget ? (
            <button
              type="button"
              className="bottom-nav-promo"
              onClick={() => {
                onSelectCategory?.(comboTarget.id)
                onNavigatePromos?.()
              }}
            >
              <IconFries />
              <span>Combos</span>
            </button>
          ) : null}
          <button type="button" className="bottom-nav-points" onClick={onOpenLoyalty}>
            <IconAward />
            <span>Mis puntos</span>
          </button>
          <button type="button" className="bottom-nav-cart" onClick={onOpenCart}>
            <IconCart />
            <span>Contacto</span>
          </button>
        </nav>
      </section>
    )
  }

  if (templateId === 'host') {
    const highlightedItems = categoryItems
    const promoTarget = findExplicitPromosCategory(categories)
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
          {highlightedItems.map((item, index) => {
            const productMedia = renderProductMedia(item)

            return (
              <article key={item.id} className={`host-dish-card ${productMedia ? '' : 'no-media'}`}>
                <span className="host-dish-badge">{getHostBadgeText(item, index, currentCategory?.label)}</span>

                {productMedia ? (
                  <button
                    type="button"
                    className="host-dish-media"
                    onClick={() => onOpenDish(item)}
                    aria-label={`Ver ${item.name}`}
                  >
                    {productMedia}
                  </button>
                ) : null}

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
            )
          })}
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

        <nav
          className={`host-bottom-nav ${promoTarget ? 'has-secondary-action' : 'no-secondary-action'}`}
          aria-label="Navegacion del menu"
        >
          <button type="button" className="active bottom-nav-home" onClick={onNavigateHome}>
            <IconHome />
            <span>Inicio</span>
          </button>
          {promoTarget ? (
            <button
              type="button"
              className="bottom-nav-promo"
              onClick={() => {
                onSelectCategory?.(promoTarget.id)
                onNavigatePromos?.()
              }}
            >
              <IconSpark />
              <span>Promos</span>
            </button>
          ) : null}
          <button type="button" className="host-bottom-primary" onClick={onOpenCart}>
            <IconFlame />
            <span>Pedi ahora</span>
          </button>
          <button type="button" className="bottom-nav-points" onClick={onOpenLoyalty}>
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
        {categoryItems.map((item, index) => {
          const planDays = getWeeklyPlanDays(getSelectableOptionGroups(item.optionGroups ?? []))
          const isPlan = planDays.length >= 2
          const planFixedDays = planDays.every((entry) => entry.group.required)
          const planBadgeLabel = planFixedDays
            ? `${planDays.length} dias a elegir`
            : `hasta ${planDays.length} dias`
          // Un pack a medida no tiene precio propio: lo arma el cliente eligiendo
          // viandas. Mostrar "$0" en la card confunde, asi que se muestra desde
          // cuanto sale la vianda mas barata.
          const planFromPrice = isPlan ? getPlanStartingPrice(item, planDays) : 0

          return (
            <article key={item.id} className={`dish-card ${isPlan ? 'dish-card-plan' : ''}`}>
              <button type="button" className="dish-media-button" onClick={() => onOpenDish(item)}>
                {renderProductMedia(item)}
                {isPlan ? (
                  <span className="dish-badge plan-badge">{planBadgeLabel}</span>
                ) : index === 0 ? (
                  <span className="dish-badge">Mas pedido</span>
                ) : null}
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
                  <strong>
                    {planFromPrice > 0 ? `Desde ${formatPrice(planFromPrice, currencySymbol)}` : item.price}
                  </strong>
                  {isPlan ? (
                    <button type="button" className="plan-cta" onClick={() => onOpenDish(item)}>
                      Armar mi semana
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="add-button"
                      onClick={() => onAddItem(item)}
                      aria-label={`Agregar ${item.name}`}
                    >
                      <IconPlus />
                    </button>
                  )}
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

export default function MenuApp() {
  const [accountId] = useState(getInitialAccountId)
  const [qrLandingView, setQrLandingView] = useState('landing')
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
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [checkoutStatus, setCheckoutStatus] = useState('idle')
  const [checkoutMessage, setCheckoutMessage] = useState('')
  const [deliveryQuote, setDeliveryQuote] = useState(null)
  const [deliveryQuoteStatus, setDeliveryQuoteStatus] = useState('idle')
  const [lastOrder, setLastOrder] = useState(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [isLoyaltyOpen, setIsLoyaltyOpen] = useState(false)
  const [isCommunityOpen, setIsCommunityOpen] = useState(false)
  const [isSocialMenuOpen, setIsSocialMenuOpen] = useState(false)
  const [loyaltyPhone, setLoyaltyPhone] = useState('')
  const [loyaltyStatus, setLoyaltyStatus] = useState('idle')
  const [loyaltyMessage, setLoyaltyMessage] = useState('')
  const [loyaltyData, setLoyaltyData] = useState(null)
  const [communityForm, setCommunityForm] = useState({
    name: '',
    birthDate: '',
    phone: '',
  })
  const [communityStatus, setCommunityStatus] = useState('idle')
  const [communityMessage, setCommunityMessage] = useState('')
  const [cartFeedback, setCartFeedback] = useState(null)
  const [pairingFeedbackId, setPairingFeedbackId] = useState('')
  const [orderingNotice, setOrderingNotice] = useState('')
  const [currentTime, setCurrentTime] = useState(() => Date.now())
  const [installPromptEvent, setInstallPromptEvent] = useState(null)
  const [installPromptOpen, setInstallPromptOpen] = useState(false)
  const [installStepsOpen, setInstallStepsOpen] = useState(false)
  const [installPlatform, setInstallPlatform] = useState(() => getPwaInstallPlatform())
  const [isPwaInstalled, setIsPwaInstalled] = useState(() => isStandalonePwa())
  const cartFeedbackIdRef = useRef(0)
  const [gelatoBuilderOpen, setGelatoBuilderOpen] = useState(false)
  const [gelatoStep, setGelatoStep] = useState(1)
  const [gelatoFormat, setGelatoFormat] = useState('kilo')
  const [gelatoSizeId, setGelatoSizeId] = useState('')
  const [gelatoFlavorFilter, setGelatoFlavorFilter] = useState('Todos')
  const [gelatoSelectedFlavors, setGelatoSelectedFlavors] = useState([])
  const [mesaId, setMesaId] = useState(() => {
    if (typeof window !== 'undefined') {
      const search = new URLSearchParams(window.location.search)
      return search.get('mesa') || search.get('mesa_id') || null
    }
    return null
  })

  // --- Boton "atras" del navegador: cerrar la vista abierta en vez de salir ---
  // Los overlays (detalle de producto, carrito, checkout, buscador, etc.) se
  // abren por estado, no por ruta; sin esto, "atras" abandona la pagina. Con el
  // History API mantenemos una entrada "guardia" mientras haya un overlay abierto
  // y, al presionar atras, cerramos el overlay superior en vez de salir del menu.
  const anyOverlayOpen = Boolean(
    selectedDish ||
      gelatoBuilderOpen ||
      isCheckoutOpen ||
      isCartOpen ||
      isSearchOpen ||
      isSocialMenuOpen ||
      isCommunityOpen ||
      isLoyaltyOpen,
  )

  const closeTopOverlay = useCallback(() => {
    if (selectedDish) return setSelectedDish(null)
    if (gelatoBuilderOpen) return setGelatoBuilderOpen(false)
    if (isCheckoutOpen) {
      // El checkout se abre desde el carrito: al volver, reabrir el carrito.
      setIsCheckoutOpen(false)
      setIsCartOpen(true)
      return
    }
    if (isCartOpen) return setIsCartOpen(false)
    if (isSearchOpen) return setIsSearchOpen(false)
    if (isSocialMenuOpen) return setIsSocialMenuOpen(false)
    if (isCommunityOpen) return setIsCommunityOpen(false)
    if (isLoyaltyOpen) return setIsLoyaltyOpen(false)
  }, [
    selectedDish,
    gelatoBuilderOpen,
    isCheckoutOpen,
    isCartOpen,
    isSearchOpen,
    isSocialMenuOpen,
    isCommunityOpen,
    isLoyaltyOpen,
  ])

  const overlayGuardRef = useRef(false)
  const skipPopRef = useRef(false)
  const [guardNonce, setGuardNonce] = useState(0)

  // Reconcilia la entrada "guardia" del historial con el estado de los overlays:
  // debe existir una guardia siempre que haya al menos un overlay abierto. El
  // nonce fuerza esta reconciliacion despues de cada "atras" (por si al cerrar el
  // overlay superior todavia queda otro abierto, p. ej. checkout -> carrito).
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (anyOverlayOpen && !overlayGuardRef.current) {
      overlayGuardRef.current = true
      window.history.pushState({ __menuOverlayGuard: true }, '')
    } else if (!anyOverlayOpen && overlayGuardRef.current) {
      // Se cerro por la UI (boton X, backdrop, etc.): consumimos la guardia.
      overlayGuardRef.current = false
      if (window.history.state && window.history.state.__menuOverlayGuard) {
        skipPopRef.current = true
        window.history.back()
      }
    }
  }, [anyOverlayOpen, guardNonce])

  // Al presionar "atras" con un overlay abierto, cerrar el superior en vez de
  // abandonar la pagina. El navegador ya consumio nuestra guardia al hacer pop.
  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    const handlePopState = () => {
      if (skipPopRef.current) {
        skipPopRef.current = false
        return
      }
      if (!overlayGuardRef.current) return
      overlayGuardRef.current = false
      closeTopOverlay()
      // Reconciliar: si todavia queda un overlay abierto, se re-arma la guardia.
      setGuardNonce((value) => value + 1)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [closeTopOverlay])

  const [orderForm, setOrderForm] = useState(() => {
    let deliveryType = 'delivery'
    if (typeof window !== 'undefined') {
      const search = new URLSearchParams(window.location.search)
      if (search.has('mesa') || search.has('mesa_id')) {
        deliveryType = 'local'
      }
    }
    return {
      name: '',
      phone: '',
      address: '',
      neighborhood: '',
      city: '',
      deliveryType,
      paymentMethod: 'cash',
      notes: '',
    }
  })

  useEffect(() => {
    setDocumentFavicon(getAccountFaviconHref(accountId))
    setDocumentAppleTouchIcon(getAccountAppleTouchIconHref(accountId))
    setDocumentTitle(getAccountDocumentTitle(accountId))
    setDocumentManifest(`/api/accounts/${encodeURIComponent(accountId)}/manifest.webmanifest`)
    registerMenuServiceWorker()
  }, [accountId])

  useEffect(() => {
    const dismissKey = `install-app-dismissed-${slugify(accountId)}`

    function handleBeforeInstallPrompt(event) {
      event.preventDefault()
      setInstallPromptEvent(event)
      setInstallPlatform(getPwaInstallPlatform())

      if (!isStandalonePwa() && !getSessionFlag(dismissKey)) {
        window.setTimeout(() => setInstallPromptOpen(true), 700)
      }
    }

    function handleAppInstalled() {
      setIsPwaInstalled(true)
      setInstallPromptOpen(false)
      setInstallStepsOpen(false)
      setInstallPromptEvent(null)
      setSessionFlag(dismissKey)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [accountId])

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

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCurrentTime(Date.now())
    }, 60000)

    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!orderingNotice) {
      return undefined
    }

    const timeout = window.setTimeout(() => {
      setOrderingNotice('')
    }, 2800)

    return () => window.clearTimeout(timeout)
  }, [orderingNotice])

  const presentation = menu?.presentation ?? defaultPresentation
  const templateId = presentation.template ?? presentation.layout ?? 'editorial'
  const hideNeighborhoodField = ['lo-de-totto', 'sabor-a-pampa'].includes(slugify(accountId))
  const isTableOrder = mesaId != null || templateId === 'kika' || templateId === 'almendra'
  const pwaPromptEnabled = presentation.theme?.pwaInstallPromptEnabled === true
  const rawCategories = menu?.categories ?? emptyCategories
  const categories = useMemo(
    () => {
      if (templateId === 'kika') return normalizeKikaCategories(rawCategories)
      if (templateId === 'almendra') return normalizeAlmendraCategories(rawCategories)
      // El orden ya viene resuelto del backend (menuCategories del
      // dashboard, o category.asc por defecto). Antes se pisaba con un
      // heuristico fijo (milanesa/carne/hamburguesa/... primero) que no
      // dejaba ordenar la carta a mano para una cuenta distinta.
      return rawCategories
    },
    [rawCategories, templateId],
  )

  useEffect(() => {
    setDocumentTitle(getAccountDocumentTitle(accountId, presentation))
    setDocumentThemeColor(presentation.theme?.primary)
  }, [accountId, presentation])

  useEffect(() => {
    if (!pwaPromptEnabled || status !== 'ready' || isPwaInstalled || isStandalonePwa()) {
      return undefined
    }

    const dismissKey = `install-app-dismissed-${slugify(accountId)}`

    if (getSessionFlag(dismissKey)) {
      return undefined
    }

    const platform = getPwaInstallPlatform()

    const timeout = window.setTimeout(() => {
      setInstallPlatform(platform)
      setInstallPromptOpen(true)
    }, installPromptEvent ? 700 : 1300)

    return () => window.clearTimeout(timeout)
  }, [accountId, installPromptEvent, isPwaInstalled, pwaPromptEnabled, status])

  const allItems = categories.flatMap((category) =>
    category.items.map((item) => ({
      ...item,
      categoryLabel: category.label,
    })),
  )
  // Productos de "Adicionales" y "Bebidas" para mostrar en el carrito (llegan
  // aparte del payload porque la categoria puede estar oculta de la barra).
  const adicionalesItems = useMemo(() => {
    const raw = Array.isArray(menu?.cartAddonItems) ? menu.cartAddonItems : []
    return raw.map((item) => ({ ...item, categoryLabel: item.categoryLabel || 'Adicionales' }))
  }, [menu])
  const bebidasItems = useMemo(() => {
    const raw = Array.isArray(menu?.cartBeverageItems) ? menu.cartBeverageItems : []
    return raw.map((item) => ({ ...item, categoryLabel: item.categoryLabel || 'Bebidas' }))
  }, [menu])
  // Sin categoria elegida todavia, kika/sabor-pampa/burger arrancan
  // mostrando la carta completa (una seccion por categoria) en vez de
  // encerrar al cliente en la primera categoria del orden.
  const showsFullMenuByDefault =
    templateId === 'kika' || templateId === 'sabor-pampa' || templateId === 'burger'
  const currentCategory =
    categories.find((category) => category.id === selectedCategory) ??
    (showsFullMenuByDefault ? null : categories[0] ?? null)
  const categoryItems = currentCategory?.items ?? (showsFullMenuByDefault ? allItems : [])
  const heroDish = categoryItems[0] ?? allItems[0] ?? null
  const deferredSearchQuery = useDeferredValue(searchQuery)
  const normalizedSearchQuery = normalizeSearchText(deferredSearchQuery)
  const isSearchActive = normalizedSearchQuery.length > 0
  const searchResults = useMemo(
    () => searchMenuItems(allItems, deferredSearchQuery),
    [allItems, deferredSearchQuery],
  )
  const visibleCategoryItems = isSearchActive ? searchResults : categoryItems
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

  const cartSubtotal = useMemo(
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
  const redemptionDiscountTotal = useMemo(
    () => calculateRedemptionDiscountTotal(rewardRedemptions, cartSubtotal),
    [rewardRedemptions, cartSubtotal],
  )
  const cartTotal = Math.max(0, cartSubtotal - redemptionDiscountTotal)
  const configuredDeliveryFee = Math.max(
    0,
    Number(
      menu?.deliveryFee ??
        menu?.delivery_fee ??
        menu?.restaurant?.deliveryFee ??
        menu?.restaurant?.delivery_fee ??
        0,
    ) || 0,
  )
  const hasDiscountRedemptions = rewardRedemptions.some((line) => line.rewardType === 'discount')
  const orderCount = cartCount + redemptionCount
  const hasOrderItems = orderCount > 0
  const deliveryZonesEnabled = Boolean(
    menu?.deliveryZonesEnabled &&
      Array.isArray(menu?.deliveryZones) &&
      menu.deliveryZones.some((zone) => zone?.active !== false && Array.isArray(zone?.polygon) && zone.polygon.length >= 3),
  )
  const selectedDeliveryFee =
    hasOrderItems && !isTableOrder && orderForm.deliveryType === 'delivery'
      ? deliveryZonesEnabled
        ? Number(deliveryQuote?.fee || 0)
        : configuredDeliveryFee
      : 0
  const deliveryZoneBlocksCheckout =
    hasOrderItems &&
    !isTableOrder &&
    orderForm.deliveryType === 'delivery' &&
    deliveryZonesEnabled &&
    deliveryQuote?.allowed !== true
  const deliveryCity = String(menu?.city || '').trim()
  const deliveryProvince = String(menu?.province || '').trim()
  const paymentSurchargeConfig = menu?.businessHours?._settings?.paymentSurcharge
  const paymentSurchargePercent =
    hasOrderItems &&
    !isTableOrder &&
    paymentSurchargeConfig &&
    Array.isArray(paymentSurchargeConfig.methods) &&
    paymentSurchargeConfig.methods.includes(orderForm.paymentMethod)
      ? Number(paymentSurchargeConfig.percent || 0)
      : 0
  const paymentSurchargeAmount =
    paymentSurchargePercent > 0
      ? Math.round(((cartTotal + selectedDeliveryFee) * paymentSurchargePercent) / 100)
      : 0
  const orderTotal = cartTotal + selectedDeliveryFee + paymentSurchargeAmount
  const orderTotalLabel = orderTotal > 0
    ? formatPrice(orderTotal, currencySymbol)
    : redemptionCount > 0
      ? 'Canje'
      : 'Sin productos'
  const loyaltySettings = menu?.loyalty?.settings ?? null
  const pointsName = loyaltyData?.settings?.pointsName ?? loyaltySettings?.pointsName ?? 'puntos'
  const loyaltyEarnPreview = useMemo(
    () => calculateLoyaltyEarnPreview(cartTotal, loyaltySettings),
    [cartTotal, loyaltySettings],
  )
  const loyaltyEarnPreviewText =
    loyaltySettings?.enabled && hasOrderItems
      ? getLoyaltyEarnPreviewText(
          loyaltyEarnPreview,
          pointsName,
          cartTotal,
          loyaltySettings,
          currencySymbol,
        )
      : ''
  const cartRecommendations = buildCartRecommendations(cartItems, allItems)
  const cartPairings = buildCartPairingSuggestions(cartItems, allItems)
  // En el carrito mostramos todos los productos de "Adicionales" y "Bebidas" si
  // existen; si no hay ninguna de las dos categorias, caemos a las sugerencias
  // heuristicas (una sola seccion generica).
  const cartExtraSections = [
    adicionalesItems.length
      ? { key: 'adicionales', title: 'Adicionales', items: adicionalesItems.map((product) => ({ label: product.name, product })) }
      : null,
    bebidasItems.length
      ? { key: 'bebidas', title: 'Bebidas', items: bebidasItems.map((product) => ({ label: product.name, product })) }
      : null,
  ].filter(Boolean)
  if (!cartExtraSections.length && cartPairings.length) {
    cartExtraSections.push({ key: 'pairings', title: 'Acompanamientos sugeridos', items: cartPairings })
  }
  const orderingStatus = menu?.businessHours
    ? getBusinessOpenStatus(menu.businessHours, new Date(currentTime))
    : menu?.ordering ?? {
        configured: false,
        isOpen: true,
        message: '',
        nextOpenText: '',
        scheduleText: '',
      }
  const orderingBlocked = Boolean(orderingStatus.configured && !orderingStatus.isOpen)
  const orderingClosedMessage = getOrderingClosedMessage(orderingStatus)

  const requestDeliveryQuote = useCallback(async (form) => {
    const address = String(form.address || '').trim()

    if (!deliveryZonesEnabled || form.deliveryType !== 'delivery') {
      return null
    }

    if (address.length < 4) {
      return {
        enabled: true,
        allowed: false,
        fee: 0,
        message: 'Ingresa calle y altura para calcular el envio.',
      }
    }

    const params = new URLSearchParams({
      address,
      neighborhood: String(form.neighborhood || '').trim(),
      city: String(form.city || menu?.city || '').trim(),
    })
    if (deliveryProvince) params.set('province', deliveryProvince)
    if (form.coordinates?.lat && form.coordinates?.lng) {
      params.set('lat', String(form.coordinates.lat))
      params.set('lng', String(form.coordinates.lng))
      params.set('confirmed', 'true')
      if (form.coordinates.label) params.set('label', String(form.coordinates.label))
    }
    const response = await fetch(
      `/api/accounts/${encodeURIComponent(accountId)}/delivery-zone?${params.toString()}`,
      { cache: 'no-store' },
    )
    const payload = await response.json().catch(() => null)

    if (!response.ok) {
      throw new Error(payload?.message || 'No pudimos calcular el envio para esa direccion.')
    }

    return payload
  }, [accountId, deliveryProvince, deliveryZonesEnabled, menu?.city])

  useEffect(() => {
    let cancelled = false
    const address = orderForm.address.trim()
    const deliveryType = orderForm.deliveryType
    const quoteForm = {
      address: orderForm.address,
      neighborhood: orderForm.neighborhood,
      city: deliveryCity,
      deliveryType,
    }

    const timeout = window.setTimeout(async () => {
      if (!deliveryZonesEnabled || deliveryType !== 'delivery') {
        if (!cancelled) {
          setDeliveryQuote(null)
          setDeliveryQuoteStatus('idle')
        }
        return
      }

      if (address.length < 4) {
        if (!cancelled) {
          setDeliveryQuote({
            enabled: true,
            allowed: false,
            fee: 0,
            message: 'Ingresa calle y altura para calcular el envio.',
          })
          setDeliveryQuoteStatus('idle')
        }
        return
      }

      try {
        if (!cancelled) setDeliveryQuoteStatus('checking')
        const quote = await requestDeliveryQuote(quoteForm)

        if (!cancelled) {
          setDeliveryQuote(quote)
          setDeliveryQuoteStatus(quote?.allowed ? 'ready' : 'error')
        }
      } catch (error) {
        if (!cancelled) {
          setDeliveryQuote({
            enabled: true,
            allowed: false,
            fee: 0,
            message: error instanceof Error ? error.message : 'No pudimos calcular el envio.',
          })
          setDeliveryQuoteStatus('error')
        }
      }
    }, 650)

    return () => {
      cancelled = true
      window.clearTimeout(timeout)
    }
  }, [
    accountId,
    deliveryZonesEnabled,
    orderForm.address,
    orderForm.deliveryType,
    orderForm.neighborhood,
    deliveryCity,
    requestDeliveryQuote,
  ])

  function showOrderingClosedNotice() {
    setOrderingNotice(orderingClosedMessage)
  }

  function handleCloseInstallPrompt() {
    setInstallPromptOpen(false)
    setInstallStepsOpen(false)
    setSessionFlag(`install-app-dismissed-${slugify(accountId)}`)
  }

  async function handleInstallApp() {
    if (!installPromptEvent) {
      setInstallStepsOpen(true)
      return
    }

    const promptEvent = installPromptEvent
    setInstallPromptEvent(null)

    try {
      await promptEvent.prompt()
      const choice = await promptEvent.userChoice

      if (choice?.outcome === 'accepted') {
        setIsPwaInstalled(true)
        handleCloseInstallPrompt()
        return
      }
    } catch {
      // Keep the fallback visible if the native prompt is not available anymore.
    }

    setInstallStepsOpen(true)
  }

  function handleAddItem(item, quantity = 1, configuration = null) {
    if (orderingBlocked) {
      showOrderingClosedNotice()
      return false
    }

    if (!configuration) {
      const optionGroups = getSelectableOptionGroups(
        getTemplateProductOptionGroups(templateId, item, allItems),
      )
      const hasRequiredOptions = optionGroups.some(
        (group) => group.required || Number(group.minSelect || 0) > 0,
      )

      if (hasRequiredOptions) {
        handleOpenDish(item)
        return false
      }
    }

    const maxQuantity = typeof item.maxQuantity === 'number' ? item.maxQuantity : null
    const currentQuantity = cart.reduce(
      (total, line) => total + (line.id === item.id ? Number(line.quantity || 0) : 0),
      0,
    )

    if (item.availableForOrder === false || (maxQuantity !== null && currentQuantity + quantity > maxQuantity)) {
      setOrderingNotice(
        maxQuantity === 0
          ? `${item.name} esta sin stock.`
          : `Solo quedan ${maxQuantity} unidades disponibles de ${item.name}.`,
      )
      return false
    }

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
          productId: item.productId || (item.isDailyMenu ? null : item.id),
          name: item.name,
          price: formatPrice(unitPrice, currencySymbol),
          unitPrice,
          quantity,
          maxQuantity,
          availableForOrder: item.availableForOrder,
          notes,
          image: item.image,
          categoryLabel: item.categoryLabel ?? currentCategory?.label ?? '',
        },
      ]
    })

    return true
  }

  function handleAddPairing(product) {
    const wasAdded = handleAddItem(product)

    if (!wasAdded) {
      return
    }

    setPairingFeedbackId(product.id)
    window.setTimeout(() => {
      setPairingFeedbackId((current) => (current === product.id ? '' : current))
    }, 900)
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
              quantity:
                typeof line.maxQuantity === 'number'
                  ? Math.min(quantity, line.maxQuantity)
                  : quantity,
            }
          : line,
      )
    })
  }

  function handleOpenDish(item) {
    const nextDish = { ...item, categoryLabel: item.categoryLabel ?? currentCategory?.label }
    const groups = getTemplateProductOptionGroups(templateId, nextDish, allItems)
    setSelectedDish(nextDish)
    setDetailQuantity(1)
    setSelectedOptions(buildInitialSelections(getSelectableOptionGroups(groups)))
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
    if (orderingBlocked) {
      showOrderingClosedNotice()
      return
    }

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
    if (orderingBlocked) {
      showOrderingClosedNotice()
      return
    }

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
    if (!hasProductMedia(item)) {
      return null
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

    return <img src={item.image} alt={item.name} className={`dish-thumb ${getImageAnimationClass(item)}`} />
  }

  function renderMiniCardMedia(item) {
    if (item.video) {
      const useForcedHostVideoPreview = shouldForceVideoPreviewForBurgerHost(
        accountId,
        templateId,
        categories,
      )

      return (
        <video
          src={getVideoFrameSrc(item.video)}
          preload="auto"
          autoPlay={shouldAutoplayVideoPreview(presentation) || useForcedHostVideoPreview}
          muted={presentation.preview?.mutedVideos ?? true}
          loop={shouldAutoplayVideoPreview(presentation) || useForcedHostVideoPreview}
          playsInline
        />
      )
    }

    if (item.hasCustomImage) {
      return <img src={item.image} alt={item.name} className={getImageAnimationClass(item)} />
    }

    return null
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

  function renderLoyaltyCustomerProfile() {
    const profile = loyaltyData?.profile

    if (!profile) {
      return null
    }

    const summary = profile.summary ?? {}
    const orders = Array.isArray(profile.orders) ? profile.orders : []
    const transactions = Array.isArray(profile.transactions) ? profile.transactions : []
    const redemptions = Array.isArray(profile.redemptions) ? profile.redemptions : []
    const favoriteProduct = getFavoriteProductFromOrders(orders)

    return (
      <section className="loyalty-profile-panel">
        <div className="loyalty-profile-head">
          <div>
            <span>Perfil del cliente</span>
            <h3>{loyaltyData.customer?.name || 'Cliente Kika'}</h3>
          </div>
          <small>{loyaltyData.customer?.phone ? `+${loyaltyData.customer.phone}` : 'Sin celular asociado'}</small>
        </div>

        <div className="loyalty-profile-stats">
          <div>
            <span>Pedidos</span>
            <strong>{summary.totalOrders ?? orders.length}</strong>
          </div>
          <div>
            <span>Favorito</span>
            <strong className="loyalty-favorite-product">
              {favoriteProduct?.name ?? 'Sin pedidos'}
            </strong>
            {favoriteProduct ? <small>{favoriteProduct.quantity} unidades</small> : null}
          </div>
          <div>
            <span>Ganados</span>
            <strong>{summary.totalPointsEarned ?? 0}</strong>
          </div>
          <div>
            <span>Canjeados</span>
            <strong>{summary.totalPointsRedeemed ?? 0}</strong>
          </div>
        </div>

        <div className="loyalty-history-section">
          <div className="section-heading compact">
            <h2>Pedidos recientes</h2>
          </div>
          {orders.length ? (
            <div className="loyalty-history-list">
              {orders.map((order) => {
                const itemPreview = (order.items ?? [])
                  .slice(0, 2)
                  .map((item) => `${item.quantity}x ${item.name}`)
                  .join(' · ')

                return (
                  <article key={order.id} className="loyalty-history-card">
                    <div>
                      <strong>Pedido #{order.orderNumber ?? '-'}</strong>
                      <span>{itemPreview || 'Pedido cargado'}</span>
                    </div>
                    <div>
                      <em>{formatShortDate(order.createdAt)}</em>
                      <strong>{formatPrice(order.total ?? 0, currencySymbol)}</strong>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <p className="loyalty-empty">Todavía no hay pedidos asociados a este perfil.</p>
          )}
        </div>

        {redemptions.length ? (
          <div className="loyalty-history-section">
            <div className="section-heading compact">
              <h2>Historial de canjes</h2>
            </div>
            <div className="loyalty-history-list">
              {redemptions.map((transaction) => (
                <article key={transaction.id} className="loyalty-history-card redemption">
                  <div>
                    <strong>{transaction.description || 'Canje realizado'}</strong>
                    <span>Saldo luego del canje: {transaction.balanceAfter} {pointsName}</span>
                  </div>
                  <div>
                    <em>{formatShortDate(transaction.createdAt)}</em>
                    <strong>{transaction.pointsDelta} {pointsName}</strong>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : null}

        <div className="loyalty-history-section">
          <div className="section-heading compact">
            <h2>Movimientos de puntos</h2>
          </div>
          {transactions.length ? (
            <div className="loyalty-history-list">
              {transactions.map((transaction) => (
                <article key={transaction.id} className={`loyalty-history-card ${transaction.kind}`}>
                  <div>
                    <strong>{getLoyaltyTransactionLabel(transaction)}</strong>
                    <span>{transaction.description || `Saldo: ${transaction.balanceAfter} ${pointsName}`}</span>
                  </div>
                  <div>
                    <em>{formatShortDate(transaction.createdAt)}</em>
                    <strong>
                      {transaction.pointsDelta > 0 ? '+' : ''}{transaction.pointsDelta} {pointsName}
                    </strong>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="loyalty-empty">Todavía no hay movimientos de puntos.</p>
          )}
        </div>
      </section>
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

    if (field === 'address' || field === 'neighborhood' || field === 'deliveryType') {
      setDeliveryQuote(null)
      setDeliveryQuoteStatus('idle')
    }
  }

  async function handleSelectDeliveryCandidate(candidate) {
    if (!candidate?.coordinates) return

    setDeliveryQuoteStatus('checking')
    try {
      const quote = await requestDeliveryQuote({
        ...orderForm,
        city: deliveryCity,
        coordinates: candidate.coordinates,
      })
      setDeliveryQuote(quote)
      setDeliveryQuoteStatus(quote?.allowed ? 'ready' : 'error')
    } catch (error) {
      setDeliveryQuote({
        enabled: true,
        allowed: false,
        fee: 0,
        message: error instanceof Error ? error.message : 'No pudimos calcular el envio.',
      })
      setDeliveryQuoteStatus('error')
    }
  }

  function handleAddRewardRedemption(reward) {
    if (orderingBlocked) {
      setLoyaltyMessage(orderingClosedMessage)
      showOrderingClosedNotice()
      return
    }

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
      const isDiscount = reward.rewardType === 'discount'

      if (existing) {
        if (isDiscount) {
          return current
        }

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
          rewardType: reward.rewardType,
          pointsCost,
          quantity: 1,
          imageUrl: reward.imageUrl,
          videoUrl: reward.videoUrl,
          discountType: reward.discountType,
          discountValue: reward.discountValue,
          discountMaxAmount: reward.discountMaxAmount,
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

      if (lineToUpdate.rewardType === 'discount' && quantity > 1) {
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
    const promosCategory = findPromosCategory(categories)

    if (promosCategory?.id) {
      handleSelectCategory(promosCategory.id)
      scrollToMenuTarget('[data-menu-categories]', 'start')
      return
    }

    if (templateId === 'almendra') {
      scrollToMenuTarget('[data-menu-categories]', 'start')
      return
    }

    scrollToMenuTarget('[data-burger-promos]', 'center')
  }

  function handleSelectCategory(categoryId) {
    const safeCategoryId = String(categoryId ?? '')

    if (!safeCategoryId) {
      return
    }

    setSelectedCategory(safeCategoryId)

    if (templateId === 'kika' || templateId === 'almendra' || templateId === 'florian' || templateId === 'sabor-pampa') {
      setSearchQuery('')
      setIsSearchOpen(false)
    }
  }

  function handleOpenLoyalty() {
    setLoyaltyPhone((current) => current || orderForm.phone)
    setLoyaltyMessage('')
    setIsLoyaltyOpen(true)
  }

  function handleOpenCommunity() {
    setIsCommunityOpen(true)
    setCommunityMessage('')
    setCommunityStatus('idle')
    setCommunityForm((current) => ({
      ...current,
      phone: current.phone || orderForm.phone || loyaltyPhone,
    }))
  }

  function updateCommunityForm(field, value) {
    setCommunityForm((current) => ({
      ...current,
      [field]: field === 'phone' ? value.replace(/[^\d+\s()-]/g, '') : value,
    }))
  }

  async function handleJoinCommunity(event) {
    event.preventDefault()

    const name = communityForm.name.trim()
    const phone = communityForm.phone.trim()
    const birthDate = communityForm.birthDate.trim()
    const phoneDigits = phone.replace(/\D/g, '')

    if (!name || !birthDate || phoneDigits.length < 8) {
      setCommunityStatus('error')
      setCommunityMessage('Completa nombre, fecha de nacimiento y celular valido.')
      return
    }

    setCommunityStatus('loading')
    setCommunityMessage('')

    try {
      const response = await fetch(`/api/accounts/${accountId}/loyalty`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          birthDate,
          phone,
        }),
      })
      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.message ?? 'No pudimos sumarte a la comunidad.')
      }

      setLoyaltyData(payload)
      setLoyaltyPhone(phone)
      setCommunityStatus('success')
      setCommunityMessage(`Listo ${name}, ya sos parte de la comunidad Kika.`)
    } catch (error) {
      setCommunityStatus('error')
      setCommunityMessage(error instanceof Error ? error.message : 'No pudimos sumarte a la comunidad.')
    }
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

    if (orderingBlocked) {
      setCheckoutStatus('error')
      setCheckoutMessage(orderingClosedMessage)
      return
    }

    if (!hasOrderItems) {
      setCheckoutMessage('Agrega productos o canjes antes de enviar el pedido.')
      return
    }

    if (cartCount === 0 && hasDiscountRedemptions) {
      setCheckoutStatus('error')
      setCheckoutMessage('Agrega productos al pedido para poder usar el descuento.')
      return
    }

    if (!isTableOrder && orderForm.deliveryType === 'delivery' && !orderForm.address.trim()) {
      setCheckoutStatus('error')
      setCheckoutMessage('Si eliges delivery, debes ingresar la direccion.')
      return
    }

    let confirmedDeliveryQuote = deliveryQuote

    if (!isTableOrder && orderForm.deliveryType === 'delivery' && deliveryZonesEnabled) {
      setCheckoutStatus('submitting')
      setCheckoutMessage('Calculando area de entrega...')

      if (deliveryQuote?.allowed === true && deliveryQuote?.coordinates) {
        confirmedDeliveryQuote = deliveryQuote
      } else {
        try {
          confirmedDeliveryQuote = await requestDeliveryQuote({
            ...orderForm,
            city: deliveryCity,
          })
          setDeliveryQuote(confirmedDeliveryQuote)
          setDeliveryQuoteStatus(confirmedDeliveryQuote?.allowed ? 'ready' : 'error')
        } catch (error) {
          setCheckoutStatus('error')
          setCheckoutMessage(error instanceof Error ? error.message : 'No pudimos calcular el envio.')
          return
        }
      }

      if (confirmedDeliveryQuote?.allowed !== true) {
        setCheckoutStatus('error')
        setCheckoutMessage(
          confirmedDeliveryQuote?.needsConfirmation
            ? 'Confirma una direccion de la lista para calcular el envio.'
            : confirmedDeliveryQuote?.message || 'La direccion esta fuera del area de entrega.',
        )
        return
      }
    }

    const rawPhone = (orderForm.phone || loyaltyPhone).trim()
    const phoneDigits = rawPhone.replace(/\D/g, '')

    if (phoneDigits.length < 8) {
      setCheckoutStatus('error')
      setCheckoutMessage('Ingresa un celular valido para confirmar el pedido.')
      return
    }

    setCheckoutStatus('submitting')
    setCheckoutMessage('')

    const effectiveDeliveryType = isTableOrder ? 'mesa' : orderForm.deliveryType
    const effectivePaymentMethod = isTableOrder ? 'mesa' : orderForm.paymentMethod
    const shouldRedirectToMercadoPago = effectivePaymentMethod === 'mercado_pago'
    const whatsappWindow = isTableOrder || shouldRedirectToMercadoPago ? null : window.open('', '_blank')

    const payload = {
      customer: {
        name: orderForm.name.trim(),
        phone: rawPhone,
        address: isTableOrder ? '' : orderForm.address.trim(),
        neighborhood: isTableOrder ? '' : orderForm.neighborhood.trim(),
        city: isTableOrder ? '' : deliveryCity,
      },
      deliveryType: effectiveDeliveryType,
      paymentMethod: effectivePaymentMethod,
      notes: isTableOrder ? '' : orderForm.notes.trim(),
      deliveryQuote: confirmedDeliveryQuote,
      mesa_id: mesaId,
      items: cartItems.map((item) => ({
        productId: item.productId || null,
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

      if (shouldRedirectToMercadoPago && !result.paymentLink) {
        throw new Error(
          result.paymentWarning ||
            'El pedido se cargo, pero no pudimos abrir Mercado Pago. El local va a coordinar el pago.',
        )
      }

      setLastOrder(result)
      setCheckoutStatus('success')
      setCheckoutMessage(`Pedido enviado. Numero #${result.orderNumber}`)
      setCart([])
      setRewardRedemptions([])
      if (shouldRedirectToMercadoPago) {
        window.location.assign(result.paymentLink)
      } else if (!isTableOrder) {
        openWhatsappOrderChat(result.customerWhatsapp?.url, whatsappWindow)
      }
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
      if (whatsappWindow && !whatsappWindow.closed) {
        whatsappWindow.close()
      }

      setCheckoutStatus('error')
      setCheckoutMessage(error instanceof Error ? error.message : 'No se pudo enviar el pedido.')
    }
  }

  const detailOptionGroups = selectedDish
    ? getTemplateProductOptionGroups(templateId, selectedDish, allItems)
    : []
  const detailIncludedGroups = getIncludedOptionGroups(detailOptionGroups)
  const detailSelectableGroups = getSelectableOptionGroups(detailOptionGroups)
  const detailExtraTotal = selectedDish
    ? calculateSelectionsExtraTotal(detailSelectableGroups, selectedOptions)
    : 0
  const detailSelectionsValid = selectedDish
    ? areSelectionsValid(detailSelectableGroups, selectedOptions)
    : true
  const detailStockBlocked = Boolean(
    selectedDish &&
      (selectedDish.availableForOrder === false ||
        (typeof selectedDish.maxQuantity === 'number' && detailQuantity > selectedDish.maxQuantity)),
  )
  const isHostDetail = templateId === 'host' && Boolean(selectedDish)
  const isKikaDetail = templateId === 'kika' && Boolean(selectedDish)
  // El planificador semanal gana sobre el template: si el producto tiene un
  // grupo de opciones por dia, elegir la semana es la experiencia principal.
  const detailWeeklyPlanDays = selectedDish ? getWeeklyPlanDays(detailSelectableGroups) : []
  const isWeeklyPlanDetail = detailWeeklyPlanDays.length >= 2
  const weeklyPlanMissingDays = detailWeeklyPlanDays.filter(
    (entry) => entry.group.required && !getDaySelectedValues(entry.group, selectedOptions).length,
  )
  // Si el pack no tiene ningun dia obligatorio, igual hay que elegir al menos
  // una vianda: sin esto se podia mandar a la cocina un pack vacio de $0.
  const weeklyPlanIsEmpty =
    isWeeklyPlanDetail &&
    detailWeeklyPlanDays.every(
      (entry) => !getDaySelectedValues(entry.group, selectedOptions).length,
    )
  const showSaborPampaDetailBulkActions =
    templateId === 'sabor-pampa' && shouldShowSaborPampaBulkActions(selectedDish)
  const detailHasHeroMedia = hasProductMedia(selectedDish)
  const socialLinks = getMenuSocialLinks(presentation)
  const appClassName = [
    'menu-app',
    `account-${slugify(accountId)}`,
    `template-${templateId}`,
    `layout-${presentation.layout}`,
    `cards-${presentation.cards?.style ?? 'editorial-list'}`,
    `theme-${presentation.theme.id}`,
  ].join(' ')

  function renderIncludedProductsBlock() {
    if (!detailIncludedGroups.length) {
      return null
    }

    return detailIncludedGroups.map((group) => (
      <div key={group.id} className="option-group included-option-group">
        <h3>{group.title || 'Incluye'}</h3>
        <p>Incluido en esta promo</p>
        <div className="option-grid">
          {group.options.map((rawOption) => {
            const option = normalizeOptionEntry(rawOption)
            const optionMedia = renderDetailOptionMedia(option, presentation)

            return (
              <div
                key={option.value}
                className={`option-card selected ${optionMedia ? 'has-media' : ''}`}
              >
                {optionMedia ? optionMedia : null}
                <span className="option-label">{option.label}</span>
                <small className="option-price">
                  {option.quantity > 1 ? `${option.quantity} unidades` : 'Incluido'}
                </small>
              </div>
            )
          })}
        </div>
      </div>
    ))
  }

  if (status === 'loading') {
    return <MenuLoadingScreen accountId={accountId} />
  }

  if (menu?.table_experience_enabled && mesaId) {
    if (qrLandingView === 'landing') {
      return (
        <QRLanding 
          accountId={accountId}
          mesaId={mesaId}
          restaurantName={menu.accountName}
          logoUrl={presentation?.branding?.logo}
          welcomeText={menu.table_welcome_text}
          primaryColor={presentation?.branding?.primaryColor}
          qrBackgroundUrl={menu.qr_background_url}
          reviewGoogleUrl={menu.review_google_url}
          onVerMenu={() => setQrLandingView('menu')}
          onPagarCuenta={() => setQrLandingView('bill')}
          onDejarCalificacion={() => setQrLandingView('feedback')}
        />
      )
    }

    if (qrLandingView === 'bill') {
      return (
        <QRBill
          accountId={accountId}
          mesaId={mesaId}
          restaurantName={menu.accountName}
          logoUrl={presentation?.branding?.logo}
          primaryColor={presentation?.branding?.primaryColor}
          onBack={() => setQrLandingView('landing')}
          onFeedback={() => setQrLandingView('feedback')}
        />
      )
    }

    if (qrLandingView === 'feedback') {
      return (
        <QRFeedback
          accountId={accountId}
          mesaId={mesaId}
          restaurantName={menu.accountName}
          primaryColor={presentation?.branding?.primaryColor}
          onClose={() => setQrLandingView('landing')}
        />
      )
    }
  }

  return (
    <>
      <div className="app-shell">
        <div className={`phone-surface ${appClassName}`} style={getPresentationStyles(presentation, accountId)}>
          <header className={`hero hero-${templateId}`} data-menu-hero>
            <div className="hero-topbar">
              <button
                type="button"
                className="icon-button"
                aria-label="Abrir redes del negocio"
                onClick={() => setIsSocialMenuOpen(true)}
              >
                <IconMenu />
              </button>

              {!isHostLikeAccount(accountId, templateId) && templateId !== 'kika' && templateId !== 'florian' ? (
                <button
                  type="button"
                  className="cart-button"
                  aria-label="Ver pedido"
                  onClick={() => setIsCartOpen(true)}
                >
                  <IconCart />
                  {orderCount > 0 || templateId === 'almendra' ? <span className="cart-badge">{orderCount}</span> : null}
                </button>
              ) : (
                <span className="hero-topbar-spacer" aria-hidden="true" />
              )}
            </div>

            {templateId !== 'gelato' &&
            templateId !== 'pizzeria' &&
            templateId !== 'burger' &&
            templateId !== 'blue-burger' &&
            templateId !== 'host' &&
            templateId !== 'kika' &&
            templateId !== 'almendra' &&
            templateId !== 'florian' &&
            templateId !== 'sabor-pampa' ? (
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
              onCommunityAction={handleOpenCommunity}
            />
          </header>

          <main className="content-panel">
            {status === 'error' ? (
              <section className="state-panel">
                <p>{errorMessage}</p>
                <span>Revisa la cuenta o intenta nuevamente.</span>
              </section>
            ) : null}

            {status === 'ready' && orderingBlocked ? (
              <section className="closed-order-banner" role="status" aria-live="polite">
                <div>
                  <strong>Estamos cerrados ahora</strong>
                  <p>Podes mirar el menu, pero los pedidos se habilitan en horario de atencion.</p>
                </div>
                <span>
                  {orderingStatus.nextOpenText ||
                    (orderingStatus.scheduleText ? `Hoy: ${orderingStatus.scheduleText}` : 'Pedidos pausados')}
                </span>
              </section>
            ) : null}

            {status === 'ready' ? (
              <>
                {templateId === 'pizzeria' ||
                templateId === 'burger' ||
                templateId === 'host' ||
                templateId === 'kika' ||
                templateId === 'almendra' ||
                templateId === 'florian' ||
                templateId === 'sabor-pampa' ? (
                  <div data-menu-categories>
                    <TemplateCategorySelector
                      accountId={accountId}
                      templateId={templateId}
                      categories={categories}
                      currentCategory={currentCategory}
                      onSelectCategory={handleSelectCategory}
                      searchQuery={searchQuery}
                      onSearchQueryChange={setSearchQuery}
                      isSearchOpen={isSearchOpen}
                      onOpenSearch={() => setIsSearchOpen(true)}
                      onCloseSearch={() => setIsSearchOpen(false)}
                    />
                  </div>
                ) : null}

                {templateId !== 'gelato' &&
                templateId !== 'pizzeria' &&
                templateId !== 'burger' &&
                templateId !== 'blue-burger' &&
                templateId !== 'host' &&
                templateId !== 'kika' &&
                templateId !== 'almendra' &&
                templateId !== 'florian' &&
                templateId !== 'sabor-pampa' ? (
                  <section className="section-block" data-section="categories">
                    <div className="section-heading">
                      <h2>Categorias</h2>
                      <button type="button">Ver todas</button>
                    </div>

                    <TemplateCategorySelector
                      templateId={templateId}
                      categories={categories}
                      currentCategory={currentCategory}
                      onSelectCategory={handleSelectCategory}
                    />
                  </section>
                ) : null}

                <TemplateMenuCollection
                  accountId={accountId}
                  templateId={templateId}
                  categories={categories}
                  currentCategory={currentCategory}
                  categoryItems={visibleCategoryItems}
                  presentation={presentation}
                  renderProductMedia={renderProductMedia}
                  onOpenDish={handleOpenDish}
                  onAddItem={handleAddItem}
                  onSelectCategory={handleSelectCategory}
                  onOpenCart={() => setIsCartOpen(true)}
                  onOpenLoyalty={handleOpenLoyalty}
                  onOpenCommunity={handleOpenCommunity}
                  onOpenSocialMenu={() => setIsSocialMenuOpen(true)}
                  onNavigateHome={handleNavigateHome}
                  onNavigatePromos={handleNavigatePromos}
                  gelatoFormats={gelatoFormats}
                  onOpenGelatoBuilder={handleOpenGelatoBuilder}
                  searchQuery={deferredSearchQuery}
                  isSearchActive={isSearchActive}
                  loyaltySettings={loyaltySettings}
                  pointsName={pointsName}
                  orderCount={orderCount}
                  currencySymbol={currencySymbol}
                />
              </>
            ) : null}
          </main>

          {templateId !== 'gelato' &&
          templateId !== 'burger' &&
          templateId !== 'blue-burger' &&
          templateId !== 'host' &&
          templateId !== 'kika' &&
          templateId !== 'almendra' &&
          templateId !== 'florian' &&
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

          <SocialMenuDrawer
            open={isSocialMenuOpen}
            links={socialLinks}
            accountName={presentation.branding?.wordmark ?? menu?.accountName}
            onClose={() => setIsSocialMenuOpen(false)}
          />
        </div>
      </div>

      {cartFeedback ? (
        <div
          key={cartFeedback.id}
          className={`cart-added-toast ${
            templateId === 'burger' || templateId === 'host'
              ? 'cart-added-toast-burger'
              : templateId === 'kika'
                ? 'cart-added-toast-kika'
                : ''
          }`}
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

      {orderingNotice ? (
        <div
          className={`ordering-closed-toast ${templateId === 'burger' || templateId === 'host' ? 'ordering-closed-toast-dark' : ''}`}
          role="status"
          aria-live="polite"
        >
          <strong>Pedidos pausados</strong>
          <p>{orderingNotice}</p>
        </div>
      ) : null}

      <InstallAppPrompt
        open={pwaPromptEnabled && installPromptOpen}
        accountName={menu?.accountName ?? presentation.branding?.wordmark ?? accountId}
        loyaltyEnabled={Boolean(loyaltySettings?.enabled)}
        platform={installPlatform}
        canInstall={Boolean(installPromptEvent)}
        showSteps={installStepsOpen}
        style={getPresentationStyles(presentation, accountId)}
        onInstall={handleInstallApp}
        onClose={handleCloseInstallPrompt}
      />

      {templateId === 'gelato' && gelatoBuilderOpen ? (
        <div className="detail-screen" role="presentation" onClick={() => setGelatoBuilderOpen(false)}>
          <div
            className={`detail-phone ${appClassName}`}
            style={getPresentationStyles(presentation, accountId)}
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
            style={getPresentationStyles(presentation, accountId)}
            onClick={(event) => event.stopPropagation()}
          >
            {isWeeklyPlanDetail ? (
              <WeeklyPlanDetail
                dish={selectedDish}
                days={detailWeeklyPlanDays}
                selections={selectedOptions}
                onSelectOption={handleSelectDetailOption}
                currencySymbol={currencySymbol}
                extraTotal={detailExtraTotal}
                quantity={detailQuantity}
                onQuantityChange={setDetailQuantity}
                onClose={() => setSelectedDish(null)}
                addDisabled={
                  !detailSelectionsValid || weeklyPlanIsEmpty || orderingBlocked || detailStockBlocked
                }
                addLabel={
                  orderingBlocked
                    ? 'Pedidos cerrados'
                    : detailStockBlocked
                      ? 'Sin stock'
                      : weeklyPlanIsEmpty
                        ? 'Elegi al menos una vianda'
                        : detailSelectionsValid
                          ? 'Agregar al pedido'
                          : weeklyPlanMissingDays.length === 1
                            ? `Falta el ${weeklyPlanMissingDays[0].weekday.label.toLowerCase()}`
                            : `Faltan ${weeklyPlanMissingDays.length} dias`
                }
                onAdd={() => {
                  handleAddItem(selectedDish, detailQuantity, {
                    summary: buildSelectionSummary(detailSelectableGroups, selectedOptions),
                    unitPrice:
                      (selectedDish.unitPrice ?? toNumericPrice(selectedDish.price)) + detailExtraTotal,
                  })
                  setSelectedDish(null)
                }}
              />
            ) : isKikaDetail ? (
              <>
                <section className="kika-detail-hero">
                  <KikaDetailHeroVisual dish={selectedDish} presentation={presentation} />

                  <div className="kika-detail-topbar">
                    <button
                      type="button"
                      className="kika-detail-floating"
                      onClick={() => setSelectedDish(null)}
                      aria-label="Volver"
                    >
                      <IconBack />
                    </button>
                    <button type="button" className="kika-detail-floating" aria-label="Favorito">
                      <IconHeart />
                    </button>
                  </div>

                  <div className="kika-detail-intro">
                    <span className="kika-detail-logo">
                      <strong>KIKA</strong>
                      <small>CAFÉ</small>
                    </span>
                    <h2>{selectedDish.name}</h2>
                    <p>{selectedDish.description || getKikaDetailDescription(selectedDish)}</p>
                    <strong className="kika-detail-price">
                      {formatPrice(
                        selectedDish.unitPrice ?? toNumericPrice(selectedDish.price),
                        currencySymbol,
                      )}
                    </strong>
                    {getProductLoyaltyPoints(selectedDish, loyaltySettings) > 0 ? (
                      <span className="kika-detail-points">
                        +{getProductLoyaltyPoints(selectedDish, loyaltySettings)} {pointsName}
                      </span>
                    ) : null}
                  </div>

                  <div className="quantity-stepper kika-detail-stepper">
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
                </section>

                <section className="kika-detail-sheet">
                  <div className="kika-detail-wave" aria-hidden="true">
                    <span />
                  </div>

                  <section className="kika-detail-section kika-detail-description-block">
                    <h3>
                      <IconKikaLeaf />
                      <span>Descripción</span>
                    </h3>
                    <p>{getKikaDetailDescription(selectedDish)}</p>
                  </section>

                  {detailSelectableGroups
                    .filter((group) => group.display !== 'select')
                    .map((group) => (
                      <section key={group.id} className="kika-detail-section">
                        <h3>{group.title}</h3>
                        <div className="kika-addon-row">
                          {group.options.map((rawOption) => {
                            const option = normalizeOptionEntry(rawOption)
                            const selectedValue = selectedOptions[group.id]
                            const isSelected = Array.isArray(selectedValue)
                              ? selectedValue.includes(option.value)
                              : selectedValue === option.value

                            return (
                              <button
                                key={option.value}
                                type="button"
                                className={`kika-addon-option ${isSelected ? 'selected' : ''}`}
                                onClick={() => handleSelectDetailOption(group, option.value)}
                              >
                                <span className="kika-addon-icon">{getKikaOptionIcon(option.label)}</span>
                                <span>{option.label}</span>
                                {isSelected ? <em aria-hidden="true">✓</em> : null}
                              </button>
                            )
                          })}
                        </div>
                      </section>
                    ))}

                  {detailSelectableGroups.some((group) => group.display === 'select') ? (
                    <section className="kika-detail-section">
                      <h3>Personaliza tu bebida</h3>
                      <div className="kika-select-grid">
                        {detailSelectableGroups
                          .filter((group) => group.display === 'select')
                          .map((group) => (
                            <label key={group.id} className="kika-select-field">
                              <span>{group.title}</span>
                              <select
                                value={selectedOptions[group.id] ?? ''}
                                onChange={(event) => handleSelectDetailOption(group, event.target.value)}
                              >
                                <option value="" disabled>
                                  Elegi una opcion
                                </option>
                                {group.options.map((rawOption) => {
                                  const option = normalizeOptionEntry(rawOption)

                                  return (
                                    <option key={option.value} value={option.value}>
                                      {option.label}
                                    </option>
                                  )
                                })}
                              </select>
                            </label>
                          ))}
                      </div>
                    </section>
                  ) : null}

                  <article className="kika-detail-note-card">
                    <IconKikaLeaf />
                    <span>Todos nuestros cafés son elaborados con granos de especialidad.</span>
                  </article>

                  {!detailSelectionsValid ? (
                    <p className="detail-note">Completa los opcionales obligatorios antes de agregar este producto.</p>
                  ) : null}

                  <button
                    type="button"
                    className="kika-detail-add"
                    disabled={!detailSelectionsValid || orderingBlocked || detailStockBlocked}
                    onClick={() => {
                      handleAddItem(selectedDish, detailQuantity, {
                        summary: buildSelectionSummary(detailSelectableGroups, selectedOptions),
                        unitPrice:
                          (selectedDish.unitPrice ?? toNumericPrice(selectedDish.price)) + detailExtraTotal,
                      })
                      setSelectedDish(null)
                    }}
                  >
                    <span>{orderingBlocked ? 'Pedidos cerrados' : detailStockBlocked ? 'Sin stock' : 'Agregar al pedido'}</span>
                    <strong>
                      {formatPrice(
                        ((selectedDish.unitPrice ?? toNumericPrice(selectedDish.price)) + detailExtraTotal) *
                          detailQuantity,
                        currencySymbol,
                      )}
                    </strong>
                  </button>
                </section>

                <nav className="kika-bottom-nav kika-detail-bottom-nav" aria-label="Navegacion del menu Kika">
                  <button type="button" className="active" onClick={() => setSelectedDish(null)}>
                    <IconHome />
                    <span>Inicio</span>
                  </button>
                  <button type="button" onClick={() => setSelectedDish(null)}>
                    <IconKikaBook />
                    <span>Menu</span>
                  </button>
                  <button
                    type="button"
                    className={orderCount > 0 ? 'has-order' : ''}
                    onClick={() => setIsCartOpen(true)}
                  >
                    <IconKikaBag />
                    {orderCount > 0 ? <strong className="kika-nav-badge">{orderCount}</strong> : null}
                    <span>Pedidos</span>
                  </button>
                  <button type="button" onClick={handleOpenLoyalty}>
                    <IconAward />
                    <span>Premios</span>
                  </button>
                  <button type="button" onClick={() => setIsSocialMenuOpen(true)}>
                    <IconKikaUsers />
                    <span>Nosotros</span>
                  </button>
                </nav>
              </>
            ) : isHostDetail ? (
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
                      <img
                        src={selectedDish.image}
                        alt={selectedDish.name}
                        className={getImageAnimationClass(selectedDish)}
                      />
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
                          <span aria-hidden="true">+</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {renderIncludedProductsBlock()}

                  {detailSelectableGroups.map((group, index) => (
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
                {detailHasHeroMedia ? (
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
                      <img
                        src={selectedDish.image}
                        alt={selectedDish.name}
                        className={getImageAnimationClass(selectedDish)}
                      />
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
                ) : null}

                <section className={`detail-sheet ${detailHasHeroMedia ? '' : 'no-hero'}`}>
                  {!detailHasHeroMedia ? (
                    <div className="detail-topbar detail-topbar-inline">
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
                  ) : null}
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

                  {renderIncludedProductsBlock()}

                  {detailSelectableGroups.map((group) => (
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
                              <span className="option-label">{option.label}</span>
                              {Number(option.price || 0) > 0 ? (
                                <small className="option-price">
                                  {formatPrice(Number(option.price || 0), currencySymbol)}
                                </small>
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

                  {showSaborPampaDetailBulkActions ? (
                    <div className="pampa-detail-bulk-actions" aria-label="Agregar por docena">
                      <button
                        type="button"
                        disabled={!detailSelectionsValid || orderingBlocked || detailStockBlocked}
                        onClick={() => {
                          handleAddItem(selectedDish, 6, {
                            summary: buildSelectionSummary(detailSelectableGroups, selectedOptions),
                            unitPrice:
                              (selectedDish.unitPrice ?? toNumericPrice(selectedDish.price)) + detailExtraTotal,
                          })
                          setSelectedDish(null)
                        }}
                      >
                        <span>Media docena</span>
                        <strong>+6</strong>
                      </button>
                      <button
                        type="button"
                        disabled={!detailSelectionsValid || orderingBlocked || detailStockBlocked}
                        onClick={() => {
                          handleAddItem(selectedDish, 12, {
                            summary: buildSelectionSummary(detailSelectableGroups, selectedOptions),
                            unitPrice:
                              (selectedDish.unitPrice ?? toNumericPrice(selectedDish.price)) + detailExtraTotal,
                          })
                          setSelectedDish(null)
                        }}
                      >
                        <span>Docena</span>
                        <strong>+12</strong>
                      </button>
                    </div>
                  ) : null}

                  <button
                    type="button"
                    className="primary-action"
                    disabled={!detailSelectionsValid || orderingBlocked || detailStockBlocked}
                    onClick={() => {
                      handleAddItem(selectedDish, detailQuantity, {
                        summary: buildSelectionSummary(detailSelectableGroups, selectedOptions),
                        unitPrice:
                          (selectedDish.unitPrice ?? toNumericPrice(selectedDish.price)) + detailExtraTotal,
                      })
                      setSelectedDish(null)
                    }}
                  >
                    <span>{orderingBlocked ? 'Pedidos cerrados' : detailStockBlocked ? 'Sin stock' : 'Agregar al pedido'}</span>
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
                        <article
                          key={item.id}
                          className={`mini-card ${item.video || item.hasCustomImage ? '' : 'no-media'}`}
                        >
                          {renderMiniCardMedia(item)}

                          <div className="mini-card-body">
                            <h4>{item.name}</h4>
                            {item.categoryLabel ? <p className="mini-card-category">{item.categoryLabel}</p> : null}
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

            {(!isHostDetail && !isKikaDetail && !isWeeklyPlanDetail && (templateId !== 'pizzeria' || hasOrderItems)) ? (
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
                  disabled={!detailSelectionsValid || orderingBlocked || detailStockBlocked}
                  onClick={() => {
                    handleAddItem(selectedDish, detailQuantity, {
                      summary: buildSelectionSummary(detailSelectableGroups, selectedOptions),
                      unitPrice:
                        (selectedDish.unitPrice ?? toNumericPrice(selectedDish.price)) + detailExtraTotal,
                    })
                    setSelectedDish(null)
                  }}
                >
                  <IconCart />
                  <span>{orderingBlocked ? 'Pedidos cerrados' : detailStockBlocked ? 'Sin stock' : 'Agregar al carrito'}</span>
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
            style={getPresentationStyles(presentation, accountId)}
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
                            <span aria-hidden="true">-</span>
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => handleSetItemQuantity(item.lineId, item.quantity + 1)}
                          >
                            <span aria-hidden="true">+</span>
                          </button>
                        </div>
                      </div>
                    ))}
                    {rewardRedemptions.map((item) => (
                      <div key={item.rewardId} className="checkout-item checkout-item-redemption">
                        <div>
                          <strong>{item.title}</strong>
                          <span>
                            {item.rewardType === 'discount'
                              ? `Descuento: -${formatPrice(calculateRedemptionDiscountTotal([item], cartSubtotal), currencySymbol)}`
                              : `Canje: ${item.pointsCost} ${pointsName} c/u`}
                          </span>
                        </div>
                        <div className="checkout-item-controls">
                          <button
                            type="button"
                            onClick={() => handleSetRewardQuantity(item.rewardId, item.quantity - 1)}
                          >
                            <span aria-hidden="true">-</span>
                          </button>
                          <span>{item.quantity}</span>
                          {item.rewardType === 'discount' ? null : (
                            <button
                              type="button"
                              onClick={() => handleSetRewardQuantity(item.rewardId, item.quantity + 1)}
                            >
                              <span aria-hidden="true">+</span>
                            </button>
                          )}
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
                          <article
                            key={item.id}
                            className={`mini-card ${item.video || item.hasCustomImage ? '' : 'no-media'}`}
                          >
                            {renderMiniCardMedia(item)}
                            <div className="mini-card-body">
                              <h4>{item.name}</h4>
                              {item.categoryLabel ? <p className="mini-card-category">{item.categoryLabel}</p> : null}
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

                  {cartExtraSections.map((section) => (
                    <section key={section.key} className="cart-panel">
                      <div className="section-heading compact">
                        <h2>{section.title}</h2>
                      </div>
                      <div className="recommendation-row recommendation-row-2 pairing-mini-row">
                        {section.items.map(({ label, product }) => {
                          const isAdded = pairingFeedbackId === product.id

                          return (
                            <article
                              key={product.id}
                              className={`mini-card pairing-mini-card ${product.video || product.hasCustomImage ? '' : 'no-media'} ${isAdded ? 'is-added' : ''}`}
                            >
                              {renderMiniCardMedia(product)}
                              <div className="mini-card-body">
                                <h4>{product.name || label}</h4>
                                {product.categoryLabel ? <p className="mini-card-category">{product.categoryLabel}</p> : null}
                                <div className="mini-card-footer">
                                  <strong>{product.price}</strong>
                                  <button
                                    type="button"
                                    className="mini-add"
                                    onClick={() => handleAddPairing(product)}
                                    aria-label={`Agregar ${product.name}`}
                                  >
                                    <IconPlus />
                                  </button>
                                </div>
                              </div>
                            </article>
                          )
                        })}
                      </div>
                    </section>
                  ))}

                  <div className="cart-summary-card">
                    <div>
                      <span>Total actual</span>
                      {redemptionPointsTotal > 0 ? (
                        <small>
                          Canje: {redemptionPointsTotal} {pointsName}
                        </small>
                      ) : null}
                      {redemptionDiscountTotal > 0 ? (
                        <small>Descuento: -{formatPrice(redemptionDiscountTotal, currencySymbol)}</small>
                      ) : null}
                  {selectedDeliveryFee > 0 ? (
                    <small>Envio: +{formatPrice(selectedDeliveryFee, currencySymbol)}</small>
                  ) : null}
                  {deliveryZonesEnabled && orderForm.deliveryType === 'delivery' && deliveryQuote?.zone?.name ? (
                    <small>Zona: {deliveryQuote.zone.name}</small>
                  ) : null}
                  {paymentSurchargeAmount > 0 ? (
                    <small>
                      Recargo {getPaymentSurchargeLabel(orderForm.paymentMethod)} ({paymentSurchargePercent}%): +
                      {formatPrice(paymentSurchargeAmount, currencySymbol)}
                    </small>
                  ) : null}
                      {loyaltyEarnPreviewText ? <small>{loyaltyEarnPreviewText}</small> : null}
                    </div>
                    <strong>{formatPrice(orderTotal, currencySymbol)}</strong>
                  </div>

                  {orderingBlocked ? (
                    <p className="checkout-message error">{orderingClosedMessage}</p>
                  ) : null}

                  <button
                    type="button"
                    className="primary-action"
                    disabled={orderingBlocked}
                    onClick={() => {
                      if (orderingBlocked) {
                        showOrderingClosedNotice()
                        return
                      }

                      setIsCartOpen(false)
                      setIsCheckoutOpen(true)
                    }}
                  >
                    <span>{orderingBlocked ? 'Pedidos cerrados' : 'Continuar con tus datos'}</span>
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
            style={getPresentationStyles(presentation, accountId)}
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
                  <h2>{isTableOrder ? 'Confirmar en mesa' : 'Confirmar pedido'}</h2>
                  <p>
                    {isTableOrder
                      ? 'Solo necesitamos tus datos para identificar el pedido en el local.'
                      : 'Completa tus datos para terminar el pedido.'}
                  </p>
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
                        <span aria-hidden="true">-</span>
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => handleSetItemQuantity(item.lineId, item.quantity + 1)}
                      >
                        <span aria-hidden="true">+</span>
                      </button>
                    </div>
                  </div>
                ))}
                {rewardRedemptions.map((item) => (
                  <div key={item.rewardId} className="checkout-item checkout-item-redemption">
                    <div>
                      <strong>{item.title}</strong>
                      <span>
                        {item.rewardType === 'discount'
                          ? `Descuento: -${formatPrice(calculateRedemptionDiscountTotal([item], cartSubtotal), currencySymbol)}`
                          : `Canje: ${item.pointsCost} ${pointsName} c/u`}
                      </span>
                    </div>
                    <div className="checkout-item-controls">
                      <button
                        type="button"
                        onClick={() => handleSetRewardQuantity(item.rewardId, item.quantity - 1)}
                      >
                        <span aria-hidden="true">-</span>
                      </button>
                      <span>{item.quantity}</span>
                      {item.rewardType === 'discount' ? null : (
                        <button
                          type="button"
                          onClick={() => handleSetRewardQuantity(item.rewardId, item.quantity + 1)}
                        >
                          <span aria-hidden="true">+</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {hasOrderItems ? (
                <div className="cart-summary-card checkout-points-summary">
                  <div>
                    <span>Total actual</span>
                    {redemptionPointsTotal > 0 ? (
                      <small>
                        Canje: {redemptionPointsTotal} {pointsName}
                      </small>
                    ) : null}
                    {redemptionDiscountTotal > 0 ? (
                      <small>Descuento: -{formatPrice(redemptionDiscountTotal, currencySymbol)}</small>
                    ) : null}
                    {selectedDeliveryFee > 0 ? (
                      <small>Envio: +{formatPrice(selectedDeliveryFee, currencySymbol)}</small>
                    ) : null}
                    {paymentSurchargeAmount > 0 ? (
                      <small>
                        Recargo {getPaymentSurchargeLabel(orderForm.paymentMethod)} ({paymentSurchargePercent}%): +
                        {formatPrice(paymentSurchargeAmount, currencySymbol)}
                      </small>
                    ) : null}
                    {loyaltyEarnPreviewText ? <small>{loyaltyEarnPreviewText}</small> : null}
                  </div>
                  <strong>{formatPrice(orderTotal, currencySymbol)}</strong>
                </div>
              ) : null}

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
                    inputMode="tel"
                    required
                  />
                </label>

                {!isTableOrder ? (
                  <>
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
                          {!hideNeighborhoodField ? (
                            <label className="checkout-field">
                              <span>Barrio</span>
                              <input
                                value={orderForm.neighborhood}
                                onChange={(event) => updateOrderForm('neighborhood', event.target.value)}
                                placeholder="Barrio"
                              />
                            </label>
                          ) : null}
                          {deliveryCity ? (
                            <div className="checkout-city-note">
                              <span>Ciudad del local</span>
                              <strong>{deliveryProvince ? `${deliveryCity}, ${deliveryProvince}` : deliveryCity}</strong>
                            </div>
                          ) : null}
                        </div>
                        {deliveryZonesEnabled ? (
                          <div className={`delivery-zone-feedback ${deliveryQuote?.allowed ? 'success' : 'error'}`}>
                            <strong>
                              {deliveryQuoteStatus === 'checking'
                                ? 'Calculando zona de entrega...'
                                : deliveryQuote?.allowed
                                  ? `${deliveryQuote.zone?.name || 'Zona habilitada'} - Envio ${formatPrice(Number(deliveryQuote.fee || 0), currencySymbol)}`
                                  : deliveryQuote?.message || 'Ingresa tu direccion para validar el area de entrega.'}
                            </strong>
                            <span>
                              {deliveryQuote?.allowed
                                ? 'El pedido esta dentro del area de entrega.'
                                : 'Si queda fuera de zona, podes elegir retiro por el local.'}
                            </span>
                            {deliveryQuote?.needsConfirmation && Array.isArray(deliveryQuote.candidates) && deliveryQuote.candidates.length > 0 ? (
                              <div className="delivery-address-options">
                                {deliveryQuote.candidates.map((candidate) => (
                                  <button
                                    type="button"
                                    key={candidate.id}
                                    onClick={() => handleSelectDeliveryCandidate(candidate)}
                                  >
                                    <span>{candidate.label}</span>
                                    <small>
                                      {candidate.allowed
                                        ? `${candidate.zone?.name || 'Zona habilitada'} - ${formatPrice(Number(candidate.fee || 0), currencySymbol)}`
                                        : 'Fuera del area'}
                                    </small>
                                  </button>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        ) : null}
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
                  </>
                ) : null}

                {checkoutMessage ? <p className={`checkout-message ${checkoutStatus}`}>{checkoutMessage}</p> : null}
                {orderingBlocked ? <p className="checkout-message error">{orderingClosedMessage}</p> : null}
                {lastOrder ? <p className="checkout-message success">Ultimo pedido confirmado: #{lastOrder.orderNumber}</p> : null}

                <button
                  type="submit"
                  className="primary-action"
                  disabled={checkoutStatus === 'submitting' || orderingBlocked || deliveryZoneBlocksCheckout}
                >
                  <span>
                    {orderingBlocked
                      ? 'Pedidos cerrados'
                      : checkoutStatus === 'submitting'
                        ? 'Enviando pedido...'
                        : 'Enviar pedido'}
                  </span>
                  <strong>{orderTotalLabel}</strong>
                </button>
              </form>
            </section>
          </div>
        </div>
      ) : null}

      {isCommunityOpen ? (
        <div className="detail-screen" role="presentation" onClick={() => setIsCommunityOpen(false)}>
          <div
            className={`detail-phone ${appClassName}`}
            style={getPresentationStyles(presentation, accountId)}
            onClick={(event) => event.stopPropagation()}
          >
            <section className="checkout-sheet loyalty-sheet kika-community-sheet">
              <div className="checkout-head kika-community-head">
                <button
                  type="button"
                  className="floating-button light"
                  onClick={() => setIsCommunityOpen(false)}
                  aria-label="Cerrar comunidad"
                >
                  <IconBack />
                </button>
                <div className="kika-community-hero">
                  <span className="kika-community-eyebrow">Programa de puntos</span>
                  <h2>{templateId === 'almendra' ? 'Comunidad Almendra' : 'Comunidad Kika'}</h2>
                  <p>
                    {templateId === 'almendra'
                      ? 'Sumate gratis, acumulá puntos con cada compra y canjealos por premios y experiencias.'
                      : 'Sumate gratis, acumulá puntos con cada compra y canjealos por beneficios pensados para vos.'}
                  </p>
                  <div className="kika-community-score">
                    <strong>1 compra</strong>
                    <span>= más puntos para tu próximo mimo</span>
                  </div>
                </div>
              </div>

              <div
                className="kika-community-benefits"
                aria-label={templateId === 'almendra' ? 'Beneficios de Comunidad Almendra' : 'Beneficios de Comunidad Kika'}
              >
                <article>
                  <IconAward />
                  <div>
                    <strong>Sumás puntos</strong>
                    <span>Cada pedido te acerca a nuevas recompensas.</span>
                  </div>
                </article>
                <article>
                  <IconHeart />
                  <div>
                    <strong>Beneficios exclusivos</strong>
                    <span>Promos, regalos y sorpresas para la comunidad.</span>
                  </div>
                </article>
                <article>
                  <IconSpark />
                  <div>
                    <strong>Cumple especial</strong>
                    <span>Tu fecha nos ayuda a prepararte algo lindo.</span>
                  </div>
                </article>
              </div>

              <form className="checkout-form loyalty-form kika-community-form" onSubmit={handleJoinCommunity}>
                <div className="kika-community-form-title">
                  <strong>Dejanos tus datos</strong>
                  <span>Solo necesitamos esto para activar tu cuenta.</span>
                </div>

                <label className="checkout-field">
                  <span>Nombre</span>
                  <input
                    value={communityForm.name}
                    onChange={(event) => updateCommunityForm('name', event.target.value)}
                    placeholder="Tu nombre"
                    autoComplete="given-name"
                    required
                  />
                </label>

                <label className="checkout-field">
                  <span>Fecha de nacimiento</span>
                  <input
                    type="date"
                    value={communityForm.birthDate}
                    onChange={(event) => updateCommunityForm('birthDate', event.target.value)}
                    required
                  />
                </label>

                <label className="checkout-field">
                  <span>Celular</span>
                  <input
                    value={communityForm.phone}
                    onChange={(event) => updateCommunityForm('phone', event.target.value)}
                    placeholder="549..."
                    inputMode="tel"
                    autoComplete="tel"
                    required
                  />
                </label>

                {communityMessage ? (
                  <p className={`checkout-message ${communityStatus}`}>{communityMessage}</p>
                ) : null}

                <button
                  type="submit"
                  className="primary-action"
                  disabled={communityStatus === 'loading'}
                >
                  <span>{communityStatus === 'loading' ? 'Sumando...' : 'Sumarme'}</span>
                  <strong>
                    <IconAward />
                  </strong>
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
            style={getPresentationStyles(presentation, accountId)}
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
                  <h2>
                    {templateId === 'kika'
                      ? 'Premios Kika'
                      : templateId === 'almendra'
                        ? 'Premios Almendra'
                        : 'Mis puntos'}
                  </h2>
                  <p>
                    {templateId === 'kika' || templateId === 'almendra'
                      ? 'Ingresá tu celular, consultá tus puntos y canjeá premios disponibles.'
                      : 'Ingresa tu celular y consulta el saldo acumulado en este menu.'}
                  </p>
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
                  <span>
                    {loyaltyStatus === 'loading'
                      ? 'Consultando...'
                      : templateId === 'kika' || templateId === 'almendra'
                        ? 'Ver premios'
                        : 'Consultar puntos'}
                  </span>
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

                      {renderLoyaltyCustomerProfile()}

                      {loyaltyData.rewards?.length ? (
                        <section className="cart-panel">
                          <div className="section-heading compact">
                            <h2>{templateId === 'kika' || templateId === 'almendra' ? 'Premios para canjear' : 'Canjes disponibles'}</h2>
                          </div>
                          <div className="loyalty-reward-list">
                            {loyaltyData.rewards.map((reward) => {
                              const selectedReward = rewardRedemptions.find(
                                (line) => line.rewardId === reward.id,
                              )
                              const isDiscountReward = reward.rewardType === 'discount'
                              const selectedPoints =
                                redemptionPointsTotal - (selectedReward?.pointsCost ?? 0) * (selectedReward?.quantity ?? 0)
                              const canAdd =
                                reward.redeemable &&
                                (!isDiscountReward || !selectedReward) &&
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
                                      {reward.rewardType === 'discount'
                                        ? `${reward.discountType === 'fixed'
                                            ? formatPrice(reward.discountValue, currencySymbol)
                                            : `${reward.discountValue}%`} OFF · ${reward.pointsCost} ${loyaltyData.settings?.pointsName ?? 'puntos'}`
                                        : `${reward.pointsCost} ${loyaltyData.settings?.pointsName ?? 'puntos'}`}
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
              ) : templateId === 'sabor-pampa' ? (
                <div className="confirmation-pampa-top">
                  <span className="confirmation-pampa-seal">
                    <IconEmpanada />
                  </span>
                  <div>
                    <strong>sabor a pampa</strong>
                    <small>Pedido casero confirmado</small>
                  </div>
                </div>
              ) : templateId === 'kika' || templateId === 'almendra' ? (
                <div className="confirmation-kika-top">
                  <span className="confirmation-kika-seal">
                    {templateId === 'almendra' ? <IconAlmendraMark /> : <IconKikaCup />}
                  </span>
                  <div>
                    <strong>{templateId === 'almendra' ? 'ALMENDRA' : 'KIKA'}</strong>
                    <small>Pedido recibido en mesa</small>
                  </div>
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
                    : templateId === 'sabor-pampa'
                      ? 'Listo para preparar'
                      : templateId === 'kika' || templateId === 'almendra'
                        ? 'Pedido en el local'
                      : 'Pedido enviado'}
            </span>
            <h3>
              {templateId === 'kika' || templateId === 'almendra'
                ? `Pedido #${lastOrder.orderNumber} recibido`
                : `Pedido #${lastOrder.orderNumber} confirmado`}
            </h3>
            <p>
              {templateId === 'sabor-pampa'
                ? 'Ya recibimos tu pedido. Lo preparamos con el sabor de casa y te contactamos para coordinarlo.'
                : templateId === 'kika' || templateId === 'almendra'
                  ? 'Gracias. Tu pedido ya quedó registrado para prepararlo en el local.'
                : 'Ya recibimos tu pedido y vamos a seguir informandote por WhatsApp.'}
            </p>
            <div className="confirmation-meta">
              <div>
                <span>Total</span>
                <strong>{formatPrice(lastOrder.total ?? 0, currencySymbol)}</strong>
              </div>
              {templateId === 'kika' || templateId === 'almendra' ? (
                <div>
                  <span>Modalidad</span>
                  <strong>Mesa</strong>
                </div>
              ) : (
                <div>
                  <span>WhatsApp</span>
                  <strong>{buildWhatsappNumberPreview(lastOrder.customer?.phone)}</strong>
                </div>
              )}
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
                  <strong>{isTableOrder || templateId === 'kika' || templateId === 'almendra' ? 'En preparación' : 'Envio por WhatsApp'}</strong>
                  <small>
                    {isTableOrder
                      ? 'El equipo del local ya recibió tu pedido y lo está preparando.'
                      : templateId === 'kika' || templateId === 'almendra'
                      ? `El equipo de ${templateId === 'almendra' ? 'Almendra' : 'Kika'} lo verá desde el local para prepararlo.`
                      : lastOrder.customerWhatsapp?.url
                      ? 'Se abrio el chat con el pedido listo para enviar.'
                      : 'Te vamos a contactar para coordinar el pedido.'}
                  </small>
                </div>
              </div>
            </div>
            {templateId !== 'kika' && templateId !== 'almendra' && lastOrder.customerWhatsapp?.url ? (
              <button
                type="button"
                className="confirmation-button confirmation-button-secondary"
                onClick={() => openWhatsappOrderChat(lastOrder.customerWhatsapp.url)}
              >
                Abrir WhatsApp otra vez
              </button>
            ) : null}
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
