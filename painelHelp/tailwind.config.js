/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-10px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(10px)' },
        },
      },
      screens: {
        'custom-xl': '1170px', // Define o breakpoint em 1170px
        'custom-sm': '781px', // Define o breakpoint em 781px
      },
      animation: {
        shake: 'shake 0.5s ease-in-out infinite',
      },
      colors: {
        primary: '#002d56',
        secondary: '#004080',
        tertiary: '#0066cc',
        accent: '#3399ff',
        primaryOpaci: '#145996',
        primaryBlueDark: '#0D1E47',
        secRed: '#E30613',
        altBlue: '#2A4578',
        neutCinza: '#F1F1F1',
        'background-light': '#e6f2ff',
        'background-dark': '#001a33',
      },
    },
  },
  plugins: [],
}