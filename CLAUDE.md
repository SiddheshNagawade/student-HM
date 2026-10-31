# ALIGN: hostel maintenance apps for IIT Roorkee (project memory for Claude)

Read this first. It replaces the earlier chat history.

## The owner
Siddhesh (design student). Explain things in very simple, step-by-step language, like to a 6th-standard student.
He is a designer: he wants the apps to look exactly like his Figma, feel alive, and avoid generic "AI default" UI.

## The three apps (three GitHub repos, each deploys to Vercel from `main`)
| App | Repo | Live site | Size |
|---|---|---|---|
| Student | SiddheshNagawade/student-HM | student-hm.vercel.app | phone, 390 x 844 |
| Technician (Hindi first, English small) | SiddheshNagawade/technician-HM | technician-hm.vercel.app | phone, 390 x 844 |
| Supervisor desk | SiddheshNagawade/Supervisor-HM | supervisor-hm.vercel.app | desktop, 1440 x 900 |

Clone all three side by side in one folder. Push to `main` when he asks (he usually wants every round pushed).
Commit message footer: `Co-Authored-By: Claude <noreply@anthropic.com>` (no model names in commits).

## Figma (source of truth)
File key `vl2TtBS0hNrZqJHNGiQIs2`, page "v3" (node 217:32). Student, Technician and Supervisor sections.
Rules he gave:
- Copy the Figma elements and drawings exactly. Do not invent new UI elements or restyle with your own colours.
- Animate HIS illustrations, once (never looping), in a way that matches the drawing (plane flies its dotted trail, notes slap on, stamps come down, beaver settles, fan spins down).
- No text animations. Graphics only.
- Titles and buttons must not be changed. Helper sentences that repeat what the screen shows were removed on purpose; keep it breathable.

## How the code works (same in all three repos)
Vite + React + TypeScript + Tailwind + framer-motion.
- `src/<app>/fig.json`: the Figma screens as data (every layer: position, size, fill, stroke, font, text). Edited copies of Figma text live here (for example times changed to daytime).
- `public/fig/<node-id>.svg`: every Figma drawing exported as SVG (node id with ":" replaced by "-").
- `src/fig/Fig.tsx`: draws a Figma screen 1:1. Screens attach behaviour by Figma node id through "binds" (`text`, `hide`, `onClick`, `render`, `wrap`, `art`, `style`, `input`, `dy`).
- `src/fig/anim.tsx`: one-time animations (PlaneFlight, Slap, StampDown, PlaceDown, PopIn, RiseIn, Settle, Hop, WalkIn, Reveal, SpinDown...).
- `src/fig/mascot.tsx`: the beaver as a guide. `peek({ say, sub, mood })` makes his big head rise from the bottom edge with a speech bubble; `<Hanging>` = upside down with a sign (error pages); `<OfflineBuddy>` = drops in when the internet goes, then only his upside-down head stays at the top.
- `src/ds/*`: stage (phone frame on laptop, full screen on phone), nav (screen stack + transitions), fx (sounds), ui.
- `src/data/iitr.ts`: `createStore` (localStorage store) and IIT Roorkee mock data.
- Student: `src/student/{screens.tsx, store.ts, App.tsx, wheel.tsx}`. `wheel.tsx` = the visit-time wheel on the dotted circle (drag / scroll / arrows).
- Technician: `src/tech/{screens.tsx, store.ts, App.tsx, voice.ts}`; voice clips in `public/voice/{hi,en}/*.mp3` made by `scripts/make_voices.py` (Piper TTS).
- Supervisor: `src/supervisor/{screens.tsx, store.ts, App.tsx}`. The navy rail is drawn once in App (never moves); dialogs (merge, escalate, reassign) are rendered above everything from the Figma dialog frames.
- Any screen can be opened directly with `?s=<screen-id>` (ids are in each App.tsx).

## Shared code
`src/ds`, `src/fig`, `src/data`, `src/index.css`, `tailwind.config.js` are the same in all three repos.
The master copy is in `student-hm/tools/shared/` with `tools/sync-shared.sh`. Change the shared code once, then copy it into all three repos (the script expects a folder layout of `shared/` next to the three repos; adjust paths or copy by hand).

## Figma export tools
`student-hm/tools/figma/`: `dumper.js` / `dumper_sup.js` (scripts for the Figma plugin API through the Figma MCP `use_figma` tool, read-only), `extract.py`, `sections.json` (where each frame sits in its section), `screens.json` (all 83 frames as data), `kit.json`.

## Product rules already decided
- Institute email format: `name@design.iitr.ac.in` (any `...iitr.ac.in` accepted).
- Technicians work 10 AM to 6 PM. All visit times, slots, shifts and timelines are inside that.
- Student free-hours grid columns are 10–12, 12–2, 2–4, 4–6.
- Tappable parts of drawings show a soft yellow glow (hint once on first view); no "+" icons on top of drawings.
- Responsive: phone apps scale to fit without stretching; the supervisor desk keeps a readable minimum size and scrolls sideways on small screens.

## What was being worked on last
New mascot poses. Plan: he generates poses in his ChatGPT "Image Generator Pro" chat one at a time, using `tools/mascot-refs/PROMPTS.md` and `beaver-reference.png`. Then:
1. Check each image: two eyes with shine dots, hat, teeth, flat colours only, thick navy outline, correct finger count, nothing cut off, same size across a series.
2. Vectorize (for example `pip install vtracer`), snap colours to #00224E, #FFFBF3, #FFD265, #E3B987.
3. Put the frames into `mascot.tsx` as one-time animations (peek wave 1a–1c, hanging 2a–2b, big-head cheer 3a–3b).
With browser access (Claude in Chrome), you can type the prompts into his ChatGPT tab yourself, one pose per message, and check each image before saving.

Ideas from his reference images still to explore: half-circle score dial (supervisor load / student request status), blob characters peeking from screen edges, clock-dial scheduler.

## Checking work
Build: `npx vite build`; preview: `npx vite preview --port 4301`. Use Playwright (390x844 for phone apps, 1440x900 for the desk) to screenshot every screen and catch console errors before pushing. Compare against Figma screenshots when layout changes.
