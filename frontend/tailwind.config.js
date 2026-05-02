/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        troco: {
          blue: "#1E6FA3",
          cyan: "#27B7D0",
          teal: "#2FA8A3",
          green: "#4CAF50",
          lime: "#7ED957",
          dark: "#1F2937",
          muted: "#6B7280",
          light: "#F5F7FA",
          sand: "#EAF3F4",
        },
      },
      backgroundImage: {
        "troco-gradient":
          "linear-gradient(135deg, #1E6FA3 0%, #2FA8A3 45%, #7ED957 100%)",
      },
      boxShadow: {
        soft: "0 12px 30px rgba(31, 41, 55, 0.08)",
        glow: "0 10px 25px rgba(47, 168, 163, 0.25)",
      },
      fontFamily: {
        display: ["Inter", "system-ui", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};