

# Analyse: Dagen-systeem Implementatie

## Hoe het werkt

Het systeem heeft **twee lagen**:

1. **Server (`world-tick`)**: Berekent `world_day` als het aantal dagen sinds 1 jan 2025 (referentiedatum). Vandaag = dag ~432. De server draait elke 30 min en update `world_state` in de database met de huidige fase (dawn/day/dusk/night), weer, en `world_day`.

2. **Client**: Haalt `world_day` op via `useWorldState` hook (realtime subscription). `GameLayout` synct `state.day = worldState.worldDay` via `SYNC_WORLD_TIME` action.

## Gevonden problemen

### 1. Milestone-checks breken voor nieuwe spelers (HOOG)

**Probleem**: `state.day` start op `1` in `createInitialState()`, maar wordt meteen overschreven naar `~432` (de huidige world_day). Hierdoor worden milestone-checks als `state.day === 7` en `state.day === 30` **nooit** getriggerd — de dag springt direct van 1 naar 432.

Dit treft:
- Telefoonberichten op dag 7 en 30 (`newFeatures.ts`)
- Achievement "Overlever" (`state.day >= 30`) — direct unlocked
- Achievement "Nachtuil" (`state.day >= 100`) — direct unlocked
- Week events check (`state.day % 7 === 0`) — werkt toevallig, maar semantisch fout
- Hit contract deadlines (`deadline: state.day + 3`) — werkt correct
- Codex unlocks op basis van dag — te vroeg unlocked

**Fix**: Voeg een `daysPlayed` tracker toe die bijhoudt hoeveel dagen de speler daadwerkelijk actief is geweest. Gebruik `daysPlayed` voor milestones/achievements, en `state.day` (= world_day) voor deadlines en world-sync.

### 2. Duplicate `DISTRICT_NAMES` declaratie (BUG)

**Probleem**: `world-tick/index.ts` regel 12 en regel 59 declareren beide `const DISTRICT_NAMES`. Dit is een compile-fout die TypeScript zou moeten blokkeren. In Deno edge functions kan dit tot runtime errors leiden.

**Fix**: Verwijder de duplicate declaratie op regel 59.

### 3. `process-turn` incrementeert `stats.daysPlayed` elke turn (MEDIUM)

**Probleem**: `process-turn/index.ts` regel 569 doet `s.stats.daysPlayed += 1` bij **elke turn**, niet bij elke nieuwe dag. Als een speler 5 acties per dag doet, telt `daysPlayed` 5 in plaats van 1.

**Fix**: Alleen incrementeren als de dag daadwerkelijk veranderd is (vergelijk met een `lastDayProcessed` veld).

### 4. `next_cycle_at` countdown bug bij nacht→dawn overgang

**Probleem**: In `getPhaseFromRealTime()`, als `cetHour < 6` (nacht), wordt `nextBoundaryHourUTC = 5`. Maar de check `if (nextBoundaryHourUTC < now.getUTCHours())` klopt niet altijd — als UTC hour = 23 en next = 5, dan is 5 < 23 = true, dus het springt naar morgen. Dat is correct. Maar als UTC = 3 en next = 5, dan 5 < 3 = false, dus het blijft vandaag. Dat klopt ook. Lijkt OK bij nader inzien.

### 5. CET vs CEST niet afgehandeld

**Probleem**: De code gebruikt hard `UTC+1` (regel 19: `(getUTCHours() + 1) % 24`). In de zomer is Nederland UTC+2 (CEST). Dit betekent dat de fases in de zomer 1 uur verschoven zijn: "Dawn" begint om 07:00 lokale tijd in plaats van 06:00.

**Fix**: Optioneel — gebruik `Intl.DateTimeFormat` met timezone `Europe/Amsterdam` voor correcte CET/CEST detectie. Of accepteer de 1-uur drift als bewuste keuze.

## Implementatieplan

| # | Wat | Impact | Bestanden |
|---|-----|--------|-----------|
| 1 | Splits `daysPlayed` (speler-specifiek) vs `day` (world_day) voor milestones | Hoog | `constants.ts`, `newFeatures.ts`, `constants.ts` (achievements), `weekEvents.ts`, `endgame.ts` |
| 2 | Verwijder duplicate `DISTRICT_NAMES` | Bug | `world-tick/index.ts` |
| 3 | Fix `daysPlayed` increment in process-turn | Medium | `process-turn/index.ts` |
| 4 | (Optioneel) CET/CEST correctie | Laag | `world-tick/index.ts` |

Stap 1 is de belangrijkste: milestones moeten op basis van **speeldagen** werken, niet op basis van de absolute wereld-dag.

