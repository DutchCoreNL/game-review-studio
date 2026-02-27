

## Plan: Prestige Reset + Hardcore Mode

### 1. Database Migration

Add columns to `leaderboard_entries` and `player_state`:
- `leaderboard_entries`: add `is_hardcore boolean DEFAULT false`
- `player_state`: add `is_hardcore boolean DEFAULT false`, `prestige_level` already exists as `prestige_level`

Note: `prestigeLevel` already exists in GameState and `prestige_level` in leaderboard. We need a separate `is_hardcore` flag.

### 2. Types (`src/game/types.ts`)

- Add `hardcoreMode: boolean` to `GameState`
- Add `prestigeResetCount: number` to `GameState` (tracks voluntary resets, separate from `newGamePlusLevel`)

### 3. Prestige Reset Logic (`src/game/endgame.ts`)

New function `createPrestigeReset(state)`:
- Requires Level 15+ and not hardcore
- Increments `prestigeLevel` (already exists in state)
- Full reset to `createInitialState()` but keeps: achievements, runHistory, prestigeLevel, backstory choice
- Permanent bonuses per prestige level:
  - +5% XP gain (applied in engine)
  - +€2000 starting cash per level
  - +1 base stat point per level
  - Prestige badges (already implemented via `PrestigeBadge` component)
- Saves run to `runHistory`

### 4. Hardcore Mode Logic (`src/game/endgame.ts`)

New function `createHardcoreStart()`:
- Sets `hardcoreMode: true`
- Sets `MAX_HOSPITALIZATIONS` to 0 effectively (1 death = game over)
- +50% money rewards (stored as multiplier)
- Remove "Last Stand" mechanic if exists

Modify game over check in `GameContext.tsx`:
- If `hardcoreMode` and `hospitalizations >= 1` → game over

### 5. Initial State (`src/game/constants.ts`)

- Add `hardcoreMode: false` and `prestigeResetCount: 0` to `createInitialState()`

### 6. Reducer Actions (`src/contexts/GameContext.tsx`)

New actions:
- `PRESTIGE_RESET`: calls `createPrestigeReset()`, resets game
- `START_HARDCORE`: creates new game with hardcore flag

Modify `NEW_GAME_PLUS` handler to also pass through `hardcoreMode` if active.

Modify hospitalization handler: if `hardcoreMode`, first hospitalization = game over.

### 7. XP Bonus Application (`src/game/engine.ts`)

In `gainXp()`: multiply XP by `1 + (prestigeLevel * 0.05)`.

Modify reward calculations: if `hardcoreMode`, multiply cash rewards by 1.5.

### 8. Sync Leaderboard Integration

Update `syncLeaderboard` call in GameContext to include `is_hardcore: state.hardcoreMode`.

Update edge function `sync-leaderboard/index.ts`:
- Accept and validate `is_hardcore` boolean
- Store in leaderboard entry

### 9. UI: Prestige Reset Button (`src/components/game/VictoryScreen.tsx`)

Add "PRESTIGE RESET" button alongside NG+ button:
- Only visible when `player.level >= 15` or victory achieved
- Shows prestige level preview and bonus summary
- Gold styling with star icon

### 10. UI: Hardcore Mode Option (`src/components/game/MainMenu.tsx`)

Add "HARDCORE MODE" button on main menu / new game screen:
- Skull icon, red/blood styling
- Confirm dialog warning about permadeath
- Shows +50% rewards info

### 11. UI: Leaderboard Tabs (`src/components/game/LeaderboardView.tsx`)

Add tab filter: "ALLE" | "HARDCORE"
- Filter entries by `is_hardcore` flag
- Hardcore entries get skull icon badge

### 12. Game Over Screen Update (`src/components/game/GameOverScreen.tsx`)

- Show "HARDCORE" label if died in hardcore mode
- Different flavor text for hardcore death
- Option to start new hardcore run

### 13. Profile View Updates

- Show prestige level and bonuses in `StatsOverviewPanel`
- Show hardcore badge if active

### Technical Details

- `hardcoreMode` persists through NG+ if started as hardcore
- Prestige resets are independent of NG+ (voluntary reset at Level 15+ anytime, not just at victory)
- Prestige bonuses stack with NG+ bonuses
- Hardcore + Prestige can combine: a hardcore player at P3 gets both bonuses
- Leaderboard `is_hardcore` column enables separate ranking views

