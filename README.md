# GymQuest 🏋️

Osobná webová aplikácia na motiváciu k pravidelnému tréningu. Ukáže ti dnešný tréning, sleduje tvoje výkony a odmeňuje ťa za pravidelnosť.
A personal web app that motivates you to train regularly — it shows today's workout, tracks performance and rewards consistency.

## Ako aplikáciu spustiť / How to run

Žiadna inštalácia nie je potrebná. Stačí otvoriť súbor `index.html` v prehliadači (dvakrát klikni na súbor, prípadne ho presuň do okna prehliadača). Aplikácia funguje úplne offline.
No installation needed — open `index.html` in a browser (double-click or drag it into the window). The app works fully offline.

## Súbory / Files

| Súbor / File   | Obsah / Purpose                                             |
|----------------|-------------------------------------------------------------|
| `index.html`   | Štruktúra stránky – obrazovky, lišta, dialógy / Page structure – screens, tab bar, dialogs |
| `style.css`    | Tmavý dizajn, farby, veľké tlačidlá / Dark design, colors, big buttons |
| `script.js`    | Celá logika – stav, tréningy, súdržnosť, XP, úspechy / All logic – state, workouts, streak, XP, achievements |
| `README.md`    | Táto dokumentácia / This documentation                      |

## Obrazovky / Screens

- **Dnes / Today** – koľko tréningov si už absolvoval tento týždeň (cieľ nastavíš pri prvom spustení), aktuálna séria pravidelnosti, motivačný odkaz a veľké tlačidlo **Začať tréning / Start workout**.
- **Tréning / Workout** – hore vidíš názov zvoleného plánu a tlačidlo **✏️ Upraviť plán**, ktorým ho premenuješ. Predvolené sú **Push**, **Pull** a **Nohy**; môžeš ich premenovať, pridať ďalšie tlačidlom **Pridať tréning**, zmeniť ich poradie (‹ ›) alebo plán vymazať (🗑️). Pre každý cvik vidíš názov, počet sérií, opakovaní a váhu v kg. Série označuješ ako hotové a na konci klikneš na **Dokončiť tréning / Finish workout**.
- **Pokrok / Progress** – história dokončených tréningov (s dátumom, cvikmi, váhami, XP a poznámkou), osobné rekordy a počty tréningov za týždeň a mesiac. Každý tréning v histórii môžeš upraviť ✏️ alebo vymazať 🗑️.
- **Motivácia / Motivation** – XP body, úroveň s postupovým pruhom a úspechy (vrátane osobných 5 kg míľnikov pre každý cvik).

## Ako to funguje / How it works

- **Odporúčaný tréning** sa strieda v poradí, v akom máš plány zoradené (napr. Push → Pull → Nohy → Ďalší plán), podľa posledného dokončeného tréningu. Poradie si upravíš tlačidlami ‹ › v editore plánu a odporúčanie vidíš na obrazovke Dnes.
- **Týždenný cieľ** nastavíš pri prvom spustení (1–7 tréningov, predvolene 3). Kedykoľvek ho zmeníš v ⚙️ Nastavenia: vidíš aktuálnu hodnotu, klikneš na číslo 1–7 a potvrdíš tlačidlom **Uložiť cieľ / Save goal** – ukazovatele sa prepočítajú okamžite.
- **Súdržnosť (streak)** sa počíta v týždňoch: dosiahnutie týždenného cieľa predĺži sériu o jeden týždeň.
- **Škola / choroba** – označ vyťažený týždeň tlačidlom na obrazovke Dnes a séria sa nepreruší.
- **XP a úroveň** – každý tréning dáva **20 XP** + **2 XP** za každú dokončenú sériu. Na ďalšiu úroveň potrebuješ 100 XP.
- **Úspechy** sa odomykajú automaticky a ukladajú sa s dátumom odomknutia. Pri každom cviku sa odomykajú 5 kg míľniky pri novom osobnom rekorde (napr. prvých 50 kg, potom 55 kg, 60 kg…).
## Jazyk / Language

