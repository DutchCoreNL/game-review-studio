

# Drug Empire Expansion — "El Padrino" System

## Overzicht

Een endgame drugsimperium dat de bestaande villa-productie uitbreidt tot een volwaardige supply chain: inkoop van grondstoffen, verwerking in labs, en distributie via een netwerk van dealers in je districten. Denk aan de opkomst van Tony Montana: je begint met een klein lab en eindigt met een continent-breed imperium.

## Vereisten om te unlocken

- Villa Level 3
- Minimaal 1 productiemodule (wietplantage, coke_lab, of synthetica_lab)
- Reputatie 400+
- Dag 30+

---

## Nieuwe Systemen

### 1. Supply Chain: Grondstoffen

Momenteel heeft het lab alleen `chemicals` als grondstof. We breiden dit uit:

| Grondstof | Prijs | Bron | Gebruikt door |
|-----------|-------|------|---------------|
| Chemicalien (bestaand) | via lab | Bestaand systeem | Synthetica Lab, Coke Lab |
| Coca Bladeren | €500/batch | Cartel-contact (port) | Coke Lab |
| Precursoren | €800/batch | Zwarte markt (neon) | Meth Lab (nieuw) |
| Zaden | €200/batch | Lowrise contact | Wietplantage (boost) |

Grondstoffen worden ingekocht via een nieuw "Supply" tabblad in de Villa productie-sectie. De Cartel-relatie geeft korting op coca bladeren.

### 2. Nieuwe Productiemodule: Meth Lab

| Module | Kosten | Villa Level | Output |
|--------|--------|-------------|--------|
| Meth Lab | €75.000 | 3 | 4-7 Synthetica/nacht uit precursoren |

Prestige upgrade: Output +80%, maar heat +50% hoger.

### 3. Distributie Netwerk

Het hart van het imperium. Voor elk district dat je bezit, kun je een **Dealer** aanstellen:

- **Dealer toewijzen**: Kies een goed (drugs, meds, of luxury) en een hoeveelheid per nacht
- **Automatische verkoop**: Dealers verkopen 's nachts tegen 70% van de marktprijs (passief inkomen)
- **Capaciteit**: 5/10/20 eenheden per nacht per dealer (upgradeable)
- **Risico**: Elke dealer genereert 2-5 heat/nacht. Bij heat > 60 is er 15% kans dat een dealer wordt opgepakt (verlies van voorraad + heat spike)
- **Max dealers**: Aantal owned districts (max 5)

### 4. Lab Upgrade Tiers

Bestaande labs krijgen upgrade-levels (Level 1-3) bovenop de prestige-laag:

| Lab | Lvl 1 (basis) | Lvl 2 (€40k) | Lvl 3 (€80k) |
|-----|---------------|---------------|---------------|
| Wietplantage | 5-10/nacht | 10-18/nacht | 18-30/nacht |
| Coke Lab | 3-5/nacht | 6-10/nacht | 10-16/nacht |
| Synthetica Lab | 15 batch | 25 batch | 40 batch |
| Meth Lab | 4-7/nacht | 8-12/nacht | 14-20/nacht |

### 5. Drugsimperium Dashboard

Een nieuw subtab "EMPIRE" binnen de Villa, of een apart panel in de Imperium-view, met:

- **Productie-overzicht**: Hoeveel elk lab produceert per nacht (grafiek)
- **Distributie-overzicht**: Welke dealers actief zijn, hun verkoop, en risico
- **Supply-status**: Hoeveel grondstoffen op voorraad
- **Imperium-waarde**: Totaal geschatte dagelijkse opbrengst
- **Heat-indicator**: Hoeveel heat het imperium per nacht genereert
- **"Imperium Score"**: Een rangschikking (Straatdealer, Wijkbaas, Drugsbaas, Kartelleider, Padrino) gebaseerd op dagelijkse productie-output

### 6. Evenementen & Risico's

Nieuwe nacht-events specifiek voor het drugsimperium:

