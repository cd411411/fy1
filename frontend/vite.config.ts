import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // 将所有以 /api 开头的请求代理到后端
      '/api': {
        target: 'http://127.0.0.1:8000', // 您的FastAPI后端地址
        changeOrigin: true,
      }
    }
  }
})
