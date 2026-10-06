/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Austral Commerce System
        border: "#E2E8F0",
        input: "#E2E8F0",
        ring: "#0F172A",
        background: "#F8FAFC",
        foreground: "#0F172A",
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#F1F5F9",
        },
        muted: {
          DEFAULT: "#F1F5F9",
          foreground: "#64748B",
        },
        primary: {
          DEFAULT: "#0F172A",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#F97316",
          foreground: "#FFFFFF",
        },
        tertiary: {
          DEFAULT: "#0D9488",
          foreground: "#FFFFFF",
        },
        destructive: {
          DEFAULT: "#DC2626",
          foreground: "#FFFFFF",
        },
        success: {
          DEFAULT: "#16A34A",
          foreground: "#FFFFFF",
        },
      },
      borderRadius: {
        sm: "0.25rem",
        DEFAULT: "0.375rem",
        md: "0.375rem",
        lg: "0.5rem",
        xl: "0.75rem",
      },
      spacing: {
        gutter: "24px",
        "stack-lg": "24px",
        "stack-md": "16px",
        "stack-sm": "8px",
        "margin-mobile": "16px",
        "margin-desktop": "40px",
      },
      maxWidth: {
        "container-max": "1280px",
      },
      fontFamily: {
        heading: ['"Hanken Grotesk"', "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        "display-lg": ["48px", { lineHeight: "52px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "display-md": ["36px", { lineHeight: "40px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "headline-lg": ["28px", { lineHeight: "34px", fontWeight: "700" }],
        "headline-md": ["20px", { lineHeight: "26px", fontWeight: "700" }],
        "title-md": ["16px", { lineHeight: "22px", fontWeight: "600" }],
        "price-lg": ["20px", { lineHeight: "26px", fontWeight: "700" }],
        "body-lg": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "body-md": ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "label-md": ["12px", { lineHeight: "16px", letterSpacing: "0.04em", fontWeight: "600" }],
      },
    },
  },
  plugins: [],
};
