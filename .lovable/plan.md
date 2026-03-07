

# Arsenaal & Loadout — Analyse en Verbeterplan

## Gevonden problemen

### 1. Dynamische Tailwind klassen werken NIET (kritiek)
In `GearInventory.tsx` en `GearCompare.tsx` worden Tailwind-klassen dynamisch samengesteld met template literals:
```
bg-${accentColor}/15   →   bg-ice/15 of bg-game-purple/15
text-${accentColor}    →   text-ice of text-game-purple
```
Tailwind scant statisch en genereert deze klassen **niet**. De header-iconen, borders en hover-effecten voor armor en gadgets zijn dus **onzichtbaar/zonder styling**. Dit is het grootste visuele probleem.

**Fix**: Vervang alle dynamische klassen door conditionele maps, bijv.:
```typescript
const ACCENT_STYLES = {
  armor: {
    iconBg: 'bg-ice/15 border-ice/40',
    iconText: 'text-ice',
    title: 'text-ice',
    dot: 'bg-ice',
    // etc.
  },
  gadget: {
    iconBg: 'bg-game-purple/15 border-game-purple/40',
    iconText: 'text-game-purple',
    // etc.
  }
};
```

### 2. Typo in LoadoutPanel
Regel 27: `"arsenaal"` is correct, maar regel 27 zegt `"arsenaal"` — eigenlijk is er een typo op **de originele versie** regel 27: `items in arsenaal` — dit is correct Nederlands, geen probleem.

### 3. WeaponCompare — stale state na upgrade
Regel 102-103 in `WeaponCompare.tsx`: na dispatch van `UPGRADE_WEAPON` wordt `state.weaponInventory` gelezen, maar React heeft de state nog niet geüpdatet in dezelfde render cycle. Het `updated` wapen is dus nog het oude. Zelfde probleem in `GearCompare` (regel 99-102 van `GearInventory`).

### 4. Loadout — `setView` met `as any` casts
De view-types worden gecast met `as any` op 6 plekken in LoadoutPanel. Dit omzeilt TypeScript-controles en kan breken als view-namen veranderen.

### 5. MAX inventory hardcoded in LoadoutPanel
LoadoutPanel toont `(/20)` hardcoded, terwijl `MAX_WEAPON_INVENTORY` en `MAX_GEAR_INVENTORY` als constanten bestaan.

---

## Implementatieplan

| # | Wat | Bestanden |
|---|-----|-----------|
| 1 | Dynamische Tailwind-klassen vervangen door statische conditionele maps | `GearInventory.tsx`, `GearCompare.tsx` |
| 2 | Stale state na upgrade fixen (gebruik `useEffect` of verwijder de directe re-read) | `WeaponInventory.tsx` (reeds licht), `GearInventory.tsx` |
| 3 | `as any` casts verwijderen en correcte view-types gebruiken in LoadoutPanel | `LoadoutPanel.tsx` |
| 4 | MAX inventory constanten importeren in LoadoutPanel | `LoadoutPanel.tsx` |

Puur technische fixes — geen visuele redesign nodig, de structuur en layout zijn consistent met de cinematic noir stijl.

