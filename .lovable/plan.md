
# Territoriumoorlogen Systeem — Herziening

## 1. Nieuw Verdedigingssysteem: District HQ Upgrades

**Weg met crew-positionering**, vervangen door een **HQ upgrade-boom per district**:

### Upgrade Tiers (elk district apart)
| Upgrade | Kosten | Effect | Icoon |
|---------|--------|--------|-------|
| Straatpatrouille | €3.000 | +15 verdediging | 🚶 |
| Versterkte Muren | €8.000 | +25 verdediging | 🧱 |
| Bewakingsnetwerk | €12.000 | +20 verdediging, -10% aanvalskans | 📡 |
| Geschutstoren | €20.000 | +30 verdediging | 🔫 |
| Commandocentrum | €35.000 | +20 verdediging, +spionage intel | 🏛️ |

Upgrades zijn cumulatief — hoe meer je bouwt, hoe sterker het district.

### Wijzigingen aan types
- `DistrictDefense` wordt: `{ upgrades: DistrictHQUpgradeId[]; fortLevel: number }` (geen `stationedCrew` meer)
- Nieuw type `DistrictHQUpgradeId` en `DistrictHQUpgradeDef`

---

## 2. Territoriumoorlogen: Hybride Systeem

### Automatische aanvallen (zoals nu, maar verbeterd)
- Nachtelijke aanvallen blijven in het Night Report
- Verdediging wordt nu berekend op basis van HQ-upgrades i.p.v. crew
- Bij **winst**: oorlogsbuit (geld + goederen)
- Bij **verlies**: district kwijt + geld verlies

### Interventie bij grote aanvallen (NIEUW)
- Als de aanval sterk genoeg is (strength > 60% van verdediging), verschijnt een **War Event popup**
- Speler krijgt 3 tactische keuzes:
  - **Verdedigen** (muscle-check): standaard, volle verdedigingskracht
  - **Hinderlaag** (brains-check): hogere winkans maar risicovol
  - **Onderhandelen** (charm-check): betaal geld om aanval af te kopen
- Keuze beïnvloedt uitkomst + oorlogsbuit

---

## 3. Spionage & Sabotage

- Nieuwe actie in de Imperium tab: **"Verken Vijand"** per niet-bezeten district
- Kost: €2.000 + 1 dag cooldown
- Geeft intel: voorspelt aanvalskans komende 3 dagen
- **Sabotage**: kost €5.000, verlaagt vijandelijke aanvalskracht met 30% voor 2 dagen
- Vereist: Commandocentrum upgrade

---

## 4. Allianties met Facties

- Als factie-relatie ≥ 60: optie "VRAAG HULP" bij een oorlog
- Kost: -10 relatie per keer
- Effect: +25 verdediging voor die aanval
- Cooldown: 3 dagen

---

## 5. Oorlogsbuit & Plundering

Bij gewonnen verdedigingen:
- Buit schaal met aanvalssterkte: €500-5.000
- Kans op goederen: 20% kans op random good
- Bij hoge verdediging (overkill): bonus rep + extra buit

---

## Technische Aanpak

### Aangepaste bestanden:
- **`types.ts`**: Nieuwe `DistrictHQUpgradeId`, `DistrictHQUpgradeDef`, `WarEvent`, herziene `DistrictDefense`
- **`constants.ts`**: `DISTRICT_HQ_UPGRADES` array, verwijder crew-gerelateerde defaults, update `createInitialDefenses`
- **`newFeatures.ts`**: Herschrijf `resolveDistrictAttacks` met buit-logica en interventie-trigger
- **`GameContext.tsx`**: Vervang `STATION_CREW`/`UNSTATION_CREW` door `BUY_DISTRICT_UPGRADE`, nieuwe `RESOLVE_WAR_EVENT`
- **Nieuw: `WarEventPopup.tsx`**: Pop-up voor tactische keuzes bij grote aanvallen
- **Nieuw: `DistrictDefensePanel.tsx`**: UI voor HQ upgrades per district (in Imperium tab)
- **`ImperiumView.tsx`**: Nieuwe sub-tab "OORLOG" met verdedigingsoverzicht
- **`GameLayout.tsx`**: Render `WarEventPopup`
