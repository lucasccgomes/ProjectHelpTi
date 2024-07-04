/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#002d56',
        secondary: '#004080',
        tertiary: '#0066cc',
        accent: '#3399ff',
        primaryOpaci: '#145996',
        'background-light': '#e6f2ff',
        'background-dark': '#001a33',
      },
    },
  },
  plugins: [],
}