

# Noxhaven UI Overhaul -- Passend bij het Crime-Noir Thema

Na een grondige analyse van elke pagina, component en styling heb ik de volgende verbeteringen geidentificeerd om de UI logischer, consistenter en meer immersief te maken.

---

## Huidige Problemen

1. **Header is te druk**: 4 klikbare resource-blokjes + geld + zwart geld + titel, alles op een klein mobiel scherm
2. **Navigatie heeft 7 tabs**: Te veel voor een mobiel scherm. Labels zijn afgekapt en iconen klein
3. **Inconsistente section headers**: Elke view definieert zijn eigen `SectionHeader` component (identiek, maar gedupliceerd in 6+ bestanden)
4. **Kaartpagina voelt leeg**: De kaart-SVG is klein, de "DAG AFSLUITEN" knop staat verloren onderaan
5. **Casino mist sfeer**: De games zijn functioneel maar visueel vlak
6. **Profiel is een lange scroll-dump**: Stats, loadout, achievements, schuld, reset -- alles op een rij zonder structuur
7. **Markt/Handel mist visuele hierarchie**: De goederen zien er allemaal hetzelfde uit, geen onderscheid per type
8. **Tutorial is te basic**: Geen crime-sfeer, gewoon tekst met iconen
9. **Inconsistente kleurgebruik**: Sommige knoppen gebruiken inline `hsl(var(...))` syntax, andere Tailwind classes

---

## Verbeteringsplan

### 1. Gedeelde UI Componenten Extractie
Maak een `src/components/game/ui/` map met herbruikbare game-specifieke componenten:
- `SectionHeader.tsx` -- Eenmalig gedefinieerd, overal gebruikt
- `GameButton.tsx` -- Consistente knoppen met varianten (primary/blood, secondary/gold, muted)
- `StatBar.tsx` -- Herbruikbare progress bar (HP, XP, conditie)
- `InfoRow.tsx` -- Key-value rij voor details
- `GameBadge.tsx` -- Status badges (GEREED, BUITEN WESTEN, IDEAAL, etc.)

### 2. Header Redesign
- Compactere layout: Titel links, geld rechts op 1 regel
- Resource-balk eronder als horizontale "ticker-stijl" strip
- Zwart geld indicator subtiel in de geld-display
- Verwijder de klikbare popups van resources -- verplaats deze info naar het Profiel

### 3. Navigatie Herstructurering (7 naar 5 tabs)
Combineer tabs voor logischere groepering:
- **KAART** (stadskaart + districts)
- **HANDEL** (markt + witwassen + zwarte markt gear)
- **OPERATIES** (solo ops + contracten + crew + combat)
- **IMPERIUM** (voertuigen + bedrijven + HQ upgrades + lab + facties)
- **PROFIEL** (stats + loadout + achievements + casino + schuld)

Dit reduceert de navigatie van 7 naar 5 tabs, wat beter past op mobiel en logischer groepeert.

### 4. Kaartpagina Verbetering
- Kaart groter maken (meer schermruimte)
- Nieuwsticker verplaatsen naar de header als subtiele overlay
- District-info inline tonen bij selectie (in plaats van een popup die de kaart bedekt)
- "DAG AFSLUITEN" knop als vaste footer-knop onder de kaart (altijd zichtbaar)
- Meer visuele feedback: gloeiende districten, animaties bij reizen

### 5. Handelsscherm Polish
- Goederen-kaarten met kleur-coding per factie (rood voor Cartel items, blauw voor Syndicate, etc.)
- Voorraad-indicator prominenter (visuele balk in plaats van tekst)
- Winst/verlies calculator prominenter tonen
- Categorie-filters of tabjes (Drugs, Wapens, Tech, Luxe, Medisch)

### 6. Operaties/Missies Herindeling
- Duidelijkere visuele scheiding tussen solo ops, contracten en crew
- Crew-kaarten met "character card" stijl (grotere avatar area, rol-icoon)
- Contract-kaarten met meer visueel onderscheid per type (kleur-gradient achtergrond)

### 7. Casino Sfeerverbetering
- Velvet/luxury achtergrond gradient
- Kaart-animaties bij Blackjack
- Neon-stijl tekst effecten
- Grotere, meer thematische game-selectie cards

