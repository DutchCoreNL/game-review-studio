

# Noxhaven - Volledige Code Review & Verbeterplan

## Gevonden Problemen

### 1. Bugs & Ontbrekende Implementaties

**A. `seenEndgameEvents` niet in GameState type**
Het veld `seenEndgameEvents` wordt gebruikt via `(s as any)` in `GameContext.tsx` en `endgame.ts`, maar is niet gedefinieerd in de `GameState` interface. Dit betekent dat het ook niet gemigreerd wordt bij het laden van een save, waardoor het bij elke sessie-herstart verloren gaat en events herhaald worden.

**B. `_finalBossWon` en `_lastFactionResult` als tijdelijke state via `as any`**
Er worden meerdere "hidden" velden op de state gezet via `(s as any)._finalBossWon`, `(s as any)._lastFactionResult` en `(s as any)._completedArcFlashbackId`. Dit is fragiel en deze velden moeten formeel in `GameState` opgenomen worden (of via een apart mechanisme buiten de reducer).

**C. `dailyNews` wordt gezet via `as any` cast**
In `GameContext.tsx` regel 395: `(s as any).dailyNews = generateDailyNews(s)` - terwijl `dailyNews` al wél in `GameState` staat. De cast is onnodig en verbergt mogelijke type-fouten.

**D. Combat defeat heat bug**
In `engine.ts` regel 1323: `state.heat += 20` wordt direct op de oude `heat` property gezet in plaats van via het Heat 2.0 systeem (`splitHeat` of `addPersonalHeat`). Dit bypassed het hele Heat 2.0 systeem.

**E. `backstory === null` check in GameLayout**
De BackstorySelection toont alleen wanneer `state.backstory === null && state.tutorialDone`. Maar bij een nieuw spel is `backstory` undefined totdat het gemigrateerd wordt. De migratie in GameProvider ontbreekt voor het `backstory` veld.

**F. Slots reel animatie race condition**
In `SlotsGame.tsx` wordt `spinning` als state gebruikt in het `setInterval` callback, maar door React's closure semantics leest het altijd de oude waarde. De reels animatie werkt daardoor niet helemaal correct.

### 2. Type Safety Problemen

| Locatie | Probleem |
|---------|----------|
| `GameContext.tsx:1181` | `s.stolenCars.push(newCar as any)` - upgrades array type mismatch |
| `GameContext.tsx:1224` | `car.upgrades.includes(action.upgradeId as any)` - type cast |
| `DistrictPopup.tsx:34,69,88` | `selectDistrict(null as any)` - null zou geldig moeten zijn |
| `FamiliesView.tsx:23` | `state.leadersDefeated.includes(id as any)` |
| `newsGenerator.ts:203,381` | Meerdere `as any` casts voor state properties |

### 3. Performance Problemen

**A. Deep clone via JSON.parse/stringify op elke actie**
`GameContext.tsx` regel 168: `const s = JSON.parse(JSON.stringify(state)) as GameState` kopieert de volledige state bij elke dispatch. Bij een grote state (veel berichten, prijshistorie, etc.) kan dit merkbaar traag worden.

**B. Auto-save op elke state change**
Regel 1947: `Engine.saveGame(state)` wordt bij elke render/state-change aangeroepen, inclusief UI-acties zoals het openen van de telefoon.

### 4. Ontbrekende Features / Verbeterpunten

**A. Geen backstory/karma/NPC migratie bij save load**
De `backstory`, `karma`, `npcRelations`, en `keyDecisions` velden worden niet gemigreerd in de GameProvider save loader. Bestaande saves missen deze velden.

**B. Fog en Heatwave weer-ambiance ontbreekt**
De `cityAmbiance.ts` heeft alleen audio-lagen voor `rain` en `storm`. `fog` en `heatwave` worden niet afgehandeld in de `setWeather` functie.

**C. Geen geluid bij casino acties**
Casino-games (slots, blackjack, roulette, high-low) gebruiken geen geluidseffecten ondanks de beschikbare audio-engine.

**D. News systeem cast-probleem**
De `newsGenerator.ts` gebruikt `(state as any).corruptContacts` terwijl dit gewoon `state.corruptContacts` zou moeten zijn - het veld bestaat in GameState.

---

## Implementatieplan

### Stap 1: Bug Fixes (kritiek)

1. **Fix Heat 2.0 bypass in combat defeat** (`engine.ts`)
   - Vervang `state.heat += 20` door `splitHeat(state, 20, 0.5); recomputeHeat(state);`

2. **Fix `seenEndgameEvents` formaliseren** (`types.ts` + `GameContext.tsx`)
   - Voeg `seenEndgameEvents: string[]` toe aan `GameState`
   - Voeg migratie toe in save loader
   - Verwijder alle `as any` casts

3. **Fix dailyNews cast** (`GameContext.tsx`)
   - Verwijder `as any` cast: `s.dailyNews = generateDailyNews(s)`

4. **Fix ontbrekende save migraties** (`GameContext.tsx`)
   - Voeg toe: `backstory`, `karma`, `npcRelations`, `keyDecisions`, `pendingAchievements`

### Stap 2: Type Safety Opschonen

5. **Formaliseer tijdelijke reducer-velden** (`types.ts`)
   - Voeg optionele velden toe voor `_finalBossWon`, `_completedArcFlashbackId` zodat `as any` verdwijnt
   - Of gebruik een apart `reducerMeta` object buiten de state

6. **Fix `StolenCar.upgrades` type** (`types.ts`)
   - Verander `upgrades: ChopShopUpgradeId[]` zodat de push zonder cast werkt

7. **Fix `selectDistrict(null)` type** (`GameContext.tsx`)
   - Verander type naar `DistrictId | null`

8. **Fix newsGenerator casts** (`newsGenerator.ts`)
   - Verwijder `as any` en gebruik correcte types

### Stap 3: Verbeteringen

9. **Voeg fog/heatwave ambiance toe** (`cityAmbiance.ts`)
   - `fog`: Gedempte, echo-achtige drone met laagfrequent gesuis
   - `heatwave`: Zoemend warmte-geluid met insecten-achtig getsjirp

10. **Voeg casino geluidseffecten toe** (casino components)
    - Slots: spin geluid, win jingle, jackpot fanfare
    - Blackjack: card deal, bust, blackjack
    - Roulette: spin, ball drop, win
    - High-Low: card flip, streak geluid

11. **Throttle auto-save** (`GameContext.tsx`)
    - Gebruik een debounce van 2 seconden op `saveGame` calls

### Technische Details

```text
Bestanden die gewijzigd worden:

src/game/types.ts           - seenEndgameEvents, reducer meta velden, StolenCar type fix
src/game/engine.ts          - Heat 2.0 fix in combat defeat
src/contexts/GameContext.tsx - Remove as any casts, add migrations, throttle save
src/game/newsGenerator.ts   - Remove unnecessary as any casts
src/game/sounds/cityAmbiance.ts - Fog + heatwave ambiance
src/components/game/casino/SlotsGame.tsx - Sound effects
src/components/game/casino/BlackjackGame.tsx - Sound effects
src/components/game/casino/RouletteGame.tsx - Sound effects
src/components/game/casino/HighLowGame.tsx - Sound effects
```

