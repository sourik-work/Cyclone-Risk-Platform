import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'bg-base': '#0a0a0f',
        'bg-surface-1': '#121218',
        'bg-surface-2': '#1a1a22',
        'bg-surface-3': '#232330',
        'surface-1': '#121218',
        'surface-2': '#1a1a22',
        'surface-3': '#232330',
        'border-subtle': 'rgba(255, 255, 255, 0.06)',
        'border-default': 'rgba(255, 255, 255, 0.10)',
        'border-strong': 'rgba(255, 255, 255, 0.16)',
        'text-primary': '#f5f5f7',
        'text-secondary': '#a1a1aa',
        'text-tertiary': '#71717a',
        'accent-cyan': '#00e5ff',
        'accent-blue': '#3b82f6',
      },
      borderRadius: {
        'sm': '8px',
        'md': '12px',
        'lg': '20px',
        'xl': '28px',
      },
      transitionTimingFunction: {
        'standard': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
