/* ===== GymQuest v2 — aplikácia ===== */
'use strict';

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
// akékoľvek názvy, ktoré patria zabudovanému plánu (SK aj EN) – rozlíši premenovanie od pôvodného názvu
const BUILTIN_PLAN_LABELS = { push: ['Push'], pull: ['Pull'], legs: ['Nohy', 'Legs'] };

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
    'kalendar.ariaWorkoutCount': '{n} tréningy v tento deň',
    'plan.push': 'Push', 'plan.pull': 'Pull', 'plan.legs': 'Nohy',
    'plan.newName': 'Nový plán',
    'exercise.bench-press': 'Bench press', 'exercise.overhead-press': 'Tlaky nad hlavou', 'exercise.dips': 'Dipy', 'exercise.lateral-raises': 'Upažovanie',
    'exercise.pull-ups': 'Zhyby', 'exercise.bent-over-rows': 'Príťahy v predklone', 'exercise.cable-rows': 'Veslovanie na kladke', 'exercise.bicep-curls': 'Bicepsové zdvihy',
    'exercise.squats': 'Drepy', 'exercise.leg-press': 'Leg press', 'exercise.lunges': 'Výpady', 'exercise.leg-curls': 'Zakopávanie', 'exercise.calf-raises': 'Lýtka',
    'header.level': 'Úr.',
    'header.settingsTitle': 'Nastavenia',
    'header.levelTitle': 'Úroveň',
    'header.langTitle': 'Jazyk / Language',
    'dnes.weekTitle': 'Tréningy tento týždeň',
    'dnes.weekDone': '{n} z {g}',
    'dnes.weekDoneShort': '{n} z {g}',
    'dnes.weekGoalMet': 'Cieľ na tento týždeň splnený!',
    'dnes.weekRemaining': 'Ešte {n} do splnenia cieľa.',
    'dnes.weekRemaining1': 'Ešte {n} tréning do splnenia cieľa.',
    'dnes.weekRemainingFew': 'Ešte {n} tréningy do splnenia cieľa.',
    'dnes.weekRemainingMany': 'Ešte {n} tréningov do splnenia cieľa.',
    'dnes.streakTitle': '🔥 Súdržnosť',
    'dnes.streakNone': 'Žiadna séria',
    'dnes.streakWeek1': '🔥 {n} týždeň v rade',
    'dnes.streakWeekFew': '🔥 {n} týždne v rade',
    'dnes.streakWeekMany': '🔥 {n} týždňov v rade',
    'dnes.streakStart': 'Absolvuj aspoň {g} tréningy tento týždeň a začni sériu.',
    'dnes.streakStart1': 'Absolvuj aspoň {g} tréning tento týždeň a začni sériu.',
    'dnes.streakStartFew': 'Absolvuj aspoň {g} tréningy tento týždeň a začni sériu.',
    'dnes.streakStartMany': 'Absolvuj aspoň {g} tréningov tento týždeň a začni sériu.',
    'dnes.streakContinue': 'Dokonči tento týždeň {g} tréningy, aby si pokračoval v sérii.',
    'dnes.streakContinue1': 'Dokonči tento týždeň {g} tréning, aby si pokračoval v sérii.',
    'dnes.streakContinueFew': 'Dokonči tento týždeň {g} tréningy, aby si pokračoval v sérii.',
    'dnes.streakContinueMany': 'Dokonči tento týždeň {g} tréningov, aby si pokračoval v sérii.',
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
    'trening.movePlanLeft': 'Posunúť doľava',
    'trening.movePlanRight': 'Posunúť doprava',
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
    'trening.timerDone': 'Oddych skončil!',
    'trening.timerStop': 'Zastaviť časovač',
    'trening.timerStart': 'Začať oddych',
    'trening.timerSection': 'Časovač oddychu',
    'failure.plannedLabel': 'Série do zlyhania',
    'failure.none': 'Žiadna',
    'failure.failure': 'Zlyhanie',
    'failure.planned': 'Plánované zlyhanie',
    'failure.noSets': 'Žiadne série do zlyhania',
    'failure.sets': 'Série do zlyhania: {sets}',
    'failure.markSet': 'Označiť sériu ako zlyhanie',
    'failure.removeMarker': 'Odstrániť označenie zlyhania',
    'pokrok.thisWeek': 'Tento týždeň', 'pokrok.thisMonth': 'Tento mesiac', 'pokrok.total': 'Celkom',
    'pokrok.recordsTitle': '🏆 Osobné rekordy',
    'pokrok.recordsEmpty': 'Zatiaľ žiadne rekordy.',
    'pokrok.nextMilestone': 'Ďalší míľnik: {kg} kg',
    'pokrok.historyTitle': '📋 História tréningov',
    'pokrok.historyEmpty': 'Zatiaľ žiadne tréningy.',
    'pokrok.workoutName': '{plan}',
    'pokrok.workoutFallback': 'Tréning',
    'pokrok.setsCount1': '{n} séria', 'pokrok.setsCountFew': '{n} série', 'pokrok.setsCountMany': '{n} sérií',
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
    'settings.importConfirm': 'Nahradí všetky aktuálne dáta ({n} tréningov).',
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
    'app.storageError': 'Tento prehliadač odmietol uložiť dáta – zmeny sa po obnovení stránky stratia. Povol v prehliadači ukladanie dát (localStorage) a skús to znova.',
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
    'kalendar.ariaWorkoutCount': '{n} workouts on this day',
    'plan.push': 'Push', 'plan.pull': 'Pull', 'plan.legs': 'Legs',
    'plan.newName': 'New workout plan',
    'exercise.bench-press': 'Bench press', 'exercise.overhead-press': 'Overhead press', 'exercise.dips': 'Dips', 'exercise.lateral-raises': 'Lateral raises',
    'exercise.pull-ups': 'Pull-ups', 'exercise.bent-over-rows': 'Bent-over rows', 'exercise.cable-rows': 'Cable rows', 'exercise.bicep-curls': 'Bicep curls',
    'exercise.squats': 'Squats', 'exercise.leg-press': 'Leg press', 'exercise.lunges': 'Lunges', 'exercise.leg-curls': 'Leg curls', 'exercise.calf-raises': 'Calf raises',
    'header.level': 'Lv.',
    'header.settingsTitle': 'Settings',
    'header.levelTitle': 'Level',
    'header.langTitle': 'Language',
    'dnes.weekTitle': 'Workouts this week',
    'dnes.weekDone': '{n} of {g}',
    'dnes.weekDoneShort': '{n} of {g}',
    'dnes.weekGoalMet': 'Weekly goal reached!',
    'dnes.weekRemaining': 'Still {n} to go.',
    'dnes.weekRemaining1': 'Still {n} workout to go.',
    'dnes.weekRemainingFew': 'Still {n} workouts to go.',
    'dnes.weekRemainingMany': 'Still {n} workouts to go.',
    'dnes.streakTitle': '🔥 Consistency',
    'dnes.streakNone': 'No streak',
    'dnes.streakWeek1': '🔥 {n} week in a row',
    'dnes.streakWeekFew': '🔥 {n} weeks in a row',
    'dnes.streakWeekMany': '🔥 {n} weeks in a row',
    'dnes.streakStart': 'Complete at least {g} workouts this week to start a streak.',
    'dnes.streakStart1': 'Complete at least {g} workout this week to start a streak.',
    'dnes.streakStartFew': 'Complete at least {g} workouts this week to start a streak.',
    'dnes.streakStartMany': 'Complete at least {g} workouts this week to start a streak.',
    'dnes.streakContinue': 'Complete {g} workouts this week to continue your streak.',
    'dnes.streakContinue1': 'Complete {g} workout this week to continue your streak.',
    'dnes.streakContinueFew': 'Complete {g} workouts this week to continue your streak.',
    'dnes.streakContinueMany': 'Complete {g} workouts this week to continue your streak.',
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
    'trening.movePlanLeft': 'Move left',
    'trening.movePlanRight': 'Move right',
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
    'trening.timerDone': 'Rest over!',
    'trening.timerStop': 'Stop timer',
    'trening.timerStart': 'Start rest',
    'trening.timerSection': 'Rest timer',
    'failure.plannedLabel': 'Sets to failure',
    'failure.none': 'None',
    'failure.failure': 'Failure',
    'failure.planned': 'Planned failure',
    'failure.noSets': 'No failure sets',
    'failure.sets': 'Failure sets: {sets}',
    'failure.markSet': 'Mark set as failure',
    'failure.removeMarker': 'Remove failure marker',
    'pokrok.thisWeek': 'This week', 'pokrok.thisMonth': 'This month', 'pokrok.total': 'Total',
    'pokrok.recordsTitle': '🏆 Personal records',
    'pokrok.recordsEmpty': 'No records yet.',
    'pokrok.nextMilestone': 'Next milestone: {kg} kg',
    'pokrok.historyTitle': '📋 Workout history',
    'pokrok.historyEmpty': 'No workouts yet.',
    'pokrok.workoutName': '{plan}',
    'pokrok.workoutFallback': 'Workout',
    'pokrok.setsCount1': '{n} set', 'pokrok.setsCountFew': '{n} sets', 'pokrok.setsCountMany': '{n} sets',
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
    'app.storageError': 'This browser refused to save your data — changes will be lost after a refresh. Allow site data (localStorage) in your browser and try again.',
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
  },
};

