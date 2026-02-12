

# Verslavend Gameplay: 4 Engagement-Systemen

## Overzicht

We voegen vier psychologische "hooks" toe die spelers motiveren om door te blijven spelen. De streak multiplier is weggelaten zoals gevraagd.

---

## 1. Cliffhanger-systeem in het Night Report

Na het nachtrapport verschijnt een **"Morgen..."** sectie die hints geeft over aankomende gebeurtenissen.

**Voorbeelden:**
- "Een mysterieuze koper arriveert in Port Nero..." (als er dure goederen in inventory zitten)
- "Je Nemesis is gezien in Crown Heights..." (als nemesis actief is)
- "De politie plant iets..." (bij hoge heat)
- "Een zeldzame deal komt eraan..." (willekeurig)
- "Een veiling sluit morgen..." (als er actieve veilingen zijn)

**Visueel:** Mysterieus kaartje met pulserende "..." animatie onderaan het Night Report, net voor de "DOORGAAN" knop.

---

## 2. Progress Bars bij Unlock-doelen

Overal in de UI tonen we visueel hoever de speler is naar het volgende doel.

**Locaties:**
- **Header**: Mini XP-balk (2px hoog) onder het level
- **Garage (Dealer)**: voortgang naar volgende voertuig (geld vs. kosten)
- **Imperium**: voortgang naar volgende district (rep/geld)

Geen nieuwe state nodig -- alles wordt berekend uit bestaande data.

---

## 3. Gouden Uur Event

Een willekeurig "Golden Hour" event dat 3 beurten duurt.

**Mechanisme:**
- 8% kans per beurt (na dag 5) dat een Gouden Uur begint
- Tijdens Gouden Uur: alle inkomsten x2, maar heat-gain ook x2
- Na afloop: samenvatting in het Night Report

**Visueel:**
- Gouden gloed/rand rond de header wanneer actief
- Pulserende "GOUDEN UUR" badge met resterende beurten
- Goud-thema melding in Night Report

---

## 4. Near-Miss Feedback

Bij mislukte acties tonen we hoe dichtbij succes was.

**Waar:**
- **Solo Operaties** (`performSoloOp`): Bereken verschil tussen roll en slagingskans, toon als percentage: "Je had 62% kans. Upgrade je Muscle voor betere odds."
- **Gevechten** (`CombatView`): Bij verlies toon resterende vijand-HP: "Vijand had nog 8 HP! Sterkere wapens hadden het verschil gemaakt."
- **Auto-diefstal** (`ChopShopView`): Bij mislukte diefstal toon skill-tekort: "Je Brains is 2 punten te laag voor deze auto."

Near-miss data wordt berekend in bestaande faal-paden en getoond als extra tekstregel.

---

## Technische Wijzigingen

### Nieuw bestand:
| Bestand | Doel |
|---------|------|
| `src/game/cliffhangers.ts` | Cliffhanger-generatie logica: `generateCliffhanger(state): string` functie die op basis van game state een contextbewuste teaser genereert |

### Aangepaste bestanden:

| Bestand | Wijziging |
|---------|-----------|
| **`src/game/types.ts`** | Nieuwe velden in `GameState`: `goldenHour: { turnsLeft: number } or null`. Nieuw veld in `NightReportData`: `cliffhanger?: string`, `goldenHourBonus?: number`, `goldenHourStarted?: boolean`, `goldenHourEnded?: boolean`. Near-miss veld in soloOp return type: `nearMiss?: string` |
| **`src/game/constants.ts`** | `createInitialState` uitbreiden: `goldenHour: null` |
| **`src/game/engine.ts`** | In `endTurn`: golden hour activatie (8% kans na dag 5), golden hour afloop (turnsLeft--), inkomsten x2 modifier, heat x2 modifier, cliffhanger-generatie via `generateCliffhanger()`. In `performSoloOp`: near-miss string toevoegen aan return bij falen (verschil tussen roll en kans) |
| **`src/contexts/GameContext.tsx`** | `SOLO_OP` case: near-miss message doorgeven aan toast. Migratie: `goldenHour` default toevoegen bij laden oude saves |
| **`src/components/game/GameHeader.tsx`** | XP mini-balk (2px `Progress` component onder level). Golden hour badge met pulserende gouden gloed wanneer actief |
| **`src/components/game/NightReport.tsx`** | Cliffhanger-sectie toevoegen net voor "DOORGAAN" knop. Golden hour start/eind melding. Golden hour inkomsten-bonus tonen |
| **`src/components/game/OperationsView.tsx`** | Near-miss feedback tonen bij mislukte solo ops (toast met tip) |
| **`src/components/game/CombatView.tsx`** | Bij verlies: toon resterende vijand-HP als near-miss feedback |
| **`src/components/game/ChopShopView.tsx`** | Bij mislukte diefstal: toon skill-tekort als near-miss feedback |
| **`src/components/game/garage/DealerPanel.tsx`** | Progress bar per voertuig: `state.money / voertuigKosten * 100` |

### Wat er NIET verandert:
- Bestaande game-balans blijft intact (golden hour multipliers zijn tijdelijk en zeldzaam)
- Alle huidige UI en navigatie blijft identiek
- Geen nieuwe dependencies nodig
- Near-miss feedback is puur visueel, geen gameplay-impact

