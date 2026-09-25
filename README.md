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
  them (drag the ⠿ handle, or use the ‹ › buttons), delete them, or add as many of your own as you
  like.
- **Full Body builder** — create a plan by picking exercises straight out of your existing plans.
  The result is an ordinary custom plan you can rename, edit, reorder or delete like any other.
- **The same picker when you edit** — every plan editor has **Add exercises from existing plans**
  (*Pridať cviky z existujúcich plánov*), so you can pull exercises out of your other plans into a
  plan you already have instead of retyping them.
- **Reorder exercises** — move exercises up and down inside a plan by dragging the handle or with the
  ↑ / ↓ buttons. The order is saved with the plan.
- **Train one side at a time** — an optional per-exercise switch for unilateral work (single-arm,
  single-leg, split squats…), with independent completion and failure tracking for each side.
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
- **Rest timer** — 60 / 90 / 120 second presets plus a custom time (minutes + seconds, up to 60
  minutes), with an optional gentle gong when the countdown reaches zero. The sound is **off by
  default**, has a **Short / Standard / Long** length choice, and is toggled in ⚙️ Settings.
- **Comparison with last time** — every exercise shows whether you went heavier or lighter than your
  previous session **of the same workout plan**.
- **Six languages** — full **Slovak, English, Spanish, Brazilian Portuguese, French and Arabic**
  interfaces, chosen in ⚙️ Settings and switched instantly. Arabic is a complete right-to-left mode.
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
plans. Drag a plan by its ⠿ handle to change the rotation order, or use the ‹ › buttons in the
editor. Editing a plan lets you rename it, delete it with 🗑️, reorder **and** add its exercises, and
change each one — sets, reps, target weight in kilograms, planned failure sets, and whether it is
trained one side at a time.

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
- **Comparison with last time** — the arrow and the "+2 reps" / "−2 reps" line compare an exercise
  only with the **same exercise in the same workout plan**, using the stable plan id and the stable
  exercise id. Renaming a plan never breaks this, because its id does not change. A Bench press in a
  Full Body plan is never compared against a Bench press in Push, and two custom exercises that
  happen to share a name are never compared with each other. If there is no earlier record of that
  exercise in that plan, the app shows *First time* and no comparison at all — never a misleading
  number taken from a different plan.

### Reordering

- **Workout plans** — drag a plan chip by its ⠿ handle to move it before or after another plan. The
  rotation order, the chips and the Today recommendation all follow the new order immediately, and the
  order is saved with your data (it survives a refresh and export/import). The ‹ › buttons in the plan
  editor do the same thing one step at a time, and your currently selected plan stays selected. Plan
  ids, names and every past workout are untouched.
- **Exercises in a plan** — every exercise row has a ⠿ handle and ↑ / ↓ buttons. Drag it, or step it
  up and down, then save the plan as usual. The saved order is what the Workout screen shows and what a
  finished workout records into your history. Reordering never changes sets, reps, weights, planned
  failure sets, completed progress or exercise ids.
- Both kinds of dragging use pointer events, so they work with a mouse **and** with a finger on a
  touch screen; the handle has `touch-action: none`, so dragging never scrolls the page.

---

## Languages

GymQuest ships with six fully supported interface languages, all built in — no translation service,
no network call, nothing to download:

| Code | Language | Locale | Direction |
|---|---|---|---|
| `sk` | Slovenčina | `sk-SK` | left-to-right |
| `en` | English | `en-US` | left-to-right |
| `es` | Español | `es-ES` | left-to-right |
| `pt-BR` | **Português (Brasil)** | `pt-BR` | left-to-right |
| `fr` | Français | `fr-FR` | left-to-right |
| `ar` | العربية | `ar` | **right-to-left** |

Portuguese is deliberately **Brazilian Portuguese** and is labelled *Português (Brasil)* everywhere —
the vocabulary is Brazilian (*treino*, *séries até a falha*, *Duração do treino*).

### Choosing a language

The header no longer carries a `SK | EN` switch — with six languages that would be cluttered on a
phone. Language now lives in **⚙️ Settings**, at the top:

```
Language
English
[ Change language ]
```

**Change language** opens a picker listing every language by its own name, with a ✓ on the current
one:

```
✓ English
  Slovenčina
  Español
  Português (Brasil)
  Français
  العربية
```

