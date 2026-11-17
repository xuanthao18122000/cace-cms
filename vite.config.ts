import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const uploadTarget = process.env.VITE_UPLOAD_PROXY ?? 'http://localhost:4002'
const apiTarget = process.env.VITE_API_PROXY ?? 'http://localhost:4000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 5180,
    // Cùng origin với API để cookie refresh (path /api/auth) đi kèm.
    // Thứ tự quan trọng: upload khai báo trước /api.
    proxy: {
      '/api/uploads': { target: uploadTarget, changeOrigin: true },
      '/uploads': { target: uploadTarget, changeOrigin: true },
      '/api': { target: apiTarget, changeOrigin: true },
    },
  },
})
