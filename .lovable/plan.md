

# Balans Analyse — Noxhaven

Na grondige review van alle economische systemen, progressie, combat en casino. Hieronder de bevindingen, gegroepeerd per categorie.

---

## ✅ Goed gebalanceerd

| Systeem | Waarom |
|---------|--------|
| **XP-curve** | Exponentieel (100 × 1.15^level) — schaalbaar, niet te snel |
| **Casino house edge** | Blackjack 2x (standaard), Slots 8x triple maar zeldzaam, Roulette standaard kansen — redelijk |
| **Witwassen** | 15% fee + dagelijkse cap (3000 + biz bonussen) — goed gebalanceerd |
| **Heat-systeem** | Gelaagd (raid op 45, wanted op 80, arrest bij 40+) — dwingt keuzes af |
| **Gym stats** | Multipliers per gym (1.0-2.0x), energie-kost 5, groei +1-4/sessie — geleidelijk |
| **Defensieve stat caps** | 40% gecombineerd plafond — voorkomt onsterfelijkheid |
| **Prison** | Escalerende straffen (1-7 dagen), geld confiscatie, crew loyalty loss — impactvolle consequentie |
| **VIP casino bonus** | Gecapped op 15%, alleen op netto winst — geen exploiteerbaar voordeel |

---

## ⚠️ Balansproblemen gevonden

### 1. Solo Operaties — Schalen te hard (HOOG)

**Probleem**: `operationRewards.ts` geeft tot **+95% bonus** (80% dag + 10% Crown + 15% heat) bovenop base, maal 0.7-1.4 variance. Crypto Heist (base €12.000) kan op dag 50+ met alle bonussen **€12.000 × 1.95 × 1.4 = €32.760** per actie opleveren. Dat is meer dan de duurste baan (Makelaar) in 8 dagen verdient.

**Fix**: Cap dagbonus op +50% in plaats van +80%, of maak operaties eenmalig per dag.

### 2. Banen betalen te weinig (HOOG)

**Probleem**: Hoogste baan (Makelaar, level 15 vereist) betaalt €4.000 per 8 uur. Na 10 shifts: promotie (+20% = €4.800). Solo ops en handel leveren al snel €5.000-30.000 per actie op. Banen zijn **nooit competitief** en worden irrelevant zodra je level 5+ bent.

**Fix**: Salarissen 3-5x verhogen, of unieke perks toevoegen (bijv. XP bonus, heat reductie, passieve stat groei) die banen aantrekkelijk maken naast het geld.

### 3. Property passief inkomen — Villa te zwak (MEDIUM)

**Probleem**: Villa kost €250.000 maar geeft slechts €2.500/dag passief inkomen. ROI = 100 dagen. Ter vergelijking: Hotel Noxhaven Grand kost €150.000 maar geeft €3.000/dag + €2.500 witwas. Een speler op dat niveau verdient €20.000-50.000/dag via andere bronnen. Het passieve inkomen van de Villa is verwaarloosbaar.

**Fix**: Villa passief inkomen naar €5.000+, of voeg exclusieve Villa-bonussen toe (bijv. dagelijkse gratis gear crate, XP multiplier).

### 4. Slots — 2-match uitbetaling te laag (LAAG)

**Probleem**: Slots betalen 1.2x bij 2 van 3 match. Netto winst = 20% van inzet. Met 12 symbolen is de kans op ≥2 match ≈ 43%, maar exacte EV met triple kansen (8x) en jackpot maakt het overall eerlijk. Echter: de 1.2x voelt **niet bevredigend** voor spelers — het is nauwelijks een winst.

**Fix**: Verhoog naar 1.5x voor 2-match om het gevoel te verbeteren zonder de EV significant te veranderen.

### 5. Blackjack — Split ontbreekt server-side (BUG)

**Probleem**: De client stuurt nu 'split' als action, maar de server-side `handleCasinoPlay` verwerkt alleen 'hit', 'double' en 'stand'. De 'split' action die je net hebt toegevoegd wordt **genegeerd** op de server — de handen worden niet gesplitst.

**Fix**: Server-side split-logica toevoegen in de edge function.

### 6. Endgame inkomen — Crown Heights is king (LAAG)

**Probleem**: Crown Heights geeft €2.800/dag passief + de hoogste handelsmodifiers (drugs 1.6x, luxury 1.8x). In combinatie met de -20% heat perk is dit veruit het sterkste district. De andere districten kunnen niet concurreren op endgame-niveau.

**Fix**: Geen actie nodig — dit is bewust ontwerp. Crown is het duurste district (€85.000) en zou het sterkste moeten zijn. De andere districten hebben hun niches (Port = smokkel, Iron = goedkope crew, etc.).

---

## Samenvatting prioriteiten

| # | Probleem | Prioriteit | Actie |
|---|----------|-----------|-------|
| 1 | **Blackjack split niet op server** | **KRITIEK** | Edge function uitbreiden met split-logica |
| 2 | **Solo ops schalen te hard** | Hoog | Dagbonus cap verlagen naar 50% |
| 3 | **Banen irrelevant** | Hoog | Salarissen verhogen + unieke perks |
| 4 | **Villa passief inkomen te laag** | Medium | Inkomen verhogen naar €5.000+/dag |
| 5 | **Slots 2-match te laag** | Laag | 1.2x → 1.5x |

Wil je dat ik deze fixes implementeer? De server-side blackjack split is het meest urgent omdat de feature nu broken is.

