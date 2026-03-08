

# Codebase Review — Bevindingen en Verbeteringen

## Samenvatting
Na het nalopen van alle belangrijke views zijn er geen kritieke bugs meer. De eerdere fixes (Tailwind dynamic classes, stale state, type casts) zijn correct doorgevoerd. Wat overblijft zijn **consistentie-problemen** en **dead code** verspreid over de codebase.

---

## 1. `SectionHeader` nog steeds gebruikt in cinematic views (inconsistentie)

De cinematic noir upgrade verving de flat `SectionHeader` component door immersieve headers. Maar **binnen** de views worden `SectionHeader` calls nog steeds gebruikt als sub-sectie dividers — dit creëert een visuele breuk (platte `border-b` lijn-stijl naast de cinematic kaart-stijl).

**Getroffen bestanden (sub-secties binnen cinematic views):**
| View | Aantal `SectionHeader` calls |
|------|-----|
| `CorruptionView.tsx` | 3 (Actieve/Beschikbare/Verloren Contacten) |
| `GymView.tsx` | 1 (Locaties) |
| `JobsView.tsx` | 1 (Beschikbare Banen) |
| `WarView.tsx` | ~3 (in sub-tabs) |
| `LeaderboardView.tsx` | ~2 |
| `PvPAttackView.tsx` | 2 (Gevecht Preview, Spelers lijst) |
| `ProfileView.tsx` | ~8 |
| `GangView.tsx` | meerdere |
| `DailyChallengesView.tsx` | 0 (import maar niet gebruikt → dead import) |
| `MeritPointsView.tsx` | 0 (import maar niet gebruikt → dead import) |
| `EducationView.tsx` | 1 (per categorie) |
| `PropertiesView.tsx` | 0 (import maar niet gebruikt → dead import) |

**Fix:** 
- Views met dead imports (`DailyChallengesView`, `MeritPointsView`, `PropertiesView`): verwijder de import
- Views die `SectionHeader` als sub-sectie divider gebruiken: vervang door een lichtere inline variant die consistent is met het noir-thema, bijv:
```typescript
<div className="flex items-center gap-1.5 mt-4 mb-2">
  <Icon size={10} className="text-gold" />
  <span className="text-[0.5rem] uppercase tracking-wider text-gold/80 font-bold">Titel</span>
</div>
```

---

## 2. `TravelView.tsx` — unused `SectionHeader` import

Geïmporteerd op regel 9 maar nergens in de body gebruikt. Dead import.

---

## 3. `GymView.tsx` — `(state as any).gymStats`

Regel 51: `const gymStats = (state as any).gymStats` — dit suggereert dat `gymStats` niet in het GameState type zit. Als het via de backend komt, is dit acceptabel maar fragiel. Minimaal een type guard of comment is beter.

---

## 4. `PvPAttackView.tsx` — `(p as any).combatRating`

Regels 334-337: `combatRating` wordt gelezen via `as any` cast op `PvPPlayerInfo`. Dit veld zou aan het `PvPPlayerInfo` type moeten worden toegevoegd als het van de backend komt.

---

## 5. Loadout `as GameView` casts — nu OK

De eerder genoemde `as any` casts zijn vervangen door `as GameView`. Dit is acceptabel zolang de string literals (`'weapons'`, `'armor-arsenal'`, `'gadget-arsenal'`) daadwerkelijk in het `GameView` union type staan.

---

## Implementatieplan

| # | Wat | Impact |
|---|-----|--------|
| 1 | Dead `SectionHeader` imports verwijderen uit 4 files | Cleanup |
| 2 | `SectionHeader` in sub-secties vervangen door inline noir-stijl dividers in de 6 meest-gebruikte views | Visuele consistentie |
| 3 | Type safety: `gymStats` en `combatRating` typen toevoegen aan hun respectieve interfaces | Code quality |

Stap 1 en 3 zijn triviale fixes. Stap 2 is het meeste werk maar puur visueel — geen logica verandert.