function t(key, vars) {
  let s = (I18N[state.settings.lang] && I18N[state.settings.lang][key]) || I18N.sk[key] || key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.split('{' + k + '}').join(String(v));
    }
  }
  return s;
}

function plural(n, one, few, other) {
  if (state.settings.lang === 'sk') {
    if (n === 1) return one;
    if (n >= 2 && n <= 4) return few;
    return other;
  }
  return n === 1 ? one : other;
}

function tPlural(base, n) {
  const suffix = n === 1 ? '1' : (state.settings.lang === 'sk' && n >= 2 && n <= 4 ? 'Few' : 'Many');
  return t(base + suffix, { n });
}

/* Názvy dní a mesiacov pre dátum v hlavičke obrazovky Dnes.
   Zámerne vlastné polia namiesto Intl.DateTimeFormat – výstup je tak rovnaký
   vo všetkých prehliadačoch, funguje offline a zodpovedá presnému formátu aplikácie. */
const WEEKDAYS = {
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  sk: ['Nedeľa', 'Pondelok', 'Utorok', 'Streda', 'Štvrtok', 'Piatok', 'Sobota'],
};
const MONTHS_EN_LONG = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_SK_GEN = ['januára', 'februára', 'marca', 'apríla', 'mája', 'júna',
  'júla', 'augusta', 'septembra', 'októbra', 'novembra', 'decembra'];
