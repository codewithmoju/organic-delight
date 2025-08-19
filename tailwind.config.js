/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#964B00',
        secondary: '#F59E0B',
        dark: '#4B2600',
        light: '#FFFFFF',
      }
    },
  },
  plugins: [],
}