

# Ziekenhuisopname & Game Over Systeem

## Overzicht
Wanneer je HP op 0 komt na een gevecht, word je automatisch opgenomen in het ziekenhuis. Dit kost tijd (dagen) en geld. Als dit 3 keer gebeurt, is het **Game Over** en moet je opnieuw beginnen.

## Wat verandert er voor de speler?

### Bij verloren gevecht (HP naar 0):
- Je wordt automatisch opgenomen in het **Crown Heights Ziekenhuis**
- Je bent **3 dagen** buiten spel (vergelijkbaar met gevangenis — nachten tikken door, je kunt niks doen)
- Je betaalt **ziekenhuiskosten** (gebaseerd op je max HP, bijv. €500-2000)
- Je HP wordt hersteld naar **50%** na ontslag
- Je verliest een deel van je **reputatie** (-50 REP)
- Je `hospitalizations`-teller gaat +1 omhoog

### Bij 3e ziekenhuisopname: Game Over
- Een speciaal **Game Over scherm** verschijnt met je statistieken
- Je kunt kiezen: **Terug naar hoofdmenu** (save wordt gewist)

## Technische Details

### 1. State uitbreiden (`src/game/types.ts`)
- Nieuw veld `hospitalizations: number` op `GameState` (telt het aantal keer dat je bent opgenomen)
- Nieuw type `HospitalState` (vergelijkbaar met `PrisonState`):
  ```
  { daysRemaining: number, totalDays: number, cost: number }
  ```
- Nieuw veld `hospital: HospitalState | null` op `GameState`
- Nieuw veld `gameOver: boolean` op `GameState`

### 2. Constants toevoegen (`src/game/constants.ts`)
- `HOSPITAL_STAY_DAYS = 3`
- `HOSPITAL_ADMISSION_COST_PER_MAXHP = 10` (dus bij 100 max HP = €1000)
- `HOSPITAL_REP_LOSS = 50`
- `MAX_HOSPITALIZATIONS = 3` (game over drempel)

### 3. Combat defeat logic aanpassen (`src/contexts/GameContext.tsx`)
- In de `END_COMBAT` case: als het gevecht verloren is, in plaats van HP naar 10% zetten:
  - `hospitalizations += 1`
  - Als `hospitalizations >= 3`: zet `gameOver = true`
  - Anders: maak een `HospitalState` aan en zet `hospital` op die waarde
  - Trek ziekenhuiskosten af van geld (minimum €0)
  - Trek reputatie af

### 4. Ziekenhuisopname Overlay maken (`src/components/game/HospitalStayOverlay.tsx`)
- Vergelijkbaar met `PrisonOverlay` — een fullscreen overlay die de game blokkeert
- Toont: resterende dagen, kosten, en een boodschap
- Geen interactie mogelijk behalve wachten (nachten tikken automatisch door)
- Na laatste dag: HP hersteld naar 50%, overlay verdwijnt

### 5. Night-report integratie (`src/game/engine.ts`)
- In `advanceNight`: als `hospital` actief is, tel dagen af
- Na ontslag: zet `hospital = null`, herstel HP naar 50%
- Voeg hospital-info toe aan het night report

### 6. Game Over scherm maken (`src/components/game/GameOverScreen.tsx`)
- Toont statistieken (dagen gespeeld, geld verdiend, missies voltooid, etc.)
- "Terug naar Hoofdmenu" knop die save wist en teruggaat

### 7. GameLayout aanpassen (`src/components/game/GameLayout.tsx`)
- `HospitalStayOverlay` toevoegen (vergelijkbaar met hoe `PrisonOverlay` wordt getoond)
- `GameOverScreen` toevoegen wanneer `state.gameOver === true`

### 8. Migratie voor bestaande saves (`src/contexts/GameContext.tsx`)
- Default waarden toevoegen: `hospitalizations: 0`, `hospital: null`, `gameOver: false`