/* Nominatív pre názov mesiaca v kalendári ("September 2026"). */
const MONTHS_SK_NOM = ['Január', 'Február', 'Marec', 'Apríl', 'Máj', 'Jún',
  'Júl', 'August', 'September', 'Október', 'November', 'December'];
/* Krátke dni v týždni pre hlavičku kalendára – pondelok prvý. */
const WEEKDAYS_SHORT = {
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  sk: ['Po', 'Ut', 'St', 'Št', 'Pi', 'So', 'Ne'],
};

/* Pondelok = 0 … nedeľa = 6. Rovnaká konvencia, akú používa weekKey(). */
function mondayIndex(d) {
  return (d.getDay() + 6) % 7;
}

function activeLang() {
  return WEEKDAYS[state.settings.lang] ? state.settings.lang : 'en';
}

function formatDate(iso) {
  const d = parseDate(iso);
  if (state.settings.lang === 'en') {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }
  return `${d.getDate()}. ${MONTHS_SK_GEN[d.getMonth()]} ${d.getFullYear()}`;
}

/* Číslo aktuálneho ISO týždňa – odvodené z toho istého pomocníka, aký používa
   týždenný cieľ, progres aj séria (weekKey/currentWeekKey). */
function currentIsoWeekNumber() {
  return Number(currentWeekKey().split('-W')[1]);
}

