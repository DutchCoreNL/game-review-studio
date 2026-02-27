

# Plan: Transformatie naar MMO Text-Based Maffia Game

Dit is een fundamentele architectuurwijziging. Het huidige spel draait volledig client-side (localStorage + Immer reducer). Een MMO zoals Barafranca/Torn vereist dat **alle gamestate server-side** leeft, met cooldown-timers, speler-vs-speler interacties en een gedeelde economie.

Dit is te groot voor één stap. Hieronder een gefaseerd plan.

---

## Fase 1: Server-Side Game State (fundament)

**Doel**: Alle spelerstaat verplaatsen van localStorage naar de database.

- Nieuwe tabel `player_state` met kolommen voor alle kernvelden: `money`, `dirty_money`, `debt`, `rep`, `heat`, `personal_heat`, `hp`, `max_hp`, `level`, `xp`, `loc`, `day`, `karma`, `energy` (nieuw), etc.
- Nieuwe tabellen: `player_inventory`, `player_crew`, `player_vehicles`, `player_gear`, `player_districts`, `player_businesses`, `player_safehouses`, `player_villa`
- Edge functions voor elke game-actie (trade, travel, buy, combat) die server-side validatie doen
- RLS policies zodat spelers alleen hun eigen state kunnen lezen
- Client wordt "thin client": stuurt acties naar server, ontvangt resultaat

**Grootste verandering**: De hele `GameContext.tsx` reducer (2849 regels) en `engine.ts` (2284 regels) moeten server-side draaien via edge functions.

## Fase 2: Tijdgebaseerd Systeem (Torn-stijl)

**Doel**: Weg van "beurt-gebaseerd", naar realtime cooldowns en energy.

- **Energy-systeem**: Elke actie kost energy, energy regenereert per minuut (zoals Torn's nerve/energy)
- **Cooldown-timers**: Travel, crimes, attacks hebben realtime cooldowns (geen "End Turn" meer)
- **Passief inkomen**: Cron-job (pg_cron of scheduled edge function) die elke X minuten inkomen uitkeert
- Verwijder het "dag/nacht"-cyclus concept, vervang door realtime timers

## Fase 3: Speler-vs-Speler (PvP)

**Doel**: Echte multiplayer interacties.

- **Aanvallen**: Spelers kunnen elkaar aanvallen (met cooldown), stelen geld/items
- **Speler-profiel**: Publiek profiel met stats, level, gang, bezittingen
- **Berichten**: In-game messaging tussen spelers
- **Bounties op echte spelers**: Plaats bounties op andere spelers
- **Hospitalisatie**: Na een aanval beland je in het ziekenhuis (realtime timer)
- **Gevangenis**: Echte timer-based gevangenis

## Fase 4: Gangs/Facties (Multiplayer)

**Doel**: Spelers vormen samen gangs.

- Tabel `gangs` met leader, leden, treasury, territory
- Gang wars: gecoördineerde aanvallen op andere gangs
- Gang chat en management
- Territory control door gangs (niet individueel)

## Fase 5: Gedeelde Economie & Markt

**Doel**: Eén economie voor alle spelers.

- Prijzen worden bepaald door vraag/aanbod van alle spelers
- Player-to-player trading
- Auction house met echte spelers
- Bedrijven genereren inkomen server-side

---

## Technische Details

```text
Huidige architectuur:
┌──────────────┐
│  Browser     │
│  localStorage│──▶ GameContext (reducer) ──▶ UI
│  + Immer     │
└──────────────┘

MMO architectuur:
┌──────────────┐     ┌─────────────────┐     ┌──────────┐
│  Browser     │────▶│  Edge Functions  │────▶│ Database │
│  (thin UI)   │◀────│  (game logic)   │◀────│ (state)  │
└──────────────┘     └─────────────────┘     └──────────┘
                            │
                     ┌──────┴──────┐
                     │ Scheduled   │
                     │ Jobs (cron) │
                     └─────────────┘
```

**Omvang**: Dit is een project van **weken tot maanden**. De huidige codebase heeft ~10.000+ regels gamelogica die allemaal naar server-side moeten.

**Aanbeveling**: Begin met **Fase 1** (server-side state) voor de kernacties (trade, travel, combat). Houd de rest voorlopig client-side en migreer stap voor stap.

---

## Startpunt: Fase 1 - Eerste Stappen

Concreet zou ik beginnen met:

1. Database-tabellen aanmaken voor `player_state` en `player_inventory`
2. Een `game-action` edge function bouwen die acties ontvangt en server-side valideert
3. De `TRADE`-actie als eerste migreren (server-side prijsberekening, inventory-update)
4. Energy-systeem toevoegen (nieuw veld, regeneratie-timer)
5. Client aanpassen om via `supabase.functions.invoke()` te werken i.p.v. lokale reducer

Wil je dat ik met deze eerste fase begin?

