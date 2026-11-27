/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        parchment: {
          50: '#fdfaf3',
          100: '#f8f0dc',
          200: '#efe0bc',
          300: '#e2c992',
          400: '#d1ac65',
          500: '#b88d42',
          700: '#785826',
          900: '#3f2e14',
        },
        jade: {
          50: '#eef8f4',
          100: '#d3eee3',
          400: '#49a888',
          500: '#2e8b6e',
          600: '#1f6f57',
          800: '#134739',
          900: '#0d3128',
        },
        vermilion: {
          400: '#e25c47',
          500: '#c83e2b',
          600: '#a82f1f',
          800: '#6e1e14',
        },
        indigoInk: {
          700: '#27384c',
          800: '#1a2736',
          900: '#101924',
          950: '#090f17',
        },
      },
      fontFamily: {
        serif: ['"Noto Serif TC"', '"PMingLiU"', 'Georgia', 'serif'],
        sans: ['"Noto Sans TC"', '"Microsoft JhengHei"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
