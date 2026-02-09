
# Noxhaven Spelreview: Verbeterpunten & Vernieuwingen

Na het doorlopen van alle systemen, bestanden en logica heb ik de volgende aandachtsgebieden geidentificeerd, gegroepeerd op prioriteit.

---

## A. BUGS & INCONSISTENTIES (Hoge Prioriteit)

### 1. Dubbele Reward bij Nemesis Defeat
In `engine.ts` (regel 1010-1012) wordt `resolveNemesisDefeat()` aangeroepen, die al geld en rep toevoegt. Maar daarna berekent de combat log opnieuw dezelfde reward. De speler krijgt de beloning maar 1x (correct), maar de log kan verwarrend zijn omdat het bedrag al in `resolveNemesisDefeat` wordt verwerkt.

### 2. Legacy HQ-Upgrade Checks Nog Actief
Hoewel HQ_UPGRADES leeg is gemaakt, staan er nog actieve checks op `state.hqUpgrades` in:
- `engine.ts` regel 71: `state.hqUpgrades.includes('garage')` (naast de villa-check)
- `engine.ts` regel 410: `state.hqUpgrades.includes('lab')` 
- `engine.ts` regel 435: `state.hqUpgrades.includes('safehouse')`
- `engine.ts` regel 475-476: `state.hqUpgrades.includes('server')` (naast villa-check)
- `engine.ts` regel 484: `state.hqUpgrades.includes('safehouse')` (personal heat decay)

Deze code doet functioneel niets meer (lege array), maar maakt de code onnodig complex. Opruimen maakt het geheel schoner.

### 3. Deep Clone Performance
`GameContext.tsx` regel 167: `JSON.parse(JSON.stringify(state))` wordt bij **elke** action aangeroepen. Bij een complexe state met 50+ velden, arrays van objecten, en geneste data is dit traag. Een structurele immutable-update (of immer.js) zou de performance verbeteren.

### 4. Mutaties op Geclonede State
Functies zoals `addVehicleHeat`, `addPersonalHeat`, `splitHeat` muteren de state direct. Dit werkt alleen omdat de reducer een deep-clone maakt, maar het is fragiel en kan subtiele bugs veroorzaken als de clone incompleet is.

---

## B. GAMEPLAY BALANS (Medium Prioriteit)

### 5. Schuld Cap Te Hoog
De schuld-cap staat op `€250.000` (engine.ts regel 283). Met 3% rente per dag is dat `€7.500/dag` aan rente. Op dit niveau is het vrijwel onmogelijk om eruit te komen. Een lager plafond (bijv. `€100.000`) of afnemende rente zou eerlijker zijn.

### 6. Casino is Te Toegankelijk
Het casino is altijd beschikbaar (behalve bij storm), ongeacht level of locatie. Het zou logischer zijn als het casino alleen in Neon Strip beschikbaar is (het district heeft al een casino-perk).

### 7. Solo Operaties Schalen Niet
De 5 solo operaties hebben vaste beloningen (`€300 - €12.000`). Na dag 20+ zijn de eerste 3 nutteloos. Beloningen zouden mee moeten schalen met level/dag.

### 8. Contract Beloningen Schalen Oneindig
Contractbeloningen groeien met `1 + day * 0.05` tot max 4x. Maar op dag 60+ zijn dit al `€24.000+` per contract, wat de economie breekt. Een strengere cap of plateau zou beter zijn.

### 9. Crew Limiet Te Laag
Max 6 crew (8 met villa crew kwartieren). Met 4 rollen en specialisaties is dit vrij krap. Een geleidelijke verhoging per endgame-fase zou meer strategische diepte bieden.

### 10. Geen Onderhoudskosten
Districten, voertuigen en bedrijven hebben geen lopende kosten. Eenmaal gekocht is het pure winst. Onderhoudskosten (bijv. 5% van de aankoopprijs per "week") zouden de economie realistischer maken.

---

## C. ONTBREKENDE FEATURES (Medium Prioriteit)

### 11. Geen Statistieken/Overzicht Pagina
Er is geen plek waar de speler een totaaloverzicht kan zien van: totale inkomsten per bron, heat breakdown, actieve bonussen, etc. Dit zou het profiel-tab veel waardevoller maken.

