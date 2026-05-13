/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
      },
      colors: {
        ink: {
          DEFAULT: '#0D0D0D',
          50: '#F5F5F3',
          100: '#E8E8E4',
          200: '#C9C9C1',
          300: '#ABABAA',
          400: '#6B6B68',
          500: '#3D3D3A',
          600: '#2A2A28',
          700: '#1C1C1A',
          800: '#131312',
          900: '#0D0D0D',
        },
        accent: {
          DEFAULT: '#E8FF4A',
          dim: '#C8DF2A',
          glow: 'rgba(232, 255, 74, 0.15)',
        },
        surface: {
          DEFAULT: '#161614',
          raised: '#1E1E1C',
          high: '#262624',
          border: '#2E2E2C',
        }
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease forwards',
        'fade-in': 'fadeIn 0.4s ease forwards',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'scan': 'scan 2s linear infinite',
        'count-up': 'countUp 1s ease forwards',
        'bar-fill': 'barFill 1.2s cubic-bezier(0.4, 0, 0.2, 1) forwards',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(232, 255, 74, 0.1)' },
          '50%': { boxShadow: '0 0 40px rgba(232, 255, 74, 0.25)' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(400%)' },
        },
        barFill: {
          '0%': { width: '0%' },
          '100%': { width: 'var(--bar-width)' },
        },
      },
    },
  },
  plugins: [],
}
