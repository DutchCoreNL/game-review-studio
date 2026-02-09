
# HQ Upgrades Opruimen & Integreren in Villa

## Het Probleem
De oude "HQ Upgrades" (5 items in Imperium > Bezit) overlappen sterk met het nieuwere, uitgebreidere villa-systeem. Dit is verwarrend voor spelers en maakt balancing lastig.

## Aanbevolen Aanpak: Migreren naar Villa + Unieke Upgrades Behouden

### Stap 1: Verwijder overlappende HQ Upgrades
De volgende HQ upgrades worden verwijderd omdat de villa ze beter dekt:
- **Synthetica Lab** (€15k) — villa heeft al een synthetica_lab module
- **Versterkte Deuren** (€5k) — villa camera's doen hetzelfde maar beter
- **Safe House** (€20k) — er is al een apart safehouse-systeem + villa hiding

### Stap 2: Verplaats unieke HQ Upgrades naar de villa als modules
- **Grotere Garage** (€8k, +10 bagage) — wordt een villa-module "Garage Uitbreiding" (Level 1, ~€15k)
- **Encrypted Server** (€12k, sneller heat verlies) — wordt een villa-module "Server Room" (Level 2, ~€25k, -5 extra heat/nacht)

### Stap 3: Verwijder HQ Upgrades sectie uit Imperium > Bezit
De hele "HQ Upgrades" sectie in `AssetsPanel` binnen `ImperiumView.tsx` wordt verwijderd, omdat alles nu via de villa loopt.

### Stap 4: Backwards Compatibility
Spelers die al HQ upgrades bezitten behouden hun effecten via een migratie in de reducer:
- `hqUpgrades` met 'garage' -> automatisch villa-module 'garage_uitbreiding' erbij
- `hqUpgrades` met 'server' -> automatisch villa-module 'server_room' erbij
- `hqUpgrades` met 'lab' -> effect blijft werken tot speler villa lab koopt

## Technische Details

### Bestanden die worden aangepast:

1. **`src/game/villa.ts`**
   - Twee nieuwe modules toevoegen aan `VILLA_MODULES`:
     - `garage_uitbreiding`: +10 max inventory, Level 1, €15.000
     - `server_room`: -5 extra heat decay per nacht, Level 2, €25.000

2. **`src/game/types.ts`**
   - `garage_uitbreiding` en `server_room` toevoegen aan `VillaModuleId`

3. **`src/game/constants.ts`**
   - `HQ_UPGRADES` array inkorten tot leeg of volledig verwijderen
   - `HQUpgrade` type eventueel verwijderen

4. **`src/components/game/ImperiumView.tsx`**
   - HQ Upgrades sectie verwijderen uit `AssetsPanel`
   - Import van `HQ_UPGRADES` opruimen

5. **`src/game/engine.ts`**
   - `recalcMaxInv` aanpassen: garage bonus checken via villa-module i.p.v. hqUpgrades
   - Heat decay logica aanpassen voor server_room villa-module

6. **`src/contexts/GameContext.tsx`**
   - Migratiestap toevoegen: bestaande hqUpgrades omzetten naar villa-modules
   - `BUY_UPGRADE` action kan worden vereenvoudigd of verwijderd
   - Villa productie/bonussen aanpassen voor nieuwe modules

7. **`src/components/game/AssetsView.tsx`** en **`src/components/game/FamiliesView.tsx`**
   - Verwijzingen naar `HQ_UPGRADES` opruimen (deze componenten lijken oudere/alternatieve views te zijn)

8. **`src/components/game/profile/VillaSummaryPanel.tsx`**
   - Nieuwe modules worden automatisch zichtbaar door bestaande logica

### Resultaat
- Een schoner systeem: alle "basis-upgrades" zitten nu in de villa
- Geen verwarring meer over HQ vs villa
- De Imperium > Bezit tab focust puur op voertuigen, chop shop en smokkelroutes
