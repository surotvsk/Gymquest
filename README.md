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
- **Full Body builder** — create a plan by picking exercises straight out of your existing plans.
  The result is an ordinary custom plan you can rename, edit, reorder or delete like any other.
- **Editable weekly goal** — choose how many workouts you want to complete per week (1–7) and change
  it whenever you want; every counter, streak and reward recalculates immediately.
- **Workout rotation** — the next recommended workout follows the order of your own plan list, based
  on the last workout you completed.
- **Progress tracking** — full workout history with dates, exercises, sets, reps, weights, XP and
  notes. Edit or delete any past workout.
- **Optional training to failure** — plan which sets you *intend* to take to failure, then confirm
  or change the real result set by set while you train. Nothing is ever assumed, forced or enabled
  by default.
- **Workout duration** — starting a workout begins a timer that measures the whole session (not just
  rests). The final duration is saved with the workout and shown in Progress and the Calendar. Your
  progress survives editing a plan, switching language or tabs, and even a page reload.
- **Personal records and milestones** — best weight per exercise plus an automatic 5 kg milestone
  badge for every personal record you set.
- **XP, levels and achievements** — earn XP for finishing workouts and completing sets, level up,
  and unlock achievements automatically.
- **Weekly streaks** — consistency is measured in weeks. Reach your goal and the streak grows.
- **Rest timer** — 60 / 90 / 120 second countdown during a workout, with an optional gentle gong
  when the countdown reaches zero. The sound is **off by default** and toggled in ⚙️ Settings.
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

The current date, weekday and ISO week number are shown under the heading.

### Calendar
A monthly grid with Monday as the first day of the week, previous/next month navigation and a
**Today** button. Each day shows its status at a glance: **green** means a workout was completed
that day (with a small badge when you trained more than once), a **muted red** day is a past day
with no workout recorded, a **neutral** day is in the future, and **today** always carries an
orange outline. The legend repeats the same meaning in words.

Tap any day in the month to see its full date and status, plus the plan name, exercises, sets,
reps, weight, completed sets, XP, note and any achievements unlocked that day. Days are matched to
your history by local calendar date, so a workout always appears on the day you recorded it.

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

## Rest timer sound

The rest timer can play a short **gentle gong** when its countdown reaches zero. It is a setting in
⚙️ Settings (*Rest timer sound* / *Zvuk po skončení pauzy*) with a **Test sound** button, and it is
**off by default** — nothing plays until you switch it on.

- The gong is generated in the browser with the Web Audio API (two soft sine tones with a slow fade
  in and a long decay). **No audio file is bundled or downloaded**, and GymQuest stays offline.
- It plays **once**, only when a countdown reaches zero by itself. Stopping the timer, resetting the
  workout or picking a different duration stays silent, and it never plays for the workout-duration
  timer or any other event.
- Toggling the setting applies immediately to a countdown that is already running.
- Audio is only started after a real tap (turning the setting on, **Test sound** or starting the
  rest timer), so browsers never block it; if a browser refuses to play, GymQuest stays silent and
  the timer keeps working.
- Your choice is stored with your settings, so it survives refresh, language switching, export and
  import.

---

## Creating a workout plan

**+ Add workout plan** asks which kind you want:

- **Blank workout plan** — an empty custom plan; add the exercises yourself in the editor.
- **Full Body builder** — pick exercises from plans you already have. Every active plan (built-in
  Push / Pull / Legs, renamed ones, and your own) appears as a section, and each exercise row shows
  its sets, reps and weight. Tick any combination, or use **Select all** / **Clear** per section.
  The counter shows how many you have picked, and a plan name is pre-filled with *Full Body*
  (*Celé telo*) — edit it before saving if you like.

Nothing is pre-selected, and **Create Full Body workout** needs at least one exercise. Created
exercises are *copies*: name, stable id and built-in/custom status, sets, reps, weight and the
planned failure sets are copied, but there is no live link to the source plan afterwards — editing
either side never changes the other. A deliberate duplicate rule applies: if the same **built-in**
exercise (same stable id) is picked from more than one section, it is added once, and the builder
says so. **Custom** exercises are never merged, even when they share a name.

