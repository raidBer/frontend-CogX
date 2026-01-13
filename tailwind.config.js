/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark gaming theme
        dark: {
          bg: "#0a0a0f",
          surface: "#12121a",
          elevated: "#1a1a24",
          border: "#2a2a35",
        },
        neon: {
          cyan: "#00f0ff",
          purple: "#b066ff",
          pink: "#ff00ff",
          blue: "#4d7cfe",
          green: "#00ff88",
        },
        primary: {
          50: "#e6f0ff",
          100: "#b3d9ff",
          200: "#80c2ff",
          300: "#4dabff",
          400: "#1a94ff",
          500: "#4d7cfe",
          600: "#3d63cb",
          700: "#2d4a98",
          800: "#1d3165",
          900: "#0d1832",
        },
      },
      fontFamily: {
        gaming: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        neon: "0 0 20px rgba(77, 124, 254, 0.5)",
        "neon-cyan": "0 0 20px rgba(0, 240, 255, 0.5)",
        "neon-purple": "0 0 20px rgba(176, 102, 255, 0.5)",
      },
    },
  },
  plugins: [],
};
