

# Gevangenis Verbeteringen: Dag Afsluiten + Bug Fix

## Probleem 1: Geen manier om verder te spelen
Je zit vast in de gevangenis zonder mogelijkheid om dagen door te spoelen. De enige opties zijn omkopen of ontsnappen.

## Probleem 2: Verkeerde dagweergave na mislukte ontsnapping
Bij een 7-dagen straf + mislukte ontsnapping (+2 dagen) toont het scherm "9 dagen over" en "dag 0 van 7". Dit komt doordat `totalSentence` niet wordt bijgewerkt wanneer extra strafdagen worden toegevoegd.

---

## Oplossing

### 1. "Dag Afsluiten" knop in gevangenis
Een nieuwe knop "WACHT DE DAG AF" die dezelfde `END_TURN` actie triggert als de normale dag-afsluiting op de kaart. Dit zorgt ervoor dat:
- De gevangenis-countdown 1 dag afneemt
- Nachtelijke events (district-inkomen, crew loyalty, prison events) normaal verwerkt worden
- Je het nachtrapport te zien krijgt na elke dag

### 2. Bug fix: totalSentence bijwerken
Wanneer de ontsnapping mislukt en extra dagen worden toegevoegd, wordt `totalSentence` ook verhoogd zodat de progress ring en dagweergave correct blijven.

---

## Technische Details

### Bestand: `src/contexts/GameContext.tsx`
- In de `ATTEMPT_ESCAPE` case (regel 1629): na `s.prison.daysRemaining += PRISON_ESCAPE_FAIL_EXTRA_DAYS` ook `s.prison.totalSentence += PRISON_ESCAPE_FAIL_EXTRA_DAYS` toevoegen

### Bestand: `src/components/game/PrisonOverlay.tsx`
- Een nieuwe "WACHT DE DAG AF" knop toevoegen onder de bestaande acties
- Gebruikt een `Clock` icoon en dispatcht `END_TURN`
- Altijd zichtbaar als primaire actie om door je straf heen te komen

