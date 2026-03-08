

# Verhaal Verbeteren — Meer Verhaallijnen + Betere Presentatie

## Huidige Staat
- **3 hoofd-arcs**: De Informant, Het Erfenis-mysterie, De Rivaal (4 stappen elk)
- **3 backstory-arcs**: Wraak, Schuld, Loyaliteit (4-5 stappen)
- **5 district-arcs**: Port Nero, Crown Heights, Iron Borough, Neon Strip, Lowrise (3 stappen)
- **8 cinematics**: First Blood, First District, Arrest, Betrayal, Nemesis, Godfather, Rise to Power, Scarface
- **~40 straatevents**, NPC events, cliffhangers, flashbacks
- **Presentatie**: StoryArcEvent popup (functioneel maar basic), CinematicOverlay (letterbox + typewriter, sterk)

## Wat wordt toegevoegd

### A. Nieuwe Verhaallijnen (5 nieuwe arcs)

1. **"De Dubbelagent"** — Een politiemol biedt je een deal: werk undercover voor hen, of val.
   - Trigger: day 15+, rep 150+, heat 40+
   - 5 stappen met dubbele loyaliteits-keuzes
   - Uniek: elke keuze heeft een "geheim" effect dat pas in stap 4 onthuld wordt

2. **"Het Syndicaat Keert Terug"** — Een oude machtsfactor wil Noxhaven heroveren
   - Trigger: day 20+, 3+ districten
   - 4 stappen, focus op alliantie-vorming of solo-strijd
   - Eindigt met een mogelijke nieuwe factie-alliantie

3. **"De Tunnels van Noxhaven"** — Ontdek een ondergronds netwerk met een eigen economie
   - Trigger: day 10+, rep 80+
   - 4 stappen met exploratie-focus
   - Ontgrendelt een geheim district-event bij voltooiing

4. **"Bloedgeld"** — Een erfenis van miljoenen, maar met een dodelijke prijs
   - Trigger: day 7+, backstory niet bankier (bankier heeft eigen arc)
   - 3 stappen, heavy karma-impact
   - Uniek: keuze in stap 1 bepaalt welke stap 2/3 je krijgt (echte branching)

5. **"De Laatste Getuige"** — Iemand weet te veel over jou. Vind hem voor de politie dat doet.
   - Trigger: day 12+, heat 20+, 1+ completed arcs
   - 4 stappen, race-tegen-de-klok thema
   - Integratie met nemesis-systeem

### B. Betere Presentatie

1. **StoryArcEvent upgrade** — Volledige visuele overhaul:
   - Cinematische intro-animatie bij elke stap (fade-in met sfeerbeeld)
   - Scene-segmenten per stap (zoals CinematicOverlay) i.p.v. één blok tekst
   - Sfeer-tekst (italic, atmospheric) tussen keuzes
   - Letterbox-bars bij belangrijke stappen (stap 3+)
   - Ambient glow gebaseerd op arc-thema
   - Verbeterde keuze-kaarten met iconen en beschrijvingen

2. **Nieuwe cinematics** (4 extra):
   - "De Eerste Miljonair" — wanneer je €1.000.000 bereikt
   - "De Onderwereld Boog" — wanneer je alle 3 facties conquered
   - "De Schaduw Valt" — wanneer karma onder -75 zakt
   - "Verlossing" — wanneer karma boven 75 stijgt

3. **Story Journal/Logboek**:
   - Nieuw tabblad in het profiel dat alle actieve en voltooide verhaallijnen toont
   - Per arc: samenvatting, gemaakte keuzes, en consequenties
   - Visuele tijdlijn met iconen

## Technisch Plan

| Bestand | Wijziging |
|---------|-----------|
| `src/game/storyArcs.ts` | 5 nieuwe arc-templates toevoegen |
| `src/game/cinematics.ts` | 4 nieuwe cinematics + triggers |
| `src/components/game/StoryArcEvent.tsx` | Complete visuele overhaul met scene-segmenten, letterbox, ambient glow |
| `src/components/game/StoryJournal.tsx` | Nieuw component: verhaaldagboek |
| `src/game/types.ts` | GameView type uitbreiden met 'story-journal' |

Alle wijzigingen zijn client-side, geen database migraties nodig.

