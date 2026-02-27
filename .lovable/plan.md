

# Plan: MMO Gevechtssysteem Upgrade

## Overzicht
Het huidige PvP-systeem is een 1-klik aanval via de server. We upgraden dit naar een volledig turn-based PvP gevecht met skills, combo's, gear-zichtbaarheid en geanimeerde combat logs — vergelijkbaar met het bestaande PvE boss-systeem.

## 1. Combat Skills & Combo Systeem

### Nieuwe types (`src/game/types.ts`)
- `CombatSkill` interface: id, name, desc, icon, unlockLevel, cooldownTurns, energyCost, effect (damage/heal/stun/buff/debuff)
- `CombatBuff` interface: id, name, duration, effect (damageBoost/defenseBoost/regen/bleed)
- Uitbreiding `CombatState`: activeBuffs[], skillCooldowns{}, comboCounter, lastAction

### Skill definities (`src/game/combatSkills.ts` — nieuw bestand)
- **Level 1-5**: Snelle Slag (bonus dmg), Schild Muur (50% defense 2 turns)
- **Level 6-10**: Adrenaline Rush (heal + dmg boost), Vuistcombo (3-hit chain)
- **Level 11-15**: Dodelijke Precisie (crit guaranteed), Intimidatie (charm-based stun)
- **Level 16+**: Executie (bonus dmg op lage HP targets), Laatste Adem (auto-heal bij <20% HP)
- **Combo systeem**: 3 opeenvolgende aanvallen → combo meter vult → combo finisher unlocked (extra schade + stun)

## 2. PvP Turn-Based Gevecht

### Edge Function (`game-action/index.ts`)
- Nieuwe action: `pvp_combat_start` — creëert een `pvp_combat_sessions` record met beide spelers' stats
- Nieuwe action: `pvp_combat_action` — verwerkt een turn (attack/heavy/defend/skill), berekent schade, update session
- Bot-tegenstanders worden lokaal gesimuleerd (AI kiest random acties met weging op basis van HP)
- Real-player PvP: async turn-based — aanvaller vecht tegen een snapshot van de verdediger (geen wachttijd nodig)

### Database migratie
- Nieuwe tabel `pvp_combat_sessions`: id, attacker_id, defender_id, attacker_state (jsonb), defender_state (jsonb), combat_log (jsonb[]), status, winner_id, created_at
- RLS: spelers lezen eigen sessies

## 3. Gear & Stats Zichtbaarheid

### Pre-combat scherm (`PvPCombatPreview` component)
- Toon voor het gevecht begint: beide spelers naast elkaar
- Per speler: username, level, HP bar, uitgeruste weapon/armor/gadget met iconen
- Stats vergelijking: Muscle/Brains/Charm als bar-vergelijking
- Combat power schatting met breakdown
- "VECHT" knop om het gevecht te starten

### Aanpassing `handleListPlayers`
- Return extra velden: loadout gear IDs, stats object, backstory, rep — zodat het preview-scherm deze kan tonen

## 4. Combat Log & Animaties

### Nieuwe `PvPCombatView` component
- Hergebruikt `AnimatedHPBar`, `TypewriterText`, `CombatAction` uit bestaande CombatView
- **Skill buttons**: grid met 4 basis-acties + unlocked skills als extra rij
- **Combo meter**: visuele balk die vult bij opeenvolgende aanvallen
- **Buff/debuff indicators**: kleine iconen naast HP bars
- **Schade popups**: floating damage numbers bij hits (motion.div met fade-up)
- **Screen effects**: shake bij heavy hits, gold-flash bij crit, blood-flash bij grote schade
- **Turn indicator**: "BEURT 3" banner met animatie
- **Skill cooldown overlay**: grijze overlay + countdown op skills in cooldown

### Gevechtsresultaat
- Uitgebreide resultaat-popup: totale schade gegeven/ontvangen, skills gebruikt, combo's bereikt, XP/geld/rep winst
- Near-miss feedback (bestaand patroon)

## Technische Aanpak

### Bestanden wijzigen:
1. `src/game/types.ts` — CombatSkill, CombatBuff types + CombatState uitbreiding
2. `src/game/combatSkills.ts` — **nieuw** — skill definities + combo logica
3. `src/game/engine.ts` — combatAction uitbreiden met skills, buffs, combo tracking
4. `src/components/game/PvPAttackView.tsx` — pre-combat preview + redirect naar PvP combat
5. `src/components/game/PvPCombatView.tsx` — **nieuw** — volledige turn-based PvP UI
6. `src/components/game/CombatView.tsx` — skill buttons + combo meter toevoegen aan PvE
7. `supabase/functions/game-action/index.ts` — pvp_combat_start/action handlers
8. `src/game/reducers/combatHandlers.ts` — PvP combat dispatch handlers
9. `src/contexts/GameContext.tsx` — nieuwe dispatch types voor PvP combat
10. Database migratie voor `pvp_combat_sessions`

### Bestanden nieuw:
- `src/game/combatSkills.ts`
- `src/components/game/PvPCombatView.tsx`

