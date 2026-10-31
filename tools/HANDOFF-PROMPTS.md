# PROMPT 1 — paste this first (everything about the project)

You are continuing my project "ALIGN" from another Claude session. Read everything below carefully before doing anything. Talk to me in very simple, step-by-step language, like to a 6th-standard student. Do not ask me to repeat things that are written here.

## What ALIGN is
Hostel maintenance apps for IIT Roorkee. Three apps:
1. Student app (phone, 390 x 844): report what broke, pick a visit time, follow the job, give the closing code, rate the visit.
2. Technician app (phone, 390 x 844, Hindi big + English small, voice help): bag check, today's jobs, job details, trip, work steps, closing code / photo, parts, errors.
3. Supervisor desk (desktop, 1440 x 900): desk overview, to check, review report (+ merge), closure review, load forecast, blocked jobs (+ escalate / reassign), disputes, fixtures, team, technician, rules, errors.

## Links
- GitHub (push to `main`, Vercel deploys automatically from `main`):
  - https://github.com/SiddheshNagawade/student-HM → https://student-hm.vercel.app
  - https://github.com/SiddheshNagawade/technician-HM → https://technician-hm.vercel.app
  - https://github.com/SiddheshNagawade/Supervisor-HM → https://supervisor-hm.vercel.app
- Figma (source of truth): https://www.figma.com/design/vl2TtBS0hNrZqJHNGiQIs2/ — page "v3" (node 217:32), sections Student / Technician / Supervisor. File key `vl2TtBS0hNrZqJHNGiQIs2`.
- My ChatGPT image chat (for new mascot poses): https://chatgpt.com/g/g-Wud3tXQj3-image-generator-pro/c/6ae67566-9530-83e8-a68a-6c34a31c4f18
- Every repo has a `CLAUDE.md` with the full technical notes. Read `student-hm/CLAUDE.md` first.
- `student-hm/tools/` has: `shared/` (master copy of the code shared by all 3 apps), `sync-shared.sh`, `figma/` (Figma export scripts + all frames as data), `mascot-refs/` (beaver reference sheet + image prompts).

Clone all three repos side by side in one folder if they are not there yet.

## My design rules (always follow)
1. The apps must look exactly like my Figma. Copy my elements and drawings. Do NOT invent your own UI elements, colours or icons. If something must be new, draw it in the same hand-drawn navy-outline style and tell me.
2. Animate MY illustrations, once, never looping, in a way that matches the drawing (the paper plane flies its dotted trail, sticky notes slap on, stamps come down, the beaver settles, the fan spins down, the notice board swings on its pin and stops).
3. No text animations. Only graphics move.
4. Never change titles or real buttons. Helper sentences that only repeat what the screen already shows were removed on purpose. Keep screens breathable.
5. Professional, not childish, not "AI default" looking. Be exploratory and creative with interaction, like a designer would.
6. Institute email format: `name@design.iitr.ac.in` (any `...iitr.ac.in` is accepted).
7. Technicians work 10 AM to 6 PM only. Every time, slot, shift and timeline must be inside that.
8. Screens must adapt to every device size without stretching and without cutting anything off.
9. Tappable parts must look tappable without "+" icons covering the drawing (soft yellow glow, lift on hover, press-in).
10. Before every push: build, open every screen with Playwright (390x844 phones, 1440x900 desk), make sure there are no errors, and look at screenshots. Then commit and push to `main`.

## What is already built (do not redo)
- All screens of all 3 apps are built from the Figma frames (data in `src/<app>/fig.json`, drawings in `public/fig/*.svg`, renderer `src/fig/Fig.tsx`, one-time animations `src/fig/anim.tsx`).
- Student: time wheel on the dotted circle for visit times (`src/student/wheel.tsx`: drag, scroll, arrow keys, tap; 10:00 AM–5:30 PM; past slots greyed), sun instead of moon, free-hours grid 10–12 / 12–2 / 2–4 / 4–6, swinging notice board on "Is this you?" and Profile, room hotspots that glow once in turn.
- Technician: Hindi + English voice clips, part highlight sits behind the drawings.
- Supervisor: fixed navy rail that never moves, working dialogs (merge, escalate, reassign), clickable rule words that resize, forecast "move two to Monday" animation, readable minimum size with sideways scroll on small screens.
- Mascot (`src/fig/mascot.tsx`): `peek()` = his head rises from the bottom edge with a speech bubble on events (sign-in hello, bag ready, nice photo, fixed, wrong code, booked, rated, closed, merged, escalated, rules saved…). `<Hanging>` = upside down holding a sign on error pages. `<OfflineBuddy>` = drops in when the internet goes, then only his upside-down head stays at the top; "Back online!" when it returns.

Reply "Got it" with a 5-line summary of what you understood, then wait for my second message.


# PROMPT 2 — paste this second (what to do next)

Now do these, in order. Do one thing at a time, show me screenshots, then push to `main`.

## 1. New beaver poses with my ChatGPT chat (use my Chrome through Claude in Chrome)
- Open my ChatGPT chat: https://chatgpt.com/g/g-Wud3tXQj3-image-generator-pro/c/6ae67566-9530-83e8-a68a-6c34a31c4f18
- First message there: attach `student-hm/tools/mascot-refs/beaver-reference.png` and send the "First message" from `student-hm/tools/mascot-refs/PROMPTS.md`.
- Then send ONE pose per message, in this order: 1a, 1b, 1c (peek wave), 2a, 2b (hanging with sign), 3a, 3b (big-head cheer / thumbs up).
- After each image, check it before using it: two eyes, both drawn, each with a white shine dot; yellow hard hat with navy rim; two front teeth; flat colours only (#00224E, #FFFBF3, #FFD265, #E3B987), no shading; thick navy outline everywhere; correct number of fingers; nothing cut off; same head size and position across a series. If something is wrong, send the matching fix line from PROMPTS.md and check again.
- Save good images, turn them into clean vectors (for example `pip install vtracer`), snap colours to the exact app colours, put them in `public/fig/` of all 3 apps.
- Use them in `src/fig/mascot.tsx`: a frame-by-frame one-time peek-and-wave, the hanging beaver with the sign (sign stays readable), and a big-head celebration when a job closes / a closure is accepted. His full body should not be small in the corner; think Duolingo: big head peeking in from the edge, waving, reacting.

## 2. More life and interaction (explore, be creative)
- Use my reference ideas: a half-circle score dial (supervisor load / student request status), soft characters peeking from the screen edges, a clock-dial scheduler style.
- Smooth, one-time animations for state changes (a job moving from step to step, a closure being stamped, the forecast bars shifting), but never animate text.
- Keep checking all screens for leftover sentences that only repeat what the screen shows, and remove them (never titles or buttons).

## 3. Final audit and push
- Build all 3 apps, open every screen at 360x740, 390x844, 412x915, 768x1024, 1366x768 and 1440x900, check nothing is cut off or stretched, no console errors.
- Commit and push all 3 repos to `main`. Then tell me in simple steps what changed and what I should open to see it.
