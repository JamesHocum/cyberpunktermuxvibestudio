import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        'cyber': ['Orbitron', 'JetBrains Mono', 'monospace'],
        'terminal': ['JetBrains Mono', 'Courier New', 'monospace'],
        'mono': ['JetBrains Mono', 'Courier New', 'monospace'],
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
        /* Cyberpunk Theme Colors */
        'neon-green': 'hsl(var(--neon-green))',
        'neon-purple': 'hsl(var(--neon-purple))',
        'neon-cyan': 'hsl(var(--neon-cyan))',
        'matrix-green': 'hsl(var(--matrix-green))',
        'studio-bg': 'hsl(var(--studio-bg))',
        'studio-sidebar': 'hsl(var(--studio-sidebar))',
        'studio-header': 'hsl(var(--studio-header))',
        'studio-terminal': 'hsl(var(--studio-terminal))',
      },
      backgroundImage: {
        'cyber-gradient': 'var(--gradient-cyber)',
        'terminal-gradient': 'var(--gradient-terminal)',
        'neon-gradient': 'var(--gradient-neon)',
      },
      boxShadow: {
        'neon-green': 'var(--shadow-neon-green)',
        'neon-purple': 'var(--shadow-neon-purple)',
        'cyber': 'var(--shadow-cyber)',
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-glow": "pulse-glow 2s infinite",
        "flicker": "flicker 0.15s infinite linear alternate",
        "veyl-enter": "veyl-enter 0.4s ease-out forwards",
        "veyl-hero": "veyl-hero 1.2s ease-in-out infinite",
        "veyl-idle": "veyl-idle 3.2s ease-in-out infinite",
        "veyl-exit": "veyl-exit 0.5s ease-in forwards",
        "veyl-error": "veyl-error 0.5s ease-in-out",
        "veyl-avatar-glow": "veyl-avatar-glow 3s ease-in-out infinite",
        "veyl-breathe": "veyl-breathe 4s ease-in-out infinite",
        "veyl-save-flash": "veyl-save-flash 0.6s ease-out",
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
        "pulse-glow": {
          "0%, 100%": { boxShadow: "var(--shadow-neon-green)" },
          "50%": { boxShadow: "var(--shadow-cyber)" },
        },
        "flicker": {
          "0%": { opacity: "1" },
          "100%": { opacity: "0.95" },
        },
        "veyl-enter": {
          "0%": { opacity: "0", transform: "translateY(12px) scale(0.96)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "veyl-hero": {
          "0%": { transform: "translateX(-6px)" },
          "50%": { transform: "translateX(6px)" },
          "100%": { transform: "translateX(-6px)" },
        },
        "veyl-idle": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
        "veyl-exit": {
          "0%": { opacity: "1", transform: "scale(1)" },
          "100%": { opacity: "0", transform: "scale(0.95)" },
        },
        "veyl-error": {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-4px)" },
          "75%": { transform: "translateX(4px)" },
        },
        "veyl-avatar-glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(74,222,128,0.7), 0 0 40px rgba(168,85,247,0.3)" },
          "50%": { boxShadow: "0 0 30px rgba(74,222,128,1), 0 0 60px rgba(168,85,247,0.6)" },
        },
        "veyl-breathe": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "veyl-save-flash": {
          "0%": { boxShadow: "0 0 40px rgba(74,222,128,1), 0 0 80px rgba(74,222,128,0.6)" },
          "50%": { boxShadow: "0 0 60px rgba(74,222,128,1), 0 0 100px rgba(45,212,191,0.8)" },
          "100%": { boxShadow: "0 0 20px rgba(74,222,128,0.7), 0 0 40px rgba(168,85,247,0.3)" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;