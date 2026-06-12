/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Lance.live dark palette
        lance: {
          bg:           '#08090a',   // near-black page background
          surface:      '#0e1c1f',   // card / panel
          elevated:     '#152428',   // slightly lifted surface
          border:       '#1d3535',   // default border
          'border-sub': '#102020',   // subtle border
          accent:       '#2BCA95',   // primary teal
          'accent-hov': '#23a87c',   // teal hover
          'accent-dim': '#0d3327',   // dark teal background tint
          'accent-lt':  '#7ff2c6',   // light mint highlight
          gold:         '#C9902F',   // warm amber (events / warnings)
          'gold-lt':    '#e8b254',   // lighter gold
          'gold-dim':   '#2e1e06',   // dark gold tint
          teal:         '#315F75',   // dark teal blue (secondary)
          text:         '#d8ebe5',   // primary text
          'text-md':    '#8ab4a8',   // secondary text
          'text-sub':   '#4a7068',   // very muted text
        },
      },
    },
  },
  plugins: [],
};
