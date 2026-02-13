

# Solo Operaties 2.0 — Immersive Overhaul

## Probleem
De huidige solo operaties voelen vlak: je klikt "GO" op een kaart, krijgt 2-3 korte tekstblokken met keuzes, en bent klaar. Er is geen opbouw, geen voorbereiding, en weinig gevoel dat je de operatie echt uitvoert.

## Oplossing: Drie-Fasen Missie-Systeem

Elke solo operatie wordt opgedeeld in drie duidelijke fasen met eigen visuele identiteit:

```text
+------------------+     +------------------+     +------------------+
|  1. BRIEFING     | --> |  2. UITVOERING   | --> |  3. RESULTAAT    |
|  Plan je aanpak  |     |  3-4 encounters  |     |  Debriefing      |
|  Kies voorberei- |     |  met fase-labels |     |  met statistieken|
|  ding & strategie|     |  en sfeer-visuals|     |                  |
+------------------+     +------------------+     +------------------+
```

### Fase 1: Missie Briefing (NIEUW)
In plaats van direct "GO" te klikken, opent er een fullscreen briefing scherm:

- **Operatie-specifieke achtergrond** (bestaande SOLO_OP_IMAGES)
- **Doelwit-info**: Wie/wat is het doelwit, waar, wanneer
- **Risico-analyse**: Visuele meter met risico, verwachte heat, verwachte beloning
- **Voorbereidingskeuze** (1 uit 3): De speler kiest een aanpak die de hele missie beinvloedt:
  - **Voorzichtig** (minder heat, lagere beloningen, difficulty -5)
  - **Standaard** (normaal)
  - **Agressief** (meer heat, hogere beloningen, difficulty +5)
- **"START OPERATIE" knop** met dramatische animatie

### Fase 2: Verbeterde Encounter Flow
- **Fase-labels** per encounter: "VERKENNING", "UITVOERING", "ONTSNAPPING" — zodat de speler voelt dat het verhaal vordert
- **3-4 encounters** in plaats van 2-3 (meer verhaal)
- **Operatie-specifieke achtergrondafbeelding** per encounter (hergebruik SOLO_OP_IMAGES i.p.v. de generieke encounter-bg)
- **Sfeer-intro per encounter**: Een korte atmosferische zin boven de encounter-tekst (bijv. "De regen tikt op het asfalt. Je adem vormt wolkjes in de koude lucht.")
- **Keuze-feedback**: Na elke keuze een korte visuele flash (groen/goud/rood) met het resultaat, voordat de volgende encounter laadt

### Fase 3: Verbeterd Resultaatscherm
- **Operatie-specifieke achtergrond** (niet een leeg zwart scherm)
- **Tijdlijn-weergave** van alle gemaakte keuzes met resultaten
- **XP en skill-progress bar** visueel geanimeerd

---

## Technische Details

### 1. Types uitbreiden (`src/game/types.ts`)
- `MissionApproach` type toevoegen: `'cautious' | 'standard' | 'aggressive'`
- `ActiveMission` uitbreiden met:
  - `approach?: MissionApproach` — gekozen aanpak
  - `phaseLabels?: string[]` — fase-labels per encounter
- `MissionEncounter` uitbreiden met:
  - `phase?: string` — fase-label (bijv. "VERKENNING")
  - `atmosphere?: string` — sfeer-intro tekst

### 2. Encounter database uitbreiden (`src/game/missions.ts`)
- **Fase-labels** toevoegen aan elke encounter (phase property)
- **Sfeer-intro's** toevoegen aan elke encounter (atmosphere property)
- `generateMissionEncounters` aanpassen: nu 3-4 encounters i.p.v. 2-3
- Approach-modifier toepassen in `resolveMissionChoice`:
  - cautious: difficulty -5, heat x0.7, reward x0.8
  - aggressive: difficulty +5, heat x1.3, reward x1.3

### 3. Briefing data toevoegen (`src/game/constants.ts`)
- `SOLO_OPERATIONS` uitbreiden met een `briefing` object per operatie:
  - `targetDesc`: Beschrijving van het doelwit
  - `locationDesc`: Beschrijving van de locatie
  - `intel`: Extra informatie / tips

### 4. Nieuw component: `MissionBriefing.tsx`
- Fullscreen overlay met operatie-achtergrond
- Doelwit-info, risico-meters, beloning-range
- Drie aanpak-knoppen (Voorzichtig / Standaard / Agressief)
- "START OPERATIE" knop die de missie start met gekozen approach

### 5. OperationsView aanpassen (`src/components/game/OperationsView.tsx`)
- "GO" knop opent nu de MissionBriefing i.p.v. direct de missie te starten
- Nieuwe state: `briefingOp` om bij te houden welke operatie gebriefed wordt

### 6. MissionEncounterView verbeteren (`src/components/game/MissionEncounterView.tsx`)
- Fase-label tonen boven de encounter ("FASE 1: VERKENNING")
- Sfeer-intro tekst tonen boven de encounter-tekst (cursief, atmospheric)
- Operatie-specifieke achtergrond laden via SOLO_OP_IMAGES
- Visuele feedback-flash na keuze (success/partial/fail kleuren)
- Progress bar tonen die de 3 fasen visualiseert

### 7. MissionResult verbeteren (in MissionEncounterView)
- Operatie-achtergrond toevoegen
- Tijdlijn-weergave van keuzes met fase-labels en resultaat-iconen
- XP-progress bar animatie

### Samenvatting van wijzigingen
| Bestand | Wat |
|---|---|
| `src/game/types.ts` | MissionApproach type, encounter phase/atmosphere fields |
| `src/game/constants.ts` | Briefing data per solo operatie |
| `src/game/missions.ts` | Phase labels, atmosphere teksten, 3-4 encounters, approach modifiers |
| `src/components/game/MissionBriefing.tsx` | Nieuw: fullscreen briefing scherm |
| `src/components/game/OperationsView.tsx` | GO opent briefing i.p.v. directe start |
| `src/components/game/MissionEncounterView.tsx` | Fase-labels, sfeer-intro, op-specifieke achtergrond, feedback-flash, verbeterd resultaat |

