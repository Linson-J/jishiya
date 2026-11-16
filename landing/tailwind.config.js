/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: { DEFAULT: '#f8f6f1', dark: '#ede9e1' },
        ink: { DEFAULT: '#0e0e0e', mid: '#3a3a3a', soft: '#767676' },
        rule: '#d0cbc1',
        accent: { DEFAULT: '#c0392b', muted: '#a85548' },
        gold: '#d4a84b',
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'Times New Roman', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'Segoe UI', 'sans-serif'],
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        ticker: 'marquee 40s linear infinite',
        logos: 'marquee 45s linear infinite',
      },
    },
  },
  plugins: [],
};
