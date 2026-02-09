
# Nemesis Systeem Verbetering: Realistischer & Gebalanceerd

## Huidige Problemen

1. **Power kan oneindig groeien** -- de nemesis power schaalt met `day + level*2 + defeated*8`, wat na verloop van tijd onrealistisch hoog wordt en de speler kan overtreffen
2. **Terugkeer na 5 dagen is onrealistisch** -- na "verslagen" te zijn komt de nemesis altijd na exact 5 dagen terug, sterker dan ooit, wat voelt als een oneindige loop
3. **HP schaalt ook oneindig** -- `maxHp = 80 + defeated*30 + day*2` wordt al snel absurd hoog
4. **Geen permanente dood mogelijk** -- er is geen manier om definitief van de nemesis af te komen

## Voorgestelde Verbeteringen

### 1. Power Cap: Nemesis Kan Jouw Stats Niet Overtreffen
- Nemesis power wordt begrensd op basis van de speler: `max(playerLevel * 3 + totalStats)` 
- Een "power ratio" zorgt ervoor dat de nemesis altijd uitdagend is maar nooit onverslaanbaar (~80-95% van speler's kracht)
- `enemyAttack` in gevechten wordt ook gecapped relatief aan speler's muscle

### 2. Realistisch Terugkeer-Systeem (Vervangers in plaats van Resurrectie)
- **Eerste keer verslagen**: nemesis is PERMANENT dood
- **Na 10-15 dagen**: een **opvolger** verschijnt (nieuwe naam, lager power level, andere locatie)
- Opvolger begint op ~60% van de vorige nemesis' power
- Na 3 opvolgers verslagen: langere pauze (20-25 dagen) voordat een nieuwe verschijnt
- Maximaal 5 unieke nemesis-rivalen in het hele spel (daarna is de dreiging "voorgoed" verdwenen, tenzij free play)

### 3. Nemesis Leveling: Groeit Met Je Mee (Maar Niet Voorbij Je)
- Power groeit geleidelijk per dag (+0.5) maar met een plafond
- MaxHP groeit minder agressief: `base 80 + generatie*15` (niet meer `day*2`)
- Nemesis "leert" van eerdere gevechten: als speler veel "heavy" attacks gebruikte, krijgt volgende nemesis meer dodge

### 4. Nieuwe NemesisState Velden
- `generation`: welke opvolger dit is (1 = origineel, 2 = eerste opvolger, etc.)
- `alive`: of de nemesis actief is
- `nextSpawnDay`: wanneer de volgende opvolger verschijnt
- `maxGeneration`: maximaal 5

## Technische Details

### `src/game/types.ts`
- `NemesisState` uitbreiden met:
  - `generation: number` (1-5)
  - `alive: boolean`
  - `nextSpawnDay: number` (dag waarop opvolger verschijnt)
  - `defeatedNames: string[]` (lijst van verslagen nemesis-namen voor flavor)

### `src/game/newFeatures.ts`
- **`updateNemesis()`**: 
  - Als `alive === false`: check of `day >= nextSpawnDay`, zo ja spawn opvolger
  - Power scaling: `min(playerPower * 0.85, basePower + day * 0.5)`
  - Verwijder oneindige `power + 10` bij terugkeer
- **`resolveNemesisDefeat()`**:
  - Zet `alive = false`
  - Bereken `nextSpawnDay = day + 10 + generation * 3` (langer naarmate meer verslagen)
  - Als `generation >= 5`: geen nieuwe meer (of alleen in free play)
  - Grotere beloningen per generatie
- **`startNemesisCombat()`**:
  - `enemyAttack` gecapped: `min(huidige waarde, playerMuscle * 2 + 10)`
  - MaxHP gecapped op `80 + generation * 20`

### `src/game/constants.ts`
- `createInitialNemesis()`: voeg `generation: 1`, `alive: true`, `nextSpawnDay: 0`, `defeatedNames: []` toe

### `src/contexts/GameContext.tsx`
- Migratie voor bestaande saves: voeg ontbrekende velden toe aan nemesis state

### `src/components/game/map/NemesisInfo.tsx`
- Toon generatie-info ("Rivaal #2: [naam]")
- Als nemesis dood is en opvolger onderweg: toon countdown
- Als alle 5 verslagen: toon "De onderwereld is rustig..." bericht

### `src/components/game/NightReport.tsx`
- Aanpassen van nemesis-actie tekst voor "geen actieve nemesis" scenario

## Samenvatting Balans

| Aspect | Oud | Nieuw |
|--------|-----|-------|
| Power cap | Geen (oneindig) | 85% van speler's kracht |
| HP na verslagen | +30 per keer + day*2 | 80 + generatie*20 (max ~180) |
| Terugkeer | 5 dagen, zelfde persoon | 10-20 dagen, nieuwe opvolger |
| Max rivalen | Oneindig | 5 (daarna rust) |
| Enemy attack | Schaalt oneindig | Gecapped op speler's muscle |
