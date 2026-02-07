
# Noxhaven: Verhaal & Animatie Upgrade

## Overzicht
Dit plan voegt vier grote systemen toe: random story events met keuzes, verhaalbogen over meerdere dagen, meer missie-variatie, crew-persoonlijkheid, en een complete set animaties (typewriter, geld-tellers, scherm-effecten en kaart-animaties).

---

## Deel 1: Verhaal & Narratief

### 1A. Random Street Events (Straatgebeurtenissen met keuzes)
Tijdens het spelen (bij reizen, handelen of rondkijken) verschijnen er willekeurige verhalende pop-ups met 2-3 keuzes die echte gevolgen hebben.

**Voorbeelden:**
- "Een verwonde man strompelt naar je toe. Hij biedt je een koffer vol cash aan als je hem naar Port Nero brengt."
  - **Help hem** (Charm check): +geld, +rep, risico op heat
  - **Neem de koffer** (Muscle check): +geld, +heat, -rep
  - **Loop door**: Geen gevolgen
- "Een mysterieuze vrouw biedt je een tip over een grote lading in de haven."
- "Een kind steelt je portemonnee op straat."

Er komen 20+ unieke events met district-specifieke varianten. Events worden getriggerd bij TRAVEL, END_TURN en SOLO_OP acties met een configureerbare kans.

### 1B. Verhaalbogen (Multi-dag storylines)
Verhaallijnen die zich over meerdere dagen ontvouwen via het telefoonsysteem en speciale events:

**Drie startverhaalbogen:**
1. **De Informant** - Een mysterieuze bron stuurt berichten over een corrupt politienetwerk. Elke paar dagen een nieuw bericht met een keuze: vertrouw je hem, of is het een val?
2. **Het Erfenis-mysterie** - Je ontdekt dat een oud maffiafortuin ergens in Noxhaven verborgen is. Volg aanwijzingen over meerdere districten.
3. **De Rivaal** - Een nieuwe speler in de stad daagt je positie uit. Diplomatie of geweld?

Elke boog heeft 4-6 stappen, wordt random getriggerd na bepaalde game-condities (dag, rep, districts owned), en eindigt met een unieke beloning.

**Technisch:** Een nieuw `StoryArc` type in `types.ts` met `activeArcs` array in GameState die voortgang bijhoudt.

### 1C. Meer Missie-Variatie
- Verdubbeling van het aantal encounters per missie-type (van 2 naar 4-5 per type)
- Encounters worden random geselecteerd uit de pool (niet altijd dezelfde volgorde)
- Nieuwe encounter-typen: onderhandelingen, achtervolging, verraad-momenten
- Uitkomsten worden beinvloed door weer, district-rep en crew-specialisaties

### 1D. Crew Persoonlijkheid
- Elk crewlid krijgt een willekeurig **persoonlijkheidstrait** bij rekrutering (bijv. "Loyaal", "Hebzuchtig", "Rustig", "Impulsief")
- Traits beinvloeden missie-dialogen en keuze-uitkomsten
- Crewleden sturen af en toe persoonlijke berichten via de telefoon
- Bij speciale events kunnen crewleden een persoonlijke missie aanbieden

---

## Deel 2: Animaties

### 2A. Typewriter Tekst-Effect
- Een herbruikbaar `TypewriterText` component dat tekst letter voor letter toont
- Toegepast op: missie-encounter tekst, street events, verhaalboog-momenten
- Snelheid instelbaar, met een "skip" optie (tik om alles te tonen)
- Subtiel cursor-knippereffect aan het einde

### 2B. Geld & Resource Animaties
- **Animated Counter**: Geld in de header telt geleidelijk op/af bij veranderingen (van oud bedrag naar nieuw)
- **Reward Popup**: Bij het verdienen van geld verschijnt een "+€500" tekst die omhoog zweeft en verdwijnt
- **XP Bar Fill**: Progressiebalk vult vloeiend op bij XP-winst
- **Resource Shine**: Gouden glans-effect over verdiende bedragen

### 2C. Scherm-Effecten
- **Screen Shake**: Bij gevechtsacties en explosieve events (CSS keyframe animation)
- **Blood Flash**: Rood flash-effect bij het ontvangen van schade
- **Gold Flash**: Gouden flash bij grote beloningen
- **Fade Transitions**: Zachte fade/slide transities tussen alle game views (al deels aanwezig, wordt verbeterd)
- **Impact Pulse**: Korte puls-animatie op knoppen na interactie

### 2D. Kaart Animaties
- **Reis-animatie**: Bij reizen beweegt een klein icoon van district A naar B over de kaart
- **Pulserende districten**: Owned districten pulseren zachtjes, vijandige districten gloeien rood
- **Event markers**: Map events (politiecontroles etc.) hebben subtiele bounce/pulse animaties
- **Nemesis marker**: De nemesis-marker op de kaart beweegt vloeiender en heeft een dreigend glow-effect

---

## Technische Details

### Nieuwe Bestanden
```text
src/game/storyEvents.ts        - Street events database + logica
src/game/storyArcs.ts           - Verhaalbogen database + progressie-logica  
src/game/crewPersonality.ts     - Persoonlijkheidstraits + dialogen
src/components/game/StoryEventPopup.tsx  - UI voor random street events
src/components/game/StoryArcEvent.tsx    - UI voor verhaalboog-momenten
src/components/game/animations/TypewriterText.tsx
src/components/game/animations/AnimatedCounter.tsx
src/components/game/animations/RewardPopup.tsx
src/components/game/animations/ScreenEffects.tsx
```

### Aangepaste Bestanden
```text
src/game/types.ts              - Nieuwe types (StoryArc, StreetEvent, PersonalityTrait)
src/game/constants.ts           - Crew personality data
src/game/missions.ts            - Extra encounters + shuffle-logica
src/contexts/GameContext.tsx     - Nieuwe actions en state
src/components/game/GameLayout.tsx - Screen effects wrapper + story event layer
src/components/game/GameHeader.tsx - AnimatedCounter voor geld
src/components/game/MissionEncounterView.tsx - Typewriter effect
src/components/game/CombatView.tsx - Screen shake + damage flash
src/components/game/CityMap.tsx    - Kaart animaties
src/components/game/NightReport.tsx - Verbeterde animaties
src/index.css                     - Nieuwe keyframe animaties
```

### State Uitbreidingen (types.ts)
- `activeStoryArcs: StoryArc[]` - Actieve verhaalbogen
- `completedArcs: string[]` - Voltooide bogen
- `pendingStreetEvent: StreetEvent | null` - Huidige street event popup
- `crewPersonalities: Record<number, PersonalityTrait>` - Crew traits
- `lastRewardAmount: number` - Voor reward popup animatie

### Implementatievolgorde
1. Typewriter component + screen effects (basis animatie-infra)
2. AnimatedCounter voor geld in header
3. Street Events systeem + popup
4. Verhaalbogen systeem
5. Extra missie-encounters + shuffle
6. Crew persoonlijkheid
7. Kaart animaties
8. Combat effecten (shake, flash)
9. Reward popups
10. Integratie en finetuning

### Omvang
Dit is een grote feature-set. De implementatie zal worden verdeeld over meerdere stappen, maar alle onderdelen werken samen om een veel rijkere en steeds andere spelervaring te creeren.