- Prepínač **SK | EN** v hlavičke okamžite preloží celé rozhranie a voľba sa uloží.
- **Zabudované plány a cviky** (Push/Pull/Nohy, Drepy, Zhyby, Bicepsové zdvihy atď.) sú obsahom aplikácie, a preto sa v angličtine zobrazujú po anglicky (Squats, Pull-ups, Bicep curls…).
- **Vlastné cviky**, ktoré si vytvoríš alebo premenuješ, sa nikdy neprekladajú – zobrazujú sa presne tak, ako si ich zadal.
- **Premenovaný plán** sa stáva vlastným názvom a tiež sa nikdy neprekladá. Ak premenuješ Nohy na „Nohy + Core“, zostane to tak aj v angličtine. Nedotknuté zabudované plány sa prekladajú ďalej.
- Zmazaný plán nemá vplyv na históriu: staršie tréningy si zachovajú názov plánu, ktorý platil v čase tréningu.
- História tréningov si zachováva názvy cvikov zaznamenané v čase tréningu.

- The **SK | EN** toggle in the header instantly translates the whole UI and the choice is saved.
- **Built-in plans and exercises** (Push/Pull/Legs, Drepy, Zhyby, Bicepsové zdvihy…) are app content, so they display in English in EN mode (Squats, Pull-ups, Bicep curls…).
- **Custom exercises** you create or rename are never translated — they show exactly as you typed them.
- A **renamed plan** becomes a custom name and is never translated either. If you rename Nohy to “Nohy + Core”, it stays that way in English too. Untouched built-in plans keep translating.
- A deleted plan does not affect history: older workouts keep the plan name that was valid when they were logged.
- Workout history keeps the exercise names recorded at the time of each workout.
- **Oddychový timer** – v tréningu si môžeš spustiť oddych 60, 90 alebo 120 sekúnd.
- **Porovnanie** – pri každom cviku vidíš, či si zdvihol viac/menej ako minule.

## História: undo, úprava, vymazanie / History: undo, edit, delete

- Po dokončení tréningu môžeš v dialógu stlačiť **Vrátiť tento tréning späť / Undo this workout** – tréning aj jeho XP sa odoberú.
- V **Pokrok / Progress** má každý tréning tlačidlá ✏️ (úprava dátumu, poznámky, sérií a váh) a 🗑️ (vymazanie). Po každej zmene sa prepočítajú počty, streak, XP, úroveň, rekordy aj úspechy.
- **Resetovať tréning** na obrazovke Tréning vymaže len aktuálne označené série – história zostane zachovaná.

## Export / Import / Reset

- **Exportovať dáta / Export data** (⚙️ Nastavenia) stiahne celé tvoje dáta ako JSON súbor.
- **Importovať dáta / Import data** obnoví dáta z JSON zálohy (s overením a potvrdením).
- **Resetovať dáta / Reset data** vymaže všetko po dvojitom potvrdení.

## Ukladanie dát / Data storage

Všetky dáta sa ukladajú do `localStorage` prehliadača pod kľúčom `gymquest`. Dáta zostanú uložené aj po obnovení stránky a po zatvorení prehliadača.
All data is stored in browser `localStorage` under the key `gymquest` and survives refresh and browser restarts.

Pri prvom spustení sa po potvrdení týždenného cieľa **neukladajú žiadne ukážkové dáta** – začneš s čistou históriou (0 tréningov, 0 XP, žiadne úspechy). Ukážkové dáta si môžeš kedykoľvek načítať v ⚙️ Nastavenia tlačidlom **Načítať ukážkové dáta** a odstrániť tlačidlom **Odstrániť ukážkové dáta**.
On first launch, after confirming your weekly goal, **no demo data is created** — you start with a clean history (0 workouts, 0 XP, no achievements). You can load demo data anytime via ⚙️ Settings with **Load demo data**, and remove it with **Remove demo data**.

### Vymazanie dát / Clearing data

Dáta vymažeš v prehliadači: **Vývojárske nástroje (F12) → Application → Local Storage → gymquest → vymaž hodnotu**, alebo tlačidlom **Resetovať dáta** v nastaveniach.
Clear data in the browser via **DevTools (F12) → Application → Local Storage → gymquest**, or use **Reset data** in settings.

## Technológie / Technology

Iba čisté **HTML**, **CSS** a **vanilla JavaScript**. Žiadne frameworky, žiadna databáza, žiadny backend, žiadne externé služby ani knižnice.
Only pure **HTML**, **CSS** and **vanilla JavaScript**. No frameworks, no database, no backend, no external services or libraries.
