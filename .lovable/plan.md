
# Villa Noxhaven — Jouw Hoofdkwartier

## Concept
Een Tony Montana-achtige villa als centraal hoofdkwartier, los van de 5 districten. Het verschijnt als een aparte locatie op de kaart, tussen Port Nero en Crown Heights (rond cx: 175, cy: 50). Je moet het eerst kopen voordat je het kunt gebruiken. Eenmaal gekocht wordt het je persoonlijke machtsbasis met productie, opslag, crew-beheer en bescherming.

## Locatie op de Kaart
De villa komt op een heuvel boven de stad, tussen Port Nero en Crown Heights. Een nieuwe weg verbindt het met beide districten. Op de kaart verschijnt het als een herkenbaar villa-silhouet met tuinen, een zwembad en een oprit.

```text
   [VILLA]  ←── heuvel, apart van districts
    /    \
 PORT    CROWN
```

## Villa Systeem

### Aankoop & Levels
- **Koop de villa**: €150.000 (vereist Level 8, Rep 300)
- **Level 1** (basis): Toegang tot de villa, basisopslag
- **Level 2** (€100.000): Uitgebreide faciliteiten, meer opslag
- **Level 3** (€250.000): Volledig uitgebouwd fort, maximale bescherming

### Villa Faciliteiten (Modules)

| Module | Kosten | Effect |
|--------|--------|--------|
| **Kluis** | €25.000 | Sla geld veilig op (niet verloren bij arrestatie). Max: €50k/100k/200k per level |
| **Opslagkelder** | €20.000 | Sla goederen veilig op (niet verloren bij arrestatie). Max: 20/40/60 items per level |
| **Synthetica Lab** (verplaatst) | €15.000 | Produceert Synthetica uit chemicalien — nu vanuit de villa |
| **Wietplantage** | €30.000 | Passieve productie: 5-10 drugs/nacht zonder chemicalien nodig |
| **Coke Laboratorium** | €50.000 | Premium productie: 3-5 "Puur Wit" (nieuw goed, hoge waarde) per nacht, vereist chemicalien |
| **Crew Kwartieren** | €20.000 | +2 max crew slots, versneld herstel (2x) |
| **Wapenkamer** | €15.000 | Sla ammo veilig op, +5 ammo opslag |
| **Commandocentrum** | €40.000 | Overzicht van alle operaties, +10% missie-succes, spionage-bonus |
| **Helipad** | €80.000 | Snel reizen naar elk district (geen reiskosten/heat), 1x per dag |
| **Zwembad & Lounge** | €35.000 | Passieve crew-moraal bonus, +5 charm bij onderhandelingen vanuit villa |

### Veilige Opslag (Anti-Gevangenis)
Het kernidee: spullen in de villa zijn **beschermd tegen arrestatie**.
- Geld in de **Kluis**: niet geconfisqueerd
- Goederen in de **Opslagkelder**: niet verloren
- Ammo in de **Wapenkamer**: niet verloren
- Speler moet actief items naar de villa verplaatsen (niet automatisch)

### Crew Beheer vanuit de Villa
- Bekijk alle crewleden met stats, gezondheid, rol
- Wijs crew toe aan productie (lab/plantage/coke)
- Train crew (investeer geld voor XP)
- Crew in de villa herstelt 2x sneller

### Productie-Uitbreiding

**Wietplantage:**
- Passieve productie: 5-10 drugs per nacht (geen input nodig)
- Kwaliteit verbetert met upgrades (hogere verkoopprijs)
- Heat-risico: politie-invallen als heat hoog is

**Coke Laboratorium:**
- Vereist chemicalien als input (net als Synthetica Lab)
- Produceert premium product met hogere waarde
- Hogere heat-generatie dan wiet

### Safehouse Integratie
- De villa functioneert als **ultieme safehouse**
- Alle safehouse-bonussen (heat reductie, opslag, crew herstel) zijn inbegrepen
- Onderduiken in de villa geeft de beste heat-reductie (-10/nacht i.p.v. -5)
- De villa vervangt NIET de district-safehouses, maar is een tier erboven

## Technische Aanpak

### Nieuwe Types (`src/game/types.ts`)
- `VillaModuleId`: enum van alle villa-modules
- `VillaState`: eigendom, level, modules, kluis-inhoud, opslagkelder, productie-state
- `VillaStorage`: veilige opslag voor geld en goederen
- Toevoegen aan `GameState`: `villa: VillaState | null`

### Nieuwe Constants (`src/game/constants.ts`)
- `VILLA_COST`, `VILLA_UPGRADE_COSTS`
- `VILLA_MODULES`: definities van alle modules met kosten en effecten
- Aanpassing initial state

### Nieuw Bestand: `src/game/villa.ts`
- Villa engine logica: productie per nacht, opslag-management, bescherming bij arrestatie
- `processVillaProduction(state)`: wiet + coke + synthetica productie
- `getVillaProtection(state)`: wat is beschermd bij arrestatie
- `canUseHelipad(state)`: check voor snelreizen

### Aanpassing: `src/game/engine.ts`
- `endTurn`: villa-productie toevoegen (na lab-productie)
- `recalcMaxInv`: villa-opslag bonus meerekenen
- Arrestatie-logica: villa-kluis en opslagkelder uitsluiten van verlies

### Aanpassing: `src/contexts/GameContext.tsx`
- Nieuwe acties: `BUY_VILLA`, `UPGRADE_VILLA`, `INSTALL_VILLA_MODULE`, `DEPOSIT_VILLA`, `WITHDRAW_VILLA`, `VILLA_HELIPAD_TRAVEL`
- Migratie voor bestaande saves

### Kaart Aanpassing: `src/components/game/CityMap.tsx`
- Nieuwe villa-landmark renderer (villa-silhouet met zwembad, tuin, oprit)
- Positie: cx=175, cy=50 (tussen Port Nero en Crown Heights)
- Nieuwe weg: `M 130,88 Q 155,65 175,55` (Port naar Villa) en `M 175,55 Q 200,65 240,88` (Villa naar Crown)
- Villa hitbox en label
- Glow-effect als de villa bezit is

### Nieuw Component: `src/components/game/villa/VillaView.tsx`
- Hoofdscherm met sub-tabs: Overzicht, Productie, Opslag, Crew, Modules
- **Overzicht**: villa-level, actieve modules, dagelijkse productie-samenvatting
- **Productie**: status van lab, wietplantage, coke lab
- **Opslag**: kluis (geld) en opslagkelder (goederen) met deposit/withdraw
- **Crew**: crew toewijzen aan productie, training
- **Modules**: koop en upgrade modules

### Integratie: `src/components/game/MapView.tsx`
- Villa-knop naast Casino/Chop Shop/Safehouse knoppen
- Alleen zichtbaar als villa gekocht is OF speler genoeg level/geld heeft
- Klikbaar op de kaart

### Night Report Uitbreiding
- Villa-productie resultaten tonen in het nachtrapport
- Wietplantage opbrengst, coke-productie, kluis-bescherming

### Extra Ideeen (binnen het universum)
- **Bewakingscameras**: verhoogde verdediging, waarschuwing bij aanvallen
- **Ondergrondse Tunnel**: ontsnappingsroute als de villa wordt aangevallen (alternatief voor helipad)
- **Feest geven**: investeer geld om relaties met alle facties te verbeteren (+rep)
- **Villa kan aangevallen worden** door de Nemesis als je te machtig wordt — verdedig je basis!
