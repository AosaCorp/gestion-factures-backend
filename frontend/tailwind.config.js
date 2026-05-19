/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Couleurs personnalisées pour le thème sombre
        dark: {
          bg: '#1a1a2e',
          card: '#16213e',
          border: '#0f3460',
          text: '#e0e0e0',
          header: '#0f0f1a',
        }
      }
    },
  },
  plugins: [],
}