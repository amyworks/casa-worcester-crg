/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          blueDark: "#012D51",
          blue: "#01447C",

          plum: "#733146",

          red: "#E51D0F",
          redHover: "#F02719",

          white: "#FEFEFE",
          gray: "#CCCCCC",
        },
      },
    },
  },
  plugins: [],
};
