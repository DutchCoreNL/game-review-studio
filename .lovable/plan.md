

## Plan: Factie World Boss Systeem

### Huidige situatie
- `faction_relations` tabel bestaat al met gedeelde boss HP, conquest phases, en `conquered_by`/`vassal_owner_id`
- `handleAttackFaction` in game-action verwerkt al schade server-side
- Probleem: na verovering blijft de factie permanent "vassal" voor één speler — geen reset, geen competitie

### Wat verandert

**Database (migration):**
- Kolom `reset_at` (timestamptz) toevoegen aan `faction_relations` — wanneer de boss respawnt
- Kolom `total_damage_dealt` (jsonb, default `{}`) — tracked per-user schade bijdrage voor rewards
- Kolom `conquest_reward_claimed` (jsonb, default `[]`) — voorkomt dubbele reward claims

**Edge function `world-tick`:**
- Bij elke tick: check of veroverde facties voorbij hun `reset_at` zijn (48 uur na conquest)
- Zo ja: reset faction naar `active`, boss_hp naar 100, conquest_phase naar `none`, wis conquered_by
- Genereer een news_event: "De [factie] heeft zich hersteld en een nieuwe leider gekozen!"

**Edge function `game-action` (handleAttackFaction):**
- Track individuele schade in `total_damage_dealt` jsonb: `{ "user-id": 150, "user-id-2": 80 }`
- Bij conquest: zet `reset_at = now() + 48h`, geef top-3 damage dealers extra rewards
- De `conquered_by` speler krijgt tijdelijke vazal-bonussen (48h passief inkomen)

**Frontend FactionCard:**
- Toon gedeelde boss HP bar met "X spelers hebben aangevallen" indicator
- Bij veroverde factie: toon countdown timer tot reset
- Toon damage leaderboard (top aanvallers) per factie
- Verwijder permanent "vazal" state — vervang door tijdelijke controle indicator

**Frontend useFactionState hook:**
- Voeg `resetCountdown` berekening toe op basis van `reset_at`
- Realtime updates werken al via postgres_changes subscription

### Stappen
1. Database migration: `reset_at`, `total_damage_dealt`, `conquest_reward_claimed` kolommen
2. Update `world-tick`: faction reset logica bij verlopen timer
3. Update `game-action/handleAttackFaction`: damage tracking per user, reset_at bij conquest, rewards voor top damage dealers
4. Update `FactionCard`: countdown timer, damage leaderboard, gedeelde boss HP indicator
5. Update `FamiliesPanel`/`useFactionState`: verwerk nieuwe velden

