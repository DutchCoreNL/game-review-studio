

# Gevechtsysteem Verbetering: Verhalende District-Gevechten

## Overzicht

Het huidige gevecht bestaat uit 4 generieke knoppen (Aanval, Zware Klap, Verdedig, Omgeving) met korte logberichten. De verbetering maakt elk gevecht tot een mini-verhaal met district-specifieke keuzes, narratieve beschrijvingen en tactische opties die passen bij de locatie.

## Wat verandert er voor de speler?

- **Elke beurt toont een korte verhaaltekst** die beschrijft wat er in het gevecht gebeurt, passend bij het district (bijv. "Je duikt weg achter een roestige container terwijl kogels over de havenkade fluiten...")
- **Acties hebben narratieve labels per district** in plaats van generieke "AANVAL" / "VERDEDIG" (bijv. in Port Nero: "Schieten vanuit dekking" / "Verschuil achter containers")
- **Een 5e tactische actie** verschijnt context-afhankelijk (bijv. in Neon Strip: "Lichten uitschakelen" voor een bonus stun)
- **Gevechtslog wordt een verhaallijn** met sfeervolle beschrijvingen per district

## Technisch Plan

### 1. Uitbreiding `COMBAT_ENVIRONMENTS` in `src/game/constants.ts`

De huidige structuur per district krijgt rijkere data:

```typescript
export const COMBAT_ENVIRONMENTS = {
  port: {
    name: "Havenkade",
    scenePhrases: [
      "De zilte wind blaast over de verlaten kade. Containers torenen als stalen muren om je heen.",
      "Een scheepshoorn loeIt in de verte terwijl je vijand achter een vorkheftruck duikt.",
      "Olie glanst op het natte beton. De geur van diesel en gevaar hangt in de lucht.",
    ],
    actions: {
      attack: { label: "VUUR VANUIT DEKKING", desc: "Schiet vanachter een container", logs: [...] },
      heavy: { label: "KRAAN LATEN VALLEN", desc: "Riskant maar verwoestend", logs: [...] },
      defend: { label: "DEKKING ACHTER CONTAINERS", desc: "Gebruik de havenkade als schild", logs: [...] },
      environment: { label: "HAAKKABEL SLINGEREN", desc: "Stun met havenwerktuigen", logs: [...] },
      tactical: { label: "VLUCHTHAVEN", desc: "Spring in het water voor reset", stat: "brains", logs: [...] },
    },
    enemyAttackLogs: [
      "{name} schiet vanuit een containerdeur!",
      "{name} gooit een brandbom over de kade!",
    ],
  },
  // crown, iron, low, neon...
};
```

### 2. Update `CombatView.tsx`

- Toon een **scene-beschrijving** bovenaan het gevecht die wisselt per beurt (uit `scenePhrases`)
- Vervang generieke knoplabels door district-specifieke labels uit de nieuwe data
- Voeg een **5e tactische knop** toe die per district uniek is (bijv. stat-check met bonus effect)
- Combat log entries gebruiken de narratieve logs in plaats van droge "X schade" berichten
- Typewriter-effect op de scene-beschrijving voor immersie

### 3. Update `combatAction()` in `src/game/engine.ts`

- Nieuwe actie `'tactical'` toevoegen aan de switch-case
- Log-berichten selecteren uit de district-specifieke arrays
- Tactical actie: stat-check met uniek effect per district (extra schade, heal, stun, heat-reductie)
- Vijand-aanval logs ook narratief per district

### 4. Type-update in `src/game/types.ts`

- Combat action type uitbreiden: `'attack' | 'heavy' | 'defend' | 'environment' | 'tactical'`

## Bestanden die worden aangepast

| Bestand | Wijziging |
|---|---|
| `src/game/constants.ts` | `COMBAT_ENVIRONMENTS` volledig herschreven met narratieve data per district (5 districts x ~25 tekstregels) |
| `src/game/types.ts` | Combat action type uitbreiden met `'tactical'` |
| `src/game/engine.ts` | `combatAction()` updaten: narratieve logs, tactical actie, vijand-logs per district |
| `src/components/game/CombatView.tsx` | Scene-beschrijving tonen, district-specifieke knoplabels, 5e tactical knop, typewriter-effect |

## District-specifieke sfeer (voorbeelden)

| District | Sfeer | Tactical Actie | Stat |
|---|---|---|---|
| Port Nero | Containers, kranen, olievlekken, scheepshoorns | "Vluchthaven" - spring in het water | Brains |
| Crown Heights | Penthouse, beveiligingssystemen, glazen wanden | "Alarm Triggeren" - vijand raakt in paniek | Brains |
| Iron Borough | Fabriekshallen, gesmolten metaal, zware machines | "Oven Openen" - brand-AOE schade | Muscle |
| Lowrise | Steegjes, graffiti, brandtrappen, ratten | "Vlucht via Daken" - ontsnap + heal | Charm |
| Neon Strip | Neonlicht, speakers, menigte, flitsende borden | "Blackout" - lichten uit voor bonus stun | Brains |

