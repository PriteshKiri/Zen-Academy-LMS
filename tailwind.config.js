/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF9800', // Orange
          light: '#FFB74D',
          dark: '#F57C00',
        },
        secondary: {
          DEFAULT: '#FFF8E1', // Cream/Off-white
          light: '#FFFDF7',
          dark: '#FFE0B2',
        }
      },
    },
  },
  plugins: [],
}