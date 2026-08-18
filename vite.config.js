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
        almendra: resolve(__dirname, 'almendra.html'),
        kika: resolve(__dirname, 'kika.html'),
        saborapampa: resolve(__dirname, 'saborapampa.html'),
        lodetoto: resolve(__dirname, 'lodetoto.html'),
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
