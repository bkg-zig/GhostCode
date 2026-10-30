/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          dark: '#0f172a',
          darker: '#1e1e1e',
        },
        accent: {
          turquoise: '#00ffe0',
          violet: '#7c3aed',
          blue: '#38bdf8',
          gold: '#facc15',
        },
        text: {
          light: '#f9fafb',
          gray: '#9ca3af',
        },
      },
      fontFamily: {
        sans: ['Satoshi', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'gradient-dark': 'linear-gradient(135deg, #0f172a 0%, #1e1e1e 100%)',
        'gradient-accent': 'linear-gradient(135deg, #00ffe0 0%, #7c3aed 100%)',
      },
      boxShadow: {
        glow: '0 4px 30px rgba(0, 255, 224, 0.3)',
        premium: '0 4px 30px rgba(0, 0, 0, 0.4)',
      },
      backdropBlur: {
        glass: '12px',
      },
    },
  },
  plugins: [],
}
