/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "Segoe UI", "system-ui", "sans-serif"]
      },
      boxShadow: {
        panel: "0 24px 70px rgba(0,0,0,0.24)"
      }
    }
  },
  plugins: []
};