Tapping one switches the whole app **immediately** — no reload — and saves the choice, which then
survives refresh, export/import and app updates. Switching language **never touches your training**:
completed sets, failure markers, the rest timer, workout duration, the active session, the selected
plan, the plan order and the calendar month you are looking at all stay exactly as they were.

An old or unknown stored language value safely falls back to English, while existing Slovak and
English users keep the language they already had.

### What is translated

- **Everything in the interface** — navigation, Today, the workout screen, the plan editor, the Full
  Body builder and the "add from existing plans" picker, Progress, history, the Calendar, Motivation,
  achievements, Settings, every dialog and every accessibility label.
- **Built-in plans and exercises** are app content and are translated, so the Slovak plan *Nohy*
  appears as *Legs* in English, *Piernas* in Spanish, *Pernas* in Portuguese, *Jambes* in French and
  *الأرجل* in Arabic.
- **Custom exercises** you create or rename are never translated — they appear exactly as you typed
  them.
- A **renamed plan** becomes a custom name and is never translated. Rename *Nohy* to *Nohy + Core*
  and it stays *Nohy + Core* in every language. Untouched built-in plans keep translating. The app
  recognises a built-in plan's original name in **any** of the six languages, so typing *Legs* or
  *الأرجل* back into the field still counts as "not renamed".
- **Your notes** are never translated. **Workout history is an immutable record**: it keeps the
  exercise and plan names that were in use when the workout was logged, so a later rename or deletion
  never rewrites the past.

### Plurals

Counting text is pluralised with the browser's own `Intl.PluralRules` for the selected locale, so
each language follows its own CLDR rules — nothing is forced through one language's pattern:

| | 0 | 1 | 2 | 3 | 5 | 11 |
|---|---|---|---|---|---|---|
| Slovak | iné | 1 tréning | 2 tréningy | 3 tréningy | 5 tréningov | 11 tréningov |
| English | other | 1 workout | 2 workouts | 3 workouts | 5 workouts | 11 workouts |
| Spanish | otro | 1 entrenamiento | 2 entrenamientos | 3 entrenamientos | 5 entrenamientos | 11 entrenamientos |
| Portuguese (Brasil) | 0 treino | 1 treino | 2 treinos | 3 treinos | 5 treinos | 11 treinos |
| French | 0 entraînement | 1 entraînement | 2 entraînements | 3 entraînements | 5 entraînements | 11 entraînements |
| Arabic | 0 ثانية | 1 ثانية | 2 ثانيتان | 3 ثوانٍ | 5 ثوانٍ | 11 ثانية |

Note the details that a single rule would get wrong: French treats **0 as singular**, Portuguese
treats **0 and 1 as singular**, and Arabic has its own **dual** (2) and **few** (3–10) forms. The
`One / Two / Few / Many / Other` (and `Zero`) forms live in the dictionaries, and every language
always has an `Other` form, so a missing slot can never fall back to another language's text.

### Dates, numbers and the Calendar