### 12. Geen Save Slots
Er is maar 1 save slot. Spelers kunnen niet meerdere runs bewaren of experimenteren.

### 13. Geen Geluid/Muziek Integratie
`src/game/sounds.ts` bestaat maar wordt nergens actief gebruikt in de UI. Geluidseffecten bij combat, handel, en events zouden de immersie sterk verbeteren.

### 14. Geen District-Specifieke Events
De random events zijn generiek en niet district-specifiek. Port Nero zou havengebonden events moeten hebben, Crown Heights financiele events, etc.

### 15. Achievement Notificaties Ontbreken
Achievements worden gecheckt (`checkAchievements`), maar er is geen visuele notificatie/popup wanneer een achievement wordt ontgrendeld.

---

## D. UX/UI VERBETERINGEN (Medium Prioriteit)

### 16. Kaart Knoppen Overload
De MapView heeft tot 5 knoppen onderaan (Dag Afsluiten, Casino, Chop Shop, Safehouse, Villa). Op een 320px breed scherm is dit krap. Een "meer..." dropdown of contextmenu zou schoner zijn.

### 17. Geen Bevestiging bij Dure Aankopen
Bij het kopen van een district (€85.000 voor Crown Heights) of villa (€150.000) is er geen bevestigingsdialoog. Een misclick kan desastreus zijn.

### 18. Night Report is Overweldigend
Het nachtrapport toont soms 10+ items (district income, business income, washing, lab, villa productie, defense, nemesis, smuggling, weather, ammo, etc.). Een samenvatting met uitklap-details zou leesbaarder zijn.

---

## E. CODE KWALITEIT (Lage Prioriteit, Hoge Impact)

### 19. GameContext.tsx is 2000 Regels
De reducer alleen is al 1500+ regels. Opsplitsen in sub-reducers (tradeReducer, combatReducer, villaReducer, etc.) zou de onderhoudbaarheid drastisch verbeteren.

### 20. Type `any` Gebruik
Er zijn meerdere `any` casts in de codebase:
- `(s as any).seenEndgameEvents` (GameContext regel 311-312)
- `pendingStreetEvent: any | null` in types.ts
- Deze zouden getypt moeten worden.

### 21. Circulaire Import Risico
`engine.ts` importeert uit `newFeatures.ts`, die weer uit `engine.ts` importeert. Dit werkt nu, maar is fragiel.

---

## Aanbevolen Actieplan (Top 5)

1. **HQ legacy code opruimen** -- Verwijder alle `hqUpgrades.includes()` checks uit engine.ts (puur opruimwerk, geen gameplay-impact)
2. **Solo operaties laten schalen** -- Beloningen mee laten groeien met speler-level
3. **Achievement popup toevoegen** -- Visuele feedback wanneer een achievement wordt ontgrendeld
4. **Casino locatiegebonden maken** -- Alleen beschikbaar in Neon Strip
5. **Statistieken-overzicht in profiel** -- Heat breakdown, inkomensbronnen, actieve bonussen

---

## Technische Details per Verbetering

### HQ Legacy Opruimen (punt 1 & 2)
- **engine.ts**: Verwijder alle `state.hqUpgrades.includes(...)` checks (regels 71, 410, 435, 475, 484)
- Behoud alleen de villa-module checks die er al staan

### Solo Ops Scaling (punt 7)
- **constants.ts**: Voeg een `rewardScale` factor toe aan `SoloOperation`
- **engine.ts** `performSoloOp()`: `reward = op.reward * (1 + state.player.level * 0.1)`
- Cap op 3x basis voor balans

### Achievement Popup (punt 15)
- Nieuw component `AchievementPopup.tsx`
- In `GameLayout.tsx`: state voor `pendingAchievement`
- In de END_TURN action: check voor nieuwe achievements en toon popup

### Casino Locatiegebonden (punt 6)
- **MapView.tsx**: Casino-knop alleen tonen als `state.loc === 'neon'`
- VIP Casino perk (Crown Heights rep 50) geeft ook toegang

### Statistieken Overzicht (punt 11)
- Nieuw component `StatsOverviewPanel.tsx` in profiel
- Toont: inkomsten per bron, heat breakdown, actieve bonussen, handelsstatistieken
