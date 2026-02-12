
# Gevangenis Systeem Verbeteringen

## Overzicht
Het huidige gevangenis-systeem werkt, maar mist een aantal kansen om het spannender en strategischer te maken. Hier zijn de verbeteringen:

## Nieuwe Features

### 1. Gevangenis-events (random voorvallen per dag)
Elke dag dat je vastzit kan er iets gebeuren: een celgenoot biedt info aan, een bewaker is corrupt, of er breekt een gevecht uit. Dit maakt de gevangenis geen "wacht-scherm" maar een actieve ervaring.

- Voorbeelden: "Celgenoot deelt intel" (+brains), "Gevecht in de binnenplaats" (-HP of +street cred), "Bewaker biedt deal" (betaal klein bedrag voor -1 dag)

### 2. Lawyer Contact integratie
Als de speler een "Lawyer" corrupt contact heeft, zou dit de straf moeten kunnen verminderen of de omkopingskosten moeten verlagen. Dit geeft het lawyer-contact meer nut.

### 3. Voortgangsbalk in plaats van alleen een getal
Een visuele circulaire of lineaire voortgangsbalk die toont hoeveel van de straf is uitgezeten (totalSentence vs daysRemaining), zodat de speler progressie voelt.

### 4. Crew-loyaliteit impact
Tijdens de gevangenis daalt de loyaliteit van crewleden sneller. Er is een kans dat een crewlid vertrekt als de straf lang duurt (>4 dagen). Dit wordt getoond als waarschuwing.

### 5. Escape-kans breakdown
In plaats van alleen "62% kans" te tonen, een breakdown van de factoren: base kans, +brains bonus, +hacker bonus, +tunnel bonus. Dit maakt het transparanter en motiveert upgrades.

## Technische Wijzigingen

### `src/game/types.ts`
- `PrisonState` uitbreiden met `dayServed: number` en `events: PrisonEvent[]`
- Nieuw type `PrisonEvent` met id, beschrijving en effect

### `src/game/constants.ts`
- Array `PRISON_EVENTS` toevoegen met 6-8 random events

### `src/game/engine.ts`
- Bij de dagelijkse prison countdown: random event trekken en toepassen
- Lawyer-contact check: straf -1 dag bij arrestatie als lawyer actief is
- Crew-loyaliteit penalty per gevangenisdag

### `src/contexts/GameContext.tsx`
- Geen nieuwe actions nodig; events worden automatisch verwerkt in de nachtcyclus

### `src/components/game/PrisonOverlay.tsx`
- Voortgangsbalk toevoegen (circular progress ring)
- Event-log sectie tonen met recente gevangenis-events
- Escape-kans breakdown met individuele factoren
- Crew-waarschuwing als loyaliteit laag wordt
- Lawyer-korting indicator bij omkopen als lawyer beschikbaar is
