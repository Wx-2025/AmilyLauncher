import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // 确保在 Electron 中路径正确
  server: {
    port: 5173,
  }
})
