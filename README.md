# GymQuest 🏋️

**A free, offline personal workout tracker for planning workouts, tracking progress, building
streaks, earning XP, and staying consistent.**

GymQuest is a small static web app — no account, no sign-up, no server. Open it and train. It shows
you today's workout, remembers what you lifted last time, rewards you for showing up, and keeps
everything on your own device.

**Live version:** https://surotvsk.github.io/Gymquest/

---

## Features

- **Custom workout plans** — start from the built-in Push / Pull / Legs plans, rename them, reorder
  them, delete them, or add as many of your own as you like.
- **Editable weekly goal** — choose how many workouts you want to complete per week (1–7) and change
  it whenever you want; every counter, streak and reward recalculates immediately.
- **Workout rotation** — the next recommended workout follows the order of your own plan list, based
  on the last workout you completed.
- **Progress tracking** — full workout history with dates, exercises, sets, reps, weights, XP and
  notes. Edit or delete any past workout.
- **Personal records and milestones** — best weight per exercise plus an automatic 5 kg milestone
  badge for every personal record you set.
- **XP, levels and achievements** — earn XP for finishing workouts and completing sets, level up,
  and unlock achievements automatically.
- **Weekly streaks** — consistency is measured in weeks. Reach your goal and the streak grows.
- **Rest timer** — 60 / 90 / 120 second countdown during a workout.
- **Comparison with last time** — every exercise shows whether you went heavier or lighter than your
  previous session.
- **Two languages** — full Slovak and English interface with an instant `SK | EN` toggle.
- **Export and import** — back up or restore all of your data as a JSON file.
- **Installable** — add it to your phone's home screen and it opens like a native app.

---

## How to run it

**Online:** open https://surotvsk.github.io/Gymquest/

**Locally:** no installation, no build step and no dependencies. Just open `index.html` in a
browser — double-click the file or drag it into a browser window. The app works completely offline.

> Your data is stored per browser and per address, so the local copy and the online copy keep
> separate data. Use **Export data** / **Import data** to move your history between them.

---

## Files

| File | Purpose |
|---|---|
| `index.html` | Page structure — screens, tab bar, dialogs, meta tags |
| `style.css` | Dark theme, colours, layout, responsive rules |
| `script.js` | All application logic — state, workouts, rotation, streaks, XP, achievements, translations |
| `manifest.json` | Web app manifest so the app can be installed to a home screen |
| `apple-touch-icon.png`, `icon-192.png`, `icon-512.png` | Home screen and app icons |
| `README.md` | This documentation |

---

## Screens

### Today
How many workouts you have completed this week, your current consistency streak, a motivational
line, the recommended next workout, and the big **Start workout** button. You can also mark a week
as excused if you are busy or ill.

### Workout
The selected plan name with a **✏️ Edit plan** button, and a row of plan chips for switching between
plans. Editing a plan lets you rename it, reorder it with the ‹ › buttons, delete it with 🗑️, and
change its exercises — each with sets, reps and target weight in kilograms.

Mark each set as done while you train, then press **Finish workout**. You can also run a rest timer
or reset the current workout without touching your history.

### Progress
Totals for this week, this month and all time, your personal records, and the full history of
completed workouts. Every workout in the history can be edited ✏️ or deleted 🗑️.

### Motivation
Your XP total, your level with a progress bar, and every achievement — including the 5 kg milestone
badges earned for personal records.

---

## How it works

- **Recommended workout** — GymQuest rotates through your plans in the order you arranged them
  (for example Push → Pull → Legs → your own plan), based on the last completed workout. You can
  always pick a different plan manually. The recommendation is shown on the Today screen and marked
  with ✦ on the plan chips.
- **Weekly goal** — set on first launch and changeable any time in ⚙️ Settings. Pick a number from
  1 to 7 and confirm with **Save goal**. Doctor's-note weeks can be marked as excused in Settings so
  the streak stays intact.
