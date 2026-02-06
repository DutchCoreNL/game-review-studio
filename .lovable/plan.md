

# 7 Nieuwe Features voor Noxhaven

Dit plan beschrijft de implementatie van zeven nieuwe systemen die het spel aanzienlijk uitbreiden. De features zijn geordend van onafhankelijk naar afhankelijk, zodat ze stapsgewijs gebouwd kunnen worden.

---

## 1. Weersysteem (Feature #14)

Het spel krijgt een dag/nacht + weercyclus die de hele gameplay beinvloedt.

### Hoe het werkt

Elk BEGIN van een nieuwe dag wordt een weerstype bepaald (3-daagse cyclus):

| Weer | Effect | Visueel |
|------|--------|---------|
| **Helder** | Standaard gameplay | Geen overlay |
| **Regen** | -5 Heat/dag, -10% handelsvolume, politie minder actief | Regen-animatie op kaart |
| **Mist** | +15% smokkel succes, +10% missie slagingskans, minder map events | Mist-overlay op kaart |
| **Hittegolf** | +3 Heat/dag, +20% marktprijzen, crew verliest 5 HP/dag | Rode gloed |
| **Storm** | Geen reizen mogelijk (gratis), dubbele fabriek-output, casino gesloten | Bliksem-animatie |

Het weerpictogram verschijnt in de GameHeader naast de dag-indicator.

### Technische aanpassingen

- Nieuw type `WeatherType` en veld `weather: WeatherType` in GameState
- Functie `generateWeather()` in engine.ts, aangeroepen bij `endTurn`
- Weather-effecten integreren in `endTurn`, `performTrade`, reiskosten
- Weer-indicator in GameHeader met icoon (Sun, CloudRain, CloudFog, Thermometer, CloudLightning)
- Subtiele visuele overlay op de CityMap component

---

## 2. District-Specifieke Reputatie (Feature #15)

In plaats van een enkele globale reputatie krijgt elk district zijn eigen reputatie-score.

### Hoe het werkt

- Elke actie in een district (handelen, missies, gevechten) beinvloedt de lokale reputatie
- District-reputatie ontgrendelt unieke voordelen per district:

| District | Reputatie Bonus |
|----------|----------------|
| **Port Nero** | 25+: -10% smokkelrisico. 50+: Extra opslagruimte. 75+: Exclusieve havencontracten |
| **Crown Heights** | 25+: Betere marktinformatie. 50+: VIP casino toegang. 75+: Penthouse safehouse |
| **Iron Borough** | 25+: Goedkopere crew healing. 50+: Gratis voertuig reparaties. 75+: Fabriek productie bonus |
| **Lowrise** | 25+: Goedkopere solo ops. 50+: Straatinformanten. 75+: Ongrijpbaar (heat cap -20) |
| **Neon Strip** | 25+: Casino bonus. 50+: Betere witwas rates. 75+: VIP netwerk (charm +3) |

### Technische aanpassingen

- Nieuw veld `districtRep: Record<DistrictId, number>` in GameState
- Reputatie stijgt bij: handelen (+1), missies (+5), district bezitten (+2/dag)
- Reputatie daalt bij: heat > 70 in dat district (-3/dag), politie-inval (-10)
- District-rep perks worden gecontroleerd in relevante engine functies
- Reputatie weergeven in DistrictPopup en een nieuw tabje in het Profiel

---

## 3. Nemesis Systeem (Feature #2)

Een rivaliserende AI-speler die meegroeit en de speler uitdaagt.

### Hoe het werkt

De Nemesis is een NPC die:
- Automatisch handelt in de stad (koopt/verkoopt, beinvloedt prijzen)
- Territorium probeert te veroveren (kan districten "claimen")
- Sterker wordt naarmate de speler stijgt in rang
- Af en toe sabotage-acties uitvoert (voorraadroof, crew-aanvallen)
- Verslagen kan worden in een speciale confrontatie

