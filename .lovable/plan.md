

# Campagne Verbetering — Alle 4 Gebieden

De campagne heeft al een solide basis met briefings, 7 encounter-types, moreel, boss rage/cooldowns, sterrenrating en trofeeën. Nu gaan we elk aspect naar een hoger niveau tillen.

---

## 1. Meer Strategische Diepte

### Boss Gevecht
- **Buff/Debuff Systeem**: Bosses kunnen debuffs toepassen (vertraagd, vergiftigd, geblindeerd) die meerdere beurten duren. Speler kan met "Verdedig" debuffs clearen.
- **Item Gebruik in Gevecht**: Nieuwe actie "Item" (5e knop) — gebruik consumables (medkit = heal, flash = boss mist 1 beurt, adrenaline = dubbele schade 1 beurt). Max 2 items per boss fight.
- **Boss Counter-Mechaniek**: Bosses hebben een "tells" systeem — bepaalde acties in een bepaalde fase worden gecounterd (bijv. heavy attack in fase 2 = boss countert). Aanwijzingen in de log.
- **Combo Systeem**: 3x aanval achter elkaar = bonus schade. Attack → Heavy → Attack = "Executie Combo" voor 2x schade.

### Missie Encounters
- **Encounter Gevolgen**: Keuzes in eerdere encounters beïnvloeden latere encounters (bijv. stealth in encounter 1 = minder vijanden in encounter 3, aggressive = boss heeft meer rage bij start).
- **Risico/Beloning Keuze**: Na elke encounter: optie om "door te pushen" (skip healing, +50% loot) of "rust nemen" (recover morale, geen bonus).

### Implementatie
- Uitbreiding `ActiveBossFight` met `debuffs: BossDebuff[]`, `itemsUsed: number`, `comboCounter: number`
- Uitbreiding `bossFightTurn()` met debuff/combo/counter logica
- Nieuwe actie `'item'` in BOSS_FIGHT_ACTION union type
- Uitbreiding `advanceCampaignMission()` met encounter-carry-over effecten

---

## 2. Betere Progressie & Balans

### Power Curve
- **Difficulty Scaling**: Hard = 1.5x stats + boss heeft extra fase, Nightmare = 2x stats + boss healt 5% per 5 beurten + unieke mechaniek
- **Mission Difficulty Stars**: Visuele indicator (1-5 schedels) per missie op basis van speler level vs missie level
- **Adaptive Difficulty**: Als speler 3x faalt op een missie, verlaag moeilijkheid subtiel met 10%

### Loot Scaling
- **Pity System**: Na 5 missies zonder weapon drop = gegarandeerd wapen
- **Chapter-Specifieke Gear Sets**: Elk chapter heeft 3 thematische items (wapen + armor + gadget) met set-bonus als je alle 3 draagt
- **Boss Kill Milestones**: 1e kill = gegarandeerd epic, 3e kill = gegarandeerd legendary, 5e kill = exclusief accessory

### Replay Value
- **Challenge Modifiers**: Bij replay kun je modifiers activeren (No Heal, Speed Run, Pacifist) voor extra rewards
- **Weekly Challenge**: Één random missie per week met speciale regels en exclusieve beloning

### Implementatie
- Nieuw bestand `src/game/campaignGearSets.ts` met set-definities en bonus-berekeningen
- Uitbreiding `CampaignState` met `pityCounter`, `weeklyChallenge`, `failCount`
- Uitbreiding missie-definities met `difficultyRating` en `gearSetPiece`
- Modifier-logica in `advanceCampaignMission()` en `bossFightTurn()`

---

## 3. Meer Content & Variatie

### Extra Content
- **Bonus Objectieven per Missie**: Elke missie krijgt 1-2 optionele doelen (bijv. "Voltooi zonder agressief", "Vind het geheime item", "Eindig met 80%+ moreel") voor extra beloningen
- **Hidden Encounters**: 15% kans op een "verborgen encounter" na de laatste encounter — optioneel, maar met betere loot
- **Elite Variant Missies**: Na 3-ster completion verschijnt een "Elite" variant met 50% meer encounters, sterkere vijanden, maar dubbele loot
- **Mini-Boss Encounters**: Sommige missies (ch3+) hebben een mini-boss als middelste encounter met eigen HP bar en 1 speciale aanval

