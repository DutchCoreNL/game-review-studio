

## Cloud Save Systeem — Analyse & Bevindingen

### Wat werkt goed
- **Save flow**: `handleSaveState` slaat `save_data` op, bumpt `save_version`, en roept `syncStateFromSaveData` aan om relationele tabellen te synchroniseren
- **Load flow**: `handleLoadState` haalt `save_data` + metadata op; client vergelijkt cloud vs local op basis van dag + timestamp
- **Conflict resolution**: "newest wins" logica (cloudDay vs localDay + timestamp) werkt correct
- **Auto-save**: elke 2 minuten via interval, `stateRef` wordt onmiddellijk bijgewerkt (geen debounce)
- **Economy merge**: na server-acties worden inventory/gear/money correct gemerged via `MERGE_SERVER_STATE`
- **`syncStateFromSaveData`**: synct money, inventory, gear, player stats naar relationele tabellen bij elke cloud save
- **`noxhaven_last_save_time`**: consistent gezet in zowel `engine.ts` als `GameContext.tsx` debounced save
- **`merit_points` + `stat_points`**: kolommen bestaan in DB, server level-up logic is correct, `SYNC_SERVER_XP` synct ze

### Gevonden problemen

**1. `syncStateFromSaveData` mist `merit_points` en `stat_points` (BUG)**
- Regel 731-765: de sync helper mapt `sd.player.skillPoints` → `skill_points`, maar **niet** `sd.meritPoints` → `merit_points` en `sd.player.statPoints` → `stat_points`
- Bij cloud save worden deze waarden in `save_data` opgeslagen maar niet naar de kolommen geschreven
- Server-side level-up (via `gain_xp`) schrijft ze wél naar kolommen
- Risico: na cloud save + reload kunnen kolommen en save_data uit sync raken als er lokaal merit/stat points zijn gebruikt

**2. `MERGE_SERVER_STATE` mist `meritPoints` en `statPoints` (BUG)**
- Regel 3683-3731: het `MERGE_SERVER_STATE` case mergt `player.skillPoints`, `player.stats`, `player.loadout` maar **niet** `meritPoints` of `player.statPoints`
- Na een economy-actie worden deze velden niet van server naar client gesynct
- Dit kan leiden tot desync als server een level-up verwerkt met merit/stat points

**3. `mergeServerState` helper in `useServerSync.ts` mist `meritPoints`/`statPoints` (BUG)**
- Regel 224-291: de merge functie stuurt `player.skillPoints` mee maar niet `meritPoints` of `statPoints` vanuit `ps.merit_points` / `ps.stat_points`

**4. Geen foutmelding bij cloud save failure voor gebruiker (MINOR)**
- Regel 107: bij `catch` in `saveToCloud` wordt alleen `syncing: false` gezet, geen toast of error feedback
- Gebruiker weet niet dat auto-save faalde

**5. `SET_STATE` bij cloud load muteert het action object (MINOR)**
- Regel 429-433: `loaded.backstory = s.backstory` muteert direct het action object i.p.v. de draft — dit is technisch onveilig met Immer maar werkt omdat `SET_STATE` de hele state vervangt

### Implementatieplan

**A. `syncStateFromSaveData` uitbreiden** (`supabase/functions/game-action/index.ts`)
- Voeg toe na de `sd.player` blok (rond regel 761):
  - `if (sd.meritPoints !== undefined) stateUpdate.merit_points = sd.meritPoints;`
  - `if (sd.player?.statPoints !== undefined) stateUpdate.stat_points = sd.player.statPoints;`

**B. `mergeServerState` in `useServerSync.ts` uitbreiden** (regel 263-270)
- Voeg `meritPoints: ps.merit_points` toe aan het economy-blok van de serverState
- Voeg `statPoints: ps.stat_points` toe aan `player` sub-object

**C. `MERGE_SERVER_STATE` reducer uitbreiden** (`src/contexts/GameContext.tsx`, regel 3714-3722)
- Na `if (ss.player.loadout)`: voeg toe:
  - `if (ss.player?.statPoints !== undefined) s.player.statPoints = ss.player.statPoints;`
- Na de player blok: `if (ss.meritPoints !== undefined) s.meritPoints = ss.meritPoints;`

**D. Auto-save error feedback** (`src/hooks/useServerSync.ts`, regel 107)
- Optioneel: log of toon een subtiele waarschuwing bij herhaalde save failures

Geen database migraties nodig — kolommen bestaan al.

