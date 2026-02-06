

# Noxhaven: Blood & Empire - Verbeteringen & Toevoegingen

Na een grondige review van de volledige codebase heb ik de volgende verbeterpunten en toevoegingen geidentificeerd, opgedeeld in **bugfixes**, **gameplay verbeteringen** en **nieuwe features**.

---

## 1. Bugfixes

### Console Warning: InfoRow ref probleem
Er is een actieve warning in de console: "Function components cannot be given refs" bij de `InfoRow` component in `ResourcePopup.tsx`. Dit wordt veroorzaakt door AnimatePresence die refs probeert door te geven.

### Crew healing ontbreekt
Crewleden kunnen gewond raken of bewusteloos worden, maar er is geen manier om ze te genezen. De constant `Iron Borough perk: -20% Crew Healing Cost` bestaat, maar er is geen healing-mechanisme.

### Voertuig conditie-verval ontbreekt
Voertuigen hebben een `condition` eigenschap en een reparatie-knop, maar de conditie daalt nooit automatisch. Dit maakt reparatie zinloos.

### DailyReward.tsx is ongebruikt
Het bestand `DailyReward.tsx` bestaat nog steeds maar wordt nergens meer geimporteerd (eerder verwijderd uit GameLayout). Kan opgeruimd worden.

### Achievement check in useEffect veroorzaakt potentiele loop
In `GameContext.tsx` checkt de `useEffect` op `[state]` voor achievements en roept dan `showToast` aan, wat een re-render kan triggeren.

---

## 2. Gameplay Verbeteringen

### Dag-rapport na END_TURN
Na het afsluiten van een dag krijg je nu alleen een korte toast. Er zou een samenvatting popup moeten komen met:
- Inkomen uit districten en bedrijven
- Witgewassen geld
- Rente op schuld
- Lab productie
- Heat verandering
- Eventuele politie-invallen

### Crew Management uitbreiden
- **Healing**: Een knop toevoegen om crewleden te genezen (bijv. EUR 500 per HP-punt, met Iron Borough korting)
- **Ontslaan**: Mogelijkheid om crewleden te ontslaan
- **Crew namen**: Nu kunnen dubbele namen voorkomen bij het recruteren

### Markt: Meerdere eenheden tegelijk kopen/verkopen
Nu kun je alleen 1 item per klik kopen of verkopen. Een hoeveelheid-selector (1x, 5x, 10x, Max) zou de handelservaring sterk verbeteren.

### Combat systeem activeren
Er is een volledig `CombatState` type en `COMBAT_ENVIRONMENTS` data gedefinieerd, maar er is geen combat-systeem geimplementeerd. Factieleiders kunnen niet verslagen worden, waardoor de "Kingpin" achievement onbereikbaar is.

---

## 3. Nieuwe Features

### Nachtrapport Popup
Een visueel rapport dat verschijnt na elke dag met een overzicht van alles wat er die nacht is gebeurd (inkomsten, kosten, events).

### Random Events systeem
Willekeurige events die elke dag kunnen plaatsvinden:
- Politie-inval (verlies geld/goederen bij hoge heat)
- Factie-aanval (als relatie te laag is)
- Marktkans (tijdelijk lagere prijzen)
- Tipgever (informatie over high-demand districten)

### Bevestigingsdialogen
Voor belangrijke acties zoals:
- Game resetten
- Dure aankopen (voertuigen, districten)
- Dag afsluiten

### Geluidsfeedback-indicaties
Visuele feedback versterken bij acties:
- Geld verdienen: groen flash-effect
- Geld verliezen: rood flash-effect
- Level up: goud explosie-animatie

### Statistieken pagina
In het profiel een overzicht toevoegen met:
- Totaal verdiend geld
- Totaal gewonnen/verloren in casino
- Aantal voltooide missies
- Speeltijd

---

## Technisch Overzicht

| Onderdeel | Bestanden | Type |
|-----------|-----------|------|
| InfoRow ref fix | `ResourcePopup.tsx` | Bugfix |
| Verwijder DailyReward.tsx | `DailyReward.tsx` | Cleanup |
| Crew healing & ontslaan | `MissionsView.tsx`, `GameContext.tsx`, `engine.ts` | Feature |
| Voertuig conditie-verval | `engine.ts` (endTurn) | Bugfix |
| Nachtrapport popup | Nieuw component `NightReport.tsx`, `GameLayout.tsx`, `engine.ts` | Feature |
| Bulk trading (1x/5x/10x) | `MarketView.tsx`, `GameContext.tsx`, `engine.ts` | Verbetering |
| Random events | `engine.ts`, `constants.ts`, `types.ts` | Feature |
| Bevestigingsdialogen | `MapView.tsx`, `ProfileView.tsx` + nieuw `ConfirmDialog.tsx` | UX |
| Combat systeem | Nieuw component `CombatView.tsx`, `engine.ts`, `GameContext.tsx` | Feature |
| Achievement fix (Kingpin bereikbaar) | Afhankelijk van combat systeem | Bugfix |
| Statistieken tracking | `types.ts`, `ProfileView.tsx`, `engine.ts` | Feature |
| Unieke crew namen | `engine.ts` (recruit functie) | Bugfix |

---

## Aanbevolen volgorde

1. **Bugfixes eerst** - InfoRow ref, ongebruikte bestanden, crew namen, voertuig conditie
2. **Crew healing & ontslaan** - Direct impactvolle gameplay verbetering
3. **Bulk trading** - Veel gevraagde quality-of-life verbetering
4. **Nachtrapport** - Geeft spelers beter overzicht
5. **Random events** - Maakt het spel dynamischer
6. **Bevestigingsdialogen** - Voorkomt ongelukken
7. **Combat systeem** - Grootste nieuwe feature, maakt Kingpin achievement bereikbaar
8. **Statistieken** - Leuk extraatje voor completionisten

