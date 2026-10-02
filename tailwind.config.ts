import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: 'rgb(var(--paper) / <alpha-value>)',
          2: 'rgb(var(--paper-2) / <alpha-value>)',
          3: 'rgb(var(--paper-3) / <alpha-value>)',
        },
        ink: {
          DEFAULT: 'rgb(var(--ink) / <alpha-value>)',
          soft: 'rgb(var(--ink-soft) / <alpha-value>)',
          mute: 'rgb(var(--ink-mute) / <alpha-value>)',
        },
        clay: {
          DEFAULT: 'rgb(var(--clay) / <alpha-value>)',
          deep: 'rgb(var(--clay-deep) / <alpha-value>)',
        },
        moss: {
          DEFAULT: 'rgb(var(--moss) / <alpha-value>)',
          deep: 'rgb(var(--moss-deep) / <alpha-value>)',
        },
        amber: {
          DEFAULT: 'rgb(var(--amber) / <alpha-value>)',
        },
        rule: 'rgb(var(--rule) / <alpha-value>)',
        // section colours, one per area of the day
        night: 'rgb(var(--night) / <alpha-value>)',
        tang: 'rgb(var(--tang) / <alpha-value>)',
        aqua: 'rgb(var(--aqua) / <alpha-value>)',
        pink: 'rgb(var(--pink) / <alpha-value>)',
        leaf: 'rgb(var(--leaf) / <alpha-value>)',
        sun: 'rgb(var(--sun) / <alpha-value>)',
        coral: 'rgb(var(--coral) / <alpha-value>)',
        tone: {
          DEFAULT: 'rgb(var(--tone) / <alpha-value>)',
          soft: 'rgb(var(--tone-soft) / <alpha-value>)',
        },
      },
      boxShadow: {
        pop: '4px 4px 0 0 rgb(var(--ink))',
        'pop-sm': '2px 2px 0 0 rgb(var(--ink))',
        'pop-tone': '5px 5px 0 0 rgb(var(--tone))',
      },
      fontFamily: {
        display: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
        serif: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"DM Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      letterSpacing: {
        masthead: '0.32em',
      },
      animation: {
        'fade-up': 'fadeUp 0.7s cubic-bezier(0.2, 0.7, 0.2, 1) both',
        'ink-bleed': 'inkBleed 1.2s cubic-bezier(0.2, 0.7, 0.2, 1) both',
        wiggle: 'wiggle 0.5s ease-in-out',
        float: 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-6deg)' },
          '75%': { transform: 'rotate(6deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        inkBleed: {
          '0%': { opacity: '0', filter: 'blur(6px)' },
          '100%': { opacity: '1', filter: 'blur(0)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
