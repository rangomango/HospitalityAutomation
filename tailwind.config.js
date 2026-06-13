/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Lance.live dark palette
        lance: {
          bg:           '#08090a',   // near-black page background
          surface:      '#121618',   // card / panel
          elevated:     '#191e21',   // slightly lifted surface
          border:       '#2BCA9533',   // teal glow border  ~20% opacity
          'border-sub': '#2BCA951A',   // subtle teal glow ~10% opacity
          accent:       '#2BCA95',   // primary teal
          'accent-hov': '#23a87c',   // teal hover
          'accent-dim': '#0d3327',   // dark teal background tint
          'accent-lt':  '#7ff2c6',   // light mint highlight
          gold:         '#C9902F',   // warm amber (events / warnings)
          'gold-lt':    '#e8b254',   // lighter gold
          'gold-dim':   '#2e1e06',   // dark gold tint
          teal:         '#315F75',   // dark teal blue (secondary)
          text:         '#ffffff',   // primary text
          'text-md':    '#8ab4a8',   // secondary text
          'text-sub':   '#4a7068',   // very muted text
        },
      },
    },
  },
  plugins: [],
};
