

# Plan: Uitgebreid Admin Paneel

Het huidige admin paneel heeft alleen **Spelers** (leaderboard entries) en **Logboek**. We voegen de volgende tabs/functies toe:

---

## Nieuwe Admin Tabs

### 1. ECONOMIE tab
- **Marktprijzen bekijken & aanpassen** — lees `market_prices` tabel, inline editing van `current_price` en `price_trend`
- **Globale prijsmultiplicator** — alle prijzen tijdelijk verhogen/verlagen (event-achtig)

### 2. BOTS tab
- **Alle 50 bots bekijken** uit `bot_players`
- **Bot stats inline aanpassen** (level, cash, rep, loc, actief/inactief toggle)
- **Nieuwe bot toevoegen** of bestaande verwijderen
- **Bulk-actie**: randomize alle bot locaties

### 3. SPELER DETAILS tab (uitbreiding bestaand)
- **Bekijk volledige `player_state`** van een speler (niet alleen leaderboard)
- **Pas player_state velden aan**: money, hp, energy, nerve, heat, prison_until, hospital_until, loc, level, xp
- **Teleporteer speler** naar ander district
- **Geef/neem items**: cash, dirty_money, energy refill
- **Forceer uit gevangenis/ziekenhuis**

### 4. WERELD tab
- **Server statistieken**: totaal actieve spelers, totaal cash in omloop, gemiddeld level
- **District overzicht**: hoeveel spelers per district
- **Ganglijst**: alle gangs met leden-count, treasury, level
- **Actieve gang wars** bekijken

### 5. BERICHTEN tab
- **Systeem-broadcast sturen** naar alle spelers (via `player_messages` met sender_id = admin)
- **Specifieke speler een bericht sturen**

---

## Technische Aanpak

### Edge Function (`admin-actions/index.ts`) — nieuwe actions:
- `get_player_state` — volledige player_state ophalen voor userId
- `edit_player_state` — specifieke velden van player_state aanpassen
- `get_market_prices` — alle marktprijzen ophalen  
- `edit_market_price` — prijs/trend van een specifiek goed aanpassen
- `get_bots` — alle bot_players ophalen
- `edit_bot` / `delete_bot` / `create_bot` — bot CRUD
- `randomize_bot_locations` — alle bots verplaatsen naar willekeurige districten
- `get_world_stats` — aggregated queries (totaal spelers, totaal cash, per district)
- `get_gangs` — alle gangs met member count
- `send_broadcast` — insert bericht naar alle actieve spelers
- `send_message` — insert bericht naar specifieke speler

### AdminPanel.tsx:
- Voeg 5 tabs toe: SPELERS, ECONOMIE, BOTS, WERELD, BERICHTEN, LOGBOEK
- Elk met eigen state, fetch-functies en inline editing UI
- Hergebruik bestaande `game-card`, `GameButton`, `GameBadge`, `SubTabBar` componenten

### Bestanden:
- `supabase/functions/admin-actions/index.ts` — uitbreiden met ~10 nieuwe actions
- `src/components/game/AdminPanel.tsx` — uitbreiden met nieuwe tabs en UI

