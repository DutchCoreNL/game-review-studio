

## Verbeteringsgebieden die ik heb geïdentificeerd

Na analyse van de codebase zie ik de volgende verbetermogelijkheden:

### 1. Performance: `JSON.parse(JSON.stringify(state))` deep clone
De game reducer (regel 225 GameContext.tsx) kloont bij **elke actie** de volledige `GameState` met `JSON.parse(JSON.stringify())`. Dit is extreem traag bij een state van deze omvang (2800+ regels reducer, 1000+ regels types). Dit zou vervangen moeten worden door een structurele immutable-update aanpak (of `structuredClone` als minimum, of beter: `immer`).

### 2. Reducer is te groot (~2600 regels in één bestand)
`GameContext.tsx` is bijna 2850 regels. Dit maakt het moeilijk te onderhouden. De reducer zou opgesplitst moeten worden in domein-specifieke sub-reducers (trade, combat, villa, heist, etc.).

### 3. Save state migraties zijn fragiel
Bij `SET_STATE` worden ~20 handmatige migratie-checks gedaan (regels 228-269). Dit zou een versioned migration-systeem moeten zijn met een schema-versienummer.

### 4. Trade log mist winst/verlies totalen per dag
De `TradeLogPanel` toont individuele trades maar geen dagelijkse samenvatting of grafiek van totale winst over tijd.

### 5. Crafting recepten hebben geen unlock-feedback in het nachtrapport
Wanneer je een villa-module installeert krijg je een toast, maar het nachtrapport toont geen crafting-activiteit of productiewaarde.

### 6. Crew loyalty system mist visuele indicatoren in het overzicht
Het crew-paneel toont geen loyaliteitsbalk of waarschuwingen voor lage loyaliteit. Spelers worden verrast door defecties.

### 7. Leaderboard sync is onbeschermd
`syncLeaderboard.ts` stuurt data zonder validatie. Een speler kan via de browser console valse scores injecteren.

---

## Aanbevolen prioriteit

Ik zou aanraden te focussen op de **meest impactvolle verbeteringen voor de speler**:

| # | Verbetering | Impact |
|---|------------|--------|
| 1 | Crew loyaliteitsbalk toevoegen aan crew-overzicht | Voorkomt frustratie door onverwachte defecties |
| 2 | Dagelijkse winst/verlies samenvatting in trade log | Betere inzicht in financiële prestaties |
| 3 | Crafting output tonen in nachtrapport | Completer overzicht van nachtelijke productie |
| 4 | Performance verbeteren met immer | Snellere gameplay, minder lag |
| 5 | Reducer opsplitsen | Betere onderhoudbaarheid |

### Technische details

**Crew loyaliteitsbalk**: Een gekleurde voortgangsbalk (groen >80, geel >50, oranje >20, rood <20) naast elk crewlid in het bestaande crew-overzicht, met een waarschuwingsicoon bij lage loyaliteit.

**Dagelijkse trade samenvatting**: Een klein staafdiagram bovenaan de TradeLogPanel dat winst/verlies per dag toont over de laatste 10 dagen, berekend uit bestaande `tradeLog` data.

**Crafting in nachtrapport**: Een nieuwe sectie in NightReport die crafting-output van die beurt toont (als er gecrafted is), vergelijkbaar met de bestaande lab/villa productie secties.

**Performance (immer)**: Vervang `JSON.parse(JSON.stringify(state))` door `produce()` van immer. Dit vereist het toevoegen van de `immer` dependency en het wrappen van de reducer.

