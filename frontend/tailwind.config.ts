import type { Config } from 'tailwindcss';

// Every color reads a CSS variable holding "R G B" channels, so themes switch instantly
// and Tailwind opacity modifiers (bg-primary/10) keep working.
const token = (name: string): string => `rgb(var(--color-${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        primary: token('primary'),
        'on-primary': token('on-primary'),
        accent: token('accent'),
        'on-accent': token('on-accent'),
        bg: token('bg'),
        surface: token('surface'),
        'surface-2': token('surface-2'),
        fg: token('fg'),
        muted: token('muted'),
        border: token('border'),
        ink: token('ink'),
        danger: token('danger'),
        warn: token('warn'),
        ok: token('ok'),
      },
      fontFamily: {
        sans: ['Inter', 'Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: { xl2: '1.25rem' },
      boxShadow: {
        card: '0 1px 2px rgb(0 0 0 / 0.04), 0 4px 16px rgb(0 0 0 / 0.06)',
      },
    },
  },
  plugins: [],
} satisfies Config;
