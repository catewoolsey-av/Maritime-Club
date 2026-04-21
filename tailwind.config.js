/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'av-teal': '#1B4D5C',
        'av-gold': '#C9A227',
      }
    },
  },
  plugins: [],
}
