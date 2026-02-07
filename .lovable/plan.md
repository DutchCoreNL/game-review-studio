

# Visuele Upgrade: Levende Stadskaart van Noxhaven

## Overzicht

De huidige kaart heeft al een solide basis met district-landmarks, wegen, verkeer en overlays. Deze upgrade transformeert het naar een echte levende stad met meer diepte, sfeer en dynamische elementen die reageren op de game state.

## Wat er verandert

### 1. Terrein & Omgeving per District
Elk district krijgt een uniek grondpatroon dat het karakter versterkt:
- **Port Nero**: Waterreflecties langs de haven, drijvende boeien, golvend wateroppervlak met subtiele animatie
- **Crown Heights**: Parkgebied met bomen (donkere silhouetten), een helipad-markering op het hoogste gebouw
- **Iron Borough**: Roestige grondtextuur, spoorlijnen met een langzaam rijdende goederenwagon
- **Lowrise**: Gebroken bestrating-patroon, afvalbakken, flikkerende straatverlichting
- **Neon Strip**: Gloeiende neon-reflecties op de weg, bewegende reclameborden

### 2. Verbeterde Gebouwen & Details
De bestaande landmark-renderers worden uitgebreid:
- Meer gebouwvariatie (verschillende hoogtes, vormen)
- Rook/stoom-effecten bij fabrieken en restaurantjes
- Verlichte ramen die willekeurig aan/uit gaan (geanimeerd)
- Antennes en waterreservoirs op daken
- Port Nero: Bewegende kraan, lichtbaken op de pier
- Crown Heights: Helipad met draaiend licht, penthouse-verlichting
- Neon Strip: Verticale neon-teksten langs gebouwen, disco-licht reflecties

### 3. Dynamische Stadselementen
Nieuwe geanimeerde elementen die leven toevoegen:
- **Straatverlichting**: Lichtcirkels langs wegen die 's nachts gloeien
- **Meer verkeer**: Extra voertuig-variaties (bussen, motoren) met verschillende snelheden en kleuren
- **Voetgangers**: Kleine stippen die langs wegen bewegen (subtiel)
- **Bruggen**: Visuele brug-constructies waar wegen water/spoor kruisen
- **Boten in de haven**: Langzaam bewegende silhouetten bij Port Nero

### 4. Sfeer-verbeteringen op de Achtergrond
- **Sterrenhemel / Stadsgloed**: Subtiele achtergrondgradienten die de nachtelijke sfeer versterken
- **Stadsgrenzen**: Zachte glow aan de randen van de kaart die de stad afbakent
- **Rivierverloop**: Een waterweg die van Port Nero naar het zuiden loopt
- **Weer-integratie**: Gebouwen reageren visueel op weer (nat dak bij regen, extra stoom bij hittegolf)

### 5. Game State Integratie
De kaart reageert visueel op de huidige staat:
- **Bezit-indicator**: Bezeten districten krijgen een subtiele kleur-tint in hun grondgebied (rode gloed)
- **Actieve smokkelroutes**: Stippellijnen tussen districten als routes actief zijn
- **District reputatie**: Meer of minder activiteit/verlichting op basis van reputatie
- **Dag/nacht sfeer**: Window-verlichting intensiteit past aan

---

## Technisch Plan

### Bestanden die worden gewijzigd:

**`src/components/game/CityMap.tsx`** (hoofdbestand)
- Nieuwe achtergrondlagen toevoegen: stadsgloed-gradient, rivier/waterweg
- Straatverlichting-component langs ROADS
- Verbeterde verkeer-animaties met meer variatie
- Voetganger-animaties als subtiele stippen
- Smokkelroute-visualisatie op basis van `state.smuggleRoutes` (nieuwe prop)
- Verbeterd grid-patroon met meer organisch stratenpatroon

**`src/components/game/CityMap.tsx` - Landmark functies**
- `PortNeroLandmarks`: Wateranimaties uitbreiden, bewegende kraan, lichtbaken, drijvende boten
- `CrownHeightsLandmarks`: Helipad, meer ramen met flicker-animatie, parkgebied met bomen
- `IronBoroughLandmarks`: Spoorlijn met wagon, extra fabrieksdetails, roest-accenten  
- `LowriseLandmarks`: Meer gebroken straatmeubilair, flikkerende lichten, vuilnisbakken
- `NeonStripLandmarks`: Verticale neon-teksten, meer kleur-variatie, disco-vloer reflecties

**`src/components/game/map/CityAmbience.tsx`** (nieuw bestand)
- `StreetLights` component: Lichtcirkels langs wegen
- `Pedestrians` component: Kleine bewegende stippen
- `HarborActivity` component: Boten en waterbewegingen bij Port Nero
- `SmuggleRouteLines` component: Stippellijnen voor actieve routes
- `CityGlow` component: Achtergrondgloed en stadsranden

**`src/components/game/map/WeatherOverlay.tsx`**
- Verbeterde regen: reflecties op daken
- Mist: meer lagen, organischer
- Storm: natte gebouw-effecten

### Props die worden toegevoegd aan CityMap:
- `smuggleRoutes` (actieve smokkelroutes voor visualisatie)
- `districtRep` (reputatie per district voor activiteitsniveau)

### Wijziging in `src/components/game/MapView.tsx`:
- De nieuwe props `smuggleRoutes` en `districtRep` doorgeven aan `CityMap`

### Geschatte complexiteit:
- CityMap.tsx: Uitbreiding van ~820 regels naar ~1100 regels
- Nieuw bestand CityAmbience.tsx: ~250 regels
- WeatherOverlay.tsx: Kleine aanpassingen
- MapView.tsx: 2 extra props doorgeven

Alle bestaande functionaliteit (hitboxen, events, nemesis, weer, heat, verkeer, travel-animatie) blijft volledig intact. De visuele verbeteringen worden als extra lagen bovenop of tussen de bestaande elementen toegevoegd.

