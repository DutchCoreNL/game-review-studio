

## Plan: Gevechts- en Event-systeem MMO Verbeteringen

### Huidige Situatie

**Gevechtsysteem:**
- PvP combat draait deels client-side (via `combatSkills.ts`) en deels server-side (`game-action/index.ts`)
- De server-side AI is simplistisch: random keuze tussen attack/heavy/defend op basis van HP%
- Geen gear-effecten voor de verdediger, geen skill-gebruik door AI
- Beloningen zijn vast (50 XP, 15 heat) — geen schaling naar level/moeilijkheid
- Geen ELO/ranking of matchmaking
- Max 20 beurten, daarna HP%-vergelijking

**Event-systeem:**
- ~30 statische events met geavanceerde filters (district, fase, karma, NPC)
- Cooldown van 10 minuten tussen events
- Follow-up ketens en nieuws-broadcasts bestaan al
- Geen interactie tussen spelers bij events (geen coöp)
- Events zijn puur client-side getriggerd, server-driven events bestaan alleen als district_events

---

### Verbeteringen

#### 1. Slimmere PvP AI (server-side)
De verdediger-AI in `handlePvPCombatAction` wordt uitgebreid:
- **Skill-gebruik door AI**: verdediger gebruikt ook combat skills (gebaseerd op level) met cooldown-tracking
- **Gear-bonus**: verdediger's loadout beïnvloedt stats (nu genegeerd)
- **Adaptieve strategie**: AI reageert op speler-patronen (bijv. als speler 3x aanvalt → AI verdedigt; als speler verdedigt → AI gebruikt heavy)
- **Level-schaling beloningen**: XP/geld-beloning schaalt met het level-verschil

**Bestanden:** `supabase/functions/game-action/index.ts`

#### 2. Server-validated Combat met Gear-synergy
- Defender's gear stats worden meegenomen in damage-berekening (armor reduceert schade, gadgets verhogen dodge-kans)
- Wapen-specifieke effecten: shotgun heeft kans op AoE-bleed, sniper heeft hogere crit-chance
- Combat-resultaat genereert context-specifiek nieuws voor het district

**Bestanden:** `supabase/functions/game-action/index.ts`

#### 3. Server-driven Dynamische Events
De `world-tick` genereert nu district-brede interactieve events die meerdere spelers kunnen beïnvloeden:
- **Coöperatieve events**: "Politie-razzia in Port Nero — spelers die samenwerken krijgen minder heat" (meerdere spelers in district = betere uitkomst)
- **Competitieve events**: "Wapendrop in Iron Borough — eerste speler die claimt wint" (via `district_events` tabel met `claimed_by`)
- **Escalatie-events**: events die erger worden als niemand reageert (bijv. gang-oorlog escaleert → hogere heat voor heel district)

**Bestanden:** `supabase/functions/world-tick/index.ts`, `src/game/storyEvents.ts`

#### 4. Speler-interactie Events
Nieuwe event-types die spelers met elkaar verbinden:
- **Getuige-events**: "Je zag [speler X] een deal sluiten — verraad of negeer?" → stuurt bericht naar die speler
- **Alliantie-events**: events met betere beloningen als je gang-leden in hetzelfde district hebt
- **Bounty-trigger events**: specifieke events alleen voor spelers met een actieve bounty

**Bestanden:** `src/game/storyEvents.ts`, `src/contexts/GameContext.tsx`

#### 5. Combat Rating & Matchmaking
- Nieuw `combat_rating` veld in `player_state` (Elo-achtig systeem)
- Na elke PvP-winst/verlies wordt rating aangepast
- Spelerlijst toont rating en moeilijkheidsgraad-indicator
- Betere beloningen voor gevechten tegen hoger-gerankten

**Bestanden:** `supabase/functions/game-action/index.ts`, database migratie voor `combat_rating` kolom

---

### Technische Stappen

1. **Database migratie**: `combat_rating INTEGER DEFAULT 1000` toevoegen aan `player_state`; `claimed_by UUID` en `claimed_at TIMESTAMP` toevoegen aan `district_events`
2. **Server AI verbeteren**: skill-gebruik, gear-synergy en adaptieve patronen in `handlePvPCombatAction`
3. **Combat rating berekening**: Elo-update na elk gevecht in `handlePvPCombatAction` en `handleAttack`
4. **World-tick coöp/competitieve events**: nieuwe event-generatoren met claim-mechanisme
5. **Client-side integratie**: event-claim UI, rating-display in leaderboard/spelerlijst
6. **Speler-interactie events**: nieuwe event-definities met multiplayer-effecten

