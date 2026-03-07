

# Campagne Verbeterplan

## Huidige Situatie

De campagne heeft 8 chapters, 27 missies en 8 bosses met een solide basis. De zwakke punten zijn:

1. **Missies zijn monotoon** — elke missie is "klik Volgende Encounter" herhaaldelijk. Geen tactische keuzes, geen variatie.
2. **Bossfights missen diepgang** — slechts 3 knoppen (Aanval/Zwaar/Verdedig) zonder strategie-laag.
3. **Geen visuele flair** — alles is tekst in een log. Geen animaties, geen spanning.
4. **Geen herhaalbaarheid** — missies klaar = klaar. Geen reden om terug te komen.
5. **Missie-encounters zijn puur RNG** — speler heeft nul invloed op de uitkomst.

## Voorgestelde Verbeteringen

### 1. Tactische Missie-Keuzes
Vervang de "klik volgende" encounters door keuze-momenten per encounter:
- **3 aanpakken per encounter**: Stealth (laag risico, minder loot), Standaard, Agressief (hoog risico, meer loot + heat)
- Elke keuze beïnvloedt slagingskans, beloningen en verhaaltext
- Visuele encounter-kaarten met sfeer-iconen in plaats van een platte log

### 2. Verbeterde Boss UI
- **Actie-cooldowns**: Zware aanval heeft 2-beurt cooldown, Verdedig geeft 1-beurt buff
- **Nieuwe actie: Ontwijken** — kans om boss special volledig te ontwijken
- **Boss rage meter** — visuele indicator die oploopt; bij vol doet de boss een super-aanval
- **Fase-transities met animatie** — screen shake + flash bij nieuwe fase + boss dialogue popup

### 3. Missie Rating Systeem
- Na voltooiing: rating van ⭐ tot ⭐⭐⭐ (gebaseerd op keuzes, snelheid, HP-behoud)
- Hogere rating = betere loot drops
- 3 sterren op alle missies in een chapter = bonus beloning

### 4. Chapter Replay met Hogere Moeilijkheid  
- Na voltooiing kun je een chapter herspelen op Hard of Nightmare
- Hogere moeilijkheid = sterkere vijanden, betere loot, unieke dialoog
- Difficulty-selector zichtbaar op voltooide chapters

### 5. Encounter Variatie
Voeg encounter-types toe naast "combat":
- **Trap**: kies ontwijken of forceren (stat-check)
- **NPC-ontmoeting**: dialoogkeuze die loot of informatie geeft
- **Verkenning**: vind verborgen items of shortcuts

## Technische Aanpak

### Bestanden die wijzigen:
- **`src/game/campaign.ts`**: encounter-types toevoegen aan missie-definitie, rating-berekening, cooldown-systeem voor boss
- **`src/components/game/campaign/CampaignMissionView.tsx`**: volledige redesign met keuze-knoppen per encounter, encounter-type kaarten, rating-display
- **`src/components/game/campaign/BossFightView.tsx`**: cooldown-indicators, ontwijken-knop, rage meter, fase-animaties
- **`src/components/game/campaign/CampaignView.tsx`**: sterren-display per missie, difficulty-selector voor herspelen, chapter-bonus indicator
- **`src/contexts/GameContext.tsx`**: nieuwe dispatch types voor encounter-keuzes en cooldowns

### Nieuwe types:
```text
EncounterType: 'combat' | 'trap' | 'npc' | 'exploration'
EncounterChoice: 'stealth' | 'standard' | 'aggressive'  
MissionRating: 1 | 2 | 3
BossActionCooldown: { heavy: number, dodge: number }
```

## Prioriteit

Ik raad aan om dit in twee fasen te doen:
- **Fase 1**: Tactische missie-keuzes + rating systeem + encounter variatie (grootste impact op gameplay)
- **Fase 2**: Boss UI verbeteringen + chapter replay

Wil je dat ik alles in één keer implementeer of fase per fase?

