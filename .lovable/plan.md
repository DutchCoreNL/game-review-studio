

# UI Verbetering: Logischere Indeling en Consistente Stijl

## Probleem

Het Imperium-scherm heeft momenteel **9 sub-tabs** die over 2 rijen wrappen, wat onoverzichtelijk is en niet past bij de compacte mobiele interface. Daarnaast missen de nieuwere panelen (Races, Dealer) de noir-esthetiek met bannerafbeeldingen die andere views wel hebben.

## Oplossing

### 1. Imperium-tabs reorganiseren: van 9 naar 5

Groepeer gerelateerde tabs logisch samen:

```text
HUIDIGE SITUATIE (9 tabs, 2 rijen):
┌────────┬────────┬────────┬───────┬──────────┬────────┐
│ GARAGE │ RACES  │ DEALER │ BEZIT │ BEDRIJVEN│ OORLOG │
├────────┼────────┼────────┴───────┴──────────┴────────┘
│ FACTIES│CORRUPTIE│ PACTEN │
└────────┴────────┴────────┘

NIEUWE SITUATIE (5 tabs, 1 rij, horizontaal scrollbaar):
┌────────┬──────────┬──────────┬────────┬──────────┐
│ GARAGE │ BUSINESS │ FACTIES  │ OORLOG │ CORRUPTIE│
└────────┴──────────┴──────────┴────────┴──────────┘
```

**Samenvoeging:**
- **GARAGE** = huidige Garage + Races + Dealer (intern 3 secties met accordeon of mini-tabs)
- **BUSINESS** = huidige Bedrijven + Bezit (smokkelen + witwassen)
- **FACTIES** = huidige Facties + Pacten (allianties horen bij facties)
- **OORLOG** = ongewijzigd
- **CORRUPTIE** = ongewijzigd

### 2. Garage krijgt interne sectie-navigatie

Binnen de Garage-tab komen 3 secties als compacte pill-buttons (niet als extra tabs maar als lichte toggle bovenin):

```text
┌─────────────────────────────────┐
│  [Mijn Auto]  [Races]  [Dealer]│
└─────────────────────────────────┘
```

Dit houdt alles voertuig-gerelateerd bij elkaar zonder extra tab-rijen.

### 3. Horizontaal scrollbare sub-tabs

De 5 Imperium sub-tabs worden horizontaal scrollbaar met `overflow-x-auto` en `scrollbar-hide`, consistent met hoe het Profiel-scherm al werkt.

### 4. Visuele stijl consistenter

- **RacingPanel**: Voeg een thematische header toe met race-achtige visuele elementen (checkered vlag patroon als decoratie)
- **DealerPanel**: Voeg subtiele visuele verbeteringen toe zoals betere card-styling voor voertuigen te koop
- Beide panelen krijgen dezelfde `game-card` styling en `border-l-[3px]` patronen die de rest van het spel gebruikt

## Technische Wijzigingen

### Bestanden die worden aangepast:

| Bestand | Wijziging |
|---------|-----------|
| `src/components/game/ImperiumView.tsx` | 9 tabs reduceren naar 5, horizontaal scrollbaar maken, BEZIT samenvoegen met BEDRIJVEN, PACTEN samenvoegen met FACTIES |
| `src/components/game/garage/GarageView.tsx` | Interne pill-navigatie toevoegen voor "Mijn Auto", "Races", "Dealer" secties. RacingPanel en DealerPanel integreren als sub-secties |
| `src/components/game/garage/RacingPanel.tsx` | Visuele verbeteringen: betere kaart-styling voor race-selectie, compactere layout |
| `src/components/game/garage/DealerPanel.tsx` | Visuele verbeteringen: consistentere card-styling, betere thumbnails |

### Wat er NIET verandert:
- Alle game-logica en state management blijven identiek
- Geen nieuwe bestanden nodig
- Alle bestaande functionaliteit blijft behouden, alleen de navigatie-structuur en visuele presentatie verandert

