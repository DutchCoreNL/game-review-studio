

## UI Verbeterplan — Noxhaven

Na analyse van alle views, componenten en patronen identificeer ik de volgende concrete UI-problemen en oplossingen:

---

### 1. Unified Sub-Tab Component (DRY)
Elke view (Trade, Ops, Imperium, Profile) implementeert sub-tabs met eigen inline styling. Dit leidt tot inconsistente spacing, font-sizes en badge-stijlen.

**Oplossing:** Eén `SubTabBar` component maken die overal wordt hergebruikt:
- Horizontaal scrollbaar met `scrollbar-hide` (zoals Imperium/Profile al doen, maar Trade/Ops niet)
- Consistent: `flex-shrink-0`, `px-3 py-2`, `text-[0.55rem]`, icoon + label + optionele badge
- Badge-stijl unificeren (nu verschilt badge per view: dot vs. getal vs. boolean)

**Bestanden:** Nieuw `src/components/game/ui/SubTabBar.tsx`, aanpassingen in `TradeView`, `OperationsView`, `ImperiumView`, `ProfileView`

---

### 2. Profile Tabs opschonen (12 tabs → 8 gegroepeerde)
De Profile-sectie heeft 12 sub-tabs. Dit is overweldigend op mobiel.

**Oplossing:** Groepeer gerelateerde tabs:
- Merge "STATS" + "CHARTS" → **STATS** (charts inline onder stats)
- Merge "VILLA" + "💀 IMPERIUM" → **IMPERIUM** (villa-samenvatting + drug empire samen)
- Merge "🔊 AUDIO" in een settings-icoon (⚙️) in de header of onderaan profiel
- "📖 WIKI" verplaatsen naar main menu (hoort niet bij profiel)
- Resultaat: **STATS, LOADOUT, NPC'S, REPUTATIE, BOGEN, TROFEEËN, ONLINE, IMPERIUM** (8 tabs)

**Bestanden:** `ProfileView.tsx`

---

### 3. MapView Action Buttons → Contextual Action Bar
De kaartweergave heeft 2-6 knoppen onderaan die dynamisch verschijnen/verdwijnen. Op kleine schermen wrappen ze onhandig.

**Oplossing:** 
- "DAG AFSLUITEN" wordt een vaste brede knop onderaan
- Locatie-specifieke acties (Casino, Chop Shop, Ziekenhuis, Safehouse, Villa) worden horizontaal scrollbare icoon-knoppen boven de "DAG AFSLUITEN" knop
- Decker-knop krijgt een speciale prominente positie als die beschikbaar is

**Bestanden:** `MapView.tsx`

---

### 4. Header Resource Tiles — Beter Gegroepeerd
De resource-tiles in de header vormen een horizontale rij die op kleine schermen moeilijk leesbaar is. HP, REP, LVL staan op dezelfde lijn als HEAT, KARMA, SCHULD.

**Oplossing:**
- Splits in twee visuele groepen met een subtiele separator: **Player stats** (HP, LVL, REP) | **Risk stats** (HEAT, KARMA, AMMO)
- Conditionals (SCHULD, SCHUIL, GOUD) worden compacter: alleen icoon + getal, geen label
- Geld (€) verplaatsen naar een tile in de resource-rij in plaats van apart rechtsboven

**Bestanden:** `GameHeader.tsx`

---

### 5. Consistente View Layout Wrapper
Elke view herhaalt dezelfde boilerplate: background image + gradient + `relative z-10` wrapper.

**Oplossing:** Eén `ViewWrapper` component:
```tsx
<ViewWrapper bg={tradeBg}>
  {children}
</ViewWrapper>
```

**Bestanden:** Nieuw `src/components/game/ui/ViewWrapper.tsx`, aanpassingen in alle 4 views

---

### 6. "Terug naar kaart" knoppen → Consistente back-navigatie
MapView heeft 5 sub-views (Villa, Hospital, ChopShop, Safehouse, Casino) elk met een handmatige "← TERUG NAAR KAART" knop met inline styling.

**Oplossing:** Eén `BackButton` component, of beter: verplaats deze sub-views naar een modal/sheet-patroon zodat de kaart zichtbaar blijft op de achtergrond.

**Bestanden:** `MapView.tsx`, eventueel nieuw `ui/BackButton.tsx`

---

### Technische Details

| Component | Nieuw/Gewijzigd | Geschatte impact |
|-----------|----------------|-----------------|
| `SubTabBar.tsx` | Nieuw | Verwijdert ~80 regels duplicatie |
| `ViewWrapper.tsx` | Nieuw | Verwijdert ~20 regels duplicatie |
| `ProfileView.tsx` | Gewijzigd | 12→8 tabs, betere groepering |
| `MapView.tsx` | Gewijzigd | Nettere action bar layout |
| `GameHeader.tsx` | Gewijzigd | Betere groepering resources |
| `TradeView.tsx` | Gewijzigd | Gebruikt SubTabBar |
| `OperationsView.tsx` | Gewijzigd | Gebruikt SubTabBar |
| `ImperiumView.tsx` | Gewijzigd | Gebruikt SubTabBar |

