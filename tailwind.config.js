/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        "oscar-winner": "#D4AF33",
        "oscar-nominee": "#FBD555",
        "oscar-best-picture-winner": "#214ED3",
        "oscar-best-picture-nominee": "#90A8EE",
        "oscar-none": "#606060",
        "darkest": "#000000",
        "dark": "#121212",
        "mid": "#242424",
        "mid2": "#484848",
        "light": "#B3B6B7",
        "lightest": "#F7F3E3",
        "navbar" : "#202020",
        "accent" : "#D69E36",
        "accent-dark" : "#AD8334",
        "accent-darker" : "#665028",
        "spaceCadet" : "#2E294E",
      }
    },
  },
  plugins: [],
}
