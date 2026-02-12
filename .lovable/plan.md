
# Gevangenis Bereikbaar Maken — Integratieplan

## Het Probleem
Na analyse van de code is duidelijk waarom je nooit gearresteerd wordt:

1. **Arrestatie kan alleen tijdens een politie-inval** — en die vereist heat > 60
2. **Heat verdampt te snel** — tot 20 punten afname per dag door safehouses, hacker, villa, karma, etc.
3. **Twee arrest-constanten bestaan maar worden NERGENS gebruikt**: `PRISON_ARREST_CHANCE_MISSION` (15%) en `PRISON_ARREST_CHANCE_HIGH_RISK` (25%) staan in constants.ts maar zijn nooit aangesloten
4. **Een inval verlaagt heat met -20**, waardoor je na een boete meteen weer onder de grens zakt

## Oplossingen

### 1. Arrestatiekans bij mislukte missies
Wanneer een missie faalt en de speler hoge heat heeft (>40), is er een kans op arrestatie. Dit maakt riskante missies echt riskant.

### 2. Arrestatiekans bij solo-operaties
Mislukte operaties (store robbery, pickpocket, etc.) kunnen leiden tot arrestatie als heat hoog genoeg is. Hoe gevaarlijker de operatie, hoe hoger de kans.

### 3. Arrestatiekans bij autodiefstal
Mislukte carjacks triggeren nu alleen heat — maar zouden ook tot arrestatie moeten leiden bij hoge heat.

### 4. Heat-decay verlagen
De huidige decay is te genereus. Aanpassingen:
- Server room bonus: 5 naar 3
- Safehouse max bonus in eigen district: 8 naar 5
- Inval heat-reductie: -20 naar -10

### 5. Raid-drempel verlagen
De drempel van heat > 60 is te hoog. Verlagen naar heat > 45 zorgt dat raids vaker voorkomen.

### 6. "Wanted Level" systeem
Bij heat > 80 krijgt de speler een "gezocht" status die extra arrestatiekansen toevoegt bij ELKE actie (handel, reizen tussen districten). Dit maakt hoge heat echt gevaarlijk.

### 7. Verraad door contacten leidt tot arrestatie
Wanneer een corrupt contact de speler verraadt, is er nu een directe kans op arrestatie in plaats van alleen heat-toename.

## Technische Wijzigingen

### `src/game/constants.ts`
- Raid heat-drempel verlagen: nieuwe constante `POLICE_RAID_HEAT_THRESHOLD = 45`
- Wanted-drempel: `WANTED_HEAT_THRESHOLD = 80`
- Wanted arrest-kans: `WANTED_ARREST_CHANCE = 0.10` (per actie)

### `src/game/engine.ts`
- **Heat decay nerfen**: server room 5 naar 3, safehouse cap verlagen, raid penalty -20 naar -10
- **Raid drempel**: `> 60` veranderen naar de nieuwe constante (45)
- **Missie-faal arrest**: bij mission fail + heat > 40, `PRISON_ARREST_CHANCE_MISSION` gebruiken
- **Operatie-faal arrest**: bij failed solo ops + heat > 40, kans op arrestatie
- **Wanted-check functie**: `checkWantedArrest()` die wordt aangeroepen bij trade, travel, operations

### `src/contexts/GameContext.tsx`
- Bij mislukte carjack: arrest-check toevoegen
- Bij TRADE acties met heat > 80: wanted-arrest-check
- Bij TRAVEL acties met heat > 80: wanted-arrest-check
- Bij contact-verraad: directe arrest-kans

### `src/components/game/GameHeader.tsx` (of HeatTile)
- "GEZOCHT" indicator tonen wanneer heat > 80
- Visuele pulserende waarschuwing dat elke actie risico draagt

## Balans-overzicht

| Situatie | Oud | Nieuw |
|---|---|---|
| Raid-drempel | heat > 60 | heat > 45 |
| Raid heat-reductie | -20 | -10 |
| Server room decay | -5/dag | -3/dag |
| Safehouse max decay | -8/dag | -5/dag |
| Missie-faal arrest | 0% | 15% (bij heat > 40) |
| Operatie-faal arrest | 0% | 15-25% (bij heat > 40) |
| Carjack-faal arrest | 0% | 20% (bij heat > 40) |
| Wanted (heat > 80) | n.v.t. | 10% per actie |
| Contact-verraad | alleen heat | 40% kans arrest |
