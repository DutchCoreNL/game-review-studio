

# Rivaal Systeem Uitbreiding -- Diepere Integratie

## Huidige Situatie
Het nemesis-systeem heeft al een stevig fundament: 5 generaties opvolgers, villa-aanvallen, marktmanipulatie, contextafhankelijke berichten via de telefoon, en een apart "De Rivaal" verhaalboog. Maar er zijn significante verbeterkansen:

**Wat ontbreekt:**
- De nemesis heeft geen **persoonlijkheid** -- alle rivalen gedragen zich identiek
- Er is geen **interactie** buiten gevechten -- je kunt alleen uitdagen of afwachten
- De nemesis reageert niet op **jouw acties** (carjacks, handel, conquests)
- Geen **territorium-conflict** -- de nemesis claimt nooit echt een district
- Geen **bondgenootschappen** -- de nemesis werkt niet samen met facties
- De rivaal-verhaalboog (Viktor Krow) staat los van het dynamische nemesis-systeem

---

## Voorgestelde Verbeteringen

### 1. Nemesis Persoonlijkheden (Archetypes)
Elke rivaal krijgt een archetype dat bepaalt hoe zij zich gedragen:

| Archetype | Gedrag | Favoriete Actie |
|---|---|---|
| **De Zakenman** | Manipuleert markten, koopt facties om | Marktmanipulatie +50% |
| **De Brute** | Valt villa/districten aan, steelt goederen | Aanvalskans +30% |
| **De Schaduw** | Saboteert handelsleveringen, vergroot je heat | Heat-manipulatie |
| **De Strateeg** | Sluit allianties met facties, ondermijnt relaties | Factie-allianties |

Dit maakt elke generatie uniek en dwingt de speler om strategie aan te passen.

### 2. Nemesis Reacties op Speleracties
De nemesis reageert op specifieke dingen die je doet:

- **Speler koopt district**: nemesis stuurt dreigbericht, kans op tegenaanval stijgt
- **Speler verslaat factie-leider**: nemesis probeert die factie te rekruteren
- **Speler handelt veel**: nemesis dumpt dezelfde goederen om prijzen te crashen
- **Speler in gevangenis**: nemesis steelt extra goederen/geld (je bent kwetsbaar)
- **Speler heat > 60**: nemesis stuurt anonieme tip naar de politie (+heat)

### 3. Nemesis Territorium Claim
De nemesis kan nu daadwerkelijk een district "claimen" (niet eigendom, maar invloed):
- In het geclaimde district: +15% hogere inkoopprijzen, -10% verkoopprijzen voor de speler
- De nemesis versterkt zich in dat district (verdedigingsbonus bij gevecht)
- De speler kan het district "bevrijden" door de nemesis daar te verslaan
- Visueel: een rood nemesis-icoon op de kaart bij dat district (al aanwezig via NemesisMarker)

### 4. Nemesis-Factie Allianties
Vanaf generatie 2+ kan de nemesis een bondgenootschap sluiten met een factie:
- De factie-relatie van de speler met die factie daalt extra (-3/dag)
- De nemesis krijgt een power-boost van +10
- De speler kan het bondgenootschap breken door de factie om te kopen (geld/charm) of de nemesis te verslaan
- Een telefoonbericht kondigt de alliantie aan

### 5. Diplomatie-optie (niet alleen vechten)
Naast "UITDAGEN" op de kaart, twee nieuwe opties:
- **Onderhandelen** (vereist: charm > 30, kost geld): tijdelijk bestand van 5 dagen, nemesis stopt met aanvallen. Kan maar 1x per generatie.
- **Informant sturen** (vereist: hacker in crew of brains > 25): onthult nemesis' volgende geplande actie in het Night Report

### 6. Wraakacties na Gevangenis
Als de speler in de gevangenis zit, doet de nemesis altijd een extra actie:
- 50% kans: steelt uit vault (als villa beschikbaar)
- 30% kans: claimt een van je districten (district rep daalt met 15)
- 20% kans: corrumpeert een van je crewleden (loyalty -25)

---

## Technische Wijzigingen

### `src/game/types.ts`
- `NemesisState` uitbreiden met:
  - `archetype: NemesisArchetype` (type: 'zakenman' | 'brute' | 'schaduw' | 'strateeg')
  - `claimedDistrict: DistrictId | null`
  - `alliedFaction: FamilyId | null`
  - `truceDaysLeft: number` (voor onderhandelingen)
  - `lastReaction: string` (voor reactieve acties)

### `src/game/constants.ts`
- `NEMESIS_ARCHETYPES` array met gedragsprofiel per type
- Toewijzing van archetype-namen bij spawning

### `src/game/newFeatures.ts`
- `updateNemesis()` uitbreiden:
  - Archetype-specifieke acties met gewogen kansen
  - Reactie-systeem: check recente spelersacties
  - Territorium-claim logica
  - Factie-alliantie systeem
  - Gevangenis-wraakacties
- Nieuwe functies: `negotiateNemesis()`, `scoutNemesis()`

### `src/contexts/GameContext.tsx`
- Nieuwe actions: `NEGOTIATE_NEMESIS`, `SCOUT_NEMESIS`
- Gevangenis-integratie: roep nemesis wraaklogica aan bij prison tick

### `src/components/game/map/NemesisInfo.tsx`
- "ONDERHANDELEN" en "SCOUT" knoppen toevoegen naast "UITDAGEN"
- Archetype-icoon en beschrijving tonen
- Geclaimd district en factie-alliantie info tonen

### `src/components/game/NightReport.tsx`
- Scout-resultaten tonen als speler een informant heeft gestuurd
- Nemesis reactie-details weergeven

---

## Balans

| Mechanisme | Effect |
|---|---|
| Archetype | Maakt elke generatie uniek, strategie-variatie |
| Reactie-systeem | Nemesis voelt "levend", reageert op de speler |
| Territorium-claim | Economische druk, geeft reden om te vechten |
| Factie-alliantie | Verbindt nemesis met bestaande systemen |
| Onderhandelen | Niet-gewelddadige optie, kost geld |
| Gevangenis-wraak | Gevangenis voelt nog gevaarlijker |

