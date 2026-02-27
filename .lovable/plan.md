

# Plan: MMO Codebase Audit & Verbeteringen

Na een grondige analyse van de codebase zijn er meerdere gebieden die niet passen bij de MMO-architectuur of verbeterd moeten worden. Hieronder een overzicht per categorie.

---

## 1. localStorage als primaire opslag verwijderen

**Probleem**: `engine.ts` slaat nog steeds alles op in localStorage (`SAVE_KEY = 'noxhaven_save_v11'`). Dit is nu een fallback, maar de code behandelt het nog als primair.

**Aanpassing**:
- `saveGame()` en `loadGame()` in `engine.ts` omzetten naar een secundaire cache (fallback bij offline)
- Bij inloggen altijd cloud save laden als primaire bron
- localStorage alleen gebruiken als offline buffer, niet als source-of-truth
- Verwijder de oude save-key migratie (`noxhaven_save_v10`, `v9`, `v8`)

---

## 2. END_TURN knop verwijderen — volledig AUTO_TICK

**Probleem**: De `END_TURN` actie bestaat nog steeds naast `AUTO_TICK`. In een MMO is er geen "dag afsluiten" knop — tijd loopt door.

**Aanpassing**:
- Verwijder de `END_TURN` dispatch en UI-knop volledig
- Consolideer alle logica uit `END_TURN` case in de `AUTO_TICK` case (die nu al grotendeels hetzelfde doet)
- Verwijder referenties naar "Dag Afsluiten" in de UI

---

## 3. Prijzen server-side maken (niet client-side genereren)

**Probleem**: `generatePrices()` in `engine.ts` genereert prijzen client-side met `Math.random()`. In een MMO moeten alle spelers dezelfde prijzen zien.

**Aanpassing**:
- Prijzen worden al bijgehouden in `market_prices` tabel — gebruik deze als enige bron
- Verwijder client-side `generatePrices()` aanroepen
- MarketPanel en TradeView moeten data uit de database laden (wat deels al gebeurt)
- De `passive-income` cron job beheert al de prijsevolutie — dit wordt de enige prijsbron

---

## 4. Energy/Nerve systeem activeren in de UI

**Probleem**: Energy en nerve zijn gedefinieerd in de types en server-state, maar worden nog niet consequent afgedwongen. Acties kosten momenteel geen energy/nerve.

**Aanpassing**:
- Elke actie (trade, solo_op, travel, combat) moet energy of nerve kosten
- Toon energy/nerve balken prominent in de GameHeader
- Regeneratie-timers visueel tonen (countdown tot volgende +1 energy)
- Server-side validatie dat energy/nerve voldoende is

---

## 5. Cooldowns afdwingen in de UI

**Probleem**: `travelCooldownUntil`, `crimeCooldownUntil`, `attackCooldownUntil`, `heistCooldownUntil` bestaan maar worden niet visueel afgedwongen.

**Aanpassing**:
- Knoppen disablen wanneer cooldown actief is
- Countdown-timer tonen op geblokkeerde acties
- Server-side cooldown-validatie in de edge function (al deels aanwezig)

---

## 6. Client-side game logica reduceren

**Probleem**: De reducer in `GameContext.tsx` (3091 regels) en `engine.ts` (2284 regels) bevatten alle game-logica client-side. Dit is exploiteerbaar in een MMO.

**Aanpassing (gefaseerd)**:
- **Fase A**: Kritieke acties (trade, combat, operations) moeten resultaat van server accepteren, niet lokaal berekenen
- **Fase B**: Niet-kritieke acties (UI state, popups, navigation) kunnen client-side blijven
- De `SERVER_ACTIONS` set in `useServerSync.ts` uitbreiden met meer acties (momenteel maar 12 van 100+)

---

## 7. Gevangenis & Hospitalisatie naar realtime timers

**Probleem**: Gevangenis (`prison.daysRemaining`) en hospitalisatie tellen af per game-dag. In een MMO moeten dit realtime timers zijn.

