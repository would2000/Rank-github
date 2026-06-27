import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// 使用相對路徑 base，讓專案無論部署到 user.github.io/<repo>/ 或自訂網域都能正確載入資源。
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
})
