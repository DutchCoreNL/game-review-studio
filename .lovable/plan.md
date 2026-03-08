

# Auto Systeem Review — Bevindingen & Verbeteringen

## Gevonden Bugs

### 1. Rekat-kosten ontbreken voor prestige voertuigen (BUG)
`REKAT_COSTS` bevat alleen entries voor de 6 reguliere voertuigen. Prestige voertuigen (`noxreaper`, `obsidiancruiser`, `phantomgt`) en unieke voertuigen vallen terug op de default `5000` — veel te goedkoop voor auto's van €500K-€1.2M. 

**Fix**: Voeg rekat-kosten toe voor prestige en unieke voertuigen:
- `noxreaper`: €20.000
- `obsidiancruiser`: €25.000  
- `phantomgt`: €35.000
- Unieke voertuigen: €10.000-€15.000

### 2. Race winst negeert armor upgrade (MEDIUM)
Bij verlies verliest de speler 15-30% conditie, maar **armor upgrades worden niet meegenomen** in de conditieverlies-berekening. Een volledig gepantserd voertuig zou minder schade moeten lijden.

**Fix**: Pas `calculateRaceResult` aan zodat conditionLoss verminderd wordt met armor bonus.

### 3. Dealer "Deal van de Dag" koopt tegen basisprijzen (BUG)
De `DealerPanel` dispatcht `BUY_VEHICLE` bij het kopen van de "Deal van de Dag", maar `handleBuyVehicle` gebruikt altijd `v.cost` — de korting wordt niet doorgegeven. De speler betaalt de volle prijs.

**Fix**: Voeg een `discountedCost` parameter toe aan `BUY_VEHICLE` of maak een apart `BUY_DEALER_DEAL` action.

### 4. Trade-in kiest altijd eerste niet-starter voertuig (UX BUG)
In `DealerPanel`, bij inruilen, selecteert de confirm dialog automatisch het eerste niet-starter voertuig zonder de speler te laten kiezen. Als je 3 auto's hebt, kun je niet bepalen welke je inruilt.

**Fix**: Voeg een dropdown of selectielijst toe in de trade-in dialog zodat de speler kan kiezen welk voertuig wordt ingeruild.

### 5. VehicleComparePanel max waarden zijn hardcoded en te laag (MEDIUM)
De `max` waarden voor stat-bars zijn: storage=30, speed=8, armor=6, charm=20. Maar de Phantom GT heeft speed=10 en charm=35, en de Obsidian Cruiser heeft storage=35. Dit zorgt voor bars die over 100% gaan.

**Fix**: Bereken max dynamisch op basis van alle beschikbare voertuigen.

## Balancing Issues

### 6. Starter auto onverkoopbaar maar ook onbruikbaar na mid-game
De Toyo-Hata (cost=0, storage=5, speed=1) is onverkoopbaar en neemt een slot in de collectie. Het heeft geen nut na het kopen van een tweede auto. 

**Suggestie**: Laat de speler de starter auto "doneren" voor een kleine rep/XP bonus, of geef het een unieke perk (bijv. "onzichtbaar voor checkpoints" vanwege lage waarde).

### 7. Race NPC skill-ranges overlappen slecht
- Street: skill ≤5 → 3 NPCs (Eddie=3, Iron Mike=4, Nitro Nadia=5)
- Harbor: skill 3-7 → 5 NPCs (Eddie=3, Iron Mike=4, Nadia=5, Silk=6, El Diablo=7)
- Neon GP: skill ≥5 → 5 NPCs (Nadia=5, Silk=6, Diablo=7, Ghost=8, Turbo Tina=9)

Met een max player speed van ~10 (Phantom GT) + 3 (speed upgrade) + 2 (chauffeur) + 1.5 (racer) = 16.5 + random(0-4), vs Turbo Tina's 9 + random(0-3) = max 12, zijn Neon GP races met een top voertuig vrijwel onverliesbaar.

**Fix**: Voeg 2-3 sterkere NPCs toe (skill 10-12) en schaal NPC skill met race type.

### 8. Geen conditionverlies bij winst
Winnen kost 0% conditie. In werkelijkheid slijt racen altijd het voertuig. Dit maakt reparatie bijna nooit nodig bij goede spelers.

**Fix**: Voeg een klein conditionverlies toe bij winst (3-8%), afhankelijk van race type.

## Implementatieplan

| # | Fix | Prioriteit | Bestanden |
|---|-----|-----------|-----------|
| 1 | Rekat-kosten prestige/unieke voertuigen | Hoog | `constants.ts` |
| 2 | Armor vermindert race conditionverlies | Medium | `racing.ts` |
| 3 | Dealer Deal korting fix | Hoog | `DealerPanel.tsx`, `vehicleHandlers.ts`, reducer types |
| 4 | Trade-in voertuig selectie | Medium | `DealerPanel.tsx` |
| 5 | Compare panel max waarden dynamisch | Laag | `VehicleComparePanel.tsx` |
| 6 | Sterkere race NPCs + winst conditionverlies | Medium | `constants.ts`, `racing.ts` |

