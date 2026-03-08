

## Arsenaal Verbeteringsplan

Na analyse van alle arsenaal-componenten zijn er drie categorieën verbeteringen:

---

### 1. SalvageView & BlackMarketView — Visueel Inconsistent
**Probleem:** Deze twee views zijn de enige arsenaal-views die geen `ViewWrapper` met achtergrondafbeelding gebruiken, geen cinematic noir-header hebben, en plain shadcn `Button` gebruiken i.p.v. `GameButton`. Ze vallen visueel uit de toon.

**Verbetering:**
- `ViewWrapper` met `arsenalBg` toevoegen aan beide views
- Cinematic headers met Lucide iconen (Hammer/Wrench voor Salvage, ShoppingBag voor Zwarte Markt) i.p.v. emoji's
- `Button` → `GameButton` consistent maken
- Rarity-kleuren via de bestaande `GEAR_RARITY_COLORS`/`GEAR_RARITY_BG` constanten i.p.v. lokale duplicaat-functies (`rarityColor`, `rarityLabel`, `rarityBg`)

### 2. Gedupliceerde Sub-componenten
**Probleem:** `StatBar`, `DurabilityBar` en `MasteryBar` zijn 1:1 gekopieerd tussen `WeaponCard.tsx` en `GearCard.tsx`. Wijzigingen moeten op twee plekken.

**Verbetering:**
- Nieuw bestand `src/components/game/arsenal/SharedStatBars.tsx` met alle drie gedeelde componenten
- Import in WeaponCard en GearCard vanuit dit gedeelde bestand
- `ComparisonStat` (gedupliceerd in WeaponCompare en GearCompare) ook extraheren

### 3. Item-thumbnails in SalvageView
**Probleem:** SalvageView toont alleen naam + rarity per item, zonder thumbnail-afbeelding. BlackMarketView doet dit wel. Inconsistentie.

**Verbetering:**
- Item-thumbnails toevoegen aan salvage-lijstitems (uit `WEAPON_FRAME_IMAGES`/`GEAR_FRAME_IMAGES`)
- Compacte kaart-layout consistent met de inventory-views

---

### Technisch Overzicht
| Component | Wijziging | Impact |
|---|---|---|
| `SalvageView.tsx` | ViewWrapper, cinematic header, GameButton, thumbnails | Hoog |
| `BlackMarketView.tsx` | ViewWrapper, cinematic header, GameButton, dedup rarity-helpers | Hoog |
| Nieuw: `arsenal/SharedStatBars.tsx` | StatBar, DurabilityBar, MasteryBar, ComparisonStat | Medium |
| `WeaponCard.tsx` | Import shared components | Laag |
| `GearCard.tsx` | Import shared components | Laag |
| `WeaponCompare.tsx` | Import shared ComparisonStat | Laag |
| `GearCompare.tsx` | Import shared ComparisonStat | Laag |

Totaal: 1 nieuw bestand, 6 bestanden aanpassen.

