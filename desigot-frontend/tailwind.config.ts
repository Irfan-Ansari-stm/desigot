import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand:    { DEFAULT: "#1A1A2E", dark: "#58A6FF" },
        accent:   { DEFAULT: "#E94560", dark: "#FF6B8A" },
        accent2:  "#0F3460",
        accent3:  "#533483",
        info:     "#0A7EA4",
        success:  "#1A7A4A",
        warning:  "#D4680A",
        danger:   "#C0392B",
        surface: {
          DEFAULT: "#FFFFFF",
          50:      "#F7F8FC",
          100:     "#EEF1F8",
        },
        border: {
          DEFAULT: "#E0E4F0",
          md:      "#C8CEDD",
        },
        ink: {
          primary:   "#1A1A2E",
          secondary: "#6B7280",
          60:        "#3D4460",
        },
      },
      fontFamily: {
        sans:  ["var(--font-inter)", "system-ui", "sans-serif"],
        mono:  ["var(--font-jetbrains)", "monospace"],
      },
      borderRadius: {
        sm:   "4px",
        md:   "8px",
        lg:   "12px",
        xl:   "16px",
        "2xl":"24px",
        full: "9999px",
      },
      boxShadow: {
        sm:    "0 1px 3px rgba(0,0,0,0.08)",
        md:    "0 4px 12px rgba(0,0,0,0.10)",
        lg:    "0 8px 24px rgba(0,0,0,0.12)",
        xl:    "0 16px 48px rgba(0,0,0,0.16)",
        brand: "0 4px 20px rgba(233,69,96,0.25)",
      },
      animation: {
        "fade-in":    "fadeIn 0.2s ease-out",
        "slide-up":   "slideUp 0.25s ease-out",
        "slide-right":"slideRight 0.25s ease-out",
        "spin-slow":  "spin 2s linear infinite",
        "pulse-dot":  "pulseDot 1.4s ease-in-out infinite",
        "skeleton":   "skeleton 1.5s ease-in-out infinite",
      },
      keyframes: {
        fadeIn:    { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp:   { from: { transform: "translateY(8px)", opacity: "0" }, to: { transform: "translateY(0)", opacity: "1" } },
        slideRight:{ from: { transform: "translateX(-8px)", opacity: "0" }, to: { transform: "translateX(0)", opacity: "1" } },
        pulseDot:  { "0%,80%,100%": { transform: "scale(0.6)", opacity: "0.4" }, "40%": { transform: "scale(1)", opacity: "1" } },
        skeleton:  { "0%": { backgroundPosition: "200% 0" }, "100%": { backgroundPosition: "-200% 0" } },
      },
    },
  },
  plugins: [],
};

export default config;
