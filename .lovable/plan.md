

# Campagne Verbeterplan — Alle 4 Gebieden

## Overzicht

De campagne heeft al tactische keuzes, encounter variatie, boss rage/cooldowns en chapter replay. Nu verbeteren we **verhaal/dialoog**, **missie-variatie**, **beloningen** en **visuele flair**.

---

## 1. Rijkere Verhaal & Dialoog

**Probleem**: Missies hebben slechts 2 korte narratieve regels. Encounters tonen generieke one-liners.

**Oplossing**:
- **Missie Briefing Screen**: Voor elke missie een briefing-scherm met sfeervolle beschrijving, doelstelling en NPC-context (2-3 alinea's per missie)
- **Encounter Dialogen**: Per encounter-type uitgebreide narratieve pools (10+ varianten per type/keuze in plaats van huidige 2-3)
- **NPC Encounter Keuzes**: Bij `npc` encounters krijg je 2 dialoogopties (bijv. "Omkopen" vs "Bedreigen") met verschillende uitkomsten
- **Boss Tussendialoog**: Extra dialogue entries voor bosses (taunt per 3 beurten, reactie op dodge/heavy)
- **Missie Debriefing**: Na missie-afronding een korte samenvatting van je keuzes en hun impact

**Bestanden**: `campaign.ts` (uitgebreide narrativeText arrays, NPC keuze-systeem), `CampaignMissionView.tsx` (briefing screen, dialoogkeuzes)

---

## 2. Meer Missie-Variatie

**Probleem**: Encounters zijn functioneel identisch — kies stealth/standard/aggressive, RNG check, klaar.

**Oplossing**:
- **Timed Challenge Encounters**: Nieuw type `timed` — speler moet binnen X seconden een keuze maken, anders automatisch "standard"
- **Puzzle Encounters**: Nieuw type `puzzle` — simpele mini-game (bijv. code kraken: kies juiste volgorde van 3 symbolen)
- **Ambush Encounters**: Nieuw type `ambush` — geen keuze, automatisch combat met hogere beloning maar geen "stealth" optie
- **Morale System**: Elke keuze beïnvloedt een `morale` meter (stealth ↑, aggressive ↓). Hoge morale = bonus succes op latere encounters
- **Random Events**: 20% kans per encounter op een random event (wapen gevonden, val ontdekt, informant tipt, versterking)

**Bestanden**: `campaign.ts` (nieuwe EncounterTypes, morale logica, random events), `CampaignMissionView.tsx` (timer UI, puzzle UI, ambush UI)

---

## 3. Betere Beloningen

**Probleem**: Missies geven alleen geld/rep/xp + kans op wapen. Geen gegarandeerde progressie.

**Oplossing**:
- **Chapter Gear Sets**: Elk chapter heeft een thematisch gear set (3 stuks: wapen + armor + gadget). Bij 3-ster rating op alle missies → gegarandeerd set piece
- **Missie-Specifieke Drops**: Elke missie heeft 1 uniek benoemd item dat alleen daar dropt (bijv. "Kozlov's Lockpick" uit ch1_m1)
- **Milestone Rewards**: Na X encounters voltooid (25, 50, 100) → gegarandeerde epic/legendary crate
- **Boss Trophy Systeem**: Boss kills geven "Trophy" items (cosmetisch + stat bonus) die in profiel getoond worden
- **Streak Bonussen**: 3 missies achter elkaar met 3 sterren → bonus scrap + rare crate

**Bestanden**: `campaign.ts` (chapter sets, mission-specific drops), nieuw `campaignRewards.ts` (milestone tracking, streak logic), `CampaignView.tsx` (trophy display)

---

## 4. Visuele Verbeteringen

**Probleem**: De campagne is puur tekst/emoji — geen sfeerbeelden, geen animaties bij belangrijke momenten.

**Oplossing**:
- **Boss Portrait Banners**: Gebruik bestaande boss portraits (boss-serpiente, boss-wu etc.) als banner bovenaan BossFightView met gradient overlay
- **District-Themed Mission Banners**: Gebruik bestaande district images als achtergrond bij missie briefing (chapter 1 = Port Nero sfeer, etc.)
- **Encounter Animaties**: Framer Motion animaties bij encounter resultaten — screen flash bij agressief, fade-in bij stealth, shake bij schade
- **Boss Phase Transitions**: Volledig scherm flash + zoom-in op boss icon bij fase-wissel + typemachine-dialoog
- **Victory/Defeat Screens**: Geanimeerde overwinning (confetti-achtig goud effect) en verlies (rood vignette fade) schermen
- **Star Rating Animatie**: Bij missie-einde sterren die één voor één verschijnen met scale-bounce animatie
- **Combat Log Styling**: Boss aanvallen krijgen rode glow, speler aanvallen groene glow, speciale aanvallen krijgen shake-effect

**Bestanden**: `BossFightView.tsx` (portraits, phase animations), `CampaignMissionView.tsx` (encounter animaties, briefing banners), `CampaignView.tsx` (trophy display), `assets/items/index.ts` (boss portrait mapping voor campaign)

---

## Technisch Overzicht

| Component | Bestand | Type |
|-----------|---------|------|
| Uitgebreide narratieve teksten & NPC dialoogkeuzes | `src/game/campaign.ts` | Uitbreiding |
| Nieuwe encounter types (timed, puzzle, ambush) | `src/game/campaign.ts` | Uitbreiding |
| Morale systeem & random events | `src/game/campaign.ts` | Nieuw |
| Chapter gear sets & mission-specific drops | `src/game/campaignRewards.ts` | Nieuw |
| Missie Briefing Screen + encounter animaties | `CampaignMissionView.tsx` | Redesign |
| Boss portraits + phase animaties + victory screens | `BossFightView.tsx` | Redesign |
| Star animatie + trophy display + streak UI | `CampaignView.tsx` | Uitbreiding |
| Reducer: morale, trophies, milestones, streaks | `GameContext.tsx` | Uitbreiding |
| Boss/district portrait mapping | `assets/items/index.ts` | Uitbreiding |

Alle wijzigingen zijn client-side. Geen database migraties nodig. State-uitbreidingen: `morale`, `campaignTrophies`, `encounterMilestone`, `missionStreak` in GameState.

