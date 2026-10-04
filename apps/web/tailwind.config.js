/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: "#2563EB",
          dark: "#1D4ED8",
          navy: "#0F172A",
          light: "#EFF6FF",
        },
        surface: {
          canvas: "#FFFFFF",
          subtle: "#F8FAFC",
          muted: "#F1F5F9",
        },
        border: {
          subtle: "#E2E8F0",
          strong: "#CBD5E1",
          active: "#2563EB",
        },
        content: {
          primary: "#111827",
          secondary: "#64748B",
          muted: "#94A3B8",
        },
        status: {
          success: "#15803D",
          warning: "#B45309",
          error: "#B91C1C",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        subtle: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)",
      },
      borderRadius: {
        DEFAULT: "6px",
        md: "6px",
        lg: "8px",
      },
    },
  },
  plugins: [],
};
