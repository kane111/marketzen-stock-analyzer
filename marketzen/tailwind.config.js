/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0b0e11',
        surface: '#151a21',
        surfaceLight: '#1e2530',
        primary: '#3b82f6',
        positive: '#10b981',
        negative: '#ef4444',
        text: '#f3f4f6',
        textSecondary: '#9ca3af',
        // Terminal Theme Colors
        'terminal-bg': '#0C0C0C',
        'terminal-bg-light': '#2a2f35',
        'terminal-bg-secondary': '#1F2223',
        'terminal-border': '#3a3f42',
        'terminal-dim': '#8a9098',
        'terminal-text': '#E0E0E0',
        'terminal-green': '#33FF00',
        'terminal-red': '#FF3333',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
