/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'taskmind-primary': '#3B82F6',
        'taskmind-secondary': '#10B981',
      },
    },
  },
  plugins: [],
} 