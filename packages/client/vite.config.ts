import { resolve } from 'node:path'

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        timeout: 60000, // 增加超时时间到60秒
        proxyTimeout: 60000, // 代理超时设置
        // 不需要重写路径，因为后端API已经配置了'/api'前缀
      },
      '/imgs': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        timeout: 60000, // 增加超时时间到60秒
        proxyTimeout: 60000 // 代理超时设置
        // 将/imgs请求代理到后端服务器
      }
    }
  }
})
