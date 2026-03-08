

# Knockout-systeem voor PvE Combat

## Huidige situatie
- PvE verlies (`handleEndCombat` in `combatHandlers.ts`) → `s.gameOver = true` = permadeath
- PvP verlies → `s.playerHP = Math.max(1, ...)` = geen permadeath (al correct)

## Wijziging
Bij PvE-verlies (niet-PvP combat) wordt de speler **knocked out** in plaats van permadeath:

### Knockout-consequenties:
- **HP** wordt gezet op 25% van max HP (gewond maar levend)
- **Geldverlies**: 15% van huidig geld (beroving terwijl je bewusteloos bent)
- **Rep-verlies**: -10 rep
- **Streak reset**: combat streak naar 0
- **Geen gameOver** — spel gaat door

### Code-aanpassing
Alleen `handleEndCombat` in `combatHandlers.ts` wijzigt — het `else` blok (regels 259-268) waar nu `s.gameOver = true` staat wordt vervangen door het knockout-systeem.

Een melding via `addPhoneMessage` informeert de speler over wat er is gebeurd.

### Wat NIET verandert
- Final boss combat blijft dodelijk (als je de eindbaas verliest, game over)
- Nemesis-gevechten volgen het knockout-systeem (je kunt revanche nemen)
- PvP blijft ongewijzigd (apart systeem)

| Bestand | Wijziging |
|---------|-----------|
| `combatHandlers.ts` | Vervang `gameOver = true` blok door knockout-logica |

Eén bestand, ~15 regels wijziging. Geen type-aanpassingen nodig.

