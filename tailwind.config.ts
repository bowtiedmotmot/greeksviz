import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        greek: {
          delta: '#3B82F6',
          gamma: '#10B981',
          theta: '#F59E0B',
          vega: '#8B5CF6',
          rho: '#EF4444'
        }
      }
    },
  },
  plugins: [],
  darkMode: 'class',
} satisfies Config
