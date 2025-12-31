import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.5rem",
        lg: "2rem",
      },
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1200px",
        "2xl": "1280px",
      },
    },
    /* ============================================================
       RESPONSIVE BREAKPOINTS
       Mobile: up to 640px
       Tablet: 641px — 1024px
       Laptop: 1025px — 1440px
       Desktop: 1441px and above
       ============================================================ */
    screens: {
      xs: "360px",
      sm: "641px",
      md: "769px",
      lg: "1025px",
      xl: "1441px",
      "2xl": "1920px",
    },
    extend: {
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
      },
      /* Fluid font sizes using clamp() */
      fontSize: {
        /* Extra small: 10px → 12px */
        "fluid-xs": "clamp(0.625rem, 0.6rem + 0.15vw, 0.75rem)",
        /* Small: 12px → 14px */
        "fluid-sm": "clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)",
        /* Base: 14px → 18px */
        "fluid-base": "clamp(0.875rem, 0.8rem + 0.4vw, 1.125rem)",
        /* Large: 16px → 20px */
        "fluid-lg": "clamp(1rem, 0.9rem + 0.5vw, 1.25rem)",
        /* XL: 18px → 24px */
        "fluid-xl": "clamp(1.125rem, 1rem + 0.625vw, 1.5rem)",
        /* 2XL: 20px → 30px */
        "fluid-2xl": "clamp(1.25rem, 1rem + 1.25vw, 1.875rem)",
        /* 3XL: 24px → 36px */
        "fluid-3xl": "clamp(1.5rem, 1.2rem + 1.5vw, 2.25rem)",
        /* 4XL: 28px → 48px */
        "fluid-4xl": "clamp(1.75rem, 1.25rem + 2.5vw, 3rem)",
        /* 5XL: 32px → 60px */
        "fluid-5xl": "clamp(2rem, 1.25rem + 3.75vw, 3.75rem)",
        /* 6XL: 36px → 72px */
        "fluid-6xl": "clamp(2.25rem, 1rem + 5vw, 4.5rem)",
      },
      /* Fluid spacing using clamp() */
      spacing: {
        "fluid-xs": "clamp(4px, 0.5vw, 8px)",
        "fluid-sm": "clamp(8px, 1vw, 12px)",
        "fluid-md": "clamp(12px, 1.5vw, 20px)",
        "fluid-lg": "clamp(16px, 2vw, 32px)",
        "fluid-xl": "clamp(24px, 3vw, 48px)",
        "fluid-2xl": "clamp(32px, 4vw, 64px)",
        "fluid-section": "clamp(48px, 6vw, 96px)",
      },
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
        glow: {
          warm: "hsl(var(--glow-warm))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "floating-block": {
          "0%, 100%": { 
            transform: "translate(-50%, -50%) translateY(0) translateX(0) rotate(0deg)",
          },
          "25%": { 
            transform: "translate(-50%, -50%) translateY(-15px) translateX(10px) rotate(2deg)",
          },
          "50%": { 
            transform: "translate(-50%, -50%) translateY(-5px) translateX(-8px) rotate(-1deg)",
          },
          "75%": { 
            transform: "translate(-50%, -50%) translateY(-20px) translateX(5px) rotate(1deg)",
          },
        },
        "beam-pulse": {
          "0%, 100%": { 
            opacity: "0.8",
            filter: "blur(0px)",
          },
          "50%": { 
            opacity: "1",
            filter: "blur(2px)",
          },
        },
        "beam-flow": {
          "0%": { 
            transform: "translateY(-10%)",
          },
          "100%": { 
            transform: "translateY(10%)",
          },
        },
        "edge-shine": {
          "0%": {
            backgroundPosition: "200% 0",
          },
          "100%": {
            backgroundPosition: "-200% 0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "floating-block": "floating-block ease-in-out infinite",
        "beam-pulse": "beam-pulse 3s ease-in-out infinite",
        "beam-flow": "beam-flow 4s ease-in-out infinite alternate",
        "edge-shine": "edge-shine 3s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
