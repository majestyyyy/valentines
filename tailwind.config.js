/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ue: {
          red: '#D50000', // Approximate UE Red
          white: '#FFFFFF',
        }
      }
    },
  },
  plugins: [],
}