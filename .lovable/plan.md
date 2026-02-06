

# Handel Vernieuwen & Uitbreiden

Het huidige handelssysteem is functioneel maar vlak: alle goederen zien er hetzelfde uit, er is geen visueel onderscheid per categorie, en het systeem mist diepte. Dit plan vernieuwt de volledige Trade View met betere visuele hierarchie, nieuwe mechanica en meer strategische opties.

---

## Wat verandert

### 1. Visueel Vernieuwde Markt

**Goods met iconen en kleurcoding per factie**
Elk handelsitem krijgt een uniek icoon en kleuraccent gebaseerd op de bijbehorende factie:
- Synthetica (Cartel) -- rode accent, pipet-icoon
- Zware Wapens (Bikers) -- goud/oranje accent, schild-icoon
- Zwarte Data (Syndicate) -- blauwe accent, cpu-icoon
- Geroofde Kunst (onafhankelijk) -- paarse accent, diamant-icoon
- Medische Voorraad (onafhankelijk) -- groene accent, pil-icoon

**Prijsgrafiek per item**
Een mini sparkline per goed die laat zien of de prijs de laatste paar dagen gestegen of gedaald is. Dit geeft traders een visueel signaal voor timing.

**Verbeterde trade cards**
Grotere kaarten met duidelijke scheiding tussen prijs-info, voorraad en actie-knoppen. Winstmarge wordt visueel weergegeven met een kleur-indicator.

### 2. Drie sub-tabs in Handel

In plaats van 2 sub-tabs (Markt / Zwarte Markt) worden het er 3:

| Tab | Inhoud |
|-----|--------|
| **MARKT** | Koop/verkoop goederen (verbeterd) |
| **WITWASSEN** | Geld witwassen + dirty money overzicht + bedrijven die wassen |
| **ZWARTE MARKT** | Gear kopen (verbeterd met categorie-filters) |

### 3. Nieuwe Handelsmechanica

**Prijsgeschiedenis tracking**
De state slaat nu de laatste 5 dagen aan prijzen op per district per goed. Dit wordt getoond als een mini-trend in de UI en stelt spelers in staat om slimmer te handelen.

**District-specialisaties zichtbaar**
Per district wordt nu getoond welke goederen daar goedkoop of duur zijn (gebaseerd op de bestaande `mods` in DISTRICTS). Een visuele indicator (pijl omhoog/omlaag + kleur) laat zien of dit district goed is om te kopen of verkopen.

**Handelsroute suggesties**
Een kleine "tip" sectie onderaan de markt die de meest winstgevende route voorstelt: "Koop Synthetica in Lowrise (EUR 70) -> Verkoop in Crown Heights (EUR 252)" -- berekend op basis van huidige prijzen.

**Bulk trade feedback**
Bij het handelen van meerdere items wordt nu de totaalprijs en totale winst/verlies duidelijker getoond, met een samenvatting popup bij grote transacties.

### 4. Witwassen Uitbreiden

Het witwassen wordt een eigen sub-tab met meer diepte:
- Overzicht van zwart geld vs schoon geld (visueel)
- Lijst van actieve dekmantels met hun was-capaciteit
- Handmatige witwas-optie met instelbaar bedrag
- Progressiebalk die toont hoeveel capaciteit er nog over is vandaag
- Heat-waarschuwing bij te veel witwassen

### 5. Zwarte Markt Verbetering

- Categorie-filters: Wapens / Uitrusting / Gadgets
- Gear-items met visuele stat-balken in plaats van alleen tekst
- Vergelijking met huidig uitgeruste item ("+3 beter dan huidig")
- Locked items tonen met duidelijke unlock-voorwaarden
- Speciale "dagelijkse deal" -- een willekeurig item met korting

---

## Technisch Overzicht

### Aangepaste bestanden

| Bestand | Wijziging |
|---------|-----------|
| `src/game/types.ts` | Nieuw type `PriceHistory` toevoegen; `GameState` uitbreiden met `priceHistory` |
| `src/game/constants.ts` | Icoon en categorie-info toevoegen aan `GOODS`; nieuwe `GOOD_CATEGORIES` constant |
| `src/game/engine.ts` | Prijsgeschiedenis bijhouden in `generatePrices`; witwas-capaciteit logica; handelsroute calculator |
| `src/contexts/GameContext.tsx` | Nieuwe action `WASH_MONEY_AMOUNT` voor instelbaar bedrag witwassen |
| `src/components/game/TradeView.tsx` | Volledige herstructurering met 3 sub-tabs, visueel vernieuwde markt, witwas-panel, verbeterde gear-shop |

### Nieuwe helpers

| Functie | Doel |
|---------|------|
| `getBestTradeRoute()` | Berekent de meest winstgevende koop/verkoop route |
| `getWashCapacity()` | Berekent dagelijkse witwas-capaciteit |
| `getDailyDeal()` | Selecteert een willekeurig gear-item met korting |

### State uitbreiding

```text
GameState uitbreiding:
  priceHistory: Record<DistrictId, Record<GoodId, number[]>>  // laatste 5 dagen
  washUsedToday: number  // hoeveel er vandaag al gewassen is
```

### Volgorde van implementatie

1. Types en state uitbreiden (priceHistory, washUsedToday)
2. Engine updaten (prijsgeschiedenis bijhouden, witwas-capaciteit, handelsroutes)
3. TradeView volledig vernieuwen met 3 sub-tabs
4. Markt-panel: iconen, kleurcoding, sparklines, route-tips
5. Witwas-panel: overzicht, instelbaar bedrag, capaciteit
6. Zwarte Markt-panel: filters, stat-balken, vergelijking, dagelijkse deal

