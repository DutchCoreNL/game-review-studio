

## Analyse: Factie-systeem in MMO Context

### Wat al werkt (server-side)
- **World Boss mechaniek**: `handleAttackFaction` in `game-action` tracked schade per speler, 3-fase conquest (defense → subboss → leader), boss HP gedeeld
- **48h reset timer**: `world-tick` reset conquered facties automatisch na 48 uur
- **Damage leaderboard**: Top-3 beloningen bij conquest (€50k/€25k/€10k)
- **Realtime updates**: `useFactionState` hook luistert naar postgres_changes
- **FactionCard**: Toont boss HP bar, damage leaderboard, countdown timer, conquest fases

### Problemen / Ontbrekende stukken

1. **Client-side staat conflicteert met server**: `state.conqueredFactions`, `state.leadersDefeated`, `state.familyRel` zijn lokale game state die niets weten van andere spelers. Het FamiliesPanel toont "vazal" alleen als de lokale speler het heeft veroverd.

2. **Relatie-systeem is single-player**: Elke speler heeft z'n eigen `familyRel[familyId]` — maar in een MMO zou de relatie per-speler moeten zijn (al server-side) OF gedeeld (global_relation in `faction_relations`).

3. **Conquest fases starten lokaal**: `canStartConquestPhase` en `getConquestPhase` checken lokale state in plaats van de server faction state.

4. **Geen schaling**: Boss HP is vast 100/150 — met veel spelers gaat dit te snel. HP zou moeten schalen met actieve spelers.

5. **Geen factie-bonussen voor gang**: Gangs zouden factie-territory voordelen moeten krijgen.

### Aanbevolen aanpak

**Stap 1: Server-authoritative faction state**
- FactionCard en FamiliesPanel volledig laten leunen op `mmoFaction` data uit `useFactionState` in plaats van lokale `state.conqueredFactions` / `state.leadersDefeated`
- Conquest fases, boss HP, relatie status — allemaal uit de server

**Stap 2: Boss HP schaling**
- In `handleAttackFaction`: boss_max_hp schalen op basis van aantal unieke aanvallers (bijv. base 100 + 20 per extra aanvaller, max 500)
- Dynamische moeilijkheidsgraad

**Stap 3: Gang-factie koppeling**
- Gangs kunnen een factie "claimen" na conquest — de hele gang krijgt bonussen
- Gang-leden bijdragen tellen samen voor gang-ranking per factie

**Stap 4: Seizoensrotatie**
- Facties krijgen een wekelijkse "event modifier" (bijv. Cartel is deze week +50% sterker, maar geeft dubbele rewards)
- Variatie per week via `world_state.active_event`

### Implementatiestappen

1. **Verwijder lokale faction conquest state** — `conqueredFactions`, `leadersDefeated` checks in FactionCard/FamiliesPanel vervangen door `mmoFaction.status` en `mmoFaction.conquered_by`
2. **Boss HP schaling** — update `handleAttackFaction` om boss_max_hp dynamisch te verhogen op basis van `Object.keys(total_damage_dealt).length`
3. **Conquest bonussen voor hele gang** — als de conqueror in een gang zit, krijgen alle gangleden de vazal-bonussen (korting, passief inkomen)
4. **FamiliesPanel updaten** — conquest voortgangsbalk tonen op basis van server data, niet lokale arrays
5. **Wekelijkse factie-modifiers** — in `world-tick` een random factie-buff/debuff toevoegen die meeweegt in combat

