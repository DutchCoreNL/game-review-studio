

## Dag/Nacht Systeem MMO Verbetering

### Huidige situatie
- Weer en dag-cyclus zijn **per speler** — elke speler heeft z'n eigen `weather` en `day` in `save_data`
- Weer wordt random gerold bij elke `AUTO_TICK` (client-side) en `process-turn` (server-side)
- Geen gedeeld dag/nacht concept — spelers zitten op verschillende "dagen" en zien ander weer
- `tickIntervalMinutes = 30` (elke 30 min realtime = 1 game dag)

### Plan: Gedeeld Wereld-Tijd Systeem

**1. Database: `world_state` tabel aanmaken**
- Eén rij met global state: `current_weather`, `time_of_day` (dawn/day/dusk/night), `world_day`, `next_cycle_at` (timestamp)
- Realtime enabled zodat alle clients live updates krijgen
- Weercyclus draait elke ~2 uur realtime (4 fases van 30 min: dawn → day → dusk → night)
- Weer verandert bij elke `dawn` (nieuw dag-begin)

**2. Edge function: `world-tick` cron function**
- Draait elke 30 minuten via pg_cron of external cron
- Roteert `time_of_day`: dawn → day → dusk → night → dawn (= nieuwe dag)
- Bij dawn: random nieuw weer, increment `world_day`, insert `district_events` voor weer-gerelateerde events
- Update `world_state` tabel — realtime push naar alle clients

**3. Client hook: `useWorldState()`**
- Realtime subscription op `world_state` tabel
- Geeft `timeOfDay`, `weather`, `worldDay` terug
- Vervangt per-speler `state.weather` met gedeelde wereld-staat

**4. Visuele dag/nacht effecten**
- `CityMap` en `WeatherOverlay` krijgen `timeOfDay`-bewuste styling:
  - **Dawn**: warm oranje tint, zachte schaduwen
  - **Day**: helder, standaard
  - **Dusk**: paars/roze gradient, langere schaduwen
  - **Night**: donkerblauw overlay, neon glows feller, straatverlichting aan
- `GameHeader` toont dag/nacht-icoon (☀️🌅🌙) naast weer-icoon
- Achtergrond-tint verandert subtiel op alle views

**5. Gameplay-effecten per tijdsfase**
- **Night**: +15% crime success, +10% heat gain, dealers verdienen meer, politie raids minder frequent
- **Dawn**: energy regen bonus (+5 extra)
- **Day**: standaard
- **Dusk**: handel bonussen, marktprijzen fluctueren meer
- Deze modifiers worden server-side toegepast in `game-action` en `process-turn`

**6. Aanpassingen bestaande code**
- `GameContext.tsx` AUTO_TICK: weer niet meer per-speler rollen, lees van `world_state`
- `process-turn`: weer-effecten lezen van `world_state` in plaats van per-speler random
- `GameHeader`: weer en tijd-icoon tonen vanuit `useWorldState()`
- `NightReport`: toont "Nacht X" met gedeelde world day

### Technische details

```text
world_state (1 rij)
├── id: 1 (singleton)
├── world_day: integer
├── time_of_day: 'dawn' | 'day' | 'dusk' | 'night'
├── current_weather: WeatherType
├── next_cycle_at: timestamptz
├── weather_changed_at: timestamptz
└── updated_at: timestamptz

Cyclus (2 uur = 1 volledige dag):
dawn (30m) → day (30m) → dusk (30m) → night (30m) → dawn...

world-tick edge function (elke 30 min):
1. Lees world_state
2. Roteer time_of_day
3. Als dawn → nieuw weer + world_day++
4. Update world_state
5. Insert district_event voor weer/tijd-wijziging
```

### Implementatie-volgorde
1. Maak `world_state` tabel + seed met initiële waarden
2. Maak `world-tick` edge function
3. Maak `useWorldState()` hook
4. Update `GameHeader` met dag/nacht + weer uit world state
5. Update `CityMap`/`WeatherOverlay` met time-of-day visuele effecten
6. Update `game-action`/`process-turn` om world state te lezen voor modifiers

