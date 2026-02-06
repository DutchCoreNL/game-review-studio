
# Stadskaart Vernieuwen: Een Levende Stad

## Huidige Situatie

De kaart bestaat nu uit generieke rechthoekige "gebouwen" die voor elk district hetzelfde eruit zien -- alleen de kleuren verschillen. Port Nero heeft geen haven, Crown Heights heeft geen wolkenkrabbers, en Lowrise ziet er niet uit als een arme buurt. De wegen zijn statisch op een paar bewegende stipjes na. Er gebeurt niets op de kaart.

## Wat verandert

### 1. District-Specifieke Landmarks

Elk district krijgt unieke SVG-elementen die het karakter weerspiegelen:

| District | Landmarks |
|----------|-----------|
| **Port Nero** | Waterlijn aan de linkerkant, kranen, containers, steiger, een schip silhouet |
| **Crown Heights** | Hoge wolkenkrabbers met verlichte ramen, een penthouse-achtige toren, antenne |
| **Iron Borough** | Fabrieksschoorstenen met rook-animatie, lage industriele gebouwen, hijskranen |
| **Lowrise** | Lage, onregelmatige gebouwtjes, kapotte straatlantaarns, graffiti-accenten |
| **Neon Strip** | Neonborden (geanimeerd), club-entrees, flikkerende lichten |

Elk district behoudt een klikbaar gebied maar krijgt een compleet eigen silhouet.

### 2. Dynamische Weg-Events

Op de wegen verschijnen visuele events die veranderen per dag en op basis van game-state:

| Event | Visueel | Voorwaarde |
|-------|---------|------------|
| **Politie Controle** | Blauw/rood knipperend icoon op een weg | Heat > 40, willekeurig per dag |
| **Ongeluk/Wegblokkade** | Oranje waarschuwingsicoon | Willekeurig, beperkt reismogelijkheden visueel |
| **Straatgevecht** | Rood knipperend punt | Factie-relatie < -30 |
| **Zwarte Markt Deal** | Goud pulsend punt | Willekeurig, positief event |
| **Surveillance Drone** | Bewegend punt langs een route | Heat > 60 |

Deze events worden opgeslagen in de GameState als `mapEvents` en regenereren elke dag (bij END_TURN). Ze zijn puur visueel en sfeer-verhogend -- ze beinvloeden niet direct de gameplay, maar geven de speler informatie over de staat van de stad.

### 3. Meer Stadslevensanimaties

- **Meerdere voertuigen** op wegen (niet alleen 4, maar 8+) met verschillende snelheden en kleuren
- **Knipperende ramen** in gebouwen (willekeurig aan/uit)
- **Wateranimatie** bij Port Nero (golven)
- **Rookpluimen** uit fabrieksschoorstenen bij Iron Borough
- **Neonflickers** bij Neon Strip
- **Ambulance/politie** die af en toe over een weg rijdt (rode/blauwe stip)

### 4. Heat-Visuele Feedback op de Kaart

Naarmate heat stijgt, verandert de sfeer van de hele kaart:
- **Heat 0-30**: Normale sfeer
- **Heat 30-60**: Subtiele rode tint aan de randen, meer politie-dots
- **Heat 60-80**: Duidelijke rode gloed, politiecontroles verschijnen
- **Heat 80+**: Rode pulserende rand, helikopter-animatie, "LOCKDOWN" tekst

---

## Technisch Overzicht

### Aangepaste bestanden

| Bestand | Wijziging |
|---------|-----------|
| `src/components/game/CityMap.tsx` | Volledige herbouw met district-landmarks, event-iconen, extra animaties, heat-visuelen |
| `src/game/types.ts` | Nieuw type `MapEvent` en `mapEvents` aan GameState |
| `src/game/constants.ts` | `MAP_EVENT_TYPES` definitie, `mapEvents: []` in initial state |
| `src/game/engine.ts` | `generateMapEvents()` functie, aangeroepen in `endTurn` |
| `src/components/game/MapView.tsx` | `mapEvents` doorsturen naar CityMap component |

### Nieuwe types

```text
MapEvent:
  id: string
  type: 'police_checkpoint' | 'accident' | 'street_fight' | 'black_market' | 'drone' | 'ambulance'
  roadIndex: number          -- Op welke weg het event zit
  position: number           -- 0-100% positie op de weg
  label: string              -- Tooltip tekst
```

### State uitbreiding

```text
GameState:
  mapEvents: MapEvent[]      -- Actieve events op de kaart (regenereert per dag)
```

### Nieuwe engine functie

`generateMapEvents(state)`:
- Genereert 2-5 events per dag op willekeurige wegen
- Meer politie-events bij hogere heat
- Meer straatgevecht-events bij lage factie-relaties
- Zwarte markt deals verschijnen willekeurig
- Wordt aangeroepen in `endTurn` samen met `generatePrices`

### CityMap herbouw

De CityMap component wordt volledig herschreven met:

1. **District Renderers**: Aparte render-functies per district die unieke SVG-shapes tekenen
2. **Water Layer**: Golvende lijnen aan de linkerkant voor de haven
3. **Smoke Particles**: Animated circles voor fabrieksrook
4. **Neon Signs**: Geanimeerde tekst-elementen met glow
5. **Event Markers**: Geanimeerde iconen op wegen
6. **Heat Overlay**: Rode gradient die toeneemt met heat-niveau
7. **Meer verkeer**: Extra geanimeerde stipjes met variatie in kleur en snelheid

### Volgorde van implementatie

1. Types uitbreiden met MapEvent en mapEvents in GameState
2. Map event generator schrijven in engine.ts
3. MapView en GameContext updaten om mapEvents door te geven
4. CityMap volledig herbouwen met district-landmarks
5. Animaties en event-markers toevoegen
6. Heat-visuelen implementeren
