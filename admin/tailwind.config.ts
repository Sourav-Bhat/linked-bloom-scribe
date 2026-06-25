import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ["Inter", "sans-serif"] },
      colors: {
        ink: { 900: "#211B3E", 800: "#2C2451", 700: "#3A2F6B" },
        violet: { 50: "#EDEAFB", 500: "#6555E6", 600: "#5142C9" },
        gold: { 50: "#FCF3E2", 500: "#EDA838", 600: "#C98A24" },
        brand: {
          25: "#FBFAFD", 50: "#F6F5FA", 100: "#EFEDF5", 200: "#E4E1EC",
          300: "#CDC9DA", 400: "#9B95AD", 500: "#6E6883", 600: "#514B63",
          700: "#383348", 900: "#1C1830",
        },
        success: "#1E9E6A", "success-bg": "#E7F6EF",
        warn: "#C9821B", "warn-bg": "#FBF1DF",
        danger: "#D24B4B", "danger-bg": "#FBEAEA",
      },
      boxShadow: {
        "brand-1": "0 1px 2px rgba(16,32,52,.06),0 1px 1px rgba(16,32,52,.04)",
        "brand-2": "0 4px 12px rgba(16,32,52,.08),0 2px 4px rgba(16,32,52,.04)",
        "brand-3": "0 12px 32px rgba(16,32,52,.14),0 4px 8px rgba(16,32,52,.06)",
      },
    },
  },
  plugins: [],
} satisfies Config;
