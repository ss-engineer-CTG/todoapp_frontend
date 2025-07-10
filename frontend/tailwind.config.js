/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        "fade-in": {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        "fade-out": {
          "0%": { opacity: 1 },
          "100%": { opacity: 0 },
        },
        "zoom-in-95": {
          "0%": { transform: "scale(0.95)" },
          "100%": { transform: "scale(1)" },
        },
        "zoom-out-95": {
          "0%": { transform: "scale(1)" },
          "100%": { transform: "scale(0.95)" },
        },
        "slide-in-from-top-2": {
          "0%": { transform: "translateY(-2px)" },
          "100%": { transform: "translateY(0)" },
        },
        "slide-in-from-bottom-2": {
          "0%": { transform: "translateY(2px)" },
          "100%": { transform: "translateY(0)" },
        },
        "slide-in-from-left-2": {
          "0%": { transform: "translateX(-2px)" },
          "100%": { transform: "translateX(0)" },
        },
        "slide-in-from-right-2": {
          "0%": { transform: "translateX(2px)" },
          "100%": { transform: "translateX(0)" },
        },
        "pulse-subtle": {
          "0%, 100%": { transform: "translateX(2px) scale(1)", opacity: 1 },
          "50%": { transform: "translateX(3px) scale(1.001)", opacity: 0.98 },
        },
        "bounce-in": {
          "0%": { transform: "scale(0) rotate(-45deg)", opacity: 0 },
          "50%": { transform: "scale(1.3) rotate(-10deg)", opacity: 0.8 },
          "100%": { transform: "scale(1) rotate(0deg)", opacity: 1 },
        },
        "selection-border": {
          "0%, 100%": { 
            borderColor: "rgba(59, 130, 246, 0.8)",
            boxShadow: "0 0 10px rgba(59, 130, 246, 0.3), inset 0 0 10px rgba(59, 130, 246, 0.1)"
          },
          "50%": { 
            borderColor: "rgba(59, 130, 246, 1)",
            boxShadow: "0 0 20px rgba(59, 130, 246, 0.5), inset 0 0 15px rgba(59, 130, 246, 0.2)"
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        "fade-out": "fade-out 0.2s ease-out",
        "zoom-in-95": "zoom-in-95 0.2s ease-out",
        "zoom-out-95": "zoom-out-95 0.2s ease-out",
        "slide-in-from-top-2": "slide-in-from-top-2 0.2s ease-out",
        "slide-in-from-bottom-2": "slide-in-from-bottom-2 0.2s ease-out",
        "slide-in-from-left-2": "slide-in-from-left-2 0.2s ease-out",
        "slide-in-from-right-2": "slide-in-from-right-2 0.2s ease-out",
        "pulse-subtle": "pulse-subtle 2s ease-in-out infinite",
        "bounce-in": "bounce-in 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        "selection-border": "selection-border 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}