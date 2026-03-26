/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef7ff',
          100: '#d9ecff',
          500: '#1d7ef7',
          600: '#0f67da',
          700: '#0f52aa'
        }
      }
    }
  },
  plugins: []
};
