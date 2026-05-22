/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        hacker: {
          bg: "#0A0F1D",
          panel: "#111827",
          green: "#10B981",     // base neon green
          neon: "#00FF66",      // bright neon green
          cyan: "#00F0FF",      // neon cyan
          red: "#FF3366",
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
