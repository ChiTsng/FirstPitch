/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' —— 用相对路径打包，这样构建产物放在 GitHub Pages 的任意子目录、
// 或者直接双击本地文件都能打开。配合 hash 路由（src/hooks/useHashRoute.ts）使用。
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    watch: { ignored: ['**/.visual-chrome/**', '**/shots/**'] },
  },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 4096,
  },
  test: {
    // 规则引擎是纯逻辑，不需要浏览器环境
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
