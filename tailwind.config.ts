import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        gold: "#C9A843",
      },
      fontFamily: {
        bebas: ["var(--font-bebas)", "Impact", "sans-serif"],
      },
      keyframes: {
        "glow-pulse": {
          "0%, 100%": { filter: "drop-shadow(0 0 8px rgba(201, 168, 67, 0.5))" },
          "50%": { filter: "drop-shadow(0 0 20px rgba(201, 168, 67, 0.85))" },
        },
        "slide-up": {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        "glow-pulse": "glow-pulse 1.5s ease-in-out infinite",
        "slide-up": "slide-up 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
    },
  },
  plugins: [],
};
export default config;
