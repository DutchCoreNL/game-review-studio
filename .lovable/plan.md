
# Endgame Bedrijven Toevoegen

## Probleem
De huidige bedrijven genereren maximaal **€1.700/dag** aan inkomen, terwijl corruptiekosten alleen al oplopen tot **~€4.600/dag**. Endgame-spelers hebben onvoldoende passief inkomen om hun imperium draaiende te houden.

## Huidige bedrijven
| Bedrijf | Kosten | Inkomen/dag | Witwas/dag |
|---------|--------|-------------|------------|
| Ristorante Nero | €10.000 | €400 | €300 |
| Club Paradiso | €25.000 | €800 | €600 |
| Tony's Autogarage | €15.000 | €500 | €400 |
| Kogelfabriek | €35.000 | €0 | €0 |

**Totaal: €1.700/dag inkomen, €1.300/dag witwassen**

## Nieuwe bedrijven (endgame)

| Bedrijf | Kosten | Inkomen/dag | Witwas/dag | Vereiste | Beschrijving |
|---------|--------|-------------|------------|----------|--------------|
| Havenpakhuis Import/Export | €50.000 | €1.200 | €800 | Port Nero bezit | Legale import als dekmantel voor smokkelwaar |
| Goudhandel De Kroon | €75.000 | €1.500 | €1.200 | Crown Heights bezit | Edelmetaal en juwelen — perfecte witwasoperatie |
| Neon Escort Agency | €60.000 | €1.800 | €500 | Neon Strip bezit, rep 200 | Exclusieve escortservice met rijke klanten |
| Bouwbedrijf IJzerwerk | €80.000 | €1.000 | €1.500 | Iron Borough bezit | Aannemersbedrijf dat grote sommen witwast via nepfacturen |
| Cryptobeurs NoxCoin | €100.000 | €2.500 | €2.000 | Rep 300, dag 30+ | Cryptoplatform — hoge opbrengst, digitaal witwassen |
| Hotel Noxhaven Grand | €150.000 | €3.000 | €2.500 | Rep 400, 3+ bedrijven | Het kroonjuweel — luxehotel met VIP-gasten en maximale dekking |

**Met alle nieuwe bedrijven erbij: max €12.400/dag inkomen, €8.800/dag witwassen**

## Technische wijzigingen

### `src/game/types.ts`
- `Business` interface uitbreiden met optionele velden:
  - `reqDistrict?: DistrictId` — vereist bezit van een district
  - `reqRep?: number` — minimale reputatie
  - `reqDay?: number` — minimale dag
  - `reqBusinessCount?: number` — minimaal aantal andere bedrijven

### `src/game/constants.ts`
- 6 nieuwe bedrijven toevoegen aan de `BUSINESSES` array met de bovenstaande waarden en vereisten

### `src/components/game/ImperiumView.tsx` (BusinessPanel)
- Vereisten tonen bij vergrendelde bedrijven (district, rep, dag)
- Vergrendelde bedrijven worden getoond maar niet koopbaar, met uitleg waarom
- Bedrijven sorteren: bezit bovenaan, dan beschikbaar, dan vergrendeld

### `src/contexts/GameContext.tsx`
- `BUY_BUSINESS` action uitbreiden met validatie van de nieuwe vereisten (district, rep, dag, businessCount)

### `src/assets/items/index.ts`
- Geen nieuwe afbeeldingen nodig; bedrijven gebruiken het `Store` icoon uit de bestaande UI
