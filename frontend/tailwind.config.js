export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        terracotta: {
          DEFAULT: '#9c3b1b',
          50: '#fbf3ef',
          100: '#f3e2d9',
          200: '#e6c2b0',
          300: '#d89a80',
          600: '#8a3417',
          700: '#6f2a12',
        },
        clay: '#c86a3f',
        charcoal: {
          DEFAULT: '#26221f',
          muted: '#6b635a',
          soft: '#8c8378',
        },
        cream: '#f5f1ea',
        paper: '#fffdf9',
        sand: {
          DEFAULT: '#bdb4a7',
          light: '#e2dbd0',
          lighter: '#f0eae1',
        },
        verified: {
          DEFAULT: '#2f6b4f',
          soft: '#e8f0ea',
        },
        ai: {
          DEFAULT: '#5b4a8a',
          soft: '#f2eff8',
          border: '#ddd4ee',
        },
        pending: {
          DEFAULT: '#9c6a12',
          soft: '#fdf3e3',
        },
        flagged: {
          DEFAULT: '#a52a2a',
          soft: '#fbeceb',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        deva: ['"Noto Serif Devanagari"', 'Georgia', 'serif'],
      },
      borderRadius: {
        card: '10px',
      },
      transitionTimingFunction: {
        firm: 'cubic-bezier(0.23, 1, 0.32, 1)',
      },
      maxWidth: {
        feed: '600px',
      },
      screens: {
        xs: '375px',
      },
    },
  },
}

