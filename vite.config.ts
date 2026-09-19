import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const api = 'http://127.0.0.1:8000'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/health': api,
      '/apiversion': api,
      '/speech': api,
      '/voice': api,
      '/face': api,
      '/image': api,
      '/ocr': api,
      '/pdf': api,
      '/search': api,
      '/gallery': api,
      '/cache': api,
    },
  },
  preview: {
    port: 4173,
    host: true,
  },
})
