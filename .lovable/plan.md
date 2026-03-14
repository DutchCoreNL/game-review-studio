

## Level-up & Skill Systeem Analyse — Bevindingen

### Gevonden problemen

**1. Server geeft GEEN merit points bij level-up (BUG)**
- **Client** (`src/game/engine.ts:1526`): geeft correct `getMeritPointsForLevelUp()` merit points per level-up
- **Server** (`supabase/functions/game-action/index.ts:3780-3795`): geeft alleen SP en milestone SP, maar **geen merit points**
- De server update `player_state` zonder `merit_points` kolom te verhogen
- Resultaat: na server sync verdwijnen lokaal verdiende merit points

**2. Server geeft GEEN stat points bij level-up (BUG)**
- **Client** (`engine.ts:1517`): geeft +1 `statPoints` per level-up
- **Server** (`game-action/index.ts:3785`): geeft alleen `SP_PER_LEVEL` (skill points), maar **geen stat_points**
- `SYNC_SERVER_XP` (`GameContext.tsx:3940`) overschrijft `skillPoints` met server waarde, maar raakt `statPoints` niet aan — dus lokale stat points overleven, maar de server weet er niks van
- Bij een cloud reload gaan stat points mogelijk verloren als ze niet in `save_data` zitten

**3. Lokale level-up verwerkt maar 1 level tegelijk (MINOR)**
- `gainXp()` in `engine.ts:1511-1533` doet `if (xp >= nextXp)` maar geen `while`-loop
- Als een XP-gain meerdere levels overslaat (bijv. door milestones of grote XP), wordt slechts 1 level-up verwerkt
- Server doet dit correct met een `while`-loop (`game-action:3781`)

**4. `SYNC_SERVER_XP` mist merit points sync**
- De `SYNC_SERVER_XP` action (`GameContext.tsx:3935-3942`) synct `xp`, `level`, `nextXp`, `skillPoints`, `streak` — maar **niet** `statPoints` of `meritPoints`
- Na server XP sync zijn lokale merit/stat points out-of-sync met wat de server denkt

### Wat klopt wel
- XP-curve: beide zijden gebruiken `100 * 1.15^(level-1)` — consistent
- SP per level: client (+2) en server (`SP_PER_LEVEL = 2`) komen overeen
- Milestone SP bonussen: beide zijden laden `LEVEL_MILESTONES` en voegen `sp_bonus` toe
- Milestone cash/rep rewards: server past deze correct toe
- Skill tree unlock-logica (`canUnlockSkill`): tier/level/parent vereisten kloppen
- Merit node unlock-logica (`canUnlockMeritNode`): prerequisite/cost checks kloppen
- Prestige vereisten en SP carry-over: consistent

### Implementatieplan

**A. Server-side: merit + stat points toevoegen aan level-up** (`supabase/functions/game-action/index.ts`)
- In de `while`-loop bij level-up (regel 3781-3795):
  - Track `meritGained` met dezelfde `getMeritPointsForLevelUp()` logica (1 per level + bonus bij milestones)
  - Track `statPointsGained` (+1 per level)
- Na de loop: update `player_state` met `merit_points` en `stat_points` increment
- Return `meritGained` en `newStatPoints` in response data

**B. Client-side: multi-level-up fix** (`src/game/engine.ts`)
- Verander `if (xp >= nextXp)` naar `while (xp >= nextXp)` loop zodat meerdere level-ups in 1 XP-gain correct verwerkt worden

**C. SYNC_SERVER_XP uitbreiden** (`src/contexts/GameContext.tsx`)
- Voeg `meritPoints` en `statPoints` toe aan de action data type
- Sync deze velden vanuit server response

**D. Kolommen controleren** (database check)
- Bevestigen dat `player_state` tabel `merit_points` en `stat_points` kolommen heeft; zo niet, migratie toevoegen

