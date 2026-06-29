/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: "#030712",
          card: "rgba(15, 23, 42, 0.55)",
          border: "rgba(255, 255, 255, 0.08)",
        },
        brand: {
          blue: "#0072b1",       // LinkedIn primary brand blue
          accentBlue: "#38bdf8",   // Neon blue highlights
          accentTeal: "#2dd4bf",   // Accent teal
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        outfit: ['Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
