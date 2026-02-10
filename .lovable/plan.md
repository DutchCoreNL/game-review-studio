
# Nieuwe Stadskaart op Basis van Referentie-afbeelding

## Overzicht

De stadskaart wordt volledig herontworpen naar een realistischer, gedetailleerder nachtelijk stadsbeeld gebaseerd op de referentie-afbeelding. De layout wordt aangepast zodat de districten overeenkomen met de afbeelding:

- **Port Nero** (linksboven): Havenfaciliteiten met schepen, containers, kranen en blauw licht
- **Iron Borough** (linksonder): Industrieel gebied met fabrieken, schoorstenen, oranje/rode gloed
- **Neon Strip** (midden): Entertainment-district met paarse/roze neonverlichting
- **Crown Heights** (rechtsboven): Wolkenkrabbers en de villa op de heuvel, koel blauw/wit
- **Lowrise** (rechtsonder): Lage woongebouwen met warme, gedempte verlichting
- **Water**: Kustlijn links en een kanaal dat Iron Borough scheidt
- **Bergen/heuvels**: Rechts en bovenzijde als achtergrond

## Technische Aanpak

De bestaande SVG-architectuur blijft behouden (viewBox, lagen, hitboxes, interactie) maar alle visuele elementen worden vervangen.

### Bestanden die worden aangepast:

| Bestand | Wijziging |
|---|---|
| `src/components/game/CityMap.tsx` | Nieuwe district-posities, wegen, landmarks, hitboxes en labels. Alle 5 landmark-functies herschreven. |
| `src/components/game/map/CityFabric.tsx` | Nieuwe zone-indeling en kleuren passend bij de referentie. |
| `src/components/game/map/Coastline.tsx` | Uitgebreid met kanaal tussen Iron en Neon/Lowrise, meer water-elementen. |
| `src/components/game/map/CityAmbience.tsx` | Aangepaste glow-posities, haven-activiteit en straatverlichting. |
| `src/components/game/map/SkylineEffect.tsx` | Bergen/heuvels silhouet rechts en boven in plaats van alleen skyline bovenaan. |

### Nieuwe Indeling (SVG 400x290)

```text
+------------------------------------------+
|  Bergen/heuvels achtergrond              |
|                                          |
|   PORT NERO        CROWN HEIGHTS         |
|   (blauw)          (villa + torens)      |
|   [kranen,schepen]  [wolkenkrabbers]     |
|                                          |
|   ~~~ Water/kanaal ~~~                   |
|                                          |
|   IRON BOROUGH     NEON STRIP            |
|   (oranje/rood)    (paars/roze)          |
|   [fabrieken]      [clubs,neon]          |
|                                          |
|        LOWRISE (rechtsonder)             |
|        (warm geel, lage huizen)          |
+------------------------------------------+
```

### District Posities (nieuw)

| District | cx | cy | Beschrijving |
|---|---|---|---|
| port | 90 | 90 | Linksboven, aan het water |
| crown | 300 | 70 | Rechtsboven, op de heuvel met villa |
| iron | 100 | 220 | Linksonder, industrieel |
| neon | 230 | 180 | Midden, entertainment |
| low | 320 | 230 | Rechtsonder, residentieel |

### Visuele Verbeteringen per District

**Port Nero:**
- Meerdere schepen (containerschip, bulkcarrier) in het water
- Containerrijen in kleurvariaties (blauw, rood, groen)
- Twee kranen met bewegende armen
- Blauwige sfeerverlichting over hele havengebied
- Kraanfundamenten en kadebeschoeingen

**Iron Borough:**
- Twee grote fabrieken met werkende schoorstenen (rook-animaties)
- Vuurgloed/lava-effecten vanuit ovens
- Industriele pijpleidingen en opslagtanks
- Oranje/rode kleurtemperatuur
- Spoorlijnen met bewegende wagon

**Neon Strip:**
- Grote gebouwen met paars/roze neonverlichting
- Knipperende reclameborden en LED-schermen
- Casino-entree met glow
- Reflecties op nat wegdek
- Meerdere neonborden (BAR, CLUB, CASINO)

**Crown Heights:**
- 3-4 hoge wolkenkrabbers met verlichte ramen
- Villa op een heuvel (met tuinen en oprit)
- Helipad met draaiend licht
- Koele blauw/witte kleurtemperatuur
- Bergen-silhouet erachter

**Lowrise:**
- Dichtbepaakte lage gebouwen (2-3 verdiepingen)
- Warme, gedempte gele straatverlichting
- Smalle straatjes
- Graffiti-accenten op muren
- Kapotte straatlantaarns

### Wegen

Gebogen hoofdwegen verbinden alle districten via een stelsel van snelwegen en opritten, vergelijkbaar met de referentie-afbeelding. Alle bestaande functionaliteit (verkeer-animaties, smuggelroutes, event-markers) blijft werken op de nieuwe wegen.

### Behouden Functionaliteit

Alle bestaande interactieve elementen blijven intact:
- District hitboxes en selectie
- Speler-marker ("JIJ")
- Safehouse markers
- Villa compound (verplaatst naar Crown Heights heuvel)
- Chop Shop in Iron Borough
- Verkeer-animaties op wegen
- Weer-overlay
- Heat-overlay
- Nemesis-marker
- Travel-animatie
- Smuggelroutes
- Map events (checkpoints, gevechten, etc.)
- Nieuws-ticker en kompas/schaal

### Nieuwe Elementen

- **Bergen-silhouet** als achtergrond rechts en boven
- **Kanaal/waterweg** tussen Port/Iron en het centrum
- **Snelweg-knooppunten** met viaducten
- **Meer gedetailleerde gebouwen** met individuele raamverlichting
- **Verbeterde kleurzones** per district met sterkere identiteit