**Nemesis Profiel:**
- Naam: willekeurig gegenereerd bij game start
- Power Level: schaalt met speler's dag/level
- Thuisbasis: een district (verschuift)
- Actie per dag: 1-2 automatische acties bij END_TURN

**Nemesis Acties (per dag):**
- Marktmanipulatie: prijzen in een district beinvloeden
- Territorium claimen: probeert een niet-bezeten district te claimen
- Sabotage: steelt goederen of beschadigt crew (lage kans)
- Factie beinvloeden: verlaagt jouw relatie met een factie

**Confrontatie:**
- Wanneer je in hetzelfde district bent als de Nemesis, kun je hem uitdagen
- Werkt via het bestaande combat systeem met aangepaste stats
- Bij overwinning: grote beloning, Nemesis verdwijnt tijdelijk (5 dagen) en komt sterker terug

### Technische aanpassingen

- Nieuw type `NemesisState` met naam, power, locatie, HP, cooldown
- Veld `nemesis: NemesisState` in GameState
- `updateNemesis(state)` functie in engine.ts, aangeroepen bij `endTurn`
- Nemesis-marker op de CityMap (rode schedel-icoon)
- Nemesis-info sectie in MapView of een toast bij acties
- Confrontatie via bestaand combat systeem (START_COMBAT uitbreiden)

---

## 4. Territorium Verdediging (Feature #4)

Bezette districten kunnen aangevallen worden en moeten verdedigd worden.

### Hoe het werkt

- Elk bezeten district heeft een **verdedigingsniveau** (0-100)
- Verdediging stijgt met: crew toewijzen, upgrades kopen, factie-allianties
- Elke nacht is er een kans op een aanval (hoger bij lage verdediging of hoge heat)
- Bij een aanval verschijnt een keuze-event in het nachtrapport

**Verdedigingsmechaniek:**
- Elke bezeten district toont een verdedigingsbar in de DistrictPopup
- Je kunt crew "stationeren" in een district (+20 verdediging per crewlid)
- Muren upgraden: +30 verdediging (eenmalige kost per district)
- Factie-allianties: +15 verdediging als de lokale factie jouw bondgenoot is

**Aanvalsresolutie (bij END_TURN):**
- Roll: aanvalskracht (20-60 + dag * 0.5) vs. verdediging
- Gewonnen: +REP, +district rep, crew XP
- Verloren: district verlies, geld verlies, rep verlies
- Het nachtrapport toont het resultaat met verhaaltext

### Technische aanpassingen

- Nieuw type `DistrictDefense` met level, stationedCrew, upgrades
- Veld `districtDefenses: Record<DistrictId, DistrictDefense>` in GameState
- `resolveDistrictAttacks(state)` in engine.ts bij `endTurn`
- Verdedigings-UI in DistrictPopup (crew toewijzen, upgrade kopen)
- Aanvalsresultaat in NightReport component
- Nieuwe GameAction types: `STATION_CREW`, `UPGRADE_DEFENSE`

---

## 5. Crew Specialisaties (Feature #10)

Crewleden krijgen een specialisatie-boom waarmee ze unieke vaardigheden ontgrendelen.

### Hoe het werkt

Bij level 3, 5, 7 en 9 kiest elk crewlid een specialisatie:

| Rol | Pad A | Pad B |
|-----|-------|-------|
| **Enforcer** | **Brute** (+50% gevechtsschade) | **Bodyguard** (beschermt crew, -30% schade aan allen) |
| **Hacker** | **Dataminer** (+25% tech missie beloning) | **Phantom** (-20% heat op alle acties) |
| **Chauffeur** | **Racer** (gratis reizen + ontsnapping bonus) | **Smokkelwagen** (+50% opslagruimte) |
| **Smokkelaar** | **Spook** (+40% stealth missie succes) | **Netwerk** (+10% op alle handelswinst) |

Specialisatie wordt gekozen via een popup wanneer een crewlid het juiste level bereikt.

