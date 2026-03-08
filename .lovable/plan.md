

# Volledige Audit — Noxhaven Codebase Koppelingen & Verbeteringen

Na uitgebreid onderzoek van de codebase (GameContext.tsx, GameLayout.tsx, types.ts, dungeons.ts, engine integraties, server sync, en reducer handlers) heb ik de volgende problemen en verbetermogelijkheden gevonden:

---

## BUG 1: Dubbele `generateBlackMarketStock` call (MEDIUM)

**Locatie:** `GameContext.tsx:2405-2406` (`REFRESH_BLACK_MARKET`)

**Probleem:** De stock wordt twee keer achter elkaar gegenereerd — de eerste resultaat wordt direct overschreven door de tweede. Verspilling van resources en mogelijk onverwacht gedrag als de functie random elements bevat (het resultaat is altijd de tweede call).

**Fix:** Verwijder de duplicate regel.

---

## BUG 2: OPEN_LOOT_CRATE mist inventory cap (MEDIUM)

**Locatie:** `GameContext.tsx:2419-2427`

**Probleem:** Terwijl `OPEN_LOOT_BOX` en `COLLECT_DUNGEON` nu correct een `length < 50` cap hebben, heeft `OPEN_LOOT_CRATE` deze check niet. Weapons/armor/gadgets worden onbeperkt toegevoegd.

**Fix:** Voeg `length < 50` check toe bij `OPEN_LOOT_CRATE`.

---

## BUG 3: CLAIM_DAILY_LOGIN_REWARD mist inventory cap (MINOR)

**Locatie:** `GameContext.tsx:2524-2531`

**Probleem:** Daily login rewards pushen wapens/gear zonder inventory limiet check.

**Fix:** Voeg `length < 50` check toe.

---

## BUG 4: CRAFT_SALVAGE mist inventory cap (MINOR)

**Locatie:** `GameContext.tsx:2566-2573`

**Probleem:** Gecraftte items worden zonder limiet toegevoegd.

**Fix:** Voeg `length < 50` check toe.

---

## BUG 5: XP Flush gebruikt stale `state` referentie (CRITICAL)

**Locatie:** `GameContext.tsx:4114 en 4122-4133`

**Probleem:** In de XP flush effect (`useEffect`), wordt `state` uit de closure gebruikt in `rawDispatch({ type: 'SET_STATE', state: { ...state, ... } })`. Maar tegen de tijd dat de async response terugkomt, is `state` al verouderd. Dit overschrijft alle state-veranderingen die ondertussen zijn gemaakt (trades, travel, combat, etc.) met de stale snapshot.

**Fix:** Gebruik een functionele dispatch of een ref om de huidige state te lezen. Minimaal: sla alleen de relevante velden samen met `MERGE_SERVER_STATE` of een dedicated `SYNC_XP` action in plaats van de hele state te overschrijven met `SET_STATE`.

---

## BUG 6: `default: return;` in reducer retourneert `undefined` (MEDIUM)

**Locatie:** `GameContext.tsx:3726-3727`

**Probleem:** De default case doet `return;` (geen waarde). In Immer's `produce`, als je `undefined` retourneert, wordt de draft als resultaat gebruikt — dit werkt toevallig correct. Maar het is fragiel en onduidelijk. Als een onbekende action type wordt gedispatcht, behoudt de state, maar dit is per ongeluk correct.

**Fix:** Wijzig naar `return s;` voor duidelijkheid en veiligheid.

---

## BUG 7: `END_TURN` fall-through zonder `break` (MINOR)

**Locatie:** `GameContext.tsx:625-628`

**Probleem:** De `END_TURN` case heeft een comment "Fall through to AUTO_TICK" maar er is geen explicit fallthrough — het mist een `// falls through` annotatie en kan verwarring veroorzaken. Werkt technisch door JavaScript's case fall-through, maar is fragiel.

**Fix:** Expliciete redirect of comment.

---

## VERBETERING 1: Centraliseer inventory push met cap

**Probleem:** De `length < 50` check wordt op 6+ plekken herhaald. Er is ook inconsistentie: sommige plekken hebben het, andere niet.

**Fix:** Maak een helper functie:
```typescript
function pushToInventory(arr: any[], item: any, max = 50): boolean {
  if (arr.length >= max) return false;
  arr.push(item);
  return true;
}
```

---

## VERBETERING 2: Catch-up report toont geschatte waarden i.p.v. werkelijke

**Locatie:** `GameContext.tsx:4046-4089`

**Probleem:** Het catch-up report berekent `xpGained` en `levelUps` als 0, en `moneyEarned` wordt geschat op basis van business definitions, niet op werkelijke state-verandering. De snapshots (`preMoney`, `preXp`, etc.) worden genomen vóór de ticks, maar na de ticks worden ze niet vergeleken met de nieuwe state — de `state` variabele verwijst nog naar de pre-dispatch state door React's batching.

**Fix:** Verplaats de vergelijking naar een `useEffect` dat na de state-update runt, of sla pre-values op in een ref.

---

## Samenvatting implementatieplan

| # | Ernst | Actie | Bestanden |
|---|-------|-------|-----------|
| 1 | Medium | Verwijder duplicate `generateBlackMarketStock` | GameContext.tsx |
| 2 | Medium | Inventory cap bij OPEN_LOOT_CRATE | GameContext.tsx |
| 3 | Minor | Inventory cap bij CLAIM_DAILY_LOGIN_REWARD | GameContext.tsx |
| 4 | Minor | Inventory cap bij CRAFT_SALVAGE | GameContext.tsx |
| 5 | Critical | Fix XP flush stale state — gebruik dedicated action | GameContext.tsx |
| 6 | Medium | `default: return s;` in reducer | GameContext.tsx |
| 7 | Minor | END_TURN fall-through verduidelijken | GameContext.tsx |
| V1 | Quality | Centraliseer inventory push helper | GameContext.tsx |

