

# Gevechtsysteem Upgrade: Visueel & Beloningen

## Huidige situatie
Het gevecht heeft basisanimaties (HP-flash, shake, impact pulse) en een tekst-gebaseerde combat log. Overwinningen geven vaste beloningen (+€25.000, +200 REP). Er zijn geen loot drops, geen kill-streaks, geen gevechtsranking.

## Plan

### 1. Visuele verbeteringen

**Floating damage numbers** (al in PvPCombatView, ontbreekt in CombatView)
- Port het `DamagePopup` component naar `CombatView.tsx`
- Toon schade-getallen die omhoog floaten bij elke actie (rood voor ontvangen, goud voor gegeven, groen voor heal)

**Screen flash effecten**
- Rode flash overlay bij zware schade ontvangen (>15 HP)
- Gouden flash bij kritieke treffers
- Subtiele screen-shake intensiteit schalen met schade-hoeveelheid

**Verbeterde combat log styling**
- Iconen per log-type (⚔️ aanval, 🛡️ verdediging, 💥 kritiek, 🩸 bleed)
- Grotere, geanimeerde tekst voor kritieke momenten
- Scheidingslijn tussen speler- en vijand-beurten

**Turn transition animatie**
- Beurt-nummer indicator met animatie (zoals in PvPCombatView, ontbreekt in CombatView)

### 2. Beloningen & Progressie

**Combat Loot systeem**
- Na overwinning: random loot roll uit een tabel gebaseerd op vijand-type en level
- Loot categorieën: geld (altijd), gear (zeldzaam), speciale munitie (ongewoon), consumables (gewoon)
- Visuele loot-reveal animatie: items verschijnen één voor één met rariteit-kleuren

**Kill Streak tracker**
- Bijhouden van opeenvolgende overwinningen in `state.combatStreak`
- Streak bonussen: 3-streak (+10% loot), 5-streak (+25% loot + titel), 10-streak (+50% loot + achievement)
- Visuele streak-indicator bovenaan gevechtsscherm
- Streak breekt bij verlies

**Post-combat statistieken**
- Uitgebreid resultaatscherm met: schade gegeven/ontvangen, skills gebruikt, combo's, beurten, efficiëntie-rating (S/A/B/C/D)
- Rating beïnvloedt loot-kwaliteit

### Bestanden

| Bestand | Wijziging |
|---|---|
| `src/components/game/CombatView.tsx` | Damage popups, screen flash, turn indicator, loot reveal, streak UI, verbeterde result screen |
| `src/game/combatLoot.ts` | **Nieuw** — Loot tabellen, roll-logica, rariteit-systeem |
| `src/game/types.ts` | `combatStreak`, `lastCombatRating` toevoegen aan GameState |
| `src/contexts/GameContext.tsx` | Streak tracking in END_COMBAT, loot toekenning |

~200 regels nieuw, ~80 regels gewijzigd. Puur client-side, geen database-wijzigingen nodig.

