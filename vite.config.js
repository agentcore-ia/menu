import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'host-html-fallback',
      configureServer(server) {
        server.middlewares.use((request, _response, next) => {
          const pathname = request.url?.split('?')[0] ?? '/'
          const consulta = request.url?.includes('?') ? request.url.slice(request.url.indexOf('?')) : ''
          // La vitrina de Capta Delivery tiene su propio html: sin esto, en
          // desarrollo /pedi caia en el menu generico (host.html).
          if (pathname === '/pedi' || pathname.startsWith('/pedi/')) {
            request.url = `/pedi.html${consulta}`
            next()
            return
          }
          if (!pathname.startsWith('/api/') && !pathname.startsWith('/@') && !pathname.includes('.')) {
            request.url = `/host.html${request.url?.includes('?') ? request.url.slice(request.url.indexOf('?')) : ''}`
          }
          next()
        })
      },
    },
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'host.html'),
        pedi: resolve(__dirname, 'pedi.html'),
        almendra: resolve(__dirname, 'almendra.html'),
        kika: resolve(__dirname, 'kika.html'),
        saborapampa: resolve(__dirname, 'saborapampa.html'),
        lodetoto: resolve(__dirname, 'lodetoto.html'),
        babson: resolve(__dirname, 'babson.html'),
        troka: resolve(__dirname, 'troka.html'),
        panacea: resolve(__dirname, 'panacea.html'),
        racing: resolve(__dirname, 'racing.html'),
        boutiquecian: resolve(__dirname, 'boutique-cian.html'),
        craftburguer: resolve(__dirname, 'craft-burguer.html'),
        bruderpizza: resolve(__dirname, 'bruderpizza.html'),
        chicha: resolve(__dirname, 'chicha.html'),
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: true,
      },
    },
  },
})
