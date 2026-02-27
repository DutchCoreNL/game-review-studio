

# Analyse: Singleplayer functies die verbeterd moeten worden voor MMO

Na een grondige audit van de volledige codebase heb ik een duidelijk patroon gevonden: het spel heeft een **hybride architectuur** waarbij sommige systemen al via de server-side edge function draaien (trade, travel, solo ops, PvP, gangs, messaging, bounties) maar veel kernfuncties nog **puur client-side** werken via de lokale `GameContext` reducer en `localStorage`. Dit creëert inconsistentie en potentieel voor cheating.

## Problematische singleplayer systemen

### 1. Casino (volledig client-side, geen server-validatie)
- Blackjack, Roulette, Slots, High-Low en Russian Roulette draaien volledig in de browser
- Spelers kunnen via devtools hun geld manipuleren of winsten faken
- **Verbetering**: Server-side casino sessies met seed-based RNG, anti-exploit limieten

### 2. Heists (volledig client-side)
- Planning, recon, equipment, uitvoering en beloningen worden allemaal lokaal berekend
- Geen validatie dat de speler daadwerkelijk de juiste gear/crew/level heeft
- **Verbetering**: Server-side heist sessies met gevalideerde fasen en beloningen

### 3. Contract/Missie systeem (client-side)
- `EXECUTE_CONTRACT` en het complete missiesysteem (briefing, encounters, keuzes) zijn client-only
- Contractbeloningen, XP en rep worden lokaal toegekend zonder server-check
- **Verbetering**: Server-side contract executie met gevalideerde beloningen

### 4. Faction/Conquest systeem (client-side)
- Faction relations, conquest phases, alliance pacts - allemaal lokaal
- Spelers kunnen facties "veroveren" zonder server-validatie
- **Verbetering**: Server-side faction state die gedeeld is tussen alle spelers

### 5. Villa & Drug Empire (client-side)
- Villa aankoop, modules, productie, dealers, NoxCrystal - volledig lokaal
- Passieve inkomsten worden client-side berekend (manipuleerbaar)
- **Verbetering**: Server-side villa state en productie via passive-income edge function

### 6. Hitman/Bounty systeem (hybride, inconsistent)
- Server-side bounties op spelers bestaan al, maar singleplayer hit contracts zijn puur lokaal
- **Verbetering**: Hit contracts via server valideren (energy/nerve check, cooldown)

### 7. Car Theft & Chop Shop (client-side)
- Autodiefstal, omkatten, upgraden, verkopen - allemaal lokaal
- **Verbetering**: Server-side gestolen auto registry (voorkomt duplicatie/exploits)

### 8. Corruption Network (client-side)
- Corrupte contacten (rechter, advocaat, douane) worden lokaal beheerd
- **Verbetering**: Server-side contact state met maandelijkse kosten via passive-income

### 9. Day Progression / Night Report (client-side AUTO_TICK)
- De kernloop van het spel (dag wisselen, passieve inkomsten, events) draait via een client-side timer
- Dit is het grootste probleem: spelers kunnen de klok manipuleren
- **Verbetering**: Server-side tick via de bestaande `passive-income` edge function

### 10. Nemesis systeem (client-side)
- De hele rivaal AI (spawn, combat, wraakacties, defeat choices) is lokaal
- In een MMO zou de nemesis gedeeld of persistent moeten zijn
- **Verbetering**: Nemesis state opslaan in DB, wraakacties via passive-income verwerken

## Prioriteiten (impact vs. complexiteit)

```text
Hoog impact, laag complex:
├── Casino server-validatie (voorkomt geldexploits)
├── Contract/Solo-op beloningen server-side valideren
└── Villa passieve inkomsten via passive-income function

Hoog impact, medium complex:
├── Day progression naar server-side tick
├── Faction conquest shared state
└── Heist server-side sessies

Medium impact:
├── Car theft server registry
├── Corruption network server state
├── Hit contracts server-validatie
└── Nemesis persistence
```

## Aanbevolen implementatievolgorde

1. **Casino server-validatie** -- Nieuwe edge function actions: `casino_bet`, `casino_result` met server-side RNG seed. Voorkomt het grootste exploitrisico.

2. **Passieve inkomsten centraliseren** -- De bestaande `passive-income` edge function uitbreiden met villa productie, business income, drug empire, heat decay. Dit vervangt de client-side `endTurn()`.

3. **Contract/missie beloningen server-side** -- Nieuwe action `complete_contract` die crew, level, gear valideert en pas dan rewards toekent.

4. **Faction state naar database** -- `faction_relations` tabel die gedeeld is. Conquest phases worden server-validated. Alliance pacts worden zichtbaar voor andere spelers.

5. **Heist sessies server-side** -- Vergelijkbaar met PvP combat sessions: `heist_sessions` tabel met fase-tracking.

6. **Villa/Drug Empire naar server** -- `player_villa` en `player_drug_empire` tabellen met server-side productie.

7. **Overige systemen** -- Car theft registry, corruption contacts, nemesis persistence.

## Technische aanpak per stap

Elke stap volgt hetzelfde patroon:
- Database migratie: nieuwe tabel(len) aanmaken
- Edge function handler toevoegen aan `game-action/index.ts`
- `gameApi.ts` uitbreiden met nieuwe action types
- Client-side reducer aanpassen om server-response te gebruiken i.p.v. lokale berekening
- Bestaande UI componenten hoeven nauwelijks te wijzigen (alleen de dispatch/API call laag)

