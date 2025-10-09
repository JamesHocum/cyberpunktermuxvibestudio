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
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;