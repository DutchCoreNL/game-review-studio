

## Analyse: Huidig Level Systeem

Het huidige systeem is simpel:
- **3 stats**: muscle, brains, charm (+1 per skill point)
- **2 skill points per level up**
- **XP scaling**: `nextXp * 1.4` per level (exponentieel)
- **XP bronnen**: vast bedrag per actie (15 XP voor solo ops, 100 XP voor faction boss, etc.)
- **Geen level cap, geen prestige, geen skill tree**
- **Volledig client-side** - XP wordt lokaal berekend, manipuleerbaar

## Verbetervoorstellen voor MMO

### 1. Server-side XP Validatie
Alle XP-toekenning verplaatsen naar de edge function. Client kan geen XP meer zelf toevoegen.

### 2. Skill Tree systeem (vervangt platte stat upgrades)
In plaats van simpel `muscle++`, een vertakkende skill tree per stat:
- **Muscle branch**: Brawler → Tank → Berserker (passive bonussen zoals +crit, +armor, +lifesteal)
- **Brains branch**: Hacker → Strategist → Mastermind (+hack success, +trade bonus, +heist intel)
- **Charm branch**: Smooth Talker → Negotiator → Kingpin (+NPC relations, +recruit chance, +corruption discount)

Elke node kost 1-3 SP en unlockt passieve bonussen of actieve abilities.

### 3. Prestige / New Game+ verbetering
Bij max level (bijv. 50) kun je "prestige" doen:
- Level reset naar 1, maar behoud permanente bonussen (+5% XP gain per prestige)
- Unieke prestige badges en cosmetische rewards
- Prestige-only content (speciale heists, wapens)

### 4. XP Multipliers systeem
- **District bonus**: +10-20% XP in gevaarlijkere districten
- **Streak bonus**: Opeenvolgende acties zonder hospitalisatie = +XP
- **Gang bonus**: XP boost als je in een gang zit
- **First-of-day bonus**: Eerste actie per dag geeft 2x XP

### 5. Level-gated MMO Content
Duidelijke level tiers die nieuwe content unlocken:
```text
Lv 1-10:  Solo ops, basic trade
Lv 10-20: Contracts, car theft, basic PvP
Lv 20-30: Heists, factions, casino VIP
Lv 30-40: Villa, drug empire, gang wars
Lv 40-50: Endgame bosses, prestige unlock
```

### 6. Leaderboard XP Racing
Wekelijkse XP-leaderboards met rewards voor top 10 spelers.

## Implementatieplan

### Stap 1: Server-side XP validatie
- Nieuwe `gain_xp` handler in edge function die level-up logica server-side afhandelt
- Alle bestaande `gainXp()` calls in client omzetten naar server-responses
- `player_state` tabel wordt single source of truth voor level/xp/skillpoints

### Stap 2: Skill Tree data model
- Nieuwe `player_skills` tabel: `user_id, skill_id, level, unlocked_at`
- Skill tree definitie in constants met node-afhankelijkheden
- UI: nieuwe SkillTreeView component met visuele boom-structuur

### Stap 3: XP Multipliers
- Multiplier berekening server-side in de `gain_xp` handler
- UI indicator in GameHeader die actieve XP bonussen toont

### Stap 4: Prestige systeem
- `prestige_level` kolom toevoegen aan `player_state`
- Prestige actie via edge function met validatie (level >= 50)
- Prestige badge naast spelernaam op leaderboard

## Aanbevolen eerste stap
Start met **Skill Tree + server-side XP** omdat dit het meeste impact heeft op de gameplay en tegelijk de exploit-preventie verbetert.

