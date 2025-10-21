import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy pour l'API Guichet Unique (contourne CORS en dev)
      '/gu-api': {
        target: 'https://guichet-unique-demo.inpi.fr',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/gu-api/, '/api'),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            console.log('🔄 Proxy request to GU:', proxyReq.path)
          })
        }
      }
    }
  }
})
