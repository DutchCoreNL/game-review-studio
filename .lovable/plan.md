

# Bounty Systeem & Aandelenmarkt

## Overzicht

Twee nieuwe systemen die de gameplay verdiepen: een **Bounty Systeem** (premiejacht) waar NPC's en de Nemesis premies op je hoofd zetten en jij premies kunt plaatsen, en een **Aandelenmarkt** waar je kunt investeren in bedrijven met dynamische koersen.

---

## 1. Bounty Systeem (Premiejacht)

### Hoe het werkt

- **Premies OP de speler**: Bij hoge heat (>60) of na bepaalde acties (district veroveren, factie aanvallen) plaatsen NPC-rivalen een premie op je hoofd. Dit leidt tot willekeurige aanvallen door premiejagers.
- **Premies DOOR de speler**: Speler kan premies plaatsen op NPC-doelen (rivaliserende luitenants, de Nemesis z'n bondgenoten). Kost geld, maar levert passief rep en territoriumvoordelen op wanneer de premiejager slaagt.
- **Premiejager-encounters**: Willekeurige pop-ups tijdens het spelen waar een premiejager je aanvalt. Speler kiest: vechten, vluchten, of omkopen.
- **Premie-bord**: Nieuw tabblad in het Operations-scherm met actieve premies.

### Nieuwe Types

- `BountyContract` - premie met doel, beloning, deadline, status
- `BountyEncounter` - encounter wanneer een jager je vindt
- `BountyTarget` - NPC-doelen waar speler premie op kan zetten

### Nieuwe State Velden

- `activeBounties: BountyContract[]` - premies op de speler
- `placedBounties: BountyContract[]` - premies door de speler
- `pendingBountyEncounter: BountyEncounter | null` - actieve encounter popup
- `bountyBoard: BountyTarget[]` - beschikbare doelen

### Nieuwe Reducer Actions

- `PLACE_BOUNTY` - premie plaatsen op NPC
- `RESOLVE_BOUNTY_ENCOUNTER` - keuze bij premiejager-aanval (fight/flee/bribe)
- `DISMISS_BOUNTY_ENCOUNTER` - popup sluiten
- `CANCEL_BOUNTY` - geplaatste premie annuleren

### Game Engine Integratie

- Tijdens `END_TURN`: kans op premiejager-encounter gebaseerd op totale premiegeld
- Nemesis plaatst automatisch premies na bepaalde triggers
- Geplaatste premies hebben kans op dagelijkse voltooiing
- Premies verlopen na deadline

### UI Componenten

- `BountyBoardPanel.tsx` - tabblad in OperationsView
- `BountyEncounterPopup.tsx` - encounter popup

---

## 2. Aandelenmarkt (Stock Market)

### Hoe het werkt

- **5 bedrijven** met thematische namen (Nero Shipping, Crown Pharma, Iron Steel, Neon Media, Shadow Tech)
- **Dynamische koersen**: dagelijkse prijsfluctuatie (+-2-8%) beinvloed door game-events (razzia's, karteloorlog, markt-events)
- **Kopen & verkopen**: aandelen kopen/verkopen via een beurs-interface
- **Insider trading**: corrupte contacten en NPC-relaties geven hints over aankomende koerswijzigingen
- **Crashes & booms**: willekeurige events die grote koersschommelingen veroorzaken
- **Dividend**: sommige aandelen betalen dagelijks dividend

### Nieuwe Types

- `StockId` - 5 aandelen IDs
- `StockDef` - definitie met naam, sector, volatiliteit, dividendpercentage
- `StockHolding` - bezit: aantal, gemiddelde aankoopprijs
- `StockEvent` - markt-event dat koersen beinvloedt
- `InsiderTip` - hint over aankomende koerswijziging

### Nieuwe State Velden

- `stockPrices: Record<StockId, number>` - huidige koersen
- `stockHistory: Record<StockId, number[]>` - 30-daagse koershistorie
- `stockHoldings: Record<StockId, StockHolding>` - speler bezit
- `pendingInsiderTip: InsiderTip | null` - actieve tip
- `stockEvents: StockEvent[]` - actieve markt-events

### Nieuwe Reducer Actions

- `BUY_STOCK` - aandelen kopen
- `SELL_STOCK` - aandelen verkopen
- `DISMISS_INSIDER_TIP` - tip sluiten

### Game Engine Integratie

- Tijdens `END_TURN`: koersen updaten, dividend uitkeren, events triggeren
- Markt-events (bestaande `MARKET_EVENTS`) beinvloeden ook aandelenkoersen
- Corrupte contacten met `intelBonus` geven insider tips
- Nemesis-acties beinvloeden gerelateerde aandelen

### UI Componenten

- `StockMarketPanel.tsx` - nieuw tabblad in TradeView
- Koersgrafiek hergebruikt `PriceHistoryChart` patroon
- Portfolio overzicht met winst/verlies berekening

---

## 3. Integratie in Bestaande Views

### TradeView - Nieuw tabblad "BEURS"

Toevoegen als 6e sub-tab naast MARKT, ANALYSE, VEILING, WITWAS, GEAR.

### OperationsView - Nieuw tabblad "PREMIES"

Bounty board als extra sectie in het operations-scherm.

### GameLayout

- `BountyEncounterPopup` toevoegen aan overlay-stack
- Bounty encounters triggeren `playPopupOpen` sound

### Night Report

- Dividend-inkomsten tonen
- Koerswijzigingen samenvatten
- Premiejager-activiteit rapporteren
- Geplaatste premie-resultaten tonen

---

## 4. Bestanden Overzicht

### Nieuwe bestanden
| Bestand | Doel |
|---|---|
| `src/game/bounties.ts` | Bounty-logica: genereren, encounters, resolutie |
| `src/game/stocks.ts` | Aandelenmarkt-logica: koersen, events, dividend |
| `src/components/game/bounty/BountyBoardPanel.tsx` | Bounty board UI |
| `src/components/game/bounty/BountyEncounterPopup.tsx` | Encounter popup |
| `src/components/game/trade/StockMarketPanel.tsx` | Aandelenmarkt UI |

### Bestaande bestanden die worden aangepast
| Bestand | Wijziging |
|---|---|
| `src/game/types.ts` | Nieuwe interfaces en state-velden |
| `src/game/constants.ts` | Stock definities, bounty templates, achievements |
| `src/contexts/GameContext.tsx` | Nieuwe actions, reducer cases, END_TURN integratie |
| `src/game/engine.ts` | Bounty/stock processing in END_TURN |
| `src/components/game/TradeView.tsx` | BEURS tab toevoegen |
| `src/components/game/OperationsView.tsx` | PREMIES sectie toevoegen |
| `src/components/game/GameLayout.tsx` | BountyEncounterPopup overlay |
| `src/assets/items/index.ts` | Nieuwe afbeeldingen registreren |

