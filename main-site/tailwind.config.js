/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#187932',
          50: '#e9f8ef',
          100: '#d6f1e1',
          200: '#aee3c3',
          300: '#7fd19f',
          400: '#4ebc78',
          500: '#2aa35b',
          600: '#1f8d4c',
          700: '#187932',
          800: '#135f28',
          900: '#0e461f',
        },
      },
    },
  },
  plugins: [],
}
