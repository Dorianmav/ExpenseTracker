/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#3498db",
        secondary: "#2ecc71",
        danger: "#e74c3c",
        warning: "#f39c12",
        dark: "#2c3e50",
      },
    },
  },
  plugins: [],
}