- **Streak** — counted in weeks: hitting your weekly goal extends the streak by one week.
- **Excused weeks** — mark a heavy week with the button on the Today screen and your streak is not
  broken.
- **XP and levels** — every workout gives **20 XP** plus **2 XP** for each completed set. You need
  100 XP to reach the next level.
- **Achievements** — unlocked automatically and stored with the date they were earned. Each exercise
  unlocks 5 kg milestones as you set new personal records (for example 50 kg, then 55 kg, then
  60 kg…).

---

## Languages

GymQuest ships with a full **Slovak** and **English** interface:

- The **`SK | EN`** toggle in the header translates the entire interface instantly, and your choice
  is saved.
- **Built-in plans and exercises** are app content and are translated, so the Slovak plan *Nohy*
  appears as *Legs* in English.
- **Custom exercises** you create or rename are never translated — they appear exactly as you typed
  them.
- A **renamed plan** becomes a custom name and is never translated. Rename *Nohy* to *Nohy + Core*
  and it stays *Nohy + Core* in English too. Untouched built-in plans keep translating.
- **Workout history is an immutable record**: it keeps the exercise and plan names that were in use
  when the workout was logged, so a later rename or deletion never rewrites the past.

---

## History: undo, edit, delete

- After finishing a workout you can press **Undo this workout** in the dialog — the workout and its
  XP are removed.
- In **Progress**, every workout has ✏️ (edit date, note, sets, reps and weights) and 🗑️ (delete)
  buttons. After any change, counts, streak, XP, level, records and achievements are recalculated.
- **Reset workout** on the Workout screen clears only the sets you have marked in the current
  session — your history is never touched.

---

## Export, import and reset

- **Export data** (⚙️ Settings) downloads all of your data as a JSON file.
- **Import data** restores your data from a JSON backup, with validation and a confirmation prompt.
- **Reset data** erases everything after a double confirmation.

---

## Data storage and privacy

Everything is stored in your browser's `localStorage` under the key `gymquest`, and survives page
refreshes and browser restarts.

- **There is no backend, no database, no account system, no analytics and no tracking.**
- Your workouts, plans, XP, streaks and settings **never leave your device** — nothing is uploaded
  anywhere, because there is no server to receive it.
- When several people use the same link, **each person's data is private to their own browser.**
  Nobody can see anybody else's workouts.
- On first launch, after confirming your weekly goal, **no demo data is created** — you start with a
  clean history (0 workouts, 0 XP, no achievements). You can load demo data at any time from
  ⚙️ Settings with **Load demo data**, and remove it with **Remove demo data**.

### Clearing your data

Open **DevTools (F12) → Application → Local Storage → `gymquest`** and delete the value, or use
**Reset data** in Settings.

### A note for iPhone users

Safari removes script-writable storage (including `localStorage`) after roughly **7 days without
visiting the site**. Adding GymQuest to your **Home Screen** avoids that limit, which is the
recommended way to use it on iOS. Regardless: **export a backup occasionally** — a browser is not a
durable database.

---

## Deployment

GymQuest is a purely static site, so it is published with **GitHub Pages** and needs no build step,
no CI pipeline and no server.

- **Source:** the `main` branch, `/ (root)` folder.
- **To deploy your own copy:** create a public repository, push these files to `main`, then open
  **Settings → Pages**, choose **Deploy from a branch**, select `main` and `/ (root)`, and save.
- **Resulting URL:** `https://<your-user>.github.io/<your-repo>/`

Nothing has to be compiled: the files in the repository are exactly the files the browser runs.

---

## Technology

Pure **HTML**, **CSS** and **vanilla JavaScript**. No frameworks, no database, no backend, no
external services, no CDN and no third-party libraries. There is nothing to install and nothing to
build.

---

## Licence

This is a personal project and no licence file is included, so no reuse rights are granted beyond
viewing the source.
