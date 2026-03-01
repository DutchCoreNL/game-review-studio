

## Analyse: Huidig Level Systeem

### Hoe het nu werkt

| Aspect | Huidige implementatie |
|---|---|
| **XP Curve** | `nextXp * 1.4` per level (exponentieel, maar de `xpForLevel` functie uit skillTree.ts met `1.15^level` wordt niet gebruikt in engine.ts) |
| **Level cap** | 50 (prestige unlock) |
| **SP per level** | Flat +2 per level-up |
| **Merit per level** | +1 per level, +1 extra bij milestones (5,10,15,...) |
| **HP per level** | +5 per level (via `80 + level*5 + muscle*3`) |
| **Milestones** | Elke 5 levels: titel + cash + rep + bonus SP |
| **XP Multipliers** | Prestige (+5%/lvl), Merit bonus, Week events, maar district/streak/gang/first-of-day bonussen uit `XP_MULTIPLIERS` config worden **niet** toegepast in `gainXp()` |
| **Level gates** | Features unlocken bij 1,5,10,15,20,25,30,40,50 |
| **Rested XP** | 25/uur offline, max 5000, +50% bonus — maar nergens geconsumeerd in `gainXp()` |

### Gevonden problemen

1. **Dubbele merit toekenning** — regel 1507-1508: `meritPoints` wordt twee keer opgeteld bij level-up (bug)
2. **Twee XP curves** — `xpForLevel()` in skillTree.ts (1.15^level) vs `nextXp * 1.4` in engine.ts — inconsistent
3. **Ongebruikte XP multipliers** — District bonus, streak bonus, gang bonus, first-of-day bonus staan geconfigureerd maar worden nooit toegepast
4. **Rested XP nooit geconsumeerd** — Config bestaat maar `gainXp()` past het niet toe
5. **Server-side XP queue dood** — `_pendingXpGains` wordt gevuld maar nergens verwerkt (geen edge function)
6. **Flat SP beloning** — Altijd +2, geen variatie of keuze

### Vergelijking met soortgelijke MMO's (Torn, CriminalCase, MobWars)

| Feature | Torn/MobWars | Jouw game | Verbetering |
|---|---|---|---|
| **XP bronnen** | Diverse: crimes, gym, education, missions, wars | Beperkt: ops, contracts, trades, combat | Meer XP-bronnen met variërende hoeveelheden |
| **Diminishing returns** | XP per actie schaalt mee maar vertraagt | Flat XP per actie-type | XP schalen met level |
| **Daily bonuses** | Login streaks, daily challenges | Geconfigureerd maar niet actief | Activeren |
| **Level perks** | Stat points + specifieke unlocks + titles | SP + merit + milestone titels | Goed, maar merit-bug fixen |
| **Prestige/rebirth** | Meerdere reset-lagen met carry-over | 10 prestige levels | Solide opzet |

### Verbeterplan

**1. Fix dubbele merit bug** (1 regel)
- Verwijder de dubbele `state.meritPoints +=` op regel 1508

**2. Activeer ongebruikte XP multipliers in `gainXp()`**
- District danger bonus (Neon +15%, Crown +20%)
- Streak bonus (+2% per actie zonder dood, max +20%)
- Gang bonus (+10%)
- First action of the day (2x)
- Mastermind skill bonus

**3. Implementeer Rested XP consumptie**
- Bij `gainXp()`: check `state.restedXP > 0`, geef +50% bonus, trek rested XP af
- Toon indicator in UI wanneer rested XP actief is

**4. Unificeer XP curve**
- Gebruik één formule: `xpForLevel()` uit skillTree.ts overal
- Initialiseer `nextXp` op basis van deze functie bij level-up

**5. Schaal XP rewards mee met level (diminishing returns)**
- Lage-level acties geven minder XP naarmate je groeit (zoals Torn)
- Formule: `effectiveXP = baseXP * Math.max(0.3, 1 - (playerLevel - actionLevel) * 0.05)`

**6. Level-up notificatie verbeteren**
- Bij level-up: toon duidelijk wat je hebt geunlockt (via LEVEL_GATES), hoeveel SP/merit je hebt gekregen, en eventuele milestone rewards

### Bestanden die wijzigen

| Bestand | Wat |
|---|---|
| `src/game/engine.ts` | Fix merit bug, activeer alle XP multipliers, rested XP consumptie, unificeer XP curve, diminishing returns |
| `src/game/skillTree.ts` | Geen wijziging (xpForLevel blijft de bron) |
| `src/game/meritSystem.ts` | Geen wijziging |

