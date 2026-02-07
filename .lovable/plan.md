

# Heat Systeem 2.0: Voertuig Heat & Persoonlijke Heat

## Het Probleem

Het huidige heat-systeem is een enkel getal (0-100%) dat je simpelweg kunt wegkopen via politie-omkoping. Er is geen strategische diepte — je doet iets riskants, heat gaat omhoog, je koopt het af, klaar.

## De Oplossing: Twee-laags Heat

Heat wordt opgesplitst in twee lagen die elk anders werken:

### 1. Voertuig Heat (snel, zichtbaar)
- **Bouwt snel op**: handel, reizen, smokkel, transport van goederen
- **Makkelijk weg te krijgen** via:
  - **Auto omkatten** (nieuwe kleur/kenteken) bij Tony's Autogarage — kost geld + 1 dag cooldown
  - **Ander voertuig gebruiken** — je heat zit op de specifieke auto, niet op jou
  - **Voertuig dumpen** — verkoop de "hete" auto voor minder geld
- Politie-checkpoints op de kaart reageren op voertuig heat
- Hoge voertuig heat = hogere kans op onderschepping bij smokkelroutes

### 2. Persoonlijke Heat (langzaam, gevaarlijk)
- **Bouwt langzaam op**: combat, factieleiders verslaan, sabotage, failed missies, politie-invallen
- **Moeilijk weg te krijgen** via:
  - **Onderduiken** (nieuwe actie) — je slaat 1-3 dagen over, maar je heat daalt flink. Geen inkomen, geen acties. Riskant want vijanden kunnen je districten aanvallen.
  - **Corrupte agent** — duurder dan nu, verlaagt persoonlijke heat met minder
  - **Langzame natuurlijke afname** — slechts 2% per dag (vs. 5% nu)
  - **Safe house** (nieuwe HQ upgrade) — verdubbelt natuurlijke persoonlijke heat decay
- Persoonlijke heat bepaalt: politie-invallen, boetes, random negatieve events, en of de Nemesis je vindt

### 3. Gecombineerde Heat
De UI toont beide waarden, maar het systeem gebruikt de **hoogste van de twee** voor effecten zoals:
- Politie-invallen checken persoonlijke heat
- Checkpoints checken voertuig heat
- Marktprijstoeslag gebruikt het gemiddelde

## Nieuwe Acties

### Omkatten (bij Garage)
- Beschikbaar in het Assets-scherm bij je actieve voertuig
- Kost: €2.000 - €15.000 afhankelijk van voertuigwaarde
- Reset voertuig heat naar 0
- Cooldown: 3 dagen voordat je dezelfde auto opnieuw kunt omkatten

### Onderduiken
- Nieuwe knop in het Heat-panel (ResourcePopup)
- Je kiest 1, 2 of 3 dagen
- Persoonlijke heat daalt met 15/25/35 per keuze
- Risico's: geen inkomsten, geen acties, vijanden kunnen aanvallen, smokkelroutes worden onderschept

### Safe House (HQ Upgrade)
- Nieuw item in HQ_UPGRADES: kosten €20.000
- Verdubbelt natuurlijke persoonlijke heat decay (2% -> 4%/dag)
- Geeft -5 bonus op persoonlijke heat bij onderduiken

## UI Wijzigingen

### GameHeader
- "HEAT" chip toont nu twee mini-waarden: auto-icoontje + persoonlijke heat-icoontje
- Kleuren zijn onafhankelijk (auto kan rood zijn terwijl persoonlijk laag is)

### Heat Panel (ResourcePopup)
- Toont twee aparte balken: voertuig heat en persoonlijke heat
- Voertuig heat balk met auto-icoon, persoonlijke heat met vlam-icoon
- Acties: "Omkatten" knop (redirect naar Assets), "Onderduiken" knoppen (1/2/3 dagen), "Omkopen" knop (nu alleen voor persoonlijke heat, minder effectief)

### CityMap
- HeatOverlay reageert nu op de hoogste van de twee waarden
- Checkpoints worden specifiek getriggerd door voertuig heat

### Night Report
- Aparte regels voor voertuig heat en persoonlijke heat verandering

## Technisch Overzicht

### Types (types.ts)
- Voeg `vehicleHeat` toe aan `OwnedVehicle` interface
- Voeg `personalHeat` toe aan `GameState` (naast bestaande `heat` die omgerekend wordt)
- Voeg `hidingDays` toe aan `GameState` voor onderduik-mechaniek
- Voeg `rekatCooldown` toe aan `OwnedVehicle`
- Verwijder of hernoem `heat` op `GameState` naar een computed getter

### State Migratie
- Bestaande `heat` wordt vertaald: 70% gaat naar voertuig heat op actief voertuig, 30% naar `personalHeat`
- Alle plekken die `state.heat` lezen worden aangepast naar de juiste variant

### Engine (engine.ts)
- `processEndTurn`: aparte decay voor voertuig heat (elk voertuig -8/dag) en persoonlijke heat (-2/dag, +2 met safe house)
- Politie-inval check op `personalHeat > 60`
- Random events `minHeat` checkt `Math.max(vehicleHeat, personalHeat)`

### Reducer (GameContext.tsx)
- `TRAVEL`: heat gaat naar actief voertuig
- `TRADE`: heat naar actief voertuig
- `WASH_MONEY`: heat naar persoonlijk
- Missie/operatie resultaten: heat verdeeld (transport-deel naar voertuig, rest naar persoonlijk)
- Nieuwe actions: `REKAT_VEHICLE`, `GO_INTO_HIDING`, `CANCEL_HIDING`
- `BRIBE_POLICE`: verlaagt nu alleen persoonlijke heat met -10 (was -15 op totaal)

### Constants (constants.ts)
- Nieuwe HQ upgrade: Safe House
- Omkat-kosten tabel per voertuig tier

### Bestanden die worden aangepast
- `src/game/types.ts` — nieuwe velden
- `src/game/constants.ts` — Safe House upgrade, omkat-kosten
- `src/game/engine.ts` — heat decay, politie-checks, event-checks
- `src/contexts/GameContext.tsx` — reducer acties, heat-verdeling
- `src/components/game/GameHeader.tsx` — dubbele heat display
- `src/components/game/ResourcePopup.tsx` — nieuw Heat panel met twee balken + onderduik-actie
- `src/components/game/AssetsView.tsx` — omkat-knop bij voertuigen
- `src/components/game/CityMap.tsx` — heat overlay aanpassen
- `src/components/game/NightReport.tsx` — aparte heat regels
- `src/components/game/ImperiumView.tsx` — omkoop-actie aanpassen
- `src/components/game/MissionsView.tsx` — heat display aanpassen
- `src/components/game/MissionEncounterView.tsx` — heat verdeling
- `src/components/game/trade/MarketPanel.tsx` — prijstoeslag op basis van gemiddelde
- `src/components/game/imperium/SmuggleRoutesPanel.tsx` — voertuig heat waarschuwing
- `src/components/game/DistrictPopup.tsx` — flavor tekst check
- `src/components/game/TutorialOverlay.tsx` — uitleg aanpassen

