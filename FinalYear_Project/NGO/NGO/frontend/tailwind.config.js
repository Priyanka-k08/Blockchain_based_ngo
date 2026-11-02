/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#14201b",
        pine: "#1f4d3a",
        moss: "#3d6b4f",
        copper: "#c46b3a",
        sand: "#f3ead7",
        paper: "#fbf7ef",
        mist: "#d7e3d6",
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        sans: ["Outfit", "system-ui", "sans-serif"],
      },
      boxShadow: {
        lift: "0 18px 40px -24px rgba(20, 32, 27, 0.45)",
      },
    },
  },
  plugins: [],
};
