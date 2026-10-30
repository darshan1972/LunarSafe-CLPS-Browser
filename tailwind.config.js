/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        space: {
          950: '#000000', // Pitch black
          900: '#09090B', // Antigravity background pitch black
          850: '#0E0E11', // Deep card surface
          800: '#141418', // Container surface
          750: '#1C1C22', // Active panel surface
          700: '#27272F', // Border
          600: '#3F3F46', // Muted border
          500: '#71717A', // Tertiary text
          400: '#A1A1AA', // Secondary text
          300: '#D4D4D8', // Soft white text
          200: '#E4E4E7', // Light white text
          100: '#FFFFFF', // Crisp white text
        },
        isro: {
          orange: '#FF6B00', // ISRO Deep Saffron
          green: '#FFFFFF',  // Crisp White
          blue: '#FFFFFF',   // Clean White
          cyan: '#FFFFFF',   // Crisp White
          emerald: '#FFFFFF',// Crisp White
          crimson: '#EF4444',// Alert Red (Hazard / Error semantics)
          amber: '#F59E0B',  // Warning Amber
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Consolas', 'Courier New', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