### 8. Profiel Redesign met Tabs
- Sub-tabjes: "Stats", "Loadout", "Trofeen"
- Character card bovenaan met level, rang, en avatar
- Achievements als unlock-grid met gouden gloed
- Statistieken als dashboard met kleine grafieken/meters

### 9. Global Styling Verbeteringen
- Textuur/noise overlay op de achtergrond voor grittier gevoel
- Subtiele vignette-effect op de randen
- Consistente border-radius (meer hoekig = meer "hard/crime" gevoel)
- Betere typografie hierarchie (Cinzel voor titels, Inter voor body)
- Consistente spacing en padding

---

## Technisch Overzicht

### Nieuwe bestanden
| Bestand | Doel |
|---------|------|
| `src/components/game/ui/SectionHeader.tsx` | Gedeelde section header |
| `src/components/game/ui/GameButton.tsx` | Gestandaardiseerde knoppen |
| `src/components/game/ui/StatBar.tsx` | Herbruikbare progress bars |
| `src/components/game/ui/GameBadge.tsx` | Status badges |

### Aangepaste bestanden
| Bestand | Wijziging |
|---------|-----------|
| `src/index.css` | Noise texture overlay, vignette, betere basis-styling, scherper border-radius |
| `tailwind.config.ts` | Aangepaste spacing, extra kleuren, typography tweaks |
| `src/components/game/GameHeader.tsx` | Compacter, cleaner header design |
| `src/components/game/GameNav.tsx` | 5 tabs i.p.v. 7, betere iconen en labels |
| `src/components/game/GameLayout.tsx` | Aangepaste view routing voor samengevoegde tabs |
| `src/components/game/MapView.tsx` | Grotere kaart, betere layout, nieuws in header |
| `src/components/game/CityMap.tsx` | Verfijnde visuele stijl, betere district-labels |
| `src/components/game/DistrictPopup.tsx` | Inline panel i.p.v. fullscreen overlay |
| `src/components/game/MarketView.tsx` | Kleur-coding, betere hierarchie, categorieen |
| `src/components/game/MissionsView.tsx` | Character-card crew, betere contract visuals |
| `src/components/game/CasinoView.tsx` | Luxe/neon styling, grotere game cards |
| `src/components/game/ProfileView.tsx` | Sub-tabs, dashboard-stijl stats, trophy grid |
| `src/components/game/AssetsView.tsx` | Gecombineerd met facties in "Imperium" view |
| `src/components/game/FamiliesView.tsx` | Samengevoegd in Imperium view |
| `src/components/game/CombatView.tsx` | Betere visuele feedback, animaties |
| `src/components/game/ResourcePopup.tsx` | Verplaatst naar profiel-subtabs |
| `src/components/game/TutorialOverlay.tsx` | Meer verhaal-sfeer, donkerder toon |
| `src/components/game/NightReport.tsx` | Sfeervoller met meer visuele elementen |
| `src/components/game/GameToast.tsx` | Verfijnde toast styling |
| `src/game/types.ts` | GameView type aangepast (5 i.p.v. 7 views) |
| `src/contexts/GameContext.tsx` | View routing update |

---

## Navigatie-structuur (nieuw)

```text
KAART          HANDEL         OPERATIES      IMPERIUM       PROFIEL
- Stadskaart   - Markt        - Solo Ops     - Voertuigen   - Boss Card
- Districts    - Witwassen    - Contracten   - Bedrijven    - Stats/Skills
- Dag Afsluiten- Zwarte Markt - Crew Mgmt    - HQ Upgrades  - Loadout
- Nieuws       -              - Gevechten    - Lab          - Achievements
               -              -              - Facties      - Casino
               -              -              - Corruptie    - Schuld/Reset
```

### Aanpak

1. **Fase 1**: Gedeelde UI-componenten maken en global styling updaten
2. **Fase 2**: Header en navigatie herstructureren (7 naar 5 tabs)
3. **Fase 3**: Elke view visueel vernieuwen met nieuwe componenten
4. **Fase 4**: Detail-polish (animaties, texturen, sfeer-elementen)

