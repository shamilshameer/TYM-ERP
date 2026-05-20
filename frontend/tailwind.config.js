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
        brand: {
          bg: '#030712', // slate-950
          card: 'rgba(15, 23, 42, 0.45)', // transparent slate-900
          border: 'rgba(255, 255, 255, 0.06)',
          accent: '#6366f1', // indigo-500
          glow: 'rgba(99, 102, 241, 0.15)',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glow-cyan': '0 0 20px 0 rgba(6, 182, 212, 0.25)',
        'glow-indigo': '0 0 20px 0 rgba(99, 102, 241, 0.25)',
        'glow-emerald': '0 0 20px 0 rgba(16, 185, 129, 0.25)',
      }
    },
  },
  plugins: [],
}
