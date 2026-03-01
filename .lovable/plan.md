

## Analyse: SP Systeem — Past het nog?

### Huidige situatie

SP wordt nu op **twee plekken** uitgegeven:
1. **Raw stats** verhogen (Muscle/Brains/Charm +1) via het profiel
2. **Skill Tree nodes** unlocken (1-3 SP per node)

Daarnaast bestaat het **Merit Punten** systeem apart — ook permanente passieve bonussen.

### Probleem

Dit levert **drie overlappende progressie-lagen** op:
- SP → stats (+1 kracht)
- SP → skill nodes (passieve bonussen zoals crit chance, lifesteal)
- Merit → passieve bonussen (damage, XP, trade)

**Skill nodes en Merit doen grotendeels hetzelfde** (passieve percentages), waardoor de speler het verschil nauwelijks voelt. En SP uitgeven aan raw stats (+1) voelt vlak vergeleken met een skill node die +15% lifesteal geeft.

### Vergelijking met referentie-games

| Game | Stat progressie | Skill progressie | Passieve perks |
|---|---|---|---|
| **Torn** | Gym training (tijdgebonden, geen punten) | Education (tijdgebonden cursussen) | Merits (apart budget) |
| **MobWars** | Stat points bij level-up (dedicated) | Skill tree (apart budget) | Achievement perks |
| **Jouw game** | SP (gedeeld budget) | SP (gedeeld budget) | Merit (apart budget) |

### Voorstel: Splits SP op

**Stat Points (StP)** — voor raw stats, verdiend bij level-up (+1 per level)
**Skill Points (SP)** — voor skill tree nodes, verdiend bij milestones en speciale acties

Dit geeft:
- Elke level-up: **+1 StP** voor stats (directe kracht)
- Milestones (elke 5 levels): **+2-5 SP** voor skill tree (strategische keuze)
- Merit: blijft apart (permanente passieve bonussen bij prestige/speciale events)

### Concrete wijzigingen

| Bestand | Wat |
|---|---|
| `src/game/types.ts` | Voeg `statPoints: number` toe aan Player interface |
| `src/game/constants.ts` | Initialiseer `statPoints: 0` |
| `src/game/engine.ts` | Level-up: +1 statPoints (i.p.v. +2 SP); milestone: SP bonus via milestone config |
| `src/contexts/GameContext.tsx` | `UPGRADE_STAT` gebruikt `statPoints` i.p.v. `skillPoints` |
| `src/components/game/ProfileView.tsx` | Toon `statPoints` bij stat upgrade knoppen |
| `src/components/game/ResourcePopup.tsx` | Toon `statPoints` bij stat upgrade knoppen |
| `src/components/game/GameHeader.tsx` | Badge toont beide als beschikbaar |
| `src/components/game/profile/SkillTreePanel.tsx` | Blijft `skillPoints` gebruiken (ongewijzigd) |

### Migratie bestaande spelers
- Huidige `skillPoints` blijft behouden voor skill tree
- `statPoints` start op 0 (of optioneel: geef 1 per huidig level als compensatie)

