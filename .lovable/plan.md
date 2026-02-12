

# Verkeer Realistischer op de Wegen — Plan

## Probleem
De huidige 16 wegenpaden (SVG `path` definities in `ROADS[]`) volgen de wegen op de achtergrondafbeelding niet nauwkeurig genoeg. Het verkeer (koplampen, achterlichten, bussen, motoren) zweeft daardoor soms naast de zichtbare wegen in plaats van er precies overheen te rijden.

## Aanpak
De achtergrondafbeelding toont een isometrische stadskaart met duidelijk zichtbare wegen. Het plan is om alle 16 ROADS-paden opnieuw te traceren op basis van de exacte positie van de wegen in de achtergrondafbeelding, en daarnaast het verkeerssysteem uit te breiden met meer variatie.

## Stap 1: Wegen opnieuw traceren
Het SVG-viewBox is `0 0 400 290`. De achtergrondafbeelding toont de volgende wegenstructuur die nauwkeuriger moet worden gevolgd:

**Hoofd-snelwegen (opnieuw traceren):**
- R0: Haven-weg van linksboven (Port Nero) naar het centrale plein (Neon Strip) — volgt de diagonale hoofdweg die door het midden loopt
- R1: Vervolg van centraal plein naar Crown Heights (rechtsboven) — de brede weg richting het financiele district
- R4: De rotonde/plaza in Neon Strip — het ronde verkeerspunt in het centrum
- R7: De oostelijke snelweg langs Crown Heights naar Lowrise
- R9: De kustweg langs de westelijke waterrand

**Verbindingswegen (opnieuw traceren):**
- R2: Noordelijke route Port Nero naar Villa-heuvel
- R3: Villa-heuvel naar Crown Heights langs de heuvelrug
- R5: Rotonde naar Iron Borough (zuidwest)
- R6: Rotonde naar Lowrise (zuidoost)
- R8: Zuidelijke dwarsweg Iron Borough naar Lowrise
- R11-R15: Interne district-wegen en lussen

**Nieuwe wegen toevoegen:**
- Extra parallelle wegen waar de afbeelding duidelijk twee rijbanen toont
- Kleinere steegjes in de district-kernen voor voetgangers

## Stap 2: Meer verkeersdetails
Na het hertraceren worden de verkeersanimaties verbeterd:
- **Tegenverkeer**: Koplampen en achterlichten op dezelfde weg maar in tegengestelde richting, elk op hun eigen "rijbaan" (licht versetzt pad)
- **Variabele snelheden**: Meer spreiding in duur om filevorming te simuleren
- **Meer verkeer op drukke wegen** (R0, R1, R4): 3-4 voertuigen per weg
- **Minder verkeer op rustige wegen** (R10, R13, R14): 1 voertuig

## Stap 3: AMBIENT_ROADS ook opnieuw traceren
De 12 achtergrond-straten in `AMBIENT_ROADS[]` worden ook opnieuw gepositioneerd om overeen te komen met de kleinere zijstraten op de afbeelding.

## Technische Wijzigingen

### `src/components/game/CityMap.tsx`
- **ROADS[] array (regel 34-67)**: Alle 16 paden opnieuw definiëren met nauwkeurigere SVG `path` coördinaten die de isometrische wegen op de achtergrondafbeelding volgen
- **AMBIENT_ROADS[] array (regel 70-83)**: Achtergrondstraten hertraceren
- **Verkeersectie (regel 525-601)**: Meer voertuigen op hoofdwegen, minder op rustige wegen, parallelle rijbanen voor tegenverkeer

### `src/components/game/map/CityAmbience.tsx`
- **StreetLights**: Automatisch gepositioneerd op nieuwe wegenpaden (geen wijziging nodig, gebruikt ROADS)
- **Pedestrians**: Idem, volgt automatisch nieuwe paden

## Werkwijze
Omdat de wegen met het blote oog op de screenshot moeten worden getraceerd, zal ik:
1. De achtergrondafbeelding pixel-voor-pixel bestuderen via de browser screenshot
2. Per weg de begin-, tussen- en eindpunten bepalen in het 400x290 coördinatensysteem
3. De SVG-paden aanpassen met Quadratic/Cubic Bézier curves voor vloeiende bochten
4. Het resultaat visueel verifiëren via de preview

