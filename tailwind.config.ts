import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── Charte graphique Dasolabs ──────────────────────────────────
        // "magic" = base sombre (Midnight indigo / Stellar black) + Electric blue
        magic: {
          50: '#f1f1f6',   // Silver comet
          100: '#e6e6fb',
          200: '#c9c9f7',
          300: '#a3a3f2',
          400: '#7d7dec',
          500: '#4d4dec',
          600: '#3434e8', // Electric blue (accent principal)
          700: '#2a2ac0',
          800: '#23234a',
          900: '#202037', // Midnight indigo
          950: '#07070d', // Stellar black
        },
        // "gold" repurposé en bleu clair brillant (mise en avant des scores)
        gold: {
          400: '#8a8aff',
          500: '#6f6fff',
          600: '#4d4dec',
        },
        // "candy" repurposé en rouge (erreurs / refus)
        candy: {
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },
        electric: '#3434e8',
        midnight: '#202037',
        stellar: '#07070d',
        silver: '#f1f1f6',
      },
      fontFamily: {
        display: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 30px -5px rgba(52, 52, 232, 0.55)',
        'glow-gold': '0 0 30px -5px rgba(111, 111, 255, 0.5)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pop-in': {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        float: 'float 4s ease-in-out infinite',
        shimmer: 'shimmer 2.5s linear infinite',
        'pop-in': 'pop-in 0.3s ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