Month names, weekday names and weekday abbreviations come from explicit per-language tables (the
app's deliberate choice: identical output in every browser, fully offline, no ICU variation). Each
language has its own date shape — `18. septembra 2026`, `Sep 18, 2026`, `18 sep 2026`,
`18 set 2026`, `18 sept. 2026`, `18 سبتمبر 2026` — and its own full form for the Today row and the
Calendar day detail. **The Monday-first calendar grid, the ISO week logic and the stored
`YYYY-MM-DD` history format are unchanged**, so no date ever shifts.

Weights, reps, sets, XP and durations keep Western digits in every language (`6 kg`, `3 × 10`,
`00:42:13`, `+22 XP`) and are bidi-isolated in Arabic so they always read left-to-right.

### Arabic and right-to-left

Arabic is a full RTL mode, not just a translation:

- `html lang="ar"` and `html dir="rtl"` are set (and reset to `ltr` when you switch away), and the
  layout is driven by CSS **logical properties** (`border-inline-start`, `inset-inline-end`,
  `padding-inline`, `text-align: start`), so it flips by itself.
- **Arrows never lie**: the Calendar's *previous month* control sits on the right and points right,
  *next month* sits on the left and points left, and the plan-editor reorder arrows swap the same way.
- **Fitness meaning is never mirrored**: *left* and *right* keep their real meaning, and the side
  sequence of a unilateral exercise is a training order, not a layout direction.
- Arabic-capable system fonts (`Noto Sans Arabic`, `Geeza Pro`, `Segoe UI`, `Tahoma`) are used from the
  existing stack — nothing is fetched.
- Long translations are handled by the same wrapping rules as before, and the layout is verified for
  overflow at 320 / 375 / 390 / 393 / 414 / 430 px in all six languages.

---

## Rest timer

The rest timer has three quick presets (60 / 90 / 120 seconds) plus a **Custom** option where you
enter minutes and seconds (up to 60 minutes; seconds ≥ 60 roll over into minutes). The last custom
time you started is remembered. Starting a rest timer never touches your workout progress, history,
XP, streaks or goals.

The countdown uses an **absolute end timestamp**, not a ticking counter, so it stays correct when you
switch tabs, open Settings or the Calendar, edit a plan, change language, or come back from the Home
Screen. If the countdown finishes while you are away, the app shows **Rest time is over.**
(*Pauza skončila.*) when you return, without restarting and without a delayed gong. A rest timer
that is still running also survives a page refresh.

Every countdown gets its own **timer session id**, and its completion is recorded once against that
id. That is what makes the completion *idempotent*: the ticking interval, returning from the
background, restoring the page, opening the Workout tab, tapping the timer, starting another timer and
every screen re-render all go through the same guard, so a countdown can never be "completed" twice.
A completion is only treated as a live one — and only then may the gong play — when the app is visible
and the end was detected within about two seconds of the real end. Anything later was a suspended
callback, and it finishes **silently** with the visual *Rest time is over.* state instead.

### Rest timer sound

The rest timer can play a short **gentle gong** when its countdown reaches zero. It is a setting in
⚙️ Settings (*Rest timer sound* / *Zvuk po skončení pauzy*) with a **Test sound** button, a
**Short / Standard / Long** length choice, and it is **off by default** — nothing plays until you
switch it on.

- The gong is generated in the browser with the Web Audio API and is a **simple repeated gong, not a
  melody**: the **same single tone** strikes every time and only gets quieter, so it sounds like an
  ordinary timer notification — *gong … gong … gong*. **Short ≈ 2 s (two gongs), Standard ≈ 4 s
  (three, default), Long ≈ 6 s (three)**. Each gong has a smooth natural decay, and the whole thing is
  moderate in volume — no harsh beep, no alarm. **No audio file is bundled or downloaded**, and
  GymQuest stays offline.
- It plays **once**, only when a countdown reaches zero on its own **while the app is open**. Stopping
  the timer, resetting the workout or picking a different duration stays silent, and it never plays
  for the workout-duration timer or any other event. Rapid taps stop the previous gong before
  starting the next, so sounds never pile up.
- **Test sound** plays exactly the same gong on demand — it is the *same code path*, not a second
  implementation. It is disabled while the sound setting is off (with a short explanation), and it
  never starts a rest timer or touches your workout.
- **One shared audio context.** The app creates exactly one `AudioContext`, only in response to a real
  tap, and never a second one. It is created and resumed inside the user gesture (turning the setting
  on, **Test sound**, starting a rest timer, or the first tap anywhere while sound is on), and after
  each successful resume it also sends one silent sample to the audio destination. That last step
  matters on iOS: WebKit only switches its output route — speaker, headphones, Bluetooth — once the
  audio session has actually been activated by a user gesture, which is the usual reason a Web Audio
  gong is inaudible on headphones. The gong is scheduled only once the context is genuinely running,
  so nothing is queued on a suspended context. If the browser still refuses to play, **Test sound**
  shows a short message (*Sound could not be played. Check your device sound settings.*) and the rest
  timer keeps working normally.
- Going to the background cancels any gong that is still scheduled or playing, so a suspended audio
  context can never flush an old gong after you come back.

### Honest iPhone / Safari limits

GymQuest is a static web app, so its rest-timer sound **cannot** be guaranteed to play while iOS has
the page suspended in the background, after returning to the Home Screen, while Silent Mode is on,
or under Do Not Disturb / Focus. It also **cannot choose your output route**: whether a gong comes out
of the speaker, wired headphones or a Bluetooth device is decided entirely by iOS and the browser, and
GymQuest only asks for the audio session to be active. It does not schedule native notifications and
does not attempt to bypass Silent Mode or misuse Critical Alerts. What it *does* guarantee: the timer
stays correct (from the absolute timestamp), the completion state is shown on return, no old gong is
ever replayed late, and — when the app is open and audio is allowed — the gong plays once at the
natural end of a countdown.

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

### Adding exercises to a plan you already have

The same picker is available while you edit **any** plan, through the **Add exercises from existing
plans** (*Pridať cviky z existujúcich plánov*) button in the editor. It is not tied to any special plan
type and never looks at the plan's name, so it works exactly the same for a Full Body plan you created
earlier, for one you have since renamed, and for an ordinary custom plan.

- Every other **active plan** appears as a section with the name you gave it (Push, Pull, Nohy, a
  renamed plan, or one of your own).
- Exercises that are **already in the plan you are editing** show up ticked, so you can see what is
  already there and untick anything you want to remove.
- Exercises that are only in the plan itself — for example one you typed by hand — get their own
  section at the end, also ticked.
- Tick anything else to add a **copy** of it; **Select all** / **Clear** work per section.
- **Add to plan** applies the selection and returns you to the editor. Nothing is written to your data
  until you press **Save**, exactly like every other editor change, and typing an exercise by hand
  with **+ Add exercise** still works as before.

Copies are independent: the same fields as the builder copies (name, stable id and built-in/custom
status, sets, reps, target weight, planned failure sets, and the one-side-at-a-time setting) are taken
once, and there is no live link in either direction afterwards. Recorded results are never copied —
`actualFailureSets` belongs to finished history and can never leak into a future plan. Built-in
exercises are de-duplicated by their stable id; custom exercises are never merged, even when their
names look the same.

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

## Training one side at a time (optional)

Some exercises are done one side at a time — a single-arm curl or triceps extension, a single-arm row,
a single-leg extension or curl, a Bulgarian split squat, or any custom unilateral exercise.

Every exercise in the plan editor has an optional switch, **Train both sides separately** (*Cvičiť
každú stranu samostatne*). It is **off by default**, so nothing about your existing plans changes until
you switch it on. When it is on you also choose the side you start with — **Start with left** (*Začať
ľavou*) or **Start with right** (*Začať pravou*), defaulting to left. Both the switch and the starting
side are saved with the plan and survive a refresh, export/import, language switching and updates.

During the workout the exercise is listed as *N sets per side* (*N série na každú stranu*) and every
planned set becomes two independent rows, alternating the sides in the order you chose:

```
Single-arm Triceps Extension        3 sets per side
Set 1 — Left    [✓] [🔥]
Set 1 — Right   [✓] [🔥]
Set 2 — Left    [✓] [🔥]
Set 2 — Right   [✓] [🔥]
Set 3 — Left    [✓] [🔥]
Set 3 — Right   [✓] [🔥]
```

- Each side is tracked **separately**: ticking the left never ticks the right, and each side has its
  own 🔥 failure marker. You can finish left-only, right-only, one side at a time, or anything in
  between.
- The rest timer stays completely manual — nothing is ever started for you between sides. Start it
  yourself whenever you want it, exactly as before.
- Your progress through the sides lives in the active session, so it survives changing language,
  switching tabs, opening the Calendar, editing a plan, backgrounding the app and a page refresh, and
  the workout duration keeps running normally.
- History and the Calendar day detail record that the exercise was unilateral, which side you started
  with and which sides you actually completed — for example *3 sets per side · 12 reps · 10 kg*,
  *Completed: Left and Right*, *Failure: Set 3 — Right*.
- **XP rule (documented):** a unilateral set is one working set per side, and GymQuest already awards
  XP per *tracked* set — so each completed side counts once, just like any other completed set. Sets
  that were not completed count for nothing, a side is never counted twice, and personal records are
  unaffected because they are based on the exercise's weight, not on how many sides you logged.
- An exercise without the switch behaves exactly as before, and nothing in your existing plans,
  history, XP or achievements is changed by this feature.

It is tracked information only — not a training recommendation, and never medical advice.

---

## Training to failure, side by side

The optional **failure** tracking works unchanged, and on a unilateral exercise each row has its own
flame: *Séria 3 — Pravá* can be marked as failure while *Séria 3 — Ľavá* is not. The finished workout
stores the planned configuration for the exercise and the actual per-side result separately, and
history only ever shows the recorded result.

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
