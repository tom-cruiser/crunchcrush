import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  // The backend (backend/, port 4000) answers /api in development. API_PROXY points elsewhere.
  server: { proxy: { '/api': process.env.API_PROXY ?? 'http://localhost:4000' } },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      manifest: {
        name: 'Crunch Crust',
        short_name: 'Crunch Crust',
        description: 'Order tacos and Roll-Eggs from Crunch Crust, Kigali. Delivery, pickup and dine-in.',
        id: '/',
        theme_color: '#0a0a0a',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        lang: 'en',
        categories: ['food', 'shopping'],
        shortcuts: [
          { name: 'Menu', url: '/', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
          { name: 'My orders', url: '/orders', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
          { name: 'Cart', url: '/cart', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
        ],
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // Real backend later: menu and order reads stay available offline.
            urlPattern: ({ url }) => url.pathname.startsWith('/api/menu') || url.pathname.startsWith('/api/orders'),
            handler: 'NetworkFirst',
            options: { cacheName: 'api-data', networkTimeoutSeconds: 4, expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 } },
          },
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: { cacheName: 'images', expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 } },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
})
