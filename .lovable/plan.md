

# Bug Audit — Noxhaven Codebase

Na uitgebreide analyse van de codebase heb ik de volgende bugs gevonden, geordend op ernst:

---

## BUG 1: `return { ...s, ... }` in Immer produce (CRITICAL)

**Locatie:** `GameContext.tsx` regels 3647-3665 (5 cases: `ADD_MARKET_ALERT`, `REMOVE_MARKET_ALERT`, `CLEAR_TRIGGERED_ALERTS`, `TOGGLE_SMART_ALARM`, `SET_SMART_ALARM_THRESHOLD`)

**Probleem:** De reducer draait binnen `produce()` (Immer). Wanneer je `return { ...s, ... }` gebruikt in een Immer draft, maak je een shallow copy van de draft proxy in plaats van een regulier object. Dit kan leiden tot onverwacht gedrag, stale state, of Immer-warnings.

**Fix:** Vervang `return { ...s, marketAlerts: [...] }` door directe mutaties op de draft:
```typescript
case 'ADD_MARKET_ALERT': {
  s.marketAlerts.push(action.alert);
  return s;
}
case 'REMOVE_MARKET_ALERT': {
  s.marketAlerts = s.marketAlerts.filter(a => a.id !== action.id);
  return s;
}
// etc.
```

---

## BUG 2: Inventaris overflow — geen limiet op loot box/dungeon items (MEDIUM)

**Locatie:** `GameContext.tsx` regels 2449-2457 (OPEN_LOOT_BOX) en 2495-2505 (COLLECT_DUNGEON)

**Probleem:** Wapens/armor/gadgets worden zonder limiet toegevoegd aan inventaris. Combat (combatHandlers.ts:251) heeft wél een `length < 20` check, maar loot boxes en dungeons niet. Dit kan leiden tot oneindig groeiende arrays en performance-problemen.

**Fix:** Voeg dezelfde `length < 50` (of gewenste limiet) check toe bij het pushen van items vanuit loot boxes en dungeon rewards.

---

## BUG 3: Dubbele `if (!s.weaponInventory) return s;` check (MINOR)

**Locatie:** `GameContext.tsx` regel 2537-2538 (`SALVAGE_WEAPON`)

**Probleem:** Identieke guard-check op 2 opeenvolgende regels. Niet schadelijk, maar slordig.

**Fix:** Verwijder de duplicate regel.

---

## BUG 4: `resolveDungeonRun` geroepen zonder completion-check (MEDIUM)

**Locatie:** `GameContext.tsx` regel 2475-2477 (`COLLECT_DUNGEON`)

**Probleem:** De handler checkt niet of de dungeon daadwerkelijk is voltooid (`isDungeonComplete()`). Een speler zou theoretisch de actie kunnen dispatchen voordat de timer afloopt. De UI voorkomt dit waarschijnlijk, maar de reducer zou dit ook moeten valideren.

**Fix:** Voeg toe:
```typescript
if (!isDungeonComplete(s.activeDungeon)) return s;
```

---

## BUG 5: Combat loot weapon cap inconsistentie (MINOR)

**Locatie:** `combatHandlers.ts:251` beperkt tot 20, maar loot boxes/dungeons/daily rewards hebben geen cap.

**Probleem:** Inconsistente inventarislimiet door de codebase.

**Fix:** Centraliseer de inventory cap in een helper functie en gebruik die overal.

---

## BUG 6: `PvP verlies = permadeath` zonder waarschuwing (DESIGN)

**Locatie:** `GameContext.tsx:3632-3634` (`END_PVP_COMBAT`)

**Probleem:** PvE combat gebruikt een knockout systeem (25% HP recovery + penalties), maar PvP verlies resulteert direct in `gameOver = true`. Dit is inconsistent en kan frustrerend zijn. Normale PvE combat (behalve final boss) is niet-lethaal, maar PvP wel.

**Fix:** Pas PvP verlies aan naar hetzelfde knockout-systeem, óf voeg een duidelijke waarschuwing toe in de UI.

---

## Samenvatting implementatie

| Bug | Ernst | Bestanden | Actie |
|-----|-------|-----------|-------|
| Immer `return {...s}` | Critical | GameContext.tsx | 5 cases herschrijven naar mutaties |
| Inventory overflow | Medium | GameContext.tsx | Cap toevoegen bij loot box/dungeon rewards |
| Dungeon completion check | Medium | GameContext.tsx | `isDungeonComplete()` guard toevoegen |
| Dubbele guard | Minor | GameContext.tsx | Duplicate verwijderen |
| Weapon cap inconsistentie | Minor | Meerdere bestanden | Helper functie maken |
| PvP permadeath | Design | GameContext.tsx | Knockout of waarschuwing |

