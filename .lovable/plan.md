
# Plan: Crew Loyaliteitsmissies + Contract Missies District-Specifiek

## Deel 1: Crew Loyaliteitsmissies & Persoonlijke Verhaalbogen

### Wat verandert er?
Elk crewlid krijgt een persoonlijkheidstrek (loyaal, hebzuchtig, slim, etc.) die al in het type-systeem bestaat maar nog niet gebruikt wordt. Op basis van deze trek krijgen ze unieke loyaliteitsmissies die je relatie met hen verdiepen. Deze missies verschijnen als telefoonberichten en kunnen geaccepteerd of genegeerd worden.

### Nieuwe features:
- **Persoonlijke crew-events**: Elk crewlid kan om de ~5 dagen een persoonlijk verzoek sturen via de telefoon, gebaseerd op hun persoonlijkheidstrek en rol
- **Loyaliteitsmissies**: Korte keuze-events (2-3 opties) met gevolgen voor loyaliteit, geld, heat of reputatie
- **Crew verhaalbogen**: Bij loyaliteit 80+ unlockt een crewlid een speciale "trouw" bonus; bij loyaliteit onder 30 krijg je een ultimatum-event
- **Beloningssysteem**: Succesvolle loyaliteitsmissies geven +15-25 loyaliteit en soms unieke bonussen (stat boost, gratis gear, factie-connecties)

### Voorbeelden van crew-events per persoonlijkheid:
- **Loyaal**: "Baas, ik hoorde dat [factie] een prijs op je hoofd heeft gezet. Laat me uitzoeken wie de mol is."
- **Hebzuchtig**: "Ik heb een tip over een onbewaakte kluis. 50/50 split. Wat zeg je?"
- **Paranoid**: "Er volgt iemand ons al drie dagen. Ik wil een safehouse-check doen."
- **Brutaal**: "Die vent in [district] had een grote mond over onze crew. Zal ik hem een bezoekje brengen?"
- **Slim**: "Ik heb de beveiligingscodes van [district] gekraakt. Wil je ze gebruiken?"

---

## Deel 2: Contract Missies District-Specifiek

### Wat verandert er?
De vier contracttypes (delivery, combat, stealth, tech) krijgen volledige district-specifieke encounter-teksten, net als de solo operaties. Nu hebben ze slechts 2-3 generieke district-varianten per encounter; dit wordt uitgebreid naar alle 5 districten met langere, meeslepende beschrijvingen.

### Aanpassingen per contracttype:

**Delivery (Koeriersdienst/Wapenlevering/Smokkelroute)**
- Port Nero: Havensmokkkel via containerschepen, douane-ontwijking
- Crown Heights: Discrete leveringen aan penthouse-klanten, valet-drops
- Iron Borough: Fabrieksterreinen, bewakingshonden, industriele routes
- Lowrise: Steegjes, dakroutes, straatgangs als escort
- Neon Strip: Club-achterkamers, casino-drops, nachtleven als dekking

**Combat (Rivalen Intimideren/Bescherming)**
- Elk district met unieke locaties (haven-containers, penthouses, fabrieken, steegjes, clubs)

**Stealth (Inbraak/Safe Kraken)**
- Crown Heights: Biometrische beveiliging, lasers, privesecurity
- Port Nero: Roestige magazijnen, haven-bewaking
- Alle 5 districten volledig ingevuld

**Tech (Datadiefstal/Server Hack/Surveillance)**
- Elk district met unieke server-locaties en hacking-scenario's

---

## Technische Details

### Nieuwe bestanden:
- `src/game/crewEvents.ts` — Crew loyaliteitsmissie-systeem met persoonlijkheidsgebonden events, keuze-logica en beloningen

### Aangepaste bestanden:
1. **`src/game/crewLoyalty.ts`** — Integratie van crew-events in de nachtcyclus; trigger voor persoonlijke verzoeken
2. **`src/game/missions.ts`** — Alle `CONTRACT_ENCOUNTERS` (delivery, combat, stealth, tech) uitbreiden met volledige `districtVariants` voor alle 5 districten, plus langere encounter-teksten
3. **`src/game/types.ts`** — Nieuw type `CrewLoyaltyEvent` toevoegen aan GameState voor actieve crew-events
4. **`src/contexts/GameContext.tsx`** — Nieuwe reducer actions voor crew-event keuzes (`CREW_EVENT_CHOICE`)
5. **`src/components/game/GameLayout.tsx`** of telefoon-overlay — UI voor crew-events weergeven als telefoonberichten met keuzemogelijkheden

### Bestaande patronen gevolgd:
- Crew personalities (`crewPersonalities` in GameState) worden al bijgehouden maar niet gebruikt — dit plan activeert ze
- Phone messages (`addPhoneMessage`) worden al gebruikt voor crew-communicatie
- Mission encounter structuur (`MissionEncounter` met `districtVariants`) wordt hergebruikt
- `PersonalityTrait` type bestaat al met 8 varianten
