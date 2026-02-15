# Drug Imperium -- Endgame Productiesysteem

## Overzicht

Het Drug Imperium breidt de bestaande villa-productie (Wietplantage, Coke Lab, Synthetica Lab) uit naar een volwaardig endgame-systeem met **kwaliteitsniveaus**, **lab-upgrades**, **een distributienetwerk** en **risico-events**. Het systeem wordt ontgrendeld wanneer de speler minimaal 2 productiemodulen bezit en Villa Level 2+ heeft.

---

## Nieuwe Mechanica

### 1. Kwaliteitsniveaus (Drug Tiers)

Elke productiemodulen produceert nu in drie kwaliteitstiers:


| Tier | Label   | Prijsmultiplier | Heat-multiplier | Unlock     |
| ---- | ------- | --------------- | --------------- | ---------- |
| 1    | Straat  | 1.0x            | 1.0x            | Standaard  |
| 2    | Premium | 1.8x            | 1.5x            | Lab Tier 2 |
| 3    | Puur    | 3.0x            | 2.5x            | Lab Tier 3 |


- Hogere kwaliteit = meer winst, maar ook meer Heat per batch
- Kwaliteit is instelbaar per lab (speler kiest welk tier ze produceren)

### 2. Lab Upgrade Tiers (3 niveaus)

Elk productielab (Wietplantage, Coke Lab, Synthetica Lab) krijgt 3 upgrade-tiers:


| Tier | Kosten             | Effect                                                            |
| ---- | ------------------ | ----------------------------------------------------------------- |
| 1    | Basis (al gekocht) | Huidige productie                                                 |
| 2    | €75.000-€120.000   | +50% output, -20% chemicalien, unlock Premium                     |
| 3    | €200.000-€300.000  | +100% output, kwaliteitsbonussen, unlock Puur + NoxCrystal recept |


### 3. Distributienetwerk

Wijs crewleden aan als **dealers** in specifieke districten:

- Elke dealer genereert passief inkomen per nacht op basis van: product kwaliteit x district vraag x dealer-level
- Max 1 dealer per district, max 5 totaal
- Dealers bouwen "marktaandeel" op (0-100%) over tijd
- Hoger marktaandeel = meer inkomen, maar ook meer Heat en risico op rivaal-aanvallen
- Dealers kunnen worden aangevallen door facties (verliezen marktaandeel)

### 4. NoxCrystal (Endgame Product)

- Vereist: alle 3 labs op Tier 3 + speciale precursors
- Productie: 1-2 per nacht, verkoopwaarde €8.000-€12.000 per stuk
- Genereert +15 Heat per batch
- Kan alleen verkocht worden aan specifieke contacten (niet op de reguliere markt)

### 5. Risico-Events (Nachtelijke Checks)


| Event           | Trigger                          | Effect                                                       |
| --------------- | -------------------------------- | ------------------------------------------------------------ |
| Lab Raid        | Heat > 60 + productie actief     | Lab offline 2 dagen, verlies voorraad                        |
| Besmette Batch  | 10% kans per nacht               | Karma -5, Rep -10, klanten ziek                              |
| Rivaal Sabotage | Marktaandeel > 60% in district   | Dealer gewond, marktaandeel -20%                             |
| DEA Onderzoek   | NoxCrystal productie + Heat > 40 | 3-daags onderzoek: alle productie stopt, arrestatiekans +15% |
| Grote Oogst     | 5% kans bij Tier 3               | Dubbele productie deze nacht                                 |


---

## Technische Details

### Nieuwe Bestanden


| Bestand                                         | Doel                                                                                            |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `src/game/drugEmpire.ts`                        | Alle constanten, types, productie-logica, dealer-berekeningen en risico-event checks            |
| `src/components/game/villa/DrugEmpirePanel.tsx` | UI-paneel binnen VillaView: lab upgrades, kwaliteitskeuze, dealer-toewijzing, NoxCrystal status |


### Gewijzigde Bestanden


| Bestand                                   | Wijziging                                                                                                                                           |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/game/types.ts`                       | Nieuwe types: `DrugTier`, `LabUpgradeState`, `DealerAssignment`, `DrugEmpireState` toevoegen aan `GameState`                                        |
| `src/game/villa.ts`                       | `processVillaProduction()` uitbreiden met tier-logica, dealer-inkomsten en NoxCrystal productie                                                     |
| `src/contexts/GameContext.tsx`            | Nieuwe reducer-acties: `UPGRADE_LAB`, `SET_DRUG_TIER`, `ASSIGN_DEALER`, `RECALL_DEALER`, `SELL_NOXCRYSTAL`. Migratie-logica voor `drugEmpire` state |
| `src/components/game/villa/VillaView.tsx` | Nieuwe "Drug Imperium" tab toevoegen naast bestaande tabs (overview, production, storage, modules)                                                  |
| `src/game/constants.ts`                   | NoxCrystal toevoegen als speciaal goed (niet in GOODS array, aparte constante)                                                                      |
| `src/components/game/NightReport.tsx`     | Drug Empire resultaten tonen: dealer-inkomsten, risico-events, NoxCrystal productie                                                                 |


### State Uitbreiding

```text
GameState + {
  drugEmpire: {
    labTiers: {
      wietplantage: 1 | 2 | 3;
      coke_lab: 1 | 2 | 3;
      synthetica_lab: 1 | 2 | 3;
    };
    selectedQuality: {
      wietplantage: 1 | 2 | 3;
      coke_lab: 1 | 2 | 3;
      synthetica_lab: 1 | 2 | 3;
    };
    dealers: {
      district: DistrictId;
      crewName: string;
      marketShare: number; // 0-100
      daysActive: number;
      product: GoodId;
    }[];
    noxCrystalStock: number;
    noxCrystalProduced: number; // lifetime total
    labOffline: {
      wietplantage: number; // days remaining offline
      coke_lab: number;
      synthetica_lab: number;
    };
    deaInvestigation: number; // days remaining, 0 = inactive
  } | null;
}
```

### Productie Flow (Nachtelijk)

1. Check of labs online zijn (niet offline door raid)
2. Per actief lab: bereken output op basis van tier + kwaliteit
3. Vermenigvuldig met prestige-bonussen (bestaand systeem)
4. Genereer Heat op basis van kwaliteit-tier
5. Check NoxCrystal productie (alle labs Tier 3 + chemicalien > 10)
6. Bereken dealer-inkomsten per district
7. Roll risico-events (raid, besmetting, sabotage, DEA)
8. Rapporteer alles in NightReport

### Unlock Vereisten

- Drug Imperium tab verschijnt zodra de speler 1+ productiemodule bezit
- Lab Tier 2: Villa Level 2 + €75k-€120k
- Lab Tier 3: Villa Level 3 + €200k-€300k + alle districten bezit
- NoxCrystal: alle 3 labs Tier 3
- Dealers: minimaal 1 crewlid beschikbaar + district bezit

### Dealer Inkomsten Formule

```text
dagelijks_inkomen = basis_prijs x kwaliteit_multiplier x district_vraag x (marktaandeel / 100) x (1 + dealer_level * 0.1)
```

Waar `district_vraag` de bestaande `mods` uit DISTRICTS gebruikt.