/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["-apple-system", "SF Pro Display", "Inter", "sans-serif"],
        mono: ["SF Mono", "Menlo", "monospace"]
      },
      colors: {
        apple: {
          dark: "#1D1D1F",
          gray: "#6E6E73",
          hint: "#86868B",
          blue: "#0071E3",
          "blue-hover": "#0077ED",
          card: "#F5F5F7",
          border: "#D2D2D7"
        },
        brand: {
          cyan: "#06B6D4",
          "cyan-hover": "#0891B2"
        }
      },
      borderRadius: {
        pill: "980px"
      }
    }
  },
  plugins: []
};
