# ALIGN · Student app

For students living in IIT Roorkee Bhawans. Report what broke by tapping it in your room, say when you are free, follow the repair live, and close the job with your own 4-digit code.

Part of ALIGN, a hostel maintenance system for IIT Roorkee (DEC 301 User Interaction Project).

## Run it

```bash
npm install
npm run dev      # local dev server
npm run build    # production build in dist/ (relative paths, host anywhere)
```

## What is inside

- `src/ds/` shared ALIGN design system (same files in all three apps):
  - `ui.tsx` structured components: Button, IconButton (with hover names), Choice tiles with a corner check, Chip, Segmented, Toggle,
    TextField, OTP boxes, Keypad, Card, ListRow, Tag, Steps, Timeline, Stars, Sheet, Dialog, sticky-note / phone-notification / snackbar toasts.
  - `motion.tsx` app-specific motion: word-by-word headline rise, paper drop, rubber stamp, flip digits, count-up, ink lines.
  - `nav.tsx` screen stack with custom transitions: page push, sheet rise, paper-plane wipe (student), blue wave wash (technician).
  - `fx.ts` sound + haptics. Every sound is synthesised live with Web Audio (tap, select, keypad notes, swoosh, sticky-note slap,
    stamp, success chime, error, bell) and paired with a vibration pattern on phones. Mute from the side panel or profile.
  - `stage.tsx` on a laptop the phone apps sit in a phone frame with a side panel listing every screen and the "simulate" actions.
- `src/data/iitr.ts` mock world modelled on IIT Roorkee: Bhawans (Himalaya, Sarojini, Kasturba, Rajendra, Govind, Ganga...),
  IWD Electrical / Civil sections, technicians, items that break, evening visit slots, `name@dept.iitr.ac.in` emails.
- Everything you type is kept in this browser (localStorage). "Restart" in the side panel clears it.

## Try this path

1. Sign in with any `name@xx.iitr.ac.in` email. The 6-digit code arrives as a mail notification at the top: tap **Fill in the code**.
2. Pick your Bhawan, block, floor and room, then your usual free hours.
3. On Home, tap a yellow dot on the fan. Choose what it is doing, take a photo, pick a slot, send. A paper plane carries it off.
4. Watch it get checked and booked by itself. Then use **Simulate** (side panel on a laptop, flask button on a phone) for the technician heading out, arriving, entering your code, needing a part, or finding the door locked.
5. Shared spaces (washroom, corridor) detect a duplicate report and let you join it.
