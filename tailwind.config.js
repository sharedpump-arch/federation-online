/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        pixel: ['"Press Start 2P"', 'monospace'],
        vt: ['VT323', 'monospace'],
      },
      colors: {
        'game-bg': '#0a0a0f',
        'game-panel': '#12121a',
        'game-border': '#2a2a3a',
        'game-accent': '#ff2d55',
        'game-gold': '#ffd700',
        'game-green': '#00ff88',
        'game-blue': '#00aaff',
        'game-purple': '#cc44ff',
        'game-dim': '#555570',
      },
    },
  },
  plugins: [],
}