The new plan is saved immediately and opens in the normal plan editor, so you can still change the
name, order, sets, reps, weights, failure sets, add exercises or delete them. From then on it behaves
exactly like any other plan: rotation, Today recommendations, history, Calendar, XP, export/import
and safe deletion all work the same way. Nothing is written to a special plan type.

---

## Training to failure (optional)

Training to failure is an optional technique — GymQuest only records what you choose, and never
switches anything on by itself.

- **Planned failure sets** — in the plan editor, every exercise has a **Sets to failure** section
  (*Série do zlyhania*). Pick any combination of set numbers, or **None**. The choices are stored
  with the plan and survive refresh, export/import, language switching and updates. Reducing the set
  count drops any selection above the new maximum; increasing it keeps your existing choices.
- **Completed failure sets** — during a workout every set has its own small flame toggle. A set that
  was planned shows a subtle dashed hint but is **never** counted as taken to failure on its own. You
  can mark any set — planned or not — and unmark a planned one, right up to the moment you finish.
- **Separate in history** — the finished workout stores the planned configuration *and* the actual
  result as two different fields. History and the Calendar day detail only ever show the actual
  result, and only when there is one. Old workouts without this data simply show no failure line.

It is tracked information only — not a training recommendation, and never medical advice.

---

## Workout duration and your active session

**Duration** — pressing **Start workout** starts a session timer shown as *Workout duration*
(*Trvanie tréningu*) above the exercise list, in `HH:MM:SS`. It measures the whole workout, not just
rests, and it keeps running while you move between exercises, mark sets, open dialogs, edit a plan,
switch tabs or send the app to the background. It is derived from an absolute start timestamp, so it
stays accurate after backgrounding, screen lock or a reload. It stops only when you confirm
**Finish workout**; the saved duration then appears as *Duration: 42 min* (*Trvanie: 42 min*) in
Progress and in the Calendar day detail. The rest timer is completely separate.

**Your progress is kept** — what you have checked off lives in an **active session** saved with your
data, not in the screen you are looking at. Editing a plan weight, saving a plan, opening the editor,
switching SK/EN, switching tabs, opening Settings or the Calendar, and a browser refresh all keep
your completed sets, your failure markers, your timer and your selected plan exactly as they were.
Changing a plan weight still updates the target weight shown for sets you have not done yet; already
completed sets are never rewritten. Saving a plan during a workout confirms it with *Plan changes are
saved. Your current workout progress is preserved.*

The session is created only when you start a workout or mark your first set, and it is cleared only
when you **confirm** Finish workout, or **confirm** Reset workout — cancelling either dialog changes
nothing. A partially finished session is never written into your history, is not included in
**Export data**, and is dropped on import, so a backup can never carry a half-finished workout onto
another device.

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

## Updates and offline use

GymQuest is a progressive web app: a service worker (`sw.js`) precaches the app shell, so after the
first successful load **it works fully offline**, including from a Home Screen icon.

When a new version is deployed, the app notices the waiting update and offers a small in-app message —
*A new version of GymQuest is available* / *Je dostupná nová verzia GymQuestu.* — with an **Update now**
/ **Aktualizovať** button. Nothing is reloaded until you press it, and the message stays hidden while
you are in the middle of something that would lose input: an active workout, an open plan editor, a
note, or a settings form.

### Deploying an update

1. Change the app files.
2. **Bump `CACHE_VERSION` in `sw.js`** (for example `v1` → `v2`).
3. Push to `main`.

Step 2 matters: the new worker only installs if `sw.js` itself changed, and a new version is what
re-fetches every asset and deletes the previous cache. Skipping it leaves readers on the old cached
files. The cache name (`gymquest-v1`, `gymquest-v2`, …) is visible in DevTools →
Application → Cache Storage, so what is deployed can be inspected directly.

---

## Technology

Pure **HTML**, **CSS** and **vanilla JavaScript**. No frameworks, no database, no backend, no
external services, no CDN and no third-party libraries. There is nothing to install and nothing to
build.

---

## Licence

This is a personal project and no licence file is included, so no reuse rights are granted beyond
viewing the source.
