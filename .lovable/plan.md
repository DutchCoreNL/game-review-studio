

# Game Verbeteringen — Analyse en Plan

Na het grondig nalopen van de codebase zijn er verbeteringen gevonden in 5 categorieën: **type safety**, **sidebar inconsistentie**, **UX-problemen**, **performance** en **code quality**.

---

## 1. Type Safety — `as any` casts verwijderen (hoge prioriteit)

Er zijn 227 `as any` casts verspreid over 29 bestanden. De meest impactvolle:

| Locatie | Probleem |
|---------|----------|
| `GameLayout.tsx:261` | `dispatch({ type: 'SYNC_WORLD_TIME' as any, ...} as any)` — dubbele cast |
| `GameHeader.tsx:93` | `(state as any).activeWeekEvent` — veld ontbreekt in GameState |
| `GearPanel.tsx` (5x) | `setView('weapons' as any)` etc. — view strings ontbreken in GameView type |
| `ContractsPanel.tsx` & `OperationsView.tsx` | `dispatch({ type: 'SET_STATE', state: ... } as any)` — SET_STATE niet in action types |
| `DistrictPopup.tsx`, `JobsView.tsx` | API responses gecast als `as any` |

**Fix**: Voeg ontbrekende velden toe aan `GameState` type (`activeWeekEvent`, `gymStats`) en ontbrekende actions aan het action union type (`SYNC_WORLD_TIME`, `SET_STATE`). De `GearPanel` casts zijn hetzelfde probleem als eerder opgelost in LoadoutPanel — `GameView` type bevat deze strings al, dus de casts zijn overbodig.

---

## 2. Sidebar Inconsistentie (medium prioriteit)

De **mobile sidebar** (`GameSidebar.tsx`) mist meerdere items die de **desktop sidebar** (`DesktopSidebar.tsx`) wél heeft:

| Ontbreekt in Mobile | Desktop heeft |
|---------------------|---------------|
| `travel` (Reizen) | Ja |
| `chat` (Chat) | Ja |
| `organized-crimes` | Ja |
| `merit` (Merit Punten) | Ja |
| `gym` (Gym) | Ja |
| `jobs` (Banen) | Ja |
| `education` (Educatie) | Ja |
| `properties` (Vastgoed) | Ja |
| `black-market` (Zwarte Markt) | Ja |
| `salvage` (Salvage) | Ja |
| `codex` (Codex) | Ja |

**Fix**: Synchroniseer de mobile sidebar items met de desktop sidebar. Dit is een significante UX-gap — mobiele spelers kunnen 11+ features niet bereiken via het menu.

---

## 3. Dubbele SYNC_WORLD_TIME dispatch (bug)

`GameLayout.tsx` dispatcht `SYNC_WORLD_TIME` twee keer:
- **Lijn 231**: met `timeOfDay` + `worldDay` (correct)
- **Lijn 261**: met alleen `timeOfDay` (redundant, en met `as any` cast)

De tweede useEffect is overbodig want lijn 231 reageert al op `worldState.worldDay` dat samen met `timeOfDay` verandert.

**Fix**: Verwijder de tweede useEffect (lijn 258-263).

---

## 4. GearPanel — Overbodige `as any` casts

`GearPanel.tsx` heeft 5 `setView('...' as any)` casts voor views die al in het `GameView` type staan (`weapons`, `armor-arsenal`, `gadget-arsenal`, `black-market`, `salvage`). Exact hetzelfde probleem dat eerder in `LoadoutPanel` is opgelost.

**Fix**: Vervang `as any` door `as GameView` (of verwijder de cast volledig als TypeScript het al accepteert).

---

## 5. Performance — Lazy component wrapping

`GameLayout.tsx:111-112` wrappen `GearInventory` in een lambda binnen `React.lazy`:
```typescript
const ArmorInventoryLazy = React.lazy(() => 
  import('./gear/GearInventory').then(m => ({ 
    default: () => m.GearInventory({ gearType: 'armor' }) 
  })));
```
Dit creëert bij elke render een nieuwe component-referentie, waardoor React de hele component unmount/remount. 

**Fix**: Maak aparte wrapper-componenten:
```typescript
function ArmorInventoryWrapper() { return <GearInventory gearType="armor" />; }
const ArmorInventoryLazy = React.lazy(() => ...then(m => ({ default: ArmorInventoryWrapper })));
```

---

## Implementatieplan

| # | Wat | Bestanden | Impact |
|---|-----|-----------|--------|
| 1 | Mobile sidebar synchroniseren met desktop | `GameSidebar.tsx` | UX — 11 ontbrekende menu-items |
| 2 | Dubbele SYNC_WORLD_TIME verwijderen | `GameLayout.tsx` | Bug fix |
| 3 | GearPanel `as any` casts verwijderen | `GearPanel.tsx` | Type safety |
| 4 | Lazy GearInventory wrapping fixen | `GameLayout.tsx` | Performance |
| 5 | GameHeader `activeWeekEvent` cast opschonen | `GameHeader.tsx` + types | Type safety |

Stap 1 is de grootste gebruikersimpact. Stappen 2-5 zijn kleinere technische verbeteringen die parallel kunnen.