- **DEA Inval**: Bij hoge heat, kans dat een lab wordt gesloten (1 nacht downtime + grondstof verlies)
- **Dealer Verraad**: Dealer steelt voorraad en verdwijnt (lage loyalty)
- **Turf War**: Rivaliserende dealer verschijnt in je district, verlaagt je verkoop
- **Bulk Order**: NPC wil grote hoeveelheid kopen tegen premium prijs (timed event)
- **Lab Explosie**: Kleine kans bij meth lab, verliest productie voor 2 nachten
- **Cartel Supply Drop**: Als Cartel-relatie > 80, gratis grondstoffen

---

## Technische Implementatie

### Nieuwe Types (types.ts)

```text
DrugSupplyId = 'coca_leaves' | 'precursors' | 'seeds'

interface DrugDealer {
  district: DistrictId
  good: GoodId
  capacity: number        // units per night
  capacityLevel: number   // 1-3
  active: boolean
  arrestedDays: number    // 0 = active
}

interface DrugEmpireState {
  unlocked: boolean
  supplies: Record<DrugSupplyId, number>
  dealers: DrugDealer[]
  labLevels: Partial<Record<VillaModuleId, number>>  // lab upgrade levels
  imperiumScore: number
  totalProduced: number
  totalDistributed: number
  totalDrugIncome: number
}
```

### Nieuwe Velden in GameState

- `drugEmpire: DrugEmpireState | null`

### Nieuw Bestand: `src/game/drugEmpire.ts`

Bevat:
- Supply-inkoop logica
- Dealer-management functies
- Lab upgrade definities en kosten
- Nachtelijke distributie-verwerking (`processDrugDistribution`)
- Empire score berekening
- Drug empire events (DEA, verraad, etc.)

### Nieuw Bestand: `src/components/game/villa/DrugEmpirePanel.tsx`

UI-component met subtabs:
- **Supply**: Grondstoffen inkopen
- **Labs**: Lab-upgrades bekijken/kopen
- **Dealers**: Dealers aanstellen/beheren per district
- **Overzicht**: Dashboard met productie- en verkoopstatistieken

### Aangepaste Bestanden

1. **`src/game/types.ts`**: Nieuwe types toevoegen, GameState uitbreiden
2. **`src/game/villa.ts`**: `processVillaProduction` aanpassen voor lab-levels
3. **`src/game/engine.ts`**: Nachtrapport uitbreiden met drug empire resultaten, `processDrugDistribution` aanroepen
4. **`src/contexts/GameContext.tsx`**: Nieuwe reducer actions (BUY_SUPPLY, ASSIGN_DEALER, REMOVE_DEALER, UPGRADE_LAB, UPGRADE_DEALER)
5. **`src/components/game/villa/VillaView.tsx`**: Nieuw "Empire" tab toevoegen als drugEmpire unlocked is
6. **`src/components/game/NightReport.tsx`**: Drug empire secties toevoegen (dealer-verkoop, supply-verbruik, events)

### NightReport Uitbreiding

Nieuwe velden in `NightReportData`:
- `drugDealerSales`: Array van dealer-verkopen per district
- `drugDealerArrested`: Naam van opgepakte dealer (indien van toepassing)
- `drugSupplyUsed`: Grondstoffen verbruikt
- `drugEmpireEvent`: Speciaal event (DEA, bulk order, etc.)
- `drugImperiumScore`: Huidige score/rang

### Balans

- Totale passieve drug-income op max level: circa €8.000-€15.000/nacht (vergelijkbaar met endgame businesses)
- Heat-generatie: 15-30/nacht bij volledig actief imperium (dwingt speler om heat-management te doen)
- Grondstoffen kosten: circa 30-40% van bruto-opbrengst (netto marge ~60%)
- DEA-inval kans: 5% per nacht bij heat > 50, 15% bij heat > 80
- Dit maakt het systeem winstgevend maar riskant, perfect voor endgame

