

## Analyse: Huidige verkrijgbaarheid van arsenaal

**Wat er nu is:**
- Combat loot drops (wapens 5-60% kans, gear 3-50% kans, afhankelijk van rating/boss)
- Unique weapons van campaign bosses (chapter 6-8)
- Upgrade/Fusie/Mod swap (verbetering van bestaand spul)
- Legacy gear shop (statische items — zou vervangen moeten zijn)

**Wat ontbreekt — er is geen gestructureerd acquisitiesysteem:**
- Geen shop voor procedureel gegenereerde wapens/gear
- Geen dagelijkse/wekelijkse beloningen
- Geen crafting of materialen
- Geen garantie-mechanisme (pity system)
- Story arcs, district stories en gang arcs geven alleen geld/rep, nooit gear
- Geen manier om gericht te farmen voor specifiek type equipment

---

## Plan: Arsenaal Acquisitie Systeem

### 1. Zwarte Markt (Procedurele Shop)
Nieuw bestand `src/game/blackMarket.ts`:
- Roulerende voorraad van 4-6 procedurele wapens + gear, ververst elke 3 in-game dagen
- Prijzen op basis van rarity en level (2-3x sellValue)
- Eén "featured item" slot met gegarandeerd rare+ kwaliteit
- Koop met geld of dirty money (dirty money = 20% korting)

### 2. Daily Reward Systeem
Nieuw bestand `src/game/dailyRewards.ts`:
- 7-daags login-beloningscyclus met escalerende rewards
- Dag 1-3: geld/ammo, Dag 4-5: random gear, Dag 6: rare+ wapen, Dag 7: epic crate
- Streak reset als je een dag mist
- UI: popup bij eerste actie van de dag

### 3. Loot Crates / Kisten
Toevoeging aan bestaand systeem:
- **Bronze Kist** (€5.000): common-rare pool
- **Zilver Kist** (€15.000): uncommon-epic pool  
- **Gouden Kist** (€40.000): rare-legendary pool
- Elke kist bevat 1 wapen OF 1 gear item
- **Pity systeem**: na 10 kisten zonder epic+ = gegarandeerd epic

### 4. Story & Mission Gear Rewards
Uitbreiding van bestaande systemen:
- Campaign chapter completions → gegarandeerde gear reward (naast de bestaande bonussen)
- Story arcs (completionReward) → kans op procedureel wapen/gear
- District stories → district-thematische gear (bijv. Port = marine-themed armor)
- Gang arc milestones → gang-branded wapens

### 5. Crafting / Salvage Systeem
Nieuw bestand `src/game/salvage.ts`:
- **Ontmantelen**: wapens/gear afbreken voor **onderdelen** (scrap)
- Common = 1 scrap, uncommon = 3, rare = 8, epic = 20, legendary = 50
- **Crafting recepten**: 
  - 15 scrap → random rare wapen/gear
  - 40 scrap → random epic wapen/gear
  - 100 scrap → kies type (armor/gadget/wapen) + gegarandeerd epic+
- Geeft een zinvol alternatief voor bulk-sell

### 6. Combat Streak & Achievement Rewards
- Combat win-streak milestones (5, 10, 25 wins) → gegarandeerde drops
- Specifieke achievements → unieke gear (bijv. "100 kills" → speciale armor)
- Boss herhalingen (re-fight) → kleine kans op unique weapon als je die nog niet hebt

---

## Technisch overzicht

| Component | Bestand | Wijziging |
|-----------|---------|-----------|
| Zwarte Markt logica | `src/game/blackMarket.ts` | Nieuw |
| Zwarte Markt UI | `src/components/game/shop/BlackMarketView.tsx` | Nieuw |
| Daily Rewards logica | `src/game/dailyRewards.ts` | Nieuw |
| Daily Rewards UI | `src/components/game/DailyRewardPopup.tsx` | Nieuw |
| Loot Crates | `src/game/lootCrates.ts` | Nieuw |
| Loot Crates UI | Integratie in BlackMarketView | — |
| Salvage/Crafting | `src/game/salvage.ts` | Nieuw |
| Salvage UI | `src/components/game/crafting/SalvageView.tsx` | Nieuw |
| Story gear rewards | `src/game/campaign.ts`, `storyArcs.ts`, `districtStories.ts` | Uitbreiding completionReward |
| Reducer actions | `src/contexts/GameContext.tsx` | Nieuwe actions |
| State uitbreiding | `src/game/types.ts`, `constants.ts` | Nieuwe velden |
| Navigatie | Sidebar componenten | Zwarte Markt + Crafting links |

Alle wijzigingen zijn client-side, geen database migraties nodig. Het `GameState` type krijgt nieuwe velden: `blackMarketStock`, `blackMarketRefreshDay`, `dailyRewardDay`, `dailyRewardStreak`, `scrapMaterials`, `pityCounter`, `lootCratesPurchased`.

