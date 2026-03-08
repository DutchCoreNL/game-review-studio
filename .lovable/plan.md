

## Verbeteringsplan — Volgende Visuele & UX Upgrades

Na audit van alle views en componenten zijn dit de gebieden met het meeste verbeterpotentieel:

---

### 1. NightReport — Te Groot (997 regels)
**Probleem:** Het NightReport is het grootste component in het project. Moeilijk te onderhouden en bevat herhaalde patronen.

**Verbetering:**
- Splitsen in sub-componenten: `IncomeSection`, `EventsSection`, `DrugEmpireSection`, `DigestSection`
- Hergebruik van `AnimatedReportRow` consistent maken
- Schatting: ~4 nieuwe bestanden, NightReport.tsx naar ~300 regels

### 2. SubTabBar — Geen Scroll-indicatie
**Probleem:** De SubTabBar scrollt horizontaal maar geeft geen visuele hint dat er meer tabs buiten beeld zijn. Gebruikers missen tabs.

**Verbetering:**
- Fade-gradient toevoegen aan linker/rechter rand wanneer er meer tabs zijn
- Actieve tab automatisch in view scrollen bij mount
- Subtiele pijl-indicator bij overflow

### 3. DesktopSidebar — Statische Datumweergave
**Probleem:** De sidebar toont de echte datum (`new Date()`) in plaats van de in-game datum. Dit breekt de immersie.

**Verbetering:**
- Gebruik `formatGameDate()` (reeds beschikbaar) i.p.v. `new Date().toLocaleDateString()`
- Tijdfase-icoon toevoegen (🌙/☀️) consistent met de header

### 4. Empty States — Meerdere Views Missen Ze
**Probleem:** Views als Leaderboard, Chat en Safehouse tonen "Laden..." als platte tekst zonder de nieuwe `SkeletonCard` te gebruiken die we net hebben gemaakt.

**Verbetering:**
- `SkeletonCard` integreren in LeaderboardView, EducationView en SafehouseView loading states
- Thematische lege-staat berichten toevoegen waar nodig

### 5. GameButton — Hover-feedback op Desktop
**Probleem:** De GameButton heeft goede mobile tap-feedback (whileTap scale) maar mist hover-effecten op desktop. Knoppen voelen "dood" tot je klikt.

**Verbetering:**
- `whileHover` scale en brightness toevoegen aan GameButton
- Subtiele glow-intensivering bij hover voor glow-varianten

### 6. JobsView — Emoji's i.p.v. Noir Visuals
**Probleem:** JobsView gebruikt nog emoji's (🍸, 🚕, 🛡️) voor baankaarten, inconsistent met de noir-stijl van de rest.

**Verbetering:**
- Emoji's vervangen door Lucide iconen met kleurcodering per baantype
- Actieve baan-indicator visueel prominenter maken

---

### Technisch Overzicht
| Component | Wijziging | Impact |
|---|---|---|
| `NightReport.tsx` | Splitsen in 4 sub-componenten | Hoog (onderhoud) |
| `SubTabBar.tsx` | Scroll-fade indicators | Medium (UX) |
| `DesktopSidebar.tsx` | Game-datum fix + fase-icoon | Laag (immersie) |
| Meerdere views | SkeletonCard integratie | Medium (polish) |
| `GameButton.tsx` | Desktop hover-effecten | Laag (feel) |
| `JobsView.tsx` | Emoji → Lucide iconen | Laag (consistentie) |

Totaal: ~6-8 bestanden aanpassen, ~4 nieuwe sub-componenten.

