

# Kaart Achtergrond Vervangen door Afbeelding

## Overzicht

De huidige volledig SVG-gebaseerde kaart wordt omgebouwd naar een **hybride aanpak**: een achtergrondafbeelding met daarover een SVG-overlay voor alle interactieve elementen (markers, labels, animaties).

## Aanpak

De `CityMap.tsx` component wordt aangepast zodat:

1. **De afbeelding** (`Gemini_Generated_Image_dgkqy1dgkqy1dgkq-2.png`) wordt als achtergrond getoond met `object-fit: cover`
2. **Alle SVG landmark-functies** (PortNeroLandmarks, CrownHeightsLandmarks, etc.) worden verwijderd -- de afbeelding toont nu de visuele details
3. **De achtergrondlagen** (CityFabric, Coastline, SkylineEffect achtergrond) worden verwijderd -- vervangen door de afbeelding
4. **Alle interactieve SVG-elementen blijven behouden** als overlay bovenop de afbeelding:
   - District hitboxes en labels
   - Speler-marker ("JIJ")
   - Safehouse markers
   - Villa compound marker
   - Nemesis marker
   - Heat overlay
   - Weather overlay
   - Map events
   - Travel animatie
   - Verkeer-animaties op wegen
   - Kompas en schaal

## Nieuwe District Posities

De markers worden herpositioneerd om overeen te komen met de locaties op de afbeelding:

| District | Oud (cx, cy) | Nieuw (cx, cy) | Locatie op afbeelding |
|---|---|---|---|
| port | 85, 88 | 75, 80 | Links-boven, bij haven/schepen |
| iron | 195, 195 | 80, 220 | Links-onder, bij fabrieken |
| neon | 325, 200 | 200, 175 | Centrum, paars rondpunt |
| crown | 270, 100 | 320, 75 | Rechts-boven, wolkenkrabbers |
| low | 80, 245 | 320, 225 | Rechts-onder, woonwijk |

Villa marker wordt verplaatst naar midden-boven (ca. 200, 45) op de heuvel.

## Technische Wijzigingen

| Bestand | Wijziging |
|---|---|
| `src/components/game/CityMap.tsx` | Container wordt `relative` div met `<img>` achtergrond + SVG overlay. Landmark-functies verwijderd. DISTRICT_META, DISTRICT_ZONES, ROADS en villa-positie bijgewerkt. CityFabric/Coastline/SkylineEffect imports verwijderd. |

### Wat blijft intact
- `MapView.tsx` -- geen wijzigingen
- `GameHeader`, `GameNav`, nieuwsbalk -- geen wijzigingen
- Alle game-logica -- geen wijzigingen
- `WeatherOverlay`, `NemesisMarker`, `CityAmbience` -- blijven werken als SVG overlay
- Heat overlay, traffic animaties, map events -- blijven werken

### Container Structuur (nieuw)

```text
<div relative, aspect-ratio, overflow-hidden>
  <img src="afbeelding.png" object-fit:cover />
  <svg viewBox="0 0 400 290" absolute overlay>
    -- Wegen (herpositioneerd)
    -- CityAmbience (herpositioneerd)
    -- District hitboxes + labels
    -- Speler marker
    -- Safehouse markers
    -- Villa marker
    -- Traffic animaties
    -- Map events
    -- Travel animatie
    -- Nemesis marker
    -- Weather overlay
    -- Heat overlay
    -- Kompas/schaal
    -- Scanline
  </svg>
</div>
```

### Wegen

De ROADS array wordt aangepast zodat de wegen de visuele straten op de afbeelding volgen. Dit zorgt ervoor dat verkeer-animaties, politie-checkpoints en andere map events op de juiste plekken verschijnen.

