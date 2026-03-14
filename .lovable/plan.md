
Doel: cloud save, geld en inventaris 100% consistent maken tussen client en backend zodat handel niet meer “succesvol” lijkt maar daarna faalt.

1) Wat nu fout gaat (bevestigd)
- Er zijn twee waarheden:
  - `player_state` kolommen + `player_inventory` (server-acties gebruiken dit)
  - `player_state.save_data` (cloud save/client)
- In de huidige `save_state` wordt vooral `save_data` geüpdatet, niet consequent de kolommen/tabellen die `trade` gebruikt.
- Gevolg: server ziet ander geld/voorraad dan UI.
- Daarnaast overschrijft de app soms state met stale objecten via `SET_STATE` (o.a. `OperationsView`, `ContractsPanel`, `SkillTreePanel`, price bootstrap in `GameContext`).

2) Implementatieplan (in deze volgorde)

A. Backend sync-laag hard maken (belangrijkste fix)
- Bestand: `supabase/functions/game-action/index.ts`
- Maak helper `syncStateFromSaveData(userId, saveData)` die deze bronnen gelijk trekt:
  - `player_state` kernvelden: money, dirty_money, rep, karma, hp/max_hp, day, loc, energy/nerve, etc.
  - `player_inventory` vanuit `saveData.inventory` (+ `inventoryCosts`)
  - `player_gear` vanuit `saveData.ownedGear`
  - actieve vehicle/loadout waar relevant
- Roep helper aan in:
  - `handleSaveState` (na validatie, vóór response)
  - optioneel defensive fallback vóór `handleTrade` als inventory/kolommen leeg of duidelijk out-of-sync zijn
- Resultaat: server-acties en cloud save gebruiken dezelfde data.

B. Server response echt terug in client-state mergen
- Bestand: `src/hooks/useServerSync.ts`
- Na succesvolle server-acties niet alleen cooldown/MMO velden mergen, maar óók economie/inventory waar server authoritatief is.
- Breid `mergeServerState` uit met:
  - inventory + inventoryCosts
  - ownedGear, vehicles/activeVehicle
  - money/dirtyMoney/hp/rep/day wanneer actie dat raakt
- Maak merge-strategie per actie:
  - `TRADE`, `BUY_GEAR`, `BUY_VEHICLE`, `WASH_MONEY`, `BUY_BUSINESS` => full economic merge
  - `TRAVEL`/pure cooldown acties => beperkte merge

C. Stale stateRef fixen voor cloud save
- Bestand: `src/hooks/useServerSync.ts` + `src/contexts/GameContext.tsx`
- `stateRef` direct updaten op elke relevante state change (niet alleen via 2s debounce pad), zodat autosave en conflict-resolutie altijd nieuwste state zien.
- Cloud autosave trigger behouden, maar met “dirty + throttled” strategie (bijv. elke 10–15s bij economische wijzigingen) naast 2-min interval.

D. Gevaarlijke SET_STATE patronen verwijderen
- Bestanden:
  - `src/components/game/OperationsView.tsx`
  - `src/components/game/ops/ContractsPanel.tsx`
  - `src/components/game/profile/SkillTreePanel.tsx`
  - `src/contexts/GameContext.tsx` (price bootstrap effect)
- Vervang brede `SET_STATE` met stale snapshots door gerichte actions/merges:
  - contract toevoegen/verwijderen via specifieke reducer actions
  - prestige/skills via `SYNC_SKILLS` of dedicated fields, niet `SET_STATE` met `get_state` payload
  - prijs-bootstrap: alleen prijzen/trends patchen, niet hele state vervangen
- Resultaat: geen random terugval van geld/hp door late async responses.

3) Technische details
- Kernprincipe: één server-waarheid voor server-acties.
- `save_data` blijft volledige cloud snapshot; genormaliseerde tabellen worden bij save gesynchroniseerd zodat server-acties direct met actuele data werken.
- `get_state` payload moet volledig bruikbaar zijn voor client-merge zonder globale state-replace.
- Geen schema-migratie nodig voor eerste fix (alleen logic), tenzij we later een `last_synced_from_save_at` kolom willen toevoegen voor observability.

4) Validatie (end-to-end)
- Scenario 1: kopen/verkopen in snelle reeks (1x, 5x, MAX), daarna refresh → geld/inventory identiek.
- Scenario 2: lokaal veel progressie (geld/HP wijzigen), daarna direct trade → geen “te weinig geld/niet op voorraad” mismatch.
- Scenario 3: handmatige cloud save + heropenen op tweede device/tab → exact dezelfde stats.
- Scenario 4: contract/prestige flow → geen state reset door `SET_STATE`.
- Extra controlequery: `player_state.money` vs `save_data.money` en `player_inventory` vs `save_data.inventory` mogen niet meer structureel divergeren.

5) Uitvoeringsvolgorde
1. Edge function sync helper + save/trade integratie
2. `useServerSync` merge-strategie uitbreiden
3. `SET_STATE` anti-patterns vervangen
4. E2E testmatrix draaien op preview + Vercel
