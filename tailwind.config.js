/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        mf: ["Mf", "sans-serif"],
        inter: ["Inter", "sans-serif"],
        "sf-pro": ["SF Pro Display", "sans-serif"],
      },
      fontSize: {
        "brand-heading": "64px",
        "button-label-1": "17px",
      },
      lineHeight: {
        "brand-heading": "24px",
        "button-label-1": "22px",
      },
      letterSpacing: {
        "brand-heading": "-3.5px",
        "button-label-1": "-0.43px",
      },
      animation: {
        fadeIn: "fadeIn 0.5s ease-in-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
