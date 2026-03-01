import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          0: "#0a0a0b",
          1: "#111113",
          2: "#18181b",
          3: "#1c1c1f",
          4: "#232326",
          5: "#2a2a2e",
        },
        zinc: {
          850: "#1c1c1f",
        },
        brand: {
          DEFAULT: "#e4e4e7",
          muted: "rgba(228,228,231,0.08)",
        },
        accent: {
          green: "#22c55e",
          "green-muted": "rgba(34,197,94,0.12)",
          red: "#ef4444",
          "red-muted": "rgba(239,68,68,0.12)",
          blue: "#60a5fa",
          "blue-muted": "rgba(96,165,250,0.1)",
          amber: "#fbbf24",
          "amber-muted": "rgba(251,191,36,0.1)",
          purple: "#a78bfa",
          "purple-muted": "rgba(167,139,250,0.1)",
        },
        // Keep primary for backwards compat with sidebar etc
        primary: {
          50: "#18181b",
          100: "#232326",
          200: "#3f3f46",
          300: "#52525b",
          400: "#a1a1aa",
          500: "#d4d4d8",
          600: "#e4e4e7",
          700: "#f4f4f5",
          800: "#fafafa",
          900: "#ffffff",
        },
        app: {
          bg: "#0a0a0b",
          surface: "#111113",
          sidebar: "#0a0a0b",
        },
      },
      fontFamily: {
        sans: ["'DM Sans'", "system-ui", "-apple-system", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      borderRadius: {
        "2xl": "14px",
      },
      animation: {
        "fade-up": "fade-up 0.4s ease-out both",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
