/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        marker: ['Caveat', 'cursive'],
        hand: ['Kalam', 'cursive'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        pixel: ['"Press Start 2P"', 'monospace'],
      },
      colors: {
        // Deep space "sketchbook at night" palette
        ink: '#101223',       // near-black indigo ink
        space: '#0a0b1a',     // deep space
        nebula: '#161a3a',    // panel indigo
        paper: '#fbf6e9',     // cream sketch paper
        parch: '#f3ead3',     // aged paper
        // Crayon accents
        coral: '#ff6b6b',
        tangerine: '#ffa94d',
        gold: '#ffd43b',
        mint: '#63e6be',
        sky: '#74c0fc',
        grape: '#b197fc',
        saber: '#5ce1e6',     // star wars saber cyan
        creeper: '#5fbf5f',   // minecraft green
      },
      keyframes: {
        floaty: {
          '0%,100%': { transform: 'translateY(0) rotate(var(--r,0deg))' },
          '50%': { transform: 'translateY(-14px) rotate(var(--r,0deg))' },
        },
        twinkle: {
          '0%,100%': { opacity: '0.25', transform: 'scale(0.85)' },
          '50%': { opacity: '1', transform: 'scale(1.15)' },
        },
        wobble: {
          '0%,100%': { transform: 'rotate(-2deg)' },
          '50%': { transform: 'rotate(2deg)' },
        },
        dashdraw: {
          to: { 'stroke-dashoffset': '0' },
        },
      },
      animation: {
        floaty: 'floaty 6s ease-in-out infinite',
        twinkle: 'twinkle 3s ease-in-out infinite',
        wobble: 'wobble 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
