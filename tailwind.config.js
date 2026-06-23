/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        discord: {
          dark: '#202638',
          mid: '#171c2b',
          black: '#0e1320',
          light: '#f2f3f5',
          blurple: '#6d72ff',
          green: '#248046',
          yellow: '#f0b232',
          red: '#da373c',
          text: '#e9ecf5',
          muted: '#9da7bb'
        }
      }
    },
  },
  plugins: [],
}

