export default {
  content: ['./src/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        cream: '#FFFBF3', sand: '#F7F0E1', sand2: '#EDE4CF', navy: '#00224E', mid: '#3E4F72',
        sun: '#FFD265', sun2: '#FFF3CF', signal: '#0794FF', sky: '#BDDDFF', green: '#1B7F52',
        ember: '#B8530A', royal: '#0E2DD2',
      },
      fontFamily: {
        head: ['"League Spartan"', 'sans-serif'],
        body: ['"Hiragino Maru Gothic ProN"', '"Rounded Mplus 1c"', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
        mark: ['Kodchasan', 'sans-serif'],
        hi: ['"Baloo 2"', '"Noto Sans Devanagari"', 'sans-serif'],
        hibody: ['"Noto Sans Devanagari"', 'sans-serif'],
      },
    },
  },
}
