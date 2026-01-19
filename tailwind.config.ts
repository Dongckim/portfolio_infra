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
        background: "#F5F5F7",
        surface: "#FFFFFF",
        border: "rgba(0, 0, 0, 0.1)",
        textPrimary: "#1D1D1F",
        textSecondary: "#6E6E73",
        accent: "#0071E3",
        glass: "rgba(255, 255, 255, 0.7)",
        glassBorder: "rgba(255, 255, 255, 0.18)",
      },
      backdropBlur: {
        xs: '2px',
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;

