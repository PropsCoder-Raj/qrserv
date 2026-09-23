import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://srv1563916.hstgr.cloud',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'https://srv1563916.hstgr.cloud',
        changeOrigin: true,
      },
    },
  },
})