### Secret Content
- **Geheime Boss per Chapter**: Na alle missies 3 sterren op Nightmare = onthul een "Shadow Boss" (harder dan hoofdboss, uniek accessory)
- **Lore Collectibles**: Verborgen lore-fragmenten in exploration encounters die het Codex-systeem voeden

### Implementatie
- Uitbreiding `CampaignMission` met `bonusObjectives: BonusObjective[]`
- Uitbreiding `ActiveCampaignMission` met `bonusObjectivesCompleted: string[]`, `hiddenEncounterTriggered`
- Nieuwe UI sectie in debriefing voor bonus-doelen
- Mini-boss logica als sub-systeem van encounter resolution
- Secret boss data in chapter definitie (optioneel veld)

---

## 4. Visuele & UX Polish

### Missie View
- **Encounter Kaart**: In plaats van tekst-only, toon een gestylede "kaart" per encounter met type-icoon, sfeer-illustratie (CSS gradient achtergrond per type), en keuze-knoppen als kaart-acties
- **Keuze-Feedback Animatie**: Bij stealth = groene glow fade, bij aggressive = rood screen shake, bij standard = blauwe pulse
- **Progressie Balk met Encounter Icons**: Vervang de huidige emoji-rij door een visuele "pad" (connected dots) met encounter-type icons
- **Random Event Popup**: Animeer random events als een floating card die inschuift in plaats van een log-entry

### Boss Fight View
- **Damage Numbers**: Floating damage numbers die omhoog animeren bij elke hit (rood voor boss schade, groen voor healing)
- **Boss Sprite Animatie**: Boss icon schudt bij hit, pulseert bij special attack, groeit bij phase change
- **Action Feedback**: Kort visueel effect per actie (slash animatie bij attack, schild shimmer bij defend, blur bij dodge)
- **HP Bar Segmenten**: Boss HP bar verdeeld in segmenten (elke 10%) met crack-effect bij doorbreken

### Campaign Overview
- **Chapter Kaart**: Vervang de lijst door een visuele "route" (verticaal pad met chapter nodes, verbonden door lijnen)
- **Boss Trophy Vitrine**: Toon verzamelde trofeeën als kleine iconen met tooltip in een aparte sectie
- **Missie Sterren Animatie**: Bij hover over voltooide missie, toon de sterren met een subtiele glans

### Implementatie
- Nieuw component `src/components/game/campaign/EncounterCard.tsx` voor gestylede encounter presentatie
- Nieuw component `src/components/game/campaign/DamageNumber.tsx` voor floating damage
- Nieuw component `src/components/game/campaign/ChapterMap.tsx` voor visuele route
- CSS animaties in Tailwind voor screen shake, glow, pulse effecten
- Framer Motion voor damage numbers, encounter transitions, trophy showcase

---

## Technisch Overzicht

| Onderdeel | Bestand | Type |
|-----------|---------|------|
| Boss debuffs, combos, items, counters | `campaign.ts` | Uitbreiding |
| Encounter carry-over effecten | `campaign.ts` | Uitbreiding |
| Chapter gear sets & set-bonussen | `campaignGearSets.ts` | Nieuw |
| Bonus objectieven, hidden encounters, elite missies | `campaign.ts` | Uitbreiding |
| Mini-boss encounter systeem | `campaign.ts` | Nieuw |
| Pity system, fail tracking, weekly challenge | `campaign.ts` + `GameContext.tsx` | Uitbreiding |
| Encounter card component | `EncounterCard.tsx` | Nieuw |
| Floating damage numbers | `DamageNumber.tsx` | Nieuw |
| Chapter kaart visualisatie | `ChapterMap.tsx` | Nieuw |
| Boss sprite animaties & action feedback | `BossFightView.tsx` | Uitbreiding |
| Missie keuze-feedback animaties | `CampaignMissionView.tsx` | Uitbreiding |
| Random event popups | `CampaignMissionView.tsx` | Uitbreiding |
| Trophy vitrine & missie hover | `CampaignView.tsx` | Uitbreiding |
| State uitbreidingen (debuffs, pity, objectives) | `GameContext.tsx` | Uitbreiding |

Alle wijzigingen zijn client-side. Geen database migraties nodig. Gezien de omvang raad ik aan in 2 fasen te implementeren: eerst strategische diepte + progressie (gameplay-impact), dan content + visuele polish.

