/** Shared by the three ALIGN apps. Keep in sync with shared/ in the workspace. */
export default {
  content: ['./src/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        cream: '#FFFBF3', paper: '#FFFFFF', sand: '#F7F0E1', sand2: '#EDE4CF', line: '#D9D2C2',
        navy: '#00224E', ink: '#0B1B36', mid: '#46557A', faint: '#7A86A3',
        sun: '#FFD265', sun2: '#FFF3CF', sun3: '#FFE7A3',
        signal: '#0794FF', signal2: '#0571C9', sky: '#BDDDFF', sky2: '#E6F2FF',
        green: '#1B7F52', green2: '#E3F4EA', ember: '#B8530A', ember2: '#FBE9DC', royal: '#0E2DD2', royal2: '#E7EBFF',
      },
      fontFamily: {
        head: ['"League Spartan"', 'system-ui', 'sans-serif'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"DM Mono"', 'ui-monospace', 'monospace'],
        hi: ['"Baloo 2"', '"Noto Sans Devanagari"', 'sans-serif'],
        hibody: ['"Noto Sans Devanagari"', '"DM Sans"', 'sans-serif'],
      },
      fontSize: {
        cap: ['13px', '18px'], sm: ['14px', '20px'], base: ['16px', '24px'], lg: ['18px', '24px'],
        h3: ['20px', '26px'], h2: ['24px', '30px'], h1: ['30px', '34px'], d1: ['44px', '46px'],
      },
      borderRadius: { xl2: '18px', xl3: '24px' },
      boxShadow: {
        btn: '0 3px 0 #00224E', btnHover: '0 4px 0 #00224E', card: '0 2px 0 rgba(0,34,78,.12), 0 8px 24px -12px rgba(0,34,78,.25)',
        lift: '0 18px 40px -18px rgba(0,34,78,.45)', phone: '0 40px 80px -30px rgba(0,34,78,.55), 0 0 0 10px #00224E',
      },
    },
  },
}
