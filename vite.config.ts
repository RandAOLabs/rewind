import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { VitePWA } from 'vite-plugin-pwa'
import { viteSingleFile } from 'vite-plugin-singlefile';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    react(),
    nodePolyfills({
      include: [
        'buffer',
        'process',
        'util',
        'events',
        'stream',
        'crypto',
      ],
    }),
    viteSingleFile(),
    VitePWA({
      disable: true, 
      registerType: 'autoUpdate',
      injectRegister: 'inline',
      includeAssets: ['auto.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifestFilename: 'manifest.webmanifest',


      manifest: {
        name: 'AR.IO React App',
        short_name: 'AR.IO App',
        description: 'AR.IO React Application Template',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/ar\.io\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'ar-io-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          }
        ]
      }
    })
  ],
  build: {

    // Enable minification
    minify: false,
    
    // Generate sourcemaps for production
    sourcemap: false,
    // Optimize CSS
    cssCodeSplit: false,
    // Enable asset optimization
    assetsInlineLimit: 4096,
    // Reduce chunk size warnings
    chunkSizeWarningLimit: 1000
  },
  // Enable SWC minification
  esbuild: {
    // minifyIdentifiers: true,
    // minifySyntax: true,
    // minifyWhitespace: true
  },
  // Optimize dev server
  server: {
    open: false,
    cors: true,
    hmr: {
      overlay: true
    }
  }
})
