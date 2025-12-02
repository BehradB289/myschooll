import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// تنظیمات ویت برای پشتیبانی از ویژگی‌های جدید جاوا‌اسکریپت
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext' // استفاده از آخرین نسخه جاوا‌اسکریپت برای بیلد نهایی
  },
  esbuild: {
    target: 'esnext' // رفع خطای import.meta در محیط توسعه و پیش‌نمایش
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext',
    },
  },
})
