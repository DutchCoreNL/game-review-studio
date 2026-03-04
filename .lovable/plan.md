

# Verhaalcampagne Systeem — Handmatig & Chapter-based

## Huidige situatie
Verhaalbogen triggeren **automatisch** per beurt op basis van dag/reputatie-condities. Stappen vorderen met een cooldown van X dagen. De speler heeft geen controle over wanneer het verhaal speelt.

## Nieuw systeem

### Concept
Een apart **Campagne-menu** met een knop in de hoofdnavigatie. Het verhaal is opgedeeld in **Chapters** (hoofdstukken), elk met meerdere **missies** en een **eindboss**. De speler kiest zelf wanneer hij een missie start — volledig los van de dagelijkse beurt-cyclus.

### Structuur

```text
CAMPAGNE
├── Chapter 1: De Schaduwen van Noxhaven (3 missies + boss)
├── Chapter 2: Het Syndicaat (4 missies + boss)  [unlock na Ch.1]
├── Chapter 3: Bloed & Eer (4 missies + boss)    [unlock na Ch.2]
├── Chapter 4: De Machtsgreep (3 missies + boss)  [unlock na Ch.3]
└── Chapter 5: Eindspel (2 missies + final boss)  [unlock na Ch.4]
```

### Boss Systeem
- Elke chapter eindigt met een **unieke boss** (bijv. corrupte politiechef, rivaliserende maffiabaas)
- Bosses zijn **herhaalbaar** — bij elke overwinning dropt betere loot
- Boss moeilijkheid schaalt met speler-level
- Eerste kill: gegarandeerd **Rare+** wapen uit het procedurele systeem
- Herhaalde kills: kans op **Epic/Legendary** wapens + exclusieve boss-only onderdelen

### Wapen Loot Integratie
- Missies droppen Common-Rare wapens
- Bosses droppen Rare-Legendary wapens
- Elk chapter introduceert **chapter-exclusieve** wapen-onderdelen (bijv. Chapter 3 ontgrendelt "Drakon" merk-drops)
- Boss-only accessoires (bijv. "Vasari's Grip" — uniek accessoire alleen van Ch.2 boss)

### Technische aanpak

**Nieuw bestand: `src/game/campaign.ts`**
- Chapter/missie definities, boss-stats, unlock-logica
- `CampaignState` tracking (welke chapters/missies voltooid, boss kill counts)
- Boss encounter generator met scaling

**Nieuw bestand: `src/components/game/campaign/CampaignView.tsx`**
- Overzicht van alle chapters met unlock-status
- Missie-selectie per chapter
- Boss-fight launcher

**Nieuw bestand: `src/components/game/campaign/BossFight.tsx`**
- Speciaal gevechtsscherm voor bosses (uitgebreider dan normaal combat)
- Boss HP bar met fases, unieke aanvallen
- Loot reveal na overwinning

**Wijzigingen:**
| Bestand | Wijziging |
|---|---|
| `src/game/types.ts` | `CampaignState` in GameState |
| `src/game/constants.ts` | Default campaign state |
| `src/contexts/GameContext.tsx` | Campaign actions, verwijder automatische arc triggers |
| `src/components/game/GameLayout.tsx` | Campaign knop in navigatie |
| `src/game/weaponGenerator.ts` | Boss-only onderdelen en chapter-locked drops |
| `src/game/combatLoot.ts` | Boss loot tabellen |

**Bestaande arcs migratie:**
- De 3 huidige arcs (Informant, Erfenis, Rivaal) worden omgebouwd naar missies binnen chapters
- `checkArcTriggers` en `checkArcProgression` worden verwijderd uit de beurt-cyclus
- Backward-compatible: bestaande saves behouden voortgang

### Extra ideeën
- **Chapter Rewards**: voltooien van een heel chapter geeft een permanente bonus (bijv. +5% crit, unlock van een nieuw district)
- **Moeilijkheidsgraden**: Normal / Hard / Nightmare per chapter voor betere loot
- **Boss Leaderboard**: snelste kill-time tracking
- **Verhaalkeuzegevolgen**: keuzes in missies beïnvloeden welke variant van de boss je tegenkomt (zwakkere maar snellere variant vs. tankier maar tragere)

