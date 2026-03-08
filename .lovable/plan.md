

# Client-side & Server-side Review — Bevindingen

Na grondige analyse van de codebase zijn er **3 bugs** en **2 inconsistenties** gevonden.

---

## 🔴 Bug 1: Client `daysPlayed++` is onbeschermd (HOOG)

**Locatie**: `src/game/engine.ts` regel 791

```typescript
// state.day is synced with world_day via SYNC_WORLD_TIME — do NOT manually increment
state.stats.daysPlayed++;
```

De server-side (`process-turn`) heeft correct een `_lastProcessedDay` guard die voorkomt dat `daysPlayed` meerdere keren per dag omhoog gaat. Maar de client-side `engine.ts` doet `daysPlayed++` bij **elke AUTO_TICK** (elke 30 minuten). Als een speler 6 uur online is, wordt `daysPlayed` met 12 verhoogd i.p.v. 1.

**Fix**: Voeg dezelfde `_lastProcessedDay` guard toe aan de client-side engine:
```typescript
const lastProcessedDay = state._lastProcessedDay || 0;
if (state.day > lastProcessedDay) {
  state.stats.daysPlayed++;
  state._lastProcessedDay = state.day;
}
```

---

## 🔴 Bug 2: `_lastProcessedDay` niet in GameState type (HOOG)

**Locatie**: `src/game/types.ts` — `GameState` interface

Het veld `_lastProcessedDay` wordt gebruikt door zowel `process-turn/index.ts` als de voorgestelde client-side fix, maar is niet gedeclareerd in het `GameState` type. Dit werkt door TypeScript's `noImplicitAny: false`, maar veroorzaakt problemen bij cloud save serialisatie — het veld kan verloren gaan bij het laden van een save.

**Fix**: Voeg `_lastProcessedDay?: number;` toe aan de `GameState` interface.

---

## 🟡 Bug 3: DailyChallenge `minDay` vergelijkt met `state.day` (MEDIUM)

**Locatie**: `src/game/dailyChallenges.ts` — de `minDay` checks in challenge templates (bijv. `minDay: 5`, `minDay: 10`) worden vergeleken met `state.day` (world_day ~432), wat betekent dat alle challenges met een `minDay` vereiste direct beschikbaar zijn voor nieuwe spelers. Dit is hetzelfde probleem als de milestones.

**Fix**: De `generateDailyChallenges` functie moet `state.stats.daysPlayed` gebruiken voor `minDay` filtering.

---

## 🟢 Inconsistentie 1: `storyArcs.ts` gebruikt `state.day` voor minDay (OK)

`storyArcs.ts` vergelijkt `state.day < c.minDay`. Omdat story arcs world-event timing vertegenwoordigen (niet persoonlijke progressie), is `state.day` hier correct. Geen actie nodig.

---

## 🟢 Inconsistentie 2: Codex `day` unlock (OK)

`codex.ts` gebruikt `state.day >= c.day` — codex entries zijn lore/wereld-unlocks, niet persoonlijke milestones. `state.day` is correct hier.

---

## Samenvatting

| # | Probleem | Prioriteit | Bestand |
|---|----------|-----------|---------|
| 1 | Client `daysPlayed++` onbeschermd | **HOOG** | `src/game/engine.ts` |
| 2 | `_lastProcessedDay` niet in type | **HOOG** | `src/game/types.ts` |
| 3 | DailyChallenges `minDay` check | **MEDIUM** | `src/game/dailyChallenges.ts` |

3 kleine, gerichte fixes. Geen grote refactoring nodig.

