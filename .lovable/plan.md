

# Balans Audit: Noxhaven - Bevindingen & Fixes

Na een grondige analyse van alle systemen (economie, casino, handel, combat, progressie) zijn er meerdere balansproblemen gevonden. Hieronder staan ze gesorteerd op urgentie.

---

## KRITIEK: Casino VIP Bonus Breekt de Huisrand

**Probleem**: De VIP-bonus (tot +40%) wordt direct opgeteld bij de uitbetalings-multiplier in plaats van als een klein percentage-voordeel. Dit geeft de speler een *positieve verwachte waarde* -- het casino wordt letterlijk een geldmachine.

Voorbeeld bij Roulette rood/zwart:
- Winkans: 48.6% (18 van 37 nummers)
- Zonder VIP: 0.486 x 2.0 = 0.97 (huis wint 3%) -- correct
- Met max VIP (+40%): 0.486 x 2.4 = 1.17 (speler wint 17%) -- gebroken

**Fix**: VIP-bonus moet de *winst* verhogen, niet de multiplier zelf. Een +40% bonus op de winst bij roulette 2x betekent: inzet terug + (inzet x 1.4) = effectief 2.4x. Maar de winstberekening moet zo werken dat het huisvoordeel behouden blijft: de bonus wordt alleen toegepast *als je wint*, niet op de multiplier zelf. Beter: cap de VIP-bonus op maximaal 15% en pas het toe als extra winst bovenop de standaard uitbetaling.

---

## KRITIEK: Slots Kansen Zijn Te Hoog

**Probleem**: De symbolen-array bevat duplicaten: `['kersen','kersen','kersen','citroen','citroen','druif','diamant','7']`. Dit betekent:
- Kans op 3x kersen: (3/8)^3 = 5.3% met 10x uitbetaling
- Kans op 3x citroen: (2/8)^3 = 1.6% met 10x uitbetaling
- Kans op enig paar: ~35-40% met 1.5x uitbetaling

De verwachte waarde per spin is ruim boven 1.0, wat betekent dat slots altijd winstgevend zijn voor de speler, zelfs zonder VIP-bonus.

**Fix**: Herbalanceer de symbolen naar meer unieke items met lagere kansen, of verlaag uitbetalingen:
- Voeg meer verliezende symbolen toe (10-12 items in de array)
- Verlaag paar-uitbetaling naar 1.2x
- Houd triple bij 8x (behalve diamant 25x en 7 jackpot)

---

## KRITIEK: Casino Achievements Werken Niet

**Probleem**: De achievements `card_counter` ("Win 5 blackjack op rij") en `poker_face` ("Bereik 5x multiplier bij High-Low") controleren alleen `s.stats.casinoWon > 0`. Elke willekeurige casinowinst ontgrendelt ze.

**Fix**: Voeg specifieke tracking toe aan `GameState.stats`:
- `blackjackStreak: number` voor card_counter (check >= 5)
- `highLowMaxRound: number` voor poker_face (check >= 5)
- Update deze waarden in de casino-componenten

---

## KRITIEK: Contract Beloningen Schalen Onbegrensd

**Probleem**: Contract beloningen groeien met `rewardBase * (1 + day * 0.05)`. Op dag 100 is dit 6x, op dag 200 is dit 11x. Een "Safe Kraken" (basis euro8.000) betaalt op dag 200: euro88.000 als zwart geld. Er is geen plafond.

**Fix**: Cap de dagbonus op een maximum:

```text
reward = rewardBase * (1 + Math.min(day * 0.05, 3.0))
```

Dit limiteert de bonus tot maximaal 4x (op dag 60+), wat nog steeds lonend is maar niet oneindig schaalt.

---

## MODERATE: High-Low Te Makkelijk Te Exploiteren

