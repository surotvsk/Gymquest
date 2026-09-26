/* ===== GymQuest v2 — aplikácia ===== */
'use strict';

/* ---------- Jazyky ----------
   Jediný zdroj pravdy pre jazyky: kód uložený v dátach, endonym (názov v tom
   istom jazyku, ktorý sa nikdy neprekladá), locale pre pluralizáciu a smer. */
const LANGUAGES = [
  { code: 'sk', name: 'Slovenčina', locale: 'sk-SK', rtl: false },
  { code: 'en', name: 'English', locale: 'en-US', rtl: false },
  { code: 'es', name: 'Español', locale: 'es-ES', rtl: false },
  { code: 'pt-BR', name: 'Português (Brasil)', locale: 'pt-BR', rtl: false },
  { code: 'fr', name: 'Français', locale: 'fr-FR', rtl: false },
  { code: 'ar', name: 'العربية', locale: 'ar', rtl: true },
];
const LANG_CODES = LANGUAGES.map(l => l.code);
const DEFAULT_LANG = 'en';

function langMeta(code) {
  for (const l of LANGUAGES) if (l.code === code) return l;
  return LANGUAGES[1];   // neznámy kód sa správa ako angličtina
}

/* Neplatná alebo chýbajúca hodnota jazyka vždy bezpečne spadne na angličtinu.
   Platné hodnoty (vrátane starých 'sk'/'en') sa vracajú presne tak, ako prišli. */
function normalizeLang(value) {
  return LANG_CODES.indexOf(value) >= 0 ? value : DEFAULT_LANG;
}

/* Aktuálny jazyk aplikácie (vždy platný kód). */
function activeLang() {
  return state ? normalizeLang(state.settings.lang) : DEFAULT_LANG;
}

function isRtl() {
  return langMeta(activeLang()).rtl === true;
}

/* Názov jazyka sa nikdy neprekladá – používateľ musí svoj jazyk spoznať
   aj vtedy, keď je rozhranie v jazyku, ktorému nerozumie. */
function langDisplayName(code) {
  return langMeta(code).name;
}

/* ---------- Plány (vzory tréningov) ---------- */

const DEFAULT_PLANS = {
  push: {
    id: 'push',
    builtin: true,
    customName: null,
    exercises: [
      { id: 'bench-press', builtin: true, name: 'Bench press', sets: 4, reps: 8, weight: 40 },
      { id: 'overhead-press', builtin: true, name: 'Tlaky nad hlavou', sets: 3, reps: 10, weight: 25 },
      { id: 'dips', builtin: true, name: 'Dipy', sets: 3, reps: 10, weight: 0 },
      { id: 'lateral-raises', builtin: true, name: 'Upažovanie', sets: 3, reps: 12, weight: 8 },
    ],
  },
  pull: {
    id: 'pull',
    builtin: true,
    customName: null,
    exercises: [
      { id: 'pull-ups', builtin: true, name: 'Zhyby', sets: 4, reps: 8, weight: 0 },
      { id: 'bent-over-rows', builtin: true, name: 'Príťahy v predklone', sets: 3, reps: 10, weight: 40 },
      { id: 'cable-rows', builtin: true, name: 'Veslovanie na kladke', sets: 3, reps: 10, weight: 35 },
      { id: 'bicep-curls', builtin: true, name: 'Bicepsové zdvihy', sets: 3, reps: 12, weight: 12 },
    ],
  },
  legs: {
    id: 'legs',
    builtin: true,
    customName: null,
    exercises: [
      { id: 'squats', builtin: true, name: 'Drepy', sets: 4, reps: 8, weight: 50 },
      { id: 'leg-press', builtin: true, name: 'Leg press', sets: 3, reps: 12, weight: 80 },
      { id: 'lunges', builtin: true, name: 'Výpady', sets: 3, reps: 12, weight: 10 },
      { id: 'leg-curls', builtin: true, name: 'Zakopávanie', sets: 3, reps: 12, weight: 25 },
      { id: 'calf-raises', builtin: true, name: 'Lýtka', sets: 4, reps: 15, weight: 40 },
    ],
  },
};

/* Zabudované plány sú obsahom aplikácie (prekladajú sa), vlastné plány sú používateľské dáta. */
const BUILTIN_PLAN_IDS = ['push', 'pull', 'legs'];
const DEFAULT_PLAN_ORDER = ['push', 'pull', 'legs'];
// kanonické (zdrojové) názvy zabudovaných plánov – ukladajú sa do histórie ako záznam
const BUILTIN_PLAN_NAMES = { push: 'Push', pull: 'Pull', legs: 'Nohy' };
// akékoľvek názvy, ktoré patria zabudovanému plánu (všetky jazyky) –
// rozlíši premenovanie od pôvodného názvu, nech ho používateľ napíše v ktoromkoľvek jazyku
const BUILTIN_PLAN_LABELS = {
  push: ['Push', 'Poussée', 'Empuje', 'Empurrar', 'دفع'],
  pull: ['Pull', 'Tirage', 'Tirón', 'Puxar', 'سحب'],
  legs: ['Nohy', 'Legs', 'Jambes', 'Piernas', 'Pernas', 'الأرجل'],
};

function isBuiltinPlanLabel(id, value) {
  return value === id || (BUILTIN_PLAN_LABELS[id] || []).includes(value);
}

const BUILTIN_EXERCISE_IDS = new Set([
  'bench-press', 'overhead-press', 'dips', 'lateral-raises',
  'pull-ups', 'bent-over-rows', 'cable-rows', 'bicep-curls',
  'squats', 'leg-press', 'lunges', 'leg-curls', 'calf-raises',
]);

// maps both SK and EN built-in names -> stable id (for migration + milestone display)
const BUILTIN_NAME_TO_ID = {
  'Bench press': 'bench-press', 'Tlaky nad hlavou': 'overhead-press', 'Dipy': 'dips', 'Upažovanie': 'lateral-raises',
  'Zhyby': 'pull-ups', 'Pull-ups': 'pull-ups', 'Príťahy v predklone': 'bent-over-rows', 'Bent-over rows': 'bent-over-rows',
  'Veslovanie na kladke': 'cable-rows', 'Cable rows': 'cable-rows', 'Bicepsové zdvihy': 'bicep-curls', 'Bicep curls': 'bicep-curls',
  'Drepy': 'squats', 'Squats': 'squats', 'Leg press': 'leg-press', 'Výpady': 'lunges', 'Lunges': 'lunges',
  'Zakopávanie': 'leg-curls', 'Leg curls': 'leg-curls', 'Lýtka': 'calf-raises', 'Calf raises': 'calf-raises',
  'Overhead press': 'overhead-press', 'Lateral raises': 'lateral-raises', 'Dips': 'dips',
};

/* ---------- Plány: prístup, poradie a zobrazované názvy ---------- */

function getPlan(id) {
  return (id && state && state.plans && state.plans[id]) || null;
}

/* Aktívne plány v poradí, ktoré si nastavil používateľ (jediný zdroj pre chipy aj rotáciu). */
function activePlanIds() {
  if (!state || !Array.isArray(state.planOrder)) return [];
  return state.planOrder.filter(id => !!getPlan(id));
}

/* Názov plánu: ručne zmenený názov sa nikdy neprekladá, nedotknutý zabudovaný plán áno. */
function planDisplayName(plan) {
  if (!plan) return t('pokrok.workoutFallback');
  return plan.customName ? plan.customName : t('plan.' + plan.id);
}

function planNameOf(id) {
  return planDisplayName(getPlan(id));
}

/* Názov zapísaný do histórie v čase tréningu – nemenný záznam pre prípad zmazania plánu. */
function recordedPlanName(plan) {
  if (!plan) return '';
  if (plan.customName) return plan.customName;
  return BUILTIN_PLAN_NAMES[plan.id] || t('plan.' + plan.id);
}

/* Názov plánu v histórii: existujúci plán sa prekladá, zmazaný sa berie zo záznamu. */
function historyPlanName(w) {
  const plan = getPlan(w.planId);
  if (plan) return planDisplayName(plan);
  if (w.planName) return w.planName;
  return t('pokrok.workoutFallback');
}

function exerciseDisplayName(ex) {
  return (ex && ex.id && BUILTIN_EXERCISE_IDS.has(ex.id)) ? t('exercise.' + ex.id) : ex.name;
}

function recordedNameToDisplay(name) {
  const id = BUILTIN_NAME_TO_ID[name];
  return id ? t('exercise.' + id) : name;
}

/* ---------- Preklady (sk / en) ---------- */

const I18N = {
  sk: {
    'tab.dnes': 'Dnes', 'tab.trening': 'Tréning', 'tab.pokrok': 'Pokrok', 'tab.motivacia': 'Motivácia', 'tab.kalendar': 'Kalendár',
    'kalendar.prevMonth': 'Predchádzajúci mesiac',
    'kalendar.nextMonth': 'Nasledujúci mesiac',
    'kalendar.goToday': 'Dnes',
    'kalendar.legendTitle': 'Legenda',
    'kalendar.legendWorkout': 'Zelená — Dokončený tréning',
    'kalendar.legendMissed': 'Červená — Žiadny zaznamenaný tréning',
    'kalendar.legendToday': 'Oranžový okraj — Dnes',
    'kalendar.statusWorkout': 'Dokončený tréning',
    'kalendar.statusNone': 'Žiadny zaznamenaný tréning',
    'kalendar.statusTodayNone': 'Dnes — zatiaľ bez zaznamenaného tréningu',
    'kalendar.statusFuture': 'Tento dátum je v budúcnosti.',
    'kalendar.emptyPast': 'V tento deň nebol zaznamenaný žiadny tréning.',
    'kalendar.achievements': 'Odomknuté úspechy',
    'kalendar.ariaDay': '{date} — {status}',
    'kalendar.ariaWorkoutCountOne': '{n} tréning v tento deň',
    'kalendar.ariaWorkoutCountFew': '{n} tréningy v tento deň',
    'kalendar.ariaWorkoutCountOther': '{n} tréningov v tento deň',
    'plan.push': 'Push', 'plan.pull': 'Pull', 'plan.legs': 'Nohy',
    'plan.newName': 'Nový plán',
    'planChoice.title': 'Vytvoriť tréningový plán',
    'planChoice.blank': 'Prázdny tréningový plán',
    'planChoice.blankDesc': 'Vytvor prázdny vlastný tréning a pridaj cviky ručne.',
    'planChoice.fullBody': 'Full Body builder',
    'planChoice.fullBodyDesc': 'Vytvor celotelový tréning výberom cvikov z existujúcich tréningových plánov.',
    'fb.title': 'Full Body builder',
    'fb.subtitle': 'Vyber cviky z existujúcich tréningových plánov.',
    'fb.nameLabel': 'Názov tréningu',
    'fb.defaultName': 'Celé telo',
    'fb.selected': 'Vybrané cviky: {n}',
    'fb.selectedOne': 'Vybraný cvik: {n}',
    'fb.selectedFew': 'Vybrané cviky: {n}',
    'fb.selectedOther': 'Vybraných cvikov: {n}',
    'fb.selectAll': 'Vybrať všetko',
    'fb.clear': 'Vymazať výber',
    'fb.create': 'Vytvoriť Full Body tréning',
    'fb.needOne': 'Vyber aspoň jeden cvik.',
    'fb.noExercises': 'V tomto tréningovom pláne nie sú dostupné žiadne cviky.',
    'fb.duplicates': 'Duplicitné cviky sa pridajú iba raz.',
    'fb.bodyweight': 'Vlastná váha',
    'picker.title': 'Pridať cviky z existujúcich plánov',
    'picker.subtitle': 'Zaškrtni cviky, ktoré chceš pridať do tohto plánu.',
    'picker.apply': 'Pridať do plánu',
    'unilateral.trainBoth': 'Cvičiť každú stranu samostatne',
    'unilateral.startLeft': 'Začať ľavou',
    'unilateral.startRight': 'Začať pravou',
    'unilateral.left': 'Ľavá',
    'unilateral.right': 'Pravá',
    'unilateral.setsPerSideOne': '{n} séria na každú stranu',
    'unilateral.setsPerSideFew': '{n} série na každú stranu',
    'unilateral.setsPerSideOther': '{n} sérií na každú stranu',
    'unilateral.setSide': 'Séria {n} — {side}',
    'unilateral.completed': 'Dokončené: {sides}',
    'unilateral.bothSides': 'Ľavá a pravá',
    'unilateral.leftOnly': 'Iba ľavá',
    'unilateral.rightOnly': 'Iba pravá',
    'unilateral.noneSides': 'Žiadna',
    'unilateral.failureList': 'Zlyhanie: {list}',
    'exercise.bench-press': 'Bench press', 'exercise.overhead-press': 'Tlaky nad hlavou', 'exercise.dips': 'Dipy', 'exercise.lateral-raises': 'Upažovanie',
    'exercise.pull-ups': 'Zhyby', 'exercise.bent-over-rows': 'Príťahy v predklone', 'exercise.cable-rows': 'Veslovanie na kladke', 'exercise.bicep-curls': 'Bicepsové zdvihy',
    'exercise.squats': 'Drepy', 'exercise.leg-press': 'Leg press', 'exercise.lunges': 'Výpady', 'exercise.leg-curls': 'Zakopávanie', 'exercise.calf-raises': 'Lýtka',
    'header.level': 'Úr.',
    'header.settingsTitle': 'Nastavenia',
    'header.levelTitle': 'Úroveň',
    'settings.language': 'Jazyk',
    'settings.changeLanguage': 'Zmeniť jazyk',
    'settings.languageCurrent': 'Aktuálny jazyk: {name}',
    'langPicker.title': 'Jazyk',
    'langPicker.select': '{name} — vybrať jazyk',
    'langPicker.selected': '{name} — aktuálne vybraný',
    'settings.autoBackup': 'Automatické zálohovanie',
    'settings.autoBackupHint': 'Ak to zariadenie podporuje, GymQuest sa pokúsi vytvoriť JSON zálohu počas používania aplikácie. iPhone môže vyžadovať potvrdenie alebo uloženie súboru.',
    'settings.autoBackupLast': 'Naposledy ponúknutá externá záloha: {when}',
    'settings.importOlder': 'Táto záloha má menej tréningov než tvoje aktuálne dáta ({old} → {new}).',
    'backup.never': 'nikdy',
    'backup.dueTitle': 'Záloha je potrebná',
    'backup.dueBody': 'Ulož si kópiu JSON mimo GymQuestu, aby si mohol obnoviť tréningy a históriu.',
    'backup.sentTitle': 'Súbor zálohy bol vytvorený',
    'backup.sentBody': 'Súbor zálohy bol odovzdaný prehliadaču.',
    'backup.saveNow': 'Uložiť zálohu teraz',
    'backup.saveAgain': 'Uložiť znova',
    'backup.dismiss': 'Skryť pripomienku zálohy',
    'backup.noConfirm': 'GymQuest nemôže potvrdiť, že súbor bol naozaj uložený — skontroluj aplikáciu Súbory alebo priečinok Stiahnuté.',
    'backup.shareHint': 'Ak sa otvorila ponuka zdieľania, zvoľ „Uložiť do Súborov“ (iCloud Drive alebo V iPhone). GymQuest nedokáže potvrdiť, že sa uložil.',
    'backup.fileName': 'Súbor: {name}',
    'dnes.weekTitle': 'Tréningy tento týždeň',
    'dnes.weekDone': '{n} z {g}',
    'dnes.weekDoneShort': '{n} z {g}',
    'dnes.weekGoalMet': 'Cieľ na tento týždeň splnený!',
    'dnes.weekRemaining': 'Ešte {n} do splnenia cieľa.',
    'dnes.weekRemainingOne': 'Ešte {n} tréning do splnenia cieľa.',
    'dnes.weekRemainingFew': 'Ešte {n} tréningy do splnenia cieľa.',
    'dnes.weekRemainingOther': 'Ešte {n} tréningov do splnenia cieľa.',
    'dnes.streakTitle': '🔥 Súdržnosť',
    'dnes.streakNone': 'Žiadna séria',
    'dnes.streakWeek': '🔥 {n} týždňov v rade',
    'dnes.streakWeekOne': '🔥 {n} týždeň v rade',
    'dnes.streakWeekFew': '🔥 {n} týždne v rade',
    'dnes.streakWeekOther': '🔥 {n} týždňov v rade',
    'dnes.streakStart': 'Absolvuj aspoň {g} tréningy tento týždeň a začni sériu.',
    'dnes.streakStartOne': 'Absolvuj aspoň {g} tréning tento týždeň a začni sériu.',
    'dnes.streakStartFew': 'Absolvuj aspoň {g} tréningy tento týždeň a začni sériu.',
    'dnes.streakStartOther': 'Absolvuj aspoň {g} tréningov tento týždeň a začni sériu.',
    'dnes.streakContinue': 'Dokonči tento týždeň {g} tréningy, aby si pokračoval v sérii.',
    'dnes.streakContinueOne': 'Dokonči tento týždeň {g} tréning, aby si pokračoval v sérii.',
    'dnes.streakContinueFew': 'Dokonči tento týždeň {g} tréningy, aby si pokračoval v sérii.',
    'dnes.streakContinueOther': 'Dokonči tento týždeň {g} tréningov, aby si pokračoval v sérii.',
    'dnes.streakGoing': 'Týždenný cieľ je splnený. Tvoja séria pokračuje!',
    'dnes.streakEnded': 'Tvoja séria sa skončila. Začni novú sériu splnením týždenného cieľa.',
    'dnes.excuse': 'Škola / choroba',
    'dnes.excuseActive': 'Škola / choroba ✓ (aktívne)',
    'dnes.excuseNote': 'Tento týždeň je ospravedlnený – séria sa nepreruší.',
    'dnes.start': 'Začať tréning',
    'dnes.nextPlan': 'Odporúčaný: {plan}',
    'dnes.weekOf': 'Týždeň {n}',
    'trening.finish': 'Dokončiť tréning',
    'trening.finishTitle': 'Dokončiť tréning?',
    'trening.doneTitle': '🏆 Tréning dokončený!',
    'trening.confirmText': '{plan} · {done} z {total} sérií<br>Získaš <b style="color:#a3e635">+{xp} XP</b>',
    'trening.noteLabel': 'Poznámka (voliteľná)',
    'trening.super': 'Super!',
    'trening.undo': 'Vrátiť tento tréning späť',
    'trening.undoConfirmTitle': 'Vrátiť tréning späť?',
    'trening.undoConfirm': 'Vráti sa tento tréning a odoberie sa {xp} XP.',
    'trening.setsDone': 'Dokončené série: <b>{done} z {total}</b> · {msg}',
    'trening.setsHint': 'Označ série ako hotové.',
    'trening.firstTime': 'Prvýkrát',
    'trening.compareUp': '▲ {w} kg · +{r} op oproti minulému',
    'trening.compareDown': '▼ {w} kg · {r} op oproti minulému',
    'trening.compareSame': 'Rovnako ako minule ({w} kg)',
    'trening.compareWeightUp': '▲ {w} kg oproti minulému',
    'trening.compareWeightDown': '▼ {w} kg oproti minulému',
    'trening.compareRepsUp': '+{r} op oproti minulému',
    'trening.compareRepsDown': '{r} op oproti minulému',
    'trening.edit': 'Upraviť plán',
    'trening.editTitle': 'Upraviť plán',
    'trening.planLabel': 'Tréningový plán',
    'trening.editPlanButton': '✏️ Upraviť plán',
    'trening.planNameLabel': 'Názov plánu',
    'trening.planNamePlaceholder': 'Napr. Horná časť tela',
    'trening.planNameInvalid': 'Zadaj názov plánu (max. 40 znakov).',
    'trening.addPlan': '+ Pridať tréning',
    'trening.managePlans': 'Upraviť plány',
    'trening.managePlansDone': 'Hotovo',
    'trening.manageHint': 'Potiahni plán a zmeň jeho poradie, alebo ťukni na ✏️ a uprav ho.',
    'trening.movePlanLeft': 'Posunúť doľava',
    'trening.movePlanRight': 'Posunúť doprava',
    'trening.dragPlan': 'Presunúť plán',
    'trening.dragExercise': 'Presunúť cvik',
    'trening.moveUp': 'Posunúť vyššie',
    'trening.moveDown': 'Posunúť nižšie',
    'trening.addFromPlans': 'Pridať cviky z existujúcich plánov',
    'trening.setDoneAria': 'Označiť sériu {n} ako hotovú',
    'trening.deletePlan': 'Vymazať plán',
    'trening.deletePlanTitle': 'Vymazať plán?',
    'trening.deletePlanConfirm': 'Plán „{name}“ sa odstráni a už sa nebude zobrazovať v rotácii. História tréningov zostane zachovaná.',
    'trening.deletePlanLast': 'Musí zostať aspoň jeden plán.',
    'trening.addExercise': '+ Pridať cvik',
    'trening.exercisePlaceholder': 'Cvik',
    'trening.editSave': 'Uložiť',
    'trening.editCancel': 'Zrušiť',
    'trening.lastExerciseBlock': 'Plán musí mať aspoň jeden cvik. Pridaj si nový cvik.',
    'trening.deleteExerciseTitle': 'Vymazať cvik?',
    'trening.deleteExercise': 'Vymaže sa cvik „{name}“ z plánu.',
    'trening.editInvalid': 'Vyplň názov cviku a čísla (série 1–99, opakovania 1–99, váha 0–999).',
    'trening.resetSession': 'Resetovať tréning',
    'trening.resetSessionTitle': 'Resetovať tréning?',
    'trening.resetSessionConfirm': 'Vymažú sa označené série tohto tréningu. História zostane zachovaná.',
    'trening.timerLabel': 'Oddych',
    'trening.timerDone': 'Pauza skončila.',
    'trening.timerComplete': 'Pauza skončila',
    'trening.timerStop': 'Zastaviť časovač',
    'trening.timerStart': 'Začať oddych',
    'trening.timerSection': 'Časovač oddychu',
    'trening.timerCustom': 'Vlastný',
    'trening.customTitle': 'Vlastný čas pauzy',
    'trening.customMinutes': 'Minúty',
    'trening.customSeconds': 'Sekundy',
    'trening.customStart': 'Spustiť časovač pauzy',
    'trening.customStartAlt': 'Spustiť vlastný časovač',
    'trening.customInvalid': 'Zadaj platný čas pauzy.',
    'trening.customZero': 'Čas pauzy musí byť väčší ako nula.',
    'failure.plannedLabel': 'Série do zlyhania',
    'failure.none': 'Žiadna',
    'failure.failure': 'Zlyhanie',
    'failure.planned': 'Plánované zlyhanie',
    'failure.noSets': 'Žiadne série do zlyhania',
    'failure.sets': 'Série do zlyhania: {sets}',
    'failure.markSet': 'Označiť sériu ako zlyhanie',
    'failure.removeMarker': 'Odstrániť označenie zlyhania',
    'trening.failureHint': '🔥 Zlyhanie — označ iba sériu, ktorú si reálne odcvičil do zlyhania.',
    'trening.failureHintEdit': 'Voliteľné: vyber série, ktoré plánuješ ísť do zlyhania. Skutočný výsledok môžeš zmeniť počas tréningu.',
    'trening.durationLabel': 'Trvanie tréningu',
    'trening.sessionRestored': 'Aktuálny tréning bol obnovený',
    'trening.planSaved': 'Zmeny plánu boli uložené. Priebeh aktuálneho tréningu zostal zachovaný.',
    'trening.durationResult': 'Trvanie tréningu: {duration}',
    'history.duration': 'Trvanie: {duration}',
    'duration.secOne': '{n} sekunda', 'duration.secFew': '{n} sekundy', 'duration.secOther': '{n} sekúnd',
    'duration.minOne': '{n} minúta', 'duration.minFew': '{n} minúty', 'duration.minOther': '{n} minút',
    'duration.hourUnitOne': '{n} hodina', 'duration.hourUnitFew': '{n} hodiny', 'duration.hourUnitOther': '{n} hodín',
    'duration.minUnitOne': '{n} minúta', 'duration.minUnitFew': '{n} minúty', 'duration.minUnitOther': '{n} minút',
    'duration.hourMin': '{h} {m}',
    'pokrok.thisWeek': 'Tento týždeň', 'pokrok.thisMonth': 'Tento mesiac', 'pokrok.total': 'Celkom',
    'pokrok.recordsTitle': '🏆 Osobné rekordy',
    'pokrok.recordsEmpty': 'Zatiaľ žiadne rekordy.',
    'pokrok.nextMilestone': 'Ďalší míľnik: {kg} kg',
    'pokrok.historyTitle': '📋 História tréningov',
    'pokrok.historyEmpty': 'Zatiaľ žiadne tréningy.',
    'pokrok.workoutName': '{plan}',
    'pokrok.workoutFallback': 'Tréning',
    'pokrok.setsCountOne': '{n} séria', 'pokrok.setsCountFew': '{n} série', 'pokrok.setsCountOther': '{n} sérií',
    'history.editTitle': 'Upraviť tréning',
    'history.deleteTitle': 'Vymazať tréning?',
    'history.deleteConfirm': 'Vymaže sa tento tréning a jeho {xp} XP.',
    'history.workoutSummary': '{name} {sets}×{reps} · {w} kg',
    'history.date': 'Dátum',
    'history.setsLabel': 'Série', 'history.repsLabel': 'Op.', 'history.setsDoneLabel': 'Hotové',
    'motivacia.levelTitle': 'Úroveň',
    'motivacia.levelSub': 'Získal si {xp} XP celkom. Na ďalšiu úroveň potrebuješ ešte {left} XP.',
    'motivacia.achTitle': '🎖️ Úspechy',
    'motivacia.unlocked': 'Odomknuté {date}',
    'motivacia.ach.5kg': '{name} · {kg} kg',
    'setup.title': 'Nastavenie tréningu',
    'setup.question': 'Koľko tréningov týždenne chceš stihnúť?',
    'setup.explain': 'Tvoj týždenný cieľ určuje progres, streak a týždenné odmeny.',
    'setup.continue': 'Pokračovať',
    'settings.title': 'Nastavenia',
    'settings.goalLabel': 'Týždenný cieľ tréningov',
    'settings.goalHint': 'Vyber si 1 až 7 tréningov týždenne.',
    'settings.goalInvalid': 'Zadaj celé číslo od {min} do {max}.',
    'settings.save': 'Uložiť cieľ',
    'settings.restSound': 'Zvuk po skončení pauzy',
    'settings.restSoundHint': 'Prehrať krátky gong, keď časovač oddychu dosiahne nulu.',
    'settings.testSound': 'Otestovať zvuk',
    'settings.testSoundDisabledHint': 'Ak chceš zvuk otestovať, zapni zvuk po skončení pauzy.',
    'settings.testSoundFailed': 'Zvuk sa nepodarilo prehrať. Skontroluj nastavenia zvuku zariadenia.',
    'settings.on': 'Zapnuté',
    'settings.off': 'Vypnuté',
    'settings.restSoundLength': 'Dĺžka zvuku po skončení pauzy',
    'settings.lenShort': 'Krátky',
    'settings.lenStandard': 'Štandardný',
    'settings.lenLong': 'Dlhý',
    'settings.export': 'Exportovať dáta',
    'settings.import': 'Importovať dáta',
    'settings.reset': 'Resetovať dáta',
    'settings.loadDemo': 'Načítať ukážkové dáta',
    'settings.removeDemo': 'Odstrániť ukážkové dáta',
    'settings.demoConfirm': 'Nahradí aktuálnu históriu ukážkovými dátami.',
    'settings.demoRemoveConfirm': 'Odstráni ukážkové dáta a začneš od nuly.',
    'settings.demoNone': 'Žiadne ukážkové dáta.',
    'units.kg': 'kg', 'units.xp': 'XP', 'units.sets': 'série', 'units.reps': 'op',
    'settings.importTitle': 'Importovať dáta?',
    'settings.importConfirm': 'Týmto sa nahradia všetky aktuálne dáta ({n} tréningov).',
    'settings.importError': 'Neplatný súbor zálohy.',
    'settings.resetTitle': 'Resetovať všetky dáta?',
    'settings.resetConfirm': 'Vymažú sa všetky tréningy, rekordy a nastavenia. Túto akciu nemožno vrátiť.',
    'settings.resetFinal': 'Naozaj vymazať všetko?',
    'settings.resetFinalConfirm': 'Toto vymaže všetky dáta natrvalo.',
    'settings.resetConfirmAction': 'Resetovať všetky údaje',
    'settings.resetFinalAction': 'Naozaj vymazať',
    'common.cancel': 'Zrušiť', 'common.close': 'Zavrieť', 'common.save': 'Uložiť', 'common.ok': 'OK', 'common.delete': 'Vymazať',
    'update.available': 'Je dostupná nová verzia GymQuestu.',
    'update.now': 'Aktualizovať',
    'app.storageError': 'Tento prehliadač odmietol uložiť dáta – zmeny sa po obnovení stránky stratia. Povol v prehliadači ukladanie dát (localStorage) a skús to znova. Ak sa uloženie stále nedarí, vyexportuj si zálohu, kým sú dáta ešte v pamäti.',
    'common.confirm': 'Potvrdenie',
    'common.confirmTitle': 'Potvrdenie',
    'achievements.first': 'Prvý tréning', 'achievements.firstDesc': 'Dokonči svoj prvý tréning',
    'achievements.five': '5 tréningov', 'achievements.fiveDesc': 'Dokonči 5 tréningov',
    'achievements.ten': '10 tréningov', 'achievements.tenDesc': 'Dokonči 10 tréningov',
    'achievements.twentyfive': '25 tréningov', 'achievements.twentyfiveDesc': 'Dokonči 25 tréningov',
    'achievements.fifty': '50 tréningov', 'achievements.fiftyDesc': 'Dokonči 50 tréningov',
    'achievements.hundred': '100 tréningov', 'achievements.hundredDesc': 'Dokonči 100 tréningov',
    'achievements.weeklygoal1': 'Prvý splnený týždenný cieľ', 'achievements.weeklygoal1Desc': 'Splň svoj týždenný cieľ',
    'achievements.consistent2': 'Pravidelnosť 2 týždne', 'achievements.consistent2Desc': 'Trénuj aspoň {g}× týždenne 2 týždne po sebe',
    'achievements.consistent4': 'Pravidelnosť 4 týždne', 'achievements.consistent4Desc': 'Trénuj aspoň {g}× týždenne 4 týždne po sebe',
    'achievements.consistent8': 'Pravidelnosť 8 týždňov', 'achievements.consistent8Desc': 'Trénuj aspoň {g}× týždenne 8 týždňov po sebe',
    'achievements.consistent12': 'Pravidelnosť 12 týždňov', 'achievements.consistent12Desc': 'Trénuj aspoň {g}× týždenne 12 týždňov po sebe',
    'achievements.xp200': '200 XP', 'achievements.xp200Desc': 'Získaj 200 XP',
    'achievements.newpr': 'Nový osobný rekord', 'achievements.newprDesc': 'Stanov nový osobný rekord vo váhe',
    'achievements.solid2': 'Konzistentný týždeň', 'achievements.solid2Desc': 'Dokonči aspoň 3 tréningy v 2 rôznych kalendárnych týždňoch',
    'achievements.solid4': 'Mesačná pravidelnosť', 'achievements.solid4Desc': 'Dokonči aspoň 3 tréningy v 4 rôznych kalendárnych týždňoch',
    'achievements.fullweek': 'Plný týždeň', 'achievements.fullweekDesc': 'Dokonči 5 tréningov počas jedného kalendárneho týždňa',
    'achievements.pr5': 'Prekonávač rekordov', 'achievements.pr5Desc': 'Dosiahni 5 osobných rekordov',
    'achievements.pr10': 'Lovec rekordov', 'achievements.pr10Desc': 'Dosiahni 10 osobných rekordov',
    'achievements.improve': 'Každý deň silnejší', 'achievements.improveDesc': 'Zlepši váhu rovnakého cviku oproti svojmu predchádzajúcemu zápisu',
    'achievements.customplan': 'Tvorca plánov', 'achievements.customplanDesc': 'Vytvor si prvý vlastný tréningový plán',
    'achievements.fourplans': 'Architekt tréningu', 'achievements.fourplansDesc': 'Vytvor 4 aktívne tréningové plány',
    'achievements.customex5': 'Zberateľ cvikov', 'achievements.customex5Desc': 'Pridaj 5 vlastných cvikov do tréningových plánov',
    'achievements.variety4': 'Všestranný športovec', 'achievements.variety4Desc': 'Dokonči tréningy zo 4 rôznych tréningových plánov',
    'achievements.comeback': 'Návrat silnejší', 'achievements.comebackDesc': 'Dokonči tréning po aspoň 14 dňoch bez tréningu',
    'achievements.missedweek': 'Nevzdávam sa', 'achievements.missedweekDesc': 'Dokonči tréning po vynechaní celého kalendárneho týždňa',
    'motivacia.xpReward': '+{xp} XP',
    'motivacia.newAchXp': '+{xp} XP za úspechy',
    'motivacia.newAchievement': 'Nový úspech: {names}',

    /* --- Telo, kalórie, jedlo a tipy --- */
    'units.kg': 'kg', 'units.lb': 'lb', 'units.cm': 'cm', 'units.in': 'in', 'units.g': 'g', 'units.kcal': 'kcal',

    'pokrok.subProgress': 'Pokrok', 'pokrok.subBody': 'Telo', 'pokrok.subFood': 'Jedlo',

    'body.summaryTitle': 'Najnovšie miery',
    'body.unitsAria': 'Jednotky merania',
    'body.unitsNote': 'Jednotky menia len zobrazenie. Uložené hodnoty sa nikdy neprepisujú.',
    'body.add': '+ Pridať meranie',
    'body.addTitle': 'Pridať meranie',
    'body.editTitle': 'Upraviť meranie',
    'body.deleteTitle': 'Vymazať meranie',
    'body.deleteConfirm': 'Vymazať meranie z {date}? Toto sa nedá vrátiť.',
    'body.dateLabel': 'Dátum',
    'body.noteLabel': 'Poznámka (voliteľná)',
    'body.fieldsHint': 'Ak si niečo nemeral, nechaj pole prázdne.',
    'body.empty': 'Zatiaľ žiadne merania.',
    'body.noValues': 'Žiadne zapísané hodnoty',
    'body.errDate': 'Vyber platný dátum.',
    'body.errRange': 'Skontroluj tieto hodnoty: {fields}.',
    'body.errEmpty': 'Vyplň aspoň jednu hodnotu alebo napíš poznámku.',
    'body.chartTitle': 'Vývoj',
    'body.metricAria': 'Ktorá miera sa zobrazí',
    'body.chartRange': 'Najnižšie {min} · najvyššie {max} {unit}',
    'body.chartNeedTwo': 'Pre graf pridaj ešte jeden zápis.',
    'body.chartAria': 'Graf vývoja, najnižšie {min}, najvyššie {max}',
    'body.historyTitle': 'História meraní',
    'body.storageNotice': 'Uložené dáta začínajú byť veľké a čoskoro môžu prekročiť to, čo tento prehliadač udrží. Vyexportuj si zálohu a zváž, či nepotrebuješ vymazať staré záznamy. GymQuest sám nikdy nič nemaže.',
    'body.f.weight': 'Telesná hmotnosť',
    'body.f.waist': 'Pás',
    'body.f.chest': 'Hrudník',
    'body.f.armLeft': 'Ľavé nadlaktie',
    'body.f.armRight': 'Pravé nadlaktie',
    'body.f.thighLeft': 'Ľavé stehno',
    'body.f.thighRight': 'Pravé stehno',
    'body.f.hip': 'Boky',

    'calorie.title': 'Odhad dennej energie',
    'calorie.offHint': 'Voliteľné a predvolene skryté. GymQuest nič neodhaduje, kým to sám nezapneš.',
    'calorie.enable': 'Zobraziť odhad',
    'calorie.disable': 'Skryť odhad',
    'calorie.intro': 'Odhad, nie predpis. Toto nie je lekárska rada.',
    'calorie.adultQuestion': 'Máš 18 rokov alebo viac?',
    'calorie.adultYes': 'Mám 18 a viac',
    'calorie.adultNo': 'Mám menej ako 18',
    'calorie.underage': 'GymQuest nezobrazuje dospelé kalorické ciele ľuďom mladším ako 18 rokov. Telo, ktoré ešte rastie, má iné potreby a odhad stavaný pre dospelých by tu zavádzal. Ak chceš o jedle a energii vo svojom veku vedieť viac, porozprávaj sa s lekárom, výživovým poradcom alebo s rodičom.',
    'calorie.inHeight': 'Výška',
    'calorie.inAge': 'Vek',
    'calorie.years': 'rokov',
    'calorie.inSex': 'Pohlavie použité vo vzorci',
    'calorie.sexPick': 'Neuvedené',
    'calorie.sexMale': 'Muž',
    'calorie.sexFemale': 'Žena',
    'calorie.inActivity': 'Úroveň aktivity',
    'calorie.activityPick': 'Neuvedené',
    'calorie.actSedentary': 'Prevažne sedenie',
    'calorie.actLight': 'Ľahká aktivita 1–3 dni v týždni',
    'calorie.actModerate': 'Stredná aktivita 3–5 dní v týždni',
    'calorie.actActive': 'Náročná aktivita 6–7 dní v týždni',
    'calorie.actVery': 'Veľmi náročná aktivita alebo fyzická práca',
    'calorie.inWeight': 'Telesná hmotnosť (z tvojich meraní)',
    'calorie.weightFromLog': 'Použitá je tvoja najnovšia zapísaná hmotnosť z {date}.',
    'calorie.weightMissing': 'Najprv si zapíš telesnú hmotnosť. GymQuest ju nebude hádať.',
    'calorie.saveInputs': 'Uložiť vstupy',
    'calorie.errAge': 'Vek musí byť medzi 1 a 120.',
    'calorie.errHeight': 'Výška je mimo rozsahu. Skontroluj hodnotu aj jednotku.',
    'calorie.needInputs': 'Zatiaľ chýbajú vstupy',
    'calorie.missing': 'Ešte chýba: {list}',
    'calorie.range': '{low}–{high} {unit} denne',
    'calorie.bmrLine': 'Vychádza to z odhadu pokojovej spotreby približne {bmr} {unit} denne.',
    'calorie.limit1': 'Je to priemer populácie. Tvoje skutočné potreby sa môžu výrazne líšiť.',
    'calorie.limit2': 'Nevidí zloženie tela, zdravotné ťažkosti, lieky, tehotenstvo ani to, ako naozaj trénuješ.',
    'calorie.limit3': 'Nie je to cieľ, ktorý treba presne trafiť, ani jedálny plán.',
    'calorie.limit4': 'GymQuest zámerne neponúka kalorické ciele na chudnutie ani na priberanie.',
    'calorie.limit5': 'V čomkoľvek zdravotnom alebo pri pláne na mieru sa obráť na kvalifikovaného odborníka.',
    'calorie.formula': 'Vzorec: Mifflin-St Jeor (Mifflin MD et al., Am J Clin Nutr, 1990) pre pokojovú spotrebu, vynásobený faktorom aktivity. Výsledok je zobrazený ako rozsah ±10 %.',
    'calorie.updated': 'Naposledy vypočítané: {when}',

    'food.offHint': 'Denník jedla je voliteľný a predvolene vypnutý. GymQuest nemá žiadnu databázu potravín – všetko si zapisuješ sám.',
    'food.enable': 'Zapnúť denník jedla',
    'food.disable': 'Vypnúť denník jedla',
    'food.addEntry': '+ Pridať jedlo',
    'food.addTitle': 'Pridať jedlo',
    'food.editEntryTitle': 'Upraviť záznam',
    'food.newTemplateTitle': 'Nová uložená potravina',
    'food.editTemplateTitle': 'Upraviť uloženú potravinu',
    'food.pickSaved': 'Uložená potravina',
    'food.pickNone': 'Žiadna – zadám hodnoty ručne',
    'food.qtyLabel': 'Množstvo (násobok)',
    'food.saveAsTemplate': 'Uložiť aj ako potravinu',
    'food.nameLabel': 'Názov',
    'food.kcalLabel': 'Energia',
    'food.protein': 'Bielkoviny',
    'food.carbs': 'Sacharidy',
    'food.fat': 'Tuky',
    'food.macroLine': 'B {p} g · S {c} g · T {f} g',
    'food.totalsLine': '{total} · {entries}',
    'food.entries': '{n} záznamov',
    'food.entriesOne': '{n} záznam',
    'food.entriesFew': '{n} záznamy',
    'food.entriesMany': '{n} záznamu',
    'food.entriesOther': '{n} záznamov',
    'food.emptyDay': 'V tento deň zatiaľ nič nie je.',
    'food.noSaved': 'Zatiaľ žiadne uložené potraviny.',
    'food.savedTitle': 'Uložené potraviny',
    'food.newTemplate': '+ Nová potravina',
    'food.editTemplate': 'Upraviť uloženú potravinu',
    'food.deleteTemplate': 'Vymazať uloženú potravinu',
    'food.deleteTemplateConfirm': 'Vymazať „{name}“ z uložených potravín? Už zapísané záznamy si držia vlastné hodnoty.',
    'food.editEntry': 'Upraviť záznam',
    'food.deleteEntry': 'Vymazať záznam',
    'food.deleteEntryConfirm': 'Vymazať „{name}“ z tohto dňa?',
    'food.errName': 'Zadaj názov potraviny.',
    'food.errNumber': 'Hodnoty musia byť čísla od 0 do 100000.',
    'food.errQty': 'Množstvo musí byť väčšie ako 0 a najviac 1000.',
    'food.disclaimer': 'Hodnoty si zapísal ty. GymQuest ich neoveruje a nemá žiadnu databázu potravín.',
    'food.prevDay': 'Predchádzajúci deň',
    'food.nextDay': 'Nasledujúci deň',

    'tips.title': 'Ako čítať tieto údaje',
    'tips.t1Title': 'Meraj hmotnosť stále rovnako',
    'tips.t1Body': 'Tá istá váha, tá istá denná doba, podobné podmienky – veľa ľudí sa váži ráno pred jedlom. Pravidelnosť je dôležitejšia než ktorékoľvek jedno číslo.',
    'tips.t2Title': 'Denné výkyvy nie sú trend',
    'tips.t2Body': 'Hmotnosť sa hýbe s vodou, jedlom v črevách a soľou, takže sa počas dňa môže meniť. Porovnávaj týždenné priemery alebo ten istý deň počas niekoľkých týždňov – to sa už blíži k skutočnému smeru.',
    'tips.t3Title': 'Trvanie, série, opakovania a progresívne preťaženie',
    'tips.t3Body': 'Trvanie je, ako dlho tréning trval. Séria je jedna skupina opakovaní. Opakovania sú, koľkokrát si váhu pohol. Progresívne preťaženie znamená postupne robiť trochu viac – viac váhy, viac opakovaní alebo lepšiu techniku.',
    'tips.t4Title': 'Čo ti odhad kalórií povie a čo nie',
    'tips.t4Body': 'Odhaduje energiu, ktorú by mohol za deň spotrebovať priemerný človek s tvojimi mierami. Nedokáže zmerať tvoj metabolizmus a nič nehovorí o kvalite jedla ani o zdraví.',
    'tips.t5Title': 'Čo znamenajú tvoje vlastné hodnoty',
    'tips.t5Body': 'Sú to tvoje poznámky, nie laboratórne merania. Porcie sú odhady, etikety sa líšia a to isté jedlo môže mať v rôzne dni iné hodnoty. Hodí sa to na hľadanie vzorcov, nie na presné účtovníctvo.',
    'tips.foodTitle': 'O hodnotách, ktoré zapisuješ',
    'tips.f1Title': 'Tvoj zápis, tvoje čísla',
    'tips.f1Body': 'Nič sa tu nedohľadáva ani nekontroluje. Čo napíšeš, to vidíš – súčty sú len také presné ako tvoje odhady.',
    'tips.f2Title': 'Vzorce sú dôležitejšie než presnosť',
    'tips.f2Body': 'Približný, ale pravidelný zápis za niekoľko týždňov povie viac než jeden starostlivo odvážený deň. Jedlo nie je niečo, čo si treba zaslúžiť alebo odtrénovať.',
  },
  en: {
    'tab.dnes': 'Today', 'tab.trening': 'Workout', 'tab.pokrok': 'Progress', 'tab.motivacia': 'Motivation', 'tab.kalendar': 'Calendar',
    'kalendar.prevMonth': 'Previous month',
    'kalendar.nextMonth': 'Next month',
    'kalendar.goToday': 'Today',
    'kalendar.legendTitle': 'Legend',
    'kalendar.legendWorkout': 'Green — Workout completed',
    'kalendar.legendMissed': 'Red — No workout recorded',
    'kalendar.legendToday': 'Orange outline — Today',
    'kalendar.statusWorkout': 'Workout completed',
    'kalendar.statusNone': 'No workout recorded',
    'kalendar.statusTodayNone': 'Today — no workout recorded yet',
    'kalendar.statusFuture': 'This date is in the future.',
    'kalendar.emptyPast': 'No workout was recorded on this day.',
    'kalendar.achievements': 'Achievements unlocked',
    'kalendar.ariaDay': '{date} — {status}',
    'kalendar.ariaWorkoutCountOne': '{n} workout on this day',
    'kalendar.ariaWorkoutCountFew': '{n} workouts on this day',
    'kalendar.ariaWorkoutCountOther': '{n} workouts on this day',
    'plan.push': 'Push', 'plan.pull': 'Pull', 'plan.legs': 'Legs',
    'plan.newName': 'New workout plan',
    'planChoice.title': 'Create workout plan',
    'planChoice.blank': 'Blank workout plan',
    'planChoice.blankDesc': 'Create an empty custom workout plan and add exercises manually.',
    'planChoice.fullBody': 'Full Body builder',
    'planChoice.fullBodyDesc': 'Build a full-body workout by choosing exercises from your existing workout plans.',
    'fb.title': 'Full Body builder',
    'fb.subtitle': 'Choose exercises from your existing workout plans.',
    'fb.nameLabel': 'Plan name',
    'fb.defaultName': 'Full Body',
    'fb.selected': 'Selected exercises: {n}',
    'fb.selectedOne': 'Selected exercises: {n}',
    'fb.selectedFew': 'Selected exercises: {n}',
    'fb.selectedOther': 'Selected exercises: {n}',
    'fb.selectAll': 'Select all',
    'fb.clear': 'Clear',
    'fb.create': 'Create Full Body workout',
    'fb.needOne': 'Select at least one exercise.',
    'fb.noExercises': 'No exercises are available in this workout plan.',
    'fb.duplicates': 'Duplicate exercises are added only once.',
    'fb.bodyweight': 'Bodyweight',
    'picker.title': 'Add exercises from existing plans',
    'picker.subtitle': 'Tick the exercises you want to add to this plan.',
    'picker.apply': 'Add to plan',
    'unilateral.trainBoth': 'Train both sides separately',
    'unilateral.startLeft': 'Start with left',
    'unilateral.startRight': 'Start with right',
    'unilateral.left': 'Left',
    'unilateral.right': 'Right',
    'unilateral.setsPerSideOne': '{n} set per side',
    'unilateral.setsPerSideFew': '{n} sets per side',
    'unilateral.setsPerSideOther': '{n} sets per side',
    'unilateral.setSide': 'Set {n} — {side}',
    'unilateral.completed': 'Completed: {sides}',
    'unilateral.bothSides': 'Left and Right',
    'unilateral.leftOnly': 'Left only',
    'unilateral.rightOnly': 'Right only',
    'unilateral.noneSides': 'None',
    'unilateral.failureList': 'Failure: {list}',
    'exercise.bench-press': 'Bench press', 'exercise.overhead-press': 'Overhead press', 'exercise.dips': 'Dips', 'exercise.lateral-raises': 'Lateral raises',
    'exercise.pull-ups': 'Pull-ups', 'exercise.bent-over-rows': 'Bent-over rows', 'exercise.cable-rows': 'Cable rows', 'exercise.bicep-curls': 'Bicep curls',
    'exercise.squats': 'Squats', 'exercise.leg-press': 'Leg press', 'exercise.lunges': 'Lunges', 'exercise.leg-curls': 'Leg curls', 'exercise.calf-raises': 'Calf raises',
    'header.level': 'Lv.',
    'header.settingsTitle': 'Settings',
    'header.levelTitle': 'Level',
    'settings.language': 'Language',
    'settings.changeLanguage': 'Change language',
    'settings.languageCurrent': 'Current language: {name}',
    'langPicker.title': 'Language',
    'langPicker.select': '{name} — choose this language',
    'langPicker.selected': '{name} — currently selected',
    'settings.autoBackup': 'Automatic backup',
    'settings.autoBackupHint': 'When supported, GymQuest attempts to create a JSON backup while the app is open. iPhone may require you to confirm or save the file.',
    'settings.autoBackupLast': 'Last external backup offered: {when}',
    'settings.importOlder': 'This backup has fewer workouts than your current data ({old} → {new}).',
    'backup.never': 'never',
    'backup.dueTitle': 'Backup is due',
    'backup.dueBody': 'Save a JSON copy outside GymQuest so you can restore your workouts and history.',
    'backup.sentTitle': 'Backup file created',
    'backup.sentBody': 'A backup file was handed to the browser.',
    'backup.saveNow': 'Save backup now',
    'backup.saveAgain': 'Save again',
    'backup.dismiss': 'Dismiss backup reminder',
    'backup.noConfirm': 'GymQuest cannot confirm the file was actually saved — check your Files app or Downloads folder.',
    'backup.shareHint': 'If the share sheet appeared, choose “Save to Files” (iCloud Drive or On My iPhone). GymQuest cannot confirm it was saved.',
    'backup.fileName': 'File: {name}',
    'dnes.weekTitle': 'Workouts this week',
    'dnes.weekDone': '{n} of {g}',
    'dnes.weekDoneShort': '{n} of {g}',
    'dnes.weekGoalMet': 'Weekly goal reached!',
    'dnes.weekRemaining': 'Still {n} to go.',
    'dnes.weekRemainingOne': 'Still {n} workout to go.',
    'dnes.weekRemainingFew': 'Still {n} workouts to go.',
    'dnes.weekRemainingOther': 'Still {n} workouts to go.',
    'dnes.streakTitle': '🔥 Consistency',
    'dnes.streakNone': 'No streak',
    'dnes.streakWeek': '🔥 {n} weeks in a row',
    'dnes.streakWeekOne': '🔥 {n} week in a row',
    'dnes.streakWeekFew': '🔥 {n} weeks in a row',
    'dnes.streakWeekOther': '🔥 {n} weeks in a row',
    'dnes.streakStart': 'Complete at least {g} workouts this week to start a streak.',
    'dnes.streakStartOne': 'Complete at least {g} workout this week to start a streak.',
    'dnes.streakStartFew': 'Complete at least {g} workouts this week to start a streak.',
    'dnes.streakStartOther': 'Complete at least {g} workouts this week to start a streak.',
    'dnes.streakContinue': 'Complete {g} workouts this week to continue your streak.',
    'dnes.streakContinueOne': 'Complete {g} workout this week to continue your streak.',
    'dnes.streakContinueFew': 'Complete {g} workouts this week to continue your streak.',
    'dnes.streakContinueOther': 'Complete {g} workouts this week to continue your streak.',
    'dnes.streakGoing': 'Weekly goal completed. Your streak continues!',
    'dnes.streakEnded': 'Your streak has ended. Start a new streak by completing your weekly goal.',
    'dnes.excuse': 'School / sick',
    'dnes.excuseActive': 'School / sick ✓ (active)',
    'dnes.excuseNote': 'This week is excused — the streak is kept.',
    'dnes.start': 'Start workout',
    'dnes.nextPlan': 'Recommended: {plan}',
    'dnes.weekOf': 'Week {n}',
    'trening.finish': 'Finish workout',
    'trening.finishTitle': 'Finish workout?',
    'trening.doneTitle': '🏆 Workout complete!',
    'trening.confirmText': '{plan} · {done} of {total} sets<br>You get <b style="color:#a3e635">+{xp} XP</b>',
    'trening.noteLabel': 'Note (optional)',
    'trening.super': 'Awesome!',
    'trening.undo': 'Undo this workout',
    'trening.undoConfirmTitle': 'Undo workout?',
    'trening.undoConfirm': 'This workout and its {xp} XP will be removed.',
    'trening.setsDone': 'Sets done: <b>{done} of {total}</b> · {msg}',
    'trening.setsHint': 'Mark sets as done.',
    'trening.firstTime': 'First time',
    'trening.compareUp': '▲ {w} kg · +{r} reps vs last time',
    'trening.compareDown': '▼ {w} kg · {r} reps vs last time',
    'trening.compareSame': 'Same as last time ({w} kg)',
    'trening.compareWeightUp': '▲ {w} kg vs last time',
    'trening.compareWeightDown': '▼ {w} kg vs last time',
    'trening.compareRepsUp': '+{r} reps vs last time',
    'trening.compareRepsDown': '{r} reps vs last time',
    'trening.edit': 'Edit plan',
    'trening.editTitle': 'Edit plan',
    'trening.planLabel': 'Workout plan',
    'trening.editPlanButton': '✏️ Edit plan',
    'trening.planNameLabel': 'Workout plan name',
    'trening.planNamePlaceholder': 'e.g. Upper body',
    'trening.planNameInvalid': 'Enter a workout plan name (max. 40 characters).',
    'trening.addPlan': '+ Add workout plan',
    'trening.managePlans': 'Manage plans',
    'trening.managePlansDone': 'Done',
    'trening.manageHint': 'Drag a plan to change its order, or tap ✏️ to edit it.',
    'trening.movePlanLeft': 'Move left',
    'trening.movePlanRight': 'Move right',
    'trening.dragPlan': 'Move workout plan',
    'trening.dragExercise': 'Move exercise',
    'trening.moveUp': 'Move up',
    'trening.moveDown': 'Move down',
    'trening.addFromPlans': 'Add exercises from existing plans',
    'trening.setDoneAria': 'Mark set {n} as done',
    'trening.deletePlan': 'Delete workout plan',
    'trening.deletePlanTitle': 'Delete workout plan?',
    'trening.deletePlanConfirm': 'Workout plan “{name}” will be removed and will no longer appear in the rotation. Workout history will be kept.',
    'trening.deletePlanLast': 'At least one workout plan must remain.',
    'trening.addExercise': '+ Add exercise',
    'trening.exercisePlaceholder': 'Exercise',
    'trening.editSave': 'Save',
    'trening.editCancel': 'Cancel',
    'trening.lastExerciseBlock': 'A plan needs at least one exercise. Add a new one.',
    'trening.deleteExerciseTitle': 'Delete exercise?',
    'trening.deleteExercise': 'Exercise "{name}" will be removed from the plan.',
    'trening.editInvalid': 'Fill in the exercise name and numbers (sets 1–99, reps 1–99, weight 0–999).',
    'trening.resetSession': 'Reset workout',
    'trening.resetSessionTitle': 'Reset workout?',
    'trening.resetSessionConfirm': 'Marked sets of this workout will be cleared. History stays intact.',
    'trening.timerLabel': 'Rest',
    'trening.timerDone': 'Rest time is over.',
    'trening.timerComplete': 'Rest complete',
    'trening.timerStop': 'Stop timer',
    'trening.timerStart': 'Start rest',
    'trening.timerSection': 'Rest timer',
    'trening.timerCustom': 'Custom',
    'trening.customTitle': 'Custom rest time',
    'trening.customMinutes': 'Minutes',
    'trening.customSeconds': 'Seconds',
    'trening.customStart': 'Start rest timer',
    'trening.customStartAlt': 'Start custom timer',
    'trening.customInvalid': 'Enter a valid rest time.',
    'trening.customZero': 'Rest time must be greater than zero.',
    'failure.plannedLabel': 'Sets to failure',
    'failure.none': 'None',
    'failure.failure': 'Failure',
    'failure.planned': 'Planned failure',
    'failure.noSets': 'No failure sets',
    'failure.sets': 'Failure sets: {sets}',
    'failure.markSet': 'Mark set as failure',
    'failure.removeMarker': 'Remove failure marker',
    'trening.failureHint': '🔥 Failure — mark a set only if you actually reached failure.',
    'trening.failureHintEdit': 'Optional: choose the sets you plan to take to failure. You can change the actual result during the workout.',
    'trening.durationLabel': 'Workout duration',
    'trening.sessionRestored': 'Active workout restored',
    'trening.planSaved': 'Plan changes are saved. Your current workout progress is preserved.',
    'trening.durationResult': 'Workout duration: {duration}',
    'history.duration': 'Duration: {duration}',
    'duration.secOne': '{n} second', 'duration.secFew': '{n} seconds', 'duration.secOther': '{n} seconds',
    'duration.minOne': '{n} minute', 'duration.minFew': '{n} minutes', 'duration.minOther': '{n} minutes',
    'duration.hourUnitOne': '{n} hour', 'duration.hourUnitFew': '{n} hours', 'duration.hourUnitOther': '{n} hours',
    'duration.minUnitOne': '{n} minute', 'duration.minUnitFew': '{n} minutes', 'duration.minUnitOther': '{n} minutes',
    'duration.hourMin': '{h} {m}',
    'pokrok.thisWeek': 'This week', 'pokrok.thisMonth': 'This month', 'pokrok.total': 'Total',
    'pokrok.recordsTitle': '🏆 Personal records',
    'pokrok.recordsEmpty': 'No records yet.',
    'pokrok.nextMilestone': 'Next milestone: {kg} kg',
    'pokrok.historyTitle': '📋 Workout history',
    'pokrok.historyEmpty': 'No workouts yet.',
    'pokrok.workoutName': '{plan}',
    'pokrok.workoutFallback': 'Workout',
    'pokrok.setsCountOne': '{n} set', 'pokrok.setsCountFew': '{n} sets', 'pokrok.setsCountOther': '{n} sets',
    'history.editTitle': 'Edit workout',
    'history.deleteTitle': 'Delete workout?',
    'history.deleteConfirm': 'This workout and its {xp} XP will be removed.',
    'history.workoutSummary': '{name} {sets}×{reps} · {w} kg',
    'history.date': 'Date',
    'history.setsLabel': 'Sets', 'history.repsLabel': 'Reps', 'history.setsDoneLabel': 'Done',
    'motivacia.levelTitle': 'Level',
    'motivacia.levelSub': 'You have {xp} XP total. {left} XP needed for the next level.',
    'motivacia.achTitle': '🎖️ Achievements',
    'motivacia.unlocked': 'Unlocked {date}',
    'motivacia.ach.5kg': '{name} · {kg} kg',
    'setup.title': 'Workout setup',
    'setup.question': 'How many workouts per week do you want to complete?',
    'setup.explain': 'Your weekly goal drives progress, streak and weekly rewards.',
    'setup.continue': 'Continue',
    'settings.title': 'Settings',
    'settings.goalLabel': 'Weekly workout goal',
    'settings.goalHint': 'Pick between 1 and 7 workouts per week.',
    'settings.goalInvalid': 'Enter a whole number from {min} to {max}.',
    'settings.save': 'Save goal',
    'settings.restSound': 'Rest timer sound',
    'settings.restSoundHint': 'Play a short gong when the rest timer reaches zero.',
    'settings.testSound': 'Test sound',
    'settings.testSoundDisabledHint': 'Enable Rest timer sound to test it.',
    'settings.testSoundFailed': 'Sound could not be played. Check your device sound settings.',
    'settings.on': 'On',
    'settings.off': 'Off',
    'settings.restSoundLength': 'Rest timer sound length',
    'settings.lenShort': 'Short',
    'settings.lenStandard': 'Standard',
    'settings.lenLong': 'Long',
    'settings.export': 'Export data',
    'settings.import': 'Import data',
    'settings.reset': 'Reset data',
    'settings.loadDemo': 'Load demo data',
    'settings.removeDemo': 'Remove demo data',
    'settings.demoConfirm': 'This will replace the current history with demo data.',
    'settings.demoRemoveConfirm': 'This will remove demo data and start you fresh.',
    'settings.demoNone': 'No demo data.',
    'units.kg': 'kg', 'units.xp': 'XP', 'units.sets': 'sets', 'units.reps': 'reps',
    'settings.importTitle': 'Import data?',
    'settings.importConfirm': 'This will replace all current data ({n} workouts).',
    'settings.importError': 'Invalid backup file.',
    'settings.resetTitle': 'Reset all data?',
    'settings.resetConfirm': 'All workouts, records and settings will be deleted. This cannot be undone.',
    'settings.resetFinal': 'Really delete everything?',
    'settings.resetFinalConfirm': 'This will permanently erase all data.',
    'settings.resetConfirmAction': 'Reset all data',
    'settings.resetFinalAction': 'Really delete',
    'common.cancel': 'Cancel', 'common.close': 'Close', 'common.save': 'Save', 'common.ok': 'OK', 'common.delete': 'Delete',
    'update.available': 'A new version of GymQuest is available.',
    'update.now': 'Update now',
    'app.storageError': 'This browser refused to save your data — changes will be lost after a refresh. Allow site data (localStorage) in your browser and try again. If saving still fails, export a backup while the data is still in memory.',
    'common.confirm': 'Confirmation',
    'common.confirmTitle': 'Confirmation',
    'achievements.first': 'First Workout', 'achievements.firstDesc': 'Complete your first workout',
    'achievements.five': '5 Workouts', 'achievements.fiveDesc': 'Complete 5 workouts',
    'achievements.ten': '10 Workouts', 'achievements.tenDesc': 'Complete 10 workouts',
    'achievements.twentyfive': '25 Workouts', 'achievements.twentyfiveDesc': 'Complete 25 workouts',
    'achievements.fifty': '50 Workouts', 'achievements.fiftyDesc': 'Complete 50 workouts',
    'achievements.hundred': '100 Workouts', 'achievements.hundredDesc': 'Complete 100 workouts',
    'achievements.weeklygoal1': 'First Weekly Goal', 'achievements.weeklygoal1Desc': 'Reach your weekly goal',
    'achievements.consistent2': 'Consistency 2 weeks', 'achievements.consistent2Desc': 'Train at least {g}× per week for 2 weeks in a row',
    'achievements.consistent4': 'Consistency 4 weeks', 'achievements.consistent4Desc': 'Train at least {g}× per week for 4 weeks in a row',
    'achievements.consistent8': 'Consistency 8 weeks', 'achievements.consistent8Desc': 'Train at least {g}× per week for 8 weeks in a row',
    'achievements.consistent12': 'Consistency 12 weeks', 'achievements.consistent12Desc': 'Train at least {g}× per week for 12 weeks in a row',
    'achievements.xp200': '200 XP', 'achievements.xp200Desc': 'Earn 200 XP',
    'achievements.newpr': 'New Personal Record', 'achievements.newprDesc': 'Set a new personal best weight',
    'achievements.solid2': 'Consistent Week', 'achievements.solid2Desc': 'Complete at least 3 workouts in 2 different calendar weeks',
    'achievements.solid4': 'Monthly Momentum', 'achievements.solid4Desc': 'Complete at least 3 workouts in 4 different calendar weeks',
    'achievements.fullweek': 'Full Week', 'achievements.fullweekDesc': 'Complete 5 workouts in a single calendar week',
    'achievements.pr5': 'Record Breaker', 'achievements.pr5Desc': 'Set 5 personal records',
    'achievements.pr10': 'PR Hunter', 'achievements.pr10Desc': 'Set 10 personal records',
    'achievements.improve': 'Stronger Every Day', 'achievements.improveDesc': 'Beat your own previous recorded weight for the same exercise',
    'achievements.customplan': 'Plan Builder', 'achievements.customplanDesc': 'Create your first custom workout plan',
    'achievements.fourplans': 'Training Architect', 'achievements.fourplansDesc': 'Create 4 active workout plans',
    'achievements.customex5': 'Exercise Collector', 'achievements.customex5Desc': 'Add 5 custom exercises to your workout plans',
    'achievements.variety4': 'Variety Athlete', 'achievements.variety4Desc': 'Complete workouts from 4 different workout plans',
    'achievements.comeback': 'Comeback Stronger', 'achievements.comebackDesc': 'Complete a workout after at least 14 days without one',
    'achievements.missedweek': 'Never Quit', 'achievements.missedweekDesc': 'Complete a workout after missing a full calendar week',
    'motivacia.xpReward': '+{xp} XP',
    'motivacia.newAchXp': '+{xp} XP from achievements',
    'motivacia.newAchievement': 'New achievement: {names}',

    /* --- Body, calories, food and tips --- */
    'units.kg': 'kg', 'units.lb': 'lb', 'units.cm': 'cm', 'units.in': 'in', 'units.g': 'g', 'units.kcal': 'kcal',

    'pokrok.subProgress': 'Progress', 'pokrok.subBody': 'Body', 'pokrok.subFood': 'Food',

    'body.summaryTitle': 'Latest measurements',
    'body.unitsAria': 'Measurement units',
    'body.unitsNote': 'Units change the display only. Stored values are never rewritten.',
    'body.add': '+ Add measurement',
    'body.addTitle': 'Add measurement',
    'body.editTitle': 'Edit measurement',
    'body.deleteTitle': 'Delete measurement',
    'body.deleteConfirm': 'Delete the measurement from {date}? This cannot be undone.',
    'body.dateLabel': 'Date',
    'body.noteLabel': 'Note (optional)',
    'body.fieldsHint': 'Leave a field empty if you did not measure it.',
    'body.empty': 'No measurements yet.',
    'body.noValues': 'No values recorded',
    'body.errDate': 'Pick a valid date.',
    'body.errRange': 'Check these values: {fields}.',
    'body.errEmpty': 'Fill in at least one value or write a note.',
    'body.chartTitle': 'Trend',
    'body.metricAria': 'Measurement to show',
    'body.chartRange': 'Lowest {min} · highest {max} {unit}',
    'body.chartNeedTwo': 'Add another entry to see a trend.',
    'body.chartAria': 'Trend chart, lowest {min}, highest {max}',
    'body.historyTitle': 'Measurement history',
    'body.storageNotice': 'Your stored data is getting large and may soon exceed what this browser can keep. Export a backup and consider deleting old entries you no longer need. GymQuest never deletes anything for you.',
    'body.f.weight': 'Body weight',
    'body.f.waist': 'Waist',
    'body.f.chest': 'Chest',
    'body.f.armLeft': 'Left upper arm',
    'body.f.armRight': 'Right upper arm',
    'body.f.thighLeft': 'Left thigh',
    'body.f.thighRight': 'Right thigh',
    'body.f.hip': 'Hip',

    'calorie.title': 'Daily energy estimate',
    'calorie.offHint': 'Optional and hidden by default. GymQuest estimates nothing until you turn this on.',
    'calorie.enable': 'Show the estimate',
    'calorie.disable': 'Hide the estimate',
    'calorie.intro': 'An estimate, not a prescription. This is not medical advice.',
    'calorie.adultQuestion': 'Are you 18 or older?',
    'calorie.adultYes': 'I am 18 or older',
    'calorie.adultNo': 'I am under 18',
    'calorie.underage': 'GymQuest does not show adult calorie targets to under-18s. A body that is still growing has different needs, and an estimate built for adults would be misleading here. If you want to know more about food and energy at your age, talk with a doctor, a dietitian or a parent or guardian.',
    'calorie.inHeight': 'Height',
    'calorie.inAge': 'Age',
    'calorie.years': 'years',
    'calorie.inSex': 'Sex used by the formula',
    'calorie.sexPick': 'Not specified',
    'calorie.sexMale': 'Male',
    'calorie.sexFemale': 'Female',
    'calorie.inActivity': 'Activity level',
    'calorie.activityPick': 'Not specified',
    'calorie.actSedentary': 'Mostly sitting',
    'calorie.actLight': 'Light activity 1–3 days a week',
    'calorie.actModerate': 'Moderate activity 3–5 days a week',
    'calorie.actActive': 'Hard activity 6–7 days a week',
    'calorie.actVery': 'Very hard activity or physical work',
    'calorie.inWeight': 'Body weight (from your log)',
    'calorie.weightFromLog': 'Using your latest logged weight from {date}.',
    'calorie.weightMissing': 'Log your body weight first. GymQuest will not guess it.',
    'calorie.saveInputs': 'Save inputs',
    'calorie.errAge': 'Age must be between 1 and 120.',
    'calorie.errHeight': 'Height looks out of range. Check the value and the unit.',
    'calorie.needInputs': 'Not enough inputs yet',
    'calorie.missing': 'Still missing: {list}',
    'calorie.range': '{low}–{high} {unit} a day',
    'calorie.bmrLine': 'That comes from an estimated resting rate of about {bmr} {unit} a day.',
    'calorie.limit1': 'This is a population average. Your real needs can differ by a lot.',
    'calorie.limit2': 'It cannot see body composition, health conditions, medication, pregnancy or how you actually train.',
    'calorie.limit3': 'It is not a target to hit exactly, and it is not a meal plan.',
    'calorie.limit4': 'GymQuest deliberately does not offer weight-loss or weight-gain calorie targets.',
    'calorie.limit5': 'For anything medical, or for a plan built around you, talk to a qualified professional.',
    'calorie.formula': 'Formula: Mifflin-St Jeor (Mifflin MD et al., Am J Clin Nutr, 1990) for resting energy, multiplied by an activity factor. The result is shown as a range of ±10%.',
    'calorie.updated': 'Last calculated: {when}',

    'food.offHint': 'The food log is optional and off by default. GymQuest has no food database – you enter everything yourself.',
    'food.enable': 'Turn on the food log',
    'food.disable': 'Turn off the food log',
    'food.addEntry': '+ Add food',
    'food.addTitle': 'Add food',
    'food.editEntryTitle': 'Edit food entry',
    'food.newTemplateTitle': 'New saved food',
    'food.editTemplateTitle': 'Edit saved food',
    'food.pickSaved': 'Saved food',
    'food.pickNone': 'None – enter the values manually',
    'food.qtyLabel': 'Amount (multiplier)',
    'food.saveAsTemplate': 'Also save as a food',
    'food.nameLabel': 'Name',
    'food.kcalLabel': 'Energy',
    'food.protein': 'Protein',
    'food.carbs': 'Carbohydrates',
    'food.fat': 'Fat',
    'food.macroLine': 'P {p} g · C {c} g · F {f} g',
    'food.totalsLine': '{total} · {entries}',
    'food.entries': '{n} entries',
    'food.entriesOne': '{n} entry',
    'food.entriesOther': '{n} entries',
    'food.emptyDay': 'Nothing logged for this day.',
    'food.noSaved': 'No saved foods yet.',
    'food.savedTitle': 'Saved foods',
    'food.newTemplate': '+ New food',
    'food.editTemplate': 'Edit saved food',
    'food.deleteTemplate': 'Delete saved food',
    'food.deleteTemplateConfirm': 'Delete “{name}” from your saved foods? Entries you already logged keep their own values.',
    'food.editEntry': 'Edit entry',
    'food.deleteEntry': 'Delete entry',
    'food.deleteEntryConfirm': 'Delete “{name}” from this day?',
    'food.errName': 'Give the food a name.',
    'food.errNumber': 'Values must be numbers between 0 and 100000.',
    'food.errQty': 'The amount must be greater than 0 and at most 1000.',
    'food.disclaimer': 'You entered these values yourself. GymQuest does not verify nutrition data and has no food database.',
    'food.prevDay': 'Previous day',
    'food.nextDay': 'Next day',

    'tips.title': 'How to read these numbers',
    'tips.t1Title': 'Measuring body weight consistently',
    'tips.t1Body': 'Same scale, same time of day, similar conditions – many people weigh in the morning before eating. Consistency matters far more than any single reading.',
    'tips.t2Title': 'Day-to-day changes are not a trend',
    'tips.t2Body': 'Weight moves with water, food in your gut and salt, so it can swing within a single day. Compare weekly averages, or the same day across several weeks, to see something closer to a real direction.',
    'tips.t3Title': 'Duration, sets, reps and progressive overload',
    'tips.t3Body': 'Duration is how long the session took. A set is one group of repetitions. Reps are how many times you moved the weight. Progressive overload means gradually doing a little more over time – more weight, more reps or better form.',
    'tips.t4Title': 'What the calorie estimate can and cannot tell you',
    'tips.t4Body': 'It estimates the energy an average person with your measurements might use in a day. It cannot measure your metabolism, and it says nothing about food quality or health.',
    'tips.t5Title': 'What your own nutrition numbers mean',
    'tips.t5Body': 'They are your own notes, not lab measurements. Portions are estimates, labels vary, and the same meal can differ between days. Useful for spotting patterns, not for exact accounting.',
    'tips.foodTitle': 'About the values you enter',
    'tips.f1Title': 'Your entry, your numbers',
    'tips.f1Body': 'Nothing here is looked up or checked. What you type is what you see, so the totals are only as good as your estimates.',
    'tips.f2Title': 'Patterns beat precision',
    'tips.f2Body': 'A rough but consistent record over weeks says more than one carefully weighed day. Food is not something to earn or to pay off with training.',
  },
  es: {
    'tab.dnes': 'Hoy', 'tab.trening': 'Entrenamiento', 'tab.pokrok': 'Progreso', 'tab.motivacia': 'Motivación', 'tab.kalendar': 'Calendario',
    'kalendar.prevMonth': 'Mes anterior',
    'kalendar.nextMonth': 'Mes siguiente',
    'kalendar.goToday': 'Hoy',
    'kalendar.legendTitle': 'Leyenda',
    'kalendar.legendWorkout': 'Verde — Entrenamiento completado',
    'kalendar.legendMissed': 'Rojo — Sin entrenamiento registrado',
    'kalendar.legendToday': 'Borde naranja — Hoy',
    'kalendar.statusWorkout': 'Entrenamiento completado',
    'kalendar.statusNone': 'Sin entrenamiento registrado',
    'kalendar.statusTodayNone': 'Hoy — todavía sin entrenamiento registrado',
    'kalendar.statusFuture': 'Esta fecha está en el futuro.',
    'kalendar.emptyPast': 'No se registró ningún entrenamiento este día.',
    'kalendar.achievements': 'Logros desbloqueados',
    'kalendar.ariaDay': '{date} — {status}',
    'kalendar.ariaWorkoutCountOne': '{n} entrenamiento este día',
    'kalendar.ariaWorkoutCountFew': '{n} entrenamientos este día',
    'kalendar.ariaWorkoutCountOther': '{n} entrenamientos este día',
    'plan.push': 'Empuje', 'plan.pull': 'Tirón', 'plan.legs': 'Piernas',
    'plan.newName': 'Nuevo plan de entrenamiento',
    'planChoice.title': 'Crear plan de entrenamiento',
    'planChoice.blank': 'Plan de entrenamiento vacío',
    'planChoice.blankDesc': 'Crea un plan personalizado vacío y añade los ejercicios a mano.',
    'planChoice.fullBody': 'Constructor Cuerpo completo',
    'planChoice.fullBodyDesc': 'Crea un entrenamiento de cuerpo completo eligiendo ejercicios de tus planes existentes.',
    'fb.title': 'Constructor Cuerpo completo',
    'fb.subtitle': 'Elige ejercicios de tus planes de entrenamiento existentes.',
    'fb.nameLabel': 'Nombre del plan',
    'fb.defaultName': 'Cuerpo completo',
    'fb.selected': 'Ejercicios seleccionados: {n}',
    'fb.selectedOne': 'Ejercicios seleccionados: {n}',
    'fb.selectedFew': 'Ejercicios seleccionados: {n}',
    'fb.selectedOther': 'Ejercicios seleccionados: {n}',
    'fb.selectAll': 'Seleccionar todo',
    'fb.clear': 'Limpiar',
    'fb.create': 'Crear entrenamiento de cuerpo completo',
    'fb.needOne': 'Selecciona al menos un ejercicio.',
    'fb.noExercises': 'No hay ejercicios disponibles en este plan.',
    'fb.duplicates': 'Los ejercicios duplicados se añaden solo una vez.',
    'fb.bodyweight': 'Peso corporal',
    'picker.title': 'Añadir ejercicios de planes existentes',
    'picker.subtitle': 'Marca los ejercicios que quieres añadir a este plan.',
    'picker.apply': 'Añadir al plan',
    'unilateral.trainBoth': 'Entrenar ambos lados por separado',
    'unilateral.startLeft': 'Empezar por la izquierda',
    'unilateral.startRight': 'Empezar por la derecha',
    'unilateral.left': 'Izquierda',
    'unilateral.right': 'Derecha',
    'unilateral.setsPerSideOne': '{n} serie por lado',
    'unilateral.setsPerSideFew': '{n} series por lado',
    'unilateral.setsPerSideOther': '{n} series por lado',
    'unilateral.setSide': 'Serie {n} — {side}',
    'unilateral.completed': 'Completado: {sides}',
    'unilateral.bothSides': 'Izquierda y derecha',
    'unilateral.leftOnly': 'Solo izquierda',
    'unilateral.rightOnly': 'Solo derecha',
    'unilateral.noneSides': 'Ninguno',
    'unilateral.failureList': 'Fallo: {list}',
    'exercise.bench-press': 'Press de banca', 'exercise.overhead-press': 'Press militar', 'exercise.dips': 'Fondos', 'exercise.lateral-raises': 'Elevaciones laterales',
    'exercise.pull-ups': 'Dominadas', 'exercise.bent-over-rows': 'Remo con barra', 'exercise.cable-rows': 'Remo en polea', 'exercise.bicep-curls': 'Curl de bíceps',
    'exercise.squats': 'Sentadillas', 'exercise.leg-press': 'Prensa de piernas', 'exercise.lunges': 'Zancadas', 'exercise.leg-curls': 'Curl femoral', 'exercise.calf-raises': 'Elevación de talones',
    'header.level': 'Nv.',
    'header.settingsTitle': 'Ajustes',
    'header.levelTitle': 'Nivel',
    'settings.language': 'Idioma',
    'settings.changeLanguage': 'Cambiar idioma',
    'settings.languageCurrent': 'Idioma actual: {name}',
    'langPicker.title': 'Idioma',
    'langPicker.select': '{name} — elegir este idioma',
    'langPicker.selected': '{name} — seleccionado actualmente',
    'settings.autoBackup': 'Copia de seguridad automática',
    'settings.autoBackupHint': 'Cuando sea compatible, GymQuest intenta crear una copia JSON mientras la aplicación está abierta. El iPhone puede pedirte que confirmes o guardes el archivo.',
    'settings.autoBackupLast': 'Última copia externa ofrecida: {when}',
    'settings.importOlder': 'Esta copia tiene menos entrenamientos que tus datos actuales ({old} → {new}).',
    'backup.never': 'nunca',
    'backup.dueTitle': 'Toca hacer copia de seguridad',
    'backup.dueBody': 'Guarda una copia JSON fuera de GymQuest para poder restaurar tus entrenamientos y tu historial.',
    'backup.sentTitle': 'Archivo de copia creado',
    'backup.sentBody': 'Se ha entregado un archivo de copia al navegador.',
    'backup.saveNow': 'Guardar copia ahora',
    'backup.saveAgain': 'Guardar otra vez',
    'backup.dismiss': 'Descartar el recordatorio de copia',
    'backup.noConfirm': 'GymQuest no puede confirmar que el archivo se haya guardado realmente: revisa la app Archivos o la carpeta Descargas.',
    'backup.shareHint': 'Si apareció el menú de compartir, elige «Guardar en Archivos» (iCloud Drive o En mi iPhone). GymQuest no puede confirmar que se haya guardado.',
    'backup.fileName': 'Archivo: {name}',
    'dnes.weekTitle': 'Entrenamientos esta semana',
    'dnes.weekDone': '{n} de {g}',
    'dnes.weekDoneShort': '{n} de {g}',
    'dnes.weekGoalMet': '¡Objetivo semanal alcanzado!',
    'dnes.weekRemaining': 'Aún {n} por hacer.',
    'dnes.weekRemainingOne': 'Aún {n} entrenamiento por hacer.',
    'dnes.weekRemainingFew': 'Aún {n} entrenamientos por hacer.',
    'dnes.weekRemainingOther': 'Aún {n} entrenamientos por hacer.',
    'dnes.streakTitle': '🔥 Constancia',
    'dnes.streakNone': 'Sin racha',
    'dnes.streakWeek': '🔥 {n} semanas seguidas',
    'dnes.streakWeekOne': '🔥 {n} semana seguida',
    'dnes.streakWeekFew': '🔥 {n} semanas seguidas',
    'dnes.streakWeekOther': '🔥 {n} semanas seguidas',
    'dnes.streakStart': 'Completa al menos {g} entrenamientos esta semana para empezar una racha.',
    'dnes.streakStartOne': 'Completa al menos {g} entrenamiento esta semana para empezar una racha.',
    'dnes.streakStartFew': 'Completa al menos {g} entrenamientos esta semana para empezar una racha.',
    'dnes.streakStartOther': 'Completa al menos {g} entrenamientos esta semana para empezar una racha.',
    'dnes.streakContinue': 'Completa {g} entrenamientos esta semana para continuar tu racha.',
    'dnes.streakContinueOne': 'Completa {g} entrenamiento esta semana para continuar tu racha.',
    'dnes.streakContinueFew': 'Completa {g} entrenamientos esta semana para continuar tu racha.',
    'dnes.streakContinueOther': 'Completa {g} entrenamientos esta semana para continuar tu racha.',
    'dnes.streakGoing': 'Objetivo semanal completado. ¡Tu racha continúa!',
    'dnes.streakEnded': 'Tu racha ha terminado. Empieza una nueva completando tu objetivo semanal.',
    'dnes.excuse': 'Colegio / enfermedad',
    'dnes.excuseActive': 'Colegio / enfermedad ✓ (activo)',
    'dnes.excuseNote': 'Esta semana está justificada — la racha se mantiene.',
    'dnes.start': 'Empezar entrenamiento',
    'dnes.nextPlan': 'Recomendado: {plan}',
    'dnes.weekOf': 'Semana {n}',
    'trening.finish': 'Terminar entrenamiento',
    'trening.finishTitle': '¿Terminar entrenamiento?',
    'trening.doneTitle': '🏆 ¡Entrenamiento completado!',
    'trening.confirmText': '{plan} · {done} de {total} series<br>Ganas <b style="color:#a3e635">+{xp} XP</b>',
    'trening.noteLabel': 'Nota (opcional)',
    'trening.super': '¡Genial!',
    'trening.undo': 'Deshacer este entrenamiento',
    'trening.undoConfirmTitle': '¿Deshacer entrenamiento?',
    'trening.undoConfirm': 'Se eliminará este entrenamiento y sus {xp} XP.',
    'trening.setsDone': 'Series hechas: <b>{done} de {total}</b> · {msg}',
    'trening.setsHint': 'Marca las series como hechas.',
    'trening.firstTime': 'Primera vez',
    'trening.compareUp': '▲ {w} kg · +{r} reps vs la última vez',
    'trening.compareDown': '▼ {w} kg · {r} reps vs la última vez',
    'trening.compareSame': 'Igual que la última vez ({w} kg)',
    'trening.compareWeightUp': '▲ {w} kg vs la última vez',
    'trening.compareWeightDown': '▼ {w} kg vs la última vez',
    'trening.compareRepsUp': '+{r} reps vs la última vez',
    'trening.compareRepsDown': '{r} reps vs la última vez',
    'trening.edit': 'Editar plan',
    'trening.editTitle': 'Editar plan',
    'trening.planLabel': 'Plan de entrenamiento',
    'trening.editPlanButton': '✏️ Editar plan',
    'trening.planNameLabel': 'Nombre del plan',
    'trening.planNamePlaceholder': 'p. ej. Tren superior',
    'trening.planNameInvalid': 'Escribe un nombre de plan (máx. 40 caracteres).',
    'trening.addPlan': '+ Añadir plan de entrenamiento',
    'trening.managePlans': 'Gestionar planes',
    'trening.managePlansDone': 'Listo',
    'trening.manageHint': 'Arrastra un plan para cambiar su orden, o toca ✏️ para editarlo.',
    'trening.movePlanLeft': 'Mover a la izquierda',
    'trening.movePlanRight': 'Mover a la derecha',
    'trening.dragPlan': 'Mover plan de entrenamiento',
    'trening.dragExercise': 'Mover ejercicio',
    'trening.moveUp': 'Subir',
    'trening.moveDown': 'Bajar',
    'trening.addFromPlans': 'Añadir ejercicios de planes existentes',
    'trening.setDoneAria': 'Marcar la serie {n} como hecha',
    'trening.deletePlan': 'Eliminar plan',
    'trening.deletePlanTitle': '¿Eliminar plan?',
    'trening.deletePlanConfirm': 'El plan «{name}» se eliminará y ya no aparecerá en la rotación. El historial de entrenamientos se conservará.',
    'trening.deletePlanLast': 'Debe quedar al menos un plan.',
    'trening.addExercise': '+ Añadir ejercicio',
    'trening.exercisePlaceholder': 'Ejercicio',
    'trening.editSave': 'Guardar',
    'trening.editCancel': 'Cancelar',
    'trening.lastExerciseBlock': 'Un plan necesita al menos un ejercicio. Añade uno nuevo.',
    'trening.deleteExerciseTitle': '¿Eliminar ejercicio?',
    'trening.deleteExercise': 'El ejercicio «{name}» se eliminará del plan.',
    'trening.editInvalid': 'Rellena el nombre del ejercicio y los números (series 1–99, reps 1–99, peso 0–999).',
    'trening.resetSession': 'Reiniciar entrenamiento',
    'trening.resetSessionTitle': '¿Reiniciar entrenamiento?',
    'trening.resetSessionConfirm': 'Se borrarán las series marcadas de este entrenamiento. El historial no cambia.',
    'trening.timerLabel': 'Descanso',
    'trening.timerDone': 'El descanso ha terminado.',
    'trening.timerComplete': 'Descanso completado',
    'trening.timerStop': 'Parar temporizador',
    'trening.timerStart': 'Empezar descanso',
    'trening.timerSection': 'Temporizador de descanso',
    'trening.timerCustom': 'Personalizado',
    'trening.customTitle': 'Tiempo de descanso personalizado',
    'trening.customMinutes': 'Minutos',
    'trening.customSeconds': 'Segundos',
    'trening.customStart': 'Iniciar temporizador de descanso',
    'trening.customStartAlt': 'Iniciar temporizador personalizado',
    'trening.customInvalid': 'Introduce un tiempo de descanso válido.',
    'trening.customZero': 'El tiempo de descanso debe ser mayor que cero.',
    'failure.plannedLabel': 'Series al fallo',
    'failure.none': 'Ninguna',
    'failure.failure': 'Fallo',
    'failure.planned': 'Fallo planeado',
    'failure.noSets': 'Sin series al fallo',
    'failure.sets': 'Series al fallo: {sets}',
    'failure.markSet': 'Marcar serie como fallo',
    'failure.removeMarker': 'Quitar marca de fallo',
    'trening.failureHint': '🔥 Fallo — marca una serie solo si realmente llegaste al fallo.',
    'trening.failureHintEdit': 'Opcional: elige las series que planeas llevar al fallo. Puedes cambiar el resultado real durante el entrenamiento.',
    'trening.durationLabel': 'Duración del entrenamiento',
    'trening.sessionRestored': 'Entrenamiento activo restaurado',
    'trening.planSaved': 'Los cambios del plan se guardan. El progreso de tu entrenamiento actual se conserva.',
    'trening.durationResult': 'Duración del entrenamiento: {duration}',
    'history.duration': 'Duración: {duration}',
    'duration.secOne': '{n} segundo', 'duration.secFew': '{n} segundos', 'duration.secOther': '{n} segundos',
    'duration.minOne': '{n} minuto', 'duration.minFew': '{n} minutos', 'duration.minOther': '{n} minutos',
    'duration.hourUnitOne': '{n} hora', 'duration.hourUnitFew': '{n} horas', 'duration.hourUnitOther': '{n} horas',
    'duration.minUnitOne': '{n} minuto', 'duration.minUnitFew': '{n} minutos', 'duration.minUnitOther': '{n} minutos',
    'duration.hourMin': '{h} {m}',
    'pokrok.thisWeek': 'Esta semana', 'pokrok.thisMonth': 'Este mes', 'pokrok.total': 'Total',
    'pokrok.recordsTitle': '🏆 Récords personales',
    'pokrok.recordsEmpty': 'Aún no hay récords.',
    'pokrok.nextMilestone': 'Siguiente hito: {kg} kg',
    'pokrok.historyTitle': '📋 Historial de entrenamientos',
    'pokrok.historyEmpty': 'Aún no hay entrenamientos.',
    'pokrok.workoutName': '{plan}',
    'pokrok.workoutFallback': 'Entrenamiento',
    'pokrok.setsCountOne': '{n} serie', 'pokrok.setsCountFew': '{n} series', 'pokrok.setsCountOther': '{n} series',
    'history.editTitle': 'Editar entrenamiento',
    'history.deleteTitle': '¿Eliminar entrenamiento?',
    'history.deleteConfirm': 'Se eliminará este entrenamiento y sus {xp} XP.',
    'history.workoutSummary': '{name} {sets}×{reps} · {w} kg',
    'history.date': 'Fecha',
    'history.setsLabel': 'Series', 'history.repsLabel': 'Reps', 'history.setsDoneLabel': 'Hechas',
    'motivacia.levelTitle': 'Nivel',
    'motivacia.levelSub': 'Tienes {xp} XP en total. Te faltan {left} XP para el siguiente nivel.',
    'motivacia.achTitle': '🎖️ Logros',
    'motivacia.unlocked': 'Desbloqueado {date}',
    'motivacia.ach.5kg': '{name} · {kg} kg',
    'setup.title': 'Configuración del entrenamiento',
    'setup.question': '¿Cuántos entrenamientos por semana quieres completar?',
    'setup.explain': 'Tu objetivo semanal determina el progreso, la racha y las recompensas semanales.',
    'setup.continue': 'Continuar',
    'settings.title': 'Ajustes',
    'settings.goalLabel': 'Objetivo semanal de entrenamientos',
    'settings.goalHint': 'Elige entre 1 y 7 entrenamientos por semana.',
    'settings.goalInvalid': 'Introduce un número entero de {min} a {max}.',
    'settings.save': 'Guardar objetivo',
    'settings.restSound': 'Sonido del temporizador de descanso',
    'settings.restSoundHint': 'Reproduce un gong corto cuando el temporizador de descanso llegue a cero.',
    'settings.testSound': 'Probar sonido',
    'settings.testSoundDisabledHint': 'Activa el sonido del temporizador de descanso para probarlo.',
    'settings.testSoundFailed': 'No se pudo reproducir el sonido. Revisa los ajustes de sonido del dispositivo.',
    'settings.on': 'Activado',
    'settings.off': 'Desactivado',
    'settings.restSoundLength': 'Duración del sonido del descanso',
    'settings.lenShort': 'Corto',
    'settings.lenStandard': 'Estándar',
    'settings.lenLong': 'Largo',
    'settings.export': 'Exportar datos',
    'settings.import': 'Importar datos',
    'settings.reset': 'Restablecer datos',
    'settings.loadDemo': 'Cargar datos de ejemplo',
    'settings.removeDemo': 'Quitar datos de ejemplo',
    'settings.demoConfirm': 'Esto reemplazará el historial actual por datos de ejemplo.',
    'settings.demoRemoveConfirm': 'Esto quitará los datos de ejemplo y empezarás de cero.',
    'settings.demoNone': 'No hay datos de ejemplo.',
    'units.kg': 'kg', 'units.xp': 'XP', 'units.sets': 'series', 'units.reps': 'reps',
    'settings.importTitle': '¿Importar datos?',
    'settings.importConfirm': 'Esto reemplazará todos los datos actuales ({n} entrenamientos).',
    'settings.importError': 'Archivo de copia no válido.',
    'settings.resetTitle': '¿Restablecer todos los datos?',
    'settings.resetConfirm': 'Se eliminarán todos los entrenamientos, récords y ajustes. Esto no se puede deshacer.',
    'settings.resetFinal': '¿Borrar todo de verdad?',
    'settings.resetFinalConfirm': 'Esto borrará todos los datos de forma permanente.',
    'settings.resetConfirmAction': 'Restablecer todos los datos',
    'settings.resetFinalAction': 'Borrar de verdad',
    'common.cancel': 'Cancelar', 'common.close': 'Cerrar', 'common.save': 'Guardar', 'common.ok': 'OK', 'common.delete': 'Eliminar',
    'update.available': 'Hay una nueva versión de GymQuest disponible.',
    'update.now': 'Actualizar ahora',
    'app.storageError': 'Este navegador rechazó guardar tus datos — los cambios se perderán al recargar. Permite el almacenamiento del sitio (localStorage) e inténtalo de nuevo. Si sigue fallando, exporta una copia mientras los datos aún están en memoria.',
    'common.confirm': 'Confirmación',
    'common.confirmTitle': 'Confirmación',
    'achievements.first': 'Primer entrenamiento', 'achievements.firstDesc': 'Completa tu primer entrenamiento',
    'achievements.five': '5 entrenamientos', 'achievements.fiveDesc': 'Completa 5 entrenamientos',
    'achievements.ten': '10 entrenamientos', 'achievements.tenDesc': 'Completa 10 entrenamientos',
    'achievements.twentyfive': '25 entrenamientos', 'achievements.twentyfiveDesc': 'Completa 25 entrenamientos',
    'achievements.fifty': '50 entrenamientos', 'achievements.fiftyDesc': 'Completa 50 entrenamientos',
    'achievements.hundred': '100 entrenamientos', 'achievements.hundredDesc': 'Completa 100 entrenamientos',
    'achievements.weeklygoal1': 'Primer objetivo semanal', 'achievements.weeklygoal1Desc': 'Alcanza tu objetivo semanal',
    'achievements.consistent2': 'Constancia 2 semanas', 'achievements.consistent2Desc': 'Entrena al menos {g}× por semana durante 2 semanas seguidas',
    'achievements.consistent4': 'Constancia 4 semanas', 'achievements.consistent4Desc': 'Entrena al menos {g}× por semana durante 4 semanas seguidas',
    'achievements.consistent8': 'Constancia 8 semanas', 'achievements.consistent8Desc': 'Entrena al menos {g}× por semana durante 8 semanas seguidas',
    'achievements.consistent12': 'Constancia 12 semanas', 'achievements.consistent12Desc': 'Entrena al menos {g}× por semana durante 12 semanas seguidas',
    'achievements.xp200': '200 XP', 'achievements.xp200Desc': 'Gana 200 XP',
    'achievements.newpr': 'Nuevo récord personal', 'achievements.newprDesc': 'Establece un nuevo peso máximo personal',
    'achievements.solid2': 'Semana constante', 'achievements.solid2Desc': 'Completa al menos 3 entrenamientos en 2 semanas naturales distintas',
    'achievements.solid4': 'Impulso mensual', 'achievements.solid4Desc': 'Completa al menos 3 entrenamientos en 4 semanas naturales distintas',
    'achievements.fullweek': 'Semana completa', 'achievements.fullweekDesc': 'Completa 5 entrenamientos en una sola semana natural',
    'achievements.pr5': 'Rompe récords', 'achievements.pr5Desc': 'Consigue 5 récords personales',
    'achievements.pr10': 'Cazador de récords', 'achievements.pr10Desc': 'Consigue 10 récords personales',
    'achievements.improve': 'Más fuerte cada día', 'achievements.improveDesc': 'Supera tu peso registrado anterior para el mismo ejercicio',
    'achievements.customplan': 'Creador de planes', 'achievements.customplanDesc': 'Crea tu primer plan de entrenamiento personalizado',
    'achievements.fourplans': 'Arquitecto del entrenamiento', 'achievements.fourplansDesc': 'Crea 4 planes de entrenamiento activos',
    'achievements.customex5': 'Coleccionista de ejercicios', 'achievements.customex5Desc': 'Añade 5 ejercicios personalizados a tus planes',
    'achievements.variety4': 'Atleta versátil', 'achievements.variety4Desc': 'Completa entrenamientos de 4 planes distintos',
    'achievements.comeback': 'Vuelta más fuerte', 'achievements.comebackDesc': 'Completa un entrenamiento tras al menos 14 días sin ninguno',
    'achievements.missedweek': 'Nunca te rindas', 'achievements.missedweekDesc': 'Completa un entrenamiento tras perder una semana natural completa',
    'motivacia.xpReward': '+{xp} XP',
    'motivacia.newAchXp': '+{xp} XP por logros',
    'motivacia.newAchievement': 'Nuevo logro: {names}',

    /* --- Cuerpo, calorías, comida y consejos --- */
    'units.kg': 'kg', 'units.lb': 'lb', 'units.cm': 'cm', 'units.in': 'in', 'units.g': 'g', 'units.kcal': 'kcal',

    'pokrok.subProgress': 'Progreso', 'pokrok.subBody': 'Cuerpo', 'pokrok.subFood': 'Comida',

    'body.summaryTitle': 'Últimas medidas',
    'body.unitsAria': 'Unidades de medida',
    'body.unitsNote': 'Las unidades solo cambian lo que ves. Los valores guardados nunca se reescriben.',
    'body.add': '+ Añadir medida',
    'body.addTitle': 'Añadir medida',
    'body.editTitle': 'Editar medida',
    'body.deleteTitle': 'Eliminar medida',
    'body.deleteConfirm': '¿Eliminar la medida del {date}? Esto no se puede deshacer.',
    'body.dateLabel': 'Fecha',
    'body.noteLabel': 'Nota (opcional)',
    'body.fieldsHint': 'Deja vacío lo que no te hayas medido.',
    'body.empty': 'Todavía no hay medidas.',
    'body.noValues': 'Sin valores registrados',
    'body.errDate': 'Elige una fecha válida.',
    'body.errRange': 'Revisa estos valores: {fields}.',
    'body.errEmpty': 'Rellena al menos un valor o escribe una nota.',
    'body.chartTitle': 'Evolución',
    'body.metricAria': 'Qué medida mostrar',
    'body.chartRange': 'Más bajo {min} · más alto {max} {unit}',
    'body.chartNeedTwo': 'Añade otra entrada para ver una tendencia.',
    'body.chartAria': 'Gráfico de evolución, mínimo {min}, máximo {max}',
    'body.historyTitle': 'Historial de medidas',
    'body.storageNotice': 'Tus datos guardados se están haciendo grandes y pronto pueden superar lo que este navegador puede mantener. Exporta una copia y valora borrar entradas antiguas que ya no necesites. GymQuest nunca borra nada por ti.',
    'body.f.weight': 'Peso corporal',
    'body.f.waist': 'Cintura',
    'body.f.chest': 'Pecho',
    'body.f.armLeft': 'Brazo izquierdo',
    'body.f.armRight': 'Brazo derecho',
    'body.f.thighLeft': 'Muslo izquierdo',
    'body.f.thighRight': 'Muslo derecho',
    'body.f.hip': 'Cadera',

    'calorie.title': 'Estimación de energía diaria',
    'calorie.offHint': 'Opcional y oculta por defecto. GymQuest no estima nada hasta que tú lo actives.',
    'calorie.enable': 'Mostrar la estimación',
    'calorie.disable': 'Ocultar la estimación',
    'calorie.intro': 'Una estimación, no una receta. Esto no es consejo médico.',
    'calorie.adultQuestion': '¿Tienes 18 años o más?',
    'calorie.adultYes': 'Tengo 18 o más',
    'calorie.adultNo': 'Tengo menos de 18',
    'calorie.underage': 'GymQuest no muestra objetivos calóricos de adultos a menores de 18 años. Un cuerpo que aún está creciendo tiene necesidades distintas y una estimación pensada para adultos sería engañosa aquí. Si quieres saber más sobre alimentación y energía a tu edad, habla con un médico, un dietista o tu madre, padre o tutor.',
    'calorie.inHeight': 'Altura',
    'calorie.inAge': 'Edad',
    'calorie.years': 'años',
    'calorie.inSex': 'Sexo que usa la fórmula',
    'calorie.sexPick': 'Sin especificar',
    'calorie.sexMale': 'Hombre',
    'calorie.sexFemale': 'Mujer',
    'calorie.inActivity': 'Nivel de actividad',
    'calorie.activityPick': 'Sin especificar',
    'calorie.actSedentary': 'Casi siempre sentado',
    'calorie.actLight': 'Actividad ligera 1–3 días por semana',
    'calorie.actModerate': 'Actividad moderada 3–5 días por semana',
    'calorie.actActive': 'Actividad intensa 6–7 días por semana',
    'calorie.actVery': 'Actividad muy intensa o trabajo físico',
    'calorie.inWeight': 'Peso corporal (de tu registro)',
    'calorie.weightFromLog': 'Se usa tu último peso registrado, del {date}.',
    'calorie.weightMissing': 'Registra antes tu peso corporal. GymQuest no lo va a adivinar.',
    'calorie.saveInputs': 'Guardar datos',
    'calorie.errAge': 'La edad debe estar entre 1 y 120.',
    'calorie.errHeight': 'La altura parece fuera de rango. Revisa el valor y la unidad.',
    'calorie.needInputs': 'Todavía faltan datos',
    'calorie.missing': 'Falta: {list}',
    'calorie.range': '{low}–{high} {unit} al día',
    'calorie.bmrLine': 'Sale de una tasa en reposo estimada de unos {bmr} {unit} al día.',
    'calorie.limit1': 'Es una media de población. Tus necesidades reales pueden ser muy distintas.',
    'calorie.limit2': 'No ve la composición corporal, enfermedades, medicación, embarazo ni cómo entrenas de verdad.',
    'calorie.limit3': 'No es un objetivo que haya que clavar, ni un plan de comidas.',
    'calorie.limit4': 'GymQuest no ofrece a propósito objetivos calóricos para perder o ganar peso.',
    'calorie.limit5': 'Para cualquier tema médico o un plan hecho para ti, habla con un profesional cualificado.',
    'calorie.formula': 'Fórmula: Mifflin-St Jeor (Mifflin MD et al., Am J Clin Nutr, 1990) para el gasto en reposo, multiplicada por un factor de actividad. El resultado se muestra como un rango de ±10 %.',
    'calorie.updated': 'Último cálculo: {when}',

    'food.offHint': 'El diario de comidas es opcional y está apagado por defecto. GymQuest no tiene base de datos de alimentos: lo apuntas todo tú.',
    'food.enable': 'Activar el diario de comidas',
    'food.disable': 'Desactivar el diario de comidas',
    'food.addEntry': '+ Añadir comida',
    'food.addTitle': 'Añadir comida',
    'food.editEntryTitle': 'Editar entrada',
    'food.newTemplateTitle': 'Nuevo alimento guardado',
    'food.editTemplateTitle': 'Editar alimento guardado',
    'food.pickSaved': 'Alimento guardado',
    'food.pickNone': 'Ninguno: escribo los valores a mano',
    'food.qtyLabel': 'Cantidad (multiplicador)',
    'food.saveAsTemplate': 'Guardar también como alimento',
    'food.nameLabel': 'Nombre',
    'food.kcalLabel': 'Energía',
    'food.protein': 'Proteínas',
    'food.carbs': 'Carbohidratos',
    'food.fat': 'Grasas',
    'food.macroLine': 'P {p} g · C {c} g · G {f} g',
    'food.totalsLine': '{total} · {entries}',
    'food.entries': '{n} entradas',
    'food.entriesOne': '{n} entrada',
    'food.entriesOther': '{n} entradas',
    'food.emptyDay': 'No hay nada apuntado este día.',
    'food.noSaved': 'Todavía no hay alimentos guardados.',
    'food.savedTitle': 'Alimentos guardados',
    'food.newTemplate': '+ Nuevo alimento',
    'food.editTemplate': 'Editar alimento guardado',
    'food.deleteTemplate': 'Eliminar alimento guardado',
    'food.deleteTemplateConfirm': '¿Eliminar «{name}» de tus alimentos guardados? Las entradas ya registradas conservan sus propios valores.',
    'food.editEntry': 'Editar entrada',
    'food.deleteEntry': 'Eliminar entrada',
    'food.deleteEntryConfirm': '¿Eliminar «{name}» de este día?',
    'food.errName': 'Ponle un nombre al alimento.',
    'food.errNumber': 'Los valores deben ser números entre 0 y 100000.',
    'food.errQty': 'La cantidad debe ser mayor que 0 y como máximo 1000.',
    'food.disclaimer': 'Estos valores los has puesto tú. GymQuest no verifica datos nutricionales y no tiene base de datos de alimentos.',
    'food.prevDay': 'Día anterior',
    'food.nextDay': 'Día siguiente',

    'tips.title': 'Cómo leer estos datos',
    'tips.t1Title': 'Medir el peso siempre igual',
    'tips.t1Body': 'La misma báscula, la misma hora del día, condiciones parecidas: mucha gente se pesa por la mañana antes de comer. La constancia importa mucho más que una sola cifra.',
    'tips.t2Title': 'Los cambios de un día no son una tendencia',
    'tips.t2Body': 'El peso se mueve con el agua, la comida en el intestino y la sal, así que puede variar dentro del mismo día. Compara medias semanales, o el mismo día de varias semanas, para ver algo más parecido a una dirección real.',
    'tips.t3Title': 'Duración, series, repeticiones y sobrecarga progresiva',
    'tips.t3Body': 'La duración es lo que duró la sesión. Una serie es un grupo de repeticiones. Las repeticiones son las veces que moviste el peso. La sobrecarga progresiva significa hacer poco a poco un poco más: más peso, más repeticiones o mejor técnica.',
    'tips.t4Title': 'Qué te dice y qué no la estimación de calorías',
    'tips.t4Body': 'Estima la energía que podría gastar al día una persona media con tus medidas. No puede medir tu metabolismo y no dice nada sobre la calidad de la comida ni sobre la salud.',
    'tips.t5Title': 'Qué significan tus propios números',
    'tips.t5Body': 'Son tus notas, no mediciones de laboratorio. Las porciones son estimaciones, las etiquetas varían y la misma comida puede cambiar de un día a otro. Sirve para ver patrones, no para llevar una contabilidad exacta.',
    'tips.foodTitle': 'Sobre los valores que escribes',
    'tips.f1Title': 'Tu entrada, tus números',
    'tips.f1Body': 'Aquí no se consulta ni se comprueba nada. Lo que escribes es lo que ves, así que los totales valen lo que valgan tus estimaciones.',
    'tips.f2Title': 'Los patrones importan más que la precisión',
    'tips.f2Body': 'Un registro aproximado pero constante durante semanas dice más que un solo día pesado con precisión. La comida no es algo que haya que ganarse ni compensar con entrenamiento.',
  },
  'pt-BR': {
    'tab.dnes': 'Hoje', 'tab.trening': 'Treino', 'tab.pokrok': 'Progresso', 'tab.motivacia': 'Motivação', 'tab.kalendar': 'Calendário',
    'kalendar.prevMonth': 'Mês anterior',
    'kalendar.nextMonth': 'Próximo mês',
    'kalendar.goToday': 'Hoje',
    'kalendar.legendTitle': 'Legenda',
    'kalendar.legendWorkout': 'Verde — Treino concluído',
    'kalendar.legendMissed': 'Vermelho — Nenhum treino registrado',
    'kalendar.legendToday': 'Contorno laranja — Hoje',
    'kalendar.statusWorkout': 'Treino concluído',
    'kalendar.statusNone': 'Nenhum treino registrado',
    'kalendar.statusTodayNone': 'Hoje — ainda sem treino registrado',
    'kalendar.statusFuture': 'Esta data está no futuro.',
    'kalendar.emptyPast': 'Nenhum treino foi registrado neste dia.',
    'kalendar.achievements': 'Conquistas desbloqueadas',
    'kalendar.ariaDay': '{date} — {status}',
    'kalendar.ariaWorkoutCountOne': '{n} treino neste dia',
    'kalendar.ariaWorkoutCountFew': '{n} treinos neste dia',
    'kalendar.ariaWorkoutCountOther': '{n} treinos neste dia',
    'plan.push': 'Empurrar', 'plan.pull': 'Puxar', 'plan.legs': 'Pernas',
    'plan.newName': 'Novo plano de treino',
    'planChoice.title': 'Criar plano de treino',
    'planChoice.blank': 'Plano de treino vazio',
    'planChoice.blankDesc': 'Crie um plano personalizado vazio e adicione os exercícios manualmente.',
    'planChoice.fullBody': 'Construtor Corpo inteiro',
    'planChoice.fullBodyDesc': 'Monte um treino de corpo inteiro escolhendo exercícios dos seus planos existentes.',
    'fb.title': 'Construtor Corpo inteiro',
    'fb.subtitle': 'Escolha exercícios dos seus planos de treino existentes.',
    'fb.nameLabel': 'Nome do plano',
    'fb.defaultName': 'Corpo inteiro',
    'fb.selected': 'Exercícios selecionados: {n}',
    'fb.selectedOne': 'Exercícios selecionados: {n}',
    'fb.selectedFew': 'Exercícios selecionados: {n}',
    'fb.selectedOther': 'Exercícios selecionados: {n}',
    'fb.selectAll': 'Selecionar tudo',
    'fb.clear': 'Limpar',
    'fb.create': 'Criar treino de corpo inteiro',
    'fb.needOne': 'Selecione pelo menos um exercício.',
    'fb.noExercises': 'Nenhum exercício disponível neste plano de treino.',
    'fb.duplicates': 'Exercícios duplicados são adicionados apenas uma vez.',
    'fb.bodyweight': 'Peso corporal',
    'picker.title': 'Adicionar exercícios de planos existentes',
    'picker.subtitle': 'Marque os exercícios que você quer adicionar a este plano.',
    'picker.apply': 'Adicionar ao plano',
    'unilateral.trainBoth': 'Treinar cada lado separadamente',
    'unilateral.startLeft': 'Começar pelo esquerdo',
    'unilateral.startRight': 'Começar pelo direito',
    'unilateral.left': 'Esquerdo',
    'unilateral.right': 'Direito',
    'unilateral.setsPerSideOne': '{n} série por lado',
    'unilateral.setsPerSideFew': '{n} séries por lado',
    'unilateral.setsPerSideOther': '{n} séries por lado',
    'unilateral.setSide': 'Série {n} — {side}',
    'unilateral.completed': 'Concluído: {sides}',
    'unilateral.bothSides': 'Esquerdo e direito',
    'unilateral.leftOnly': 'Somente esquerdo',
    'unilateral.rightOnly': 'Somente direito',
    'unilateral.noneSides': 'Nenhum',
    'unilateral.failureList': 'Falha: {list}',
    'exercise.bench-press': 'Supino reto', 'exercise.overhead-press': 'Desenvolvimento militar', 'exercise.dips': 'Paralelas', 'exercise.lateral-raises': 'Elevação lateral',
    'exercise.pull-ups': 'Barra fixa', 'exercise.bent-over-rows': 'Remada curvada', 'exercise.cable-rows': 'Remada na polia', 'exercise.bicep-curls': 'Rosca direta',
    'exercise.squats': 'Agachamento', 'exercise.leg-press': 'Leg press', 'exercise.lunges': 'Avanço', 'exercise.leg-curls': 'Mesa flexora', 'exercise.calf-raises': 'Elevação de panturrilha',
    'header.level': 'Nv.',
    'header.settingsTitle': 'Configurações',
    'header.levelTitle': 'Nível',
    'settings.language': 'Idioma',
    'settings.changeLanguage': 'Alterar idioma',
    'settings.languageCurrent': 'Idioma atual: {name}',
    'langPicker.title': 'Idioma',
    'langPicker.select': '{name} — escolher este idioma',
    'langPicker.selected': '{name} — selecionado no momento',
    'settings.autoBackup': 'Backup automático',
    'settings.autoBackupHint': 'Quando houver suporte, o GymQuest tenta criar um backup JSON enquanto o aplicativo está aberto. O iPhone pode pedir que você confirme ou salve o arquivo.',
    'settings.autoBackupLast': 'Último backup externo oferecido: {when}',
    'settings.importOlder': 'Este backup tem menos treinos do que os seus dados atuais ({old} → {new}).',
    'backup.never': 'nunca',
    'backup.dueTitle': 'Backup pendente',
    'backup.dueBody': 'Salve uma cópia JSON fora do GymQuest para poder restaurar seus treinos e seu histórico.',
    'backup.sentTitle': 'Arquivo de backup criado',
    'backup.sentBody': 'Um arquivo de backup foi entregue ao navegador.',
    'backup.saveNow': 'Salvar backup agora',
    'backup.saveAgain': 'Salvar novamente',
    'backup.dismiss': 'Dispensar o lembrete de backup',
    'backup.noConfirm': 'O GymQuest não pode confirmar que o arquivo foi realmente salvo — verifique o app Arquivos ou a pasta Downloads.',
    'backup.shareHint': 'Se a folha de compartilhamento apareceu, escolha “Salvar em Arquivos” (iCloud Drive ou No meu iPhone). O GymQuest não pode confirmar que foi salvo.',
    'backup.fileName': 'Arquivo: {name}',
    'dnes.weekTitle': 'Treinos nesta semana',
    'dnes.weekDone': '{n} de {g}',
    'dnes.weekDoneShort': '{n} de {g}',
    'dnes.weekGoalMet': 'Meta semanal alcançada!',
    'dnes.weekRemaining': 'Ainda faltam {n}.',
    'dnes.weekRemainingOne': 'Ainda falta {n} treino.',
    'dnes.weekRemainingFew': 'Ainda faltam {n} treinos.',
    'dnes.weekRemainingOther': 'Ainda faltam {n} treinos.',
    'dnes.streakTitle': '🔥 Constância',
    'dnes.streakNone': 'Sem sequência',
    'dnes.streakWeek': '🔥 {n} semanas seguidas',
    'dnes.streakWeekOne': '🔥 {n} semana seguida',
    'dnes.streakWeekFew': '🔥 {n} semanas seguidas',
    'dnes.streakWeekOther': '🔥 {n} semanas seguidas',
    'dnes.streakStart': 'Complete pelo menos {g} treinos nesta semana para começar uma sequência.',
    'dnes.streakStartOne': 'Complete pelo menos {g} treino nesta semana para começar uma sequência.',
    'dnes.streakStartFew': 'Complete pelo menos {g} treinos nesta semana para começar uma sequência.',
    'dnes.streakStartOther': 'Complete pelo menos {g} treinos nesta semana para começar uma sequência.',
    'dnes.streakContinue': 'Complete {g} treinos nesta semana para continuar sua sequência.',
    'dnes.streakContinueOne': 'Complete {g} treino nesta semana para continuar sua sequência.',
    'dnes.streakContinueFew': 'Complete {g} treinos nesta semana para continuar sua sequência.',
    'dnes.streakContinueOther': 'Complete {g} treinos nesta semana para continuar sua sequência.',
    'dnes.streakGoing': 'Meta semanal concluída. Sua sequência continua!',
    'dnes.streakEnded': 'Sua sequência terminou. Comece uma nova cumprindo sua meta semanal.',
    'dnes.excuse': 'Escola / doença',
    'dnes.excuseActive': 'Escola / doença ✓ (ativo)',
    'dnes.excuseNote': 'Esta semana está justificada — a sequência é mantida.',
    'dnes.start': 'Começar treino',
    'dnes.nextPlan': 'Recomendado: {plan}',
    'dnes.weekOf': 'Semana {n}',
    'trening.finish': 'Finalizar treino',
    'trening.finishTitle': 'Finalizar treino?',
    'trening.doneTitle': '🏆 Treino concluído!',
    'trening.confirmText': '{plan} · {done} de {total} séries<br>Você ganha <b style="color:#a3e635">+{xp} XP</b>',
    'trening.noteLabel': 'Observação (opcional)',
    'trening.super': 'Muito bom!',
    'trening.undo': 'Desfazer este treino',
    'trening.undoConfirmTitle': 'Desfazer treino?',
    'trening.undoConfirm': 'Este treino e seus {xp} XP serão removidos.',
    'trening.setsDone': 'Séries feitas: <b>{done} de {total}</b> · {msg}',
    'trening.setsHint': 'Marque as séries como feitas.',
    'trening.firstTime': 'Primeira vez',
    'trening.compareUp': '▲ {w} kg · +{r} reps vs. última vez',
    'trening.compareDown': '▼ {w} kg · {r} reps vs. última vez',
    'trening.compareSame': 'Igual à última vez ({w} kg)',
    'trening.compareWeightUp': '▲ {w} kg vs. última vez',
    'trening.compareWeightDown': '▼ {w} kg vs. última vez',
    'trening.compareRepsUp': '+{r} reps vs. última vez',
    'trening.compareRepsDown': '{r} reps vs. última vez',
    'trening.edit': 'Editar plano',
    'trening.editTitle': 'Editar plano',
    'trening.planLabel': 'Plano de treino',
    'trening.editPlanButton': '✏️ Editar plano',
    'trening.planNameLabel': 'Nome do plano',
    'trening.planNamePlaceholder': 'ex.: Parte superior',
    'trening.planNameInvalid': 'Digite um nome de plano (máx. 40 caracteres).',
    'trening.addPlan': '+ Adicionar plano de treino',
    'trening.managePlans': 'Gerenciar planos',
    'trening.managePlansDone': 'Pronto',
    'trening.manageHint': 'Arraste um plano para mudar a ordem, ou toque em ✏️ para editá-lo.',
    'trening.movePlanLeft': 'Mover para a esquerda',
    'trening.movePlanRight': 'Mover para a direita',
    'trening.dragPlan': 'Mover plano de treino',
    'trening.dragExercise': 'Mover exercício',
    'trening.moveUp': 'Mover para cima',
    'trening.moveDown': 'Mover para baixo',
    'trening.addFromPlans': 'Adicionar exercícios de planos existentes',
    'trening.setDoneAria': 'Marcar a série {n} como feita',
    'trening.deletePlan': 'Excluir plano',
    'trening.deletePlanTitle': 'Excluir plano?',
    'trening.deletePlanConfirm': 'O plano “{name}” será removido e não aparecerá mais na rotação. O histórico de treinos será mantido.',
    'trening.deletePlanLast': 'Pelo menos um plano deve permanecer.',
    'trening.addExercise': '+ Adicionar exercício',
    'trening.exercisePlaceholder': 'Exercício',
    'trening.editSave': 'Salvar',
    'trening.editCancel': 'Cancelar',
    'trening.lastExerciseBlock': 'Um plano precisa de pelo menos um exercício. Adicione um novo.',
    'trening.deleteExerciseTitle': 'Excluir exercício?',
    'trening.deleteExercise': 'O exercício “{name}” será removido do plano.',
    'trening.editInvalid': 'Preencha o nome do exercício e os números (séries 1–99, reps 1–99, peso 0–999).',
    'trening.resetSession': 'Reiniciar treino',
    'trening.resetSessionTitle': 'Reiniciar treino?',
    'trening.resetSessionConfirm': 'As séries marcadas deste treino serão apagadas. O histórico continua intacto.',
    'trening.timerLabel': 'Descanso',
    'trening.timerDone': 'O descanso acabou.',
    'trening.timerComplete': 'Descanso concluído',
    'trening.timerStop': 'Parar cronômetro',
    'trening.timerStart': 'Começar descanso',
    'trening.timerSection': 'Cronômetro de descanso',
    'trening.timerCustom': 'Personalizado',
    'trening.customTitle': 'Tempo de descanso personalizado',
    'trening.customMinutes': 'Minutos',
    'trening.customSeconds': 'Segundos',
    'trening.customStart': 'Iniciar cronômetro de descanso',
    'trening.customStartAlt': 'Iniciar cronômetro personalizado',
    'trening.customInvalid': 'Digite um tempo de descanso válido.',
    'trening.customZero': 'O tempo de descanso deve ser maior que zero.',
    'failure.plannedLabel': 'Séries até a falha',
    'failure.none': 'Nenhuma',
    'failure.failure': 'Falha',
    'failure.planned': 'Falha planejada',
    'failure.noSets': 'Sem séries até a falha',
    'failure.sets': 'Séries até a falha: {sets}',
    'failure.markSet': 'Marcar série como falha',
    'failure.removeMarker': 'Remover marcação de falha',
    'trening.failureHint': '🔥 Falha — marque uma série apenas se você realmente chegou à falha.',
    'trening.failureHintEdit': 'Opcional: escolha as séries que você planeja levar até a falha. Você pode mudar o resultado real durante o treino.',
    'trening.durationLabel': 'Duração do treino',
    'trening.sessionRestored': 'Treino ativo restaurado',
    'trening.planSaved': 'As mudanças do plano foram salvas. O progresso do seu treino atual foi preservado.',
    'trening.durationResult': 'Duração do treino: {duration}',
    'history.duration': 'Duração: {duration}',
    'duration.secOne': '{n} segundo', 'duration.secFew': '{n} segundos', 'duration.secOther': '{n} segundos',
    'duration.minOne': '{n} minuto', 'duration.minFew': '{n} minutos', 'duration.minOther': '{n} minutos',
    'duration.hourUnitOne': '{n} hora', 'duration.hourUnitFew': '{n} horas', 'duration.hourUnitOther': '{n} horas',
    'duration.minUnitOne': '{n} minuto', 'duration.minUnitFew': '{n} minutos', 'duration.minUnitOther': '{n} minutos',
    'duration.hourMin': '{h} {m}',
    'pokrok.thisWeek': 'Esta semana', 'pokrok.thisMonth': 'Este mês', 'pokrok.total': 'Total',
    'pokrok.recordsTitle': '🏆 Recordes pessoais',
    'pokrok.recordsEmpty': 'Ainda não há recordes.',
    'pokrok.nextMilestone': 'Próxima marca: {kg} kg',
    'pokrok.historyTitle': '📋 Histórico de treinos',
    'pokrok.historyEmpty': 'Ainda não há treinos.',
    'pokrok.workoutName': '{plan}',
    'pokrok.workoutFallback': 'Treino',
    'pokrok.setsCountOne': '{n} série', 'pokrok.setsCountFew': '{n} séries', 'pokrok.setsCountOther': '{n} séries',
    'history.editTitle': 'Editar treino',
    'history.deleteTitle': 'Excluir treino?',
    'history.deleteConfirm': 'Este treino e seus {xp} XP serão removidos.',
    'history.workoutSummary': '{name} {sets}×{reps} · {w} kg',
    'history.date': 'Data',
    'history.setsLabel': 'Séries', 'history.repsLabel': 'Reps', 'history.setsDoneLabel': 'Feitas',
    'motivacia.levelTitle': 'Nível',
    'motivacia.levelSub': 'Você tem {xp} XP no total. Faltam {left} XP para o próximo nível.',
    'motivacia.achTitle': '🎖️ Conquistas',
    'motivacia.unlocked': 'Desbloqueado {date}',
    'motivacia.ach.5kg': '{name} · {kg} kg',
    'setup.title': 'Configuração do treino',
    'setup.question': 'Quantos treinos por semana você quer completar?',
    'setup.explain': 'Sua meta semanal define o progresso, a sequência e as recompensas semanais.',
    'setup.continue': 'Continuar',
    'settings.title': 'Configurações',
    'settings.goalLabel': 'Meta semanal de treinos',
    'settings.goalHint': 'Escolha entre 1 e 7 treinos por semana.',
    'settings.goalInvalid': 'Digite um número inteiro de {min} a {max}.',
    'settings.save': 'Salvar meta',
    'settings.restSound': 'Som do cronômetro de descanso',
    'settings.restSoundHint': 'Tocar um gongo curto quando o cronômetro de descanso chegar a zero.',
    'settings.testSound': 'Testar som',
    'settings.testSoundDisabledHint': 'Ative o som do cronômetro de descanso para testá-lo.',
    'settings.testSoundFailed': 'Não foi possível tocar o som. Verifique as configurações de som do dispositivo.',
    'settings.on': 'Ligado',
    'settings.off': 'Desligado',
    'settings.restSoundLength': 'Duração do som do descanso',
    'settings.lenShort': 'Curto',
    'settings.lenStandard': 'Padrão',
    'settings.lenLong': 'Longo',
    'settings.export': 'Exportar dados',
    'settings.import': 'Importar dados',
    'settings.reset': 'Redefinir dados',
    'settings.loadDemo': 'Carregar dados de exemplo',
    'settings.removeDemo': 'Remover dados de exemplo',
    'settings.demoConfirm': 'Isto substituirá o histórico atual por dados de exemplo.',
    'settings.demoRemoveConfirm': 'Isto removerá os dados de exemplo e você começará do zero.',
    'settings.demoNone': 'Não há dados de exemplo.',
    'units.kg': 'kg', 'units.xp': 'XP', 'units.sets': 'séries', 'units.reps': 'reps',
    'settings.importTitle': 'Importar dados?',
    'settings.importConfirm': 'Isto substituirá todos os dados atuais ({n} treinos).',
    'settings.importError': 'Arquivo de backup inválido.',
    'settings.resetTitle': 'Redefinir todos os dados?',
    'settings.resetConfirm': 'Todos os treinos, recordes e configurações serão excluídos. Isto não pode ser desfeito.',
    'settings.resetFinal': 'Realmente apagar tudo?',
    'settings.resetFinalConfirm': 'Isto apagará todos os dados permanentemente.',
    'settings.resetConfirmAction': 'Redefinir todos os dados',
    'settings.resetFinalAction': 'Apagar de verdade',
    'common.cancel': 'Cancelar', 'common.close': 'Fechar', 'common.save': 'Salvar', 'common.ok': 'OK', 'common.delete': 'Excluir',
    'update.available': 'Uma nova versão do GymQuest está disponível.',
    'update.now': 'Atualizar agora',
    'app.storageError': 'Este navegador recusou salvar seus dados — as mudanças serão perdidas ao recarregar. Permita o armazenamento do site (localStorage) e tente de novo. Se continuar falhando, exporte um backup enquanto os dados ainda estão na memória.',
    'common.confirm': 'Confirmação',
    'common.confirmTitle': 'Confirmação',
    'achievements.first': 'Primeiro treino', 'achievements.firstDesc': 'Complete seu primeiro treino',
    'achievements.five': '5 treinos', 'achievements.fiveDesc': 'Complete 5 treinos',
    'achievements.ten': '10 treinos', 'achievements.tenDesc': 'Complete 10 treinos',
    'achievements.twentyfive': '25 treinos', 'achievements.twentyfiveDesc': 'Complete 25 treinos',
    'achievements.fifty': '50 treinos', 'achievements.fiftyDesc': 'Complete 50 treinos',
    'achievements.hundred': '100 treinos', 'achievements.hundredDesc': 'Complete 100 treinos',
    'achievements.weeklygoal1': 'Primeira meta semanal', 'achievements.weeklygoal1Desc': 'Alcance sua meta semanal',
    'achievements.consistent2': 'Constância 2 semanas', 'achievements.consistent2Desc': 'Treine pelo menos {g}× por semana durante 2 semanas seguidas',
    'achievements.consistent4': 'Constância 4 semanas', 'achievements.consistent4Desc': 'Treine pelo menos {g}× por semana durante 4 semanas seguidas',
    'achievements.consistent8': 'Constância 8 semanas', 'achievements.consistent8Desc': 'Treine pelo menos {g}× por semana durante 8 semanas seguidas',
    'achievements.consistent12': 'Constância 12 semanas', 'achievements.consistent12Desc': 'Treine pelo menos {g}× por semana durante 12 semanas seguidas',
    'achievements.xp200': '200 XP', 'achievements.xp200Desc': 'Ganhe 200 XP',
    'achievements.newpr': 'Novo recorde pessoal', 'achievements.newprDesc': 'Estabeleça um novo peso máximo pessoal',
    'achievements.solid2': 'Semana constante', 'achievements.solid2Desc': 'Complete pelo menos 3 treinos em 2 semanas do calendário diferentes',
    'achievements.solid4': 'Impulso mensal', 'achievements.solid4Desc': 'Complete pelo menos 3 treinos em 4 semanas do calendário diferentes',
    'achievements.fullweek': 'Semana completa', 'achievements.fullweekDesc': 'Complete 5 treinos em uma única semana do calendário',
    'achievements.pr5': 'Quebrador de recordes', 'achievements.pr5Desc': 'Consiga 5 recordes pessoais',
    'achievements.pr10': 'Caçador de recordes', 'achievements.pr10Desc': 'Consiga 10 recordes pessoais',
    'achievements.improve': 'Mais forte a cada dia', 'achievements.improveDesc': 'Supere seu peso registrado anteriormente no mesmo exercício',
    'achievements.customplan': 'Criador de planos', 'achievements.customplanDesc': 'Crie seu primeiro plano de treino personalizado',
    'achievements.fourplans': 'Arquiteto do treino', 'achievements.fourplansDesc': 'Crie 4 planos de treino ativos',
    'achievements.customex5': 'Colecionador de exercícios', 'achievements.customex5Desc': 'Adicione 5 exercícios personalizados aos seus planos',
    'achievements.variety4': 'Atleta versátil', 'achievements.variety4Desc': 'Complete treinos de 4 planos diferentes',
    'achievements.comeback': 'Volta mais forte', 'achievements.comebackDesc': 'Complete um treino depois de pelo menos 14 dias sem nenhum',
    'achievements.missedweek': 'Nunca desista', 'achievements.missedweekDesc': 'Complete um treino depois de perder uma semana do calendário inteira',
    'motivacia.xpReward': '+{xp} XP',
    'motivacia.newAchXp': '+{xp} XP por conquistas',
    'motivacia.newAchievement': 'Nova conquista: {names}',

    /* --- Corpo, calorias, comida e dicas --- */
    'units.kg': 'kg', 'units.lb': 'lb', 'units.cm': 'cm', 'units.in': 'in', 'units.g': 'g', 'units.kcal': 'kcal',

    'pokrok.subProgress': 'Progresso', 'pokrok.subBody': 'Corpo', 'pokrok.subFood': 'Comida',

    'body.summaryTitle': 'Últimas medidas',
    'body.unitsAria': 'Unidades de medida',
    'body.unitsNote': 'As unidades mudam só a exibição. Os valores salvos nunca são reescritos.',
    'body.add': '+ Adicionar medida',
    'body.addTitle': 'Adicionar medida',
    'body.editTitle': 'Editar medida',
    'body.deleteTitle': 'Excluir medida',
    'body.deleteConfirm': 'Excluir a medida de {date}? Isso não pode ser desfeito.',
    'body.dateLabel': 'Data',
    'body.noteLabel': 'Observação (opcional)',
    'body.fieldsHint': 'Deixe vazio o que você não mediu.',
    'body.empty': 'Ainda não há medidas.',
    'body.noValues': 'Nenhum valor registrado',
    'body.errDate': 'Escolha uma data válida.',
    'body.errRange': 'Confira estes valores: {fields}.',
    'body.errEmpty': 'Preencha pelo menos um valor ou escreva uma observação.',
    'body.chartTitle': 'Evolução',
    'body.metricAria': 'Qual medida mostrar',
    'body.chartRange': 'Menor {min} · maior {max} {unit}',
    'body.chartNeedTwo': 'Adicione outro registro para ver uma tendência.',
    'body.chartAria': 'Gráfico de evolução, menor {min}, maior {max}',
    'body.historyTitle': 'Histórico de medidas',
    'body.storageNotice': 'Seus dados salvos estão ficando grandes e logo podem passar do que este navegador consegue manter. Exporte um backup e considere apagar registros antigos que você não precisa mais. O GymQuest nunca apaga nada por você.',
    'body.f.weight': 'Peso corporal',
    'body.f.waist': 'Cintura',
    'body.f.chest': 'Peito',
    'body.f.armLeft': 'Braço esquerdo',
    'body.f.armRight': 'Braço direito',
    'body.f.thighLeft': 'Coxa esquerda',
    'body.f.thighRight': 'Coxa direita',
    'body.f.hip': 'Quadril',

    'calorie.title': 'Estimativa de energia diária',
    'calorie.offHint': 'Opcional e oculta por padrão. O GymQuest não estima nada até você ativar.',
    'calorie.enable': 'Mostrar a estimativa',
    'calorie.disable': 'Ocultar a estimativa',
    'calorie.intro': 'Uma estimativa, não uma receita. Isso não é orientação médica.',
    'calorie.adultQuestion': 'Você tem 18 anos ou mais?',
    'calorie.adultYes': 'Tenho 18 ou mais',
    'calorie.adultNo': 'Tenho menos de 18',
    'calorie.underage': 'O GymQuest não mostra metas calóricas de adulto para quem tem menos de 18 anos. Um corpo que ainda está crescendo tem necessidades diferentes, e uma estimativa feita para adultos seria enganosa aqui. Se quiser saber mais sobre alimentação e energia na sua idade, converse com um médico, um nutricionista ou um responsável.',
    'calorie.inHeight': 'Altura',
    'calorie.inAge': 'Idade',
    'calorie.years': 'anos',
    'calorie.inSex': 'Sexo usado pela fórmula',
    'calorie.sexPick': 'Não informado',
    'calorie.sexMale': 'Masculino',
    'calorie.sexFemale': 'Feminino',
    'calorie.inActivity': 'Nível de atividade',
    'calorie.activityPick': 'Não informado',
    'calorie.actSedentary': 'Quase sempre sentado',
    'calorie.actLight': 'Atividade leve 1–3 dias por semana',
    'calorie.actModerate': 'Atividade moderada 3–5 dias por semana',
    'calorie.actActive': 'Atividade intensa 6–7 dias por semana',
    'calorie.actVery': 'Atividade muito intensa ou trabalho físico',
    'calorie.inWeight': 'Peso corporal (do seu registro)',
    'calorie.weightFromLog': 'Usando seu peso mais recente, registrado em {date}.',
    'calorie.weightMissing': 'Registre primeiro o seu peso corporal. O GymQuest não vai adivinhar.',
    'calorie.saveInputs': 'Salvar dados',
    'calorie.errAge': 'A idade deve estar entre 1 e 120.',
    'calorie.errHeight': 'A altura parece fora da faixa. Confira o valor e a unidade.',
    'calorie.needInputs': 'Ainda faltam dados',
    'calorie.missing': 'Falta: {list}',
    'calorie.range': '{low}–{high} {unit} por dia',
    'calorie.bmrLine': 'Isso vem de uma taxa de repouso estimada em cerca de {bmr} {unit} por dia.',
    'calorie.limit1': 'É uma média da população. Suas necessidades reais podem ser bem diferentes.',
    'calorie.limit2': 'Não enxerga composição corporal, condições de saúde, medicamentos, gravidez nem como você treina de verdade.',
    'calorie.limit3': 'Não é uma meta para acertar na vírgula, nem um plano alimentar.',
    'calorie.limit4': 'O GymQuest de propósito não oferece metas calóricas para perder ou ganhar peso.',
    'calorie.limit5': 'Para qualquer questão médica ou um plano feito para você, procure um profissional qualificado.',
    'calorie.formula': 'Fórmula: Mifflin-St Jeor (Mifflin MD et al., Am J Clin Nutr, 1990) para o gasto em repouso, multiplicada por um fator de atividade. O resultado aparece como uma faixa de ±10 %.',
    'calorie.updated': 'Último cálculo: {when}',

    'food.offHint': 'O diário de comida é opcional e vem desligado. O GymQuest não tem banco de dados de alimentos: você anota tudo.',
    'food.enable': 'Ligar o diário de comida',
    'food.disable': 'Desligar o diário de comida',
    'food.addEntry': '+ Adicionar comida',
    'food.addTitle': 'Adicionar comida',
    'food.editEntryTitle': 'Editar registro',
    'food.newTemplateTitle': 'Novo alimento salvo',
    'food.editTemplateTitle': 'Editar alimento salvo',
    'food.pickSaved': 'Alimento salvo',
    'food.pickNone': 'Nenhum – vou digitar os valores',
    'food.qtyLabel': 'Quantidade (multiplicador)',
    'food.saveAsTemplate': 'Salvar também como alimento',
    'food.nameLabel': 'Nome',
    'food.kcalLabel': 'Energia',
    'food.protein': 'Proteínas',
    'food.carbs': 'Carboidratos',
    'food.fat': 'Gorduras',
    'food.macroLine': 'P {p} g · C {c} g · G {f} g',
    'food.totalsLine': '{total} · {entries}',
    'food.entries': '{n} registros',
    'food.entriesOne': '{n} registro',
    'food.entriesOther': '{n} registros',
    'food.emptyDay': 'Nada anotado neste dia.',
    'food.noSaved': 'Ainda não há alimentos salvos.',
    'food.savedTitle': 'Alimentos salvos',
    'food.newTemplate': '+ Novo alimento',
    'food.editTemplate': 'Editar alimento salvo',
    'food.deleteTemplate': 'Excluir alimento salvo',
    'food.deleteTemplateConfirm': 'Excluir “{name}” dos seus alimentos salvos? Os registros já lançados mantêm os próprios valores.',
    'food.editEntry': 'Editar registro',
    'food.deleteEntry': 'Excluir registro',
    'food.deleteEntryConfirm': 'Excluir “{name}” deste dia?',
    'food.errName': 'Dê um nome ao alimento.',
    'food.errNumber': 'Os valores precisam ser números entre 0 e 100000.',
    'food.errQty': 'A quantidade precisa ser maior que 0 e no máximo 1000.',
    'food.disclaimer': 'Esses valores foram digitados por você. O GymQuest não verifica dados nutricionais e não tem banco de dados de alimentos.',
    'food.prevDay': 'Dia anterior',
    'food.nextDay': 'Próximo dia',

    'tips.title': 'Como ler esses números',
    'tips.t1Title': 'Medir o peso sempre do mesmo jeito',
    'tips.t1Body': 'A mesma balança, a mesma hora do dia, condições parecidas – muita gente se pesa de manhã antes de comer. A constância importa muito mais do que um número isolado.',
    'tips.t2Title': 'Variação de um dia não é tendência',
    'tips.t2Body': 'O peso muda com água, comida no intestino e sal, então pode oscilar no mesmo dia. Compare médias semanais, ou o mesmo dia ao longo de várias semanas, para ver algo mais próximo de uma direção real.',
    'tips.t3Title': 'Duração, séries, repetições e sobrecarga progressiva',
    'tips.t3Body': 'Duração é quanto tempo o treino levou. Uma série é um grupo de repetições. Repetições são quantas vezes você moveu a carga. Sobrecarga progressiva é fazer um pouco mais aos poucos – mais carga, mais repetições ou melhor execução.',
    'tips.t4Title': 'O que a estimativa de calorias diz e o que não diz',
    'tips.t4Body': 'Ela estima a energia que uma pessoa média com as suas medidas poderia gastar num dia. Não mede o seu metabolismo e não diz nada sobre a qualidade da comida ou sobre a saúde.',
    'tips.t5Title': 'O que significam os seus próprios números',
    'tips.t5Body': 'São as suas anotações, não medições de laboratório. As porções são estimativas, os rótulos variam e a mesma refeição pode mudar de um dia para o outro. Serve para enxergar padrões, não para contabilidade exata.',
    'tips.foodTitle': 'Sobre os valores que você digita',
    'tips.f1Title': 'Seu registro, seus números',
    'tips.f1Body': 'Nada aqui é consultado ou conferido. O que você digita é o que você vê, então os totais valem o que valem as suas estimativas.',
    'tips.f2Title': 'Padrões valem mais que precisão',
    'tips.f2Body': 'Um registro aproximado, mas constante ao longo das semanas, diz mais do que um único dia pesado com precisão. Comida não é algo para merecer nem para compensar com treino.',
  },
  fr: {
    'tab.dnes': 'Aujourd’hui', 'tab.trening': 'Entraînement', 'tab.pokrok': 'Progrès', 'tab.motivacia': 'Motivation', 'tab.kalendar': 'Calendrier',
    'kalendar.prevMonth': 'Mois précédent',
    'kalendar.nextMonth': 'Mois suivant',
    'kalendar.goToday': 'Aujourd’hui',
    'kalendar.legendTitle': 'Légende',
    'kalendar.legendWorkout': 'Vert — Entraînement terminé',
    'kalendar.legendMissed': 'Rouge — Aucun entraînement enregistré',
    'kalendar.legendToday': 'Contour orange — Aujourd’hui',
    'kalendar.statusWorkout': 'Entraînement terminé',
    'kalendar.statusNone': 'Aucun entraînement enregistré',
    'kalendar.statusTodayNone': 'Aujourd’hui — pas encore d’entraînement enregistré',
    'kalendar.statusFuture': 'Cette date est dans le futur.',
    'kalendar.emptyPast': 'Aucun entraînement n’a été enregistré ce jour-là.',
    'kalendar.achievements': 'Succès débloqués',
    'kalendar.ariaDay': '{date} — {status}',
    'kalendar.ariaWorkoutCountOne': '{n} entraînement ce jour-là',
    'kalendar.ariaWorkoutCountFew': '{n} entraînements ce jour-là',
    'kalendar.ariaWorkoutCountOther': '{n} entraînements ce jour-là',
    'plan.push': 'Poussée', 'plan.pull': 'Tirage', 'plan.legs': 'Jambes',
    'plan.newName': 'Nouveau plan d’entraînement',
    'planChoice.title': 'Créer un plan d’entraînement',
    'planChoice.blank': 'Plan d’entraînement vide',
    'planChoice.blankDesc': 'Crée un plan personnalisé vide et ajoute les exercices à la main.',
    'planChoice.fullBody': 'Générateur Corps entier',
    'planChoice.fullBodyDesc': 'Crée un entraînement complet en choisissant des exercices de tes plans existants.',
    'fb.title': 'Générateur Corps entier',
    'fb.subtitle': 'Choisis des exercices dans tes plans d’entraînement existants.',
    'fb.nameLabel': 'Nom du plan',
    'fb.defaultName': 'Corps entier',
    'fb.selected': 'Exercices sélectionnés : {n}',
    'fb.selectedOne': 'Exercices sélectionnés : {n}',
    'fb.selectedFew': 'Exercices sélectionnés : {n}',
    'fb.selectedOther': 'Exercices sélectionnés : {n}',
    'fb.selectAll': 'Tout sélectionner',
    'fb.clear': 'Effacer',
    'fb.create': 'Créer l’entraînement complet',
    'fb.needOne': 'Sélectionne au moins un exercice.',
    'fb.noExercises': 'Aucun exercice disponible dans ce plan.',
    'fb.duplicates': 'Les exercices en double ne sont ajoutés qu’une fois.',
    'fb.bodyweight': 'Poids du corps',
    'picker.title': 'Ajouter des exercices de plans existants',
    'picker.subtitle': 'Coche les exercices que tu veux ajouter à ce plan.',
    'picker.apply': 'Ajouter au plan',
    'unilateral.trainBoth': 'Travailler chaque côté séparément',
    'unilateral.startLeft': 'Commencer à gauche',
    'unilateral.startRight': 'Commencer à droite',
    'unilateral.left': 'Gauche',
    'unilateral.right': 'Droite',
    'unilateral.setsPerSideOne': '{n} série par côté',
    'unilateral.setsPerSideFew': '{n} séries par côté',
    'unilateral.setsPerSideOther': '{n} séries par côté',
    'unilateral.setSide': 'Série {n} — {side}',
    'unilateral.completed': 'Terminé : {sides}',
    'unilateral.bothSides': 'Gauche et droite',
    'unilateral.leftOnly': 'Gauche seulement',
    'unilateral.rightOnly': 'Droite seulement',
    'unilateral.noneSides': 'Aucun',
    'unilateral.failureList': 'Échec : {list}',
    'exercise.bench-press': 'Développé couché', 'exercise.overhead-press': 'Développé militaire', 'exercise.dips': 'Dips', 'exercise.lateral-raises': 'Élévations latérales',
    'exercise.pull-ups': 'Tractions', 'exercise.bent-over-rows': 'Rowing barre', 'exercise.cable-rows': 'Rowing à la poulie', 'exercise.bicep-curls': 'Curl biceps',
    'exercise.squats': 'Squats', 'exercise.leg-press': 'Presse à cuisses', 'exercise.lunges': 'Fentes', 'exercise.leg-curls': 'Leg curl', 'exercise.calf-raises': 'Mollets',
    'header.level': 'Niv.',
    'header.settingsTitle': 'Réglages',
    'header.levelTitle': 'Niveau',
    'settings.language': 'Langue',
    'settings.changeLanguage': 'Changer de langue',
    'settings.languageCurrent': 'Langue actuelle : {name}',
    'langPicker.title': 'Langue',
    'langPicker.select': '{name} — choisir cette langue',
    'langPicker.selected': '{name} — actuellement sélectionnée',
    'settings.autoBackup': 'Sauvegarde automatique',
    'settings.autoBackupHint': 'Lorsque c’est pris en charge, GymQuest tente de créer une sauvegarde JSON pendant que l’application est ouverte. L’iPhone peut te demander de confirmer ou d’enregistrer le fichier.',
    'settings.autoBackupLast': 'Dernière sauvegarde externe proposée : {when}',
    'settings.importOlder': 'Cette sauvegarde contient moins d’entraînements que tes données actuelles ({old} → {new}).',
    'backup.never': 'jamais',
    'backup.dueTitle': 'Sauvegarde à faire',
    'backup.dueBody': 'Enregistre une copie JSON en dehors de GymQuest pour pouvoir restaurer tes entraînements et ton historique.',
    'backup.sentTitle': 'Fichier de sauvegarde créé',
    'backup.sentBody': 'Un fichier de sauvegarde a été transmis au navigateur.',
    'backup.saveNow': 'Enregistrer la sauvegarde',
    'backup.saveAgain': 'Enregistrer à nouveau',
    'backup.dismiss': 'Masquer le rappel de sauvegarde',
    'backup.noConfirm': 'GymQuest ne peut pas confirmer que le fichier a réellement été enregistré — vérifie l’app Fichiers ou le dossier Téléchargements.',
    'backup.shareHint': 'Si la feuille de partage est apparue, choisis « Enregistrer dans Fichiers » (iCloud Drive ou Sur mon iPhone). GymQuest ne peut pas confirmer l’enregistrement.',
    'backup.fileName': 'Fichier : {name}',
    'dnes.weekTitle': 'Entraînements cette semaine',
    'dnes.weekDone': '{n} sur {g}',
    'dnes.weekDoneShort': '{n} sur {g}',
    'dnes.weekGoalMet': 'Objectif hebdomadaire atteint !',
    'dnes.weekRemaining': 'Encore {n} à faire.',
    'dnes.weekRemainingOne': 'Encore {n} entraînement à faire.',
    'dnes.weekRemainingFew': 'Encore {n} entraînements à faire.',
    'dnes.weekRemainingOther': 'Encore {n} entraînements à faire.',
    'dnes.streakTitle': '🔥 Régularité',
    'dnes.streakNone': 'Aucune série',
    'dnes.streakWeek': '🔥 {n} semaines d’affilée',
    'dnes.streakWeekOne': '🔥 {n} semaine d’affilée',
    'dnes.streakWeekFew': '🔥 {n} semaines d’affilée',
    'dnes.streakWeekOther': '🔥 {n} semaines d’affilée',
    'dnes.streakStart': 'Termine au moins {g} entraînements cette semaine pour commencer une série.',
    'dnes.streakStartOne': 'Termine au moins {g} entraînement cette semaine pour commencer une série.',
    'dnes.streakStartFew': 'Termine au moins {g} entraînements cette semaine pour commencer une série.',
    'dnes.streakStartOther': 'Termine au moins {g} entraînements cette semaine pour commencer une série.',
    'dnes.streakContinue': 'Termine {g} entraînements cette semaine pour continuer ta série.',
    'dnes.streakContinueOne': 'Termine {g} entraînement cette semaine pour continuer ta série.',
    'dnes.streakContinueFew': 'Termine {g} entraînements cette semaine pour continuer ta série.',
    'dnes.streakContinueOther': 'Termine {g} entraînements cette semaine pour continuer ta série.',
    'dnes.streakGoing': 'Objectif hebdomadaire atteint. Ta série continue !',
    'dnes.streakEnded': 'Ta série est terminée. Commences-en une nouvelle en atteignant ton objectif hebdomadaire.',
    'dnes.excuse': 'École / maladie',
    'dnes.excuseActive': 'École / maladie ✓ (actif)',
    'dnes.excuseNote': 'Cette semaine est excusée — la série est conservée.',
    'dnes.start': 'Commencer l’entraînement',
    'dnes.nextPlan': 'Recommandé : {plan}',
    'dnes.weekOf': 'Semaine {n}',
    'trening.finish': 'Terminer l’entraînement',
    'trening.finishTitle': 'Terminer l’entraînement ?',
    'trening.doneTitle': '🏆 Entraînement terminé !',
    'trening.confirmText': '{plan} · {done} sur {total} séries<br>Tu gagnes <b style="color:#a3e635">+{xp} XP</b>',
    'trening.noteLabel': 'Note (facultative)',
    'trening.super': 'Génial !',
    'trening.undo': 'Annuler cet entraînement',
    'trening.undoConfirmTitle': 'Annuler l’entraînement ?',
    'trening.undoConfirm': 'Cet entraînement et ses {xp} XP seront supprimés.',
    'trening.setsDone': 'Séries faites : <b>{done} sur {total}</b> · {msg}',
    'trening.setsHint': 'Coche les séries faites.',
    'trening.firstTime': 'Première fois',
    'trening.compareUp': '▲ {w} kg · +{r} reps vs la dernière fois',
    'trening.compareDown': '▼ {w} kg · {r} reps vs la dernière fois',
    'trening.compareSame': 'Identique à la dernière fois ({w} kg)',
    'trening.compareWeightUp': '▲ {w} kg vs la dernière fois',
    'trening.compareWeightDown': '▼ {w} kg vs la dernière fois',
    'trening.compareRepsUp': '+{r} reps vs la dernière fois',
    'trening.compareRepsDown': '{r} reps vs la dernière fois',
    'trening.edit': 'Modifier le plan',
    'trening.editTitle': 'Modifier le plan',
    'trening.planLabel': 'Plan d’entraînement',
    'trening.editPlanButton': '✏️ Modifier le plan',
    'trening.planNameLabel': 'Nom du plan',
    'trening.planNamePlaceholder': 'ex. Haut du corps',
    'trening.planNameInvalid': 'Saisis un nom de plan (40 caractères max.).',
    'trening.addPlan': '+ Ajouter un plan d’entraînement',
    'trening.managePlans': 'Gérer les plans',
    'trening.managePlansDone': 'Terminé',
    'trening.manageHint': 'Fais glisser un plan pour changer l’ordre, ou touche ✏️ pour le modifier.',
    'trening.movePlanLeft': 'Déplacer à gauche',
    'trening.movePlanRight': 'Déplacer à droite',
    'trening.dragPlan': 'Déplacer le plan d’entraînement',
    'trening.dragExercise': 'Déplacer l’exercice',
    'trening.moveUp': 'Monter',
    'trening.moveDown': 'Descendre',
    'trening.addFromPlans': 'Ajouter des exercices de plans existants',
    'trening.setDoneAria': 'Marquer la série {n} comme faite',
    'trening.deletePlan': 'Supprimer le plan',
    'trening.deletePlanTitle': 'Supprimer le plan ?',
    'trening.deletePlanConfirm': 'Le plan « {name} » sera supprimé et n’apparaîtra plus dans la rotation. L’historique des entraînements sera conservé.',
    'trening.deletePlanLast': 'Au moins un plan doit rester.',
    'trening.addExercise': '+ Ajouter un exercice',
    'trening.exercisePlaceholder': 'Exercice',
    'trening.editSave': 'Enregistrer',
    'trening.editCancel': 'Annuler',
    'trening.lastExerciseBlock': 'Un plan a besoin d’au moins un exercice. Ajoutes-en un.',
    'trening.deleteExerciseTitle': 'Supprimer l’exercice ?',
    'trening.deleteExercise': 'L’exercice « {name} » sera supprimé du plan.',
    'trening.editInvalid': 'Remplis le nom de l’exercice et les nombres (séries 1–99, reps 1–99, poids 0–999).',
    'trening.resetSession': 'Réinitialiser l’entraînement',
    'trening.resetSessionTitle': 'Réinitialiser l’entraînement ?',
    'trening.resetSessionConfirm': 'Les séries cochées de cet entraînement seront effacées. L’historique reste intact.',
    'trening.timerLabel': 'Repos',
    'trening.timerDone': 'Le repos est terminé.',
    'trening.timerComplete': 'Repos terminé',
    'trening.timerStop': 'Arrêter le minuteur',
    'trening.timerStart': 'Commencer le repos',
    'trening.timerSection': 'Minuteur de repos',
    'trening.timerCustom': 'Personnalisé',
    'trening.customTitle': 'Temps de repos personnalisé',
    'trening.customMinutes': 'Minutes',
    'trening.customSeconds': 'Secondes',
    'trening.customStart': 'Lancer le minuteur de repos',
    'trening.customStartAlt': 'Lancer le minuteur personnalisé',
    'trening.customInvalid': 'Saisis un temps de repos valide.',
    'trening.customZero': 'Le temps de repos doit être supérieur à zéro.',
    'failure.plannedLabel': 'Séries jusqu’à l’échec',
    'failure.none': 'Aucune',
    'failure.failure': 'Échec',
    'failure.planned': 'Échec prévu',
    'failure.noSets': 'Aucune série jusqu’à l’échec',
    'failure.sets': 'Séries jusqu’à l’échec : {sets}',
    'failure.markSet': 'Marquer la série comme échec',
    'failure.removeMarker': 'Retirer la marque d’échec',
    'trening.failureHint': '🔥 Échec — marque une série seulement si tu as vraiment atteint l’échec.',
    'trening.failureHintEdit': 'Facultatif : choisis les séries que tu prévois de pousser jusqu’à l’échec. Tu peux changer le résultat réel pendant l’entraînement.',
    'trening.durationLabel': 'Durée de l’entraînement',
    'trening.sessionRestored': 'Entraînement actif restauré',
    'trening.planSaved': 'Les modifications du plan sont enregistrées. La progression de ton entraînement en cours est conservée.',
    'trening.durationResult': 'Durée de l’entraînement : {duration}',
    'history.duration': 'Durée : {duration}',
    'duration.secOne': '{n} seconde', 'duration.secFew': '{n} secondes', 'duration.secOther': '{n} secondes',
    'duration.minOne': '{n} minute', 'duration.minFew': '{n} minutes', 'duration.minOther': '{n} minutes',
    'duration.hourUnitOne': '{n} heure', 'duration.hourUnitFew': '{n} heures', 'duration.hourUnitOther': '{n} heures',
    'duration.minUnitOne': '{n} minute', 'duration.minUnitFew': '{n} minutes', 'duration.minUnitOther': '{n} minutes',
    'duration.hourMin': '{h} {m}',
    'pokrok.thisWeek': 'Cette semaine', 'pokrok.thisMonth': 'Ce mois-ci', 'pokrok.total': 'Total',
    'pokrok.recordsTitle': '🏆 Records personnels',
    'pokrok.recordsEmpty': 'Pas encore de records.',
    'pokrok.nextMilestone': 'Prochain palier : {kg} kg',
    'pokrok.historyTitle': '📋 Historique des entraînements',
    'pokrok.historyEmpty': 'Pas encore d’entraînements.',
    'pokrok.workoutName': '{plan}',
    'pokrok.workoutFallback': 'Entraînement',
    'pokrok.setsCountOne': '{n} série', 'pokrok.setsCountFew': '{n} séries', 'pokrok.setsCountOther': '{n} séries',
    'history.editTitle': 'Modifier l’entraînement',
    'history.deleteTitle': 'Supprimer l’entraînement ?',
    'history.deleteConfirm': 'Cet entraînement et ses {xp} XP seront supprimés.',
    'history.workoutSummary': '{name} {sets}×{reps} · {w} kg',
    'history.date': 'Date',
    'history.setsLabel': 'Séries', 'history.repsLabel': 'Reps', 'history.setsDoneLabel': 'Faites',
    'motivacia.levelTitle': 'Niveau',
    'motivacia.levelSub': 'Tu as {xp} XP au total. Il te manque {left} XP pour le niveau suivant.',
    'motivacia.achTitle': '🎖️ Succès',
    'motivacia.unlocked': 'Débloqué le {date}',
    'motivacia.ach.5kg': '{name} · {kg} kg',
    'setup.title': 'Configuration de l’entraînement',
    'setup.question': 'Combien d’entraînements par semaine veux-tu faire ?',
    'setup.explain': 'Ton objectif hebdomadaire détermine la progression, la série et les récompenses hebdomadaires.',
    'setup.continue': 'Continuer',
    'settings.title': 'Réglages',
    'settings.goalLabel': 'Objectif hebdomadaire d’entraînements',
    'settings.goalHint': 'Choisis entre 1 et 7 entraînements par semaine.',
    'settings.goalInvalid': 'Saisis un nombre entier de {min} à {max}.',
    'settings.save': 'Enregistrer l’objectif',
    'settings.restSound': 'Son du minuteur de repos',
    'settings.restSoundHint': 'Jouer un court gong quand le minuteur de repos atteint zéro.',
    'settings.testSound': 'Tester le son',
    'settings.testSoundDisabledHint': 'Active le son du minuteur de repos pour le tester.',
    'settings.testSoundFailed': 'Le son n’a pas pu être joué. Vérifie les réglages sonores de l’appareil.',
    'settings.on': 'Activé',
    'settings.off': 'Désactivé',
    'settings.restSoundLength': 'Durée du son de repos',
    'settings.lenShort': 'Court',
    'settings.lenStandard': 'Standard',
    'settings.lenLong': 'Long',
    'settings.export': 'Exporter les données',
    'settings.import': 'Importer les données',
    'settings.reset': 'Réinitialiser les données',
    'settings.loadDemo': 'Charger des données de démo',
    'settings.removeDemo': 'Retirer les données de démo',
    'settings.demoConfirm': 'Cela remplacera l’historique actuel par des données de démo.',
    'settings.demoRemoveConfirm': 'Cela retirera les données de démo et tu repartiras de zéro.',
    'settings.demoNone': 'Pas de données de démo.',
    'units.kg': 'kg', 'units.xp': 'XP', 'units.sets': 'séries', 'units.reps': 'reps',
    'settings.importTitle': 'Importer les données ?',
    'settings.importConfirm': 'Cela remplacera toutes les données actuelles ({n} entraînements).',
    'settings.importError': 'Fichier de sauvegarde invalide.',
    'settings.resetTitle': 'Réinitialiser toutes les données ?',
    'settings.resetConfirm': 'Tous les entraînements, records et réglages seront supprimés. C’est irréversible.',
    'settings.resetFinal': 'Vraiment tout supprimer ?',
    'settings.resetFinalConfirm': 'Cela effacera définitivement toutes les données.',
    'settings.resetConfirmAction': 'Réinitialiser toutes les données',
    'settings.resetFinalAction': 'Vraiment supprimer',
    'common.cancel': 'Annuler', 'common.close': 'Fermer', 'common.save': 'Enregistrer', 'common.ok': 'OK', 'common.delete': 'Supprimer',
    'update.available': 'Une nouvelle version de GymQuest est disponible.',
    'update.now': 'Mettre à jour',
    'app.storageError': 'Ce navigateur a refusé d’enregistrer tes données — les changements seront perdus après un rechargement. Autorise le stockage du site (localStorage) et réessaie. Si l’enregistrement échoue encore, exporte une sauvegarde pendant que les données sont encore en mémoire.',
    'common.confirm': 'Confirmation',
    'common.confirmTitle': 'Confirmation',
    'achievements.first': 'Premier entraînement', 'achievements.firstDesc': 'Termine ton premier entraînement',
    'achievements.five': '5 entraînements', 'achievements.fiveDesc': 'Termine 5 entraînements',
    'achievements.ten': '10 entraînements', 'achievements.tenDesc': 'Termine 10 entraînements',
    'achievements.twentyfive': '25 entraînements', 'achievements.twentyfiveDesc': 'Termine 25 entraînements',
    'achievements.fifty': '50 entraînements', 'achievements.fiftyDesc': 'Termine 50 entraînements',
    'achievements.hundred': '100 entraînements', 'achievements.hundredDesc': 'Termine 100 entraînements',
    'achievements.weeklygoal1': 'Premier objectif hebdomadaire', 'achievements.weeklygoal1Desc': 'Atteins ton objectif hebdomadaire',
    'achievements.consistent2': 'Régularité 2 semaines', 'achievements.consistent2Desc': 'Entraîne-toi au moins {g}× par semaine pendant 2 semaines d’affilée',
    'achievements.consistent4': 'Régularité 4 semaines', 'achievements.consistent4Desc': 'Entraîne-toi au moins {g}× par semaine pendant 4 semaines d’affilée',
    'achievements.consistent8': 'Régularité 8 semaines', 'achievements.consistent8Desc': 'Entraîne-toi au moins {g}× par semaine pendant 8 semaines d’affilée',
    'achievements.consistent12': 'Régularité 12 semaines', 'achievements.consistent12Desc': 'Entraîne-toi au moins {g}× par semaine pendant 12 semaines d’affilée',
    'achievements.xp200': '200 XP', 'achievements.xp200Desc': 'Gagne 200 XP',
    'achievements.newpr': 'Nouveau record personnel', 'achievements.newprDesc': 'Établis un nouveau poids record personnel',
    'achievements.solid2': 'Semaine régulière', 'achievements.solid2Desc': 'Termine au moins 3 entraînements sur 2 semaines calendaires différentes',
    'achievements.solid4': 'Élan mensuel', 'achievements.solid4Desc': 'Termine au moins 3 entraînements sur 4 semaines calendaires différentes',
    'achievements.fullweek': 'Semaine complète', 'achievements.fullweekDesc': 'Termine 5 entraînements sur une seule semaine calendaire',
    'achievements.pr5': 'Briseur de records', 'achievements.pr5Desc': 'Obtiens 5 records personnels',
    'achievements.pr10': 'Chasseur de records', 'achievements.pr10Desc': 'Obtiens 10 records personnels',
    'achievements.improve': 'Plus fort chaque jour', 'achievements.improveDesc': 'Bats ton poids précédemment enregistré sur le même exercice',
    'achievements.customplan': 'Créateur de plans', 'achievements.customplanDesc': 'Crée ton premier plan d’entraînement personnalisé',
    'achievements.fourplans': 'Architecte de l’entraînement', 'achievements.fourplansDesc': 'Crée 4 plans d’entraînement actifs',
    'achievements.customex5': 'Collectionneur d’exercices', 'achievements.customex5Desc': 'Ajoute 5 exercices personnalisés à tes plans',
    'achievements.variety4': 'Athlète polyvalent', 'achievements.variety4Desc': 'Termine des entraînements de 4 plans différents',
    'achievements.comeback': 'Retour plus fort', 'achievements.comebackDesc': 'Termine un entraînement après au moins 14 jours sans aucun',
    'achievements.missedweek': 'Jamais abandonner', 'achievements.missedweekDesc': 'Termine un entraînement après avoir manqué une semaine calendaire entière',
    'motivacia.xpReward': '+{xp} XP',
    'motivacia.newAchXp': '+{xp} XP grâce aux succès',
    'motivacia.newAchievement': 'Nouveau succès : {names}',

    /* --- Corps, calories, alimentation et conseils --- */
    'units.kg': 'kg', 'units.lb': 'lb', 'units.cm': 'cm', 'units.in': 'in', 'units.g': 'g', 'units.kcal': 'kcal',

    'pokrok.subProgress': 'Progrès', 'pokrok.subBody': 'Corps', 'pokrok.subFood': 'Alimentation',

    'body.summaryTitle': 'Dernières mesures',
    'body.unitsAria': 'Unités de mesure',
    'body.unitsNote': 'Les unités ne changent que l’affichage. Les valeurs enregistrées ne sont jamais réécrites.',
    'body.add': '+ Ajouter une mesure',
    'body.addTitle': 'Ajouter une mesure',
    'body.editTitle': 'Modifier la mesure',
    'body.deleteTitle': 'Supprimer la mesure',
    'body.deleteConfirm': 'Supprimer la mesure du {date} ? C’est irréversible.',
    'body.dateLabel': 'Date',
    'body.noteLabel': 'Note (facultatif)',
    'body.fieldsHint': 'Laisse vide ce que tu n’as pas mesuré.',
    'body.empty': 'Aucune mesure pour l’instant.',
    'body.noValues': 'Aucune valeur enregistrée',
    'body.errDate': 'Choisis une date valide.',
    'body.errRange': 'Vérifie ces valeurs : {fields}.',
    'body.errEmpty': 'Remplis au moins une valeur ou écris une note.',
    'body.chartTitle': 'Évolution',
    'body.metricAria': 'Mesure à afficher',
    'body.chartRange': 'Minimum {min} · maximum {max} {unit}',
    'body.chartNeedTwo': 'Ajoute une autre entrée pour voir une tendance.',
    'body.chartAria': 'Graphique d’évolution, minimum {min}, maximum {max}',
    'body.historyTitle': 'Historique des mesures',
    'body.storageNotice': 'Tes données enregistrées deviennent volumineuses et pourraient bientôt dépasser ce que ce navigateur peut garder. Exporte une sauvegarde et envisage de supprimer les anciennes entrées dont tu n’as plus besoin. GymQuest ne supprime jamais rien à ta place.',
    'body.f.weight': 'Poids corporel',
    'body.f.waist': 'Tour de taille',
    'body.f.chest': 'Tour de poitrine',
    'body.f.armLeft': 'Bras gauche',
    'body.f.armRight': 'Bras droit',
    'body.f.thighLeft': 'Cuisse gauche',
    'body.f.thighRight': 'Cuisse droite',
    'body.f.hip': 'Hanches',

    'calorie.title': 'Estimation de l’énergie quotidienne',
    'calorie.offHint': 'Facultatif et masqué par défaut. GymQuest n’estime rien tant que tu ne l’actives pas.',
    'calorie.enable': 'Afficher l’estimation',
    'calorie.disable': 'Masquer l’estimation',
    'calorie.intro': 'Une estimation, pas une prescription. Ce n’est pas un avis médical.',
    'calorie.adultQuestion': 'As-tu 18 ans ou plus ?',
    'calorie.adultYes': 'J’ai 18 ans ou plus',
    'calorie.adultNo': 'J’ai moins de 18 ans',
    'calorie.underage': 'GymQuest n’affiche pas d’objectifs caloriques d’adulte aux moins de 18 ans. Un corps qui grandit encore a des besoins différents, et une estimation conçue pour des adultes serait trompeuse ici. Si tu veux en savoir plus sur l’alimentation et l’énergie à ton âge, parles-en à un médecin, un diététicien ou un parent.',
    'calorie.inHeight': 'Taille',
    'calorie.inAge': 'Âge',
    'calorie.years': 'ans',
    'calorie.inSex': 'Sexe utilisé par la formule',
    'calorie.sexPick': 'Non précisé',
    'calorie.sexMale': 'Homme',
    'calorie.sexFemale': 'Femme',
    'calorie.inActivity': 'Niveau d’activité',
    'calorie.activityPick': 'Non précisé',
    'calorie.actSedentary': 'Surtout assis',
    'calorie.actLight': 'Activité légère 1–3 jours par semaine',
    'calorie.actModerate': 'Activité modérée 3–5 jours par semaine',
    'calorie.actActive': 'Activité intense 6–7 jours par semaine',
    'calorie.actVery': 'Activité très intense ou travail physique',
    'calorie.inWeight': 'Poids corporel (depuis ton suivi)',
    'calorie.weightFromLog': 'Utilise ton dernier poids enregistré, du {date}.',
    'calorie.weightMissing': 'Enregistre d’abord ton poids corporel. GymQuest ne va pas le deviner.',
    'calorie.saveInputs': 'Enregistrer les données',
    'calorie.errAge': 'L’âge doit être compris entre 1 et 120.',
    'calorie.errHeight': 'La taille semble hors plage. Vérifie la valeur et l’unité.',
    'calorie.needInputs': 'Il manque encore des données',
    'calorie.missing': 'Il manque : {list}',
    'calorie.range': '{low}–{high} {unit} par jour',
    'calorie.bmrLine': 'Cela vient d’un métabolisme de repos estimé à environ {bmr} {unit} par jour.',
    'calorie.limit1': 'C’est une moyenne de population. Tes besoins réels peuvent beaucoup différer.',
    'calorie.limit2': 'Elle ne voit ni la composition corporelle, ni les problèmes de santé, ni les médicaments, ni la grossesse, ni ta façon réelle de t’entraîner.',
    'calorie.limit3': 'Ce n’est pas un objectif à atteindre au chiffre près, ni un plan de repas.',
    'calorie.limit4': 'GymQuest ne propose volontairement aucun objectif calorique de perte ou de prise de poids.',
    'calorie.limit5': 'Pour toute question médicale ou un plan sur mesure, adresse-toi à un professionnel qualifié.',
    'calorie.formula': 'Formule : Mifflin-St Jeor (Mifflin MD et al., Am J Clin Nutr, 1990) pour la dépense de repos, multipliée par un facteur d’activité. Le résultat est affiché sous forme de fourchette de ±10 %.',
    'calorie.updated': 'Dernier calcul : {when}',

    'food.offHint': 'Le journal alimentaire est facultatif et désactivé par défaut. GymQuest n’a aucune base de données d’aliments : tu saisis tout toi-même.',
    'food.enable': 'Activer le journal alimentaire',
    'food.disable': 'Désactiver le journal alimentaire',
    'food.addEntry': '+ Ajouter un aliment',
    'food.addTitle': 'Ajouter un aliment',
    'food.editEntryTitle': 'Modifier l’entrée',
    'food.newTemplateTitle': 'Nouvel aliment enregistré',
    'food.editTemplateTitle': 'Modifier l’aliment enregistré',
    'food.pickSaved': 'Aliment enregistré',
    'food.pickNone': 'Aucun – je saisis les valeurs',
    'food.qtyLabel': 'Quantité (multiplicateur)',
    'food.saveAsTemplate': 'Enregistrer aussi comme aliment',
    'food.nameLabel': 'Nom',
    'food.kcalLabel': 'Énergie',
    'food.protein': 'Protéines',
    'food.carbs': 'Glucides',
    'food.fat': 'Lipides',
    'food.macroLine': 'P {p} g · G {c} g · L {f} g',
    'food.totalsLine': '{total} · {entries}',
    'food.entries': '{n} entrées',
    'food.entriesOne': '{n} entrée',
    'food.entriesOther': '{n} entrées',
    'food.emptyDay': 'Rien d’enregistré pour ce jour.',
    'food.noSaved': 'Aucun aliment enregistré pour l’instant.',
    'food.savedTitle': 'Aliments enregistrés',
    'food.newTemplate': '+ Nouvel aliment',
    'food.editTemplate': 'Modifier l’aliment enregistré',
    'food.deleteTemplate': 'Supprimer l’aliment enregistré',
    'food.deleteTemplateConfirm': 'Supprimer « {name} » de tes aliments enregistrés ? Les entrées déjà notées gardent leurs propres valeurs.',
    'food.editEntry': 'Modifier l’entrée',
    'food.deleteEntry': 'Supprimer l’entrée',
    'food.deleteEntryConfirm': 'Supprimer « {name} » de ce jour ?',
    'food.errName': 'Donne un nom à l’aliment.',
    'food.errNumber': 'Les valeurs doivent être des nombres entre 0 et 100000.',
    'food.errQty': 'La quantité doit être supérieure à 0 et au maximum 1000.',
    'food.disclaimer': 'Ces valeurs, c’est toi qui les as saisies. GymQuest ne vérifie pas les données nutritionnelles et n’a aucune base de données d’aliments.',
    'food.prevDay': 'Jour précédent',
    'food.nextDay': 'Jour suivant',

    'tips.title': 'Comment lire ces chiffres',
    'tips.t1Title': 'Mesurer son poids toujours de la même façon',
    'tips.t1Body': 'La même balance, la même heure, des conditions similaires – beaucoup de gens se pèsent le matin avant de manger. La régularité compte bien plus qu’un chiffre isolé.',
    'tips.t2Title': 'Les variations d’un jour ne sont pas une tendance',
    'tips.t2Body': 'Le poids bouge avec l’eau, les aliments dans l’intestin et le sel : il peut varier dans une même journée. Compare des moyennes hebdomadaires, ou le même jour sur plusieurs semaines, pour voir quelque chose de plus proche d’une direction réelle.',
    'tips.t3Title': 'Durée, séries, répétitions et surcharge progressive',
    'tips.t3Body': 'La durée, c’est le temps qu’a pris la séance. Une série est un groupe de répétitions. Les répétitions, c’est le nombre de fois où tu as déplacé la charge. La surcharge progressive, c’est faire un peu plus au fil du temps : plus de charge, plus de répétitions ou une meilleure exécution.',
    'tips.t4Title': 'Ce que l’estimation calorique dit et ne dit pas',
    'tips.t4Body': 'Elle estime l’énergie qu’une personne moyenne de tes mensurations pourrait dépenser en une journée. Elle ne mesure pas ton métabolisme et ne dit rien de la qualité des aliments ni de ta santé.',
    'tips.t5Title': 'Ce que veulent dire tes propres chiffres',
    'tips.t5Body': 'Ce sont tes notes, pas des mesures de laboratoire. Les portions sont estimées, les étiquettes varient et le même repas peut changer d’un jour à l’autre. Utile pour repérer des tendances, pas pour une comptabilité exacte.',
    'tips.foodTitle': 'À propos des valeurs que tu saisis',
    'tips.f1Title': 'Ton entrée, tes chiffres',
    'tips.f1Body': 'Rien ici n’est recherché ni vérifié. Ce que tu écris est ce que tu vois : les totaux valent ce que valent tes estimations.',
    'tips.f2Title': 'Les habitudes comptent plus que la précision',
    'tips.f2Body': 'Un relevé approximatif mais régulier sur plusieurs semaines en dit plus qu’une seule journée pesée au gramme. La nourriture n’est pas quelque chose à mériter ni à compenser par l’entraînement.',
  },
  ar: {
    'tab.dnes': 'اليوم', 'tab.trening': 'التمرين', 'tab.pokrok': 'التقدّم', 'tab.motivacia': 'التحفيز', 'tab.kalendar': 'التقويم',
    'kalendar.prevMonth': 'الشهر السابق',
    'kalendar.nextMonth': 'الشهر التالي',
    'kalendar.goToday': 'اليوم',
    'kalendar.legendTitle': 'المفتاح',
    'kalendar.legendWorkout': 'أخضر — تمرين مكتمل',
    'kalendar.legendMissed': 'أحمر — لا يوجد تمرين مسجَّل',
    'kalendar.legendToday': 'إطار برتقالي — اليوم',
    'kalendar.statusWorkout': 'تمرين مكتمل',
    'kalendar.statusNone': 'لا يوجد تمرين مسجَّل',
    'kalendar.statusTodayNone': 'اليوم — لا يوجد تمرين مسجَّل بعد',
    'kalendar.statusFuture': 'هذا التاريخ في المستقبل.',
    'kalendar.emptyPast': 'لم يُسجَّل أي تمرين في هذا اليوم.',
    'kalendar.achievements': 'الإنجازات المفتوحة',
    'kalendar.ariaDay': '{date} — {status}',
    'kalendar.ariaWorkoutCountZero': '{n} تمرين في هذا اليوم',
    'kalendar.ariaWorkoutCountOne': '{n} تمرين في هذا اليوم',
    'kalendar.ariaWorkoutCountTwo': '{n} تمرينان في هذا اليوم',
    'kalendar.ariaWorkoutCountFew': '{n} تمارين في هذا اليوم',
    'kalendar.ariaWorkoutCountMany': '{n} تمرينًا في هذا اليوم',
    'kalendar.ariaWorkoutCountOther': '{n} تمرين في هذا اليوم',
    'plan.push': 'دفع', 'plan.pull': 'سحب', 'plan.legs': 'الأرجل',
    'plan.newName': 'خطة تمرين جديدة',
    'planChoice.title': 'إنشاء خطة تمرين',
    'planChoice.blank': 'خطة تمرين فارغة',
    'planChoice.blankDesc': 'أنشئ خطة مخصّصة فارغة وأضف التمارين يدويًا.',
    'planChoice.fullBody': 'منشئ الجسم كامل',
    'planChoice.fullBodyDesc': 'أنشئ تمرينًا للجسم كامل باختيار تمارين من خططك الحالية.',
    'fb.title': 'منشئ الجسم كامل',
    'fb.subtitle': 'اختر تمارين من خطط التمرين الحالية.',
    'fb.nameLabel': 'اسم الخطة',
    'fb.defaultName': 'الجسم كامل',
    'fb.selected': 'التمارين المختارة: {n}',
    'fb.selectedZero': 'التمارين المختارة: {n}',
    'fb.selectedOne': 'التمارين المختارة: {n}',
    'fb.selectedTwo': 'التمارين المختارة: {n}',
    'fb.selectedFew': 'التمارين المختارة: {n}',
    'fb.selectedMany': 'التمارين المختارة: {n}',
    'fb.selectedOther': 'التمارين المختارة: {n}',
    'fb.selectAll': 'تحديد الكل',
    'fb.clear': 'مسح',
    'fb.create': 'إنشاء تمرين الجسم كامل',
    'fb.needOne': 'اختر تمرينًا واحدًا على الأقل.',
    'fb.noExercises': 'لا توجد تمارين متاحة في خطة التمرين هذه.',
    'fb.duplicates': 'التمارين المكرّرة تُضاف مرة واحدة فقط.',
    'fb.bodyweight': 'وزن الجسم',
    'picker.title': 'إضافة تمارين من خطط موجودة',
    'picker.subtitle': 'حدّد التمارين التي تريد إضافتها إلى هذه الخطة.',
    'picker.apply': 'إضافة إلى الخطة',
    'unilateral.trainBoth': 'تدريب كل جهة على حدة',
    'unilateral.startLeft': 'البدء باليسرى',
    'unilateral.startRight': 'البدء باليمنى',
    'unilateral.left': 'اليسرى',
    'unilateral.right': 'اليمنى',
    'unilateral.setsPerSideZero': '{n} مجموعة لكل جهة',
    'unilateral.setsPerSideOne': '{n} مجموعة لكل جهة',
    'unilateral.setsPerSideTwo': '{n} مجموعتان لكل جهة',
    'unilateral.setsPerSideFew': '{n} مجموعات لكل جهة',
    'unilateral.setsPerSideMany': '{n} مجموعة لكل جهة',
    'unilateral.setsPerSideOther': '{n} مجموعة لكل جهة',
    'unilateral.setSide': 'السلسلة {n} — {side}',
    'unilateral.completed': 'المكتمل: {sides}',
    'unilateral.bothSides': 'اليسرى واليمنى',
    'unilateral.leftOnly': 'اليسرى فقط',
    'unilateral.rightOnly': 'اليمنى فقط',
    'unilateral.noneSides': 'لا شيء',
    'unilateral.failureList': 'الوصول للفشل: {list}',
    'exercise.bench-press': 'ضغط الصدر بالبار', 'exercise.overhead-press': 'ضغط الكتف واقفًا', 'exercise.dips': 'الغطس', 'exercise.lateral-raises': 'الرفرفة الجانبية',
    'exercise.pull-ups': 'العقلة', 'exercise.bent-over-rows': 'السحب بالبار من الانحناء', 'exercise.cable-rows': 'السحب على الكيبل', 'exercise.bicep-curls': 'مرجحة البايسبس',
    'exercise.squats': 'السكوات', 'exercise.leg-press': 'دفع الأرجل', 'exercise.lunges': 'الطعن', 'exercise.leg-curls': 'ثني الرجل الخلفية', 'exercise.calf-raises': 'رفع السمانة',
    'header.level': 'مستوى',
    'header.settingsTitle': 'الإعدادات',
    'header.levelTitle': 'المستوى',
    'settings.language': 'اللغة',
    'settings.changeLanguage': 'تغيير اللغة',
    'settings.languageCurrent': 'اللغة الحالية: {name}',
    'langPicker.title': 'اللغة',
    'langPicker.select': '{name} — اختيار هذه اللغة',
    'langPicker.selected': '{name} — محدَّدة حاليًا',
    'settings.autoBackup': 'النسخ الاحتياطي التلقائي',
    'settings.autoBackupHint': 'عند توفر الدعم، يحاول GymQuest إنشاء نسخة JSON احتياطية أثناء فتح التطبيق. قد يطلب منك iPhone تأكيد الملف أو حفظه.',
    'settings.autoBackupLast': 'آخر نسخة احتياطية خارجية معروضة: {when}',
    'settings.importOlder': 'تحتوي هذه النسخة على تمارين أقل من بياناتك الحالية ({old} → {new}).',
    'backup.never': 'أبدًا',
    'backup.dueTitle': 'حان وقت النسخ الاحتياطي',
    'backup.dueBody': 'احفظ نسخة JSON خارج GymQuest لتتمكن من استعادة تمارينك وسجلك.',
    'backup.sentTitle': 'تم إنشاء ملف النسخة الاحتياطية',
    'backup.sentBody': 'تم تسليم ملف النسخة الاحتياطية إلى المتصفح.',
    'backup.saveNow': 'حفظ النسخة الآن',
    'backup.saveAgain': 'حفظ مرة أخرى',
    'backup.dismiss': 'إخفاء تذكير النسخ الاحتياطي',
    'backup.noConfirm': 'لا يستطيع GymQuest تأكيد أن الملف قد حُفظ فعلًا — تحقق من تطبيق الملفات أو مجلد التنزيلات.',
    'backup.shareHint': 'إذا ظهرت قائمة المشاركة، اختر «حفظ في الملفات» (iCloud Drive أو على iPhone). لا يستطيع GymQuest تأكيد الحفظ.',
    'backup.fileName': 'الملف: {name}',
    'dnes.weekTitle': 'تدريبات هذا الأسبوع',
    'dnes.weekDone': '{n} من {g}',
    'dnes.weekDoneShort': '{n} من {g}',
    'dnes.weekGoalMet': 'تم تحقيق الهدف الأسبوعي!',
    'dnes.weekRemaining': 'بقي {n} للوصول إلى الهدف.',
    'dnes.weekRemainingZero': 'تم تحقيق الهدف الأسبوعي.',
    'dnes.weekRemainingOne': 'بقي {n} تمرين للوصول إلى الهدف.',
    'dnes.weekRemainingTwo': 'بقي {n} تمرينان للوصول إلى الهدف.',
    'dnes.weekRemainingFew': 'بقيت {n} تمارين للوصول إلى الهدف.',
    'dnes.weekRemainingMany': 'بقي {n} تمرينًا للوصول إلى الهدف.',
    'dnes.weekRemainingOther': 'بقي {n} تمرين للوصول إلى الهدف.',
    'dnes.streakTitle': '🔥 الاستمرارية',
    'dnes.streakNone': 'لا توجد سلسلة',
    'dnes.streakWeek': '🔥 {n} أسبوع متتالٍ',
    'dnes.streakWeekZero': '🔥 لا توجد سلسلة',
    'dnes.streakWeekOne': '🔥 {n} أسبوع متتالٍ',
    'dnes.streakWeekTwo': '🔥 {n} أسبوعان متتاليان',
    'dnes.streakWeekFew': '🔥 {n} أسابيع متتالية',
    'dnes.streakWeekMany': '🔥 {n} أسبوعًا متتاليًا',
    'dnes.streakWeekOther': '🔥 {n} أسبوع متتالٍ',
    'dnes.streakStart': 'أكمل {g} تمرينًا هذا الأسبوع لبدء سلسلة.',
    'dnes.streakStartOne': 'أكمل {g} تمرين هذا الأسبوع لبدء سلسلة.',
    'dnes.streakStartTwo': 'أكمل {g} تمرينين هذا الأسبوع لبدء سلسلة.',
    'dnes.streakStartFew': 'أكمل {g} تمارين هذا الأسبوع لبدء سلسلة.',
    'dnes.streakStartMany': 'أكمل {g} تمرينًا هذا الأسبوع لبدء سلسلة.',
    'dnes.streakStartOther': 'أكمل {g} تمرين هذا الأسبوع لبدء سلسلة.',
    'dnes.streakContinue': 'أكمل {g} تمرينًا هذا الأسبوع لمواصلة سلسلتك.',
    'dnes.streakContinueOne': 'أكمل {g} تمرين هذا الأسبوع لمواصلة سلسلتك.',
    'dnes.streakContinueTwo': 'أكمل {g} تمرينين هذا الأسبوع لمواصلة سلسلتك.',
    'dnes.streakContinueFew': 'أكمل {g} تمارين هذا الأسبوع لمواصلة سلسلتك.',
    'dnes.streakContinueMany': 'أكمل {g} تمرينًا هذا الأسبوع لمواصلة سلسلتك.',
    'dnes.streakContinueOther': 'أكمل {g} تمرين هذا الأسبوع لمواصلة سلسلتك.',
    'dnes.streakGoing': 'تم تحقيق الهدف الأسبوعي. سلسلتك مستمرة!',
    'dnes.streakEnded': 'انتهت سلسلتك. ابدأ سلسلة جديدة بتحقيق هدفك الأسبوعي.',
    'dnes.excuse': 'دراسة / مرض',
    'dnes.excuseActive': 'دراسة / مرض ✓ (نشِط)',
    'dnes.excuseNote': 'هذا الأسبوع مُستثنى — السلسلة محفوظة.',
    'dnes.start': 'بدء التمرين',
    'dnes.nextPlan': 'الموصى به: {plan}',
    'dnes.weekOf': 'الأسبوع {n}',
    'trening.finish': 'إنهاء التمرين',
    'trening.finishTitle': 'إنهاء التمرين؟',
    'trening.doneTitle': '🏆 اكتمل التمرين!',
    'trening.confirmText': '{plan} · {done} من {total} سلسلة<br>ستحصل على <b style="color:#a3e635">+{xp} XP</b>',
    'trening.noteLabel': 'ملاحظة (اختيارية)',
    'trening.super': 'رائع!',
    'trening.undo': 'تراجع عن هذا التمرين',
    'trening.undoConfirmTitle': 'التراجع عن التمرين؟',
    'trening.undoConfirm': 'سيُحذف هذا التمرين و{xp} XP.',
    'trening.setsDone': 'السلاسل المنجزة: <b>{done} من {total}</b> · {msg}',
    'trening.setsHint': 'حدّد السلاسل المنجزة.',
    'trening.firstTime': 'المرة الأولى',
    'trening.compareUp': '▲ {w} كغ · +{r} تكرار مقارنة بالمرة السابقة',
    'trening.compareDown': '▼ {w} كغ · {r} تكرار مقارنة بالمرة السابقة',
    'trening.compareSame': 'مثل المرة السابقة ({w} كغ)',
    'trening.compareWeightUp': '▲ {w} كغ مقارنة بالمرة السابقة',
    'trening.compareWeightDown': '▼ {w} كغ مقارنة بالمرة السابقة',
    'trening.compareRepsUp': '+{r} تكرار مقارنة بالمرة السابقة',
    'trening.compareRepsDown': '{r} تكرار مقارنة بالمرة السابقة',
    'trening.edit': 'تعديل الخطة',
    'trening.editTitle': 'تعديل الخطة',
    'trening.planLabel': 'خطة التمرين',
    'trening.editPlanButton': '✏️ تعديل الخطة',
    'trening.planNameLabel': 'اسم الخطة',
    'trening.planNamePlaceholder': 'مثال: الجزء العلوي',
    'trening.planNameInvalid': 'اكتب اسم الخطة (40 حرفًا كحد أقصى).',
    'trening.addPlan': '+ إضافة خطة تمرين',
    'trening.managePlans': 'إدارة الخطط',
    'trening.managePlansDone': 'تم',
    'trening.manageHint': 'اسحب الخطة لتغيير ترتيبها، أو اضغط ✏️ لتعديلها.',
    'trening.movePlanLeft': 'تحريك لليسار',
    'trening.movePlanRight': 'تحريك لليمين',
    'trening.dragPlan': 'تحريك خطة التمرين',
    'trening.dragExercise': 'تحريك التمرين',
    'trening.moveUp': 'تحريك للأعلى',
    'trening.moveDown': 'تحريك للأسفل',
    'trening.addFromPlans': 'إضافة تمارين من خطط موجودة',
    'trening.setDoneAria': 'تحديد السلسلة {n} كمنجزة',
    'trening.deletePlan': 'حذف الخطة',
    'trening.deletePlanTitle': 'حذف الخطة؟',
    'trening.deletePlanConfirm': 'ستُحذف الخطة «{name}» ولن تظهر في التبديل. سيبقى سجل التمارين محفوظًا.',
    'trening.deletePlanLast': 'يجب أن تبقى خطة واحدة على الأقل.',
    'trening.addExercise': '+ إضافة تمرين',
    'trening.exercisePlaceholder': 'التمرين',
    'trening.editSave': 'حفظ',
    'trening.editCancel': 'إلغاء',
    'trening.lastExerciseBlock': 'تحتاج الخطة إلى تمرين واحد على الأقل. أضف تمرينًا جديدًا.',
    'trening.deleteExerciseTitle': 'حذف التمرين؟',
    'trening.deleteExercise': 'سيُحذف التمرين «{name}» من الخطة.',
    'trening.editInvalid': 'املأ اسم التمرين والأرقام (السلاسل 1–99، التكرارات 1–99، الوزن 0–999).',
    'trening.resetSession': 'إعادة ضبط التمرين',
    'trening.resetSessionTitle': 'إعادة ضبط التمرين؟',
    'trening.resetSessionConfirm': 'ستُمسح السلاسل المحدَّدة في هذا التمرين. السجل يبقى سليمًا.',
    'trening.timerLabel': 'راحة',
    'trening.timerDone': 'انتهت الراحة.',
    'trening.timerComplete': 'اكتملت الراحة',
    'trening.timerStop': 'إيقاف المؤقت',
    'trening.timerStart': 'بدء الراحة',
    'trening.timerSection': 'مؤقت الراحة',
    'trening.timerCustom': 'مخصّص',
    'trening.customTitle': 'زمن راحة مخصّص',
    'trening.customMinutes': 'دقائق',
    'trening.customSeconds': 'ثوانٍ',
    'trening.customStart': 'بدء مؤقت الراحة',
    'trening.customStartAlt': 'بدء مؤقت مخصّص',
    'trening.customInvalid': 'أدخل زمن راحة صالحًا.',
    'trening.customZero': 'يجب أن يكون زمن الراحة أكبر من صفر.',
    'failure.plannedLabel': 'سلاسل الفشل',
    'failure.none': 'لا شيء',
    'failure.failure': 'فشل',
    'failure.planned': 'فشل مخطَّط',
    'failure.noSets': 'لا توجد سلاسل فشل',
    'failure.sets': 'سلاسل الفشل: {sets}',
    'failure.markSet': 'تحديد السلسلة كفشل',
    'failure.removeMarker': 'إزالة علامة الفشل',
    'trening.failureHint': '🔥 الفشل — حدّد السلسلة فقط إذا وصلت فعلًا إلى الفشل.',
    'trening.failureHintEdit': 'اختياري: اختر السلاسل التي تخطّط للوصول فيها إلى الفشل. يمكنك تغيير النتيجة الفعلية أثناء التمرين.',
    'trening.durationLabel': 'مدة التمرين',
    'trening.sessionRestored': 'تم استعادة التمرين النشط',
    'trening.planSaved': 'تم حفظ تغييرات الخطة. تقدّم تمرينك الحالي محفوظ.',
    'trening.durationResult': 'مدة التمرين: {duration}',
    'history.duration': 'المدة: {duration}',
    'duration.secZero': '{n} ثانية', 'duration.secOne': '{n} ثانية', 'duration.secTwo': '{n} ثانيتان', 'duration.secFew': '{n} ثوانٍ', 'duration.secMany': '{n} ثانية', 'duration.secOther': '{n} ثانية',
    'duration.minZero': '{n} دقيقة', 'duration.minOne': '{n} دقيقة', 'duration.minTwo': '{n} دقيقتان', 'duration.minFew': '{n} دقائق', 'duration.minMany': '{n} دقيقة', 'duration.minOther': '{n} دقيقة',
    'duration.hourUnitZero': '{n} ساعة', 'duration.hourUnitOne': '{n} ساعة', 'duration.hourUnitTwo': '{n} ساعتان', 'duration.hourUnitFew': '{n} ساعات', 'duration.hourUnitMany': '{n} ساعة', 'duration.hourUnitOther': '{n} ساعة',
    'duration.minUnitZero': '{n} دقيقة', 'duration.minUnitOne': '{n} دقيقة', 'duration.minUnitTwo': '{n} دقيقتان', 'duration.minUnitFew': '{n} دقائق', 'duration.minUnitMany': '{n} دقيقة', 'duration.minUnitOther': '{n} دقيقة',
    'duration.hourMin': '{h} و{m}',
    'pokrok.thisWeek': 'هذا الأسبوع', 'pokrok.thisMonth': 'هذا الشهر', 'pokrok.total': 'الإجمالي',
    'pokrok.recordsTitle': '🏆 الأرقام القياسية',
    'pokrok.recordsEmpty': 'لا توجد أرقام قياسية بعد.',
    'pokrok.nextMilestone': 'المرحلة التالية: {kg} كغ',
    'pokrok.historyTitle': '📋 سجل التمارين',
    'pokrok.historyEmpty': 'لا توجد تمارين بعد.',
    'pokrok.workoutName': '{plan}',
    'pokrok.workoutFallback': 'تمرين',
    'pokrok.setsCountZero': '{n} مجموعة', 'pokrok.setsCountOne': '{n} مجموعة', 'pokrok.setsCountTwo': '{n} مجموعتان', 'pokrok.setsCountFew': '{n} مجموعات', 'pokrok.setsCountMany': '{n} مجموعة', 'pokrok.setsCountOther': '{n} مجموعة',
    'history.editTitle': 'تعديل التمرين',
    'history.deleteTitle': 'حذف التمرين؟',
    'history.deleteConfirm': 'سيُحذف هذا التمرين و{xp} XP.',
    'history.workoutSummary': '{name} {sets}×{reps} · {w} كغ',
    'history.date': 'التاريخ',
    'history.setsLabel': 'السلاسل', 'history.repsLabel': 'تكرار', 'history.setsDoneLabel': 'منجز',
    'motivacia.levelTitle': 'المستوى',
    'motivacia.levelSub': 'لديك {xp} XP إجمالًا. تحتاج {left} XP للمستوى التالي.',
    'motivacia.achTitle': '🎖️ الإنجازات',
    'motivacia.unlocked': 'تم فتحه {date}',
    'motivacia.ach.5kg': '{name} · {kg} كغ',
    'setup.title': 'إعداد التمرين',
    'setup.question': 'كم تمرينًا في الأسبوع تريد إنجازه؟',
    'setup.explain': 'هدفك الأسبوعي يحدّد التقدّم والسلسلة والمكافآت الأسبوعية.',
    'setup.continue': 'متابعة',
    'settings.title': 'الإعدادات',
    'settings.goalLabel': 'الهدف الأسبوعي للتمارين',
    'settings.goalHint': 'اختر بين 1 و7 تمارين في الأسبوع.',
    'settings.goalInvalid': 'أدخل رقمًا صحيحًا من {min} إلى {max}.',
    'settings.save': 'حفظ الهدف',
    'settings.restSound': 'صوت مؤقت الراحة',
    'settings.restSoundHint': 'تشغيل جرس قصير عند وصول مؤقت الراحة إلى الصفر.',
    'settings.testSound': 'تجربة الصوت',
    'settings.testSoundDisabledHint': 'فعّل صوت مؤقت الراحة لتجربته.',
    'settings.testSoundFailed': 'تعذّر تشغيل الصوت. تحقّق من إعدادات صوت الجهاز.',
    'settings.on': 'مفعّل',
    'settings.off': 'متوقف',
    'settings.restSoundLength': 'طول صوت الراحة',
    'settings.lenShort': 'قصير',
    'settings.lenStandard': 'قياسي',
    'settings.lenLong': 'طويل',
    'settings.export': 'تصدير البيانات',
    'settings.import': 'استيراد البيانات',
    'settings.reset': 'إعادة ضبط البيانات',
    'settings.loadDemo': 'تحميل بيانات تجريبية',
    'settings.removeDemo': 'إزالة البيانات التجريبية',
    'settings.demoConfirm': 'سيستبدل هذا السجل الحالي ببيانات تجريبية.',
    'settings.demoRemoveConfirm': 'ستُزال البيانات التجريبية وتبدأ من الصفر.',
    'settings.demoNone': 'لا توجد بيانات تجريبية.',
    'units.kg': 'كغ', 'units.xp': 'XP', 'units.sets': 'سلاسل', 'units.reps': 'تكرار',
    'settings.importTitle': 'استيراد البيانات؟',
    'settings.importConfirm': 'سيستبدل هذا جميع البيانات الحالية ({n} تمرين).',
    'settings.importError': 'ملف نسخة احتياطية غير صالح.',
    'settings.resetTitle': 'إعادة ضبط كل البيانات؟',
    'settings.resetConfirm': 'ستُحذف جميع التمارين والأرقام القياسية والإعدادات. لا يمكن التراجع.',
    'settings.resetFinal': 'حذف كل شيء فعلًا؟',
    'settings.resetFinalConfirm': 'سيؤدي هذا إلى محو جميع البيانات نهائيًا.',
    'settings.resetConfirmAction': 'إعادة ضبط كل البيانات',
    'settings.resetFinalAction': 'حذف فعلًا',
    'common.cancel': 'إلغاء', 'common.close': 'إغلاق', 'common.save': 'حفظ', 'common.ok': 'حسنًا', 'common.delete': 'حذف',
    'update.available': 'يتوفّر إصدار جديد من GymQuest.',
    'update.now': 'التحديث الآن',
    'app.storageError': 'رفض هذا المتصفح حفظ بياناتك — ستُفقد التغييرات بعد إعادة التحميل. اسمح بتخزين بيانات الموقع (localStorage) وحاول مرة أخرى. إذا استمر الفشل، صدّر نسخة احتياطية الآن قبل فقدان البيانات.',
    'common.confirm': 'تأكيد',
    'common.confirmTitle': 'تأكيد',
    'achievements.first': 'أول تمرين', 'achievements.firstDesc': 'أكمل أول تمرين لك',
    'achievements.five': '5 تمارين', 'achievements.fiveDesc': 'أكمل 5 تمارين',
    'achievements.ten': '10 تمارين', 'achievements.tenDesc': 'أكمل 10 تمارين',
    'achievements.twentyfive': '25 تمرينًا', 'achievements.twentyfiveDesc': 'أكمل 25 تمرينًا',
    'achievements.fifty': '50 تمرينًا', 'achievements.fiftyDesc': 'أكمل 50 تمرينًا',
    'achievements.hundred': '100 تمرين', 'achievements.hundredDesc': 'أكمل 100 تمرين',
    'achievements.weeklygoal1': 'أول هدف أسبوعي', 'achievements.weeklygoal1Desc': 'حقّق هدفك الأسبوعي',
    'achievements.consistent2': 'استمرارية أسبوعين', 'achievements.consistent2Desc': 'تدرّب {g}× في الأسبوع على الأقل لأسبوعين متتاليين',
    'achievements.consistent4': 'استمرارية 4 أسابيع', 'achievements.consistent4Desc': 'تدرّب {g}× في الأسبوع على الأقل لأربعة أسابيع متتالية',
    'achievements.consistent8': 'استمرارية 8 أسابيع', 'achievements.consistent8Desc': 'تدرّب {g}× في الأسبوع على الأقل لثمانية أسابيع متتالية',
    'achievements.consistent12': 'استمرارية 12 أسبوعًا', 'achievements.consistent12Desc': 'تدرّب {g}× في الأسبوع على الأقل لاثني عشر أسبوعًا متتاليًا',
    'achievements.xp200': '200 XP', 'achievements.xp200Desc': 'اجمع 200 XP',
    'achievements.newpr': 'رقم قياسي جديد', 'achievements.newprDesc': 'سجّل أفضل وزن شخصي جديد',
    'achievements.solid2': 'أسبوع منتظم', 'achievements.solid2Desc': 'أكمل 3 تمارين على الأقل في أسبوعين تقويميين مختلفين',
    'achievements.solid4': 'زخم شهري', 'achievements.solid4Desc': 'أكمل 3 تمارين على الأقل في 4 أسابيع تقويمية مختلفة',
    'achievements.fullweek': 'أسبوع كامل', 'achievements.fullweekDesc': 'أكمل 5 تمارين في أسبوع تقويمي واحد',
    'achievements.pr5': 'محطّم الأرقام', 'achievements.pr5Desc': 'حقّق 5 أرقام قياسية شخصية',
    'achievements.pr10': 'صيّاد الأرقام', 'achievements.pr10Desc': 'حقّق 10 أرقام قياسية شخصية',
    'achievements.improve': 'أقوى كل يوم', 'achievements.improveDesc': 'تجاوز وزنك المسجَّل السابق في التمرين نفسه',
    'achievements.customplan': 'بانِي الخطط', 'achievements.customplanDesc': 'أنشئ أول خطة تمرين مخصّصة',
    'achievements.fourplans': 'مهندس التدريب', 'achievements.fourplansDesc': 'أنشئ 4 خطط تمرين نشطة',
    'achievements.customex5': 'جامع التمارين', 'achievements.customex5Desc': 'أضف 5 تمارين مخصّصة إلى خططك',
    'achievements.variety4': 'رياضي متنوّع', 'achievements.variety4Desc': 'أكمل تمارين من 4 خطط مختلفة',
    'achievements.comeback': 'عودة أقوى', 'achievements.comebackDesc': 'أكمل تمرينًا بعد 14 يومًا على الأقل بدون تمرين',
    'achievements.missedweek': 'لا أستسلم', 'achievements.missedweekDesc': 'أكمل تمرينًا بعد تفويت أسبوع تقويمي كامل',
    'motivacia.xpReward': '+{xp} XP',
    'motivacia.newAchXp': '+{xp} XP من الإنجازات',
    'motivacia.newAchievement': 'إنجاز جديد: {names}',

    /* --- الجسم والسعرات والطعام والنصائح --- */
    'units.kg': 'كغ', 'units.lb': 'رطل', 'units.cm': 'سم', 'units.in': 'بوصة', 'units.g': 'غ', 'units.kcal': 'سعرة',

    'pokrok.subProgress': 'التقدّم', 'pokrok.subBody': 'الجسم', 'pokrok.subFood': 'الطعام',

    'body.summaryTitle': 'أحدث القياسات',
    'body.unitsAria': 'وحدات القياس',
    'body.unitsNote': 'الوحدات تغيّر العرض فقط. القيم المحفوظة لا تُعاد كتابتها أبدًا.',
    'body.add': '+ إضافة قياس',
    'body.addTitle': 'إضافة قياس',
    'body.editTitle': 'تعديل القياس',
    'body.deleteTitle': 'حذف القياس',
    'body.deleteConfirm': 'حذف قياس {date}؟ لا يمكن التراجع عن هذا.',
    'body.dateLabel': 'التاريخ',
    'body.noteLabel': 'ملاحظة (اختياري)',
    'body.fieldsHint': 'اترك الحقل فارغًا إذا لم تقسه.',
    'body.empty': 'لا توجد قياسات بعد.',
    'body.noValues': 'لا توجد قيم مسجّلة',
    'body.errDate': 'اختر تاريخًا صحيحًا.',
    'body.errRange': 'تحقّق من هذه القيم: {fields}.',
    'body.errEmpty': 'أدخل قيمة واحدة على الأقل أو اكتب ملاحظة.',
    'body.chartTitle': 'التطوّر',
    'body.metricAria': 'القياس المعروض',
    'body.chartRange': 'الأدنى {min} · الأعلى {max} {unit}',
    'body.chartNeedTwo': 'أضف قياسًا آخر لرؤية اتجاه.',
    'body.chartAria': 'مخطط التطوّر، الأدنى {min}، الأعلى {max}',
    'body.historyTitle': 'سجلّ القياسات',
    'body.storageNotice': 'بياناتك المحفوظة تكبر وقد تتجاوز قريبًا ما يستطيع هذا المتصفح الاحتفاظ به. صدّر نسخة احتياطية وفكّر في حذف القياسات القديمة التي لم تعد تحتاجها. GymQuest لا يحذف شيئًا نيابة عنك أبدًا.',
    'body.f.weight': 'وزن الجسم',
    'body.f.waist': 'محيط الخصر',
    'body.f.chest': 'محيط الصدر',
    'body.f.armLeft': 'الذراع الأيسر',
    'body.f.armRight': 'الذراع الأيمن',
    'body.f.thighLeft': 'الفخذ الأيسر',
    'body.f.thighRight': 'الفخذ الأيمن',
    'body.f.hip': 'محيط الأرداف',

    'calorie.title': 'تقدير الطاقة اليومية',
    'calorie.offHint': 'اختياري ومخفي افتراضيًا. GymQuest لا يقدّر شيئًا حتى تشغّله بنفسك.',
    'calorie.enable': 'إظهار التقدير',
    'calorie.disable': 'إخفاء التقدير',
    'calorie.intro': 'تقدير، وليس وصفة. هذه ليست نصيحة طبية.',
    'calorie.adultQuestion': 'هل عمرك 18 سنة أو أكثر؟',
    'calorie.adultYes': 'عمري 18 أو أكثر',
    'calorie.adultNo': 'عمري أقل من 18',
    'calorie.underage': 'لا يعرض GymQuest أهدافًا حرارية للبالغين لمن هم دون 18. الجسم الذي ما زال ينمو له احتياجات مختلفة، وتقدير مبني على البالغين سيكون مضلّلًا هنا. إن أردت معرفة المزيد عن الطعام والطاقة في عمرك، تحدّث مع طبيب أو أخصائي تغذية أو أحد والديك.',
    'calorie.inHeight': 'الطول',
    'calorie.inAge': 'العمر',
    'calorie.years': 'سنة',
    'calorie.inSex': 'الجنس المستخدم في المعادلة',
    'calorie.sexPick': 'غير محدَّد',
    'calorie.sexMale': 'ذكر',
    'calorie.sexFemale': 'أنثى',
    'calorie.inActivity': 'مستوى النشاط',
    'calorie.activityPick': 'غير محدَّد',
    'calorie.actSedentary': 'جلوس في معظم الوقت',
    'calorie.actLight': 'نشاط خفيف 1–3 أيام في الأسبوع',
    'calorie.actModerate': 'نشاط متوسط 3–5 أيام في الأسبوع',
    'calorie.actActive': 'نشاط شاقّ 6–7 أيام في الأسبوع',
    'calorie.actVery': 'نشاط شاقّ جدًا أو عمل بدني',
    'calorie.inWeight': 'وزن الجسم (من سجلّك)',
    'calorie.weightFromLog': 'يُستخدم آخر وزن سجّلته في {date}.',
    'calorie.weightMissing': 'سجّل وزن جسمك أولًا. GymQuest لن يخمّنه.',
    'calorie.saveInputs': 'حفظ البيانات',
    'calorie.errAge': 'يجب أن يكون العمر بين 1 و120.',
    'calorie.errHeight': 'الطول يبدو خارج النطاق. تحقّق من القيمة والوحدة.',
    'calorie.needInputs': 'لا تزال البيانات ناقصة',
    'calorie.missing': 'ناقص: {list}',
    'calorie.range': '{low}–{high} {unit} يوميًا',
    'calorie.bmrLine': 'وهذا مبني على معدّل راحة مقدَّر بنحو {bmr} {unit} يوميًا.',
    'calorie.limit1': 'هذا متوسط سكاني. احتياجك الحقيقي قد يختلف كثيرًا.',
    'calorie.limit2': 'لا يرى تركيب الجسم ولا الحالات الصحية ولا الأدوية ولا الحمل ولا طريقة تدريبك الفعلية.',
    'calorie.limit3': 'ليس هدفًا يجب إصابته بدقة، وليس خطة وجبات.',
    'calorie.limit4': 'لا يقدّم GymQuest عمدًا أهدافًا حرارية لإنقاص الوزن أو زيادته.',
    'calorie.limit5': 'في أي أمر طبي أو خطة مصمّمة لك، راجع مختصًّا مؤهّلًا.',
    'calorie.formula': 'المعادلة: Mifflin-St Jeor (Mifflin MD et al., Am J Clin Nutr, 1990) لطاقة الراحة، مضروبة في معامل النشاط. تُعرض النتيجة كنطاق ±10٪.',
    'calorie.updated': 'آخر حساب: {when}',

    'food.offHint': 'سجلّ الطعام اختياري ومغلق افتراضيًا. لا توجد في GymQuest أي قاعدة بيانات للأطعمة – أنت تكتب كل شيء بنفسك.',
    'food.enable': 'تشغيل سجلّ الطعام',
    'food.disable': 'إيقاف سجلّ الطعام',
    'food.addEntry': '+ إضافة طعام',
    'food.addTitle': 'إضافة طعام',
    'food.editEntryTitle': 'تعديل الإدخال',
    'food.newTemplateTitle': 'طعام محفوظ جديد',
    'food.editTemplateTitle': 'تعديل الطعام المحفوظ',
    'food.pickSaved': 'طعام محفوظ',
    'food.pickNone': 'لا شيء – سأكتب القيم بنفسي',
    'food.qtyLabel': 'الكمية (المضاعف)',
    'food.saveAsTemplate': 'حفظه أيضًا كطعام',
    'food.nameLabel': 'الاسم',
    'food.kcalLabel': 'الطاقة',
    'food.protein': 'البروتين',
    'food.carbs': 'الكربوهيدرات',
    'food.fat': 'الدهون',
    'food.macroLine': 'ب {p} غ · ك {c} غ · د {f} غ',
    'food.totalsLine': '{total} · {entries}',
    'food.entries': '{n} إدخال',
    'food.entriesZero': '{n} إدخال',
    'food.entriesOne': 'إدخال واحد',
    'food.entriesTwo': 'إدخالان',
    'food.entriesFew': '{n} إدخالات',
    'food.entriesMany': '{n} إدخالًا',
    'food.entriesOther': '{n} إدخال',
    'food.emptyDay': 'لا شيء مسجّل في هذا اليوم.',
    'food.noSaved': 'لا توجد أطعمة محفوظة بعد.',
    'food.savedTitle': 'الأطعمة المحفوظة',
    'food.newTemplate': '+ طعام جديد',
    'food.editTemplate': 'تعديل الطعام المحفوظ',
    'food.deleteTemplate': 'حذف الطعام المحفوظ',
    'food.deleteTemplateConfirm': 'حذف «{name}» من أطعمتك المحفوظة؟ الإدخالات السابقة تحتفظ بقيمها.',
    'food.editEntry': 'تعديل الإدخال',
    'food.deleteEntry': 'حذف الإدخال',
    'food.deleteEntryConfirm': 'حذف «{name}» من هذا اليوم؟',
    'food.errName': 'أعطِ الطعام اسمًا.',
    'food.errNumber': 'يجب أن تكون القيم أرقامًا بين 0 و100000.',
    'food.errQty': 'يجب أن تكون الكمية أكبر من 0 وبحد أقصى 1000.',
    'food.disclaimer': 'هذه القيم كتبتها بنفسك. GymQuest لا يتحقّق من بيانات التغذية وليست لديه قاعدة بيانات أطعمة.',
    'food.prevDay': 'اليوم السابق',
    'food.nextDay': 'اليوم التالي',

    'tips.title': 'كيف تقرأ هذه الأرقام',
    'tips.t1Title': 'قياس الوزن بالطريقة نفسها دائمًا',
    'tips.t1Body': 'الميزان نفسه، والوقت نفسه من اليوم، وظروف متشابهة – كثيرون يزنون أنفسهم صباحًا قبل الأكل. الانتظام أهم بكثير من رقم واحد.',
    'tips.t2Title': 'تغيّر يوم واحد ليس اتجاهًا',
    'tips.t2Body': 'الوزن يتحرّك مع الماء والطعام في الأمعاء والملح، لذا قد يتغيّر خلال اليوم نفسه. قارن متوسطات أسبوعية، أو اليوم نفسه عبر عدة أسابيع، لترى شيئًا أقرب إلى اتجاه حقيقي.',
    'tips.t3Title': 'المدة والمجموعات والتكرارات والتحميل التدريجي',
    'tips.t3Body': 'المدة هي طول الجلسة. المجموعة هي مجموعة تكرارات. التكرارات هي عدد مرات تحريكك للوزن. التحميل التدريجي يعني أن تزيد قليلًا مع الوقت: وزن أكبر، أو تكرارات أكثر، أو أداء أفضل.',
    'tips.t4Title': 'ماذا يخبرك تقدير السعرات وماذا لا يخبرك',
    'tips.t4Body': 'يقدّر الطاقة التي قد يستهلكها شخص متوسط بقياساتك في اليوم. لا يستطيع قياس عمليات الأيض لديك، ولا يقول شيئًا عن جودة الطعام أو الصحة.',
    'tips.t5Title': 'ماذا تعني أرقامك الغذائية',
    'tips.t5Body': 'هي ملاحظاتك أنت، لا قياسات مخبرية. الحصص تقديرية، والملصقات تختلف، والوجبة نفسها قد تختلف بين يوم وآخر. مفيدة لملاحظة الأنماط، لا للمحاسبة الدقيقة.',
    'tips.foodTitle': 'عن القيم التي تكتبها',
    'tips.f1Title': 'إدخالك، أرقامك',
    'tips.f1Body': 'لا شيء هنا يُبحث عنه أو يُتحقّق منه. ما تكتبه هو ما تراه، فالمجاميع دقيقة بقدر تقديراتك.',
    'tips.f2Title': 'الأنماط أهم من الدقة',
    'tips.f2Body': 'سجلّ تقريبي لكن منتظم على مدى أسابيع يقول أكثر من يوم واحد موزون بدقة. الطعام ليس شيئًا يُستحق أو يُعوَّض بالتمرين.',
  },
};

function t(key, vars) {
  const dict = I18N[activeLang()] || I18N.en;
  let s = dict[key];
  if (s === undefined) s = I18N.en[key];
  if (s === undefined) s = I18N.sk[key];
  if (s === undefined) s = key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.split('{' + k + '}').join(String(v));
    }
  }
  return s;
}

/* ---------- Pluralizácia ----------
   Kategórie sa berú z Intl.PluralRules pre locale daného jazyka – je súčasťou
   prehliadača, funguje offline a nič sa nesťahuje. Kľúče nesú príponu presne
   podľa kategórie: Zero / One / Two / Few / Many / Other.
   Tvar "Other" je povinný v každom jazyku, takže chýbajúci tvar nikdy nemôže
   spadnúť na slovenský alebo anglický reťazec. */
const pluralCache = {};
const PLURAL_SLOTS = { zero: 'Zero', one: 'One', two: 'Two', few: 'Few', many: 'Many', other: 'Other' };

function pluralCategory(n) {
  const meta = langMeta(activeLang());
  try {
    if (!pluralCache[meta.locale]) pluralCache[meta.locale] = new Intl.PluralRules(meta.locale);
    const cat = pluralCache[meta.locale].select(Number(n));
    return PLURAL_SLOTS[cat] ? cat : 'other';
  } catch (e) {
    return Number(n) === 1 ? 'one' : 'other';   // bez Intl.PluralRules platí anglické pravidlo
  }
}

/* Ohnutý tvar bez doplnenia {n} – používa sa tam, kde sa číslo skladá zvlášť. */
function tPluralWord(base, n) {
  const dict = I18N[activeLang()] || I18N.en;
  const slot = PLURAL_SLOTS[pluralCategory(n)];
  if (dict[base + slot] !== undefined) return t(base + slot, { n });
  if (dict[base + 'Other'] !== undefined) return t(base + 'Other', { n });
  if (dict[base + 'Many'] !== undefined) return t(base + 'Many', { n });   // staršie kľúče
  return t(base, { n });
}

function tPlural(base, n) {
  return tPluralWord(base, n);
}

/* ---------- Dátumy, dni a mesiace ----------
   Zámerne vlastné tabuľky namiesto Intl.DateTimeFormat: výstup je rovnaký vo
   všetkých prehliadačoch, funguje offline a zodpovedá presnému formátu aplikácie.
   Logika kalendára (pondelok prvý) aj uložený formát dátumu "YYYY-MM-DD" sa nemenia. */
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_EN_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_SK_GEN = ['januára', 'februára', 'marca', 'apríla', 'mája', 'júna',
  'júla', 'augusta', 'septembra', 'októbra', 'novembra', 'decembra'];
const MONTHS_SK_NOM = ['Január', 'Február', 'Marec', 'Apríl', 'Máj', 'Jún',
  'Júl', 'August', 'September', 'Október', 'November', 'December'];
const MONTHS_SK_SHORT = ['jan.', 'feb.', 'mar.', 'apr.', 'máj', 'jún',
  'júl', 'aug.', 'sep.', 'okt.', 'nov.', 'dec.'];
const MONTHS_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const MONTHS_ES_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MONTHS_PT = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const MONTHS_PT_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const MONTHS_FR_SHORT = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

const LOCALE_DATA = {
  sk: {
    weekdays: ['Nedeľa', 'Pondelok', 'Utorok', 'Streda', 'Štvrtok', 'Piatok', 'Sobota'],
    weekdaysShort: ['Po', 'Ut', 'St', 'Št', 'Pi', 'So', 'Ne'],
    monthsNom: MONTHS_SK_NOM, monthsGen: MONTHS_SK_GEN, monthsShort: MONTHS_SK_SHORT,
    datePattern: '{d}. {monthGen} {y}',
    fullPattern: '{wd}, {d}. {monthGen} {y}',
    titlePattern: '{monthNom} {y}',
  },
  en: {
    weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    weekdaysShort: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    monthsNom: MONTHS_EN, monthsGen: MONTHS_EN, monthsShort: MONTHS_EN_SHORT,
    datePattern: '{monthShort} {d}, {y}',
    fullPattern: '{wd}, {monthGen} {d}, {y}',
    titlePattern: '{monthNom} {y}',
  },
  es: {
    weekdays: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
    weekdaysShort: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
    monthsNom: MONTHS_ES, monthsGen: MONTHS_ES, monthsShort: MONTHS_ES_SHORT,
    datePattern: '{d} {monthShort} {y}',
    fullPattern: '{wd}, {d} de {monthGen} de {y}',
    titlePattern: '{monthNom} {y}',
  },
  'pt-BR': {
    weekdays: ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'],
    weekdaysShort: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
    monthsNom: MONTHS_PT, monthsGen: MONTHS_PT, monthsShort: MONTHS_PT_SHORT,
    datePattern: '{d} {monthShort} {y}',
    fullPattern: '{wd}, {d} de {monthGen} de {y}',
    titlePattern: '{monthNom} {y}',
  },
  fr: {
    weekdays: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
    weekdaysShort: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
    monthsNom: MONTHS_FR, monthsGen: MONTHS_FR, monthsShort: MONTHS_FR_SHORT,
    datePattern: '{d} {monthShort} {y}',
    fullPattern: '{wd} {d} {monthGen} {y}',
    titlePattern: '{monthNom} {y}',
  },
  ar: {
    weekdays: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
    weekdaysShort: ['إث', 'ثل', 'أر', 'خم', 'جم', 'سب', 'أح'],
    monthsNom: MONTHS_AR, monthsGen: MONTHS_AR, monthsShort: MONTHS_AR,
    datePattern: '{d} {monthShort} {y}',
    fullPattern: '{wd}، {d} {monthGen} {y}',
    titlePattern: '{monthNom} {y}',
  },
};

function localeData() {
  return LOCALE_DATA[activeLang()] || LOCALE_DATA.en;
}

/* Pondelok = 0 … nedeľa = 6. Rovnaká konvencia, akú používa weekKey(). */
function mondayIndex(d) {
  return (d.getDay() + 6) % 7;
}

/* Vyplní jazykovú šablónu dátumu. Poradie dopĺňania nezáleží – názvy mesiacov
   ani dní neobsahujú zástupné symboly. */
function fillDatePattern(pattern, d, weekday) {
  const L = localeData();
  return pattern
    .split('{y}').join(String(d.getFullYear()))
    .split('{d}').join(String(d.getDate()))
    .split('{wd}').join(weekday || '')
    .split('{monthShort}').join(L.monthsShort[d.getMonth()])
    .split('{monthGen}').join(L.monthsGen[d.getMonth()])
    .split('{monthNom}').join(L.monthsNom[d.getMonth()]);
}

function formatDate(iso) {
  const d = parseDate(iso);
  return fillDatePattern(localeData().datePattern, d, '');
}

/* Číslo aktuálneho ISO týždňa – odvodené z toho istého pomocníka, aký používa
   týždenný cieľ, progres aj séria (weekKey/currentWeekKey). */
function currentIsoWeekNumber() {
  return Number(currentWeekKey().split('-W')[1]);
}

/* Plný dátum podľa aktuálneho jazyka: "Friday, September 18, 2026" / "Piatok, 18. septembra 2026".
   Zdieľa ho hlavička Dnes aj detail dňa v kalendári. */
function formatFullDate(d) {
  const L = localeData();
  return fillDatePattern(L.fullPattern, d, L.weekdays[d.getDay()]);
}

/* Dnešný dátum a ISO týždeň z lokálneho času zariadenia. */
function todayLabel() {
  return formatFullDate(new Date()) + ' · ' + t('dnes.weekOf', { n: currentIsoWeekNumber() });
}

/* ---------- Konstanty ---------- */

const STORAGE_KEY = 'gymquest';
const BASE_XP = 20;          // XP za tréning
const XP_PER_SET = 2;        // XP za každú dokončenú sériu
const XP_PER_LEVEL = 100;    // XP potrebných na ďalšiu úroveň
const GOAL_MIN = 1;
const GOAL_MAX = 7;
/* Gong smie zaznieť len za dokončenie, ktoré appka naozaj videla naživo.
   Bežiaci odpočet sa kontroluje každých 250 ms, takže 2 s tolerancia nepotlačí
   skutočné dokončenie – len oneskorený callback po návrate z pozadia. */
const TIMER_SOUND_GRACE_MS = 2000;

/* ---------- Stav aplikácie ---------- */

let state = null;
let activeTab = 'dnes';
let selectedPlan = 'push';
let durationInterval = null; // jediný interval pre zobrazenie trvania tréningu
let sessionNoteKey = null;   // práve zobrazená poznámka k aktívnej session (kľúč prekladu)
let sessionNoteTimer = null; // skrytie dočasnej poznámky
let lastXP = 0;
let lastUnlocked = [];
let lastAchXP = 0;           // XP získané z úspechov po poslednom tréningu
let lastWorkoutId = null;    // id posledného dokončeného tréningu (pre Undo)
let editingPlan = null;      // id plánu v editačnom móde
let newPlanId = null;        // id práve vytvoreného plánu (zrušenie ho zahodí); neukladá sa
let editDraft = null;        // kópia cvikov počas editácie
/* Režim úprav plánov: prepínač pod selektorom. Zámerne sa NEukladá –
   aplikácia vždy otvorí čistý výber plánu. */
let planManageMode = false;
let pendingImport = null;    // naimportované dáta čakajúce na potvrdenie
let pendingDeleteWorkout = null; // id tréningu čakajúceho na vymazanie
let timerInterval = null;
let timerEnd = 0;
/* Každé spustenie odpočtu má vlastné id. Dokončenie sa viaže na konkrétne id,
   takže starý odpočet sa nikdy nemôže "dokončiť" dvakrát ani po návrate z pozadia. */
let timerSessionId = 0;
let timerCompletedId = 0;      // id odpočtu, ktorého dokončenie už bolo spracované
let timerHiddenAt = 0;         // kedy sa stránka skryla (0 = je viditeľná)
let dayWatchInterval = null;   // jediný interval pre zmenu dňa (nikdy sa neduplikuje)
let lastRenderedDay = null;    // naposledy vykreslený lokálny deň "YYYY-MM-DD"
/* Stav kalendára – len v pamäti, zámerne sa neukladá (kalendár sa vždy otvára na aktuálnom mesiaci). */
let viewYear = new Date().getFullYear();
let viewMonth = new Date().getMonth();
let selectedDayKey = null;

/* ---------- Pomocné funkcie ---------- */

/* Lokálny kľúč dňa "YYYY-MM-DD". Zámerne z lokálnych zložiek – toISOString() je UTC
   a mohol by posunúť dátum o deň. */
function localDateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function todayISO() {
  return localDateKey(new Date());
}

function parseDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/* ISO rok + týždeň (pondelok = 1. deň), napr. "2026-W34" */
function weekKey(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayNum = (d.getDay() + 6) % 7; // pondelok = 0
  d.setDate(d.getDate() - dayNum + 3);
  const firstThursday = new Date(d.getFullYear(), 0, 4);
  const firstDayNum = (firstThursday.getDay() + 6) % 7;
  firstThursday.setDate(firstThursday.getDate() - firstDayNum + 3);
  const week = 1 + Math.round((d - firstThursday) / (7 * 24 * 3600 * 1000));
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

function prevWeekKey(key) {
  const [year, week] = key.split('-W').map(Number);
  const firstDay = new Date(year, 0, 4);
  const dayNum = (firstDay.getDay() + 6) % 7;
  firstDay.setDate(firstDay.getDate() - dayNum + 3);
  firstDay.setDate(firstDay.getDate() + (week - 1) * 7);
  return weekKey(addDays(firstDay, -7));
}

function currentWeekKey() {
  return weekKey(new Date());
}

function monthKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function currentMonthKey() {
  return monthKey(new Date());
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/* ---------- Dátumy pre ukážkové dáta ---------- */

function sampleDates() {
  const dates = [];
  const cur = parseDate(todayISO());
  const curWeek = weekKey(cur);
  // späť, kým nenájdeme pondelok predchádzajúceho týždňa
  let mon = new Date(cur);
  while (weekKey(mon) === curWeek) mon = addDays(mon, -1);
  while (weekKey(addDays(mon, -1)) === weekKey(mon)) mon = addDays(mon, -1);
  dates.push(mon, addDays(mon, 2), addDays(mon, 4)); // pondelok, streda, piatok
  return dates;
}

/* ---------- Ukážkové dáta (len prvý štart) ---------- */

function buildSampleHistory() {
  const dates = sampleDates();
  const order = activePlanIds().slice(0, 3);
  const weights = {
    'Bench press': 40, 'Tlaky nad hlavou': 25, 'Upažovanie': 8,
    'Príťahy v predklone': 40, 'Veslovanie na kladke': 35, 'Bicepsové zdvihy': 12,
    'Drepy': 50, 'Leg press': 80, 'Výpady': 10, 'Zakopávanie': 25, 'Lýtka': 40,
  };
  const history = [];
  order.forEach((planId, i) => {
    const plan = getPlan(planId);
    if (!plan) return;
    const exercises = plan.exercises.map(ex => ({
      name: ex.name,
      exId: (ex.id && BUILTIN_EXERCISE_IDS.has(ex.id)) ? ex.id : undefined,
      sets: ex.sets,
      reps: ex.reps,
      weight: weights[ex.name] !== undefined ? weights[ex.name] : ex.weight,
    }));
    history.push({
      id: uid(),
      planId: plan.id,
      planName: recordedPlanName(plan),
      date: dates[i].toISOString().slice(0, 10),
      xp: BASE_XP + exercises.reduce((sum, e) => sum + e.sets, 0) * XP_PER_SET,
      note: '',
      exercises: exercises.map(e => Object.assign({}, e, { setsDone: e.sets })),
    });
  });
  return history;
}

/* ---------- Načítanie / ukladanie stavu / migrácia ---------- */

/* Normalizuje minúty/sekundy vlastného času pauzy. Sekundy >= 60 sa prenesú do minút,
   hodnoty sa orežú na 0..60 min / 0..59 s. Čisto aritmetická – nevkladá žiadny default. */
function normalizeCustomRest(min, sec) {
  let m = Math.floor(Number(min));
  let s = Math.floor(Number(sec));
  if (!Number.isFinite(m) || m < 0) m = 0;
  if (!Number.isFinite(s) || s < 0) s = 0;
  m += Math.floor(s / 60);
  s = s % 60;
  if (m > 60) { m = 60; s = 0; }
  return { minutes: m, seconds: s };
}

function defaultState() {
  return {
    version: 3,
    plans: JSON.parse(JSON.stringify(DEFAULT_PLANS)),
    planOrder: DEFAULT_PLAN_ORDER.slice(),
    history: [],
    excusedWeeks: [],
    goalHistory: {},     // ISO týždeň -> cieľ platný v tom týždni (snapshot pre vyhodnotenie série)
    legacyGoal: null,    // cieľ spred zavedenia snapshotov; null = nový používateľ bez histórie
    /* Voliteľné rozšírenia (telo, jedlo, profil). Všetko začína prázdne –
       žiadna hodnota sa nikdy neháda ani nepredplňa. */
    measurements: [],    // telesné miery, kanonicky v kg a cm
    foods: [],           // vlastné potraviny používateľa (šablóny)
    foodLog: {},         // "YYYY-MM-DD" -> [záznamy]
    profile: {
      heightCm: null, ageYears: null, sex: null, isAdult: null, activity: null,
      lastCalcAt: null, calcKey: null,
    },
    settings: {
      weeklyGoal: 3, lang: 'en', restSound: false, restSoundLength: 'standard',
      customRestMinutes: 2, customRestSeconds: 30,
      /* Automatické zálohovanie: voliteľné, predvolene VYPNUTÉ. */
      autoBackup: false, autoBackupOfferedAt: null, autoBackupWorkoutCount: 0,
      /* Jednotky telesných mier (nie váh cvikov). Voliteľné funkcie: VYPNUTÉ. */
      bodyUnits: 'metric', foodLogEnabled: false, calorieEnabled: false,
    },
    achievements: {},
    demo: false,
    activeSession: null, // rozbehnutý tréning (trvá iba do dokončenia alebo potvrdeného resetu)
  };
}

/* ---------- Telesné miery, potraviny a profil ----------
   Voliteľné rozšírenia. Normalizácia je NEDEŠTRUKTívna: platná hodnota zostane
   presne taká, aká bola, neplatná sa nahradí prázdnom (null) alebo nulou.
   Nič sa nedopočítava, nič sa neháda a žiadny záznam sa nezahadzuje. */

/* Kanonické jednotky: hmotnosť v kg, obvody v cm. Zmena zobrazovaných jednotiek
   nikdy neprepíše uložené hodnoty, takže sa staré záznamy nikdy "nepreinterpretujú". */
const MEASURE_FIELDS = [
  'weightKg', 'waistCm', 'chestCm', 'armLeftCm', 'armRightCm', 'thighLeftCm', 'thighRightCm', 'hipCm',
];
const MEASURE_LIMITS = {
  weightKg: [1, 500],
  waistCm: [1, 400], chestCm: [1, 400],
  armLeftCm: [1, 400], armRightCm: [1, 400],
  thighLeftCm: [1, 400], thighRightCm: [1, 400], hipCm: [1, 400],
};
const KG_PER_LB = 0.45359237;
const CM_PER_IN = 2.54;

/* Skutočný kalendárny deň (nie len tvar reťazca): 2026-02-31 neprejde. */
function isDateKey(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = parseDate(value);
  return Number.isFinite(d.getTime()) && localDateKey(d) === value;
}

/* Vráti číslo v medziach alebo null. Platnú hodnotu nikdy nemení. */
function cleanMeasureValue(field, value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  const lim = MEASURE_LIMITS[field];
  if (!Number.isFinite(n) || n < lim[0] || n > lim[1]) return null;
  return Math.round(n * 100) / 100;
}

function cleanMeasurement(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const id = typeof raw.id === 'string' && raw.id ? raw.id : null;
  if (!id || !isDateKey(raw.date)) return null;
  const out = { id, date: raw.date };
  for (const f of MEASURE_FIELDS) out[f] = cleanMeasureValue(f, raw[f]);
  out.note = typeof raw.note === 'string' ? raw.note : '';
  return out;   // prázdny záznam sa necháva – používateľ si ho môže vymazať sám
}

function cleanMacro(value, max) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > max) return 0;
  return Math.round(n * 10) / 10;
}

function cleanFood(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const id = typeof raw.id === 'string' && raw.id ? raw.id : null;
  const name = typeof raw.name === 'string' ? raw.name.trim() : '';
  if (!id || !name) return null;
  return {
    id, name,
    kcal: cleanMacro(raw.kcal, 100000),
    protein: cleanMacro(raw.protein, 10000),
    carbs: cleanMacro(raw.carbs, 10000),
    fat: cleanMacro(raw.fat, 10000),
  };
}

function cleanFoodEntry(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const id = typeof raw.id === 'string' && raw.id ? raw.id : null;
  if (!id) return null;
  const qtyRaw = Number(raw.qty);
  const qty = (Number.isFinite(qtyRaw) && qtyRaw > 0 && qtyRaw <= 1000) ? Math.round(qtyRaw * 100) / 100 : 1;
  return {
    id,
    foodId: typeof raw.foodId === 'string' && raw.foodId ? raw.foodId : null,
    name: typeof raw.name === 'string' ? raw.name : '',
    kcal: cleanMacro(raw.kcal, 1000000),
    protein: cleanMacro(raw.protein, 100000),
    carbs: cleanMacro(raw.carbs, 100000),
    fat: cleanMacro(raw.fat, 100000),
    qty,
  };
}

function cleanFoodLog(raw) {
  const out = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  for (const key of Object.keys(raw)) {
    if (!isDateKey(key)) continue;
    const arr = Array.isArray(raw[key]) ? raw[key].map(cleanFoodEntry).filter(Boolean) : [];
    if (arr.length) out[key] = arr;   // prázdny deň sa neukladá, aby dáta nerástli
  }
  return out;
}

function cleanProfile(raw) {
  const base = (raw && typeof raw === 'object' && !Array.isArray(raw)) ? raw : {};
  const h = Number(base.heightCm);
  const a = Number(base.ageYears);
  const t = Number(base.lastCalcAt);
  return {
    heightCm: (Number.isFinite(h) && h >= 50 && h <= 260) ? Math.round(h * 10) / 10 : null,
    ageYears: (Number.isFinite(a) && a >= 1 && a <= 120) ? Math.round(a) : null,
    sex: (base.sex === 'male' || base.sex === 'female') ? base.sex : null,
    isAdult: (base.isAdult === true || base.isAdult === false) ? base.isAdult : null,
    activity: ACTIVITY_LEVELS.some((x) => x.id === base.activity) ? base.activity : null,
    lastCalcAt: (Number.isFinite(t) && t > 0) ? t : null,
    calcKey: typeof base.calcKey === 'string' ? base.calcKey : null,
  };
}

/* ---------- Jednotky telesných mier ---------- */
function bodyUnits() {
  return (state && state.settings && state.settings.bodyUnits === 'imperial') ? 'imperial' : 'metric';
}

/* kg -> zobrazovaná hmotnosť, cm -> zobrazovaná dĺžka. Zdroj je VŽDY kg/cm. */
function weightToDisplay(kg) {
  if (kg === null || kg === undefined) return null;
  return bodyUnits() === 'imperial' ? kg / KG_PER_LB : kg;
}
function weightFromDisplay(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.round((bodyUnits() === 'imperial' ? n * KG_PER_LB : n) * 100) / 100;
}
function lengthToDisplay(cm) {
  if (cm === null || cm === undefined) return null;
  return bodyUnits() === 'imperial' ? cm / CM_PER_IN : cm;
}
function lengthFromDisplay(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.round((bodyUnits() === 'imperial' ? n * CM_PER_IN : n) * 100) / 100;
}

function weightUnitLabel() { return bodyUnits() === 'imperial' ? t('units.lb') : t('units.kg'); }
function lengthUnitLabel() { return bodyUnits() === 'imperial' ? t('units.in') : t('units.cm'); }

/* Jedno desatinné miesto, zobrazované jednotky. */
function formatMeasure(value, kind) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return '—';
  const shown = kind === 'weight' ? weightToDisplay(Number(value)) : lengthToDisplay(Number(value));
  return (Math.round(shown * 10) / 10).toFixed(1);
}

/* ---------- Počítané údaje pre telo a jedlo ---------- */
/* Chronologicky podľa dátum; pri viacerých zápisoch v ten istý deň rozhoduje
   poradie zápisu (Array.prototype.sort je stabilný), nie náhodné id. */
function sortedMeasurements() {
  return [...(state.measurements || [])].sort((a, b) => a.date.localeCompare(b.date));
}

/* Chronologické body jednej miery (len vyplnené hodnoty). */
function measureSeries(field) {
  return sortedMeasurements()
    .filter((m) => m[field] !== null && m[field] !== undefined)
    .map((m) => ({ date: m.date, value: m[field] }));
}

function latestMeasurement() {
  const list = sortedMeasurements().filter((m) => MEASURE_FIELDS.some((f) => m[f] !== null));
  return list.length ? list[list.length - 1] : null;
}

function measurementById(id) {
  return (state.measurements || []).find((m) => m.id === id) || null;
}

function foodById(id) {
  return (state.foods || []).find((f) => f.id === id) || null;
}

function foodEntriesFor(dateKey) {
  const log = state.foodLog || {};
  return Array.isArray(log[dateKey]) ? log[dateKey] : [];
}

function foodTotals(entries) {
  const sum = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
  for (const e of entries || []) {
    const q = Number(e.qty) > 0 ? Number(e.qty) : 1;
    sum.kcal += Number(e.kcal) * q;
    sum.protein += Number(e.protein) * q;
    sum.carbs += Number(e.carbs) * q;
    sum.fat += Number(e.fat) * q;
  }
  sum.kcal = Math.round(sum.kcal);
  sum.protein = Math.round(sum.protein * 10) / 10;
  sum.carbs = Math.round(sum.carbs * 10) / 10;
  sum.fat = Math.round(sum.fat * 10) / 10;
  return sum;
}

/* Hrubý odhad veľkosti uložených dát – len na včasné varovanie, nikdy sa nemaže. */
function storageBytes() {
  try { return JSON.stringify(state).length; } catch (e) { return 0; }
}
const STORAGE_NOTICE_BYTES = 3500000;

/* Rozbehnutá session: buď platný objekt, alebo null. Poškodené/neúplné dáta sa zahodia. */
function normalizeActiveSession(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const startedAt = Number(raw.startedAt);
  const planId = typeof raw.planId === 'string' ? raw.planId : '';
  if (!planId || !Number.isFinite(startedAt) || startedAt <= 0) return null;
  const pickMarks = (src) => {
    const out = {};
    if (src && typeof src === 'object' && !Array.isArray(src)) {
      for (const [key, val] of Object.entries(src)) {
        if (val === true && /:\d+(?::[LR])?$/.test(key)) out[key] = true;
      }
    }
    return out;
  };
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : uid(),
    startedAt,
    planId,
    planName: typeof raw.planName === 'string' ? raw.planName : '',
    completedSets: pickMarks(raw.completedSets),
    actualFailureSets: pickMarks(raw.actualFailureSets),
  };
}

function seedSampleData() {
  if (state.history.length === 0) {
    state.history = buildSampleHistory();
    state.demo = true;
  }
  reconcileAchievements();
  saveState();
}

function removeDemoData() {
  state.history = [];
  state.achievements = {};
  state.demo = false;
  state.excusedWeeks = [];
  localStorage.removeItem(STORAGE_KEY + '_seeded');
  reconcileAchievements();
  saveState();
}

/* Zjednotí plány: doplní builtin/customName, zjednotí poradie a odstráni neplatné záznamy.
   Nikdy nemení používateľské názvy ani históriu. Beží pri každom načítaní (je idempotentná). */
function normalizePlans() {
  if (!state.plans || typeof state.plans !== 'object') {
    state.plans = JSON.parse(JSON.stringify(DEFAULT_PLANS));
  }
  for (const id of Object.keys(state.plans)) {
    if (!state.plans[id] || typeof state.plans[id] !== 'object') delete state.plans[id];
  }
  for (const id of Object.keys(state.plans)) {
    const plan = state.plans[id];
    plan.id = id;
    if (typeof plan.builtin !== 'boolean') plan.builtin = BUILTIN_PLAN_IDS.includes(id);
    if (typeof plan.customName !== 'string' || !plan.customName) {
      // v2 mal pole name, ktoré sa nikdy nezobrazovalo. Stane sa vlastným názvom, ale len ak
      // nejde o pôvodný názov zabudovaného plánu – ten sa musí ďalej prekladať.
      const legacy = typeof plan.name === 'string' ? plan.name.trim() : '';
      if (plan.builtin) plan.customName = (legacy && !isBuiltinPlanLabel(id, legacy)) ? legacy : null;
      else plan.customName = legacy || t('plan.newName');
    }
    delete plan.name;
    if (!Array.isArray(plan.exercises)) plan.exercises = [];
  }
  const ids = Object.keys(state.plans);
  const order = Array.isArray(state.planOrder) ? state.planOrder.filter(id => ids.includes(id)) : [];
  for (const id of ids) if (!order.includes(id)) order.push(id);
  state.planOrder = order;
}

/* Doplní id/flagy cvikov v plánoch a exId/planName v histórii. Zapísané názvy nikdy nemení. */
function backfillState() {
  normalizePlans();
  normalizeGoalHistory();
  syncGoalSnapshot();
  for (const id of Object.keys(state.plans)) {
    const plan = state.plans[id];
    plan.exercises = plan.exercises.map(ex => {
      let next = ex;
      if (next.id && BUILTIN_EXERCISE_IDS.has(next.id)) {
        next = Object.assign({}, next, { builtin: true });
      } else {
        const mapped = BUILTIN_NAME_TO_ID[next.name];
        if (mapped) next = Object.assign({}, next, { id: mapped, builtin: true });
      }
      /* Jednostranné cvičenie: idempotentná normalizácia. Cvik bez tohto nastavenia
         zostáva presne taký, aký bol – žiadne nové polia sa mu nepridávajú. */
      if (next.unilateral === true) {
        next = Object.assign({}, next, {
          unilateral: true,
          startSide: next.startSide === 'right' ? 'right' : 'left',
        });
      } else if (next.unilateral !== undefined || next.startSide !== undefined) {
        next = Object.assign({}, next);
        delete next.unilateral;
        delete next.startSide;
      }
      return Object.assign({}, next, {
        plannedFailureSets: cleanFailureSets(next.plannedFailureSets, next.sets),
      });
    });
  }
  if (!Array.isArray(state.history)) return;
  state.history = state.history.map(w => {
    let out = w;
    if (typeof out.planName !== 'string' || !out.planName) {
      const plan = state.plans[out.planId];
      const snapshot = plan ? recordedPlanName(plan) : (BUILTIN_PLAN_NAMES[out.planId] || '');
      if (snapshot) out = Object.assign({}, out, { planName: snapshot });
    }
    /* Trvanie: existujúce platné hodnoty sa ponechajú, poškodené sa zahodia.
       Starým tréningom sa hodnota NIKDY nevymýšľa – ostanú bez trvania. */
    if (Object.prototype.hasOwnProperty.call(out, 'durationSeconds')) {
      const seconds = cleanDurationSeconds(out.durationSeconds);
      if (seconds === null) {
        out = Object.assign({}, out);
        delete out.durationSeconds;
      } else if (seconds !== out.durationSeconds) {
        out = Object.assign({}, out, { durationSeconds: seconds });
      }
    }
    if (!Array.isArray(out.exercises)) return out;
    const exercises = out.exercises.map(e => {
      let next = e;
      if (!next.exId) {
        const mapped = BUILTIN_NAME_TO_ID[next.name];
        if (mapped) next = Object.assign({}, next, { exId: mapped });
      }
      /* Staré záznamy bez polí do zlyhania sa nechávajú presne tak, ako sú – pridávame
         polia len tam, kde už existujú, a len normalizujeme ich obsah. */
      if (Object.prototype.hasOwnProperty.call(next, 'actualFailureSets')
        || Object.prototype.hasOwnProperty.call(next, 'plannedFailureSets')) {
        next = Object.assign({}, next, {
          plannedFailureSets: cleanFailureSets(next.plannedFailureSets, next.sets),
          actualFailureSets: cleanFailureSets(next.actualFailureSets, next.sets),
        });
      }
      return next;
    });
    return Object.assign({}, out, { exercises });
  });
}

/* v1 -> v2: pôvodné dáta sú reálne používateľské dáta, nikdy nie demo. */
function migrateV1toV2(parsed) {
  const base = defaultState();
  return {
    version: 2,
    plans: parsed.plans || base.plans,
    planOrder: null,
    history: Array.isArray(parsed.history) ? parsed.history : [],
    excusedWeeks: Array.isArray(parsed.excusedWeeks) ? parsed.excusedWeeks : [],
    settings: { weeklyGoal: 3, lang: 'sk' },
    achievements: {},
    demo: false,
  };
}

/* v2 -> v3 (a zároveň oprava neúplných v3 dát): poradie plánov, builtin/customName a
   záznam planName v histórii. Historické záznamy sa neprepisujú. */
function migrateV2toV3(parsed) {
  const base = (parsed && typeof parsed === 'object') ? parsed : {};
  const plans = (base.plans && typeof base.plans === 'object')
    ? base.plans
    : JSON.parse(JSON.stringify(DEFAULT_PLANS));
  const out = {
    version: 3,
    plans,
    planOrder: Array.isArray(base.planOrder)
      ? base.planOrder
      : DEFAULT_PLAN_ORDER.filter(id => Object.prototype.hasOwnProperty.call(plans, id)),
    history: Array.isArray(base.history) ? base.history : [],
    excusedWeeks: Array.isArray(base.excusedWeeks) ? base.excusedWeeks : [],
    goalHistory: (base.goalHistory && typeof base.goalHistory === 'object' && !Array.isArray(base.goalHistory))
      ? base.goalHistory
      : {},
    legacyGoal: null,
    settings: Object.assign({ weeklyGoal: 3, lang: 'sk' }, base.settings || {}),
    achievements: (base.achievements && typeof base.achievements === 'object') ? base.achievements : {},
    demo: base.demo === true,
    activeSession: normalizeActiveSession(base.activeSession),
    /* Voliteľné rozšírenia: stará záloha bez nich naimportuje prázdne polia.
       Platné záznamy zostávajú presne také, aké boli. */
    measurements: Array.isArray(base.measurements) ? base.measurements.map(cleanMeasurement).filter(Boolean) : [],
    foods: Array.isArray(base.foods) ? base.foods.map(cleanFood).filter(Boolean) : [],
    foodLog: cleanFoodLog(base.foodLog),
    profile: cleanProfile(base.profile),
  };
  const goal = Math.round(Number(out.settings.weeklyGoal));
  out.settings.weeklyGoal = Math.min(GOAL_MAX, Math.max(GOAL_MIN, Number.isFinite(goal) && goal ? goal : 3));
  /* Jazyk: platný kód sa zachová presne (vrátane starých 'sk'/'en'), neplatná
     alebo chýbajúca hodnota bezpečne spadne na angličtinu. */
  out.settings.lang = normalizeLang(out.settings.lang);
  /* Zvuk po skončení pauzy: predvolene VYPNUTÝ; zapnutý je len explicitné true. */
  if (out.settings.restSound !== true) out.settings.restSound = false;
  /* Dĺžka zvuku: len short/standard/long, predvolene standard. */
  if (out.settings.restSoundLength !== 'short' && out.settings.restSoundLength !== 'long') {
    out.settings.restSoundLength = 'standard';
  }
  /* Vlastný čas pauzy: normalizuje sekundy aj poškodené hodnoty; pri nule sa vráti default 2:30. */
  const cr = normalizeCustomRest(out.settings.customRestMinutes, out.settings.customRestSeconds);
  out.settings.customRestMinutes = (cr.minutes === 0 && cr.seconds === 0) ? 2 : cr.minutes;
  out.settings.customRestSeconds = (cr.minutes === 0 && cr.seconds === 0) ? 30 : cr.seconds;
  /* Automatické zálohovanie: len explicitné true ho zapne (predvolene vypnuté).
     Kniha záloh sa normalizuje nedeštruktívne – chýbajúca alebo poškodená
     hodnota sa nahradí východiskom, platná sa zachová presne. */
  if (out.settings.autoBackup !== true) out.settings.autoBackup = false;
  const backupOffered = Number(out.settings.autoBackupOfferedAt);
  out.settings.autoBackupOfferedAt = (Number.isFinite(backupOffered) && backupOffered > 0) ? backupOffered : null;
  const backupCount = Math.round(Number(out.settings.autoBackupWorkoutCount));
  out.settings.autoBackupWorkoutCount = (Number.isFinite(backupCount) && backupCount >= 0) ? backupCount : 0;
  /* Jednotky telesných mier a voliteľné funkcie: platí len explicitná hodnota. */
  if (out.settings.bodyUnits !== 'imperial') out.settings.bodyUnits = 'metric';
  if (out.settings.foodLogEnabled !== true) out.settings.foodLogEnabled = false;
  if (out.settings.calorieEnabled !== true) out.settings.calorieEnabled = false;
  /* Cieľ pre týždne spred zavedenia snapshotov. Je to ODVODENÁ hodnota (nie zaznamenaná)
     a zmrazí sa presne raz – pri prvom načítaní. Nikdy sa neprepočítava, takže neskoršia
     zmena cieľa nemôže prepísať už uzavreté týždne. */
  out.legacyGoal = (base.legacyGoal === undefined || base.legacyGoal === null)
    ? out.settings.weeklyGoal
    : Math.min(GOAL_MAX, Math.max(GOAL_MIN, Math.round(Number(base.legacyGoal)) || out.settings.weeklyGoal));
  out.history = out.history.map(w => Object.assign({}, w, {
    note: typeof w.note === 'string' ? w.note : '',
    exercises: Array.isArray(w.exercises)
      ? w.exercises.map(e => Object.assign({}, e, {
        setsDone: typeof e.setsDone === 'number' ? e.setsDone : e.sets,
      }))
      : [],
  }));
  state = out;
  backfillState();
  return out;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      state = defaultState();
      saveState();
      return;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') throw new Error('bad data');
    if (parsed.version === 1) {
      state = migrateV2toV3(migrateV1toV2(parsed));
    } else if (parsed.version === 2 || parsed.version === 3) {
      state = migrateV2toV3(parsed);
    } else {
      state = defaultState();
      saveState();
      return;
    }
    reconcileAchievements();
    saveState();
  } catch (e) {
    state = defaultState();
    saveState();
  }
}

/* Uloženie nikdy nesmie zlyhať potichu – ak prehliadač zápis odmietne,
   používateľ to musí vidieť, inak si myslí, že premenovanie/ cieľ nefunguje. */
function showStorageWarning(on) {
  const el = document.getElementById('app-storage-warning');
  if (el) el.hidden = !on;
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    showStorageWarning(false);
  } catch (e) {
    console.error('Nepodarilo sa uložiť dáta:', e);
    showStorageWarning(true);
  }
}

/* ---------- Počítané údaje ---------- */

function weeklyGoal() {
  return state.settings.weeklyGoal;
}

/* Cieľ, ktorý platí pre daný ISO týždeň.
   Prebiehajúci týždeň používa živé nastavenie (dá sa ešte zmeniť), uzavreté týždne používajú
   snapshot z toho času – takže zmena cieľa nikdy neprepíše, ako sa vyhodnotili minulé týždne. */
function goalForWeek(key) {
  if (key === currentWeekKey()) return weeklyGoal();
  const snap = state.goalHistory ? state.goalHistory[key] : undefined;
  if (Number.isInteger(snap)) return snap;
  // týždeň spred zavedenia snapshotov: zmrazená odvodená hodnota (nikdy sa nemení)
  if (Number.isInteger(state.legacyGoal)) return state.legacyGoal;
  return weeklyGoal();
}

function isWeekExcused(key) {
  return state.excusedWeeks.includes(key);
}

/* Zapíše cieľ pre práve bežiaci týždeň. Minulé týždne nikdy neprepisuje. */
function syncGoalSnapshot() {
  if (!state.goalHistory) state.goalHistory = {};
  const key = currentWeekKey();
  const goal = weeklyGoal();
  if (state.goalHistory[key] !== goal) state.goalHistory[key] = goal;
}

/* Opraví tvar goalHistory. Nikdy nedopĺňa vymyslené hodnoty, len zahodí neplatné záznamy. */
function normalizeGoalHistory() {
  if (!state.goalHistory || typeof state.goalHistory !== 'object' || Array.isArray(state.goalHistory)) {
    state.goalHistory = {};
    return;
  }
  for (const key of Object.keys(state.goalHistory)) {
    const val = Math.round(Number(state.goalHistory[key]));
    if (!/^\d{4}-W\d{2}$/.test(key) || !Number.isFinite(val) || val < GOAL_MIN || val > GOAL_MAX) {
      delete state.goalHistory[key];
    } else {
      state.goalHistory[key] = val;
    }
  }
}

/* XP získané tréningmi. Zámerne bez XP za úspechy, aby sa úspechy nepočítali samy zo seba. */
function workoutXP() {
  return state.history.reduce((sum, w) => sum + w.xp, 0);
}

/* XP za získané úspechy. Odvodené z množiny id (nie akumulované), takže sa nikdy nepripíše dvakrát. */
function achievementXP() {
  const earned = state.achievements || {};
  let sum = 0;
  for (const def of staticAchievementDefs()) {
    if (earned[def.id]) sum += def.xp || 0;
  }
  return sum;
}

function totalXP() {
  return workoutXP() + achievementXP();
}

function workoutsInWeek(key) {
  return state.history.filter(w => weekKey(parseDate(w.date)) === key).length;
}

function workoutsInMonth(key) {
  return state.history.filter(w => monthKey(parseDate(w.date)) === key).length;
}

/* Séria = počet po sebe idúcich DOKONČENÝCH ISO týždňov, v ktorých bol splnený cieľ.

   Prebiehajúci týždeň sériu NIKDY nepreruší: ak cieľ ešte nie je splnený, preskočí sa;
   ak už splnený je, počíta sa hneď. Prerušiť sériu môže len týždeň, ktorý sa už skončil.
   "Dokončený" vyplýva výhradne z pozície v prechádzaní (všetko pred aktuálnym týždňom),
   nie z hodín ani z udalosti o polnoci – preto nezáleží na tom, či bola appka otvorená. */
function computeStreak() {
  const current = currentWeekKey();
  let week = current;
  let streak = 0;
  let activeWeek = true;    // true len pri prvom kroku = prebiehajúci týždeň

  for (let guard = 0; guard < 1040; guard++) {   // 20 rokov; poškodený kľúč nikdy nezacyklí appku
    const met = workoutsInWeek(week) >= goalForWeek(week);

    if (met) {
      streak++;                                  // cieľ splnený -> počíta sa (aj prebiehajúci týždeň)
    } else if (isWeekExcused(week)) {
      // ospravedlnený týždeň: sériu zachová, ale nikdy ju nepredĺži
    } else if (activeWeek) {
      // týždeň ešte len beží -> nikdy nie je neúspech
    } else {
      break;                                     // dokončený týždeň bez splneného cieľa -> séria končí
    }

    activeWeek = false;
    week = prevWeekKey(week);
  }
  return streak;
}

/* Existuje aspoň jeden DOKONČENÝ týždeň, ktorý splnil svoj vtedajší cieľ?
   Rozhoduje medzi textom "séria sa skončila" a "začni sériu". Aktuálny týždeň sa nepočíta. */
function hasCompletedGoalWeek() {
  const current = currentWeekKey();
  const weeks = new Set(state.history.map(w => weekKey(parseDate(w.date))));
  for (const k of weeks) {
    if (k === current) continue;
    if (workoutsInWeek(k) >= goalForWeek(k)) return true;
  }
  return false;
}

function levelInfo() {
  const xp = totalXP();
  let level = 0;
  let levelXP = xp;
  while (levelXP >= XP_PER_LEVEL) {
    levelXP -= XP_PER_LEVEL;
    level++;
  }
  return { level, levelXP, xp, total: XP_PER_LEVEL };
}

/* Odporúčaný tréning: nasleduje poradie, ktoré si používateľ nastavil (3, 4 alebo viac plánov) */
function recommendedPlan() {
  const ids = activePlanIds();
  if (!ids.length) return null;
  if (!state.history.length) return ids[0];
  const last = state.history[state.history.length - 1];
  const idx = ids.indexOf(last.planId);
  if (idx === -1) return ids[0];   // posledný tréning patril zmazanému plánu – začni odznova
  return ids[(idx + 1) % ids.length];
}

function personalRecords() {
  const rec = {};
  for (const w of state.history) {
    for (const ex of w.exercises) {
      if (ex.weight <= 0) continue;
      const key = ex.name;
      const prev = rec[key];
      if (!prev || ex.weight > prev.weight) {
        rec[key] = { name: ex.name, weight: ex.weight, reps: ex.reps, date: w.date };
      }
    }
  }
  return Object.values(rec).sort((a, b) => b.weight - a.weight);
}

/* Patrí historický záznam k danému plánu?
   Rozhoduje stabilné planId, ktoré sa premenovaním plánu nikdy nemení.
   Veľmi staré záznamy bez planId sa priradia len vtedy, keď ich uložený názov
   presne zodpovedá tomuto plánu – tak nikdy nevznikne porovnanie medzi dvoma plánmi. */
function samePlanAsHistory(w, plan, planId) {
  if (!w) return false;
  if (w.planId) return w.planId === planId;
  if (!plan || !w.planName) return false;
  return w.planName === recordedPlanName(plan) || w.planName === planDisplayName(plan);
}

/* Najnovší výskyt cviku v histórii pred daným dátumom – VŽDY z toho istého plánu.
   Porovnáva sa stabilné id plánu a stabilné id cviku; bez id platí zhoda názvu.
   Ak plán pre tento cvik predchádzajúci záznam nemá, vráti null (žiadne porovnanie). */
function previousWorkoutFor(ex, beforeDate, planId) {
  const plan = getPlan(planId);
  const sorted = [...state.history]
    .filter(w => w.date < beforeDate && samePlanAsHistory(w, plan, planId))
    .sort((a, b) => b.date.localeCompare(a.date));
  for (const w of sorted) {
    const found = w.exercises.find(e =>
      (ex.id && e.exId === ex.id) || (!ex.id && e.name === ex.name)
    );
    if (found) return found;
  }
  return null;
}

/* ---------- Úspechy (dynamické, uložené) ---------- */

/* ---------- Pomocné výpočty pre úspechy ---------- */

/* Počet ISO kalendárnych týždňov s aspoň `min` dokončenými tréningami.
   Každý týždeň sa počíta raz a NIKDY nezávisí od týždenného cieľa. */
function isoWeeksWithAtLeast(min) {
  const counts = {};
  for (const w of state.history) {
    const k = weekKey(parseDate(w.date));
    counts[k] = (counts[k] || 0) + 1;
  }
  return Object.keys(counts).filter(k => counts[k] >= min).length;
}

/* Dátum posledného tréningu v n-tom kvalifikovanom týždni (týždeň s aspoň `min` tréningami). */
function nthQualifyingWeekDate(min, n) {
  const counts = {};
  for (const w of state.history) {
    const k = weekKey(parseDate(w.date));
    counts[k] = (counts[k] || 0) + 1;
  }
  const weeks = Object.keys(counts).filter(k => counts[k] >= min).sort();
  if (weeks.length < n) return null;
  const wk = weeks[n - 1];
  const dates = state.history.filter(w => weekKey(parseDate(w.date)) === wk).map(w => w.date).sort();
  return dates.length ? dates[dates.length - 1] : null;
}

function sortedHistory() {
  return [...state.history].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
}

/* Jedna chronologická prechádzka históriou: osobné rekordy (prekonanie vlastného maxima)
   a zlepšenia oproti vlastnému predchádzajúcemu zápisu. Kľúč je stabilné exId, inak názov. */
function prStats() {
  const best = {};
  const last = {};
  let prEvents = 0;
  let improvements = 0;
  const prDates = [];
  let improveDate = null;
  for (const w of sortedHistory()) {
    for (const ex of w.exercises) {
      if (!ex || !(ex.weight > 0)) continue;
      const key = ex.exId || ex.name;
      if (best[key] === undefined || ex.weight > best[key]) {
        best[key] = ex.weight;
        prEvents++;
        prDates.push(w.date);
      }
      if (last[key] !== undefined && ex.weight > last[key]) {
        improvements++;
        if (!improveDate) improveDate = w.date;
      }
      last[key] = ex.weight;
    }
  }
  return { prEvents, improvements, prDates, improveDate };
}

/* Vlastné (používateľom vytvorené) plány – zabudované majú builtin === true a nerátajú sa. */
function customPlanCount() {
  let n = 0;
  for (const id of Object.keys(state.plans)) {
    const plan = getPlan(id);
    if (plan && plan.builtin === false) n++;
  }
  return n;
}

/* Rôzne vlastné cviky naprieč všetkými plánmi. Za zabudovaný sa považuje cvik so stabilným id. */
function distinctCustomExerciseCount() {
  const seen = {};
  for (const id of Object.keys(state.plans)) {
    const plan = getPlan(id);
    if (!plan || !Array.isArray(plan.exercises)) continue;
    for (const ex of plan.exercises) {
      const builtin = !!(ex.id && BUILTIN_EXERCISE_IDS.has(ex.id));
      const name = String(ex.name || '').trim();
      if (!builtin && name) seen[name.toLowerCase()] = true;
    }
  }
  return Object.keys(seen).length;
}

/* Rôzne plánové id v histórii. planId je stabilné a nikdy sa neprepisuje,
   takže premenovanie ani zmazanie plánu tento údaj nezmení. */
function distinctPlanIdsInHistory() {
  const seen = {};
  for (const w of state.history) if (w.planId) seen[w.planId] = true;
  return Object.keys(seen).length;
}

function nthDistinctPlanDate(n) {
  const seen = {};
  for (const w of sortedHistory()) {
    if (!w.planId) continue;
    if (!seen[w.planId]) {
      seen[w.planId] = true;
      if (Object.keys(seen).length === n) return w.date;
    }
  }
  return null;
}

/* Jedinečné dátumy tréningov, zoradené. Iba dátum (YYYY-MM-DD), žiadny čas ani časové pásmo. */
function workoutDates() {
  const seen = {};
  for (const w of state.history) if (w.date) seen[w.date] = true;
  return Object.keys(seen).sort();
}

function gapDaysBetween(a, b) {
  return Math.round((parseDate(b) - parseDate(a)) / 86400000);
}

/* Prvý návrat: dátum tréningu po pauze aspoň 14 dní. */
function firstComebackDate() {
  const dates = workoutDates();
  for (let i = 1; i < dates.length; i++) {
    if (gapDaysBetween(dates[i - 1], dates[i]) >= 14) return dates[i];
  }
  return null;
}

/* Prvý tréning po celom vynechanom kalendárnom týždni.
   Posudzujú sa len týždne STRIKTNE medzi dvoma po sebe idúcimi tréningami,
   takže dva tréningy v tom istom týždni nič nevynechajú. */
function firstMissedWeekDate() {
  const dates = workoutDates();
  for (let i = 1; i < dates.length; i++) {
    const earlierWeek = weekKey(parseDate(dates[i - 1]));
    const laterWeek = weekKey(parseDate(dates[i]));
    if (laterWeek === earlierWeek) continue;   // rovnaký týždeň → nič medzi nimi
    let wk = prevWeekKey(laterWeek);
    for (let step = 0; step < 520 && wk !== earlierWeek; step++) {
      if (workoutsInWeek(wk) === 0) return dates[i];
      wk = prevWeekKey(wk);
    }
  }
  return null;
}

/* ---------- Definície úspechov ----------
   Každý úspech má stabilné id, kategóriu, ikonu, prekladové kľúče, XP odmenu a podmienku.
   Úspechy sa nikdy neodoberajú (pozri reconcileAchievements) a ich podmienky nezávisia
   od týždenného cieľa, časového pásma, zariadenia ani prehliadača. */

function staticAchievementDefs() {
  const pr = prStats();
  const comebackDate = firstComebackDate();
  const missedWeekDate = firstMissedWeekDate();
  const weeks3 = isoWeeksWithAtLeast(3);
  const weeks5 = isoWeeksWithAtLeast(5);
  const activePlans = activePlanIds().length;
  const customPlans = customPlanCount();
  const customExercises = distinctCustomExerciseCount();
  const distinctPlans = distinctPlanIdsInHistory();

  return [
    /* --- Počet tréningov --- */
    { id: 'first', icon: '🎯', category: 'milestones', xp: 25, nameKey: 'achievements.first', descKey: 'achievements.firstDesc', cond: () => state.history.length >= 1 },
    { id: 'five', icon: '💪', category: 'milestones', xp: 50, nameKey: 'achievements.five', descKey: 'achievements.fiveDesc', cond: () => state.history.length >= 5 },
    { id: 'ten', icon: '🏅', category: 'milestones', xp: 100, nameKey: 'achievements.ten', descKey: 'achievements.tenDesc', cond: () => state.history.length >= 10 },
    { id: 'twentyfive', icon: '🚀', category: 'milestones', xp: 200, nameKey: 'achievements.twentyfive', descKey: 'achievements.twentyfiveDesc', cond: () => state.history.length >= 25 },
    { id: 'fifty', icon: '💎', category: 'milestones', xp: 350, nameKey: 'achievements.fifty', descKey: 'achievements.fiftyDesc', cond: () => state.history.length >= 50 },
    { id: 'hundred', icon: '👑', category: 'milestones', xp: 750, nameKey: 'achievements.hundred', descKey: 'achievements.hundredDesc', cond: () => state.history.length >= 100 },

    /* --- Pravidelnosť a týždenné ciele --- */
    { id: 'weeklygoal1', icon: '🎯', category: 'consistency', xp: 75, nameKey: 'achievements.weeklygoal1', descKey: 'achievements.weeklygoal1Desc', cond: () => historyWeeksWithGoalMet().length >= 1 },
    { id: 'consistent2', icon: '📅', category: 'consistency', xp: 125, nameKey: 'achievements.consistent2', descKey: 'achievements.consistent2Desc', cond: () => computeStreak() >= 2 },
    { id: 'consistent4', icon: '🔥', category: 'consistency', xp: 300, nameKey: 'achievements.consistent4', descKey: 'achievements.consistent4Desc', cond: () => computeStreak() >= 4 },
    { id: 'consistent8', icon: '⚡', category: 'consistency', xp: 500, nameKey: 'achievements.consistent8', descKey: 'achievements.consistent8Desc', cond: () => computeStreak() >= 8 },
    { id: 'consistent12', icon: '🏆', category: 'consistency', xp: 750, nameKey: 'achievements.consistent12', descKey: 'achievements.consistent12Desc', cond: () => computeStreak() >= 12 },
    { id: 'solid2', icon: '📆', category: 'consistency', xp: 125, nameKey: 'achievements.solid2', descKey: 'achievements.solid2Desc', cond: () => weeks3 >= 2 },
    { id: 'solid4', icon: '📈', category: 'consistency', xp: 300, nameKey: 'achievements.solid4', descKey: 'achievements.solid4Desc', cond: () => weeks3 >= 4 },
    { id: 'fullweek', icon: '🗓️', category: 'consistency', xp: 200, nameKey: 'achievements.fullweek', descKey: 'achievements.fullweekDesc', cond: () => weeks5 >= 1 },

    /* --- Osobné rekordy a pokrok --- */
    { id: 'newpr', icon: '💪', category: 'records', xp: 75, nameKey: 'achievements.newpr', descKey: 'achievements.newprDesc', cond: () => hasAnyPR() },
    { id: 'pr5', icon: '🥇', category: 'records', xp: 150, nameKey: 'achievements.pr5', descKey: 'achievements.pr5Desc', cond: () => pr.prEvents >= 5 },
    { id: 'pr10', icon: '🎖️', category: 'records', xp: 300, nameKey: 'achievements.pr10', descKey: 'achievements.pr10Desc', cond: () => pr.prEvents >= 10 },
    { id: 'improve', icon: '📊', category: 'records', xp: 100, nameKey: 'achievements.improve', descKey: 'achievements.improveDesc', cond: () => pr.improvements >= 1 },
    { id: 'xp200', icon: '⭐', category: 'records', xp: 0, nameKey: 'achievements.xp200', descKey: 'achievements.xp200Desc', cond: () => workoutXP() >= 200 },

    /* --- Prispôsobenie tréningu --- */
    { id: 'customplan', icon: '🧩', category: 'customization', xp: 50, nameKey: 'achievements.customplan', descKey: 'achievements.customplanDesc', cond: () => customPlans >= 1 },
    { id: 'fourplans', icon: '🏗️', category: 'customization', xp: 100, nameKey: 'achievements.fourplans', descKey: 'achievements.fourplansDesc', cond: () => activePlans >= 4 },
    { id: 'customex5', icon: '📚', category: 'customization', xp: 125, nameKey: 'achievements.customex5', descKey: 'achievements.customex5Desc', cond: () => customExercises >= 5 },
    { id: 'variety4', icon: '🔀', category: 'customization', xp: 150, nameKey: 'achievements.variety4', descKey: 'achievements.variety4Desc', cond: () => distinctPlans >= 4 },

    /* --- Vytrvalosť --- */
    { id: 'comeback', icon: '🔙', category: 'dedication', xp: 100, nameKey: 'achievements.comeback', descKey: 'achievements.comebackDesc', cond: () => comebackDate !== null },
    { id: 'missedweek', icon: '🛡️', category: 'dedication', xp: 150, nameKey: 'achievements.missedweek', descKey: 'achievements.missedweekDesc', cond: () => missedWeekDate !== null },
  ];
}

function historyWeeksWithGoalMet() {
  const weeks = new Set();
  for (const w of state.history) weeks.add(weekKey(parseDate(w.date)));
  return [...weeks].filter(k => workoutsInWeek(k) >= goalForWeek(k));
}

function hasAnyPR() {
  return personalRecords().length > 0;
}

/* Vyhodnotí všetky úspechy (statické + míľniky) a vráti mapu id -> dátum */
function evaluateAchievements() {
  const map = {};
  const sorted = sortedHistory();

  for (const def of staticAchievementDefs()) {
    if (def.cond()) map[def.id] = achievementDateFor(def.id, sorted);
  }

  // 5 kg míľniky (chronologicky). Id zostáva postavené na zaznamenanom názve cviku,
  // aby existujúce míľniky v uložených dátach zostali v platnosti.
  const best = {};
  for (const w of sorted) {
    for (const ex of w.exercises) {
      if (ex.weight <= 0) continue;
      const prev = best[ex.name];
      if (prev === undefined || ex.weight > prev) {
        best[ex.name] = ex.weight;
        const step = Math.floor(ex.weight / 5) * 5;
        if (step > 0) {
          const id = 'ms-' + ex.name + '-' + step;
          if (!map[id]) map[id] = w.date;
        }
      }
    }
  }

  return map;
}

function achievementDateFor(id, sorted) {
  const count = sorted.length;
  const idxMap = {
    first: 0, five: 4, ten: 9, twentyfive: 24, fifty: 49, hundred: 99,
  };
  if (idxMap[id] !== undefined && count > idxMap[id]) return sorted[idxMap[id]].date;
  if (id === 'newpr') {
    // najstarší tréning s osobným rekordom
    const best = {};
    for (const w of sorted) {
      for (const ex of w.exercises) {
        if (ex.weight <= 0) continue;
        const prev = best[ex.name];
        if (!prev || ex.weight > prev.weight) {
          best[ex.name] = ex.weight;
          return w.date;
        }
      }
    }
  }
  if (id === 'xp200') {
    let acc = 0;
    for (const w of sorted) {
      acc += w.xp;
      if (acc >= 200) return w.date;
    }
  }
  if (id === 'weeklygoal1') {
    const met = historyWeeksWithGoalMet().sort();
    if (met.length) {
      const wk = met[0];
      const ws = sorted.filter(w => weekKey(parseDate(w.date)) === wk);
      if (ws.length) return ws[ws.length - 1].date;
    }
  }
  if (id.startsWith('consistent')) {
    const weeks = historyWeeksWithGoalMet().sort();
    const need = parseInt(id.replace('consistent', ''), 10);
    if (weeks.length >= need) return sorted[sorted.length - 1].date;
  }
  if (id === 'solid2' || id === 'solid4') {
    const d = nthQualifyingWeekDate(3, id === 'solid2' ? 2 : 4);
    if (d) return d;
  }
  if (id === 'fullweek') {
    const d = nthQualifyingWeekDate(5, 1);
    if (d) return d;
  }
  if (id === 'pr5' || id === 'pr10') {
    const prs = prStats().prDates;
    const need = id === 'pr5' ? 5 : 10;
    if (prs.length >= need) return prs[need - 1];
  }
  if (id === 'improve') {
    const d = prStats().improveDate;
    if (d) return d;
  }
  if (id === 'variety4') {
    const d = nthDistinctPlanDate(4);
    if (d) return d;
  }
  if (id === 'comeback') {
    const d = firstComebackDate();
    if (d) return d;
  }
  if (id === 'missedweek') {
    const d = firstMissedWeekDate();
    if (d) return d;
  }
  if (id === 'first' && count >= 1) return sorted[0].date;
  return todayISO();
}

/* Zlúčí novo vyhodnotené úspechy s uloženými. Nikdy nič neodoberá – získaný úspech zostáva navždy,
   aj keď sa zmení týždenný cieľ, pretrhne sa séria alebo sa zmaže plán či cvik. */
function reconcileAchievements() {
  const current = evaluateAchievements();
  const stored = state.achievements || {};
  const merged = {};
  for (const [id, date] of Object.entries(stored)) merged[id] = date;
  for (const [id, date] of Object.entries(current)) if (!merged[id]) merged[id] = date;
  state.achievements = merged;
}

/* ---------- Motivácia ---------- */

function dayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date - start) / 86400000);
}

/* ---------- Povzbudzujúce texty ----------
   Krátke vety sa neprekladajú cez slovníkové kľúče, ale ako celé vety pre každý
   jazyk. Vybraný jazyk má vždy vlastné pole; neznámy kód spadne na angličtinu. */
const MOTIVATION = {
  sk: [
    'Každý tréning ťa posúva bližšie k cieľu.',
    'Dnešný deň je skvelý deň na tréning.',
    'Telo si pamätá tvoju drinu – neprestaň.',
    'Silu nezískaš odpočinkom, ale pohybom.',
    'Buď lepší, ako si bol včera.',
    'Drepuješ dnes? Tvoje budúce ja ti poďakuje.',
    'Malé kroky, veľké výsledky.',
    'Súdržnosť poráža motiváciu. Príď znova.',
    'Tréning je investícia do seba.',
    'Začni, aj keď sa ti nechce. Potom to pôjde samo.',
    'Disciplína je tvoja superveľmoc.',
    'Jeden tréning môže zmeniť celý deň.',
    'Najťažší krok je ten prvý – sprav ho teraz.',
    'Tvoja jediná konkurencia si ty sám.',
    'Buduj svoje telo ako chrám.',
  ],
  en: [
    'Every workout moves you closer to your goal.',
    'Today is a great day to train.',
    'Your body remembers the hard work — keep going.',
    'Strength comes from movement, not rest.',
    'Be better than you were yesterday.',
    'Squatting today? Your future self will thank you.',
    'Small steps, big results.',
    'Consistency beats motivation. Show up again.',
    'Training is an investment in yourself.',
    'Start even when you do not feel like it.',
    'Discipline is your superpower.',
    'One workout can change your whole day.',
    'The hardest step is the first one — take it now.',
    'Your only competition is yourself.',
    'Build your body like a temple.',
  ],
  es: [
    'Cada entrenamiento te acerca a tu objetivo.',
    'Hoy es un gran día para entrenar.',
    'Tu cuerpo recuerda el esfuerzo: no pares.',
    'La fuerza viene del movimiento, no del descanso.',
    'Sé mejor de lo que eras ayer.',
    '¿Sentadillas hoy? Tu yo del futuro te lo agradecerá.',
    'Pequeños pasos, grandes resultados.',
    'La constancia vence a la motivación. Vuelve otra vez.',
    'Entrenar es invertir en ti.',
    'Empieza aunque no te apetezca.',
    'La disciplina es tu superpoder.',
    'Un entrenamiento puede cambiar todo tu día.',
    'El paso más difícil es el primero: dalo ahora.',
    'Tu única competencia eres tú.',
    'Construye tu cuerpo como un templo.',
  ],
  'pt-BR': [
    'Cada treino te aproxima do seu objetivo.',
    'Hoje é um ótimo dia para treinar.',
    'Seu corpo lembra do esforço: não pare.',
    'A força vem do movimento, não do descanso.',
    'Seja melhor do que você foi ontem.',
    'Vai fazer agachamento hoje? Seu eu do futuro agradece.',
    'Passos pequenos, resultados grandes.',
    'Constância vence motivação. Apareça de novo.',
    'Treinar é investir em você.',
    'Comece mesmo sem vontade.',
    'A disciplina é o seu superpoder.',
    'Um treino pode mudar o seu dia inteiro.',
    'O passo mais difícil é o primeiro: dê ele agora.',
    'Sua única concorrência é você mesmo.',
    'Construa seu corpo como um templo.',
  ],
  fr: [
    'Chaque entraînement te rapproche de ton objectif.',
    'Aujourd’hui est un bon jour pour s’entraîner.',
    'Ton corps se souvient des efforts : ne t’arrête pas.',
    'La force vient du mouvement, pas du repos.',
    'Sois meilleur qu’hier.',
    'Des squats aujourd’hui ? Ton toi futur te remerciera.',
    'Petits pas, grands résultats.',
    'La régularité bat la motivation. Reviens.',
    'S’entraîner, c’est investir en soi.',
    'Commence même sans envie.',
    'La discipline est ton superpouvoir.',
    'Un entraînement peut changer toute ta journée.',
    'Le pas le plus dur est le premier : fais-le maintenant.',
    'Ta seule concurrence, c’est toi.',
    'Construis ton corps comme un temple.',
  ],
  ar: [
    'كل تمرين يقرّبك من هدفك.',
    'اليوم يوم رائع للتمرين.',
    'جسمك يتذكر التعب — لا تتوقف.',
    'القوة تأتي من الحركة لا من الراحة.',
    'كن أفضل مما كنت بالأمس.',
    'سكوات اليوم؟ نفسك في المستقبل ستشكرك.',
    'خطوات صغيرة، نتائج كبيرة.',
    'الاستمرارية تتغلب على الحماس. عُد مرة أخرى.',
    'التمرين استثمار في نفسك.',
    'ابدأ حتى لو لم ترغب.',
    'الانضباط هو قوتك الخارقة.',
    'تمرين واحد قد يغيّر يومك بالكامل.',
    'أصعب خطوة هي الأولى — خذها الآن.',
    'منافسك الوحيد هو أنت.',
    'ابنِ جسمك كالمعبد.',
  ],
};

const MOTIVATION_LONG = {
  sk: [
    '🔥 Si vo veľkej forme! Takto sa to robí!',
    '🔥 Nezastaviteľný! Pokračuj v tom!',
    '🔥 Séria, na ktorú môžeš byť hrdý!',
  ],
  en: [
    '🔥 You are on fire! Keep it up!',
    '🔥 Unstoppable! Keep going!',
    '🔥 A streak to be proud of!',
  ],
  es: [
    '🔥 ¡Estás en racha! ¡Sigue así!',
    '🔥 ¡Imparable! ¡No pares!',
    '🔥 ¡Una racha de la que estar orgulloso!',
  ],
  'pt-BR': [
    '🔥 Você está em chamas! Continue assim!',
    '🔥 Imparável! Não pare!',
    '🔥 Uma sequência para se orgulhar!',
  ],
  fr: [
    '🔥 Tu es en feu ! Continue comme ça !',
    '🔥 Imparable ! Ne lâche rien !',
    '🔥 Une série dont tu peux être fier !',
  ],
  ar: [
    '🔥 أنت في أفضل حال! واصل!',
    '🔥 لا يمكن إيقافك! استمر!',
    '🔥 سلسلة تستحق الفخر!',
  ],
};

const ENCOURAGEMENT = {
  sk: ['Skvelá práca! Zaslúžiš si oddych.', 'Výborne! Každý tréning sa počíta.', 'Paráda, zvládol si to!', 'Takto sa buduje forma!'],
  en: ['Great job! You earned the rest.', 'Well done! Every workout counts.', 'Nice, you nailed it!', 'That is how you build fitness!'],
  es: ['¡Buen trabajo! Te ganaste el descanso.', '¡Bien hecho! Cada entrenamiento cuenta.', '¡Genial, lo lograste!', '¡Así se construye la forma!'],
  'pt-BR': ['Ótimo trabalho! Você merece o descanso.', 'Muito bem! Cada treino conta.', 'Boa, você conseguiu!', 'É assim que se constrói a forma!'],
  fr: ['Beau travail ! Tu as mérité la pause.', 'Bravo ! Chaque entraînement compte.', 'Joli, tu l’as fait !', 'C’est comme ça qu’on progresse !'],
  ar: ['عمل رائع! استحققت الراحة.', 'أحسنت! كل تمرين يُحتسب.', 'جميل، لقد أنجزته!', 'هكذا تُبنى اللياقة!'],
};

const SET_MESSAGES = {
  sk: ['Séria hotová, pokračuj!', 'Ešte jedna séria, dáš to!', 'Skoro tam! Tlač ďalej!', 'Pekne! Telo pracuje, ty len tlačíš.', 'Sila rastie s každou sériou.', 'Nepoľavuj, ešte chvíľu!', 'Výborne, drž tempo!'],
  en: ['Set done, keep going!', 'One more set, you got this!', 'Almost there! Push on!', 'Nice! Your body is working.', 'Strength grows with every set.', 'Do not let up, a little more!', 'Great, keep the pace!'],
  es: ['Serie hecha, ¡sigue!', 'Una serie más, ¡puedes!', '¡Casi! ¡Empuja!', '¡Bien! Tu cuerpo está trabajando.', 'La fuerza crece con cada serie.', '¡No aflojes, un poco más!', '¡Genial, mantén el ritmo!'],
  'pt-BR': ['Série concluída, continue!', 'Mais uma série, você consegue!', 'Quase lá! Empurre!', 'Boa! Seu corpo está trabalhando.', 'A força cresce a cada série.', 'Não desacelere, mais um pouco!', 'Ótimo, mantenha o ritmo!'],
  fr: ['Série terminée, continue !', 'Encore une série, tu peux le faire !', 'Presque ! Pousse encore !', 'Bien ! Ton corps travaille.', 'La force grandit à chaque série.', 'Ne lâche pas, encore un peu !', 'Super, garde le rythme !'],
  ar: ['انتهت السلسلة، واصل!', 'سلسلة أخرى، تستطيع!', 'اقتربت! واصل الدفع!', 'جيد! جسمك يعمل.', 'القوة تنمو مع كل سلسلة.', 'لا تتراجع، بقليل آخر!', 'رائع، حافظ على الإيقاع!'],
};

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/* Pole pre aktuálny jazyk; neznámy kód vždy spadne na angličtinu. */
function langList(map) {
  return map[activeLang()] || map.en;
}

function motivationText() {
  const streak = computeStreak();
  const arr = streak >= 4 ? langList(MOTIVATION_LONG) : langList(MOTIVATION);
  return arr[dayOfYear(new Date()) % arr.length];
}

function randomEncouragement() {
  return pick(langList(ENCOURAGEMENT));
}

function randomSetMessage() {
  return pick(langList(SET_MESSAGES));
}

/* ---------- Vykreslenie: DNES ---------- */

function renderDnes() {
  const goal = weeklyGoal();
  const weekCount = workoutsInWeek(currentWeekKey());
  const streak = computeStreak();
  const excused = state.excusedWeeks.includes(currentWeekKey());

  const dateEl = document.getElementById('today-date');
  dateEl.textContent = todayLabel();
  dateEl.setAttribute('datetime', todayISO());

  document.getElementById('week-count').textContent = t('dnes.weekDone', { n: weekCount, g: goal });
  document.getElementById('week-progress').style.width = `${Math.min(100, (weekCount / goal) * 100)}%`;
  document.getElementById('week-sub').textContent = weekCount >= goal
    ? t('dnes.weekGoalMet')
    : tPlural('dnes.weekRemaining', goal - weekCount).replace('{n}', String(goal - weekCount));

  const streakText = streak === 0
    ? t('dnes.streakNone')
    : tPlural('dnes.streakWeek', streak).replace('{n}', String(streak));
  document.getElementById('streak-value').textContent = streakText;
  /* Rozhoduje sa podľa dokončených týždňov: prebiehajúci týždeň nikdy nezobrazí "séria skončila". */
  const currentMet = weekCount >= goal;
  document.getElementById('streak-sub').textContent = streak === 0
    ? (hasCompletedGoalWeek()
      ? t('dnes.streakEnded')
      : tPlural('dnes.streakStart', goal).replace('{g}', String(goal)))
    : (currentMet
      ? t('dnes.streakGoing')
      : tPlural('dnes.streakContinue', goal).replace('{g}', String(goal)));

  const btnExcuse = document.getElementById('btn-excuse');
  btnExcuse.textContent = excused ? t('dnes.excuseActive') : t('dnes.excuse');
  const note = document.getElementById('excuse-note');
  note.hidden = !excused;
  note.textContent = t('dnes.excuseNote');

  document.getElementById('motivation-text').textContent = motivationText();

  document.getElementById('dnes-next-plan').textContent = t('dnes.nextPlan', { plan: planNameOf(recommendedPlan()) });
}

/* ---------- Vykreslenie: TRÉNING ---------- */

/* ---------- Aktívna tréningová session (jediný zdroj pravdy pre rozbehnutý tréning) ----------
   Priebeh tréningu NIKDY nežije len v prekreslenom DOM. Žije v state.activeSession, ktorý
   prežije prekreslenie, zmenu jazyka, prepnutie karty, úpravu plánu aj obnovenie stránky. */

function getSession() {
  return (state && state.activeSession) || null;
}

/* Stabilný kľúč cviku v rámci session. Používa stabilné id zabudovaného cviku, inak názov.
   Zobrazený názov sa pri prepnutí SK/EN prekladá, ale uložený názov cviku sa nemení,
   takže značky prežijú zmenu jazyka, váhy aj poradia cvikov v pláne. */
function exerciseSessionKey(ex) {
  if (!ex) return '';
  return ex.id ? String(ex.id) : 'c:' + String(ex.name == null ? '' : ex.name);
}

/* Kľúč jednej série. Jednostranný cvik má pre každú stranu vlastný kľúč,
   takže ľavá a pravá strana sa nikdy nemôžu označiť navzájom. */
function setSessionKey(ex, index, side) {
  const base = exerciseSessionKey(ex) + ':' + index;
  return side ? base + ':' + (side === 'right' ? 'R' : 'L') : base;
}

/* Poradie strán jednostranného cviku; null pre bežný (obojstranný) cvik. */
function exerciseSideOrder(ex) {
  if (!ex || ex.unilateral !== true) return null;
  return ex.startSide === 'right' ? ['right', 'left'] : ['left', 'right'];
}

/* Koľko samostatne označiteľných položiek cvik má (každá strana = jedna). */
function exerciseSlotCount(ex) {
  return ex.sets * (exerciseSideOrder(ex) ? 2 : 1);
}

/* Vytvorí session, ak ešte neexistuje. Volá sa pri "Začať tréning" a pri prvom označení série,
   aby označené série nikdy nemohli zostať bez trvalého úložiska. */
function ensureSession(plan) {
  if (!state) return null;
  const existing = getSession();
  if (existing) return existing;
  const p = plan || getPlan(selectedPlan);
  if (!p) return null;
  state.activeSession = {
    id: uid(),
    startedAt: Date.now(),
    planId: p.id,
    planName: recordedPlanName(p),
    completedSets: {},
    actualFailureSets: {},
  };
  return state.activeSession;
}

function clearSession() {
  if (state) state.activeSession = null;
  setSessionNote(null, 0);
}

/* Nastaví značku série (hotová / do zlyhania). Vždy zapisuje do session, nikdy do DOM. */
function toggleSetMark(kind, ex, index, on, side) {
  const sess = ensureSession();
  if (!sess) return false;
  const map = kind === 'failure' ? sess.actualFailureSets : sess.completedSets;
  const key = setSessionKey(ex, index, side);
  if (on) map[key] = true;
  else delete map[key];
  saveState();
  return true;
}

function setMark(kind, ex, index, side) {
  const sess = getSession();
  if (!sess) return false;
  const map = kind === 'failure' ? sess.actualFailureSets : sess.completedSets;
  return !!map[setSessionKey(ex, index, side)];
}

function planExerciseCount(plan) {
  return plan.exercises.reduce((s, ex) => s + exerciseSlotCount(ex), 0);
}

/* Počet dokončených sérií sa ráta z session, ale VŽDY len pre série, ktoré práve existujú
   v zobrazenom pláne — takže zníženie počtu sérií nikdy neprinesie duchovské série. */
function totalSetsDone() {
  const sess = getSession();
  const plan = getPlan(selectedPlan);
  if (!sess || !plan) return 0;
  let n = 0;
  for (const ex of plan.exercises) {
    const sides = exerciseSideOrder(ex);
    for (let i = 0; i < ex.sets; i++) {
      if (sides) {
        for (const side of sides) if (sess.completedSets[setSessionKey(ex, i, side)]) n++;
      } else if (sess.completedSets[setSessionKey(ex, i)]) n++;
    }
  }
  return n;
}

/* ---------- Trvanie tréningu ---------- */

/* Trvanie je vždy odvodené z absolútneho času štartu, nikdy z počítadla tiknutí.
   Preto zostáva presné po pozadí, zamknutí displeja aj po obnovení stránky. */
function sessionElapsedSeconds(sess) {
  const s = sess || getSession();
  if (!s) return 0;
  const started = Number(s.startedAt);
  if (!Number.isFinite(started) || started <= 0) return 0;
  return Math.max(0, Math.floor((Date.now() - started) / 1000));
}

function formatDurationClock(seconds) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const h = String(Math.floor(total / 3600)).padStart(2, '0');
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

/* Prirodzené trvanie: "45 s" / "42 min" / "1 h 12 min".
   Jednotky sa skloňujú cez tPluralWord, takže arabčina dostane svoje tvary
   a spojku, francúzština svoje a slovenčina svoje. */
function formatDurationNatural(seconds) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  if (total < 60) return tPlural('duration.sec', total);
  if (total < 3600) return tPlural('duration.min', Math.floor(total / 60));
  const hours = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  if (mins === 0) return tPlural('duration.hourUnit', hours);
  return t('duration.hourMin', {
    h: tPluralWord('duration.hourUnit', hours),
    m: tPluralWord('duration.minUnit', mins),
  });
}

function updateDurationDisplay() {
  const row = document.getElementById('duration-row');
  if (!row) return;
  const sess = getSession();
  row.hidden = !sess;
  if (!sess) return;
  document.getElementById('duration-value').textContent = formatDurationClock(sessionElapsedSeconds(sess));
}

/* Jeden interval na celý beh aplikácie – po prekreslení nikdy nevznikne druhý.
   Zároveň jediný visibilitychange listener, ktorý po návrate z pozadia
   zosynchronizuje trvanie tréningu aj bežiaci odpočet. */
function startDurationTicker() {
  if (durationInterval !== null) return;
  durationInterval = setInterval(updateDurationDisplay, 1000);
  document.addEventListener('visibilitychange', onVisibilityChange);
}

function onVisibilityChange() {
  updateDurationDisplay();
  if (document.hidden) {
    wasHidden = true;
    timerHiddenAt = Date.now();
    /* Odchod do pozadia zruší naplánovaný aj rozohraný gong. Keby zostal v pozastavenom
       zvukovom kontexte, prehral by sa po návrate dodatočne – presne ten "oneskorený gong",
       ktorý sa už nesmie objaviť. */
    stopActiveChime();
  } else {
    if (wasHidden) refreshRestTimerOnVisible();
    wasHidden = false;
    timerHiddenAt = 0;
    resumeAudioIfNeeded(false);   // mimo pokynu používateľa: obnoví len existujúci kontext
    /* Návrat do appky je presne ten moment, kedy sa má vyhodnotiť, či záloha
       medzitým "dozrela" – aplikácia totiž na pozadí nič nerobí. */
    refreshBackupOffer();
  }
}

function renderSessionNote() {
  const el = document.getElementById('duration-note');
  if (!el) return;
  el.hidden = !sessionNoteKey || !getSession();
  el.textContent = sessionNoteKey ? t(sessionNoteKey) : '';
}

/* dočasná nenápadná poznámka v riadku s trvaním; autoHideMs > 0 ju po chvíli skryje */
function setSessionNote(key, autoHideMs) {
  sessionNoteKey = key;
  if (sessionNoteTimer) { clearTimeout(sessionNoteTimer); sessionNoteTimer = null; }
  if (key && autoHideMs) {
    sessionNoteTimer = setTimeout(() => { sessionNoteTimer = null; sessionNoteKey = null; renderSessionNote(); }, autoHideMs);
  }
  renderSessionNote();
}

/* Porovnanie sa robí LEN s tým istým cvikom v tom istom pláne.
   Bez zhody v pláne sa nezobrazí nič – žiadne falošné "-2" z iného tréningu. */
function comparisonHint(ex, planId) {
  if (ex.weight <= 0) return '';
  const prev = previousWorkoutFor(ex, todayISO(), planId);
  if (!prev) return t('trening.firstTime');
  const dw = ex.weight - prev.weight;
  const dr = ex.reps - prev.reps;
  const w = (n) => n.toFixed(1).replace(/\.0$/, '');
  if (dw > 0 && dr > 0) return `<span class="up">${t('trening.compareUp', { w: w(dw), r: dr })}</span>`;
  if (dw > 0) return `<span class="up">${t('trening.compareWeightUp', { w: w(dw) })}</span>`;
  if (dw < 0) return `<span class="down">${t('trening.compareWeightDown', { w: w(Math.abs(dw)) })}</span>`;
  if (dr > 0) return `<span class="up">${t('trening.compareRepsUp', { r: dr })}</span>`;
  if (dr < 0) return `<span class="down">${t('trening.compareRepsDown', { r: dr })}</span>`;
  return `<span>${t('trening.compareSame', { w: w(prev.weight) })}</span>`;
}

/* Prepínač pod selektorom plánov. Jeho text sa musí prekresliť pri zmene jazyka
   aj pri prepnutí režimu. */
function updatePlanManageButton() {
  const btn = document.getElementById('btn-manage-plans');
  if (!btn) return;
  btn.setAttribute('aria-pressed', planManageMode ? 'true' : 'false');
  btn.textContent = t(planManageMode ? 'trening.managePlansDone' : 'trening.managePlans');
  const hint = document.getElementById('plan-manage-hint');
  if (hint) hint.hidden = !planManageMode;
}

function setPlanManageMode(on) {
  planManageMode = on === true;
  updatePlanManageButton();
  renderTrening();
}

function renderTrening() {
  if (!getPlan(selectedPlan)) selectedPlan = activePlanIds()[0] || null;

  const chips = document.getElementById('plan-chips');
  chips.innerHTML = '';
  chips.classList.toggle('managing', planManageMode);
  updatePlanManageButton();
  const rec = recommendedPlan();
  for (const id of activePlanIds()) {
    const p = getPlan(id);
    const wrap = document.createElement('div');
    wrap.className = 'chip-wrap';
    wrap.dataset.planId = id;
    /* Uchopovadlo a ceruzka existujú vždy, ale v bežnom režime sú skryté –
       názov plánu tak dostane celú šírku karty a je vycentrovaný. */
    const drag = document.createElement('button');
    drag.type = 'button';
    drag.className = 'chip-drag';
    drag.textContent = '⠿';
    drag.hidden = !planManageMode;
    drag.title = t('trening.dragPlan');
    drag.setAttribute('aria-label', t('trening.dragPlan') + ': ' + planDisplayName(p));
    wrap.appendChild(drag);

    const btn = document.createElement('button');
    btn.className = 'chip' + (id === selectedPlan ? ' active' : '') + (id === rec ? ' recommended' : '');
    btn.textContent = planDisplayName(p);
    btn.addEventListener('click', () => {
      // výber iného plánu vždy zatvorí editor, aby meno v poli nepatrilo inému plánu
      if (editingPlan !== null && editingPlan !== id && closeEditor()) saveState();
      selectedPlan = id;
      // rozbehnutá session sa previaže na novo zvolený plán (značky sérií zostávajú zachované)
      const s = getSession();
      if (s) { s.planId = id; s.planName = recordedPlanName(p); saveState(); }
      renderTrening();
    });
    wrap.appendChild(btn);
    const editBtn = document.createElement('button');
    editBtn.className = 'btn-icon chip-edit';
    editBtn.textContent = '✏️';
    editBtn.hidden = !planManageMode;
    editBtn.title = t('trening.edit');
    editBtn.addEventListener('click', () => {
      startEditPlan(id);
    });
    wrap.appendChild(editBtn);
    chips.appendChild(wrap);
  }

  const editPanel = document.getElementById('edit-panel');
  editPanel.hidden = editingPlan === null;
  if (editingPlan !== null && editingPlan === selectedPlan && getPlan(editingPlan)) {
    renderEditPanel();
  }

  const plan = getPlan(selectedPlan);
  document.getElementById('plan-title').textContent = plan ? planDisplayName(plan) : t('pokrok.workoutFallback');
  const list = document.getElementById('exercise-list');
  list.innerHTML = '';
  /* Poznámka: značky sérií sa tu Zámerne NEmažú – žijú v state.activeSession,
     aby ich prekreslenie (zmena jazyka, úprava plánu, návrat na kartu) nezmazalo. */
  updateDurationDisplay();
  renderSessionNote();
  if (!plan) {
    document.getElementById('summary-bar').innerHTML = '';
    document.getElementById('btn-finish-workout').disabled = true;
    return;
  }

  for (const ex of plan.exercises) {
    const div = document.createElement('div');
    div.className = 'exercise';

    const head = document.createElement('div');
    head.className = 'exercise-head';
    const name = document.createElement('span');
    name.className = 'exercise-name';
    name.textContent = exerciseDisplayName(ex);
    const meta = document.createElement('span');
    meta.className = 'exercise-meta';
    meta.innerHTML = `${ex.sets} × ${ex.reps} &nbsp;·&nbsp; <b>${ex.weight} ${t('units.kg')}</b>`;
    head.append(name, meta);
    div.appendChild(head);

    /* Jednostranný cvik: každá strana má vlastné série, vlastné značky aj vlastné zlyhania. */
    const sides = exerciseSideOrder(ex);
    if (sides) {
      const sideNote = document.createElement('p');
      sideNote.className = 'exercise-side-note';
      sideNote.textContent = tPlural('unilateral.setsPerSide', ex.sets);
      div.appendChild(sideNote);
    }

    const hint = document.createElement('div');
    hint.className = 'compare-hint';
    hint.innerHTML = comparisonHint(ex, plan.id);
    div.appendChild(hint);

    const sets = document.createElement('div');
    sets.className = 'sets';

    const plannedFailure = cleanFailureSets(ex.plannedFailureSets, ex.sets);

    for (let i = 0; i < ex.sets; i++) {
      if (sides) {
        for (const side of sides) sets.appendChild(buildSetItem(ex, i, plannedFailure, side));
      } else {
        sets.appendChild(buildSetItem(ex, i, plannedFailure, null));
      }
    }

    div.appendChild(sets);
    list.appendChild(div);
  }

  updateSummary();         // skutočný počet hotových sérií aj stav tlačidla Dokončiť
  refreshUpdateBanner();   // otvorenie/zatvorenie editora plánu mení stav "zaneprázdnený"
}

/* Preklad názvu strany pre jednostranný cvik. */
function sideName(side) {
  return t(side === 'right' ? 'unilateral.right' : 'unilateral.left');
}

/* Jedna séria – pri jednostrannom cviku jedna jeho strana.
   Značky (hotová / do zlyhania) žijú v session, nie v DOM, takže prekreslenie nič nestratí.
   `side` je 'left' | 'right' pre jednostranný cvik, inak null. */
function buildSetItem(ex, index, plannedFailure, side) {
  const item = document.createElement('div');
  item.className = 'set-item' + (side ? ' side-row' : '');

  const sideLabel = side ? t('unilateral.setSide', { n: index + 1, side: sideName(side) }) : '';

  if (side) {
    const label = document.createElement('span');
    label.className = 'set-side-label';
    label.textContent = sideLabel;
    item.appendChild(label);
  }

  const setBtn = document.createElement('button');
  setBtn.type = 'button';
  setBtn.className = 'set-btn';
  /* Pri jednostrannom cviku nesie číslo série už popisok strany, preto stačí začiarknutie. */
  setBtn.textContent = side ? '✓' : `${index + 1} ✓`;
  setBtn.classList.toggle('done', setMark('done', ex, index, side));
  setBtn.setAttribute('aria-label', (side ? sideLabel + ' — ' : '') + t('trening.setDoneAria', { n: index + 1 }));
  setBtn.addEventListener('click', () => {
    const on = !setMark('done', ex, index, side);
    toggleSetMark('done', ex, index, on, side);
    setBtn.classList.toggle('done', on);
    setSessionNote(null, 0);
    updateSummary();
  });

  /* Samostatný ovládač pre každú sériu. Naplánovaná séria je len nenápadný náznak
     (prerušovaný oranžový okraj) – nikdy sa automaticky nepočíta ako dosiahnuté zlyhanie. */
  const wasPlanned = plannedFailure.includes(index + 1);
  const failBtn = document.createElement('button');
  failBtn.type = 'button';
  failBtn.className = 'set-fail' + (wasPlanned ? ' planned' : '');
  failBtn.textContent = '🔥';
  const syncFail = () => {
    const on = setMark('failure', ex, index, side);
    failBtn.classList.toggle('active', on);
    failBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    failBtn.setAttribute('aria-label', (side ? sideLabel + ' — ' : '') + (on ? t('failure.removeMarker') : t('failure.markSet')));
    failBtn.title = on ? t('failure.failure') : (wasPlanned ? t('failure.planned') : t('failure.markSet'));
  };
  syncFail();
  failBtn.addEventListener('click', () => {
    toggleSetMark('failure', ex, index, !setMark('failure', ex, index, side), side);
    setSessionNote(null, 0);
    syncFail();
  });

  item.append(setBtn, failBtn);
  return item;
}

function updateSummary() {
  const plan = getPlan(selectedPlan);
  const done = totalSetsDone();
  const total = plan ? planExerciseCount(plan) : 0;
  const msg = done === 0 ? t('trening.setsHint') : randomSetMessage();
  document.getElementById('summary-bar').innerHTML = t('trening.setsDone', { done, total, msg });
  document.getElementById('btn-finish-workout').disabled = done === 0;
  refreshUpdateBanner();   // rozbehnutý tréning skrýva ponuku aktualizácie
}

/* ---------- Editácia plánu ---------- */

function startEditPlan(id) {
  const plan = getPlan(id);
  if (!plan) return;
  editingPlan = id;
  selectedPlan = id;
  editDraft = JSON.parse(JSON.stringify(plan.exercises));
  document.getElementById('edit-error').hidden = true;
  // meno sa nastaví LEN tu – žiadné prekreslenie riadkov cvikov ho nesmie prepísať
  document.getElementById('edit-plan-name').value = planDisplayName(plan);
  renderTrening();
}

/* Zatvorí editor. Novo vytvorený a ešte neuložený plán zahodí. Vráti true, ak plán zanikol. */
function closeEditor() {
  const id = editingPlan;
  const discard = id !== null && id === newPlanId;
  editingPlan = null;
  editDraft = null;
  newPlanId = null;
  if (discard) removePlan(id);
  return discard;
}

/* Vytvorí nový vlastný plán a hneď otvorí editor. Zrušenie ho zahodí. */
function addPlan() {
  const id = 'p-' + uid();
  state.plans[id] = {
    id,
    builtin: false,
    customName: t('plan.newName'),
    exercises: [],
  };
  if (!Array.isArray(state.planOrder)) state.planOrder = [];
  state.planOrder.push(id);
  newPlanId = id;
  saveState();
  startEditPlan(id);
}

/* ---------- Full Body builder ----------
   Výber cvikov z existujúcich plánov. Výsledkom je ÚPLNE obyčajný vlastný plán –
   žiadny špeciálny typ ani trvalé pole navyše. */

let fbName = '';          // rozpracovaný názov nového plánu
let fbNameTouched = false;// používateľ názov upravil ručne?
let fbPicked = {};        // "planId:index" -> true (rozpracovaný výber, nikdy sa neukladá)
/* Režim zdieľaného dialógu: 'create' = nový Full Body plán, 'edit' = pridanie cvikov
   z existujúcich plánov do práve otvoreného editora. */
let fbMode = 'create';
let editPick = { src: [], own: [] };   // riadky rozpracovaného výberu pri úprave (neukladá sa)

/* Stabilné id zabudovaného cviku; vlastné cviky id nemajú. */
function builtinExerciseId(ex) {
  return (ex && ex.id && BUILTIN_EXERCISE_IDS.has(ex.id)) ? ex.id : null;
}

function openPlanChoice() {
  // otvorenie ponuky zavrie editor; zahodený neuložený nový plán sa musí uložiť do odstránenia
  if (editingPlan !== null && closeEditor()) { saveState(); renderTrening(); }
  document.getElementById('modal-planchoice').hidden = false;
  refreshUpdateBanner();
}

function closePlanChoice() {
  document.getElementById('modal-planchoice').hidden = true;
  refreshUpdateBanner();
}

/* Spoločný dialóg pre oba režimy – popisky sa prepínajú, markup zostáva jeden. */
function setFullBodyChrome(mode) {
  const isEdit = mode === 'edit';
  const title = document.getElementById('fb-title');
  const sub = document.getElementById('fb-sub');
  const nameLabel = document.getElementById('fb-name-label');
  const nameInput = document.getElementById('fb-name');
  const createBtn = document.getElementById('btn-fb-create');
  if (title) title.textContent = t(isEdit ? 'picker.title' : 'fb.title');
  if (sub) sub.textContent = t(isEdit ? 'picker.subtitle' : 'fb.subtitle');
  if (nameLabel) nameLabel.hidden = isEdit;
  if (nameInput) nameInput.hidden = isEdit;
  if (createBtn) createBtn.textContent = t(isEdit ? 'picker.apply' : 'fb.create');
}

function openFullBodyBuilder() {
  fbMode = 'create';
  fbName = t('fb.defaultName');
  fbNameTouched = false;
  fbPicked = {};
  document.getElementById('modal-planchoice').hidden = true;
  document.getElementById('fb-error').hidden = true;
  document.getElementById('fb-name').value = fbName;
  setFullBodyChrome('create');
  renderFullBodyBuilder();
  document.getElementById('modal-fullbody').hidden = false;
  refreshUpdateBanner();
  const input = document.getElementById('fb-name');
  if (input.focus) input.focus();
}

function closeFullBodyBuilder() {
  document.getElementById('modal-fullbody').hidden = true;
  fbPicked = {};
  editPick = { src: [], own: [] };
  fbMode = 'create';
  refreshUpdateBanner();
}

/* "3 × 10 · 25 kg" / "3 × 10 · Vlastná váha" – rovnaký popis vo Full Body builderi aj vo výbere. */
function fbRowMeta(ex) {
  return ex.sets + ' × ' + ex.reps + ' · '
    + (ex.weight > 0 ? ex.weight + ' ' + t('units.kg') : t('fb.bodyweight'));
}

/* Sekcie = všetky aktuálne aktívne plány v poradí aplikácie (zabudované aj vlastné). */
function fbSources() {
  const out = [];
  for (const planId of activePlanIds()) {
    const plan = getPlan(planId);
    if (!plan) continue;
    out.push({
      plan,
      rows: plan.exercises.map((ex, index) => ({
        key: planId + ':' + index,
        ex,
        name: exerciseDisplayName(ex),
        meta: fbRowMeta(ex),
      })),
    });
  }
  return out;
}

function fbPickedRows() {
  const out = [];
  for (const src of fbSources()) {
    for (const row of src.rows) if (fbPicked[row.key]) out.push(row);
  }
  return out;
}

/* Kópia cviku do nového plánu: živý odkaz na zdroj neexistuje.
   actualFailureSets sa Zámerne nekopíruje – patrí len dokončenej histórii. */
function fbCopyExercise(ex) {
  const sets = Math.round(ex.sets);
  const copy = {
    name: String(ex.name),
    sets,
    reps: Math.round(ex.reps),
    weight: ex.weight,
    plannedFailureSets: cleanFailureSets(ex.plannedFailureSets, sets),
  };
  if (builtinExerciseId(ex)) { copy.id = ex.id; copy.builtin = true; }
  if (ex.unilateral === true) {
    copy.unilateral = true;
    copy.startSide = ex.startSide === 'right' ? 'right' : 'left';
  }
  return copy;
}

/* Pravidlo duplicít: rovnaké stabilné id zabudovaného cviku = jeden výskyt.
   Vlastné cviky sa nikdy nezlučujú (rovnaké meno môžu mať dva rôzne cviky). */
function fbExercisesToCreate() {
  const seen = new Set();
  const out = [];
  for (const row of fbPickedRows()) {
    const id = builtinExerciseId(row.ex);
    if (id) {
      if (seen.has(id)) continue;
      seen.add(id);
    }
    out.push(fbCopyExercise(row.ex));
  }
  return out;
}

function fbToggle(key) {
  if (fbPicked[key]) delete fbPicked[key];
  else fbPicked[key] = true;
  document.getElementById('fb-error').hidden = true;
  renderFullBodyBuilder();
}

function fbSetSection(planId, on) {
  for (const src of fbSources()) {
    if (src.plan.id !== planId) continue;
    for (const row of src.rows) {
      if (on) fbPicked[row.key] = true;
      else delete fbPicked[row.key];
    }
  }
  document.getElementById('fb-error').hidden = true;
  renderFullBodyBuilder();
}

function renderFullBodyBuilder() {
  if (fbMode === 'edit') { renderExercisePicker(); return; }
  setFullBodyChrome('create');
  /* Neupravený názov sa pri prepnutí jazyka preloží spolu s rozhraním. */
  if (!fbNameTouched) fbName = t('fb.defaultName');
  const nameInput = document.getElementById('fb-name');
  if (nameInput && nameInput.value !== fbName) nameInput.value = fbName;

  const box = document.getElementById('fb-sources');
  box.innerHTML = '';
  for (const src of fbSources()) {
    const section = document.createElement('div');
    section.className = 'fb-source';
    section.dataset.planId = src.plan.id;

    const head = document.createElement('div');
    head.className = 'fb-source-head';
    const title = document.createElement('span');
    title.className = 'fb-source-name';
    title.textContent = planDisplayName(src.plan);
    head.appendChild(title);

    if (src.rows.length) {
      const actions = document.createElement('div');
      actions.className = 'fb-source-actions';
      const all = document.createElement('button');
      all.type = 'button';
      all.className = 'fb-mini';
      all.dataset.act = 'all';
      all.textContent = t('fb.selectAll');
      all.addEventListener('click', () => fbSetSection(src.plan.id, true));
      const none = document.createElement('button');
      none.type = 'button';
      none.className = 'fb-mini';
      none.dataset.act = 'none';
      none.textContent = t('fb.clear');
      none.addEventListener('click', () => fbSetSection(src.plan.id, false));
      actions.append(all, none);
      head.appendChild(actions);
    }
    section.appendChild(head);

    if (!src.rows.length) {
      const empty = document.createElement('p');
      empty.className = 'fb-empty';
      empty.textContent = t('fb.noExercises');
      section.appendChild(empty);
    } else {
      for (const row of src.rows) {
        const on = !!fbPicked[row.key];
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'fb-ex';
        btn.dataset.key = row.key;
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        const check = document.createElement('span');
        check.className = 'fb-check';
        check.setAttribute('aria-hidden', 'true');
        check.textContent = '✓';
        const name = document.createElement('span');
        name.className = 'fb-ex-name';
        name.textContent = row.name;
        const meta = document.createElement('span');
        meta.className = 'fb-ex-meta';
        meta.textContent = row.meta;
        btn.append(check, name, meta);
        btn.addEventListener('click', () => fbToggle(row.key));
        section.appendChild(btn);
      }
    }
    box.appendChild(section);
  }

  const picked = fbPickedRows().length;
  document.getElementById('fb-count').textContent = tPlural('fb.selected', picked);
  const note = document.getElementById('fb-note');
  note.hidden = fbExercisesToCreate().length >= picked;   // upozorní len pri skutočnom zlúčení
  note.textContent = t('fb.duplicates');
}

/* Vytvorí obyčajný vlastný plán s nakopírovanými cvikmi a otvorí ho v existujúcom editore. */
function createFullBodyPlan() {
  const exercises = fbExercisesToCreate();
  const errEl = document.getElementById('fb-error');
  if (!exercises.length) {
    errEl.hidden = false;
    errEl.textContent = t('fb.needOne');
    return;
  }
  const typed = document.getElementById('fb-name').value.trim();
  const id = 'p-' + uid();
  state.plans[id] = {
    id,
    builtin: false,
    customName: typed || t('fb.defaultName'),
    exercises,
  };
  if (!Array.isArray(state.planOrder)) state.planOrder = [];
  state.planOrder.push(id);
  document.getElementById('modal-fullbody').hidden = true;
  document.getElementById('modal-planchoice').hidden = true;
  fbPicked = {};
  /* Plán je už vytvorený a uložený, preto sa zrušenie editora nesmie zahodiť. */
  newPlanId = null;
  saveState();
  switchTab('trening');
  startEditPlan(id);
  renderAll();
}

/* ---------- Výber cvikov z existujúcich plánov pri ÚPRAVE plánu ----------
   Rovnaký princíp ako Full Body builder, ale výsledok sa vloží do práve otvoreného
   editora. Žiadny plán sa neidentifikuje podľa názvu – tlačidlo je dostupné pri každom
   upraviteľnom pláne, takže premenované ani staré Full Body plány nie sú výnimka. */

/* Nájde v návrhu cvik, ktorý zodpovedá zdrojovému cviku:
   zabudovaný podľa stabilného id, vlastný podľa presného názvu.
   Vlastné cviky sa NIKDY nezlučujú len preto, že sa ich názvy podobajú. */
function findDraftIndexForSource(ex) {
  if (!Array.isArray(editDraft)) return null;
  const id = builtinExerciseId(ex);
  if (id) {
    const at = editDraft.findIndex(d => builtinExerciseId(d) === id);
    return at >= 0 ? at : null;
  }
  const name = String(ex.name == null ? '' : ex.name).trim();
  const at = editDraft.findIndex(d => !builtinExerciseId(d)
    && String(d.name == null ? '' : d.name).trim() === name);
  return at >= 0 ? at : null;
}

/* Riadky výberu: všetky zdrojové plány okrem upravovaného + vlastné riadky pre cviky,
   ktoré sa v žiadnom zdrojovom pláne nenašli (napr. ručne napísané). */
function buildEditPickRows() {
  const src = [];
  const matched = new Set();
  for (const planId of activePlanIds()) {
    if (planId === editingPlan) continue;
    const plan = getPlan(planId);
    if (!plan) continue;
    plan.exercises.forEach((ex, index) => {
      const draftIndex = findDraftIndexForSource(ex);
      if (draftIndex !== null) matched.add(draftIndex);
      src.push({
        key: 'src:' + planId + ':' + index,
        planId,
        planName: planDisplayName(plan),
        ex,
        name: exerciseDisplayName(ex),
        meta: fbRowMeta(ex),
        draftIndex,
        initial: draftIndex !== null,
        current: draftIndex !== null,
      });
    });
  }
  const own = [];
  editDraft.forEach((ex, index) => {
    if (matched.has(index)) return;
    own.push({
      key: 'draft:' + index,
      planId: null,
      planName: '',
      ex,
      name: exerciseDisplayName(ex),
      meta: fbRowMeta(ex),
      draftIndex: index,
      initial: true,
      current: true,
    });
  });
  return { src, own };
}

/* Otvorí výber pre plán, ktorý je práve v editore. */
function openExercisePicker() {
  if (editingPlan === null || !Array.isArray(editDraft)) return;
  fbMode = 'edit';
  editPick = buildEditPickRows();
  document.getElementById('fb-error').hidden = true;
  renderExercisePicker();
  document.getElementById('modal-fullbody').hidden = false;
  refreshUpdateBanner();
}

function editPickToggle(row) {
  row.current = !row.current;
  renderExercisePicker();
}

function editPickSetSection(rows, on) {
  rows.forEach(r => { r.current = on; });
  renderExercisePicker();
}

/* Jedna sekcia výberu (zdrojový plán alebo cviky, ktoré sú len v tomto pláne). */
function buildPickerSection(name, rows, withBulk) {
  const section = document.createElement('div');
  section.className = 'fb-source';

  const head = document.createElement('div');
  head.className = 'fb-source-head';
  const title = document.createElement('span');
  title.className = 'fb-source-name';
  title.textContent = name;
  head.appendChild(title);

  if (withBulk && rows.length) {
    const actions = document.createElement('div');
    actions.className = 'fb-source-actions';
    const all = document.createElement('button');
    all.type = 'button';
    all.className = 'fb-mini';
    all.textContent = t('fb.selectAll');
    all.addEventListener('click', () => editPickSetSection(rows, true));
    const none = document.createElement('button');
    none.type = 'button';
    none.className = 'fb-mini';
    none.textContent = t('fb.clear');
    none.addEventListener('click', () => editPickSetSection(rows, false));
    actions.append(all, none);
    head.appendChild(actions);
  }
  section.appendChild(head);

  for (const row of rows) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'fb-ex';
    btn.dataset.key = row.key;
    btn.setAttribute('aria-pressed', row.current ? 'true' : 'false');
    const check = document.createElement('span');
    check.className = 'fb-check';
    check.setAttribute('aria-hidden', 'true');
    check.textContent = '✓';
    const nm = document.createElement('span');
    nm.className = 'fb-ex-name';
    nm.textContent = row.name;
    const meta = document.createElement('span');
    meta.className = 'fb-ex-meta';
    meta.textContent = row.meta;
    btn.append(check, nm, meta);
    btn.addEventListener('click', () => editPickToggle(row));
    section.appendChild(btn);
  }
  return section;
}

function renderExercisePicker() {
  setFullBodyChrome('edit');
  const box = document.getElementById('fb-sources');
  box.innerHTML = '';

  /* Sekcie v poradí plánov, presne s názvami, ktoré používateľ zadal. */
  const order = [];
  const byPlan = new Map();
  for (const row of editPick.src) {
    if (!byPlan.has(row.planId)) {
      byPlan.set(row.planId, { name: row.planName, rows: [] });
      order.push(row.planId);
    }
    byPlan.get(row.planId).rows.push(row);
  }

  let total = 0;
  for (const key of order) {
    const sec = byPlan.get(key);
    total += sec.rows.filter(r => r.current).length;
    box.appendChild(buildPickerSection(sec.name, sec.rows, true));
  }
  if (editPick.own.length) {
    total += editPick.own.filter(r => r.current).length;
    box.appendChild(buildPickerSection(
      planDisplayName(getPlan(editingPlan)) || t('pokrok.workoutFallback'),
      editPick.own,
      false
    ));
  }

  document.getElementById('fb-count').textContent = tPlural('fb.selected', total);
  document.getElementById('fb-note').hidden = true;
  document.getElementById('fb-error').hidden = true;
}

/* Potvrdí výber: odoberie odškrtnuté a pridá novo zaškrtnuté.
   Už existujúce cviky si zachovajú upravené hodnoty aj poradie. */
function applyExercisePicker() {
  if (!Array.isArray(editDraft)) { closeFullBodyBuilder(); return; }

  const remove = new Set();
  const add = [];
  for (const row of editPick.src) {
    if (row.current && !row.initial) add.push(row.ex);
    if (!row.current && row.initial && row.draftIndex !== null) remove.add(row.draftIndex);
  }
  for (const row of editPick.own) {
    if (!row.current && row.draftIndex !== null) remove.add(row.draftIndex);
  }

  const kept = editDraft.filter((_, i) => !remove.has(i));
  /* Deduplikácia: ten istý zabudovaný cvik (rovnaké stabilné id) sa pridá len raz.
     Vlastné cviky sa nikdy nezlučujú, aj keď majú rovnaký názov. */
  const seen = new Set();
  for (const ex of kept) {
    const id = builtinExerciseId(ex);
    if (id) seen.add(id);
  }
  const added = [];
  for (const ex of add) {
    const id = builtinExerciseId(ex);
    if (id) {
      if (seen.has(id)) continue;
      seen.add(id);
    }
    added.push(fbCopyExercise(ex));
  }

  editDraft = kept.concat(added);
  closeFullBodyBuilder();
  renderEditPanel();
}

/* ---------- Ťahanie poradia (Pointer Events) ----------
   HTML5 drag & drop nie je na iOS spoľahlivé, preto používame pointer events.
   Zachytenie ukazovateľa je na TRVALOM kontajneri (nie na riadku), takže ho
   prekreslenie počas ťahania nepreruší. */

let dragInfo = null;   // { kind: 'exercise'|'plan', container, pointerId, index, planId }

function beginDrag(kind, container, pointerId, opts) {
  dragInfo = Object.assign({ kind, container, pointerId }, opts || {});
  try { container.setPointerCapture(pointerId); } catch (e) {}
}

function endDrag() {
  if (!dragInfo) return;
  const info = dragInfo;
  dragInfo = null;
  try { info.container.releasePointerCapture(info.pointerId); } catch (e) {}
  document.querySelectorAll('.dragging').forEach(el => el.classList.remove('dragging'));
}

/* Ktorý riadok editora je najbližšie k danému bodu (rozhoduje zvislý stred). */
function editRowIndexAt(container, clientY) {
  let best = null;
  let bestDist = Infinity;
  container.querySelectorAll('.edit-row').forEach((row) => {
    const r = row.getBoundingClientRect();
    const dist = Math.abs(clientY - (r.top + r.height / 2));
    if (dist < bestDist) { bestDist = dist; best = Number(row.dataset.idx); }
  });
  return best;
}

/* Ktorý plán je najbližšie k danému bodu – chips sa zalamujú, preto sa meria v 2D. */
function chipPlanIdAt(container, clientX, clientY) {
  let best = null;
  let bestDist = Infinity;
  container.querySelectorAll('.chip-wrap').forEach((wrap) => {
    if (!wrap.dataset.planId) return;
    const r = wrap.getBoundingClientRect();
    const dx = clientX - (r.left + r.width / 2);
    const dy = clientY - (r.top + r.height / 2);
    const dist = dx * dx + dy * dy;
    if (dist < bestDist) { bestDist = dist; best = wrap.dataset.planId; }
  });
  return best;
}

function setupEditRowDrag() {
  const container = document.getElementById('edit-rows');
  if (!container) return;

  container.addEventListener('pointerdown', (e) => {
    if (editingPlan === null || !Array.isArray(editDraft)) return;
    const handle = e.target.closest ? e.target.closest('.drag-handle') : null;
    if (!handle) return;
    const row = handle.closest('.edit-row');
    if (!row) return;
    e.preventDefault();      // ťahanie nesmie aktivovať vstupy ani skrolovať stránkou
    beginDrag('exercise', container, e.pointerId, { index: Number(row.dataset.idx) });
    row.classList.add('dragging');
  });

  container.addEventListener('pointermove', (e) => {
    if (!dragInfo || dragInfo.kind !== 'exercise' || e.pointerId !== dragInfo.pointerId) return;
    e.preventDefault();
    const target = editRowIndexAt(container, e.clientY);
    if (target === null || target === dragInfo.index) return;
    const moved = editDraft.splice(dragInfo.index, 1)[0];
    editDraft.splice(target, 0, moved);
    dragInfo.index = target;
    renderEditPanel();
    const row = container.querySelector('.edit-row[data-idx="' + target + '"]');
    if (row) row.classList.add('dragging');
  });

  const finish = (e) => {
    if (!dragInfo || dragInfo.kind !== 'exercise') return;
    if (e.pointerId !== undefined && e.pointerId !== dragInfo.pointerId) return;
    endDrag();
  };
  container.addEventListener('pointerup', finish);
  container.addEventListener('pointercancel', finish);
  /* Uvoľnenie mimo kontajnera (alebo keď prehliadač ukazovateľ stratí) musí ťahanie
     tiež korektne ukončiť – inak by zostal visieť stav ťahania. */
  window.addEventListener('pointerup', finish);
  window.addEventListener('pointercancel', finish);
}

function setupChipDrag() {
  const container = document.getElementById('plan-chips');
  if (!container) return;

  container.addEventListener('pointerdown', (e) => {
    const handle = e.target.closest ? e.target.closest('.chip-drag') : null;
    if (!handle) return;
    const wrap = handle.closest('.chip-wrap');
    if (!wrap || !wrap.dataset.planId) return;
    e.preventDefault();
    beginDrag('plan', container, e.pointerId, { planId: wrap.dataset.planId });
    wrap.classList.add('dragging');
  });

  container.addEventListener('pointermove', (e) => {
    if (!dragInfo || dragInfo.kind !== 'plan' || e.pointerId !== dragInfo.pointerId) return;
    e.preventDefault();
    const targetId = chipPlanIdAt(container, e.clientX, e.clientY);
    if (!targetId || targetId === dragInfo.planId) return;

    const ordered = activePlanIds();
    const from = ordered.indexOf(dragInfo.planId);
    const to = ordered.indexOf(targetId);
    if (from < 0 || to < 0) return;
    ordered.splice(from, 1);
    ordered.splice(to, 0, dragInfo.planId);
    /* Nič sa nesmie stratiť: prípadné id mimo aktívnych plánov idú na koniec. */
    const extras = state.planOrder.filter(id => ordered.indexOf(id) === -1);
    state.planOrder = ordered.concat(extras);
    renderTrening();
    const wrap = container.querySelector('.chip-wrap[data-plan-id="' + dragInfo.planId + '"]');
    if (wrap) wrap.classList.add('dragging');
  });

  const finish = (e) => {
    if (!dragInfo || dragInfo.kind !== 'plan') return;
    if (e.pointerId !== undefined && e.pointerId !== dragInfo.pointerId) return;
    endDrag();
    saveState();             // poradie sa ukladá raz, na konci ťahania
  };
  container.addEventListener('pointerup', finish);
  container.addEventListener('pointercancel', finish);
  window.addEventListener('pointerup', finish);
  window.addEventListener('pointercancel', finish);
}

/* Posunie plán v poradí (rotácia aj chipy používajú toto poradie). */
function movePlan(id, delta) {
  if (!id || !Array.isArray(state.planOrder)) return;
  const i = state.planOrder.indexOf(id);
  const j = i + delta;
  if (i < 0 || j < 0 || j >= state.planOrder.length) return;
  const tmp = state.planOrder[i];
  state.planOrder[i] = state.planOrder[j];
  state.planOrder[j] = tmp;
  saveState();
  renderTrening();
}

function removePlan(id) {
  if (!getPlan(id)) return;
  delete state.plans[id];
  if (Array.isArray(state.planOrder)) {
    state.planOrder = state.planOrder.filter(x => x !== id);
  }
  if (editingPlan === id) { editingPlan = null; editDraft = null; }
  if (newPlanId === id) newPlanId = null;
}

function requestDeletePlan() {
  const plan = getPlan(editingPlan);
  if (!plan) return;
  if (activePlanIds().length <= 1) {
    showGeneric(t('trening.deletePlanTitle'), t('common.ok'), null, t('trening.deletePlanLast'));
    return;
  }
  const id = plan.id;
  showGeneric(t('trening.deletePlanTitle'), t('common.delete'), () => {
    removePlan(id);
    if (!getPlan(selectedPlan)) selectedPlan = activePlanIds()[0] || null;
    saveState();
    renderAll();
  }, t('trening.deletePlanConfirm', { name: esc(planDisplayName(plan)) }));
}

function renderEditPanel() {
  const plan = getPlan(editingPlan);
  if (!plan) { editingPlan = null; return; }

  const ids = activePlanIds();
  const idx = ids.indexOf(editingPlan);
  document.getElementById('btn-plan-left').disabled = idx <= 0;
  document.getElementById('btn-plan-right').disabled = idx < 0 || idx >= ids.length - 1;
  document.getElementById('btn-plan-delete').disabled = ids.length <= 1;

  const rows = document.getElementById('edit-rows');
  rows.innerHTML = '';
  editDraft.forEach((ex, idx) => {
    const row = document.createElement('div');
    row.className = 'edit-row';
    row.dataset.idx = idx;
    const exLabel = escAttr(exerciseDisplayName(ex));
    row.innerHTML = `
      <span class="edit-tools">
        <button type="button" class="drag-handle" title="${t('trening.dragExercise')}" aria-label="${t('trening.dragExercise')}: ${exLabel}">⠿</button>
        <button type="button" class="btn-icon-sm edit-move" data-move="-1" title="${t('trening.moveUp')}" aria-label="${t('trening.moveUp')}">↑</button>
        <button type="button" class="btn-icon-sm edit-move" data-move="1" title="${t('trening.moveDown')}" aria-label="${t('trening.moveDown')}">↓</button>
      </span>
      <input type="text" class="edit-name" value="${exLabel}" placeholder="${t('trening.exercisePlaceholder')}">
      <input type="number" class="edit-num" min="1" max="99" value="${ex.sets}">
      <input type="number" class="edit-num" min="1" max="99" value="${ex.reps}">
      <input type="number" class="edit-num" min="0" max="999" value="${ex.weight}">
      <button class="btn-icon btn-icon-danger" title="${t('trening.deleteExerciseTitle')}">🗑️</button>`;

    /* Presun cviku – prístupné tlačidlá (ťahanie uchopovadlom je alternatíva). */
    row.querySelectorAll('.edit-move').forEach(btn => {
      btn.addEventListener('click', () => moveDraftExercise(idx, Number(btn.dataset.move)));
    });

    /* Voliteľná sekcia "Série do zlyhania" / "Sets to failure".
       Počet chipov sa generuje dynamicky z počtu sérií daného cviku. */
    const failureBox = document.createElement('div');
    failureBox.className = 'edit-failure';
    failureBox.addEventListener('click', (e) => {
      const btn = e.target.closest ? e.target.closest('[data-set]') : null;
      if (!btn) return;
      const exctx = editDraft[idx];
      const n = parseInt(btn.dataset.set, 10);
      if (n === 0) {
        exctx.plannedFailureSets = [];
      } else {
        const current = cleanFailureSets(exctx.plannedFailureSets, failureSetLimit(exctx.sets));
        const at = current.indexOf(n);
        if (at >= 0) current.splice(at, 1);
        else current.push(n);
        exctx.plannedFailureSets = current;
      }
      renderPlanFailureChips(failureBox, idx);
    });
    row.appendChild(failureBox);

    /* Voliteľné jednostranné cvičenie: "Cvičiť každú stranu samostatne".
       Predvolene VYPNUTÉ – existujúce cviky sa nikdy nemenia. */
    const sideBox = document.createElement('div');
    sideBox.className = 'edit-side';
    const sideToggle = document.createElement('label');
    sideToggle.className = 'edit-side-toggle';
    const sideCheck = document.createElement('input');
    sideCheck.type = 'checkbox';
    sideCheck.className = 'edit-unilateral';
    sideCheck.checked = ex.unilateral === true;
    const sideText = document.createElement('span');
    sideText.textContent = t('unilateral.trainBoth');
    sideToggle.append(sideCheck, sideText);

    const sideStart = document.createElement('div');
    sideStart.className = 'edit-side-start';
    sideStart.hidden = ex.unilateral !== true;
    for (const side of ['left', 'right']) {
      const b = document.createElement('button');
      b.type = 'button';
      const currentStart = ex.startSide === 'right' ? 'right' : 'left';
      b.className = 'side-chip' + (currentStart === side ? ' active' : '');
      b.dataset.side = side;
      b.textContent = t(side === 'right' ? 'unilateral.startRight' : 'unilateral.startLeft');
      b.setAttribute('aria-pressed', currentStart === side ? 'true' : 'false');
      b.addEventListener('click', () => {
        editDraft[idx].startSide = side;
        sideStart.querySelectorAll('.side-chip').forEach(c => {
          const on = c.dataset.side === side;
          c.classList.toggle('active', on);
          c.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
      });
      sideStart.appendChild(b);
    }

    sideCheck.addEventListener('change', () => {
      if (sideCheck.checked) {
        editDraft[idx].unilateral = true;
        if (editDraft[idx].startSide !== 'right') editDraft[idx].startSide = 'left';
      } else {
        delete editDraft[idx].unilateral;
        delete editDraft[idx].startSide;
      }
      sideStart.hidden = !sideCheck.checked;
    });

    sideBox.append(sideToggle, sideStart);
    row.appendChild(sideBox);

    const nameInput = row.querySelector('.edit-name');
    const numInputs = row.querySelectorAll('.edit-num');
    nameInput.addEventListener('input', () => {
      // typing converts a built-in row into a custom exercise (keeps typed text as-is)
      if (ex.id && BUILTIN_EXERCISE_IDS.has(ex.id)) {
        delete ex.id;
        ex.builtin = false;
      }
      editDraft[idx].name = nameInput.value;
      row.classList.remove('invalid');
    });
    numInputs[0].addEventListener('input', () => {
      editDraft[idx].sets = num(numInputs[0].value);
      // zmena počtu sérií hneď prispôsobí chipy a oreže už neplatné voľby
      renderPlanFailureChips(failureBox, idx);
    });
    numInputs[1].addEventListener('input', () => { editDraft[idx].reps = num(numInputs[1].value); });
    numInputs[2].addEventListener('input', () => { editDraft[idx].weight = num(numInputs[2].value); });
    row.querySelector('.btn-icon-danger').addEventListener('click', () => {
      if (editDraft.length <= 1) {
        showGeneric(t('trening.lastExerciseBlock'), t('common.ok'), null);
        return;
      }
      const name = editDraft[idx].name || '?';
      showGeneric(t('trening.deleteExercise', { name }), t('common.ok'), () => {
        editDraft.splice(idx, 1);
        renderEditPanel();
      });
    });
    renderPlanFailureChips(failureBox, idx);
    rows.appendChild(row);
  });
}

/* Posunie cvik v návrhu plánu o jednu pozíciu (prístupná alternatíva k ťahaniu).
   Poradie sa uloží až tlačidlom Uložiť – rovnako ako každá iná zmena v editore. */
function moveDraftExercise(idx, delta) {
  if (!Array.isArray(editDraft)) return;
  const j = idx + delta;
  if (j < 0 || j >= editDraft.length) return;
  const tmp = editDraft[idx];
  editDraft[idx] = editDraft[j];
  editDraft[j] = tmp;
  renderEditPanel();
}

/* Vykreslí chipy "Série do zlyhania" pre jeden riadok editora (1..počet sérií + "Žiadna").
   Pri platnom počte sérií zároveň oreže voľby nad nový maximálny počet. */
function renderPlanFailureChips(box, idx) {
  const ex = editDraft[idx];
  const max = failureSetLimit(ex.sets);
  if (max >= 1) ex.plannedFailureSets = cleanFailureSets(ex.plannedFailureSets, max);
  const selected = Array.isArray(ex.plannedFailureSets) ? ex.plannedFailureSets : [];

  box.innerHTML = '';

  const label = document.createElement('span');
  label.className = 'edit-failure-label';
  label.textContent = t('failure.plannedLabel');
  box.appendChild(label);

  const chips = document.createElement('div');
  chips.className = 'failure-chips';
  for (let n = 1; n <= max; n++) {
    const on = selected.indexOf(n) >= 0;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'failure-chip' + (on ? ' active' : '');
    btn.dataset.set = n;
    btn.textContent = n;
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.setAttribute('aria-label', on ? t('failure.removeMarker') : t('failure.markSet'));
    btn.title = on ? t('failure.removeMarker') : t('failure.markSet');
    chips.appendChild(btn);
  }

  const none = document.createElement('button');
  none.type = 'button';
  none.className = 'failure-chip failure-chip-none' + (selected.length === 0 ? ' active' : '');
  none.dataset.set = 0;
  none.textContent = t('failure.none');
  none.setAttribute('aria-label', t('failure.noSets'));
  none.title = t('failure.noSets');
  chips.appendChild(none);

  box.appendChild(chips);
}

function escAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function num(v) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

/* Normalizuje zoznam sérií do zlyhania: celé čísla 1..maxSets, bez duplicít, vzostupne.
   Chráni pred poškodenými alebo importovanými dátami – vždy vráti platné pole (nikdy null). */
function cleanFailureSets(value, maxSets) {
  const rawMax = Math.round(Number(maxSets));
  const max = Number.isFinite(rawMax) ? Math.min(99, Math.max(0, rawMax)) : 0;
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  for (const item of value) {
    const n = Math.round(Number(item));
    if (!Number.isFinite(n) || n < 1 || n > max) continue;
    seen.add(n);
  }
  return Array.from(seen).sort((a, b) => a - b);
}

/* Koľko sérií do zlyhania sa dá vybrať pre daný počet sérií (0 = neplatný vstup). */
function failureSetLimit(sets) {
  const n = Math.round(Number(sets));
  return (Number.isFinite(n) && n >= 1) ? Math.min(99, n) : 0;
}

/* Normalizuje mapu strán { left: [...], right: [...] } na čísla sérií 1..maxSets.
   Vždy vráti platný objekt (nikdy null) – bezpečné pre poškodené aj importované dáta. */
function cleanSideSets(value, maxSets) {
  const out = { left: [], right: [] };
  if (!value || typeof value !== 'object' || Array.isArray(value)) return out;
  out.left = cleanFailureSets(value.left, maxSets);
  out.right = cleanFailureSets(value.right, maxSets);
  return out;
}

function saveEditPlan() {
  const plan = getPlan(editingPlan);
  if (!plan) return;
  const errEl = document.getElementById('edit-error');
  const typed = document.getElementById('edit-plan-name').value.trim();
  if (!typed) {
    errEl.hidden = false;
    errEl.textContent = t('trening.planNameInvalid');
    return;
  }
  const valid = editDraft.every(ex =>
    String(ex.name).trim() !== '' &&
    ex.sets >= 1 && ex.sets <= 99 &&
    ex.reps >= 1 && ex.reps <= 99 &&
    ex.weight >= 0 && ex.weight <= 999
  );
  if (!valid || editDraft.length === 0) {
    errEl.hidden = false;
    errEl.textContent = t('trening.editInvalid');
    return;
  }
  errEl.hidden = true;

  // Nezmenený názov zabudovaného plánu zostáva prekladateľný; každá zmena je vlastný názov.
  const shown = planDisplayName(plan);
  plan.customName = (plan.builtin && typed === shown) ? (plan.customName || null) : typed;

  plan.exercises = editDraft.map(ex => {
    const sets = Math.round(ex.sets);
    const out = {
      name: String(ex.name).trim(),
      sets,
      reps: Math.round(ex.reps),
      weight: Math.round(ex.weight * 2) / 2,
      plannedFailureSets: cleanFailureSets(ex.plannedFailureSets, sets),
    };
    if (ex.id && BUILTIN_EXERCISE_IDS.has(ex.id)) {
      out.id = ex.id;
      out.builtin = true;
    }
    /* Jednostranné cvičenie sa ukladá len keď je zapnuté – ostatné cviky zostávajú bez zmeny. */
    if (ex.unilateral === true) {
      out.unilateral = true;
      out.startSide = ex.startSide === 'right' ? 'right' : 'left';
    }
    return out;
  });
  newPlanId = null;
  editingPlan = null;
  editDraft = null;
  /* Priebeh rozbehnutého tréningu zostáva nedotknutý – mení sa len plán, nie session.
     Uložený plán sa hneď prejaví v aktívnom tréningu (váhy, série), značky zůstanú. */
  if (getSession()) setSessionNote('trening.planSaved', 8000);
  saveState();
  renderAll();
}

function cancelEditPlan() {
  const discarded = closeEditor();
  if (!getPlan(selectedPlan)) selectedPlan = activePlanIds()[0] || null;
  if (discarded) saveState();
  renderAll();
}

/* ---------- Vykreslenie: POKROK ---------- */

/* ---------- Pokrok: podpohľady (Pokrok / Telo / Jedlo) ----------
   Spodná päťkarta zostáva nezmenená; tieto tri podpohľady žijú vnútri obrazovky
   Pokrok. Stav je len v pamäti – rovnako ako mesiac v kalendári. */

let pokrokView = 'progress';
let chartField = 'weightKg';
let measureEditId = null;
let foodModalMode = 'entry';
let foodModalId = null;
let foodDate = null;          // vybraný deň v denníku jedla (null = dnes)

const MEASURE_META = [
  { field: 'weightKg', kind: 'weight', key: 'body.f.weight' },
  { field: 'waistCm', kind: 'length', key: 'body.f.waist' },
  { field: 'chestCm', kind: 'length', key: 'body.f.chest' },
  { field: 'armLeftCm', kind: 'length', key: 'body.f.armLeft' },
  { field: 'armRightCm', kind: 'length', key: 'body.f.armRight' },
  { field: 'thighLeftCm', kind: 'length', key: 'body.f.thighLeft' },
  { field: 'thighRightCm', kind: 'length', key: 'body.f.thighRight' },
  { field: 'hipCm', kind: 'length', key: 'body.f.hip' },
];

/* Aktivita: faktory používa Mifflin-St Jeor pre odhad denného výdaja energie. */
const ACTIVITY_LEVELS = [
  { id: 'sedentary', factor: 1.2, key: 'calorie.actSedentary' },
  { id: 'light', factor: 1.375, key: 'calorie.actLight' },
  { id: 'moderate', factor: 1.55, key: 'calorie.actModerate' },
  { id: 'active', factor: 1.725, key: 'calorie.actActive' },
  { id: 'very', factor: 1.9, key: 'calorie.actVery' },
];

function measureMeta(field) {
  return MEASURE_META.find((m) => m.field === field) || MEASURE_META[0];
}
function measureLabel(field) { return t(measureMeta(field).key); }
function measureUnit(kind) { return kind === 'weight' ? weightUnitLabel() : lengthUnitLabel(); }
function formatMeasureValue(value, kind) {
  return formatMeasure(value, kind) + ' ' + measureUnit(kind);
}
function formatWhen(ms) { return formatBackupTimestamp(ms); }

/* Malý pomocník: pole s popisom (rovnaký vzhľad ako ostatné formuláre).
   Pri type="number" musí byť typ nastavený SKÔR než hodnota – číselný input
   odmietne nečíselnú hodnotu a ticho ju zahodí. */
function buildField(id, labelText, value, opts) {
  const o = opts || {};
  const wrap = document.createElement('div');
  wrap.className = 'field' + (o.wide ? ' field-wide' : '');
  const label = document.createElement('label');
  label.setAttribute('for', id);
  label.textContent = labelText;
  const input = document.createElement('input');
  input.type = o.text ? 'text' : 'number';
  input.id = id;
  input.autocomplete = 'off';
  if (o.text) {
    input.maxLength = o.maxLength || 120;
  } else {
    input.step = o.step || '0.1';
    input.min = '0';
    input.inputMode = 'decimal';
  }
  if (value !== '' && value !== null && value !== undefined) input.value = String(value);
  wrap.append(label, input);
  return wrap;
}

function buildSelect(id, labelText, options, value) {
  const wrap = document.createElement('div');
  wrap.className = 'field field-wide';
  const label = document.createElement('label');
  label.setAttribute('for', id);
  label.textContent = labelText;
  const sel = document.createElement('select');
  sel.id = id;
  for (const o of options) {
    const opt = document.createElement('option');
    opt.value = o.value;
    opt.textContent = o.label;
    if (o.value === value) opt.selected = true;
    sel.appendChild(opt);
  }
  wrap.append(label, sel);
  return wrap;
}

function setPokrokView(view) {
  pokrokView = (view === 'body' || view === 'food') ? view : 'progress';
  renderPokrok();
  refreshUpdateBanner();
}

function renderPokrokSubtabs() {
  const bar = document.getElementById('pokrok-subtabs');
  if (!bar) return;
  bar.querySelectorAll('.subtab').forEach((b) => {
    const on = b.dataset.pokrok === pokrokView;
    b.classList.toggle('active', on);
    b.setAttribute('aria-selected', on ? 'true' : 'false');
  });
  for (const v of ['progress', 'body', 'food']) {
    const el = document.getElementById('subview-' + v);
    if (el) el.hidden = v !== pokrokView;
  }
}

/* ---------- Veľkosť uložených dát (len upozornenie, nikdy sa nemaže) ---------- */
function renderStorageNotice(elId) {
  const el = document.getElementById(elId);
  if (!el) return;
  const over = storageBytes() >= STORAGE_NOTICE_BYTES;
  el.hidden = !over;
  if (over) el.textContent = t('body.storageNotice');
}

/* ---------- Telo: jednotky ---------- */
function renderBodyUnits() {
  const box = document.getElementById('body-units');
  if (!box) return;
  box.querySelectorAll('.unit-chip').forEach((c) => {
    const on = c.dataset.units === bodyUnits();
    c.classList.toggle('active', on);
    c.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
}

function setBodyUnits(units) {
  state.settings.bodyUnits = units === 'imperial' ? 'imperial' : 'metric';
  saveState();
  renderPokrok();
}

/* ---------- Telo: súhrn najnovších mier ---------- */
function renderBodySummary() {
  const box = document.getElementById('body-summary');
  if (!box) return;
  box.innerHTML = '';
  if (!measureSeries('weightKg').length && !MEASURE_META.some((m) => measureSeries(m.field).length)) {
    const p = document.createElement('p');
    p.className = 'empty-state';
    p.textContent = t('body.empty');
    box.appendChild(p);
    return;
  }
  for (const m of MEASURE_META) {
    const series = measureSeries(m.field);
    if (!series.length) continue;
    const last = series[series.length - 1];
    const prev = series.length > 1 ? series[series.length - 2] : null;
    const row = document.createElement('div');
    row.className = 'measure-row';
    const name = document.createElement('span');
    name.className = 'measure-name';
    name.textContent = t(m.key);
    if (prev) {
      /* Neutrálne: nárast ani pokles nie je sám o sebe dobrý ani zlý. */
      const nowShown = m.kind === 'weight' ? weightToDisplay(last.value) : lengthToDisplay(last.value);
      const prevShown = m.kind === 'weight' ? weightToDisplay(prev.value) : lengthToDisplay(prev.value);
      const diff = Math.round((nowShown - prevShown) * 10) / 10;
      const delta = document.createElement('span');
      delta.className = 'measure-delta';
      delta.textContent = ' ' + (diff > 0 ? '+' : (diff < 0 ? '−' : '±'))
        + Math.abs(diff).toFixed(1) + ' ' + measureUnit(m.kind);
      name.appendChild(delta);
    }
    const val = document.createElement('span');
    val.className = 'measure-value';
    val.textContent = formatMeasureValue(last.value, m.kind);
    row.append(name, val);
    box.appendChild(row);
  }
}

/* ---------- Telo: história meraní ---------- */
function renderBodyHistory() {
  const box = document.getElementById('body-history');
  if (!box) return;
  box.innerHTML = '';
  const list = sortedMeasurements().slice().reverse();
  if (!list.length) {
    const p = document.createElement('p');
    p.className = 'empty-state';
    p.textContent = t('body.empty');
    box.appendChild(p);
    return;
  }
  for (const m of list) {
    const row = document.createElement('div');
    row.className = 'measure-entry';

    const head = document.createElement('div');
    head.className = 'measure-entry-head';
    const date = document.createElement('span');
    date.className = 'measure-entry-date';
    date.textContent = formatDate(m.date);
    const actions = document.createElement('span');
    actions.className = 'measure-entry-actions';
    const edit = document.createElement('button');
    edit.type = 'button';
    edit.className = 'btn-icon-sm';
    edit.textContent = '✏️';
    edit.title = t('body.editTitle');
    edit.setAttribute('aria-label', t('body.editTitle'));
    edit.addEventListener('click', () => openMeasureModal(m.id));
    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'btn-icon-sm btn-icon-danger';
    del.textContent = '🗑️';
    del.title = t('body.deleteTitle');
    del.setAttribute('aria-label', t('body.deleteTitle'));
    del.addEventListener('click', () => requestDeleteMeasurement(m.id));
    actions.append(edit, del);
    head.append(date, actions);
    row.appendChild(head);

    const values = document.createElement('div');
    values.className = 'measure-entry-values';
    const parts = MEASURE_META.filter((x) => m[x.field] !== null)
      .map((x) => measureLabel(x.field) + ' ' + formatMeasureValue(m[x.field], x.kind));
    values.textContent = parts.length ? parts.join(' · ') : t('body.noValues');
    row.appendChild(values);

    if (m.note) {
      const note = document.createElement('div');
      note.className = 'measure-entry-note';
      note.textContent = '“' + m.note + '”';
      row.appendChild(note);
    }
    box.appendChild(row);
  }
}

/* ---------- Telo: graf (vlastné SVG, žiadna knižnica) ---------- */
function buildSparkline(series, kind) {
  const ns = 'http://www.w3.org/2000/svg';
  const W = 300, H = 140, PAD = 12;
  const vals = series.map((p) => (kind === 'weight' ? weightToDisplay(p.value) : lengthToDisplay(p.value)));
  const lo = Math.min(...vals), hi = Math.max(...vals);
  const span = (hi - lo) || 1;
  const n = vals.length;

  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('class', 'chart-svg');
  svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', t('body.chartAria', {
    n, min: (Math.round(lo * 10) / 10).toFixed(1), max: (Math.round(hi * 10) / 10).toFixed(1),
  }));

  const x = (i) => PAD + (i * (W - 2 * PAD)) / (n - 1);
  const y = (v) => H - PAD - ((v - lo) / span) * (H - 2 * PAD);
  const pts = vals.map((v, i) => [x(i), y(v)]);
  const line = pts.map(([px, py], i) => (i ? 'L' : 'M') + px.toFixed(1) + ' ' + py.toFixed(1)).join(' ');
  const area = line + ' L' + x(n - 1).toFixed(1) + ' ' + (H - PAD) + ' L' + x(0).toFixed(1) + ' ' + (H - PAD) + ' Z';

  const areaEl = document.createElementNS(ns, 'path');
  areaEl.setAttribute('class', 'chart-area');
  areaEl.setAttribute('d', area);
  svg.appendChild(areaEl);

  const lineEl = document.createElementNS(ns, 'path');
  lineEl.setAttribute('class', 'chart-line');
  lineEl.setAttribute('d', line);
  svg.appendChild(lineEl);

  /* Pri veľmi dlhej histórii sa bodky vynechávajú, aby graf nebol preplnený. */
  if (n <= 40) {
    for (const [px, py] of pts) {
      const dot = document.createElementNS(ns, 'circle');
      dot.setAttribute('class', 'chart-dot');
      dot.setAttribute('cx', px.toFixed(1));
      dot.setAttribute('cy', py.toFixed(1));
      dot.setAttribute('r', '2.5');
      svg.appendChild(dot);
    }
  }
  return svg;
}

function renderBodyChart() {
  const card = document.getElementById('body-chart-card');
  const chips = document.getElementById('body-metric-chips');
  const box = document.getElementById('body-chart');
  const rangeEl = document.getElementById('body-chart-range');
  if (!card || !chips || !box || !rangeEl) return;

  const withPoints = MEASURE_META.filter((m) => measureSeries(m.field).length >= 1);
  card.hidden = withPoints.length === 0;
  if (!withPoints.length) return;
  if (!withPoints.some((m) => m.field === chartField)) chartField = withPoints[0].field;

  chips.innerHTML = '';
  for (const m of MEASURE_META) {
    const series = measureSeries(m.field);
    if (!series.length) continue;
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'metric-chip' + (chartField === m.field ? ' active' : '');
    chip.dataset.field = m.field;
    chip.textContent = t(m.key);
    chip.setAttribute('aria-pressed', chartField === m.field ? 'true' : 'false');
    chip.addEventListener('click', () => { chartField = m.field; renderBodyChart(); });
    chips.appendChild(chip);
  }

  const meta = measureMeta(chartField);
  const series = measureSeries(chartField);
  box.innerHTML = '';
  if (series.length < 2) {
    rangeEl.textContent = t('body.chartNeedTwo');
    return;
  }
  box.appendChild(buildSparkline(series, meta.kind));
  const vals = series.map((p) => (meta.kind === 'weight' ? weightToDisplay(p.value) : lengthToDisplay(p.value)));
  rangeEl.textContent = t('body.chartRange', {
    min: (Math.round(Math.min(...vals) * 10) / 10).toFixed(1),
    max: (Math.round(Math.max(...vals) * 10) / 10).toFixed(1),
    unit: measureUnit(meta.kind),
  });
}

/* ---------- Telo: meranie (modal) ---------- */
function renderMeasureFields(values) {
  const box = document.getElementById('measure-fields');
  if (!box) return;
  box.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'field-grid';
  for (const m of MEASURE_META) {
    const current = values && values[m.field] !== null && values[m.field] !== undefined
      ? Math.round((m.kind === 'weight' ? weightToDisplay(values[m.field]) : lengthToDisplay(values[m.field])) * 10) / 10
      : '';
    grid.appendChild(buildField('m-' + m.field, measureLabel(m.field) + ' (' + measureUnit(m.kind) + ')', current));
  }
  const hint = document.createElement('p');
  hint.className = 'field-hint field-wide';
  hint.textContent = t('body.fieldsHint');
  grid.appendChild(hint);
  box.appendChild(grid);
}

function openMeasureModal(id) {
  measureEditId = id || null;
  const m = id ? measurementById(id) : null;
  document.getElementById('measure-title').textContent = t(m ? 'body.editTitle' : 'body.addTitle');
  document.getElementById('measure-date').value = m ? m.date : todayISO();
  document.getElementById('measure-note').value = m ? m.note : '';
  document.getElementById('measure-error').hidden = true;
  renderMeasureFields(m);
  document.getElementById('modal-measure').hidden = false;
  refreshUpdateBanner();
}

function showMeasureError(msg) {
  const el = document.getElementById('measure-error');
  if (!el) return;
  el.textContent = msg;
  el.hidden = false;
}

function saveMeasure() {
  const date = document.getElementById('measure-date').value || '';
  if (!isDateKey(date)) { showMeasureError(t('body.errDate')); return; }

  const values = {};
  const bad = [];
  document.querySelectorAll('#measure-fields .field input').forEach((inp) => {
    const field = String(inp.id).slice(2);
    const raw = inp.value.trim();
    if (raw === '') { values[field] = null; return; }
    const n = Number(raw);
    const meta = measureMeta(field);
    const limit = MEASURE_LIMITS[field];
    const canon = (Number.isFinite(n) && n > 0)
      ? (meta.kind === 'weight' ? weightFromDisplay(n) : lengthFromDisplay(n))
      : null;
    if (canon === null || canon < limit[0] || canon > limit[1]) {
      bad.push(measureLabel(field));
      values[field] = null;
      return;
    }
    values[field] = canon;   // platná hodnota sa ukladá presne, nikdy sa neupravuje
  });

  if (bad.length) { showMeasureError(t('body.errRange', { fields: bad.join(', ') })); return; }
  const note = document.getElementById('measure-note').value.trim();
  if (MEASURE_FIELDS.every((f) => values[f] === null) && !note) {
    showMeasureError(t('body.errEmpty'));
    return;
  }

  const entry = Object.assign({ id: measureEditId || uid(), date, note }, values);
  if (measureEditId) {
    const at = state.measurements.findIndex((m) => m.id === measureEditId);
    if (at >= 0) state.measurements[at] = entry;
    else state.measurements.push(entry);
  } else {
    state.measurements.push(entry);
  }
  measureEditId = null;
  saveState();
  document.getElementById('modal-measure').hidden = true;
  renderPokrok();
  refreshUpdateBanner();
}

function requestDeleteMeasurement(id) {
  const m = measurementById(id);
  if (!m) return;
  showGeneric(t('body.deleteTitle'), t('common.delete'), () => {
    state.measurements = state.measurements.filter((x) => x.id !== id);
    saveState();
    renderPokrok();
  }, t('body.deleteConfirm', { date: formatDate(m.date) }));
}

/* ---------- Kalorický odhad (voliteľný, opatrný) ---------- */
function latestMeasuredWeightKg() {
  const list = sortedMeasurements().filter((m) => m.weightKg !== null);
  return list.length ? list[list.length - 1] : null;
}

function calorieMissing() {
  const p = state.profile || {};
  const missing = [];
  if (p.heightCm === null) missing.push(t('calorie.inHeight'));
  if (p.ageYears === null) missing.push(t('calorie.inAge'));
  if (!p.sex) missing.push(t('calorie.inSex'));
  if (!p.activity) missing.push(t('calorie.inActivity'));
  if (!latestMeasuredWeightKg()) missing.push(t('calorie.inWeight'));
  return missing;
}

function calorieSignature() {
  const p = state.profile || {};
  const w = latestMeasuredWeightKg();
  return [p.heightCm, p.ageYears, p.sex, p.activity, w ? w.weightKg : null].join('|');
}

/* Mifflin-St Jeor (1990) × faktor aktivity. Vráti null, kým nie sú VŠETKY
   vstupy známe – odhad sa nikdy nedopočítava z neúplných údajov. */
function calorieEstimate() {
  const p = state.profile || {};
  if (p.isAdult !== true) return null;
  const w = latestMeasuredWeightKg();
  const act = ACTIVITY_LEVELS.find((x) => x.id === p.activity);
  if (!w || w.weightKg === null || p.heightCm === null || p.ageYears === null || !p.sex || !act) return null;
  const bmr = 10 * w.weightKg + 6.25 * p.heightCm - 5 * p.ageYears + (p.sex === 'male' ? 5 : -161);
  const tdee = bmr * act.factor;
  return { bmr: Math.round(bmr), low: Math.round((tdee * 0.9) / 10) * 10, high: Math.round((tdee * 1.1) / 10) * 10 };
}

function renderCalorieLimits() {
  const ul = document.getElementById('calorie-limits');
  if (!ul) return;
  ul.innerHTML = '';
  for (let i = 1; i <= 5; i++) {
    const li = document.createElement('li');
    const span = document.createElement('span');
    span.textContent = t('calorie.limit' + i);
    li.appendChild(span);
    ul.appendChild(li);
  }
}

function renderCalorieInputs() {
  const box = document.getElementById('calorie-inputs');
  if (!box) return;
  const p = state.profile || {};
  box.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'field-grid';

  const imperial = bodyUnits() === 'imperial';
  const heightShown = p.heightCm === null ? ''
    : Math.round((imperial ? p.heightCm / CM_PER_IN : p.heightCm) * 10) / 10;
  grid.appendChild(buildField('cal-height', t('calorie.inHeight') + ' (' + (imperial ? t('units.in') : t('units.cm')) + ')', heightShown));
  grid.appendChild(buildField('cal-age', t('calorie.inAge') + ' (' + t('calorie.years') + ')', p.ageYears === null ? '' : p.ageYears, { step: '1' }));
  grid.appendChild(buildSelect('cal-sex', t('calorie.inSex'), [
    { value: '', label: t('calorie.sexPick') },
    { value: 'male', label: t('calorie.sexMale') },
    { value: 'female', label: t('calorie.sexFemale') },
  ], p.sex || ''));
  grid.appendChild(buildSelect('cal-activity', t('calorie.inActivity'),
    [{ value: '', label: t('calorie.activityPick') }].concat(ACTIVITY_LEVELS.map((a) => ({ value: a.id, label: t(a.key) }))),
    p.activity || ''));

  const w = latestMeasuredWeightKg();
  const wField = buildField('cal-weight', t('calorie.inWeight') + ' (' + weightUnitLabel() + ')', '', { });
  const wInput = wField.querySelector('input');
  wInput.disabled = true;
  wInput.value = w ? String(Math.round((imperial ? w.weightKg / KG_PER_LB : w.weightKg) * 10) / 10) : '';
  grid.appendChild(wField);
  box.appendChild(grid);

  const wHint = document.createElement('p');
  wHint.className = 'card-note';
  wHint.textContent = w
    ? t('calorie.weightFromLog', { date: formatDate(w.date) })
    : t('calorie.weightMissing');
  box.appendChild(wHint);

  const err = document.createElement('p');
  err.className = 'card-note form-error';
  err.id = 'calorie-error';
  err.hidden = true;
  box.appendChild(err);

  const save = document.createElement('button');
  save.type = 'button';
  save.className = 'btn btn-primary btn-block';
  save.id = 'btn-calorie-save';
  save.textContent = t('calorie.saveInputs');
  save.addEventListener('click', saveCalorieInputs);
  box.appendChild(save);
}

function saveCalorieInputs() {
  const err = document.getElementById('calorie-error');
  const fail = (msg) => { if (err) { err.textContent = msg; err.hidden = false; } };

  const heightRaw = document.getElementById('cal-height').value.trim();
  const ageRaw = document.getElementById('cal-age').value.trim();
  const sex = document.getElementById('cal-sex').value;
  const activity = document.getElementById('cal-activity').value;

  if (ageRaw !== '' && !(Number(ageRaw) >= 1 && Number(ageRaw) <= 120)) { fail(t('calorie.errAge')); return; }
  let heightCm = null;
  if (heightRaw !== '') {
    const n = Number(heightRaw);
    const cm = bodyUnits() === 'imperial' ? n * CM_PER_IN : n;
    if (!Number.isFinite(cm) || cm < 50 || cm > 260) { fail(t('calorie.errHeight')); return; }
    heightCm = Math.round(cm * 10) / 10;
  }

  state.profile.heightCm = heightCm;
  state.profile.ageYears = ageRaw === '' ? null : Math.round(Number(ageRaw));
  state.profile.sex = (sex === 'male' || sex === 'female') ? sex : null;
  state.profile.activity = ACTIVITY_LEVELS.some((a) => a.id === activity) ? activity : null;
  if (err) err.hidden = true;
  saveState();
  renderPokrok();
}

function renderCalorieCard() {
  const card = document.getElementById('body-calorie-card');
  const offCard = document.getElementById('calorie-off');
  if (!card) return;
  const on = state.settings.calorieEnabled === true;
  card.hidden = !on;
  if (offCard) offCard.hidden = on;
  if (!on) return;

  const p = state.profile || {};
  const chips = document.getElementById('calorie-adult-chips');
  if (chips) {
    chips.querySelectorAll('.metric-chip').forEach((b) => {
      const want = b.dataset.adult === 'yes';
      const sel = p.isAdult === want;
      b.classList.toggle('active', sel);
      b.setAttribute('aria-pressed', sel ? 'true' : 'false');
    });
  }

  const underage = document.getElementById('calorie-underage');
  const inputs = document.getElementById('calorie-inputs');
  const result = document.getElementById('calorie-result');
  const range = document.getElementById('calorie-range');
  const bmrLine = document.getElementById('calorie-bmr');
  const updated = document.getElementById('calorie-updated');

  /* Nezodpovedaná otázka: žiadne vstupy, žiadne čísla. */
  if (p.isAdult === null) {
    underage.hidden = true; inputs.hidden = true; result.hidden = true;
    return;
  }
  /* Menej ako 18: žiadne čísla, len krátke vysvetlenie. */
  if (p.isAdult === false) {
    underage.hidden = false;
    underage.textContent = t('calorie.underage');
    inputs.hidden = true;
    result.hidden = true;
    return;
  }

  underage.hidden = true;
  inputs.hidden = false;
  renderCalorieInputs();

  const est = calorieEstimate();
  if (!est) {
    const missing = calorieMissing();
    result.hidden = false;
    range.textContent = t('calorie.needInputs');
    bmrLine.textContent = missing.length ? t('calorie.missing', { list: missing.join(', ') }) : '';
    renderCalorieLimits();
    updated.textContent = '';
    return;
  }

  /* Počítadlo "naposledy vypočítané" sa obnoví len vtedy, keď sa zmenili vstupy. */
  const sig = calorieSignature();
  if (p.calcKey !== sig) {
    state.profile.calcKey = sig;
    state.profile.lastCalcAt = Date.now();
    saveState();
  }
  result.hidden = false;
  range.textContent = t('calorie.range', { low: est.low, high: est.high, unit: t('units.kcal') });
  bmrLine.textContent = t('calorie.bmrLine', { bmr: est.bmr, unit: t('units.kcal') });
  renderCalorieLimits();
  updated.textContent = t('calorie.updated', { when: formatWhen(state.profile.lastCalcAt) });
}

/* ---------- Tipy ---------- */
const TIP_KEYS = ['tips.t1', 'tips.t2', 'tips.t3', 'tips.t4', 'tips.t5'];
const FOOD_TIP_KEYS = ['tips.f1', 'tips.f2'];

function buildTips(ul, keys) {
  ul.innerHTML = '';
  for (const k of keys) {
    const li = document.createElement('li');
    const strong = document.createElement('strong');
    strong.textContent = t(k + 'Title');
    const span = document.createElement('span');
    span.textContent = t(k + 'Body');
    li.append(strong, span);
    ul.appendChild(li);
  }
}

function toggleTips(btnId, bodyId) {
  const btn = document.getElementById(btnId);
  const body = document.getElementById(bodyId);
  if (!btn || !body) return;
  const open = body.hidden;
  body.hidden = !open;
  btn.setAttribute('aria-expanded', open ? 'true' : 'false');
}

function renderTips() {
  const body = document.getElementById('tips-body');
  if (body && !body.dataset.built) {
    const ul = document.createElement('ul');
    ul.className = 'tip-list';
    body.appendChild(ul);
    body.dataset.built = '1';
  }
  if (body && body.firstChild) buildTips(body.firstChild, TIP_KEYS);

  const fbody = document.getElementById('food-tips-body');
  if (fbody && !fbody.dataset.built) {
    const ul = document.createElement('ul');
    ul.className = 'tip-list';
    fbody.appendChild(ul);
    fbody.dataset.built = '1';
  }
  if (fbody && fbody.firstChild) buildTips(fbody.firstChild, FOOD_TIP_KEYS);
}

/* ---------- Jedlo (voliteľný, ručne zapisovaný denník) ---------- */
function foodDayKey() { return foodDate || todayISO(); }

function renderSavedFoods() {
  const box = document.getElementById('food-saved');
  if (!box) return;
  box.innerHTML = '';
  const foods = state.foods || [];
  if (!foods.length) {
    const p = document.createElement('p');
    p.className = 'empty-state';
    p.textContent = t('food.noSaved');
    box.appendChild(p);
    return;
  }
  for (const f of foods) {
    const row = document.createElement('div');
    row.className = 'food-row';
    const main = document.createElement('div');
    main.className = 'food-row-main';
    const name = document.createElement('div');
    name.className = 'food-row-name';
    name.textContent = f.name;   // vlastný názov sa nikdy neprekladá
    const meta = document.createElement('div');
    meta.className = 'food-row-meta';
    meta.textContent = f.kcal + ' ' + t('units.kcal') + (f.protein || f.carbs || f.fat
      ? ' · ' + t('food.macroLine', { p: f.protein, c: f.carbs, f: f.fat }) : '');
    main.append(name, meta);
    const actions = document.createElement('div');
    actions.className = 'food-row-actions';
    const edit = document.createElement('button');
    edit.type = 'button';
    edit.className = 'btn-icon-sm';
    edit.textContent = '✏️';
    edit.title = t('food.editTemplate');
    edit.setAttribute('aria-label', t('food.editTemplate'));
    edit.addEventListener('click', () => openFoodModal('template', f.id));
    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'btn-icon-sm btn-icon-danger';
    del.textContent = '🗑️';
    del.title = t('food.deleteTemplate');
    del.setAttribute('aria-label', t('food.deleteTemplate'));
    del.addEventListener('click', () => requestDeleteFood(f.id));
    actions.append(edit, del);
    row.append(main, actions);
    box.appendChild(row);
  }
}

function renderFoodEntries() {
  const box = document.getElementById('food-entries');
  if (!box) return;
  box.innerHTML = '';
  const key = foodDayKey();
  const entries = foodEntriesFor(key);
  if (!entries.length) {
    const p = document.createElement('p');
    p.className = 'empty-state';
    p.textContent = t('food.emptyDay');
    box.appendChild(p);
    return;
  }
  for (const e of entries) {
    const row = document.createElement('div');
    row.className = 'food-row';
    const main = document.createElement('div');
    main.className = 'food-row-main';
    const name = document.createElement('div');
    name.className = 'food-row-name';
    name.textContent = e.name;
    const meta = document.createElement('div');
    meta.className = 'food-row-meta';
    const q = Number(e.qty) > 0 ? Number(e.qty) : 1;
    meta.textContent = (q === 1 ? '' : q + ' × ') + Math.round(Number(e.kcal) * q) + ' ' + t('units.kcal')
      + ((e.protein || e.carbs || e.fat)
        ? ' · ' + t('food.macroLine', {
          p: Math.round(Number(e.protein) * q * 10) / 10,
          c: Math.round(Number(e.carbs) * q * 10) / 10,
          f: Math.round(Number(e.fat) * q * 10) / 10,
        }) : '');
    main.append(name, meta);
    const actions = document.createElement('div');
    actions.className = 'food-row-actions';
    const edit = document.createElement('button');
    edit.type = 'button';
    edit.className = 'btn-icon-sm';
    edit.textContent = '✏️';
    edit.title = t('food.editEntry');
    edit.setAttribute('aria-label', t('food.editEntry'));
    edit.addEventListener('click', () => openFoodModal('entry', e.id));
    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'btn-icon-sm btn-icon-danger';
    del.textContent = '🗑️';
    del.title = t('food.deleteEntry');
    del.setAttribute('aria-label', t('food.deleteEntry'));
    del.addEventListener('click', () => requestDeleteFoodEntry(e.id));
    actions.append(edit, del);
    row.append(main, actions);
    box.appendChild(row);
  }
}

function renderFood() {
  const enabled = state.settings.foodLogEnabled === true;
  const off = document.getElementById('food-off');
  const on = document.getElementById('food-on');
  if (!off || !on) return;
  off.hidden = enabled;
  on.hidden = !enabled;
  if (!enabled) return;

  const key = foodDayKey();
  document.getElementById('food-date-label').textContent = formatDate(key);
  const entries = foodEntriesFor(key);
  const totals = foodTotals(entries);
  const parts = [totals.kcal + ' ' + t('units.kcal')];
  if (totals.protein || totals.carbs || totals.fat) {
    parts.push(t('food.macroLine', { p: totals.protein, c: totals.carbs, f: totals.fat }));
  }
  document.getElementById('food-totals').textContent = t('food.totalsLine', {
    total: parts.join(' · '),
    entries: tPlural('food.entries', entries.length),
  });
  renderFoodEntries();
  renderSavedFoods();
}

function shiftFoodDay(delta) {
  const d = parseDate(foodDayKey());
  d.setDate(d.getDate() + delta);
  foodDate = localDateKey(d);
  renderFood();
}

/* ---------- Jedlo: modal (záznam aj potravina) ---------- */
function renderFoodFields(values) {
  const box = document.getElementById('food-fields');
  if (!box) return;
  box.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'field-grid';
  grid.appendChild(buildField('ff-name', t('food.nameLabel'), values.name, { text: true, wide: true }));
  grid.appendChild(buildField('ff-kcal', t('food.kcalLabel') + ' (' + t('units.kcal') + ')', values.kcal, { step: '1' }));
  grid.appendChild(buildField('ff-protein', t('food.protein') + ' (' + t('units.g') + ')', values.protein));
  grid.appendChild(buildField('ff-carbs', t('food.carbs') + ' (' + t('units.g') + ')', values.carbs));
  grid.appendChild(buildField('ff-fat', t('food.fat') + ' (' + t('units.g') + ')', values.fat));
  box.appendChild(grid);
}

function openFoodModal(mode, id) {
  foodModalMode = mode === 'template' ? 'template' : 'entry';
  foodModalId = id || null;
  const isTemplate = foodModalMode === 'template';
  const key = foodDayKey();

  const pickRow = document.getElementById('food-pick-row');
  const extra = document.getElementById('food-entry-extra');
  pickRow.hidden = isTemplate || !(state.foods || []).length;
  extra.hidden = isTemplate;

  document.getElementById('food-modal-title').textContent = t(isTemplate
    ? (id ? 'food.editTemplateTitle' : 'food.newTemplateTitle')
    : (id ? 'food.editEntryTitle' : 'food.addTitle'));

  let values = { name: '', kcal: '', protein: '', carbs: '', fat: '' };
  if (isTemplate && id) {
    const f = foodById(id);
    if (f) values = { name: f.name, kcal: f.kcal, protein: f.protein, carbs: f.carbs, fat: f.fat };
  } else if (!isTemplate && id) {
    const e = foodEntriesFor(key).find((x) => x.id === id);
    if (e) values = { name: e.name, kcal: e.kcal, protein: e.protein, carbs: e.carbs, fat: e.fat };
  }
  renderFoodFields(values);

  const pick = document.getElementById('food-pick');
  pick.innerHTML = '';
  const none = document.createElement('option');
  none.value = '';
  none.textContent = t('food.pickNone');
  pick.appendChild(none);
  for (const f of state.foods || []) {
    const opt = document.createElement('option');
    opt.value = f.id;
    opt.textContent = f.name + ' · ' + f.kcal + ' ' + t('units.kcal');
    pick.appendChild(opt);
  }

  let qty = '1';
  if (!isTemplate && id) {
    const e = foodEntriesFor(key).find((x) => x.id === id);
    if (e) qty = String(e.qty);
  }
  document.getElementById('food-qty').value = qty;
  document.getElementById('food-save-template').checked = false;
  document.getElementById('food-error').hidden = true;
  document.getElementById('modal-food').hidden = false;
  refreshUpdateBanner();
}

function saveFoodModal() {
  const err = document.getElementById('food-error');
  const fail = (msg) => { if (err) { err.textContent = msg; err.hidden = false; } };
  const name = document.getElementById('ff-name').value.trim();
  if (!name) { fail(t('food.errName')); return; }

  const readNum = (id) => {
    const raw = document.getElementById(id).value.trim();
    if (raw === '') return 0;
    const n = Number(raw);
    return Number.isFinite(n) ? n : NaN;
  };
  const kcal = readNum('ff-kcal'), protein = readNum('ff-protein'), carbs = readNum('ff-carbs'), fat = readNum('ff-fat');
  const okNum = (n, max) => Number.isFinite(n) && n >= 0 && n <= max;
  if (!okNum(kcal, 100000) || !okNum(protein, 10000) || !okNum(carbs, 10000) || !okNum(fat, 10000)) {
    fail(t('food.errNumber'));
    return;
  }

  if (foodModalMode === 'template') {
    if (foodModalId) {
      const f = foodById(foodModalId);
      if (f) Object.assign(f, { name, kcal, protein, carbs, fat });
    } else {
      state.foods.push({ id: uid(), name, kcal, protein, carbs, fat });
    }
  } else {
    const qtyRaw = Number(document.getElementById('food-qty').value);
    if (!Number.isFinite(qtyRaw) || qtyRaw <= 0 || qtyRaw > 1000) { fail(t('food.errQty')); return; }
    const qty = Math.round(qtyRaw * 100) / 100;
    const key = foodDayKey();
    const pickId = document.getElementById('food-pick').value || null;
    const entry = {
      id: foodModalId || uid(),
      foodId: foodModalId
        ? ((foodEntriesFor(key).find((x) => x.id === foodModalId) || {}).foodId || null)
        : (foodById(pickId) ? pickId : null),
      name, kcal, protein, carbs, fat, qty,
    };
    if (!Array.isArray(state.foodLog[key])) state.foodLog[key] = [];
    const at = foodModalId ? state.foodLog[key].findIndex((x) => x.id === foodModalId) : -1;
    if (at >= 0) state.foodLog[key][at] = entry;
    else state.foodLog[key].push(entry);

    if (document.getElementById('food-save-template').checked) {
      const exists = (state.foods || []).some((f) => f.name.toLowerCase() === name.toLowerCase());
      if (!exists) state.foods.push({ id: uid(), name, kcal, protein, carbs, fat });
    }
  }

  foodModalId = null;
  saveState();
  document.getElementById('modal-food').hidden = true;
  renderPokrok();
  refreshUpdateBanner();
}

function requestDeleteFoodEntry(id) {
  const key = foodDayKey();
  const entry = foodEntriesFor(key).find((x) => x.id === id);
  if (!entry) return;
  showGeneric(t('food.deleteEntry'), t('common.delete'), () => {
    state.foodLog[key] = foodEntriesFor(key).filter((x) => x.id !== id);
    if (!state.foodLog[key].length) delete state.foodLog[key];
    saveState();
    renderPokrok();
  }, t('food.deleteEntryConfirm', { name: entry.name }));
}

function requestDeleteFood(id) {
  const f = foodById(id);
  if (!f) return;
  showGeneric(t('food.deleteTemplate'), t('common.delete'), () => {
    /* Záznamy v denníku si nesú vlastnú kópiu hodnôt, takže história zostáva nezmenená. */
    state.foods = (state.foods || []).filter((x) => x.id !== id);
    saveState();
    renderPokrok();
  }, t('food.deleteTemplateConfirm', { name: f.name }));
}

/* ---------- Telo + jedlo: jedno prekreslenie ---------- */
function renderBody() {
  renderBodyUnits();
  renderBodySummary();
  renderBodyChart();
  renderCalorieCard();
  renderBodyHistory();
  renderTips();
  renderStorageNotice('body-storage-notice');
}

function renderFoodView() {
  renderFood();
  renderTips();
  renderStorageNotice('food-storage-notice');
}

function renderPokrok() {
  renderPokrokSubtabs();
  renderBody();
  renderFoodView();
  const week = workoutsInWeek(currentWeekKey());
  const month = workoutsInMonth(currentMonthKey());
  const total = state.history.length;

  document.getElementById('stat-week').textContent = week;
  document.getElementById('stat-month').textContent = month;
  document.getElementById('stat-total').textContent = total;

  const records = document.getElementById('records-list');
  records.innerHTML = '';
  const recs = personalRecords();
  if (!recs.length) {
    records.innerHTML = `<p class="empty-state">${t('pokrok.recordsEmpty')}</p>`;
  } else {
    for (const r of recs) {
      const next = Math.floor(r.weight / 5) * 5 + 5;
      const row = document.createElement('div');
      row.className = 'record-row';
      row.innerHTML = `
        <div>
          <div class="record-name">${esc(r.name)}</div>
          <div class="record-meta">${tPlural('pokrok.setsCount', r.reps)} · ${formatDate(r.date)}</div>
          <div class="record-meta">${t('pokrok.nextMilestone', { kg: next })}</div>
        </div>
        <div class="record-weight">${r.weight} ${t('units.kg')}</div>`;
      records.appendChild(row);
    }
  }

  const history = document.getElementById('history-list');
  history.innerHTML = '';
  if (!state.history.length) {
    history.innerHTML = `<p class="empty-state">${t('pokrok.historyEmpty')}</p>`;
  } else {
    const sorted = [...state.history].sort((a, b) => b.date.localeCompare(a.date));
    for (const w of sorted) {
      const setsDone = w.exercises.reduce((s, ex) => s + exerciseSlotCount(ex), 0);
      const row = document.createElement('div');
      row.className = 'history-row';
      const detail = w.exercises.map(e => historyExerciseDetail(e)).join('<br>');
      row.innerHTML = `
        <div class="history-main">
          <div class="history-name">${esc(historyPlanName(w))}</div>
          <div class="history-detail">${formatDate(w.date)} · ${tPlural('pokrok.setsCount', setsDone)}</div>
          ${historyDurationLine(w)}
          <div class="history-detail">${detail}</div>
          ${w.note ? `<div class="history-note">“${esc(w.note)}”</div>` : ''}
        </div>
        <div class="history-side">
          <div class="history-xp">+${w.xp} ${t('units.xp')}</div>
          <div class="history-actions">
            <button class="btn-icon-sm" data-action="edit" title="${t('history.editTitle')}">✏️</button>
            <button class="btn-icon-sm btn-icon-danger" data-action="delete" title="${t('history.deleteTitle')}">🗑️</button>
          </div>
        </div>`;
      row.querySelector('[data-action="edit"]').addEventListener('click', () => openHistoryEdit(w.id));
      row.querySelector('[data-action="delete"]').addEventListener('click', () => requestDeleteWorkout(w.id));
      history.appendChild(row);
    }
  }
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ---------- Vykreslenie: MOTIVÁCIA ---------- */

function renderMotivacia() {
  const info = levelInfo();

  document.getElementById('level-value').textContent = info.level;
  document.getElementById('header-level').textContent = `${t('header.level')} ${info.level}`;
  document.getElementById('level-progress').style.width = `${(info.levelXP / info.total) * 100}%`;
  document.getElementById('level-sub').textContent = t('motivacia.levelSub', { xp: info.xp, left: info.total - info.levelXP });

  const list = document.getElementById('achievements-list');
  list.innerHTML = '';
  const defs = staticAchievementDefs();
  // míľniky (5 kg) — zoradené podľa názvu cviku
  const milestones = Object.entries(state.achievements)
    .filter(([id]) => id.startsWith('ms-'))
    .sort((a, b) => a[0].localeCompare(b[0]));

  for (const def of defs) {
    const done = !!state.achievements[def.id];
    const date = done ? state.achievements[def.id] : null;
    const div = document.createElement('div');
    div.className = 'achievement' + (done ? ' unlocked' : '');
    div.dataset.category = def.category;
    div.dataset.achievementId = def.id;
    div.innerHTML = `
      <span class="achievement-icon">${def.icon}</span>
      <span class="achievement-name">${t(def.nameKey)}</span>
      <span class="achievement-desc">${t(def.descKey, { g: weeklyGoal() })}</span>
      ${def.xp ? `<span class="achievement-xp">${t('motivacia.xpReward', { xp: def.xp })}</span>` : ''}
      ${done ? `<span class="achievement-date">${t('motivacia.unlocked', { date: formatDate(date) })}</span>` : ''}`;
    list.appendChild(div);
  }

  for (const [id, date] of milestones) {
    const parts = id.split('-');
    const kg = parts[parts.length - 1];
    const rawName = parts.slice(1, -1).join('-');
    const name = recordedNameToDisplay(rawName);
    const div = document.createElement('div');
    div.className = 'achievement unlocked';
    div.innerHTML = `
      <span class="achievement-icon">🏋️</span>
      <span class="achievement-name">${esc(name)} · ${kg} ${t('units.kg')}</span>
      <span class="achievement-desc">${t('motivacia.ach.5kg', { name, kg })}</span>
      <span class="achievement-date">${t('motivacia.unlocked', { date: formatDate(date) })}</span>`;
    list.appendChild(div);
  }
}

/* ---------- Vykreslenie: KALENDÁR ---------- */

/* Jedna O(n) prechádzka históriou na mapu podľa lokálneho dátumu. */
function historyByDate() {
  const map = {};
  for (const w of state.history) {
    if (!w || !w.date) continue;
    if (!map[w.date]) map[w.date] = [];
    map[w.date].push(w);
  }
  return map;
}

/* Jedna O(n) prechádzka úspechmi na mapu podľa dátumu odomknutia. */
function achievementsByDate() {
  const map = {};
  for (const [id, date] of Object.entries(state.achievements || {})) {
    if (!date) continue;
    if (!map[date]) map[date] = [];
    map[date].push(id);
  }
  return map;
}

/* Jednotný čitateľný názov úspechu (statické + 5 kg míľniky). */
function achievementLabel(id) {
  if (id.indexOf('ms-') === 0) {
    const parts = id.split('-');
    const kg = parts[parts.length - 1];
    const name = recordedNameToDisplay(parts.slice(1, -1).join('-'));
    return t('motivacia.ach.5kg', { name, kg });
  }
  const def = staticAchievementDefs().find(d => d.id === id);
  return def ? `${def.icon} ${t(def.nameKey)}` : id;
}

/* Názov cviku v histórii: podľa stabilného exId, inak podľa zaznamenaného názvu. */
function historyExerciseName(ex) {
  if (ex.exId && BUILTIN_EXERCISE_IDS.has(ex.exId)) return t('exercise.' + ex.exId);
  return recordedNameToDisplay(ex.name);
}

/* "Ľavá a pravá" / "iba ľavá" / "iba pravá" / "žiadna". */
function completedSidesLabel(done) {
  const hasLeft = done.left.length > 0;
  const hasRight = done.right.length > 0;
  if (hasLeft && hasRight) return t('unilateral.bothSides');
  if (hasLeft) return t('unilateral.leftOnly');
  if (hasRight) return t('unilateral.rightOnly');
  return t('unilateral.noneSides');
}

/* Zoznam zlyhaní po stranách: "Séria 3 — Pravá, Séria 1 — Ľavá". */
function sideFailureList(fails) {
  const parts = [];
  for (const side of ['left', 'right']) {
    for (const n of fails[side]) parts.push(t('unilateral.setSide', { n, side: sideName(side) }));
  }
  return parts.join(', ');
}

/* Jeden riadok cviku v histórii (Progress). Jednostranný cvik ukáže "na každú stranu",
   dokončené strany a zlyhania po stranách; bežný cvik vyzerá presne ako doteraz. */
function historyExerciseDetail(ex, displayName) {
  if (ex && ex.unilateral === true) {
    const sets = Math.round(Number(ex.sets)) || 0;
    const done = cleanSideSets(ex.sidesDone, sets);
    const fails = cleanSideSets(ex.sidesFailure, sets);
    const head = `${esc(displayName !== undefined ? displayName : ex.name)} `
      + `${esc(tPlural('unilateral.setsPerSide', sets))} · ${ex.reps} ${t('units.reps')} · ${ex.weight} ${t('units.kg')}`;
    let out = head + `<div class="history-side-note">${esc(t('unilateral.completed', { sides: completedSidesLabel(done) }))}</div>`;
    const list = sideFailureList(fails);
    if (list) out += `<div class="failure-note">🔥 ${esc(t('unilateral.failureList', { list }))}</div>`;
    return out;
  }
  const line = `${esc(displayName !== undefined ? displayName : ex.name)} ${ex.sets}×${ex.reps} · ${ex.weight} ${t('units.kg')}`;
  const fSets = cleanFailureSets(ex.actualFailureSets, ex.sets);
  /* Zlyhanie sa zobrazuje len vtedy, keď bolo naozaj zaznamenané – nikdy z plánu. */
  return fSets.length
    ? line + `<div class="failure-note">🔥 ${esc(t('failure.sets', { sets: fSets.join(', ') }))}</div>`
    : line;
}

/* Trvanie uložené v histórii: nezáporné celé sekundy, inak null (nikdy nevymýšľame hodnotu).
   Staré tréningy bez durationSeconds zostávajú bez trvania a zobrazia sa normálne. */
function cleanDurationSeconds(value) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return null;
  return Math.round(value);
}

/* Riadok s trvaním pre históriu aj detail dňa v kalendári – len ak trvanie naozaj existuje. */
function historyDurationLine(w) {
  const seconds = cleanDurationSeconds(w && w.durationSeconds);
  if (seconds === null) return '';
  return `<div class="history-duration">${esc(t('history.duration', { duration: formatDurationNatural(seconds) }))}</div>`;
}

function monthTitle() {
  return fillDatePattern(localeData().titlePattern, new Date(viewYear, viewMonth, 1), '');
}

/* Krátky text stavu dňa – používa ho aria-label aj detail dňa. */
function dayStatusText(key, count) {
  if (count > 0) return t('kalendar.statusWorkout');
  if (key > todayISO()) return t('kalendar.statusFuture');
  if (key === todayISO()) return t('kalendar.statusTodayNone');
  return t('kalendar.statusNone');
}

function renderKalendar() {
  const byDate = historyByDate();
  const today = todayISO();
  const lang = activeLang();

  document.getElementById('calendar-title').textContent = monthTitle();

  const wd = document.getElementById('calendar-weekdays');
  wd.innerHTML = '';
  for (const label of localeData().weekdaysShort) {
    const el = document.createElement('span');
    el.className = 'calendar-weekday';
    el.textContent = label;
    wd.appendChild(el);
  }

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const lead = mondayIndex(new Date(viewYear, viewMonth, 1));
  const totalCells = Math.ceil((lead + daysInMonth) / 7) * 7;

  const grid = document.getElementById('calendar-grid');
  grid.innerHTML = '';
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - lead + 1;
    if (dayNum < 1 || dayNum > daysInMonth) {
      /* Deň z vedľajšieho mesiaca: stlmený, neinteraktívny, bez stavových farieb.
         Zámerné správanie: kliknutie nič nerobí (nie je to tlačidlo). */
      const other = dayNum < 1
        ? new Date(viewYear, viewMonth, dayNum)
        : new Date(viewYear, viewMonth + 1, dayNum - daysInMonth);
      const span = document.createElement('span');
      span.className = 'cal-cell cal-outside';
      span.setAttribute('aria-hidden', 'true');
      span.textContent = String(other.getDate());
      grid.appendChild(span);
      continue;
    }

    const date = new Date(viewYear, viewMonth, dayNum);
    const key = localDateKey(date);
    const workouts = byDate[key] || [];
    const isToday = key === today;
    const isFuture = key > today;
    const status = dayStatusText(key, workouts.length);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.day = key;
    btn.className = 'cal-cell'
      + (workouts.length ? ' cal-done' : (isFuture || isToday ? '' : ' cal-miss'))
      + (isToday ? ' cal-today' : '')
      + (isFuture ? ' cal-future' : '')
      + (key === selectedDayKey ? ' cal-selected' : '');
    let aria = t('kalendar.ariaDay', { date: formatFullDate(date), status });
    if (workouts.length > 1) aria += ' · ' + tPlural('kalendar.ariaWorkoutCount', workouts.length);
    btn.setAttribute('aria-label', aria);
    btn.innerHTML = `<span class="cal-num">${dayNum}</span>`
      + (workouts.length > 1 ? `<span class="cal-badge">${workouts.length}</span>` : '');
    grid.appendChild(btn);
  }
}

function shiftMonth(delta) {
  const d = new Date(viewYear, viewMonth + delta, 1);   // Date vyrieši aj prechod rokov
  viewYear = d.getFullYear();
  viewMonth = d.getMonth();
  renderKalendar();
}

function goToCurrentMonth() {
  const n = new Date();
  viewYear = n.getFullYear();
  viewMonth = n.getMonth();
  renderKalendar();
}

function openDay(key) {
  selectedDayKey = key;
  if (activeTab === 'kalendar') renderKalendar();
  renderDayDetail(key);
  document.getElementById('modal-day').hidden = false;
  document.getElementById('btn-day-close').focus();
}

function closeDay() {
  document.getElementById('modal-day').hidden = true;
  refreshUpdateBanner();
}

function workoutBlock(w) {
  const div = document.createElement('div');
  div.className = 'day-workout';
  const rows = w.exercises.map(ex => {
    if (ex.unilateral === true) {
      const sets = Math.round(Number(ex.sets)) || 0;
      const done = cleanSideSets(ex.sidesDone, sets);
      const fails = cleanSideSets(ex.sidesFailure, sets);
      const list = sideFailureList(fails);
      return `
    <div class="day-ex">
      <span class="day-ex-name">${esc(historyExerciseName(ex))}</span>
      <span class="day-ex-meta">${esc(tPlural('unilateral.setsPerSide', sets))} · ${ex.reps} ${t('units.reps')} · ${ex.weight} ${t('units.kg')} · ${ex.setsDone} ${t('history.setsDoneLabel')}</span>
      <span class="day-ex-completed">${esc(t('unilateral.completed', { sides: completedSidesLabel(done) }))}</span>
      ${list ? `<span class="day-ex-failure">🔥 ${esc(t('unilateral.failureList', { list }))}</span>` : ''}
    </div>`;
    }
    const fSets = cleanFailureSets(ex.actualFailureSets, ex.sets);
    return `
    <div class="day-ex">
      <span class="day-ex-name">${esc(historyExerciseName(ex))}</span>
      <span class="day-ex-meta">${ex.sets} × ${ex.reps} · ${ex.weight} ${t('units.kg')} · ${ex.setsDone} ${t('history.setsDoneLabel')}</span>
      ${fSets.length ? `<span class="day-ex-failure">🔥 ${esc(t('failure.sets', { sets: fSets.join(', ') }))}</span>` : ''}
    </div>`;
  }).join('');
  div.innerHTML = `
    <div class="day-workout-head">
      <span class="day-workout-name">${esc(historyPlanName(w))}</span>
      <span class="day-workout-xp">+${w.xp} ${t('units.xp')}</span>
    </div>
    <div class="day-workout-date">${esc(formatDate(w.date))}</div>
    ${historyDurationLine(w)}
    ${rows}
    ${w.note ? `<div class="modal-note">“${esc(w.note)}”</div>` : ''}`;
  return div;
}

function renderDayDetail(key) {
  const date = parseDate(key);
  const today = todayISO();
  const isFuture = key > today;
  const workouts = historyByDate()[key] || [];

  document.getElementById('day-title').textContent = formatFullDate(date);

  const statusEl = document.getElementById('day-status');
  statusEl.className = 'day-status ' + (workouts.length ? 'day-status-done'
    : isFuture ? 'day-status-future'
    : key === today ? 'day-status-today' : 'day-status-miss');
  statusEl.textContent = dayStatusText(key, workouts.length);

  const body = document.getElementById('day-body');
  body.innerHTML = '';
  if (isFuture) {
    body.innerHTML = `<p class="card-note">${esc(t('kalendar.statusFuture'))}</p>`;
    return;
  }
  if (!workouts.length) {
    body.innerHTML = `<p class="card-note">${esc(t('kalendar.emptyPast'))}</p>`;
  } else {
    for (const w of workouts) body.appendChild(workoutBlock(w));
  }

  const achIds = achievementsByDate()[key] || [];
  if (achIds.length) {
    const box = document.createElement('div');
    box.className = 'day-achievements';
    box.innerHTML = `<div class="day-label">${esc(t('kalendar.achievements'))}</div>`
      + achIds.map(id => `<div class="day-ach">${esc(achievementLabel(id))}</div>`).join('');
    body.appendChild(box);
  }
}

/* ---------- Celkové vykreslenie ---------- */

function renderAll() {
  renderDnes();
  renderTrening();
  renderPokrok();
  renderMotivacia();
  // Kalendár sa prekresľuje len keď je otvorený – zbytočne nepočítame iné obrazovky.
  if (activeTab === 'kalendar') renderKalendar();
  // Otvorený detail dňa musí zareagovať na zmenu jazyka aj na zmenu histórie.
  const dayModal = document.getElementById('modal-day');
  if (dayModal && !dayModal.hidden && selectedDayKey) renderDayDetail(selectedDayKey);
  // Otvorený Full Body builder musí prekresliť zdroje a preklady (výber zostáva zachovaný).
  const fbModal = document.getElementById('modal-fullbody');
  if (fbModal && !fbModal.hidden) renderFullBodyBuilder();
  renderRestSoundSetting();   // stav Zapnuté/Vypnuté musí zareagovať na zmenu jazyka
  refreshUpdateBanner();   // aktualizácia sa môže ponúknuť, len ak nič neupravujeme
}

/* ---------- Prepínanie kariet ---------- */

function switchTab(tab) {
  activeTab = tab;
  for (const s of ['dnes', 'trening', 'pokrok', 'motivacia', 'kalendar']) {
    document.getElementById(`screen-${s}`).hidden = s !== tab;
  }
  document.querySelectorAll('.tab').forEach(el => {
    el.classList.toggle('active', el.dataset.tab === tab);
  });
  if (tab === 'trening') renderTrening();
  if (tab === 'pokrok') renderPokrok();
  if (tab === 'kalendar') renderKalendar();
}

/* ---------- Ukončenie tréningu ---------- */

function finishWorkout() {
  const plan = getPlan(selectedPlan);
  if (!plan) return;
  const doneCount = totalSetsDone();
  const totalSets = planExerciseCount(plan);
  const xp = BASE_XP + doneCount * XP_PER_SET;

  const confirmText = document.getElementById('confirm-text');
  confirmText.innerHTML = t('trening.confirmText', { plan: esc(planDisplayName(plan)), done: doneCount, total: totalSets, xp });
  document.getElementById('confirm-note').value = '';
  document.getElementById('modal-confirm').hidden = false;
  document.getElementById('confirm-note').focus();
}

function confirmFinish() {
  const plan = getPlan(selectedPlan);
  if (!plan) return;
  const sess = getSession();
  const prevRecommended = recommendedPlan();
  const beforeUnlocked = Object.keys(state.achievements);
  const beforeAchXP = achievementXP();

  /* setsDone aj actualFailureSets sa čítajú zo session cez stabilné kľúče cvikov,
     takže sa nikdy nemôžu pomiešať dva cviky s rovnakým menom ani stratiť po úprave plánu. */
  const exercises = plan.exercises.map(ex => {
    const sides = exerciseSideOrder(ex);
    const entry = {
      name: ex.name,
      exId: (ex.id && BUILTIN_EXERCISE_IDS.has(ex.id)) ? ex.id : undefined,
      sets: ex.sets,
      reps: ex.reps,
      weight: ex.weight,
      plannedFailureSets: cleanFailureSets(ex.plannedFailureSets, ex.sets),
    };
    if (sides) {
      /* Jednostranný cvik: každá strana sa zaznamenáva samostatne.
         setsDone zostáva SÚČET oboch strán – rovnaký význam ako pri bežnom cviku. */
      const doneSide = { left: [], right: [] };
      const failSide = { left: [], right: [] };
      for (let i = 0; i < ex.sets; i++) {
        for (const side of sides) {
          if (sess && sess.completedSets[setSessionKey(ex, i, side)]) doneSide[side].push(i + 1);
          if (sess && sess.actualFailureSets[setSessionKey(ex, i, side)]) failSide[side].push(i + 1);
        }
      }
      const cleanDone = cleanSideSets(doneSide, ex.sets);
      const cleanFails = cleanSideSets(failSide, ex.sets);
      entry.unilateral = true;
      entry.startSide = ex.startSide === 'right' ? 'right' : 'left';
      entry.setsDone = cleanDone.left.length + cleanDone.right.length;
      entry.sidesDone = cleanDone;
      entry.sidesFailure = cleanFails;
      /* actualFailureSets zostáva zjednotením čísel sérií – pre staršie zobrazenia aj kompatibilitu. */
      entry.actualFailureSets = Array.from(new Set(cleanFails.left.concat(cleanFails.right)))
        .sort((a, b) => a - b);
    } else {
      const done = [];
      const fails = [];
      for (let i = 0; i < ex.sets; i++) {
        if (sess && sess.completedSets[setSessionKey(ex, i)]) done.push(i + 1);
        if (sess && sess.actualFailureSets[setSessionKey(ex, i)]) fails.push(i + 1);
      }
      entry.setsDone = done.length;
      entry.actualFailureSets = cleanFailureSets(fails, ex.sets);
    }
    return entry;
  });

  const doneCount = totalSetsDone();
  const xp = BASE_XP + doneCount * XP_PER_SET;
  const note = document.getElementById('confirm-note').value.trim();

  const entry = {
    id: uid(),
    planId: plan.id,
    planName: recordedPlanName(plan),
    date: todayISO(),
    xp,
    note,
    exercises,
  };
  /* Trvanie sa zapíše len ak naozaj existuje rozbehnutá session – nikdy nevymýšľame nulu. */
  if (sess) entry.durationSeconds = sessionElapsedSeconds(sess);

  state.history.push(entry);
  syncGoalSnapshot();    // tento týždeň je teraz "pozorovaný" so svojím cieľom
  lastWorkoutId = entry.id;
  state.demo = false;  // real workout → data is no longer demo
  localStorage.setItem(STORAGE_KEY + '_real', '1');
  reconcileAchievements();
  saveState();

  lastUnlocked = Object.keys(state.achievements).filter(id => !beforeUnlocked.includes(id));
  lastAchXP = achievementXP() - beforeAchXP;

  lastXP = xp;
  selectedPlan = prevRecommended || selectedPlan;
  /* Session sa ruší až po uložení histórie – nikdy predtým. */
  clearSession();
  stopTimer();
  saveState();

  document.getElementById('modal-confirm').hidden = true;

  showResultModal();
  renderAll();
}

function showResultModal() {
  const info = levelInfo();
  document.getElementById('result-xp').textContent = `+${lastXP} ${t('units.xp')}`;
  document.getElementById('result-msg').textContent = randomEncouragement();

  const achEl = document.getElementById('result-achievements');
  if (lastUnlocked.length) {
    const names = lastUnlocked.map(id => {
      if (id.startsWith('ms-')) {
        const parts = id.split('-');
        const kg = parts[parts.length - 1];
        return `${t('motivacia.ach.5kg', { name: recordedNameToDisplay(parts.slice(1, -1).join('-')), kg })}`;
      }
      const def = staticAchievementDefs().find(d => d.id === id);
      return def ? `${def.icon} ${t(def.nameKey)}` : id;
    }).join(', ');
    achEl.textContent = t('motivacia.newAchievement', { names })
      + (lastAchXP > 0 ? ' · ' + t('motivacia.newAchXp', { xp: lastAchXP }) : '');
    achEl.hidden = false;
  } else {
    achEl.hidden = true;
  }

  const note = document.getElementById('result-note');
  const entry = state.history.find(w => w.id === lastWorkoutId);
  if (entry && entry.note) {
    note.textContent = `“${entry.note}”`;
    note.hidden = false;
  } else {
    note.hidden = true;
  }

  /* Trvanie sa zobrazí len ak bolo naozaj zmerané. */
  const durEl = document.getElementById('result-duration');
  const savedSeconds = cleanDurationSeconds(entry && entry.durationSeconds);
  if (savedSeconds !== null) {
    durEl.textContent = t('trening.durationResult', { duration: formatDurationNatural(savedSeconds) });
    durEl.hidden = false;
  } else {
    durEl.hidden = true;
  }

  document.getElementById('modal-result').hidden = false;
}

/* ---------- Undo / edit / delete tréningu ---------- */

function requestUndoWorkout() {
  const entry = state.history.find(w => w.id === lastWorkoutId);
  if (!entry) return;
  showGeneric(t('trening.undoConfirmTitle'), t('common.cancel'), () => {
    state.history = state.history.filter(w => w.id !== lastWorkoutId);
    lastWorkoutId = null;
    lastUnlocked = [];
    lastAchXP = 0;
    state.demo = false;
    localStorage.setItem(STORAGE_KEY + '_real', '1');
    document.getElementById('modal-result').hidden = true;
    recalculateAll();
    saveState();
    switchTab('trening');
  }, t('trening.undoConfirm', { xp: entry.xp }));
}

function requestDeleteWorkout(id) {
  const entry = state.history.find(w => w.id === id);
  if (!entry) return;
  showGeneric(t('history.deleteTitle'), t('common.cancel'), () => {
    state.history = state.history.filter(w => w.id !== id);
    if (lastWorkoutId === id) lastWorkoutId = null;
    recalculateAll();
    saveState();
    renderPokrok();
  }, t('history.deleteConfirm', { xp: entry.xp }));
}

/* ---------- Úprava tréningu z histórie ---------- */

let heWorkoutId = null;

function openHistoryEdit(id) {
  const w = state.history.find(x => x.id === id);
  if (!w) return;
  heWorkoutId = id;
  document.getElementById('he-date').value = w.date;
  document.getElementById('he-note').value = w.note || '';
  const box = document.getElementById('he-exercises');
  box.innerHTML = '';
  w.exercises.forEach((ex, idx) => {
    const row = document.createElement('div');
    row.className = 'he-ex-row';
    row.innerHTML = `
      <span class="he-name">${esc(ex.name)}</span>
      ${ex.unilateral === true ? `<span class="he-side">${esc(tPlural('unilateral.setsPerSide', ex.sets))}</span>` : ''}
      <span class="he-label">${t('history.setsLabel')}</span><input type="number" min="1" max="99" value="${ex.sets}" data-f="sets">
      <span class="he-label">${t('history.repsLabel')}</span><input type="number" min="1" max="99" value="${ex.reps}" data-f="reps">
      <span class="he-label">${t('units.kg')}</span><input type="number" min="0" max="999" value="${ex.weight}" data-f="weight">
      <span class="he-label">${t('history.setsDoneLabel')}</span><input type="number" min="0" max="99" value="${ex.setsDone}" data-f="setsDone">`;
    row.querySelectorAll('input').forEach(inp => {
      inp.addEventListener('input', () => {
        w.exercises[idx][inp.dataset.f] = num(inp.value);
      });
    });
    box.appendChild(row);
  });
  document.getElementById('modal-history-edit').hidden = false;
}

function saveHistoryEdit() {
  const w = state.history.find(x => x.id === heWorkoutId);
  if (!w) return;
  w.date = document.getElementById('he-date').value || w.date;
  w.note = document.getElementById('he-note').value.trim();
  w.exercises.forEach(e => {
    e.sets = Math.max(1, Math.min(99, Math.round(e.sets)));
    e.reps = Math.max(1, Math.min(99, Math.round(e.reps)));
    e.weight = Math.max(0, Math.min(999, Math.round(e.weight * 2) / 2));
    e.setsDone = Math.max(0, Math.min(e.sets, Math.round(e.setsDone)));
    /* Existujúce polia do zlyhania sa orežú na nový počet sérií; starým záznamom sa nepridávajú. */
    if (Array.isArray(e.actualFailureSets)) e.actualFailureSets = cleanFailureSets(e.actualFailureSets, e.sets);
    if (Array.isArray(e.plannedFailureSets)) e.plannedFailureSets = cleanFailureSets(e.plannedFailureSets, e.sets);
    if (e.unilateral === true) {
      /* Jednostranný cvik: setsDone je súčet oboch strán, takže sa oreže na 2× počet sérií.
         Zlyhania po stranách sa orežú rovnako a zjednotenie sa prepočíta. */
      e.startSide = e.startSide === 'right' ? 'right' : 'left';
      e.setsDone = Math.max(0, Math.min(e.sets * 2, Math.round(e.setsDone)));
      e.sidesDone = cleanSideSets(e.sidesDone, e.sets);
      e.sidesFailure = cleanSideSets(e.sidesFailure, e.sets);
      e.actualFailureSets = Array.from(new Set(e.sidesFailure.left.concat(e.sidesFailure.right)))
        .sort((a, b) => a - b);
    }
  });
  w.xp = BASE_XP + w.exercises.reduce((s, e) => s + e.setsDone, 0) * XP_PER_SET;
  document.getElementById('modal-history-edit').hidden = true;
  recalculateAll();
  saveState();
  renderPokrok();
}

/* ---------- Rekalkulácia ---------- */

function recalculateAll() {
  reconcileAchievements();
  renderAll();
}

/* ---------- Nastavenia / prvý štart / import / export / reset ---------- */

/* Číselný ukazovateľ aktuálneho cieľa v Nastaveniach */
function setGoalReadout(g) {
  const el = document.getElementById('settings-goal-value');
  if (el) el.textContent = g;
  const err = document.getElementById('settings-goal-error');
  if (err) err.hidden = true;
}

function renderGoalChips(containerId, current) {
  const box = document.getElementById(containerId);
  box.innerHTML = '';
  for (let g = GOAL_MIN; g <= GOAL_MAX; g++) {
    const btn = document.createElement('button');
    btn.className = 'goal-chip' + (g === current ? ' active' : '');
    btn.textContent = g;
    btn.dataset.goal = g;
    btn.addEventListener('click', () => {
      box.querySelectorAll('.goal-chip').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      if (containerId === 'settings-goal-chips') setGoalReadout(g);
    });
    box.appendChild(btn);
  }
}

function activeGoalChip(containerId) {
  const box = document.getElementById(containerId);
  const active = box.querySelector('.goal-chip.active');
  return active ? parseInt(active.dataset.goal, 10) : weeklyGoal();
}

function openSetup() {
  renderGoalChips('setup-goal-chips', 3);
  document.getElementById('modal-setup').hidden = false;
}

function confirmSetup() {
  const g = activeGoalChip('setup-goal-chips');
  state.settings.weeklyGoal = Math.min(GOAL_MAX, Math.max(GOAL_MIN, g));
  syncGoalSnapshot();
  saveState();
  document.getElementById('modal-setup').hidden = true;
  localStorage.setItem(STORAGE_KEY + '_seeded', '1');
  renderAll();
}

function openSettings() {
  renderGoalChips('settings-goal-chips', weeklyGoal());
  setGoalReadout(weeklyGoal());
  renderLangSetting();
  renderAutoBackupSetting();
  renderRestSoundSetting();
  const removeBtn = document.getElementById('btn-remove-demo');
  if (removeBtn) {
    removeBtn.hidden = !state.demo;
  }
  document.getElementById('modal-settings').hidden = false;
}

/* Vráti true, ak bol cieľ uložený; false, ak bol vstup neplatný. */
function saveSettingsGoal() {
  const g = Number(activeGoalChip('settings-goal-chips'));
  const errEl = document.getElementById('settings-goal-error');
  if (!Number.isInteger(g) || g < GOAL_MIN || g > GOAL_MAX) {
    if (errEl) {
      errEl.hidden = false;
      errEl.textContent = t('settings.goalInvalid', { min: GOAL_MIN, max: GOAL_MAX });
    }
    return false;
  }
  if (errEl) errEl.hidden = true;
  state.settings.weeklyGoal = g;
  syncGoalSnapshot();          // prebiehajúci týždeň si drží aktuálny cieľ; minulé sa nemenia
  setGoalReadout(g);
  reconcileAchievements();
  saveState();
  renderAll();
  return true;
}

/* ---------- Automatické zálohovanie do JSON súboru ----------
   Zámerne poctivé. Aplikácia NIKDY netvrdí, že súbor je uložený – žiadna
   platforma to nespoľahlivo nepotvrdzuje (<a download> nevracia nič a
   navigator.share sa vyrieši aj pri zrušení). Preto sa zobrazuje len to, čo
   je pravda: súbor bol vytvorený a odovzdaný, prípadne je pripravený na
   uloženie a treba ho potvrdiť.

   Žiadna kópia sa neukladá do IndexedDB ani do Cache Storage. Interné
   úložisko nie je nezávislá záloha a nesmie sa tak ani tváriť.

   Beží VÝHRADNE počas otvorenej aplikácie – statická stránka sa nedá zobudiť
   na pozadí a nič také sa ani nesľubuje. */

const BACKUP_EVERY_WORKOUTS = 5;
const BACKUP_MIN_INTERVAL_MS = 7 * 24 * 3600 * 1000;
let backupDismissed = false;      // len pre túto reláciu, nikdy sa neukladá
let backupStripState = null;      // { kind, filename, usedShare }

/* Apple mobil: iPhone/iPad vrátane aplikácie na ploche. */
function isAppleMobile() {
  const ua = navigator.userAgent || '';
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  return /Macintosh/.test(ua) && Number(navigator.maxTouchPoints) > 1;
}

function isStandaloneApp() {
  if (navigator.standalone === true) return true;
  try {
    return typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches;
  } catch (e) { return false; }
}

/* Presne ten istý obsah, aký vytvára ručný export – staré aj nové zálohy
   sa navzájom importujú bez zmien. Rozbehnutý tréning do zálohy nepatrí. */
function backupPayload() {
  const snapshot = Object.assign({}, state);
  delete snapshot.activeSession;
  return JSON.stringify(snapshot, null, 2);
}

/* Lokálny dátum a čas (nikdy UTC): gymquest-backup-YYYY-MM-DD-HHMM.json */
function backupFileName(now) {
  const d = now || new Date();
  const p = (n) => String(n).padStart(2, '0');
  return 'gymquest-backup-' + d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate())
    + '-' + p(d.getHours()) + p(d.getMinutes()) + '.json';
}

/* Odovzdanie súboru prehliadaču. true = akcia sa vykonala, NIE "súbor je uložený". */
function downloadBackupFile(text, filename) {
  try {
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => { try { URL.revokeObjectURL(url); } catch (e) {} }, 30000);
    return true;
  } catch (e) { return false; }
}

function canShareFiles() {
  try {
    if (typeof navigator.share !== 'function' || typeof navigator.canShare !== 'function') return false;
    if (typeof File !== 'function') return false;
    const probe = new File([new Blob(['{}'], { type: 'application/json' })], 'probe.json', { type: 'application/json' });
    return navigator.canShare({ files: [probe] }) === true;
  } catch (e) { return false; }
}

/* Uloženie vyžiadané používateľom. Na Apple mobile ide cez systémové
   zdieľanie (jediná podporovaná cesta do Súborov / iCloud Drive), inde
   cez bežné stiahnutie. Vždy sa vráti poctivý stav, nikdy "uložené". */
function saveBackupNow() {
  const text = backupPayload();
  const filename = backupFileName();
  let usedShare = false;
  markBackupOffered();
  if (isAppleMobile() && canShareFiles()) {
    try {
      const file = new File([new Blob([text], { type: 'application/json' })], filename, { type: 'application/json' });
      const shared = navigator.share({ files: [file], title: 'GymQuest' });
      if (shared && typeof shared.catch === 'function') shared.catch(() => {});
      usedShare = true;
    } catch (e) { usedShare = false; }
  }
  if (!usedShare) downloadBackupFile(text, filename);
  showBackupStrip('sent', filename, usedShare);
  renderAutoBackupSetting();
  return true;
}

function backupNewWorkouts() {
  return state.history.length - (Number(state.settings.autoBackupWorkoutCount) || 0);
}

/* Zapíše, že záloha bola ponúknutá (automaticky aj ručne). Práve to drží
   limit "najviac raz za sedem dní" a zabraňuje hromadeniu duplicitných súborov. */
function markBackupOffered() {
  state.settings.autoBackupOfferedAt = Date.now();
  state.settings.autoBackupWorkoutCount = state.history.length;
  saveState();
}

/* Záloha je potrebná, keď od poslednej ponuky pribudlo aspoň päť dokončených
   tréningov A zároveň ubehlo aspoň sedem dní. */
function backupDue() {
  if (!state || !state.settings || state.settings.autoBackup !== true) return false;
  if (state.history.length === 0) return false;
  if (backupNewWorkouts() < BACKUP_EVERY_WORKOUTS) return false;
  const last = Number(state.settings.autoBackupOfferedAt) || 0;
  return (Date.now() - last) >= BACKUP_MIN_INTERVAL_MS;
}

function updateBannerVisible() {
  const el = document.getElementById('update-banner');
  return !!(el && !el.hidden);
}

/* Počas tréningu, zadávania cvikov ani otvoreného dialógu sa záloha
   neponúka ANI neodosiela. */
function backupBlocked() {
  if (backupDismissed) return true;
  if (isBusy()) return true;
  if (document.querySelector('.modal-backdrop:not([hidden])')) return true;
  if (updateBannerVisible()) return true;   // dve lišty sa nikdy neprekrývajú
  return false;
}

function renderBackupStrip() {
  const el = document.getElementById('backup-banner');
  if (!el || !backupStripState) return;
  const { kind, filename, usedShare } = backupStripState;
  const sent = kind === 'sent';
  const title = document.getElementById('backup-title');
  const body = document.getElementById('backup-body');
  const meta = document.getElementById('backup-meta');
  const note = document.getElementById('backup-note');
  const btn = document.getElementById('btn-backup-save');
  if (title) title.textContent = t(sent ? 'backup.sentTitle' : 'backup.dueTitle');
  if (body) body.textContent = t(sent ? 'backup.sentBody' : 'backup.dueBody');
  if (meta) meta.textContent = t('backup.fileName', { name: filename });
  if (note) {
    const noteKey = (sent && usedShare) ? 'backup.shareHint' : 'backup.noConfirm';
    note.textContent = t(noteKey);
    note.hidden = false;
  }
  if (btn) btn.textContent = t(sent ? 'backup.saveAgain' : 'backup.saveNow');
  el.hidden = false;
  document.body.classList.add('has-backup-banner');
}

function showBackupStrip(kind, filename, usedShare) {
  backupStripState = { kind, filename, usedShare: usedShare === true };
  renderBackupStrip();
}

function hideBackupStrip() {
  backupStripState = null;
  const el = document.getElementById('backup-banner');
  if (el) el.hidden = true;
  document.body.classList.remove('has-backup-banner');
}

/* Volá sa vždy, keď sa obrazovka alebo dialóg ustálil (a pri štarte).
   Na bežných prehliadačoch súbor odovzdá automaticky; na Apple mobile sa
   tiché sťahovanie Zámerne neskúša – je neoveriteľné a môže otvoriť náhľad
   namiesto uloženia, takže používateľ dostane tlačidlo. */
function refreshBackupOffer() {
  if (!state) return;
  /* Počas tréningu alebo otvoreného dialógu sa lišta schová a nič sa neodosiela.
     Ponuka sa nezapisuje, takže zostáva "potrebná" a objaví sa, keď sa appka
     upokojí. */
  if (backupBlocked()) { hideBackupStrip(); return; }
  /* Už zobrazená ponuka sa neprekresľuje ani neopakuje. */
  if (backupStripState) return;
  if (!backupDue()) return;
  const filename = backupFileName();
  /* Na Apple mobile sa tiché sťahovanie Zámerne neskúša – je neoveriteľné a
     môže otvoriť náhľad namiesto uloženia, takže používateľ dostane tlačidlo. */
  if (isAppleMobile()) {
    markBackupOffered();
    showBackupStrip('due', filename, false);
    return;
  }
  const ok = downloadBackupFile(backupPayload(), filename);
  markBackupOffered();
  showBackupStrip(ok ? 'sent' : 'due', filename, false);
}

function formatBackupTimestamp(ms) {
  const n = Number(ms);
  if (!Number.isFinite(n) || n <= 0) return t('backup.never');
  const d = new Date(n);
  if (!Number.isFinite(d.getTime())) return t('backup.never');
  const p = (v) => String(v).padStart(2, '0');
  return formatDate(localDateKey(d)) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
}

function renderAutoBackupSetting() {
  const on = !!(state && state.settings && state.settings.autoBackup === true);
  const btn = document.getElementById('btn-auto-backup');
  if (btn) {
    btn.setAttribute('aria-checked', on ? 'true' : 'false');
    btn.classList.toggle('on', on);
  }
  const stateEl = document.getElementById('auto-backup-state');
  if (stateEl) stateEl.textContent = on ? t('settings.on') : t('settings.off');
  const lastEl = document.getElementById('auto-backup-last');
  if (lastEl) {
    lastEl.textContent = t('settings.autoBackupLast', {
      when: formatBackupTimestamp(state && state.settings ? state.settings.autoBackupOfferedAt : null),
    });
  }
}

function exportData() {
  /* Rozbehnutá session je len stav tohto zariadenia – do zálohy nepatrí,
     aby sa cez export/import neprenášal nedokončený tréning. */
  const snapshot = Object.assign({}, state);
  delete snapshot.activeSession;
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `gymquest-backup-${todayISO()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}

function importFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!data || typeof data !== 'object' || !data.plans || !Array.isArray(data.history)) {
        showGeneric(t('settings.importError'), t('common.ok'), null);
        return;
      }
      pendingImport = data;
      /* Ak je záloha menšia než to, čo je práve v appke, používateľ to musí
         vidieť ešte pred potvrdením – nikdy nesmie ticho prepísať novšie dáta
         starším súborom. Nič sa neblokuje, len sa to povie. */
      const incomingCount = data.history.length;
      const currentCount = state.history.length;
      let confirmText = t('settings.importConfirm', { n: incomingCount });
      if (incomingCount < currentCount) {
        confirmText += '<br>' + t('settings.importOlder', { old: currentCount, new: incomingCount });
      }
      // potvrdzujúce tlačidlo musí pomenovať deštruktívnu akciu, nie „Zrušiť" ako tlačidlo vľavo
      showGeneric(t('settings.importTitle'), t('settings.import'), () => {
        try {
          // staršie zálohy (v1/v2) prejdú rovnakou migráciou ako uložené dáta
          if (data.settings && !data.settings.lang) data.settings.lang = state.settings.lang;
          /* Najbezpečnejšie správanie: rozbehnutá session sa importom vždy vyčistí.
             Cudzia nedokončená session by inak mohla previazať nové dáta na starý plán. */
          delete data.activeSession;
          const incoming = data.version === 1 ? migrateV1toV2(data) : data;
          state = migrateV2toV3(incoming);
          reconcileAchievements();
          saveState();
          document.getElementById('modal-settings').hidden = true;
          renderAll();
        } catch (err) {
          showGeneric(t('settings.importError'), t('common.ok'), null);
        }
      }, confirmText);
    } catch (e) {
      showGeneric(t('settings.importError'), t('common.ok'), null);
    }
  };
  reader.readAsText(file);
}

function requestResetData() {
  showGeneric(t('settings.resetTitle'), t('settings.resetConfirmAction'), () => {
    showGeneric(t('settings.resetFinal'), t('settings.resetFinalAction'), () => {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_KEY + '_seeded');
      location.reload();
    }, t('settings.resetFinalConfirm'));
  }, t('settings.resetConfirm'));
}

/* ---------- Generický modal ---------- */

let genericCallback = null;

function showGeneric(title, okLabel, onOk, text) {
  document.getElementById('generic-title').textContent = title || t('common.confirmTitle');
  document.getElementById('generic-text').innerHTML = text || '';
  const okBtn = document.getElementById('btn-generic-ok');
  okBtn.textContent = okLabel || t('common.ok');
  genericCallback = onOk || null;
  document.getElementById('modal-generic').hidden = false;
}

function closeGeneric() {
  document.getElementById('modal-generic').hidden = true;
  genericCallback = null;
  refreshUpdateBanner();
}

function confirmGeneric() {
  const cb = genericCallback;
  document.getElementById('modal-generic').hidden = true;
  genericCallback = null;
  if (cb) cb();
}

/* ---------- Zvuk po skončení pauzy (voliteľný, predvolene vypnutý) ----------
   Krátky jemný gong generovaný cez Web Audio API – žiadny externý súbor, žiadne CDN.
   Jeden AudioContext pre celú aplikáciu, vytvára sa až po skutočnom pokyne používateľa,
   aby prehliadač nehlásil porušenie autoplay pravidiel. */

let audioCtx = null;
let audioPrimed = false;   // zvuková stopa už bola raz aktivovaná v rámci pokynu používateľa

function getAudioContext() {
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new Ctor();
    audioPrimed = false;
    attachAudioStateWatcher(audioCtx);
  }
  return audioCtx;
}

/* iOS drží zvukový kontext po návrate z pozadia v stave 'interrupted' alebo 'suspended'.
   Sledujeme zmenu stavu, aby sme vedeli, kedy je zvuk naozaj dostupný. */
function attachAudioStateWatcher(ctx) {
  if (!ctx || typeof ctx.addEventListener !== 'function') return;
  ctx.addEventListener('statechange', () => {
    if (ctx.state === 'running') audioPrimed = true;
  });
}

/* Aktivuje zvukovú stopu. WebKit potrebuje prejsť aspoň jeden uzol do `destination`
   v rámci pokynu používateľa – bez toho sa výstup (reproduktor, slúchadlá, Bluetooth)
   nemusí vôbec prepnúť a gong zostane ticho. Preto po každom úspešnom resume
   prehráme jednu tichú vzorku. */
function primeAudio(ctx) {
  try {
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
    audioPrimed = true;
  } catch (e) { /* zvuk je len doplnok – nikdy nesmie nič pokaziť */ }
}

/* Obnoví zvukový kontext a (prvý raz) aktivuje zvukovú stopu.
   Vracia Promise<boolean>: true = kontext naozaj beží. Nikdy nevyhodí výnimku. */
function resumeAudio() {
  let ctx = null;
  try { ctx = getAudioContext(); } catch (e) { return Promise.resolve(false); }
  if (!ctx) return Promise.resolve(false);
  if (ctx.state === 'running') {
    if (!audioPrimed) primeAudio(ctx);
    return Promise.resolve(true);
  }
  if (typeof ctx.resume !== 'function') return Promise.resolve(false);
  let resuming = null;
  try { resuming = ctx.resume(); } catch (e) { return Promise.resolve(false); }
  if (!resuming || typeof resuming.then !== 'function') return Promise.resolve(ctx.state === 'running');
  return resuming.then(() => {
    if (ctx.state === 'running') {
      if (!audioPrimed) primeAudio(ctx);
      return true;
    }
    return false;
  }).catch(() => false);
}

/* Odblokovanie zvuku – iOS aj Chrome ho vyžadujú pri pokyne používateľa.
   Kontext sa tu aj vytvára, takže vzniká vnútri skutočného pokynu používateľa. */
function unlockAudio() {
  return resumeAudio();
}

/* Obnovenie zvuku mimo pokynu používateľa (návrat z pozadia, ďalšie ťuknutie).
   Bez pokynu sa nový kontext NIKDY nevytvára – len sa obnoví existujúci. */
function resumeAudioIfNeeded(fromGesture) {
  if (!restSoundOn()) return;
  if (audioCtx && audioCtx.state === 'running' && audioPrimed) return;
  if (!audioCtx && !fromGesture) return;
  unlockAudio();
}

/* JEDEN gongový tón pre všetky údery – žiadna melódia, žiadna zmena výšky.
   Každý ďalší úder je len o niečo tichší, takže to znie ako obyčajná
   notifikácia časovača: GONG … GONG … GONG. */
const GONG_FREQ = 392;             // Hz – teplý tón, zreteľne počuteľný aj na reproduktore telefónu
const GONG_PEAK = 0.22;            // hlasitosť prvého úderu (stredná)
const GONG_TAPER = [1, 0.7, 0.5];  // každý ďalší úder je tichší: 0.22 → 0.154 → 0.11

/* Dĺžky gongu: časy úderov a spoločné doznenie v `end`.
   Krátky 2 s (2 údery) · štandardný 4 s (3 údery) · dlhý 6 s (3 údery). */
const CHIME_PRESETS = {
  short:    { end: 2.0, at: [0, 1.0] },
  standard: { end: 4.0, at: [0, 1.5, 3.0] },
  long:     { end: 6.0, at: [0, 2.0, 4.0] },
};

function restSoundLength() {
  const v = state && state.settings && state.settings.restSoundLength;
  return (v === 'short' || v === 'long') ? v : 'standard';
}

/* Aktívne hraný gong – nový gong plynulo utíši predošlý, aby rýchle ťukania
   nevytvorili neovládateľné prekrývajúce sa zvuky. */
let activeChime = null;

function stopActiveChime() {
  if (!activeChime) return;
  const ctx = activeChime.ctx;
  try {
    const now = ctx.currentTime;
    for (const tone of activeChime.tones) {
      try {
        tone.gain.gain.cancelScheduledValues(now);
        tone.gain.gain.setValueAtTime(Math.max(0.0001, tone.gain.gain.value), now);
        tone.gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
        tone.osc.stop(now + 0.06);
      } catch (e) {}
    }
  } catch (e) {}
  activeChime = null;
}

/* Vykreslí gong na UŽ BEŽIACI kontext. Nikdy sa nevolá na pozastavenom kontexte –
   práve preto je celá tvorba uzlov oddelená od playChime(). */
function scheduleChime(ctx, length) {
  stopActiveChime();   // žiadne prekrývajúce sa zvuky pri rýchlom ťukaní
  const preset = CHIME_PRESETS[length] || CHIME_PRESETS.standard;
  /* malý predstih, aby žiadna naplánovaná udalosť nepadla do minulosti */
  const start = ctx.currentTime + 0.01;
  const end = start + preset.end;
  const master = ctx.createGain();
  master.gain.value = 0.9;
  master.connect(ctx.destination);

  const tones = [];
  preset.at.forEach((offset, index) => {
    const t0 = start + offset;
    const span = end - t0;    // koľko času tomuto úderu ešte zostáva
    /* Obálka sa prispôsobuje dĺžke úderu. Pri pevných odstupoch by sa pri krátkych
       dĺžkach držané telo a chvost stretli v tom istom čase a zvuk by stratil sustain. */
    const ringAt = t0 + Math.min(0.45, span * 0.20);
    const bodyAt = t0 + Math.min(1.50, span * 0.50);
    const fadeAt = end - Math.min(0.50, span * 0.25);
    /* rovnaký tón pri každom údere – mení sa LEN hlasitosť, teda žiadna melódia */
    const peak = GONG_PEAK * (GONG_TAPER[index] !== undefined ? GONG_TAPER[index] : GONG_TAPER[GONG_TAPER.length - 1]);
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(GONG_FREQ, t0);
    /* jemný nábeh → prirodzené doznenie → držané telo → ešte zreteľne znejúci chvost →
       plynulé utíchnutie. Žiadny klik, žiadny skok, žiadny ostrý alarm. */
    env.gain.setValueAtTime(0.0001, t0);
    env.gain.exponentialRampToValueAtTime(peak, t0 + 0.03);
    env.gain.exponentialRampToValueAtTime(peak * 0.55, ringAt);
    env.gain.exponentialRampToValueAtTime(peak * 0.30, bodyAt);
    env.gain.exponentialRampToValueAtTime(peak * 0.22, fadeAt);
    env.gain.exponentialRampToValueAtTime(0.0001, end);
    osc.connect(env);
    env.connect(master);
    osc.start(t0);
    osc.stop(end + 0.05);
    tones.push({ osc, gain: env });
  });

  activeChime = { ctx, master, tones };
  let remaining = tones.length;
  for (const tone of tones) {
    /* uzly sa po doznení odpoja – žiadne hromadenie v pamäti */
    tone.osc.onended = () => {
      try { tone.osc.disconnect(); tone.gain.disconnect(); } catch (e) {}
      remaining -= 1;
      if (remaining <= 0) {
        try { master.disconnect(); } catch (e) {}
        if (activeChime && activeChime.master === master) activeChime = null;
      }
    };
  }
  return true;
}

/* Prehrá gong. Vždy najprv počká, kým je kontext naozaj spustený: na iOS/Safari je
   nový AudioContext 'suspended' (aj 'interrupted') a uzly naplánované pred spustením
   sa neprehrajú – to bola príčina tichého "Test sound".
   Vracia Promise<boolean>: true = zvuk sa naozaj naplánoval, false = zvuk nie je
   dostupný alebo ho prehliadač odmietol. */
function playChime(length) {
  let ctx = null;
  try {
    ctx = getAudioContext();   // vytvorenie prebehne synchrónne v rámci pokynu používateľa
  } catch (e) { ctx = null; }
  if (!ctx) return Promise.resolve(false);

  /* Naplánovať až po skutočnom spustení kontextu – na pozastavenom kontexte je gong ticho.
     resumeAudio() zároveň aktivuje zvukovú stopu (primeAudio), takže sa použije práve
     aktuálna výstupná cesta zariadenia – vrátane slúchadiel a Bluetooth. */
  return resumeAudio().then((running) => {
    if (!running) return false;
    try { return scheduleChime(ctx, length); } catch (e) { return false; }
  });
}

function restSoundOn() {
  return !!(state && state.settings && state.settings.restSound === true);
}

function setSoundLength(len) {
  state.settings.restSoundLength = (len === 'short' || len === 'long') ? len : 'standard';
  renderRestSoundSetting();
  saveState();
}

function hideTestSoundError() {
  const el = document.getElementById('test-sound-error');
  if (el) { el.hidden = true; el.textContent = ''; }
}

function renderRestSoundSetting() {
  const btn = document.getElementById('btn-rest-sound');
  const stateEl = document.getElementById('rest-sound-state');
  const on = restSoundOn();
  if (btn) {
    btn.setAttribute('aria-checked', on ? 'true' : 'false');
    btn.classList.toggle('on', on);
  }
  if (stateEl) stateEl.textContent = on ? t('settings.on') : t('settings.off');
  const box = document.getElementById('sound-length');
  if (box) box.hidden = !on;   // dĺžka sa ukáže len keď je zvuk zapnutý
  /* Test sound má zmysel len pri zapnutom zvuku – inak je neaktívne s vysvetlením. */
  const testBtn = document.getElementById('btn-test-sound');
  if (testBtn) testBtn.disabled = !on;
  const hint = document.getElementById('test-sound-hint');
  if (hint) hint.hidden = on;
  if (!on) hideTestSoundError();
  const len = restSoundLength();
  document.querySelectorAll('.sound-length-chips .len-chip').forEach(c => {
    const active = c.dataset.len === len;
    c.classList.toggle('active', active);
    c.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
}

/* ---------- Timer ---------- */

/* Odpočet je tranzientný – ukladá sa do samostatného kľúča (nie do zálohy/exportu),
   aby prežil obnovenie stránky, ale neprenášal sa medzi zariadeniami. */
const REST_TIMER_KEY = 'gymquest_resttimer';
let wasHidden = document.hidden;

function persistRestTimerEnd(endAt) {
  try {
    if (endAt) localStorage.setItem(REST_TIMER_KEY, String(endAt));
    else localStorage.removeItem(REST_TIMER_KEY);
  } catch (e) {}
}

function restoreRestTimerEnd() {
  try {
    const raw = localStorage.getItem(REST_TIMER_KEY);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch (e) { return null; }
}

/* Dokončí odpočet. Dokončenie je naviazané na KONKRÉTNE id odpočtu, takže:
   - ten istý odpočet sa nikdy nemôže dokončiť dvakrát (interval, návrat z pozadia,
     obnovenie stránky, ťuknutie, prekreslenie),
   - nový odpočet sa nikdy nemôže "dokončiť" oneskoreným callbackom starého odpočtu.
   withSound=true znamená, že dokončenie sme naozaj videli naživo. */
function finishRestTimer(sessionId, withSound) {
  if (sessionId !== timerSessionId) return;      // beží už iný odpočet
  if (timerCompletedId === sessionId) return;    // toto dokončenie je už spracované
  timerCompletedId = sessionId;

  stopTimer();
  const bar = document.getElementById('timer-bar');
  bar.classList.add('done');
  bar.hidden = false;
  bar.setAttribute('aria-label', t('trening.timerComplete'));
  document.getElementById('timer-label').textContent = t('trening.timerDone');
  document.getElementById('timer-time').textContent = '00:00';
  if (withSound && restSoundOn()) playChime(restSoundLength());
}

/* Smie za toto dokončenie zaznieť gong? Iba ak appka bežala naživo a koniec sme
   zachytili hneď. Keď bol callback oneskorený (telefón appku pozastavil) alebo
   sme boli v čase konca skrytí, odpočet sa dokončí potichu – žiadny oneskorený gong. */
function completionWasLive() {
  if (document.hidden) return false;
  if (timerHiddenAt !== 0 && timerHiddenAt < timerEnd) return false;
  return (Date.now() - timerEnd) <= TIMER_SOUND_GRACE_MS;
}

function restTimerTick() {
  if (Date.now() >= timerEnd) {
    finishRestTimer(timerSessionId, completionWasLive());
    return;
  }
  updateTimerDisplay();
}

function armRestTimer() {
  if (timerInterval !== null) return;
  timerInterval = setInterval(restTimerTick, 250);
}

/* Po návrate z pozadia: ak odpočet už dobehol, dokonči ho POTICHU; inak len obnov zobrazenie. */
function refreshRestTimerOnVisible() {
  if (timerInterval === null) return;
  if (Date.now() >= timerEnd) {
    finishRestTimer(timerSessionId, false);
  } else {
    updateTimerDisplay();
  }
}

/* Obnoví bežiaci odpočet po obnovení stránky z absolútneho koncového času.
   Obnovený odpočet je vždy NOVÁ inštancia, takže sa nemôže pomýliť s tou predchádzajúcou.
   Ak medzitým dobehol, zobrazí sa dokončený stav BEZ gongu. */
function restoreRestTimer() {
  const endAt = restoreRestTimerEnd();
  if (!endAt) return;
  timerSessionId++;
  timerEnd = endAt;
  if (Date.now() >= endAt) {
    finishRestTimer(timerSessionId, false);
    return;
  }
  const bar = document.getElementById('timer-bar');
  bar.classList.remove('done');
  bar.hidden = false;
  document.getElementById('timer-label').textContent = t('trening.timerLabel');
  updateTimerDisplay();
  armRestTimer();
}

function startTimer(seconds) {
  stopTimer();
  unlockAudio();               // štart časovača je pokyn používateľa – odblokuje zvuk
  timerSessionId++;            // nový odpočet = nová identita (starý sa už nikdy nedokončí)
  timerEnd = Date.now() + seconds * 1000;
  persistRestTimerEnd(timerEnd);   // absolútny koniec prežije aj obnovenie stránky
  const bar = document.getElementById('timer-bar');
  bar.classList.remove('done');
  bar.removeAttribute('aria-label');
  bar.hidden = false;
  document.getElementById('timer-label').textContent = t('trening.timerLabel');
  updateTimerDisplay();
  armRestTimer();
}

function updateTimerDisplay() {
  const left = Math.max(0, Math.round((timerEnd - Date.now()) / 1000));
  const m = String(Math.floor(left / 60)).padStart(2, '0');
  const s = String(left % 60).padStart(2, '0');
  document.getElementById('timer-time').textContent = `${m}:${s}`;
}

function stopTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = null;
  persistRestTimerEnd(null);
  const bar = document.getElementById('timer-bar');
  if (bar) bar.hidden = true;
}

/* ---------- Vlastný čas pauzy ---------- */

function renderCustomTimer() {
  const box = document.getElementById('custom-timer');
  if (!box) return;
  const open = !box.hidden;
  const chip = document.getElementById('btn-custom-timer');
  if (chip) {
    chip.classList.toggle('active', open);
    chip.setAttribute('aria-pressed', open ? 'true' : 'false');
  }
  document.getElementById('ct-minutes').value = String(state.settings.customRestMinutes);
  document.getElementById('ct-seconds').value = String(state.settings.customRestSeconds);
  updateCustomPreview();
  document.getElementById('ct-error').hidden = true;
}

function toggleCustomTimer() {
  const box = document.getElementById('custom-timer');
  box.hidden = !box.hidden;
  renderCustomTimer();
}

function hideCustomTimer() {
  const box = document.getElementById('custom-timer');
  if (box) box.hidden = true;
  const chip = document.getElementById('btn-custom-timer');
  if (chip) { chip.classList.remove('active'); chip.setAttribute('aria-pressed', 'false'); }
}

function updateCustomPreview() {
  const m = parseInt(document.getElementById('ct-minutes').value, 10);
  const s = parseInt(document.getElementById('ct-seconds').value, 10);
  const norm = normalizeCustomRest(
    Number.isFinite(m) && m > 0 ? m : 0,
    Number.isFinite(s) && s > 0 ? s : 0
  );
  document.getElementById('ct-preview').textContent = `${norm.minutes}:${String(norm.seconds).padStart(2, '0')}`;
}

/* Vráti { total, minutes, seconds } alebo { error: 'invalid' | 'zero' }. */
function readCustomTimer() {
  const minEl = document.getElementById('ct-minutes');
  const secEl = document.getElementById('ct-seconds');
  const mRaw = minEl.value.trim();
  const sRaw = secEl.value.trim();
  const m = Number(mRaw);
  const s = Number(sRaw);
  if (mRaw === '' || sRaw === '' || !Number.isFinite(m) || !Number.isFinite(s)
      || !Number.isInteger(m) || !Number.isInteger(s) || m < 0 || s < 0) {
    return { error: 'invalid' };
  }
  const norm = normalizeCustomRest(m, s);
  const total = norm.minutes * 60 + norm.seconds;
  if (total <= 0) return { error: 'zero' };
  return { total, minutes: norm.minutes, seconds: norm.seconds };
}

function startCustomTimer() {
  const errEl = document.getElementById('ct-error');
  const result = readCustomTimer();
  if (result.error) {
    errEl.hidden = false;
    errEl.textContent = t(result.error === 'zero' ? 'trening.customZero' : 'trening.customInvalid');
    return;
  }
  errEl.hidden = true;
  state.settings.customRestMinutes = result.minutes;
  state.settings.customRestSeconds = result.seconds;
  saveState();
  hideCustomTimer();
  startTimer(result.total);
}

/* ---------- Jazyk ---------- */

/* Smerové glyfy: v RTL musia šípky ukazovať na tú stranu, ktorou sa naozaj ide.
   "Predchádzajúci mesiac" je v RTL vpravo a ukazuje doprava. */
function dirGlyph(ltrGlyph, rtlGlyph) {
  return isRtl() ? rtlGlyph : ltrGlyph;
}

function applyDirGlyphs() {
  const pairs = [
    ['btn-cal-prev', '‹', '›'],
    ['btn-cal-next', '›', '‹'],
    ['btn-plan-left', '‹', '›'],
    ['btn-plan-right', '›', '‹'],
  ];
  for (const [id, ltr, rtl] of pairs) {
    const el = document.getElementById(id);
    if (el) el.textContent = dirGlyph(ltr, rtl);
  }
}

/* Aktuálny jazyk v Nastaveniach. Endonym sa nikdy neprekladá – používateľ musí
   svoju voľbu spoznať aj v rozhraní, ktorému nerozumie. */
function renderLangSetting() {
  const el = document.getElementById('lang-setting-value');
  if (!el) return;
  const name = langDisplayName(activeLang());
  el.textContent = name;
  el.setAttribute('aria-label', t('settings.languageCurrent', { name }));
}

/* Zoznam jazykov v pickeri. Každá položka nesie vlastné lang/dir, aby sa
   العربية vykreslila správne aj v rozhraní iného jazyka. */
function renderLangList() {
  const box = document.getElementById('lang-list');
  if (!box) return;
  box.innerHTML = '';
  const current = activeLang();
  for (const lang of LANGUAGES) {
    const on = lang.code === current;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'lang-item' + (on ? ' active' : '');
    btn.dataset.lang = lang.code;
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.setAttribute('aria-label', t(on ? 'langPicker.selected' : 'langPicker.select', { name: lang.name }));

    const check = document.createElement('span');
    check.className = 'lang-check';
    check.setAttribute('aria-hidden', 'true');
    check.textContent = on ? '✓' : '';

    const name = document.createElement('span');
    name.className = 'lang-name';
    name.lang = lang.code;
    name.dir = lang.rtl ? 'rtl' : 'ltr';
    name.textContent = lang.name;

    btn.append(check, name);
    btn.addEventListener('click', () => setLang(lang.code));
    box.appendChild(btn);
  }
}

function openLanguagePicker() {
  renderLangList();
  document.getElementById('modal-lang').hidden = false;
  refreshUpdateBanner();
}

function hideLanguagePicker() {
  const modal = document.getElementById('modal-lang');
  if (modal) modal.hidden = true;
  refreshUpdateBanner();
}

/* Prepnutie jazyka: okamžité, bez obnovenia stránky. NEMENÍ nič iné –
   priebeh tréningu, označené série, časovače, trvanie, vybraný plán, poradie
   plánov ani zobrazený mesiac kalendára zostávajú presne také, aké boli. */
function setLang(code) {
  if (LANG_CODES.indexOf(code) < 0) return;
  hideLanguagePicker();
  if (code === activeLang()) return;
  state.settings.lang = code;
  saveState();
  applyStaticI18n();
  renderAll();
}

function applyStaticI18n() {
  const lang = activeLang();
  document.documentElement.lang = lang;
  document.documentElement.dir = isRtl() ? 'rtl' : 'ltr';
  if (document.body) document.body.classList.toggle('rtl', isRtl());
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    el.title = t(el.dataset.i18nTitle);
  });
  document.querySelectorAll('[data-i18n-aria]').forEach(el => {
    el.setAttribute('aria-label', t(el.dataset.i18nAria));
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  renderLangSetting();
  renderLangList();
  renderAutoBackupSetting();
  renderBackupStrip();   // jazyková zmena musí prekresliť aj lištu zálohy
  updatePlanManageButton();   // prepínač plánov má v každom jazyku správny text
  applyDirGlyphs();
}

/* ---------- Kontrola prekladov ---------- */

/* Každý jazyk sa porovnáva s angličtinou (referenčný slovník).
   Chýbajúci kľúč sa v rozhraní nikdy nezobrazí ako kľúč – t() má fallback –
   ale počas vývoja to musí byť vidieť. */
function verifyI18n() {
  const ref = Object.keys(I18N.en);
  for (const lang of LANG_CODES) {
    if (lang === 'en') continue;
    const dict = I18N[lang] || {};
    const missing = ref.filter(k => dict[k] === undefined);
    if (missing.length) {
      console.warn('GymQuest: chýbajúce preklady (' + lang + '):', missing);
    }
  }
}

/* ---------- Eventy ---------- */

/* Bezpečné pripájanie listenerov: chýbajúci prvok už nikdy nevyhodí výnimku,
   ktorá by potichu vypnula všetky nasledujúce tlačidlá. */
function on(id, handler, event) {
  const el = document.getElementById(id);
  if (!el) {
    console.warn('GymQuest: chýba prvok #' + id + ' – listener sa nepripojil');
    return null;
  }
  el.addEventListener(event || 'click', handler);
  return el;
}

function setupEvents() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  on('btn-change-lang', openLanguagePicker);
  on('btn-lang-cancel', hideLanguagePicker);
  on('btn-settings', openSettings);

  on('btn-start-workout', () => {
    const rec = recommendedPlan();
    if (rec) selectedPlan = rec;
    /* Meranie trvania sa spúšťa tu – absolútny čas štartu sa ukladá do session. */
    if (ensureSession()) saveState();
    switchTab('trening');
  });

  on('btn-excuse', () => {
    const key = currentWeekKey();
    const idx = state.excusedWeeks.indexOf(key);
    if (idx >= 0) state.excusedWeeks.splice(idx, 1);
    else state.excusedWeeks.push(key);
    saveState();
    renderAll();
  });

  on('btn-finish-workout', finishWorkout);
  on('btn-confirm-cancel', () => { document.getElementById('modal-confirm').hidden = true; refreshUpdateBanner(); });
  on('btn-confirm-ok', confirmFinish);
  on('btn-result-close', () => { document.getElementById('modal-result').hidden = true; refreshUpdateBanner(); });
  on('btn-result-undo', requestUndoWorkout);

  on('btn-add-exercise', () => {
    if (editingPlan === null) return;
    editDraft.push({ name: '', sets: 3, reps: 10, weight: 0, plannedFailureSets: [] });
    renderEditPanel();
  });
  on('btn-edit-save', saveEditPlan);
  on('btn-edit-cancel', cancelEditPlan);

  on('btn-manage-plans', () => setPlanManageMode(!planManageMode));
  on('btn-add-plan', openPlanChoice);
  on('btn-choice-blank', () => { closePlanChoice(); addPlan(); });
  on('btn-choice-fullbody', openFullBodyBuilder);
  on('btn-choice-cancel', closePlanChoice);
  on('btn-fb-cancel', closeFullBodyBuilder);
  on('btn-fb-create', () => { if (fbMode === 'edit') applyExercisePicker(); else createFullBodyPlan(); });
  on('fb-name', (e) => { fbName = e.target.value; fbNameTouched = true; }, 'input');
  on('btn-edit-add-from-plans', openExercisePicker);
  setupEditRowDrag();
  setupChipDrag();
  on('btn-plan-rename', () => startEditPlan(selectedPlan));
  on('btn-plan-left', () => movePlan(editingPlan, -1));
  on('btn-plan-right', () => movePlan(editingPlan, 1));
  on('btn-plan-delete', requestDeletePlan);
  on('edit-plan-name', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEditPlan();
    }
  }, 'keydown');

  on('btn-reset-session', () => {
    showGeneric(t('trening.resetSessionTitle'), t('common.cancel'), () => {
      /* Session sa ruší až po potvrdení – nič sa nezapisuje do histórie. */
      clearSession();
      stopTimer();
      saveState();
      renderTrening();
    }, t('trening.resetSessionConfirm'));
  });

  document.querySelectorAll('.timer-chip[data-seconds]').forEach(chip => {
    chip.addEventListener('click', () => {
      hideCustomTimer();
      startTimer(parseInt(chip.dataset.seconds, 10));
    });
  });
  on('timer-stop', stopTimer);
  on('btn-custom-timer', toggleCustomTimer);
  on('btn-start-custom', startCustomTimer);
  on('ct-minutes', updateCustomPreview, 'input');
  on('ct-seconds', updateCustomPreview, 'input');

  on('btn-setup-ok', confirmSetup);
  // viditeľné Uložiť aj pôvodné Zavrieť – obe uložia, aby sa zmena nikdy nestratila
  on('btn-settings-save', () => {
    if (saveSettingsGoal()) document.getElementById('modal-settings').hidden = true;
  });
  on('btn-settings-close', () => {
    saveSettingsGoal();
    document.getElementById('modal-settings').hidden = true;
  });
  on('btn-rest-sound', () => {
    state.settings.restSound = !restSoundOn();
    unlockAudio();               // používateľský pokyn = povolenie prehrávať zvuk
    renderRestSoundSetting();
    saveState();
  });
  on('btn-auto-backup', () => {
    state.settings.autoBackup = state.settings.autoBackup !== true;
    backupDismissed = false;
    saveState();
    renderAutoBackupSetting();
    /* Zapnutie hneď vyhodnotí, či už záloha nie je potrebná. */
    refreshBackupOffer();
  });
  on('btn-backup-save', saveBackupNow);
  on('btn-backup-now', saveBackupNow);
  on('backup-dismiss', () => {
    backupDismissed = true;      // len do konca tejto relácie
    hideBackupStrip();
  });
  on('btn-test-sound', () => {
    if (!restSoundOn()) return;        // pri vypnutom zvuku je tlačidlo neaktívne
    hideTestSoundError();
    /* Presne ten istý gong, aký zaznie pri prirodzenom dobehnutí odpočtu.
       playChime vytvorí/obnoví AudioContext synchrónne v rámci tohto kliknutia. */
    playChime(restSoundLength()).then((played) => {
      if (played) return;              // hrá – nič nehlásime
      const err = document.getElementById('test-sound-error');
      if (!err) return;
      err.textContent = t('settings.testSoundFailed');
      err.hidden = false;
    });
  });
  document.querySelectorAll('.sound-length-chips .len-chip').forEach(chip => {
    chip.addEventListener('click', () => setSoundLength(chip.dataset.len));
  });

  on('btn-export', exportData);
  on('btn-import', () => { document.getElementById('file-import').click(); });
  on('file-import', (e) => {
    const f = e.target.files && e.target.files[0];
    if (f) importFile(f);
    e.target.value = '';
  }, 'change');
  on('btn-reset-data', requestResetData);

  on('btn-load-demo', () => {
    if (state.history.length > 0) {
      showGeneric(t('settings.demoNone'), t('common.ok'), null);
      return;
    }
    showGeneric(t('settings.loadDemo'), t('settings.loadDemo'), () => {
      seedSampleData();
      openSettings();
      renderAll();
    }, t('settings.demoConfirm'));
  });

  on('btn-remove-demo', () => {
    showGeneric(t('settings.removeDemo'), t('settings.removeDemo'), () => {
      removeDemoData();
      openSettings();
      renderAll();
    }, t('settings.demoRemoveConfirm'));
  });

  on('btn-generic-cancel', closeGeneric);
  on('btn-generic-ok', confirmGeneric);

  on('btn-he-cancel', () => { document.getElementById('modal-history-edit').hidden = true; refreshUpdateBanner(); });
  on('btn-he-save', saveHistoryEdit);

  /* --- Kalendár --- */
  on('btn-cal-prev', () => shiftMonth(-1));
  on('btn-cal-next', () => shiftMonth(1));
  on('btn-cal-today', goToCurrentMonth);
  on('btn-day-close', closeDay);
  // jediný delegovaný listener na mriežku – nevzniká 42 listenerov pri každom prekreslení
  on('calendar-grid', (e) => {
    const btn = e.target.closest ? e.target.closest('[data-day]') : null;
    if (btn && btn.dataset.day) openDay(btn.dataset.day);
  });
  // jeden dokumentový listener pre Esc (modal nie je fokusovateľný kontajner)
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const langModal = document.getElementById('modal-lang');
    if (langModal && !langModal.hidden) { hideLanguagePicker(); return; }
    const measureModal = document.getElementById('modal-measure');
    if (measureModal && !measureModal.hidden) { measureModal.hidden = true; refreshUpdateBanner(); return; }
    const foodModal = document.getElementById('modal-food');
    if (foodModal && !foodModal.hidden) { foodModal.hidden = true; refreshUpdateBanner(); return; }
    const modal = document.getElementById('modal-day');
    if (modal && !modal.hidden) closeDay();
  });

  /* ---------- Pokrok: podpohľady, telo a jedlo ---------- */
  on('pokrok-subtabs', (e) => {
    const btn = e.target.closest ? e.target.closest('.subtab') : null;
    if (btn && btn.dataset.pokrok) setPokrokView(btn.dataset.pokrok);
  });

  on('body-units', (e) => {
    const btn = e.target.closest ? e.target.closest('.unit-chip') : null;
    if (btn && btn.dataset.units) setBodyUnits(btn.dataset.units);
  });

  on('btn-add-measure', () => openMeasureModal(null));
  on('btn-measure-cancel', () => { document.getElementById('modal-measure').hidden = true; refreshUpdateBanner(); });
  on('btn-measure-save', saveMeasure);

  on('calorie-adult-chips', (e) => {
    const btn = e.target.closest ? e.target.closest('.metric-chip') : null;
    if (!btn || !btn.dataset.adult) return;
    state.profile.isAdult = btn.dataset.adult === 'yes';
    saveState();
    renderPokrok();
  });

  on('btn-tips', () => toggleTips('btn-tips', 'tips-body'));
  on('btn-food-tips', () => toggleTips('btn-food-tips', 'food-tips-body'));

  on('btn-food-prev', () => shiftFoodDay(-1));
  on('btn-food-next', () => shiftFoodDay(1));
  on('btn-food-add', () => openFoodModal('entry', null));
  on('btn-food-new-template', () => openFoodModal('template', null));
  on('btn-food-cancel', () => { document.getElementById('modal-food').hidden = true; refreshUpdateBanner(); });
  on('btn-food-save', saveFoodModal);

  on('btn-food-enable', () => {
    state.settings.foodLogEnabled = true;
    foodDate = null;
    saveState();
    renderPokrok();
  });
  on('btn-food-disable', () => {
    /* Vypnutie funkcie nič nemaže – záznamy zostávajú a dajú sa znovu zapnúť. */
    state.settings.foodLogEnabled = false;
    saveState();
    renderPokrok();
  });

  /* Výber uloženej potraviny vyplní polia – hodnoty sa dajú pred uložením upraviť. */
  on('food-pick', (e) => {
    const f = foodById(e.target.value);
    if (!f) return;
    document.getElementById('ff-name').value = f.name;
    document.getElementById('ff-kcal').value = String(f.kcal);
    document.getElementById('ff-protein').value = String(f.protein);
    document.getElementById('ff-carbs').value = String(f.carbs);
    document.getElementById('ff-fat').value = String(f.fat);
  });

  on('btn-calorie-enable', () => {
    state.settings.calorieEnabled = true;
    saveState();
    renderPokrok();
  });
  on('btn-calorie-disable', () => {
    /* Skrytie nič nemaže – uložené vstupy aj odpoveď na otázku zostávajú. */
    state.settings.calorieEnabled = false;
    saveState();
    renderPokrok();
  });

  on('btn-update', applyUpdate);

  /* Prvý dotyk/klik pri zapnutom zvuku vytvorí a aktivuje zvukový kontext v rámci
     skutočného pokynu používateľa – iOS ho inak po pozastavení sám neobnoví a gong
     by sa prehral inou výstupnou cestou (alebo vôbec). */
  document.addEventListener('pointerdown', () => { resumeAudioIfNeeded(true); }, { passive: true });
}

/* ---------- Denný strážca (dátum, ISO týždeň, týždenný progres) ---------- */

/* Ak sa zmenil lokálny deň, prekreslí dátum a týždenné ukazovatele.
   Zámerne nevolá renderAll(): prekreslenie celej appky je zbytočné pri zmene dňa.
   Priebeh tréningu medzitým drží state.activeSession, takže sa nič nestratí. */
function refreshDayIfChanged() {
  const today = todayISO();
  if (today === lastRenderedDay) return false;
  lastRenderedDay = today;
  syncGoalSnapshot();    // nový deň (napr. pondelok) = nový bežiaci týždeň so svojím cieľom
  renderDnes();
  renderPokrok();
  if (activeTab === 'kalendar') renderKalendar();   // oranžový krúžok "dnes" sa posunie
  return true;
}

/* Vytvorí práve jeden interval. Opakované volanie nič nerobí,
   takže po prekreslení nevzniknú duplicitné časovače. */
function startDayWatcher() {
  if (dayWatchInterval !== null) return;
  lastRenderedDay = todayISO();
  dayWatchInterval = setInterval(refreshDayIfChanged, 60000);
  document.addEventListener('visibilitychange', refreshDayIfChanged);
}

/* ---------- Service worker: offline cache a aktualizácie ---------- */

let swRegistration = null;
let swUpdateReady = false;          // čaká nová verzia
let reloadingForUpdate = false;     // ochrana proti slučke reloadov
let pendingUpdateReload = false;    // nová verzia je aktívna, ale používateľ je zaneprázdnený
/* Pri prvej inštalácii stránku neriadi žiadny service worker; clients.claim()
   vtedy vyvolá controllerchange, ktorý nesmie spôsobiť reload. */
const hadServiceWorkerController = !!(navigator.serviceWorker && navigator.serviceWorker.controller);

/* Prebieha niečo, pri čom by reload mohol stratiť vstup používateľa? */
function isBusy() {
  if (editingPlan !== null) return true;                 // otvorený editor plánu s neuloženými zmenami
  if (getSession()) return true;                         // rozbehnutý aktívny tréning (meria sa jeho trvanie)
  if (totalSetsDone() > 0) return true;                  // rozbehnutý tréning s označenými sériami
  const forms = ['modal-confirm', 'modal-history-edit', 'modal-settings', 'modal-setup', 'modal-generic',
    'modal-planchoice', 'modal-fullbody', 'modal-lang', 'modal-measure', 'modal-food'];
  for (const id of forms) {
    const el = document.getElementById(id);
    if (el && !el.hidden) return true;                   // otvorený formulár / dialóg
  }
  return false;
}

function reloadForUpdate() {
  if (reloadingForUpdate) return;
  if (isBusy()) { pendingUpdateReload = true; return; }  // počkaj, kým používateľ dokončí
  reloadingForUpdate = true;
  location.reload();
}

/* Banner sa ukáže len vtedy, keď je aktualizácia pripravená a nič sa neupravuje. */
function refreshUpdateBanner() {
  const banner = document.getElementById('update-banner');
  if (!banner) return;
  const show = swUpdateReady && !isBusy();
  banner.hidden = !show;
  document.body.classList.toggle('has-update-banner', show);
  if (pendingUpdateReload && !isBusy()) {
    pendingUpdateReload = false;
    reloadForUpdate();
  }
  /* Záloha sa vyhodnocuje vždy, keď sa obrazovka ustálila – a nikdy počas
     tréningu ani otvoreného dialógu (pozri backupBlocked). */
  refreshBackupOffer();
}

function applyUpdate() {
  const waiting = swRegistration && swRegistration.waiting;
  if (!waiting) return;
  swUpdateReady = false;
  refreshUpdateBanner();
  waiting.postMessage({ type: 'SKIP_WAITING' });
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  // file:// nemá service workery – lokálne otvorenie súboru funguje ďalej bez zmeny
  if (location.protocol !== 'http:' && location.protocol !== 'https:') return;

  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then((reg) => {
    swRegistration = reg;
    // verzia mohla čakať už z minulej návštevy
    if (reg.waiting && navigator.serviceWorker.controller) {
      swUpdateReady = true;
      refreshUpdateBanner();
    }
    reg.addEventListener('updatefound', () => {
      const incoming = reg.installing;
      if (!incoming) return;
      incoming.addEventListener('statechange', () => {
        // 'installed' + existujúci kontrolór = čaká novšia verzia
        if (incoming.state === 'installed' && navigator.serviceWorker.controller) {
          swUpdateReady = true;
          refreshUpdateBanner();
        }
      });
    });
  }).catch((err) => {
    // Bez service workera aplikácia funguje ďalej, ale tichý neúspech by sa ťažko hľadal.
    console.warn('GymQuest: service worker sa nepodarilo zaregistrovať:', err);
  });

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadServiceWorkerController) return;   // prvá inštalácia – nič sa neobnovuje
    swUpdateReady = false;
    reloadForUpdate();
  });
}

/* ---------- Štart ---------- */

loadState();
if (!getPlan(selectedPlan)) selectedPlan = activePlanIds()[0] || null;
/* Obnovený rozbehnutý tréning: previažeme ho na jeho plán a dáme používateľovi vedieť. */
const restoredSession = getSession();
if (restoredSession && getPlan(restoredSession.planId)) {
  selectedPlan = restoredSession.planId;
}
setupEvents();
applyStaticI18n();
verifyI18n();
switchTab('dnes');
renderAll();
startDayWatcher();
startDurationTicker();
if (restoredSession) setSessionNote('trening.sessionRestored', 10000);
restoreRestTimer();          // obnoví bežiaci (alebo už dobehnutý) odpočet z absolútneho konca
refreshBackupOffer();        // a vyhodnotí, či od minule "dozrela" záloha
registerServiceWorker();
if (state.history.length === 0 && !localStorage.getItem(STORAGE_KEY + '_seeded')) {
  openSetup();
}