/* Plný dátum podľa aktuálneho jazyka: "Friday, September 18, 2026" / "Piatok, 18. septembra 2026".
   Zdieľa ho hlavička Dnes aj detail dňa v kalendári. */
function formatFullDate(d) {
  const lang = activeLang();
  const weekday = WEEKDAYS[lang][d.getDay()];
  if (lang === 'en') {
    return `${weekday}, ${MONTHS_EN_LONG[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }
  return `${weekday}, ${d.getDate()}. ${MONTHS_SK_GEN[d.getMonth()]} ${d.getFullYear()}`;
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

/* ---------- Stav aplikácie ---------- */

let state = null;
let activeTab = 'dnes';
let selectedPlan = 'push';
let currentSets = {};        // "exerciseName:setIndex" -> true
let currentFailureSets = {}; // "exerciseName:setIndex" -> true (reached failure during this workout)
let lastXP = 0;
let lastUnlocked = [];
let lastAchXP = 0;           // XP získané z úspechov po poslednom tréningu
let lastWorkoutId = null;    // id posledného dokončeného tréningu (pre Undo)
let editingPlan = null;      // id plánu v editačnom móde
let newPlanId = null;        // id práve vytvoreného plánu (zrušenie ho zahodí); neukladá sa
let editDraft = null;        // kópia cvikov počas editácie
let pendingImport = null;    // naimportované dáta čakajúce na potvrdenie
let pendingDeleteWorkout = null; // id tréningu čakajúceho na vymazanie
let timerInterval = null;
let timerEnd = 0;
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

function defaultState() {
  return {
    version: 3,
    plans: JSON.parse(JSON.stringify(DEFAULT_PLANS)),
    planOrder: DEFAULT_PLAN_ORDER.slice(),
    history: [],
    excusedWeeks: [],
    goalHistory: {},     // ISO týždeň -> cieľ platný v tom týždni (snapshot pre vyhodnotenie série)
    legacyGoal: null,    // cieľ spred zavedenia snapshotov; null = nový používateľ bez histórie
    settings: { weeklyGoal: 3, lang: 'en' },
    achievements: {},
    demo: false,
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
  };
  const goal = Math.round(Number(out.settings.weeklyGoal));
  out.settings.weeklyGoal = Math.min(GOAL_MAX, Math.max(GOAL_MIN, Number.isFinite(goal) && goal ? goal : 3));
  if (out.settings.lang !== 'sk' && out.settings.lang !== 'en') out.settings.lang = 'sk';
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

/* Najnovší výskyt cviku v histórii pred daným dátumom (podľa id, fallback podľa názvu) */
function previousWorkoutFor(ex, beforeDate) {
  const sorted = [...state.history]
    .filter(w => w.date < beforeDate)
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

const MOTIVATION_SK = [
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
];

const MOTIVATION_EN = [
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
];

const MOTIVATION_LONG_STREAK_SK = [
  '🔥 Si vo veľkej forme! Takto sa to robí!',
  '🔥 Nezastaviteľný! Pokračuj v tom!',
  '🔥 Séria, na ktorú môžeš byť hrdý!',
];

const MOTIVATION_LONG_STREAK_EN = [
  '🔥 You are on fire! Keep it up!',
  '🔥 Unstoppable! Keep going!',
  '🔥 A streak to be proud of!',
];

const ENCOURAGEMENT_SK = [
  'Skvelá práca! Zaslúžiš si oddych.',
  'Výborne! Každý tréning sa počíta.',
  'Paráda, zvládol si to!',
  'Takto sa buduje forma!',
];

const ENCOURAGEMENT_EN = [
  'Great job! You earned the rest.',
  'Well done! Every workout counts.',
  'Nice, you nailed it!',
  'That is how you build fitness!',
];

const SET_MESSAGES_SK = [
  'Séria hotová, pokračuj!',
  'Ešte jedna séria, dáš to!',
  'Skoro tam! Tlač ďalej!',
  'Pekne! Telo pracuje, ty len tlačíš.',
  'Sila rastie s každou sériou.',
  'Nepoľavuj, ešte chvíľu!',
  'Výborne, drž tempo!',
];

const SET_MESSAGES_EN = [
  'Set done, keep going!',
  'One more set, you got this!',
  'Almost there! Push on!',
  'Nice! Your body is working.',
  'Strength grows with every set.',
  'Do not let up, a little more!',
  'Great, keep the pace!',
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function motivationText() {
  const streak = computeStreak();
  const longSk = MOTIVATION_LONG_STREAK_SK;
  const longEn = MOTIVATION_LONG_STREAK_EN;
  const baseSk = MOTIVATION_SK;
  const baseEn = MOTIVATION_EN;
  if (streak >= 4) {
    const arr = state.settings.lang === 'en' ? longEn : longSk;
    return arr[dayOfYear(new Date()) % arr.length];
  }
  const arr = state.settings.lang === 'en' ? baseEn : baseSk;
  return arr[dayOfYear(new Date()) % arr.length];
}

function randomEncouragement() {
  return pick(state.settings.lang === 'en' ? ENCOURAGEMENT_EN : ENCOURAGEMENT_SK);
}

function randomSetMessage() {
  return pick(state.settings.lang === 'en' ? SET_MESSAGES_EN : SET_MESSAGES_SK);
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

function planExerciseCount(plan) {
  return plan.exercises.reduce((s, ex) => s + ex.sets, 0);
}

function totalSetsDone() {
  return Object.values(currentSets).filter(Boolean).length;
}

function comparisonHint(ex) {
  if (ex.weight <= 0) return '';
  const prev = previousWorkoutFor(ex, todayISO());
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

function renderTrening() {
  if (!getPlan(selectedPlan)) selectedPlan = activePlanIds()[0] || null;

  const chips = document.getElementById('plan-chips');
  chips.innerHTML = '';
  const rec = recommendedPlan();
  for (const id of activePlanIds()) {
    const p = getPlan(id);
    const wrap = document.createElement('div');
    wrap.className = 'chip-wrap';
    const btn = document.createElement('button');
    btn.className = 'chip' + (id === selectedPlan ? ' active' : '') + (id === rec ? ' recommended' : '');
    btn.textContent = planDisplayName(p);
    btn.addEventListener('click', () => {
      // výber iného plánu vždy zatvorí editor, aby meno v poli nepatrilo inému plánu
      if (editingPlan !== null && editingPlan !== id && closeEditor()) saveState();
      selectedPlan = id;
      renderTrening();
    });
    wrap.appendChild(btn);
    const editBtn = document.createElement('button');
    editBtn.className = 'btn-icon chip-edit';
    editBtn.textContent = '✏️';
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
  currentSets = {};
  currentFailureSets = {};
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

    const hint = document.createElement('div');
    hint.className = 'compare-hint';
    hint.innerHTML = comparisonHint(ex);

    const sets = document.createElement('div');
    sets.className = 'sets';

    const plannedFailure = cleanFailureSets(ex.plannedFailureSets, ex.sets);

    for (let i = 0; i < ex.sets; i++) {
      const key = `${ex.name}:${i}`;
      const item = document.createElement('div');
      item.className = 'set-item';

      const setBtn = document.createElement('button');
      setBtn.type = 'button';
      setBtn.className = 'set-btn';
      setBtn.textContent = `${i + 1} ✓`;
      setBtn.addEventListener('click', () => {
        currentSets[key] = !currentSets[key];
        setBtn.classList.toggle('done', currentSets[key]);
        updateSummary();
      });

      /* Samostatný ovládač pre každú sériu. Naplánovaná séria je len nenápadný náznak
         (prerušovaný oranžový okraj) – nikdy sa automaticky nepočíta ako dosiahnuté zlyhanie. */
      const wasPlanned = plannedFailure.includes(i + 1);
      const failBtn = document.createElement('button');
      failBtn.type = 'button';
      failBtn.className = 'set-fail' + (wasPlanned ? ' planned' : '');
      failBtn.textContent = '🔥';
      const syncFail = () => {
        const on = !!currentFailureSets[key];
        failBtn.classList.toggle('active', on);
        failBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
        failBtn.setAttribute('aria-label', on ? t('failure.removeMarker') : t('failure.markSet'));
        failBtn.title = on ? t('failure.failure') : (wasPlanned ? t('failure.planned') : t('failure.markSet'));
      };
      syncFail();
      failBtn.addEventListener('click', () => {
        currentFailureSets[key] = !currentFailureSets[key];
        syncFail();
      });

      item.append(setBtn, failBtn);
      sets.appendChild(item);
    }

    div.append(head, hint, sets);
    list.appendChild(div);
  }

  const summary = document.getElementById('summary-bar');
  summary.innerHTML = t('trening.setsDone', { done: 0, total: planExerciseCount(plan), msg: t('trening.setsHint') });
  document.getElementById('btn-finish-workout').disabled = true;
  refreshUpdateBanner();   // otvorenie/zatvorenie editora plánu mení stav "zaneprázdnený"
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
    row.innerHTML = `
      <input type="text" class="edit-name" value="${escAttr(exerciseDisplayName(ex))}" placeholder="${t('trening.exercisePlaceholder')}">
      <input type="number" class="edit-num" min="1" max="99" value="${ex.sets}">
      <input type="number" class="edit-num" min="1" max="99" value="${ex.reps}">
      <input type="number" class="edit-num" min="0" max="999" value="${ex.weight}">
      <button class="btn-icon btn-icon-danger" title="${t('trening.deleteExerciseTitle')}">🗑️</button>`;

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

    const inputs = row.querySelectorAll('input');
    inputs[0].addEventListener('input', () => {
      // typing converts a built-in row into a custom exercise (keeps typed text as-is)
      if (ex.id && BUILTIN_EXERCISE_IDS.has(ex.id)) {
        delete ex.id;
        ex.builtin = false;
      }
      editDraft[idx].name = inputs[0].value;
      row.classList.remove('invalid');
    });
    inputs[1].addEventListener('input', () => {
      editDraft[idx].sets = num(inputs[1].value);
      // zmena počtu sérií hneď prispôsobí chipy a oreže už neplatné voľby
      renderPlanFailureChips(failureBox, idx);
    });
    inputs[2].addEventListener('input', () => { editDraft[idx].reps = num(inputs[2].value); });
    inputs[3].addEventListener('input', () => { editDraft[idx].weight = num(inputs[3].value); });
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
    return out;
  });
  newPlanId = null;
  editingPlan = null;
  editDraft = null;
  currentSets = {};
  currentFailureSets = {};
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

function renderPokrok() {
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
      const setsDone = w.exercises.reduce((s, ex) => s + ex.sets, 0);
      const row = document.createElement('div');
      row.className = 'history-row';
      const detail = w.exercises.map(e => {
        const line = `${esc(e.name)} ${e.sets}×${e.reps} · ${e.weight} ${t('units.kg')}`;
        const fSets = cleanFailureSets(e.actualFailureSets, e.sets);
        /* Zlyhanie sa zobrazuje len vtedy, keď bolo naozaj zaznamenané – nikdy z plánu. */
        return fSets.length
          ? line + `<div class="failure-note">🔥 ${esc(t('failure.sets', { sets: fSets.join(', ') }))}</div>`
          : line;
      }).join('<br>');
      row.innerHTML = `
        <div class="history-main">
          <div class="history-name">${esc(historyPlanName(w))}</div>
          <div class="history-detail">${formatDate(w.date)} · ${tPlural('pokrok.setsCount', setsDone)}</div>
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

function monthTitle() {
  const names = activeLang() === 'sk' ? MONTHS_SK_NOM : MONTHS_EN_LONG;
  return `${names[viewMonth]} ${viewYear}`;
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
  for (const label of WEEKDAYS_SHORT[lang]) {
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
    if (workouts.length > 1) aria += ' · ' + t('kalendar.ariaWorkoutCount', { n: workouts.length });
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
}

function workoutBlock(w) {
  const div = document.createElement('div');
  div.className = 'day-workout';
  const rows = w.exercises.map(ex => {
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
  const prevRecommended = recommendedPlan();
  const beforeUnlocked = Object.keys(state.achievements);
  const beforeAchXP = achievementXP();

  const exercises = plan.exercises.map(ex => ({
    name: ex.name,
    exId: (ex.id && BUILTIN_EXERCISE_IDS.has(ex.id)) ? ex.id : undefined,
    sets: ex.sets,
    reps: ex.reps,
    weight: ex.weight,
    plannedFailureSets: cleanFailureSets(ex.plannedFailureSets, ex.sets),
    actualFailureSets: [],
  }));

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
    exercises: exercises.map(e => Object.assign({}, e, { setsDone: 0 })),
  };
  // setsDone = počet dokončených sérií podľa aktuálneho session
  const setsByKey = {};
  for (const [key, done] of Object.entries(currentSets)) {
    if (done) {
      const idx = key.lastIndexOf(':');
      const name = key.slice(0, idx);
      setsByKey[name] = (setsByKey[name] || 0) + 1;
    }
  }
  // actualFailureSets = len to, čo používateľ naozaj označil počas tréningu (nikdy nie plán)
  const failureByKey = {};
  for (const [key, on] of Object.entries(currentFailureSets)) {
    if (!on) continue;
    const idx = key.lastIndexOf(':');
    const name = key.slice(0, idx);
    const setNumber = parseInt(key.slice(idx + 1), 10) + 1;
    if (!failureByKey[name]) failureByKey[name] = [];
    failureByKey[name].push(setNumber);
  }
  entry.exercises.forEach(e => {
    e.setsDone = setsByKey[e.name] || 0;
    e.actualFailureSets = cleanFailureSets(failureByKey[e.name] || [], e.sets);
  });

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
  currentSets = {};
  currentFailureSets = {};
  stopTimer();

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

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
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
      showGeneric(t('settings.importTitle'), t('common.cancel'), () => {
        try {
          // staršie zálohy (v1/v2) prejdú rovnakou migráciou ako uložené dáta
          if (data.settings && !data.settings.lang) data.settings.lang = state.settings.lang;
          const incoming = data.version === 1 ? migrateV1toV2(data) : data;
          state = migrateV2toV3(incoming);
          reconcileAchievements();
          saveState();
          document.getElementById('modal-settings').hidden = true;
          renderAll();
        } catch (err) {
          showGeneric(t('settings.importError'), t('common.ok'), null);
        }
      }, t('settings.importConfirm', { n: data.history.length }));
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

/* ---------- Timer ---------- */

function startTimer(seconds) {
  stopTimer();
  timerEnd = Date.now() + seconds * 1000;
  const bar = document.getElementById('timer-bar');
  bar.classList.remove('done');
  bar.hidden = false;
  document.getElementById('timer-label').textContent = t('trening.timerLabel');
  updateTimerDisplay();
  timerInterval = setInterval(() => {
    const left = timerEnd - Date.now();
    if (left <= 0) {
      stopTimer();
      document.getElementById('timer-label').textContent = t('trening.timerDone');
      bar.classList.add('done');
      bar.hidden = false;
      document.getElementById('timer-time').textContent = '00:00';
      return;
    }
    updateTimerDisplay();
  }, 250);
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
  document.getElementById('timer-bar').hidden = true;
}

/* ---------- Jazyk ---------- */

function applyStaticI18n() {
  document.documentElement.lang = state.settings.lang;
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
  const langBtn = document.getElementById('btn-lang');
  langBtn.innerHTML = `<span class="${state.settings.lang === 'sk' ? 'active-lang' : ''}">SK</span>|<span class="${state.settings.lang === 'en' ? 'active-lang' : ''}">EN</span>`;
}

function toggleLang() {
  state.settings.lang = state.settings.lang === 'sk' ? 'en' : 'sk';
  saveState();
  applyStaticI18n();
  renderAll();
}

/* ---------- Kontrola prekladov ---------- */

function verifyI18n() {
  const missing = Object.keys(I18N.sk).filter(k => I18N.en[k] === undefined);
  if (missing.length) {
    console.warn('GymQuest: chýbajúce EN preklady:', missing);
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

  on('btn-lang', toggleLang);
  on('btn-settings', openSettings);

  on('btn-start-workout', () => {
    const rec = recommendedPlan();
    if (rec) selectedPlan = rec;
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
  on('btn-result-close', () => { document.getElementById('modal-result').hidden = true; });
  on('btn-result-undo', requestUndoWorkout);

  on('btn-add-exercise', () => {
    if (editingPlan === null) return;
    editDraft.push({ name: '', sets: 3, reps: 10, weight: 0, plannedFailureSets: [] });
    renderEditPanel();
  });
  on('btn-edit-save', saveEditPlan);
  on('btn-edit-cancel', cancelEditPlan);

  on('btn-add-plan', addPlan);
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
      currentSets = {};
      currentFailureSets = {};
      stopTimer();
      renderTrening();
    }, t('trening.resetSessionConfirm'));
  });

  document.querySelectorAll('.timer-chip').forEach(chip => {
    chip.addEventListener('click', () => startTimer(parseInt(chip.dataset.seconds, 10)));
  });
  on('timer-stop', stopTimer);

  on('btn-setup-ok', confirmSetup);
  // viditeľné Uložiť aj pôvodné Zavrieť – obe uložia, aby sa zmena nikdy nestratila
  on('btn-settings-save', () => {
    if (saveSettingsGoal()) document.getElementById('modal-settings').hidden = true;
  });
  on('btn-settings-close', () => {
    saveSettingsGoal();
    document.getElementById('modal-settings').hidden = true;
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
    const modal = document.getElementById('modal-day');
    if (e.key === 'Escape' && modal && !modal.hidden) closeDay();
  });

  on('btn-update', applyUpdate);
}

/* ---------- Denný strážca (dátum, ISO týždeň, týždenný progres) ---------- */

/* Ak sa zmenil lokálny deň, prekreslí dátum a týždenné ukazovatele.
   Zámerne nevolá renderAll(): renderTrening() maže currentSets, takže by to
   počas tréningu zmazalo označené série. Nič sa neukladá ani nemaže. */
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
  if (totalSetsDone() > 0) return true;                  // rozbehnutý tréning s označenými sériami
  const forms = ['modal-confirm', 'modal-history-edit', 'modal-settings', 'modal-setup', 'modal-generic'];
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
setupEvents();
applyStaticI18n();
verifyI18n();
switchTab('dnes');
renderAll();
startDayWatcher();
registerServiceWorker();
if (state.history.length === 0 && !localStorage.getItem(STORAGE_KEY + '_seeded')) {
  openSetup();
}
