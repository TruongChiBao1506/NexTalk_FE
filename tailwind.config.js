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
          dark: '#313338',
          mid: '#2b2d31',
          black: '#1e1f22',
          light: '#f2f3f5',
          blurple: '#5865f2',
          green: '#248046',
          yellow: '#f0b232',
          red: '#da373c',
          text: '#dbdee1',
          muted: '#949ba4'
        }
      }
    },
  },
  plugins: [],
}


