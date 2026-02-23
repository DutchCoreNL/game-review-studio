

## Plan: "Verkoop Alles" knop toevoegen aan de Markt

### Wat wordt er gebouwd?
Een prominente "VERKOOP ALLES" knop in het MarketPanel die in een keer alle goederen uit je inventaris verkoopt tegen de huidige districtprijzen. Inclusief een bevestigingsdialoog met een schatting van de totale opbrengst.

### Hoe het werkt
1. De knop verschijnt alleen wanneer de speler in **VERKOOP**-modus staat en minstens 1 item in de inventaris heeft
2. Bij klik opent een bevestigingsdialoog met de geschatte totale opbrengst
3. Na bevestiging wordt voor elk goed in de inventaris een TRADE-actie gedispatcht (mode: sell, quantity: owned)
4. Een toast toont het totaalbedrag dat verdiend is
5. Coin-geluid speelt af bij succesvolle verkoop

### Technische details

**Bestand: `src/components/game/trade/MarketPanel.tsx`**

Wijzigingen:
- Importeer `PackageOpen` icoon uit lucide-react (voor de knop)
- Voeg een `handleSellAll` functie toe die:
  - Door alle GOODS itereert en voor elk item met `owned > 0` een TRADE dispatch doet
  - De totale opbrengst berekent (rekening houdend met charm bonus, rep, heat)
  - Een bevestigingsdialoog toont via `pendingSellAll` state
- Voeg een `pendingSellAll` state toe (boolean of object met geschatte opbrengst)
- Render de "VERKOOP ALLES" knop tussen de quantity selector en de goods list, alleen zichtbaar als `tradeMode === 'sell'` en `invCount > 0`
- Voeg een extra `ConfirmDialog` toe voor de sell-all bevestiging

De bestaande `executeTrade` functie en `TRADE` action in GameContext worden hergebruikt -- er is geen nieuwe reducer-actie nodig. De knop loopt simpelweg door alle goederen en verkoopt ze een voor een.

