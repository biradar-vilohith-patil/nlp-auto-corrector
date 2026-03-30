/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Cormorant Garamond'", 'Georgia', 'serif'],
        body:    ["'DM Sans'", 'sans-serif'],
        mono:    ["'JetBrains Mono'", 'monospace'],
      },
      colors: {
        ink:    { DEFAULT: '#1a1a2e', 50: '#f0f0f8', 100: '#e0e0f0' },
        slate2: { DEFAULT: '#334155', light: '#f8fafc' },
      },
      animation: {
        'fade-up':      'fadeUp .55s cubic-bezier(.22,1,.36,1) both',
        'fade-down':    'fadeDown .55s cubic-bezier(.22,1,.36,1) both',
        'fade-in':      'fadeIn .4s ease both',
        'slide-left':   'slideLeft .55s cubic-bezier(.22,1,.36,1) both',
        'slide-right':  'slideRight .55s cubic-bezier(.22,1,.36,1) both',
        'shimmer':      'shimmer 1.7s infinite',
        'pulse-ring':   'pulseRing 2s ease-in-out infinite',
        'float':        'float 6s ease-in-out infinite',
        'gradient-x':   'gradientX 5s ease infinite',
      },
      keyframes: {
        fadeUp:     { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'none' } },
        fadeDown:   { from: { opacity: 0, transform: 'translateY(-16px)' }, to: { opacity: 1, transform: 'none' } },
        fadeIn:     { from: { opacity: 0 }, to: { opacity: 1 } },
        slideLeft:  { from: { opacity: 0, transform: 'translateX(-28px)' }, to: { opacity: 1, transform: 'none' } },
        slideRight: { from: { opacity: 0, transform: 'translateX(28px)' }, to: { opacity: 1, transform: 'none' } },
        shimmer:    { '0%': { backgroundPosition: '200% 0' }, '100%': { backgroundPosition: '-200% 0' } },
        pulseRing:  { '0%,100%': { boxShadow: '0 0 0 0 var(--ring-color)' }, '50%': { boxShadow: '0 0 0 8px transparent' } },
        float:      { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-12px)' } },
        gradientX:  { '0%,100%': { backgroundPosition: '0% 50%' }, '50%': { backgroundPosition: '100% 50%' } },
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(.34,1.56,.64,1)',
        smooth: 'cubic-bezier(.22,1,.36,1)',
      },
    },
  },
  plugins: [],
}
