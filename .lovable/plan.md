
# Garage Verbetering: Eigen Volwaardige View

## Probleem
De garage zit nu ingeklemd in de DistrictPopup (wanneer je in een district bent) en is deels gedupliceerd in de Imperium > Bezit tab. Dit maakt de popup druk en de garage-ervaring versnipperd.

## Oplossing
De garage wordt een eigen sub-tab binnen het Imperium-scherm, met een verbeterd ontwerp dat alle voertuigfunctionaliteit samenbrengt.

## Wat verandert er?

### 1. Garage uit de DistrictPopup halen
De DistrictPopup toont straks alleen district-informatie (reputatie, verdediging, reizen/overnemen). De garage wordt daar verwijderd.

### 2. Nieuwe "GARAGE" sub-tab in Imperium
De huidige BEZIT-tab wordt opgesplitst:
- **GARAGE** (nieuw) -- alle voertuigfuncties
- **BEZIT** -- smokkelroutes, bedrijven-overzicht

### 3. Verbeterde Garage-layout met sub-secties

De nieuwe garage bevat drie duidelijke secties:

**A. Actief Voertuig (bovenaan)**
- Grote VehiclePreview SVG met het actieve voertuig
- Heat-bar en conditie-balk
- Omkat-knop met animatie (verplaatst uit GaragePanel)
- Reparatie-knop

**B. Upgrades (midden)**
- De bestaande VehicleUpgradePanel, nu met meer ruimte
- Totale stats-overzicht: base stats + upgrade bonussen

**C. Voertuigcollectie (onderaan)**
- Alle bezeten voertuigen als kaarten met thumbnail-afbeeldingen
- Actief voertuig gemarkeerd met gouden rand
- Knop om van voertuig te wisselen
- Niet-bezeten voertuigen als "te koop"-kaarten met prijs

## Technisch Plan

### Bestanden die worden aangepast:

1. **`src/components/game/ImperiumView.tsx`**
   - Sub-tabs uitbreiden met "GARAGE" (Car-icoon)
   - Bestaande AssetsPanel opsplitsen: voertuig-code verplaatst naar nieuwe GarageView
   - AssetsPanel behhoudt smokkelroutes en eventueel legacy lab

2. **`src/components/game/garage/GarageView.tsx`** (nieuw)
   - Volledige garage-view met drie secties
   - Combineert functionaliteit van GaragePanel + AssetsPanel voertuig-deel
   - Gebruikt bestaande VehiclePreview en VehicleUpgradePanel
   - Voertuigcollectie met thumbnails uit VEHICLE_IMAGES

3. **`src/components/game/DistrictPopup.tsx`**
   - GaragePanel import en rendering verwijderen
   - Eventueel een klein linkje "Ga naar Garage" toevoegen als de speler in het district is

4. **`src/components/game/garage/GaragePanel.tsx`**
   - Kan blijven bestaan als basis, maar de logica wordt geconsolideerd in GarageView

### Geen wijzigingen nodig aan:
- Game state/types (geen nieuwe state)
- Engine/constants (bestaande data wordt hergebruikt)
- GameNav (garage zit binnen Imperium, geen extra nav-item)
