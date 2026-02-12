
# Auto-systeem Uitbreiding: Straatracen, Unieke Voertuigen & Autohandel

## Overzicht
Drie nieuwe systemen die het voertuig-gameplay flink uitbreiden: illegale straatracen voor snelle winst, unieke beloningsvoertuigen als trofees, en een dynamisch dealerschap om voertuigen te verhandelen.

---

## 1. Illegale Straatracen

Een mini-game waarbij je met je actieve voertuig racet tegen NPC-tegenstanders voor geld, reputatie en heat.

### Hoe het werkt
- Nieuwe sub-tab **"RACES"** in het Imperium-scherm (naast Garage)
- 3 race-types met oplopende moeilijkheid:
  - **Straatrace** (inzet €1.000-5.000, heat +5)
  - **Havenrun** (inzet €5.000-15.000, heat +12, vereist: Port Nero)
  - **Neon Grand Prix** (inzet €15.000-50.000, heat +20, vereist: Neon Strip, dag 20+)
- Winstkans gebaseerd op: voertuig speed + upgrades + crew Chauffeur bonus + willekeur
- Beloningen: inzet x1.5-3x, +rep, +XP
- Risico bij verlies: inzet kwijt, kans op voertuigschade (-15 tot -30 conditie)
- Cooldown: 1 race per dag (reset bij END_TURN)
- NPC-tegenstanders met namen en eigen voertuigen voor flavor

### Technische wijzigingen
- **`src/game/types.ts`**: Nieuw `RaceType` en `RaceDef` type, `raceUsedToday: boolean` in GameState
- **`src/game/constants.ts`**: `RACES` array met 3 races + NPC-namen
- **`src/game/racing.ts`**: Nieuw bestand — `calculateRaceResult()` functie
- **`src/contexts/GameContext.tsx`**: `START_RACE` action
- **`src/components/game/garage/RacingPanel.tsx`**: Nieuw UI-component met race-selectie, NPC-tegenstander, inzet-slider en resultaat-animatie
- **`src/components/game/garage/GarageView.tsx`**: RacingPanel importeren en tonen onder de bestaande secties

---

## 2. Unieke Beloningsvoertuigen

Speciale voertuigen die niet te koop zijn maar alleen verdiend worden via gameplay-mijlpalen.

### Voertuigen (4 stuks)
| Voertuig | Hoe te verkrijgen | Bonus |
|----------|-------------------|-------|
| **Decker's Phantom** | Versla Decker (final boss) | +25 charm, +4 armor, +3 speed |
| **Cartel Bulldozer** | Verover alle 3 facties | +40 opslag, +5 armor, -2 speed |
| **Nemesis Trophy Car** | Versla 3 nemesis-generaties | +6 speed, +10 charm, heat daalt 2x sneller |
| **Gouden Klassiek** | Bezit alle 6 reguliere voertuigen | +15 charm, +3 speed, +3 armor, +20 opslag |

### Technische wijzigingen
- **`src/game/constants.ts`**: `UNIQUE_VEHICLES` array (apart van `VEHICLES`) met unlockcondities
- **`src/game/types.ts`**: `UniqueVehicle` type met `unlockCondition` beschrijving
- **`src/contexts/GameContext.tsx`**: Check bij `END_TURN` / `RESOLVE_FINAL_BOSS` etc. of een unlock getriggerd moet worden; voegt ze toe aan `ownedVehicles` met een speciaal vlag
- **`src/components/game/garage/GarageView.tsx`**: Sectie "Unieke Voertuigen" onderaan met vergrendelde items (silhouet + vereiste) en ontgrendelde items met gouden rand
- **`src/assets/items/index.ts`**: Mapping voor de 4 unieke voertuigen (hergebruik bestaande placeholder-stijl)

---

## 3. Autohandel / Dealerschap

Een dynamisch dealerschap waar voertuigprijzen fluctueren en je voertuigen kunt doorverkopen.

### Hoe het werkt
- Nieuwe sub-tab **"DEALER"** in het Imperium-scherm
- **Verkopen**: Eigen voertuigen verkopen voor 40-70% van de aankoopprijs (afhankelijk van conditie en upgrades)
- **Dynamische prijzen**: Voertuigprijzen fluctueren per dag met -10% tot +15% (net als handelsgoederenprijzen)
- **Speciale deals**: Elke 5 dagen verschijnt er een willekeurig voertuig met 20-30% korting (24 uur geldig)
- **Trade-in systeem**: Bij aankoop van een nieuw voertuig kun je je huidige inruilen voor een betere prijs dan los verkopen (+10% trade-in bonus)

### Technische wijzigingen
- **`src/game/types.ts`**: `vehiclePriceModifiers: Record<string, number>` en `dealerDeal: { vehicleId: string; discount: number; expiresDay: number } | null` in GameState
- **`src/game/constants.ts`**: `VEHICLE_SELL_RATIO = 0.55` base sell-percentage
- **`src/contexts/GameContext.tsx`**: 
  - `SELL_VEHICLE` action (verwijdert voertuig, geeft geld, kan niet actieve als enige verkopen)
  - `TRADE_IN_VEHICLE` action (verkoopt oud + koopt nieuw in 1 transactie)
  - Prijsfluctuatie-logica in `END_TURN`
  - Dealer-deal generatie elke 5 dagen
- **`src/components/game/garage/DealerPanel.tsx`**: Nieuw component met:
  - Huidige voertuigen met verkoopprijs en "VERKOOP" knop
  - Te koop staande voertuigen met dynamische prijzen (groen/rood pijlen)
  - Actieve deal-van-de-dag met timer
  - Trade-in optie bij aankoop
- **`src/components/game/ImperiumView.tsx`**: Nieuwe sub-tab "DEALER" toevoegen

---

## Samenvatting nieuwe bestanden
| Bestand | Doel |
|---------|------|
| `src/game/racing.ts` | Race-logica en resultaatberekening |
| `src/components/game/garage/RacingPanel.tsx` | Race UI-component |
| `src/components/game/garage/DealerPanel.tsx` | Dealerschap UI-component |

## Samenvatting aangepaste bestanden
| Bestand | Wijziging |
|---------|-----------|
| `src/game/types.ts` | Nieuwe types voor races, unieke voertuigen, dealer state |
| `src/game/constants.ts` | Race-definities, unieke voertuigen, dealer-constanten |
| `src/contexts/GameContext.tsx` | Actions: START_RACE, SELL_VEHICLE, TRADE_IN_VEHICLE + unlock checks + prijsfluctuatie |
| `src/components/game/garage/GarageView.tsx` | RacingPanel + Unieke Voertuigen sectie integreren |
| `src/components/game/ImperiumView.tsx` | Sub-tabs "RACES" en "DEALER" toevoegen |
| `src/assets/items/index.ts` | Placeholder-mappings voor unieke voertuigen |
