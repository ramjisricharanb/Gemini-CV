/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'strong-fit': '#10b981',
        'good-fit': '#3b82f6',
        'possible-fit': '#f59e0b',
        'not-fit': '#ef4444',
        'hard-reject': '#6b7280',
      },
      keyframes: {
        'slide-in': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' }
        }
      },
      animation: {
        'slide-in': 'slide-in 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards'
      }
    },
  },
  plugins: [],
}