**Probleem**: Bij gelijke waarde (bijv. huidige kaart is 7, volgende is ook 7) telt het als "correct" voor BEIDE richtingen (`nextVal >= currentVal` en `nextVal <= currentVal`). Bij extreme kaarten (Aas of 2) is de juiste gok bijna gegarandeerd:
- Bij een 2: "HOGER" wint met 12 van 13 rangen = 92% kans
- Bij een Aas: "LAGER" wint met 12 van 13 rangen = 92% kans

Met strategisch spelen is het haalbaar om consistent 5-6 rondes te bereiken (10-20x).

**Fix**: Gelijke waarde telt als verlies ("push"), of verlaag de hogere multipliers:

```text
Ronde 1: 1.3x (was 1.5x)
Ronde 2: 1.8x (was 2x)
Ronde 3: 2.5x (was 3x)
Ronde 4: 4x (was 5x)
Ronde 5: 7x (was 10x)
Ronde 6: 12x (was 20x)
```

---

## MODERATE: Slots Jackpot Verdwijnt Bij Pagina-herlaad

**Probleem**: De progressive jackpot wordt opgeslagen in React component state (`useState(10000)`). Bij het verlaten van het casino of herladen van de pagina reset deze naar euro10.000. 5% van elke inzet gaat verloren.

**Fix**: Sla de jackpot op in `GameState` zodat deze persistent is via localStorage.

---

## MODERATE: Storm Weer Is Te Krachtig

**Probleem**: Storm geeft:
- Gratis reizen (normaal euro50 per reis)
- Dubbele lab output (40 i.p.v. 20 Synthetica)
- Casino gesloten (enige nadeel)

Dubbele lab output is extreem waardevol. 40 Synthetica met een basis van euro140 * 0.5 kostprijs = euro2,800 winst per storm-nacht, verkocht voor veel meer.

**Fix**: Verlaag de lab-bonus bij storm naar +50% (30 i.p.v. 40) of voeg een nadeel toe zoals +10 Heat door het opvallen van 's nachts produceren.

---

## MINOR: XP Curve Wordt Steil

**Probleem**: XP-eis stijgt met 40% per level. Level 1 naar 2 kost 100 XP, maar level 10 naar 11 kost al ~2,867 XP. Dit wordt erg traag.

**Beoordeling**: Acceptabel als de bedoeling is dat levels na 10 een langetermijndoel zijn. Skill points (+2 per level) zijn krachtig genoeg om dit te rechtvaardigen. Geen actie nodig, maar overweeg 30% groei als spelers klagen.

---

## MINOR: Lowrise District Dubbelvoordeel

**Probleem**: Lowrise (goedkoopste district, euro8.000) geeft:
- -30% solo operatie risico (district perk in engine)
- +10% operatie beloning (district modifier in operationRewards)

Dit maakt Lowrise de beste plek voor solo ops in het spel, ondanks dat het het armste district is.

**Beoordeling**: Dit past thematisch (de straat kent zijn eigen regels), maar de +10% beloning-mod zou eerder +5% moeten zijn om het verschil met Crown Heights te bewaren.

---

## Samenvatting Wijzigingen

| Bestand | Wijziging |
|---------|-----------|
| `src/components/game/casino/casinoUtils.ts` | VIP-bonus cap op 15%, berekeningswijze aanpassen |
| `src/components/game/casino/BlackjackGame.tsx` | VIP-bonus correct toepassen op winst, streak tracking |
| `src/components/game/casino/RouletteGame.tsx` | VIP-bonus correct toepassen |
| `src/components/game/casino/SlotsGame.tsx` | Symbolen herbalanceren, uitbetalingen aanpassen, jackpot naar state |
| `src/components/game/casino/HighLowGame.tsx` | Gelijke waarde = verlies, multipliers verlagen |
| `src/game/engine.ts` | Contract reward cap, storm lab-bonus naar 1.5x |
| `src/game/constants.ts` | Achievement conditions fixen, stats velden toevoegen |
| `src/game/types.ts` | Nieuwe stats velden voor achievement tracking + jackpot in state |
| `src/game/operationRewards.ts` | Lowrise district mod van 0.10 naar 0.05 |

