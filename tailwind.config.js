/** Shared by the three ALIGN apps. Keep in sync with shared/ in the workspace. */
export default {
  content: ['./src/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        /* Base, from the Figma: navy ink on warm paper, sunflower accent. */
        cream: '#FFFBF3', paper: '#FFFFFF', sand: '#F6F0E3', sand2: '#ECE4D2', line: '#DDD5C4', rule: '#ECE6D9',
        navy: '#00224E', ink: '#0B1B36', mid: '#4A5873', faint: '#7D879B',
        sun: '#FFD265', sun2: '#FCF1D4', sun3: '#F7E1A2',
        /* Technician brand blue, from the Figma. */
        signal: '#0794FF', signal2: '#0571C9',
        /* Secondary colours, taken from Roorkee rather than a default palette:
           canal = the Upper Ganga Canal, brick = the Main Building, neem = the campus trees, slate = Himalayan haze. */
        canal: '#17606B', canal2: '#DCEBEA',
        brick: '#A6402A', brick2: '#F4E1D8',
        green: '#40713F', green2: '#E4ECDD',
        sky: '#C9D7E6', sky2: '#EDF2F6',
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
        btn: '0 3px 0 #00224E', desk: '0 1px 2px rgba(0,34,78,.06), 0 1px 1px rgba(0,34,78,.04)', pop: '0 24px 60px -24px rgba(0,34,78,.40), 0 2px 6px rgba(0,34,78,.08)', btnHover: '0 4px 0 #00224E', card: '0 2px 0 rgba(0,34,78,.12), 0 8px 24px -12px rgba(0,34,78,.25)',
        lift: '0 18px 40px -18px rgba(0,34,78,.45)', phone: '0 40px 80px -30px rgba(0,34,78,.55), 0 0 0 10px #00224E',
      },
    },
  },
}
