

# Facties Uitbreiden met Interactiemogelijkheden

## Huidige Situatie

Op dit moment zijn facties passief: je ziet alleen een relatiebalk en kunt politie omkopen. Interactie met facties gebeurt indirect via contracten (die relatie aanpassen) en het gevechtsysteem (leider uitdagen). Er zijn geen directe actieknoppen op de factie-kaarten zelf.

## Wat wordt toegevoegd

Elke factie krijgt een **interactiemenu** met 6 mogelijke acties. Je moet in het thuisdistrict van de factie zijn om sommige acties uit te voeren. Elke actie heeft kosten, risico's en gevolgen voor relatie, heat en reputatie.

### Factie-Acties

| Actie | Effect | Vereiste |
|-------|--------|----------|
| **Onderhandelen** | +8 tot +15 relatie, kost geld (gebaseerd op charm) | In thuisdistrict, relatie > -50 |
| **Omkopen** | +20 relatie, kost veel geld | Altijd beschikbaar |
| **Intimideren** | -15 relatie, +rep, +heat, kans op geld | In thuisdistrict, muscle check |
| **Saboteren** | -25 relatie, beschadigt hun operaties, +heat | In thuisdistrict, brains check |
| **Gift Sturen** | +10 relatie, kost handelswaar uit inventory | Specifiek goed nodig per factie |
| **Informatie Kopen** | Onthult handelsroutes en marktinfo, kost geld | Relatie > 20 |

### Factie-Specifieke Beloningen bij Hoge Relatie

Naast de bestaande korting op goederen (>50 relatie), worden er nieuwe voordelen toegevoegd per relatieniveau:

- **Relatie 30+**: Factie biedt bescherming (minder random negatieve events)
- **Relatie 60+**: Exclusieve gear wordt ontgrendeld (al bestaand) + speciale contracten
- **Relatie 80+**: Passief inkomen van de factie (een soort "beschermingsgeld" dat zij aan jou betalen)

### Cooldown Systeem

Om spam te voorkomen krijgt elke actie een cooldown per factie. Je kunt maximaal 1 actie per factie per dag uitvoeren (reset bij dag afsluiten).

### Factie-Oorlog Mechanisme

Als relatie onder -50 zakt, kan de factie actief jouw operaties aanvallen. Dit uit zich als:
- Hogere kans op negatieve random events
- Crew kan worden aangevallen (HP verlies)
- Kans dat ze goederen stelen

---

## Visueel Ontwerp

De huidige FamiliesPanel wordt volledig vernieuwd:

- Elke factie wordt een **uitklapbare kaart** met de contactpersoon, relatie-info en actiemenu
- Relatiebalk krijgt kleurschakeringen: rood (vijand), oranje (neutraal), groen (bondgenoot), goud (alliantie)
- Acties worden getoond als een grid van knoppen met iconen
- Cooldown wordt visueel aangegeven (gedimde knop met "Morgen" tekst)
- Factie-voordelen worden getoond als ontgrendelde badges

---

## Technisch Overzicht

### Aangepaste bestanden

| Bestand | Wijziging |
|---------|-----------|
| `src/game/types.ts` | Nieuw type `FactionAction`, uitbreiding `GameState` met `factionCooldowns` |
| `src/game/constants.ts` | `FACTION_ACTIONS` definitie, `FACTION_GIFTS` (welk goed per factie), `FACTION_REWARDS` per niveau |
| `src/game/engine.ts` | Nieuwe functies: `performFactionAction()`, `getFactionStatus()`, `getFactionPerks()`, factie-oorlog logica in `endTurn` |
| `src/contexts/GameContext.tsx` | Nieuwe action `FACTION_ACTION` met parameters (familyId, actionType) |
| `src/components/game/ImperiumView.tsx` | Volledige herstructurering van FamiliesPanel met uitklapbare factiekaarten en actiemenu |

### State uitbreiding

```text
GameState uitbreiding:
  factionCooldowns: Record<FamilyId, string[]>  // lijst van acties die vandaag al uitgevoerd zijn
```

### Nieuwe constanten

```text
FACTION_ACTIONS: definitie van alle 6 acties met kosten, effecten, vereisten
FACTION_GIFTS: welk handelsitem elke factie als gift accepteert
  - Cartel: drugs (Synthetica)
  - Syndicate: tech (Zwarte Data)
  - Bikers: weapons (Zware Wapens)
FACTION_REWARDS: voordelen per relatieniveau (30, 60, 80)
```

### Nieuwe engine functies

| Functie | Doel |
|---------|------|
| `performFactionAction()` | Voert een factie-actie uit, past relatie/geld/heat aan |
| `getFactionStatus()` | Geeft een label terug: "Vijand", "Neutraal", "Bondgenoot", "Alliantie" |
| `getFactionPerks()` | Lijst van actieve voordelen op basis van relatie |
| `applyFactionWar()` | Factie-oorlog effecten (aangeroepen in endTurn als relatie < -50) |

### Volgorde van implementatie

1. Types en state uitbreiden (factionCooldowns, FactionAction)
2. Constants toevoegen (FACTION_ACTIONS, FACTION_GIFTS, FACTION_REWARDS)
3. Engine functies schrijven (performFactionAction, getFactionStatus, factie-oorlog in endTurn)
4. GameContext updaten met FACTION_ACTION reducer case
5. FamiliesPanel volledig vernieuwen met interactieve factiekaarten

