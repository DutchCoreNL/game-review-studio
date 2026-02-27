

## Plan: Fix Sidebar Navigation View Mapping

### Problemen gevonden

De sidebar definieert ~35 navigatie-items, maar veel view-mappings in `GameLayout.tsx` wijzen naar container-views (`OperationsView`, `ImperiumView`, `ProfileView`) die hun eigen sub-tab state hebben. Hierdoor opent bijv. "Contracten" altijd de OperationsView op de 'solo' tab in plaats van 'contracts'.

Specifieke issues:
- `contracts` → `OperationsView` (opent altijd op 'solo')
- `crew` → `OperationsView` (opent altijd op 'solo')  
- `families` → `ImperiumView` (opent altijd op 'garage')
- `business` → `ImperiumView` (opent altijd op 'garage')
- `loadout` → `ProfileView` (opent altijd op 'stats')
- `trophies` → `ProfileView` (opent altijd op 'stats')
- `BusinessPanel` en `FamiliesPanel` zijn private functies in `ImperiumView.tsx` en niet importeerbaar
- ProfileView toont nog steeds alle sub-tabs als duplicaat van de sidebar

### Implementatiestappen

1. **Exporteer `BusinessPanel` en `FamiliesPanel` uit `ImperiumView.tsx`**
   - Maak ze `export function` i.p.v. private functions
   - Of verplaats ze naar eigen bestanden

2. **Extraheer `StatsPanel`, `LoadoutPanel`, `TrophiesPanel` uit `ProfileView.tsx`**
   - De inline code voor `stats`, `loadout` en `trophies` tabs moet als aparte exporteerbare componenten bestaan
   - ProfileView kan dan een wrapper blijven die de juiste sub-component rendert op basis van de huidige `view`

3. **Extraheer `CrewPanel` en `ContractsPanel` uit `OperationsView.tsx`**  
   - De inline code voor `crew` en `contracts` sub-tabs wordt aparte componenten

4. **Update `GameLayout.tsx` view mapping**
   - Elke sidebar-entry wijst naar het correcte standalone component:
     - `contracts` → `ContractsPanel`
     - `crew` → `CrewPanel`  
     - `families` → `FamiliesPanel`
     - `business` → `BusinessPanel`
     - `loadout` → `LoadoutPanel`
     - `trophies` → `TrophiesPanel`
     - `profile` → `StatsPanel` (of een vereenvoudigde ProfileView zonder sub-tabs)

5. **Verwijder SubTabBar uit OperationsView, ImperiumView, ProfileView**
   - Deze container-views worden niet meer direct gebruikt
   - Of: vereenvoudig ze tot alleen hun "hoofd" content (solo ops, stats overview)
   - De sub-tab navigatie is nu volledig vervangen door de sidebar

6. **`ops` view vereenvoudigen**
   - `OperationsView` wordt de "Solo Operaties" view zonder sub-tabs
   - Alle andere sub-tabs zijn nu standalone views via de sidebar

### Technische details

- Circa 6 nieuwe component-bestanden of exports
- `GameLayout.tsx` views record wordt bijgewerkt met correcte imports
- Geen database- of type-wijzigingen nodig — `GameView` type is al compleet
- De `DesktopSidebar` en `GameSidebar` hoeven niet aangepast te worden

