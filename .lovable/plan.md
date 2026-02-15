

# Rivaal Systeem Verbeteren

## Huidige Staat

Het rivaal-systeem heeft al een solide basis: 4 archetypes (Zakenman, Brute, Schaduw, Strateeg), 5 generaties, villa-aanvallen, diplomatieoptie, scouting, en factie-allianties. Maar vergeleken met games als Torn en Omerta mist het nog diepgang en variatie.

## Verbeteringen

### 1. Rivaal Taunts & Persoonlijkheid
Elke archetype krijgt een set unieke dreig-berichten, reacties op speler-acties, en overwinnings/verlies-quotes. Dit maakt elke rivaal memorabel in plaats van generiek.

- 4-6 unieke telefoonberichten per archetype
- Reacties op specifieke speleracties (district kopen, factie veroveren, gearresteerd worden)
- Overwinnings-quote wanneer de rivaal de speler verslaat

### 2. Rivaal Progression Abilities
Elke generatie ontgrendelt een nieuwe ability voor de rivaal, waardoor latere rivalen gevaarlijker en strategischer worden.

- **Gen 1**: Basis acties (markmanipulatie, diefstal)
- **Gen 2**: Factie-alliantie + crew-omkoping (kans dat een crewlid overloopt)
- **Gen 3**: Bounty op speler plaatsen (integratie met het bestaande bounty-systeem)
- **Gen 4**: Dubbele acties per dag + safehouse-sabotage
- **Gen 5**: "Ultieme rivaal" - alle abilities + versterkte stats

### 3. Rivaal Heat Map
Visuele indicator op de stadskaart die toont welke districten de rivaal beinvloedt, met een "invloedszone" die groeit naarmate de rivaal sterker wordt.

- Rode tint op beinvloede districten in de CityMap
- Tooltip met effecten (marktprijzen, rep-drain)

### 4. Confrontatie Keuzes
Na het verslaan van een rivaal krijgt de speler keuzes die invloed hebben op de opvolger:

- **Executeer**: +Rep, +Heat, snellere en boze opvolger
- **Verbanning**: Neutraal, normale opvolger
- **Rekruteer als Informant**: -Rep maar insider info over volgende generatie (archetype onthuld)

### 5. Rivaal Wraakacties
Wanneer de speler de rivaal verwondt maar niet doodt, reageert de rivaal met een gerichte wraakactie gebaseerd op archetype:

- Zakenman: Manipuleert alle marktprijzen voor 3 dagen
- Brute: Stuurt huurmoordenaars (extra combat encounter)
- Schaduw: Verdubbelt heat voor 2 dagen
- Strateeg: Draait alle factie-relaties -10

---

## Technische Details

### Gewijzigde bestanden

| Bestand | Wijziging |
|---|---|
| `src/game/types.ts` | `NemesisState` uitbreiden met `abilities`, `revengeActive`, `defeatChoice` |
| `src/game/constants.ts` | Taunt-arrays per archetype, ability-definities per generatie |
| `src/game/newFeatures.ts` | `updateNemesis()` uitbreiden met revenge-logica, generatie-abilities, en confrontatie-keuzes |
| `src/contexts/GameContext.tsx` | Nieuwe actions: `NEMESIS_DEFEAT_CHOICE`, revenge-processing in END_TURN |
| `src/components/game/map/NemesisInfo.tsx` | Abilities-weergave, revenge-indicator, uitgebreide info |
| `src/components/game/map/NemesisMarker.tsx` | Invloedszone-visualisatie op kaart |
| `src/components/game/CombatView.tsx` | Defeat-keuze popup na nemesis-gevecht |

### Nieuwe bestanden

| Bestand | Doel |
|---|---|
| `src/components/game/map/NemesisDefeatPopup.tsx` | Keuze-popup na het verslaan van een rivaal (executeer/verban/rekruteer) |

### State Uitbreidingen (types.ts)

```text
NemesisState + {
  abilities: string[];          // ontgrendelde abilities per generatie
  revengeActive: string | null; // actieve wraakactie type
  revengeDaysLeft: number;      // dagen wraak nog actief
  defeatChoice: 'execute' | 'exile' | 'recruit' | null;
  tauntsShown: string[];        // welke taunts al getoond (geen herhaling)
  woundedRevengeUsed: boolean;  // 1x revenge per gevecht
}
```

### Generatie Abilities (constants.ts)

```text
GEN_ABILITIES = {
  1: [],
  2: ['crew_bribe'],        // kan crewlid omkopen
  3: ['place_bounty'],      // plaatst bounty op speler
  4: ['double_action', 'safehouse_sabotage'],
  5: ['all_abilities', 'stat_boost']
}
```

