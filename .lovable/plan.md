

## Plan: Permadeath voor Iedereen

### Huidige situatie
Het spel heeft twee modi:
- **Normaal**: 3 ziekenhuisopnames → game over, met 15% "Last Stand" overlevingskans
- **Hardcore**: Aparte modus, 1 dood = game over, apart leaderboard

### Wat verandert
Iedereen speelt nu effectief "hardcore" — dood = opnieuw beginnen. De aparte hardcore toggle verdwijnt. Dit maakt het spel eerlijker als MMO.

### Aanpassingen

**1. Constants & Types**
- `MAX_HOSPITALIZATIONS` verwijderen of op 1 zetten
- `hardcoreMode` veld behouden maar altijd `true` forceren (backwards compat)
- "Last Stand" 15% overlevingskans verwijderen — dood is dood
- Hospital systeem omzetten: geen ziekenhuisopname meer, direct game over bij 0 HP

**2. Combat Handlers (combatHandlers.ts + GameContext.tsx)**
- Bij verloren gevecht (HP ≤ 0): direct `gameOver = true`
- Verwijder Last Stand logica
- Verwijder hospitalization counter/checks
- Hospital state (`hospital`, `hospitalizations`) niet meer gebruiken in combat

**3. Doodsmechaniek verfijnen voor MMO-balans**
Omdat permadeath hard is, voegen we **verzachtende mechanismen** toe:
- **Doodskist**: Bij game over bewaar 10% van je geld voor je volgende run (opgeslagen server-side per user)
- **Legacy bonus**: Elk gestorven karakter geeft +2% XP bonus op je volgende run (max +20%, 10 runs)
- **Waarschuwing bij laag HP**: Onder 20% HP krijg je een rode waarschuwing "VLUCHT OF STERF"

**4. UI Aanpassingen**
- **MainMenu**: Verwijder aparte "Hardcore Mode" knop — standaard spel is nu permadeath
- **GameOverScreen**: Verwijder hardcore-specifieke tekst, toon altijd permadeath bericht + doodskist info
- **VictoryScreen**: Verwijder `!state.hardcoreMode` conditie op Prestige Reset
- **LeaderboardView**: Verwijder "Hardcore" tab — er is maar één modus. "Hall of Legends" blijft voor high-level spelers
- **HUD/StatusBar**: Voeg permanent ☠️ indicator toe bij laag HP

**5. Server-side (Edge Functions)**
- `game-action`: Verwijder hardcore-specifieke checks
- Leaderboard: `is_hardcore` kolom altijd `true` voor nieuwe entries
- **Nieuw**: `death_legacy` tabel of veld op profiel voor doodskist + legacy XP bonus

**6. Bestanden die aangepast worden**

| Bestand | Wijziging |
|---|---|
| `src/game/constants.ts` | `MAX_HOSPITALIZATIONS = 1`, `hardcoreMode: true` in initial state |
| `src/game/types.ts` | Voeg `deathLegacy` veld toe aan GameState |
| `src/game/reducers/combatHandlers.ts` | Verwijder Last Stand + hospital, direct game over |
| `src/contexts/GameContext.tsx` | Verwijder Last Stand + hospital logica, forceer hardcoreMode, laad death legacy |
| `src/components/game/MainMenu.tsx` | Verwijder hardcore knop/bevestiging |
| `src/components/game/GameOverScreen.tsx` | Universeel permadeath scherm + doodskist info |
| `src/components/game/VictoryScreen.tsx` | Verwijder hardcoreMode conditie |
| `src/components/game/LeaderboardView.tsx` | Verwijder hardcore tab, houd Hall of Legends |
| `src/pages/Index.tsx` | Verwijder `handleHardcoreStart` |
| `supabase/functions/game-action/index.ts` | Verwijder hardcore checks |

