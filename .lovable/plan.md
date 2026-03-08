

# Stap 2: Lokale SectionHeader en ViewWrapper inconsistenties fixen

## Bevinding
Drie views definiëren hun **eigen lokale** `SectionHeader` component met de oude flat `border-b border-border` stijl, waardoor ze de al gerepareerde gedeelde noir-variant omzeilen:

- **`AssetsView.tsx`** — geen `ViewWrapper`, geen cinematic header, lokale SectionHeader
- **`FamiliesView.tsx`** — geen `ViewWrapper`, geen cinematic header, lokale SectionHeader  
- **`MarketView.tsx`** — geen `ViewWrapper`, geen cinematic header, lokale SectionHeader

## Plan

| # | Actie | Bestand |
|---|-------|---------|
| 1 | Verwijder lokale `SectionHeader` definitie, importeer de gedeelde versie uit `./ui/SectionHeader` | Alle 3 bestanden |
| 2 | Wrap content in `<ViewWrapper bg={...}>` met passende achtergrond | Alle 3 bestanden |
| 3 | Voeg cinematic noir header toe (goud icoon-cirkel + display titel) | Alle 3 bestanden |

### Cinematic headers per view:
- **AssetsView**: `Car` icoon → "Bezittingen" 
- **FamiliesView**: `Users` icoon → "Facties"
- **MarketView**: `ArrowRightLeft` icoon → "Zwarte Markt"

Geen logica-wijzigingen — puur visuele consistentie met het noir-thema.

