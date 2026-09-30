import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      usePolling: false,
    },
    hmr: {
      overlay: true
    }
  },
  resolve: {
    dedupe: ['react', 'react-dom', 'react-icons', 'react-select']
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-redux',
      '@reduxjs/toolkit',
      'react-select',
      'react-icons/fa',
      'react-icons/fa6',
      'react-icons/io5',
      'react-icons/lu',
      'react-icons/gr',
      'react-icons/md',
      'pdfjs-dist'
    ],
    exclude: []
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-redux')) {
              return 'react-vendor';
            }
            if (id.includes('@reduxjs/toolkit')) {
              return 'redux-vendor';
            }
          }
        }
      }
    }
  }
})
