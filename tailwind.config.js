module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#1E3A8A",   // Deep Blue (branding)
        secondary: "#2563EB", // Bright Blue (buttons)
        light: "#F9FAFB",     // Background
        dark: "#111827",      // Text
        accent: "#F59E0B",    // Optional highlight (gold)
      },

      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },

      boxShadow: {
        card: "0 4px 20px rgba(0,0,0,0.05)",
      },

      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
      },

      spacing: {
        18: "4.5rem",
        22: "5.5rem",
      },
    },
  },
  plugins: [],
};