### Technische aanpassingen

- Nieuw veld `specialization: string | null` op CrewMember type
- Specialisatie-definities in constants.ts
- Level-up check uitbreiden: bij level 3/5/7/9 een keuze-popup tonen
- Specialisatie-effecten integreren in relevante engine functies
- Crew kaart in OperationsView uitbreiden met specialisatie-badge en keuze-UI
- Nieuwe component `CrewSpecializationPopup.tsx`

---

## 6. Smokkelroutes (Feature #5)

Automatische handelsroutes die passief inkomen genereren.

### Hoe het werkt

- Na het ontgrendelen van 2+ districten kun je smokkelroutes instellen
- Een route verbindt twee districten en transporteert een gekozen goed
- Routes genereren per dag automatisch inkomen (minus risico van onderschepping)
- Maximaal 3 actieve routes

**Route Setup:**
- Kies startdistrict, einddistrict en goed
- Kost: €5.000 setup + risico per dag
- Inkomen: gebaseerd op prijsverschil tussen districten
- Risico: Heat-afhankelijk. Bij onderschepping verlies je de route + boete
- Crew met Smokkelaar-rol verlaagt onderscheppingsrisico

**Route Onderschepping:**
- Basis 10% kans per dag (+ heat/200)
- Verminderd door: Smokkelaar crew (-5%), Port Nero bezit (-3%), politie-relatie (-2%)
- Bij onderschepping: route vernietigd, heat +15, geld verlies

### Technische aanpassingen

- Nieuw type `SmuggleRoute` met van, naar, good, dagelijksInkomen, risico
- Veld `smuggleRoutes: SmuggleRoute[]` in GameState (max 3)
- `processSmuggleRoutes(state)` in engine.ts bij `endTurn`
- Route-resultaten in NightReport
- Nieuwe UI-sectie in ImperiumView (Assets sub-tab) voor route management
- Nieuwe GameAction types: `CREATE_ROUTE`, `DELETE_ROUTE`

---

## 7. Telefoon / Berichten Systeem (Feature #13)

Een in-game telefoon voor NPC-communicatie, tips en sfeer.

### Hoe het werkt

De telefoon is een overlay (full-screen) met:
- **Inbox**: berichten van NPC's (factie-contacten, informanten, Nemesis)
- **Contacten**: lijst van bekende NPC's met relatieniveau
- Berichten komen binnen bij specifieke game-events

**Berichttypes:**
| Trigger | Afzender | Voorbeeld |
|---------|----------|-----------|
| Dag start | Informant | "Hoge vraag op Synthetica in Crown Heights vandaag." |
| Factie rel > 50 | Factie contact | "We hebben een speciaal contract voor je. Check je missies." |
| Heat > 60 | Anoniem | "De politie is op je pad. Lig laag." |
| District veroverd | Nemesis | "Geniet ervan. Het duurt niet lang." |
| Na missie | Contactpersoon | "Goed werk. Hier is een bonus." |
| Smokkelroute succes | Koerier | "Lading afgeleverd. Geen problemen." |
| Weer verandert | Weerdienst | "Stormwaarschuwing voor Noxhaven." |

- Berichten zijn puur visueel/informatief, sommige bevatten een actie-knop (bijv. "ACCEPTEER CONTRACT")
- Maximaal 20 berichten bewaard, oudste worden verwijderd
- Ongelezen indicator op het telefoon-icoon in de header

### Technische aanpassingen

- Nieuw type `PhoneMessage` met id, from, text, day, read, actionType
- Veld `phone: { messages: PhoneMessage[], unread: number }` in GameState
- `generateMessages(state)` in engine.ts bij `endTurn` en specifieke acties
- Telefoon-icoon in GameHeader (met ongelezen badge)
- Nieuw component `PhoneOverlay.tsx` met inbox en contacten
- Nieuwe GameAction types: `OPEN_PHONE`, `READ_MESSAGE`, `DISMISS_MESSAGE`

