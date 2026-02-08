

# Noxhaven City Map -- Realistischer Stadsbeeld

## Doel
De huidige kaart ziet eruit als een "tactisch overzicht" met losstaande rechthoekige gebouwen en eenvoudige lijnen. We gaan dit transformeren naar een realistischer stadsbeeld waar de 5 districten visueel aansluiten als onderdeel van 1 samenhangende stad.

## Huidige Situatie
- De kaart is een 400x290 SVG met 5 losse "eilandjes" van gebouwen
- Districten zijn visueel gescheiden door lege ruimte
- Wegen zijn simpele rechte lijnen die districten verbinden
- Gebouwen zijn basale rechthoeken met subtiele details
- Er is geen stadsweefsel (stadsblokken, straatpatronen) tussen de districten

## Verbeterplan

### 1. Stadsweefsel als Achtergrond
Voeg een dicht netwerk van kleine gebouwblokken toe die de hele kaart vullen, zodat er geen "lege gaten" meer zijn tussen districten. Dit creëert het gevoel van een echte stad:
- Kleine generieke stadsblokken (3x3 tot 8x6 px) in donkere tinten verspreid over de hele kaart
- Variatie in hoogte/kleur per zone (hogere/lichtere blokken richting Crown Heights, lagere/donkerdere richting Lowrise)
- Subtiele straatjes (dunne lijnen) tussen de blokken

### 2. Organisch Wegennetwerk
Het huidige netwerk van 8 rechte wegen wordt uitgebreid met:
- Meer tussenliggende straten die een rasterpatroon vormen (stad-grid)
- Gebogen wegen die het organischer maken (met Q-curves in SVG paths)
- Brede hoofdwegen (boulevards) vs. smalle zijstraten
- Rotonde of kruispunt bij Iron Borough (centraal gelegen district)
- Duidelijke kustlijn/kade langs Port Nero

### 3. Verbeterde District-Identiteit
Elk district krijgt een subtiel onderscheidend kleuraccent in de achtergrondblokken:
- **Port Nero**: Blauwige tint, uitgebreider havengebied met kade, kranen en waterfront
- **Crown Heights**: Hogere gebouwen met glas-reflecties, parkgebied met bomen, penthouse-torens
- **Iron Borough**: Roestige/bruine tint, industriele complexen, spoorwegemplacement
- **Lowrise**: Donkerder/verwaarloosder, lage bouw, steegjes, graffiti
- **Neon Strip**: Paars/roze neon-gloed, entertainment-feel met meer neonreclames

### 4. Geografische Elementen
- **Rivier/kustlijn**: Breder wateroppervlak langs de westzijde (Port Nero) met een duidelijke kustlijn
- **Parken**: Klein parkgebied in Crown Heights met boomsilhouetten
- **Spoorlijn**: Duidelijker treinspoor door Iron Borough, eventueel met een stationsgebouw
- **Brug**: Een brug over het water die Port Nero verbindt met Lowrise

### 5. Skyline-effect
Een subtiele skyline-silhouet langs de bovenkant van de kaart, die de gebouwen van Crown Heights als achtergrond laat afsteken.

### 6. Extra Sfeer-details
- Meer rook/stoom uit schoorstenen in Iron Borough
- Betere waterreflecties in het havengebied
- Subtiele fog/haze-gradient van onder naar boven
- Tiny details: verkeerslichten op kruispunten, bankjes in parkgebied

---

## Technische Aanpak

### Bestanden die worden aangepast:

**`src/components/game/CityMap.tsx`** (hoofdbestand, ~1080 regels):
- Nieuw `CityFabric` component: genereert een dense achtergrondlaag van kleine gebouwblokken over de hele kaart (via loops, niet handmatig)
- Uitbreiden van `ROADS` array met 8-12 extra zijstraten voor een dichter stratennet
- Uitbreiden van `AMBIENT_ROADS` met nog meer achtergrondstraten
- Aanpassen van de SVG viewBox achtergrond en grid-pattern naar een subtieler stadsraster
- Toevoegen van een kustlijn/watergebied als volledige westelijke rand
- Toevoegen van een brug-element
- Verbeteren van bestaande landmark-functies met extra detail-elementen

**`src/components/game/map/CityAmbience.tsx`**:
- Uitbreiden van `RiverWaterway` naar een volledige kustlijn met kade-elementen
- Verbeteren van `StreetLights` om ook op de nieuwe wegen te verschijnen
- Toevoegen van `CityFog` component voor een subtiele atmosferische haze
- Aanpassen van `HarborActivity` voor het bredere watergebied

**Geen nieuwe bestanden nodig** -- alle verbeteringen passen binnen de bestaande architectuur.

### Rendering-volgorde (van achter naar voor):
1. Water/kustlijn
2. Stadsweefsel (achtergrondblokken)
3. Stratennetwerk (ambient + hoofd)
4. District landmarks (bestaand, verbeterd)
5. Ambience-elementen (lichten, voetgangers, verkeer)
6. UI-labels, speler-marker, events
7. Weer-overlay, heat-overlay

### Performance-overwegingen
- Achtergrondblokken worden als statische SVG-elementen gerenderd (geen animaties) om performance te behouden
- Gebruik van `pointerEvents="none"` op alle decoratieve lagen
- Maximaal 150-200 extra statische rect-elementen voor het stadsweefsel (dit is prima voor SVG performance)
- Animaties blijven beperkt tot de bestaande dynamische elementen

## Aanbevolen Extra Verbeteringen
Naast het realistischer maken van de kaart zou ik ook willen voorstellen:
- **Mini-map compass**: Een klein kompas-icoon in een hoek voor orientatie
- **Schaal-indicator**: "500m" balk onderaan voor gevoel van schaal
- **Dag/nacht-cyclus hint**: De achtergrondtint subtiel aanpassen op basis van het dag-nummer (even = nacht-tint, oneven = iets lichter)

