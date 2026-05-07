/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./index.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2D7D6E",
          light: "#4A9B8E",
          dark: "#1F5A4F",
        },
        accent: "#7FB8AA",
        surface: "#F5F9F7",
      },
    },
  },
  plugins: [],
};
