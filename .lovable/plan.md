# Nieuwe Mini-Games voor Noxhaven

## Overzicht

Er worden **5 nieuwe interactieve mini-games** toegevoegd die thematisch passen bij het maffia-genre en aansluiten op bestaande systemen. Elke mini-game heeft eigen mechanics, risico/beloning, en raakt aan bestaande progressie (geld, rep, heat, karma).

## Nieuwe Mini-Games

### 1. Russian Roulette (Casino)

Een spanning-gebaseerde mini-game in The Velvet Room. De speler speelt tegen een NPC om steeds hogere inzetten. Elke ronde draait de cilinder (1/6 kans op "verlies"). Cash out wanneer je wilt, of ga door voor hogere multipliers.

- **Locatie**: Casino (5e spel naast Blackjack, Roulette, Slots, High-Low)
- **Mechaniek**: 6-kamer cilinder, elke ronde 1 kamer gevuld. Multiplier stijgt per overleefde ronde (1.5x, 2.5x, 4x, 7x, 12x). Cash out op elk moment
- **Risico**: Verlies = gehele inzet kwijt + crew damage
- **Balans**: Huis-edge via stijgende "kamers gevuld" per ronde (1/6, 1/5, 1/4...)

### 2. Lockpick (Solo Operatie)

Een timing-gebaseerde mini-game die verschijnt bij inbraken en kluis-missies. De speler moet op het juiste moment "klikken" om pinnen te zetten in een slot.

- **Locatie**: Verschijnt als optionele skill-check bij solo operaties en heist-complicaties
- **Mechaniek**: 3-5 pinnen die elk een "sweet spot" hebben. Een marker beweegt heen en weer; tik in de groene zone om de pin te zetten. Mis = pin reset
- **Beloning**: Succesvol lockpicken geeft bonus loot (+20-50% beloning) of verlaagt heist-moeilijkheid
- **Stat-link**: Brains-stat vergroot de groene zone

### 3. Dobbelspel / Craps (Straat)

Een snel dobbelspel dat verschijnt als willekeurige straatontmoeting of in de gevangenis.

- **Locatie**: Willekeurige straatontmoetingen + gevangenis-activiteit
- **Mechaniek**: Gooi 2 dobbelstenen. 7 of 11 op eerste worp = win. 2, 3, of 12 = verlies. Anders wordt dat getal je "punt" en moet je het nogmaals gooien voor je een 7 gooit
- **In gevangenis**: Speel met sigaretten (valuta) om je straf te verkorten of connecties te maken
- **Balans**: Standaard craps-kansen (huis-edge ~1.4%)

### 4. Hacking Mini-Game (Tech Operaties)

Een puzzel-gebaseerde mini-game voor tech-gerelateerde missies. Kruis draden aan in een grid om een circuit te voltooien.

- **Locatie**: Tech-contracten, heist-complicaties, villa server-room events
- **Mechaniek**: 4x4 grid met nodes. Roteer tegels om een pad te maken van start naar finish binnen een tijdslimiet (15-30 sec). Moeilijkheid schaalt met level
- **Beloning**: Succes = bonus data (verkopen voor geld), heat-reductie, of extra intel
- **Stat-link**: Brains-stat en Hacker-crewlid geven extra tijd

### 5. Arm Wrestle (Bar / Gevecht)

Een snelle reactie-game tegen NPC's in bars of als intimidatie-optie.

- **Locatie**: Straatontmoetingen, gevangenis, factie-onderhandelingen
- **Mechaniek**: Twee balken botsen. Tap snel en ritmisch om je balk naar rechts te duwen. NPC-sterkte is gebaseerd op Muscle-stat verschil
- **Beloning**: Win = respect (+rep), verlies = reputatie-verlies. In gevangenis: bescherming of allianties
- **Stat-link**: Muscle-stat geeft een voorsprong

---

## Technische Details

### Nieuwe Bestanden


| Bestand                                              | Doel                                 |
| ---------------------------------------------------- | ------------------------------------ |
| `src/components/game/casino/RussianRouletteGame.tsx` | Russian Roulette mini-game component |
| `src/components/game/minigames/LockpickGame.tsx`     | Lockpick timing mini-game            |
| `src/components/game/minigames/DiceGame.tsx`         | Craps/dobbelspel component           |
| `src/components/game/minigames/HackingGame.tsx`      | Grid-puzzel hacking mini-game        |
| `src/components/game/minigames/ArmWrestleGame.tsx`   | Tap-gebaseerde arm-wrestle game      |


### Gewijzigde Bestanden


| Bestand                                 | Wijziging                                             |
| --------------------------------------- | ----------------------------------------------------- |
| `src/game/types.ts`                     | `CasinoGame` type uitbreiden met `'russian_roulette'` |
| `src/components/game/CasinoView.tsx`    | Russian Roulette toevoegen als 5e casino-spel         |
| `src/components/game/PrisonOverlay.tsx` | Dobbelspel toevoegen als gevangenis-activiteit        |
| `src/components/game/storyEvents.ts`    | Nieuwe street events met arm wrestle en dice triggers |
| `src/contexts/GameContext.tsx`          | Nieuwe actions voor mini-game resultaten en state     |


### State Uitbreidingen

```text
CasinoGame type + 'russian_roulette'

GameState + {
  pendingMinigame: {
    type: 'lockpick' | 'dice' | 'hacking' | 'arm_wrestle';
    difficulty: number;
    context: string; // waar het vandaan komt
    rewards: { money?: number; rep?: number; heat?: number };
  } | null;
}
```

### Casino Integratie (Russian Roulette)

- Toegevoegd aan het bestaande casino-menu grid (2x3 in plaats van 2x2)
- Gebruikt dezelfde `BetControls`, `onResult` callback, en VIP bonus-systeem
- Visueel: draaiende cilinder-animatie met Framer Motion, spanning opbouw

### Gevangenis Integratie (Dobbelspel)

- Nieuwe "Dobbelen" knop in de PrisonOverlay naast "Omkopen" en "Ontsnappen"
- Winst in sigaretten die omgezet worden naar strafverkorting of connecties
- Verlies kost "bescherming" (crew loyalty effect)

### Missie/Heist Integratie (Lockpick + Hacking)

- Mini-games verschijnen als alternatieve skill-checks
- Succes vervangt de normale dice-roll met een gegarandeerd resultaat
- Speler kan altijd kiezen: mini-game spelen OF normale stat-check doen

### Straat Integratie (Arm Wrestle + Dice)

- 2 nieuwe street events die mini-games triggeren
- Arm wrestle bij Iron Borough bars, dice bij Port District docks