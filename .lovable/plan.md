

# Cinematic UI Overhaul — Alle Overige Views

Alle resterende views upgraden naar dezelfde noir cinematic stijl als Combat en Missions: immersieve headers, kaart-gebaseerde layouts, betere visuele hiërarchie.

---

## 1. Heist View (`heist/HeistView.tsx`)

**Heist Selectie:**
- Cinematic header (h-36) met heist-bg en overlay: "HEIST PLANNING" titel
- Heist-kaarten als grote cards met afbeelding-banner, moeilijkheidsgraad-badge, en beloningen als icon-chips
- Locked heists met donkere overlay + lock-icoon

**Heist Planning:**
- Rol-selectie als kaarten met crew-portret, rol-beschrijving en stat-vereisten (color-coded)
- Equipment keuze als grid van icon-cards met bonus-beschrijving
- Intel-meter als visuele progress bar met fase-labels

**Heist Executie:**
- Scene header met heist-afbeelding, fase-indicator als stappen-balk
- Keuze-opties als actie-kaarten (zoals combat) met risico/beloning-info
- Minigame-integratie behouden maar met cinematic framing

---

## 2. Casino View (`CasinoView.tsx`)

**Lobby:**
- Grote casino-bg header (h-36) met "VELVET ROOM" neon-stijl titel
- Spel-selectie als kaarten met spel-afbeelding, korte beschrijving, en VIP-bonus badge
- Sessie-stats panel compact onderaan: winst/verlies, streak, VIP-level
- Storm-lock als visuele overlay op de hele view

**Individuele spellen:** behouden maar met cinematic wrapper

---

## 3. Trade View — Market Panel (`trade/MarketPanel.tsx` + `TradeView.tsx`)

- Cinematic header al aanwezig via ViewWrapper, maar sub-panels upgraden:
- Goederen als kaarten met thumbnail, prijs, en koop/verkoop knoppen inline
- Prijs-vergelijking per district als compacte color-coded badges
- Winst-indicatoren prominenter (groen/rood pijlen)

---

## 4. Chop Shop View (`ChopShopView.tsx`)

- Cinematic header met chopshop-bg (al aanwezig maar verbeteren)
- Auto-kaarten met grotere afbeelding-banner, conditie-bar, en waarde overlay
- Upgrade-opties als icon-cards met bonus-beschrijving
- Crusher/Omkat acties als gestylede actie-kaarten ipv knoppen

---

## 5. District Popup (`DistrictPopup.tsx`)

- Grotere district-afbeelding als header (h-28) met naam + rep-bar overlay
- Info-secties als kaarten: Eigenaar, Gangs, Perks, HQ Upgrades
- Actieknoppen (Travel, Donate, Conquer) als color-coded actie-kaarten
- Territory-info met gang-badges

---

## 6. Safehouse View (`SafehouseView.tsx`)

- Cinematic header met safehouse-bg
- Safehouse-kaarten per district met status-badge en upgrade-level indicator
- Upgrade-opties als kaarten met afbeelding, kosten-badge, en effect-beschrijving
- Perk-overzicht als compact icon-grid

---

## 7. Hospital View (`HospitalView.tsx`)

- Compacte cinematic header met medisch thema
- HP-status als grote visuele bar met percentage
- Heal-opties als 3 kaarten: klein/medium/volledig met icoon, kosten, en beschrijving
- Consistente card-layout met de rest

---

## Technisch Overzicht

| View | Bestand | Aanpak |
|------|---------|--------|
| Heist selectie + planning + executie | `heist/HeistView.tsx` | Herstructurering |
| Casino lobby | `CasinoView.tsx` | Herstructurering |
| Trade market panel | `trade/MarketPanel.tsx` | Uitbreiding |
| Chop Shop | `ChopShopView.tsx` | Herstructurering |
| District Popup | `DistrictPopup.tsx` | Herstructurering |
| Safehouse | `SafehouseView.tsx` | Herstructurering |
| Hospital | `HospitalView.tsx` | Herstructurering |

Puur visuele wijzigingen — geen gameplay-logica aanpassingen. Alle bestaande functionaliteit blijft intact. Framer Motion animaties en bestaande afbeeldingen worden hergebruikt.

