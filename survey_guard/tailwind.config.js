/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0B1520",
        panel: "#101C2C",
        panel2: "#16263A",
        border: "#22374F",
        accent: "#3FA9F5",
        critical: "#F0546B",
        warning: "#F0A63F",
        normal: "#3FC98E",
        muted: "#7C93AC",
      },
      fontFamily: {
        display: ["'IBM Plex Sans'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
    },
  },
  plugins: [],
};
