

# Dynamische Beloningen voor Solo Operaties

## Probleem

Momenteel tonen solo-operaties altijd exact hetzelfde bedrag (bijv. "Zakkenrollen" is altijd +€300). Dit maakt het voorspelbaar en minder spannend. De beloningen moeten varieren op basis van dag, locatie en wat geluk.

## Oplossing

Elke keer dat je het operatiescherm opent, worden de beloningen dynamisch berekend met een **range** in plaats van een vast getal. Dit maakt het realistischer: soms is er meer te halen, soms minder.

### Wat de speler ziet

In plaats van een vast bedrag verschijnt er een **range** met variatie:

| Operatie | Oud | Nieuw (voorbeeld) |
|----------|-----|-------------------|
| Zakkenrollen | +€300 | €180 - €420 |
| ATM Skimming | +€1.200 | €840 - €1.800 |
| Auto Diefstal | +€2.500 | €1.750 - €4.000 |
| Juwelier Overval | +€5.000 | €3.500 - €8.500 |
| Crypto Heist | +€12.000 | €8.400 - €21.600 |

De exacte waarden varieren per dag en worden beinvloed door:

- **Dag-nummer**: Hogere beloningen naarmate het spel vordert (tot +80% op dag 50+)
- **District**: Handelen in een duurder district geeft een bonus (+10% Crown Heights, +5% Neon Strip)
- **Heat-risico**: Hoge heat (boven 50%) voegt een risico-premie toe (+15% beloning maar ook meer heat)
- **Willekeurige factor**: Een random spread van 70% tot 140% van het basisbedrag, zodat het elke dag anders is
- **Lowrise perk**: Als je Lowrise bezit, krijg je een extra korting op het risico (bestaande perk), maar ook +10% beloning daar

### Hoe het werkt (achter de schermen)

1. Het basisgetal uit `SOLO_OPERATIONS` (bijv. €300) wordt een minimum-referentie
2. Bij het renderen van de operatielijst wordt voor elke operatie een dynamisch bedrag berekend
3. De speler ziet een range (min - max) in de UI
4. Bij het starten van de missie wordt een exact bedrag gekozen binnen die range
5. De bestaande successRate-scaling (0.3x tot 1.3x) blijft behouden bovenop het dynamische basisbedrag

---

## Technische Details

### Bestand: `src/game/constants.ts`

De `SOLO_OPERATIONS` definitie verandert niet structureel. Het vaste `reward` veld blijft bestaan als **basis** waarop de dynamische berekening wordt gedaan.

### Nieuw: `src/game/operationRewards.ts`

Een kleine utility met de berekening:

```text
calculateOperationReward(op, state) -> { min, max, actual }

Formule:
  dayBonus = min(0.8, state.day * 0.015)        -- tot +80%
  districtMod = DISTRICT_MODS[state.loc]          -- 0% tot +10%
  heatPremium = state.heat > 50 ? 0.15 : 0       -- +15% bij hoge heat
  
  base = op.reward * (1 + dayBonus + districtMod + heatPremium)
  
  min = floor(base * 0.7)
  max = floor(base * 1.4)
  actual = random tussen min en max (bepaald bij missie start)
```

### Bestand: `src/components/game/OperationsView.tsx`

- Importeer de nieuwe utility
- In de render-loop van solo-operaties: bereken `{ min, max }` dynamisch
- Toon `€{min} - €{max}` in plaats van het vaste bedrag
- Bij het klikken op "GO": bereken `actual` en gebruik dat als `baseReward` in de `ActiveMission`
- Visuele toevoeging: een klein label dat aangeeft waarom de beloning hoger is (bijv. "HEAT PREMIE" of "DAG BONUS")

### Bestand: `src/game/missions.ts`

Geen wijzigingen nodig. De `completeMission` functie werkt al met `mission.baseReward` als startpunt en schaalt die op basis van succes. Het dynamische bedrag wordt gewoon doorgegeven als `baseReward`.

### Aangepaste bestanden samengevat

| Bestand | Wijziging |
|---------|-----------|
| `src/game/operationRewards.ts` | **NIEUW** - Utility voor dynamische beloningsberekening |
| `src/components/game/OperationsView.tsx` | Range weergeven, dynamisch bedrag bij missie start, bonus-labels |

