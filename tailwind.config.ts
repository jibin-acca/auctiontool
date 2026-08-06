import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-bebas)', 'var(--font-rajdhani)', 'system-ui', 'sans-serif'],
        condensed: ['var(--font-rajdhani)', 'system-ui', 'sans-serif'],
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
      },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
        'slide-up-fade': { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'slide-in-right': { from: { opacity: '0', transform: 'translateX(24px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        'scale-in': { from: { opacity: '0', transform: 'scale(0.95)' }, to: { opacity: '1', transform: 'scale(1)' } },
        'float': { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        'shimmer': { '100%': { transform: 'translateX(100%)' } },
        'pulse-gold': { '0%,100%': { boxShadow: '0 0 0 0 hsl(43 96% 56% / 0.5)' }, '50%': { boxShadow: '0 0 30px 8px hsl(43 96% 56% / 0.2)' } },
        'flash-gold': { '0%': { backgroundColor: 'hsl(43 96% 56% / 0)' }, '30%': { backgroundColor: 'hsl(43 96% 56% / 0.25)' }, '100%': { backgroundColor: 'hsl(43 96% 56% / 0)' } },
        'spotlight-sweep': { '0%': { transform: 'rotate(-12deg) translateX(-30%)' }, '100%': { transform: 'rotate(12deg) translateX(30%)' } },
        'floodlight-flicker': { '0%,100%': { opacity: '0.3' }, '45%': { opacity: '0.35' }, '50%': { opacity: '0.25' }, '55%': { opacity: '0.38' } },
        'ball-spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } },
        'ticker-scroll': { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        'glow-pulse': { '0%,100%': { boxShadow: '0 0 20px -4px hsl(217 91% 56% / 0.4)' }, '50%': { boxShadow: '0 0 40px -4px hsl(217 91% 56% / 0.7)' } },
        'whistle-blow': { '0%': { transform: 'scale(1)' }, '30%': { transform: 'scale(1.15) rotate(-5deg)' }, '60%': { transform: 'scale(0.95) rotate(3deg)' }, '100%': { transform: 'scale(1)' } },
        'ripple': { '0%': { transform: 'scale(0)', opacity: '0.6' }, '100%': { transform: 'scale(4)', opacity: '0' } },
        'row-slide-in': { from: { opacity: '0', transform: 'translateX(-12px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        'count-up': { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'stadium-pan': { '0%': { backgroundPosition: '0% 50%' }, '100%': { backgroundPosition: '100% 50%' } },
        'fog-drift': { '0%': { transform: 'translateX(-10%) translateY(0)' }, '50%': { transform: 'translateX(10%) translateY(-5%)' }, '100%': { transform: 'translateX(-10%) translateY(0)' } },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'slide-up-fade': 'slide-up-fade 0.5s ease-out both',
        'slide-in-right': 'slide-in-right 0.4s ease-out both',
        'scale-in': 'scale-in 0.3s ease-out both',
        'float': 'float 5s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s infinite',
        'pulse-gold': 'pulse-gold 1s ease-in-out infinite',
        'flash-gold': 'flash-gold 0.8s ease-out',
        'spotlight-sweep': 'spotlight-sweep 8s ease-in-out infinite alternate',
        'floodlight-flicker': 'floodlight-flicker 6s ease-in-out infinite',
        'ball-spin': 'ball-spin 1.2s linear infinite',
        'ticker-scroll': 'ticker-scroll 30s linear infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'whistle-blow': 'whistle-blow 0.5s ease-out',
        'ripple': 'ripple 0.6s ease-out',
        'row-slide-in': 'row-slide-in 0.3s ease-out both',
        'count-up': 'count-up 0.4s ease-out both',
        'stadium-pan': 'stadium-pan 40s ease-in-out infinite alternate',
        'fog-drift': 'fog-drift 20s ease-in-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
export default config;
