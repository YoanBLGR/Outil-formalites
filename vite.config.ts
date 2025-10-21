import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Prevent vite from obscuring rust errors
  clearScreen: false,
  
  // Tauri expects a fixed port, fail if that port is not available
  server: {
    port: 5173,
    strictPort: true,
    host: '0.0.0.0',
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5183,
    },
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
  },
  
  // Environment variable prefix for client-side code
  envPrefix: ['VITE_', 'TAURI_'],
  
  build: {
    // Tauri uses Chromium on Windows and WebKit on macOS and Linux
    target: process.env.TAURI_ENV_PLATFORM == 'windows' ? 'chrome105' : 'safari13',
    // Don't minify for debug builds
    minify: !process.env.TAURI_ENV_DEBUG ? 'esbuild' : false,
    // Produce sourcemaps for debug builds
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
  },
})
