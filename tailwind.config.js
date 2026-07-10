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
      },
      keyframes: {
        slideInBottom: {
          '0%': { transform: 'translateY(15px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        }
      },
      animation: {
        'slide-in-bottom': 'slideInBottom 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
        'slide-in-right': 'slideInRight 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
        'slide-in-left': 'slideInLeft 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
      }
    },
  },
  plugins: [],
}