**Aanpassing**:
- `prison_until` en `hospital_until` kolommen bestaan al in `player_state`
- Gebruik deze ISO-timestamps i.p.v. dagentellers
- UI toont countdown-klok (uren/minuten) i.p.v. "X dagen"
- Automatische release wanneer timestamp verloopt

---

## 8. Leaderboard-sync automatiseren

**Probleem**: Leaderboard sync is handmatig (knop in WiFi-popup). In een MMO moet dit automatisch gebeuren.

**Aanpassing**:
- Sync automatisch bij cloud save (elke 2 minuten)
- Verwijder handmatige sync-knop of maak optioneel
- Edge function `save_state` kan tegelijk leaderboard updaten

---

## 9. Gang-systeem koppelen aan database

**Probleem**: Gang-tabellen (`gangs`, `gang_members`, `gang_territories`, etc.) bestaan in de database maar worden nog niet vanuit de client aangestuurd.

**Aanpassing**:
- GangView koppelen aan de database-tabellen via Supabase queries
- Gang-acties (join, leave, contribute) via edge function
- Realtime gang-chat via Supabase Realtime (tabel `gang_chat` bestaat al)

---

## 10. Verwijder single-player remnants

**Probleem**: Diverse systemen zijn puur single-player en passen niet in een MMO:
- **New Game Plus** (NG+): Geen reset in een MMO
- **Victory Screen / Game Over**: Een MMO eindigt niet
- **Run History**: Geen "runs" in een persistent world
- **Tick Interval config**: Spelers mogen de tijdssnelheid niet aanpassen

**Aanpassing**:
- NG+ systeem verwijderen of omzetten naar een "Prestige" systeem (reset met bonussen, maar behoud MMO-wereld)
- Victory/Game Over verwijderen of omzetten naar "Season milestones"
- `tickIntervalMinutes` vast op server zetten, niet configureerbaar per speler

---

## 11. NPC Facties → Gedeelde wereld-state

**Probleem**: Factie-relaties, conquest-status en leiders zijn per-speler opgeslagen. In een MMO zouden facties gedeeld moeten zijn.

**Aanpassing (toekomst)**:
- Factie-status (conquered, leader alive) naar een gedeelde server-tabel
- Speler-specifieke relaties blijven per-speler
- Conquest-events worden server-wide events

---

## Prioritering

```text
HOOG (nu doen):
├── #2 END_TURN verwijderen → AUTO_TICK only
├── #3 Prijzen alleen uit database
├── #5 Cooldown-timers in UI
└── #7 Prison/Hospital naar realtime

MIDDEL (volgende sprint):
├── #1 localStorage als fallback only
├── #4 Energy/Nerve afdwingen
├── #6 Meer acties server-side
└── #8 Auto leaderboard sync

LAAG (later):
├── #9  Gang-systeem activeren
├── #10 SP remnants opschonen
└── #11 Gedeelde factie-state
```

---

## Technische Details

### Bestanden die aangepast worden (HOOG prioriteit):
- `src/game/engine.ts` — `endTurn()`, `generatePrices()`, `saveGame()`/`loadGame()` aanpassen
- `src/contexts/GameContext.tsx` — `END_TURN` case verwijderen, cooldown-checks toevoegen
- `src/components/game/GameHeader.tsx` — energy/nerve bars, cooldown-timers
- `src/components/game/trade/MarketPanel.tsx` — database als enige prijsbron
- `src/components/game/OperationsView.tsx` — cooldown + energy checks
- `src/components/game/PrisonOverlay.tsx` — realtime countdown
- `src/components/game/HospitalStayOverlay.tsx` — realtime countdown
- `src/hooks/useServerSync.ts` — meer acties toevoegen aan SERVER_ACTIONS

### Database wijzigingen:
- Geen nieuwe tabellen nodig — alles bestaat al
- Eventueel `tick_interval_minutes` verwijderen uit client en vast op server zetten

