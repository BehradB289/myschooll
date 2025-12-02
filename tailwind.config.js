/** @type {import('tailwindcss').Config} */
export default {
  // این بخش به Tailwind می‌گوید که کلاس‌های CSS را در کدام فایل‌ها جستجو کند
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // در اینجا می‌توانید رنگ‌ها یا تنظیمات سفارشی را اضافه کنید
    },
    // تنظیم فونت فارسی (اختیاری اما توصیه می‌شود)
    fontFamily: {
        // تنظیم فونت برای سازگاری بهتر با زبان فارسی
        sans: ['Tahoma', 'Inter', 'sans-serif'],
    },
  },
  plugins: [],
}
