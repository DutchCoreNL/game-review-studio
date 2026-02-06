

# Missies Verhaal-Gedreven Maken met Keuzes

## Wat er nu is

Het huidige missiesysteem werkt puur mechanisch: je klikt "GO" bij een solo-operatie of wijst een crewlid toe aan een contract, en je krijgt een enkel berichtje terug ("geslaagd" of "mislukt"). Er is geen verhaal, geen spanning, en geen keuzemomenten. De speler voelt niet wat er tijdens de missie gebeurt.

## Wat er verandert

Missies worden omgebouwd naar een **meerstaps verhaalervaring**. Na het starten van een missie verschijnt een reeks **situatieschermen** met beschrijvende tekst, sfeervolle details gebaseerd op het district waar je bent, en **keuzes die de uitkomst beinvloeden**. Dit geldt voor zowel Solo Operaties als Contracten.

---

### 1. Missie-Encounter Systeem

Elke missie krijgt een reeks van **2-3 encounters** (situaties) voordat de uitkomst bepaald wordt. Elke encounter toont:

- Een verhalende beschrijving (aangepast aan district + missietype)
- 2-3 keuzes voor de speler
- Elke keuze test een andere stat (muscle, brains, charm) en beinvloedt het resultaat

**Voorbeeld: "Auto Diefstal" in Port Nero**

```text
Encounter 1:
"De zwarte BMW staat geparkeerd bij Dok 7. Een bewaker loopt 
zijn ronde. Het regent. Je hebt drie opties..."

[FORCEER HET SLOT] (Muscle) - Direct maar luidruchtig
[HACK DE SLEUTEL] (Brains) - Stil maar complex  
[LEID AF] (Charm) - Stuur de bewaker weg

Encounter 2 (gebaseerd op keuze 1):
"Je bent binnen, maar het alarmsysteem springt aan..."

[SCHEUR WEG] - Snelle ontsnapping, meer heat
[SCHAKEL UIT] - Brains check, minder heat
[BEL BACKUP] - Crew nodig, veiligste optie
```

### 2. District-Specifieke Verhaalvarianten

Elk district geeft andere sfeer en situaties aan dezelfde missie. De verhaalteksten en beschikbare keuzes veranderen per locatie:

| District | Sfeer | Invloed |
|----------|-------|---------|
| **Port Nero** | Donker, industrieel, containers | Meer ambush/stealth opties |
| **Crown Heights** | Luxe, technologie, penthouse | Meer hack/social engineering |
| **Iron Borough** | Rauw, brute kracht, fabrieken | Meer muscle/intimidatie opties |
| **Lowrise** | Straatleven, chaos, snel | Meer vlucht/dirty trick opties |
| **Neon Strip** | Nachtleven, afleidingen | Meer charm/misleiding opties |

### 3. Keuze-Consequenties

Elke keuze heeft gevolgen die verder gaan dan slagen/falen:

- **Perfecte match** (stat hoog genoeg): Bonus beloning, minder heat, verhaalsucces
- **Gedeeltelijk succes**: Missie slaagt maar met kosten (crew schade, extra heat)
- **Mislukking**: Negatieve gevolgen maar met een uitweg (vlucht-keuze)

Sommige keuzes beinvloeden ook:
- Factie-relaties (kies je de gewelddadige of diplomatieke route)
- Heat (stille aanpak vs. harde aanpak)
- Crew gezondheid (bescherm je je crew of neem je risico)

### 4. Visuele Presentatie

De encounter wordt getoond als een **full-screen overlay** met:
- Sfeervolle titel met district-icoon
- Verhalende tekst in een leesbaar formaat
- Keuze-knoppen met stat-indicatie en risico-niveau
- Korte animatie bij keuze (fade/slide)
- Resultaatscherm na de laatste encounter met samenvatting

### 5. Contract-Encounters

Contracten krijgen ook encounters, maar korter (1-2 stappen). Het toegewezen crewlid wordt in het verhaal genoemd:

```text
"Vinny (Enforcer) arriveert bij het magazijn voor de 
wapenlevering. Er staan twee onbekende auto's..."

[VINNY GAAT NAAR BINNEN] - Risicovol maar snel
[VERKEN EERST] - Veiliger, Vinny's HP wordt gespaard
[TREK TERUG] - Annuleer missie, geen beloning
```

---

## Technisch Overzicht

### Nieuwe types

```text
MissionEncounter:
  id: string
  text: string                    -- Verhaaltekst
  districtVariants: Record<DistrictId, string>  -- Alternatieve tekst per district
  choices: MissionChoice[]

MissionChoice:
  id: string
  label: string                   -- Knoptekst (bijv. "FORCEER HET SLOT")
  stat: StatId                    -- Welke stat wordt getest
  difficulty: number              -- Hoe moeilijk (0-100)
  outcomes: { success: string; partial: string; fail: string }
  effects: { heat: number; relChange: number; crewDamage: number; bonusReward: number }

ActiveMission:
  type: 'solo' | 'contract'
  missionId: string
  contractId?: number
  crewIndex?: number
  currentEncounter: number
  encounters: MissionEncounter[]
  totalReward: number
  totalHeat: number
  log: string[]                   -- Verhaallijn opbouwen
```

### Aangepaste bestanden

| Bestand | Wijziging |
|---------|-----------|
| `src/game/types.ts` | Nieuwe types: `MissionEncounter`, `MissionChoice`, `ActiveMission` |
| `src/game/constants.ts` | Encounter-definities per missietype en district (MISSION_ENCOUNTERS) |
| `src/game/engine.ts` | `generateMissionEncounters()` - bouwt encounters op basis van missie + district; `resolveMissionChoice()` - verwerkt een keuze en berekent uitkomst |
| `src/contexts/GameContext.tsx` | Nieuwe actions: `START_MISSION`, `MISSION_CHOICE`, `END_MISSION` |
| `src/components/game/MissionEncounterView.tsx` | Nieuw component: full-screen verhaalscherm met keuzes |
| `src/components/game/OperationsView.tsx` | Aangepast: missies starten nu via het encounter-systeem in plaats van directe uitvoering |
| `src/components/game/GameLayout.tsx` | ActiveMission overlay toevoegen |

### Encounter-database structuur

De encounters worden gedefinieerd per **missietype** met **district-varianten**:

```text
MISSION_ENCOUNTERS = {
  // Solo ops
  pickpocket: [encounter1, encounter2],
  car_theft: [encounter1, encounter2, encounter3],
  store_robbery: [encounter1, encounter2, encounter3],
  
  // Contract types
  delivery: [encounter1, encounter2],
  combat: [encounter1, encounter2],
  stealth: [encounter1, encounter2, encounter3],
  tech: [encounter1, encounter2],
}
```

Elke encounter bevat een basis-tekst plus `districtVariants` die de tekst aanpast wanneer de speler in een specifiek district zit. Als er geen variant is voor het huidige district, wordt de basistekst gebruikt.

### Engine functies

| Functie | Doel |
|---------|------|
| `generateMissionEncounters()` | Selecteert en past encounters aan voor missietype + district |
| `resolveMissionChoice()` | Berekent uitkomst van een keuze (stat check + moeilijkheid) |
| `completeMission()` | Verwerkt alle opgebouwde effecten na laatste encounter |

### Volgorde van implementatie

1. Types toevoegen (MissionEncounter, MissionChoice, ActiveMission)
2. Encounter-database definieren in constants (alle missietypes x districten)
3. Engine functies schrijven (genereren, keuze verwerken, afronden)
4. GameContext updaten met START_MISSION, MISSION_CHOICE, END_MISSION
5. MissionEncounterView component bouwen (verhaalscherm met keuzes)
6. OperationsView aanpassen (missies starten encounter flow)
7. GameLayout aanpassen (overlay voor actieve missie)