---

## Technisch Overzicht

### Alle nieuwe types (types.ts)

```text
WeatherType: 'clear' | 'rain' | 'fog' | 'heatwave' | 'storm'

NemesisState:
  name: string
  power: number
  location: DistrictId
  hp: number
  maxHp: number
  cooldown: number        -- dagen tot terugkeer na verlies
  defeated: number        -- keer verslagen
  lastAction: string      -- beschrijving laatste actie

DistrictDefense:
  level: number           -- 0-100
  stationedCrew: number[] -- indices van gestationeerde crew
  wallUpgrade: boolean
  turretUpgrade: boolean

SmuggleRoute:
  id: string
  from: DistrictId
  to: DistrictId
  good: GoodId
  active: boolean
  daysActive: number

CrewSpecialization: string  -- pad ID

PhoneMessage:
  id: string
  from: string
  avatar: string
  text: string
  day: number
  read: boolean
  type: 'info' | 'warning' | 'opportunity' | 'threat'
```

### GameState uitbreidingen

```text
weather: WeatherType
districtRep: Record<DistrictId, number>
nemesis: NemesisState
districtDefenses: Record<DistrictId, DistrictDefense>
smuggleRoutes: SmuggleRoute[]
phone: { messages: PhoneMessage[], unread: number }

+ CrewMember uitbreiden met: specialization: string | null
```

### Aangepaste bestanden

| Bestand | Wijzigingen |
|---------|-------------|
| `src/game/types.ts` | Alle nieuwe types en GameState uitbreidingen |
| `src/game/constants.ts` | Weer-definities, specialisatie-bomen, Nemesis namen, berichten templates, verdedigings-upgrades, route-kosten |
| `src/game/engine.ts` | `generateWeather()`, `updateNemesis()`, `resolveDistrictAttacks()`, `processSmuggleRoutes()`, `generateMessages()`, specialisatie-effecten, district-rep logica, weer-effecten in bestaande functies |
| `src/contexts/GameContext.tsx` | Nieuwe actions voor alle 7 features, state migratie |
| `src/components/game/GameHeader.tsx` | Weer-icoon, telefoon-icoon met badge |
| `src/components/game/CityMap.tsx` | Nemesis marker, weer-overlay |
| `src/components/game/MapView.tsx` | Nemesis info, weer-indicator |
| `src/components/game/DistrictPopup.tsx` | District-reputatie, verdedigingsniveau, crew stationeren |
| `src/components/game/ImperiumView.tsx` | Smokkelroutes sectie |
| `src/components/game/OperationsView.tsx` | Crew specialisatie badge/keuze |
| `src/components/game/NightReport.tsx` | Smokkelroute resultaten, verdedigings-events, Nemesis acties, weer-bericht |
| `src/components/game/ProfileView.tsx` | District-reputatie overzicht |
| `src/components/game/PhoneOverlay.tsx` | **NIEUW** - Telefoon overlay component |
| `src/components/game/CrewSpecPopup.tsx` | **NIEUW** - Specialisatie keuze popup |
| `src/components/game/GameLayout.tsx` | PhoneOverlay en CrewSpecPopup integratie |

### Volgorde van implementatie

De features worden in deze volgorde gebouwd omdat elke stap onafhankelijk werkt maar latere stappen profiteren van eerdere:

1. **Weersysteem** -- Staat volledig los, beinvloedt andere systemen
2. **District-Reputatie** -- Onafhankelijk, verrijkt bestaande districten
3. **Crew Specialisaties** -- Onafhankelijk, verrijkt bestaand crew-systeem
4. **Smokkelroutes** -- Gebruikt district-systeem, profiteert van crew specs
5. **Territorium Verdediging** -- Gebruikt district-rep, crew stationering
6. **Nemesis Systeem** -- Interacteert met territorium, districten, combat
7. **Telefoon Systeem** -- Verbindt alles: berichten over weer, nemesis, routes, verdediging

