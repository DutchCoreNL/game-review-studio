

## Plan: Verhaalsysteem MMO-Verbeteringen

### Analyse — Wat is nu puur solo?

| Systeem | Status | Probleem |
|---------|--------|----------|
| Story Arcs (3 bogen) | 100% solo | Keuzes hebben geen effect op andere spelers |
| Backstory Arcs (3 bogen) | 100% solo | Geen interactie met spelers die andere backstory kozen |
| Street Events (~30) | 100% solo | Resultaten zijn alleen lokaal zichtbaar |
| NPC Events (5 NPCs) | 100% solo | NPC-relaties staan los van andere spelers |

### Verbeteringen

#### 1. Speler-keuzes genereren district-breed nieuws & events
Wanneer een speler een story arc-stap voltooit, wordt het resultaat omgezet naar een **nieuwsbericht** en optioneel een **follow-up street event** voor andere spelers in hetzelfde district.

Voorbeeld: Speler A kiest "CHANTEER DE VRIES" → andere spelers in Iron District krijgen event: *"Er gaan geruchten over een corrupte agent die is ontmaskerd. Dit is je kans om ervan te profiteren."*

**Wijzigingen:**
- `storyArcs.ts`: `resolveArcChoice` stuurt resultaat naar `district_events` tabel (nieuw veld `triggered_by`)
- `storyEvents.ts`: Nieuwe event-categorie `player_triggered` die reageert op `district_events`
- `world-tick`: Verwerkt arc-resultaten tot server-events

#### 2. Gang Story Missions — Gedeelde verhaalbogen voor gangs
Nieuwe arc-categorie die alleen door gangs gestart kan worden. Stappen worden verdeeld over gang-leden: ieder lid kiest een andere aanpak, en het gecombineerde resultaat bepaalt de uitkomst.

Voorbeeld: *"De Kartel-Connectie"* — 4 stappen, elk lid kiest parallel. Meer successen = betere gang-beloning.

**Wijzigingen:**
- Nieuw bestand `src/game/gangArcs.ts` met `GangArcTemplate` type
- `game-action/index.ts`: Nieuwe handlers `start_gang_arc`, `resolve_gang_arc_step`
- Database: `gang_story_arcs` tabel (gang_id, arc_id, step, member_choices JSONB)

#### 3. Rivaal-systeem met echte spelers
De bestaande "De Rivaal" arc wordt uitgebreid: in plaats van een NPC-rivaal wordt een **echte speler** met vergelijkbare stats automatisch toegewezen als nemesis. Arc-stappen verwijzen naar hun echte acties.

**Wijzigingen:**
- `storyArcs.ts`: Rivaal-arc detecteert echte speler via `player_state` query
- `game-action/index.ts`: `assign_nemesis` handler die een speler koppelt op basis van level/district
- Nemesis-acties (trades, gevechten, territory) genereren arc-events voor beide spelers

#### 4. NPC-loyaliteit beïnvloed door meerdere spelers
NPCs reageren op de **collectieve** relatie van alle spelers in hun district. Als te veel spelers een NPC beledigen, wordt de NPC vijandelijk voor iedereen. Als genoeg spelers helpen, ontgrendelt de NPC district-brede bonussen.

**Wijzigingen:**
- Database: `npc_district_mood` tabel (npc_id, district_id, collective_score)
- `world-tick`: Berekent collectieve NPC-mood per district
- `npcEvents.ts`: Events en dialoog variëren op basis van collectieve mood
- Nieuwe NPC-states: `friendly` (bonus voor district), `hostile` (events blokkeren), `legendary` (unieke quest)

#### 5. Backstory-kruisingen
Spelers met verschillende backstories krijgen speciale interactie-events wanneer ze elkaar tegenkomen in hetzelfde district. De Weduwnaar en de Bankier hebben overlappende vijanden; het Straatkind kent plekken die de anderen niet kennen.

**Wijzigingen:**
- `storyEvents.ts`: Nieuwe `backstory_crossover` events die triggeren wanneer spelers met verschillende backstories in hetzelfde district zijn
- `game-action/index.ts`: Check bij travel of er een crossover-partner aanwezig is
- 3 crossover-events (Weduwnaar×Bankier, Bankier×Straatkind, Straatkind×Weduwnaar)

### Technische Stappen

1. **Database migratie**: `gang_story_arcs`, `npc_district_mood` tabellen + `triggered_by` kolom op `district_events`
2. **Gang Story Missions**: `gangArcs.ts` + server handlers voor parallelle gang-keuzes
3. **Arc → Nieuws pipeline**: Arc-resultaten schrijven naar `district_events` met speler-context
4. **Rivaal-koppeling**: Nemesis-toewijzing op basis van echte spelerdata
5. **NPC collectieve mood**: World-tick berekent en past NPC-status aan per district
6. **Backstory crossovers**: 3 nieuwe event-templates met multiplayer-triggers
7. **Client UI**: Gang arc panel in WarView, nemesis-indicator op kaart, NPC mood-indicator

