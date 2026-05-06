/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        applymate: {
          page: "#f7f8f5",
          panel: "#ffffff",
          muted: "#eef2e8",
          text: "#18201a",
          body: "#374239",
          subtle: "#69736a",
          success: "#2f7d4f",
          border: "#d8ded2"
        }
      }
    }
  },
  plugins: []
};
