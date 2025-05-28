/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
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
        project: {
          orange: '#f97316',
          purple: '#8b5cf6',
          green: '#10b981',
          red: '#ef4444',
          blue: '#3b82f6',
          amber: '#f59e0b',
          pink: '#ec4899',
          teal: '#14b8a6',
        },
        status: {
          'not-started': '#9ca3af',
          'in-progress': '#3b82f6',
          'completed': '#10b981',
          'overdue': '#ef4444',
        },
        priority: {
          low: '#10b981',
          medium: '#f59e0b',
          high: '#ef4444',
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          "sans-serif"
        ],
        mono: [
          '"Fira Code"',
          '"JetBrains Mono"',
          "Consolas",
          "monospace"
        ]
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.75rem' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
      minHeight: {
        '12': '3rem',
        '16': '4rem',
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.2s ease-in-out",
        "fade-out": "fade-out 0.2s ease-in-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "slide-in-left": "slide-in-left 0.3s ease-out",
        "slide-in-top": "slide-in-top 0.3s ease-out",
        "slide-in-bottom": "slide-in-bottom 0.3s ease-out",
        "zoom-in": "zoom-in 0.2s ease-out",
        "zoom-out": "zoom-out 0.2s ease-out",
        "bounce-in": "bounce-in 0.4s ease-out",
        "shake": "shake 0.5s ease-in-out",
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
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-out": {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
        "slide-in-right": {
          from: { 
            opacity: "0",
            transform: "translateX(20px)"
          },
          to: {
            opacity: "1",
            transform: "translateX(0)"
          },
        },
        "slide-in-left": {
          from: {
            opacity: "0",
            transform: "translateX(-20px)"
          },
          to: {
            opacity: "1",
            transform: "translateX(0)"
          },
        },
        "slide-in-top": {
          from: {
            opacity: "0",
            transform: "translateY(-20px)"
          },
          to: {
            opacity: "1",
            transform: "translateY(0)"
          },
        },
        "slide-in-bottom": {
          from: {
            opacity: "0",
            transform: "translateY(20px)"
          },
          to: {
            opacity: "1",
            transform: "translateY(0)"
          },
        },
        "zoom-in": {
          from: {
            opacity: "0",
            transform: "scale(0.9)"
          },
          to: {
            opacity: "1",
            transform: "scale(1)"
          },
        },
        "zoom-out": {
          from: {
            opacity: "1",
            transform: "scale(1)"
          },
          to: {
            opacity: "0",
            transform: "scale(0.9)"
          },
        },
        "bounce-in": {
          "0%": {
            opacity: "0",
            transform: "scale(0.3)"
          },
          "50%": {
            transform: "scale(1.05)"
          },
          "70%": {
            transform: "scale(0.9)"
          },
          "100%": {
            opacity: "1",
            transform: "scale(1)"
          }
        },
        "shake": {
          "0%, 100%": {
            transform: "translateX(0)"
          },
          "10%, 30%, 50%, 70%, 90%": {
            transform: "translateX(-2px)"
          },
          "20%, 40%, 60%, 80%": {
            transform: "translateX(2px)"
          }
        }
      },
      gridTemplateColumns: {
        'auto-fit': 'repeat(auto-fit, minmax(250px, 1fr))',
        'auto-fill': 'repeat(auto-fill, minmax(250px, 1fr))',
      },
      boxShadow: {
        'inner-lg': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        'glow': '0 0 20px rgba(59, 130, 246, 0.5)',
        'glow-sm': '0 0 10px rgba(59, 130, 246, 0.3)',
      },
      backdropBlur: {
        xs: '2px',
      },
      screens: {
        'xs': '475px',
        '3xl': '1920px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms')({
      strategy: 'class',
    }),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
    require('@tailwindcss/container-queries'),
    
    function({ addUtilities, addComponents }) {
      addUtilities({
        '.text-shadow': {
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.1)',
        },
        '.text-shadow-lg': {
          textShadow: '4px 4px 8px rgba(0, 0, 0, 0.15)',
        },
        '.scrollbar-none': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
        '.gpu': {
          transform: 'translateZ(0)',
        },
        '.backface-hidden': {
          'backface-visibility': 'hidden',
        },
      })

      addComponents({
        '.btn-primary': {
          '@apply bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50': {},
        },
        '.btn-secondary': {
          '@apply bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50': {},
        },
        '.card': {
          '@apply bg-card text-card-foreground rounded-lg border shadow-sm': {},
        },
        '.task-bar': {
          '@apply absolute rounded-lg shadow-lg flex items-center transition-all duration-200 cursor-pointer hover:shadow-xl': {},
        },
      })
    },
  ],
  // Safelist を最適化
  safelist: [
    // プロジェクトカラー関連のクラスのみ
    {
      pattern: /(bg|text|border)-(project|status|priority)-(orange|purple|green|red|blue|amber|pink|teal|not-started|in-progress|completed|overdue|low|medium|high)/,
      variants: ['hover', 'focus', 'active'],
    },
  ],
}