

# Auto Crusher & Kogelfabriek

## Overzicht
Twee nieuwe manieren om aan kogels te komen:
1. **Auto Crusher**: Sloop gestolen auto's in de Chop Shop voor munitie (in plaats van verkopen)
2. **Kogelfabriek**: Een koopbaar gebouw dat dagelijks automatisch kogels produceert

---

## 1. Auto Crusher

### Concept
Een nieuwe optie in de Chop Shop (CarDetail view) waarmee je een gestolen auto kunt slopen voor kogels. De auto hoeft **niet** omgekat te zijn (je verwerkt het hele ding tot schroot en metaal). De opbrengst in kogels hangt af van de zeldzaamheid en conditie van de auto.

### Kogels per auto
- **Common**: 3-5 kogels
- **Uncommon**: 5-8 kogels
- **Rare**: 8-12 kogels
- **Exotic**: 12-18 kogels
- Conditie-bonus: bij 80%+ conditie krijg je +2 extra kogels
- Upgrades op de auto geven elk +1 extra kogel

### Gameplay overwegingen
- Geen omkat-vereiste: je kunt een "hot" auto direct slopen (handig als je geen geld hebt voor omkatten)
- Trade-off: slopen levert minder waarde op dan verkopen, maar je krijgt schaarse munitie
- Kleine XP-beloning (10 XP) voor het slopen

### UI
- Nieuwe "CRUSHER" knop in de CarDetail view (naast Verkopen/Zelf Gebruiken)
- Crusher is altijd beschikbaar (ook zonder omkatten)
- Icoon: een hamer of zaag
- Toont het verwachte aantal kogels voor je bevestigt
- Toast: "BMW X5 gesloopt! +8 kogels verkregen"

---

## 2. Kogelfabriek

### Concept
Een nieuw koopbaar gebouw ("Kogelfabriek") in de BEDRIJVEN-tab van het Imperium scherm. Na aankoop produceert het dagelijks automatisch een aantal kogels tijdens het Night Report.

### Specificaties
- **Naam**: Kogelfabriek
- **Kosten**: 35.000 euro
- **Dagelijkse productie**: 3 kogels/dag (basis)
- **Locatie**: Iron Borough thema (industrieel)
- **Night Report**: Toont "Kogelfabriek productie: +X kogels" als apart regelitem
- **Max ammo cap**: Blijft op 99 (productie stopt niet, maar ammo wordt gecapped)

### Balans
- De prijs (35.000 euro) is significant maar haalbaar in mid-game
- 3 kogels/dag is genoeg om basis-gevechten te ondersteunen maar niet genoeg voor dagelijkse huurmoorden
- Combineert goed met de crusher als extra bron van kogels

---

## Technische Aanpak

### Bestanden die worden aangepast:

**`src/game/constants.ts`**:
- Toevoegen van `CRUSHER_AMMO_REWARDS` tabel (ammo-opbrengst per rarity)
- Toevoegen van `AMMO_FACTORY` definitie aan de `BUSINESSES` array (id: 'ammo_factory', name: 'Kogelfabriek', cost: 35000, income: 0, clean: 0, desc: 'Produceert dagelijks 3 kogels.')

**`src/game/types.ts`**:
- Toevoegen van `ammoFactoryProduction` veld aan `NightReportData` interface (optioneel number)

**`src/game/engine.ts`**:
- In `endTurn`: Na business income, check of speler 'ammo_factory' bezit. Zo ja, voeg 3 kogels toe (capped op 99) en noteer in report
- Het `NightReportData` veld `ammoFactoryProduction` vullen

**`src/contexts/GameContext.tsx`**:
- Nieuwe action: `CRUSH_CAR` met `carId: string`
- Reducer-logica: auto verwijderen uit `stolenCars`, kogels berekenen op basis van rarity/conditie/upgrades, toevoegen aan `state.ammo` (max 99), XP geven, toast-info retourneren

**`src/components/game/ChopShopView.tsx`**:
- In `CarDetail`: Nieuwe "CRUSHER" sectie toevoegen onder de bestaande acties
- Crusher-knop met hamer-icoon, toont verwacht aantal kogels
- Beschikbaar ongeacht omkat-status (geen omkat nodig)
- Bevestigingstoast na het slopen

**`src/components/game/ImperiumView.tsx`**:
- De Kogelfabriek verschijnt automatisch in de BusinessPanel omdat deze aan de `BUSINESSES` array wordt toegevoegd
- Eventueel een extra icoon/badge voor "produceert kogels" i.p.v. geld

**`src/components/game/NightReport.tsx`**:
- Nieuwe regel tonen als `ammoFactoryProduction > 0`: "Kogelfabriek: +X kogels"

### Rendering in Chop Shop (CarDetail)
De crusher-sectie komt onder de bestaande "Sell/Use" acties en is altijd zichtbaar:

```text
+------------------------------------------+
|  CRUSHER                                 |
|  Sloop deze auto voor munitie            |
|  Verwacht: ~8 kogels                     |
|  [SLOPEN - Hammer icon]                  |
+------------------------------------------+
```

### Balans samenvatting
- Crusher geeft minder totale waarde dan verkopen, maar biedt een alternatieve resource
- Kogelfabriek is een late early-game / mid-game investering
- Samen zorgen crusher + fabriek + ammo shop voor drie verschillende manieren om aan kogels te komen, elk met eigen trade-offs

