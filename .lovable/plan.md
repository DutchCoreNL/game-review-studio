

# Casino Update: The Velvet Room 2.0

## Huidige situatie

Het casino heeft drie werkende spellen (Blackjack, Roulette, Slots), maar ze zijn visueel basic en missen diepgang:

- **Blackjack**: Kaarten zijn simpele tekst in een vakje, geen suits/kleuren, geen Double Down optie, geen Split
- **Roulette**: Het "wiel" is een ronde div met een nummer, geen visuele opbouw van spanning
- **Slots**: Emoji-symbolen met een simpel heen-en-weer effect, geen echte reel-spinning illusie
- **Geen nieuw spel** sinds de oorspronkelijke versie
- **Storm-blokkade** is niet geimplementeerd (alleen een tekstbericht)
- **VIP/Reputatie-bonussen** worden niet getoond in het casino zelf
- **Geen winstreak/statistieken** zichtbaar tijdens het spelen
- **Casino links in Profiel** doen niets

---

## Wat verandert

### 1. Vierde Spel: Poker (High-Low)

Een nieuw spel waarbij je raadt of de volgende kaart hoger of lager is dan de huidige. Per juiste gok stijgt de multiplier. Je kunt op elk moment cashen of doorgaan (risico/beloning).

| Ronde | Multiplier |
|-------|-----------|
| 1 correct | 1.5x |
| 2 correct | 2x |
| 3 correct | 3x |
| 4 correct | 5x |
| 5 correct | 10x |
| 6+ correct | 20x (MAX) |

Simple maar verslavend, past bij het crime-thema.

### 2. Blackjack Upgrades

- **Double Down**: Na de eerste twee kaarten kun je je inzet verdubbelen en precies 1 kaart ontvangen
- **Kaarten met suits**: Visuele kaarten met schoppen/harten/klaver/ruiten symbolen en rood/zwart kleuring
- **Winst/verlies animatie**: Gouden confetti-achtig effect bij winst, rode shake bij verlies
- **Streak teller**: Toont huidige winstreak

### 3. Roulette Upgrade

- **Uitgebreidere inzetopties**: Naast rood/zwart/groen ook "Oneven/Even" en "1-18/19-36"
- **Visueel verbeterd wiel**: Genummerde segmenten rondom het wiel in afwisselende kleuren
- **Laatste resultaten strip**: De laatste 5 spins worden getoond als gekleurde bolletjes (rood/zwart/groen)

### 4. Slots Upgrade

- **Individuele reel-stop**: Elke reel stopt apart (links, midden, rechts) voor meer spanning
- **Near-miss detectie**: Als 2 van de 3 gelijk zijn, een "BIJNA!" animatie
- **Progressive Jackpot**: Een oplopend jackpot-bedrag dat stijgt met 5% van elke inzet en uitkeert bij 3x 7 symbolen

### 5. Casino Lobby Verbeteringen

- **VIP Status indicator**: Toont actieve bonussen (Neon Strip bezit, district reputatie, Crown Heights VIP)
- **Storm blokkade**: Casino wordt daadwerkelijk gesloten bij storm-weer met visueel "GESLOTEN" scherm
- **Statistieken balk**: Win/verlies ratio, totaal gewonnen, huidige sessie resultaat
- **Bet presets**: Snelknoppen voor veelgebruikte bedragen (100, 500, 1000, 5000, ALL-IN)

### 6. Achievements & Integratie

- Nieuwe achievements: "Jackpot!" (win 50x bij slots), "Kaartenteller" (win 5 blackjack op rij), "Poker Face" (bereik 5x multiplier bij High-Low)
- Casino winsten genereren nu ook +1 Neon Strip reputatie per 1000 euro gewonnen
- Telefoonberichten bij grote winsten of een losing streak

---

## Technisch Overzicht

### Aangepaste bestanden

| Bestand | Wijziging |
|---------|-----------|
| `src/components/game/CasinoView.tsx` | Volledige herbouw: lobby met VIP status, storm-check, statistieken, bet presets. Alle 4 spellen met verbeterde visuals en mechanica |
| `src/game/types.ts` | `CasinoGame` type uitbreiden met `'highlow'`, nieuwe `CasinoStats` type voor sessie-tracking |
| `src/game/constants.ts` | Nieuwe achievements toevoegen, bet presets |
| `src/contexts/GameContext.tsx` | Casino acties uitbreiden met district-rep bonus bij winst |
| `src/components/game/MapView.tsx` | Storm-check op casino knop |
| `src/components/game/ProfileView.tsx` | Casino links verwijderen (ze doen niets) of werkend maken |

### Nieuwe types

```text
CasinoGame: 'blackjack' | 'roulette' | 'slots' | 'highlow' | null

CasinoSessionStats (lokale state in CasinoView):
  sessionWins: number
  sessionLosses: number
  sessionProfit: number
  currentStreak: number
  bestStreak: number
```

### Casino Lobby structuur

```text
CasinoView
  +-- VIP Status Banner (bonussen)
  +-- Sessie Statistieken (wins/losses/profit)
  +-- Game Grid (4 kaarten: BJ, Roulette, Slots, High-Low)
  +-- Storm Overlay (als weather === 'storm')

BlackjackGame (verbeterd)
  +-- Bet Presets (100, 500, 1k, 5k, ALL-IN)
  +-- Suited Cards (kleur + suit symbool)
  +-- Double Down knop
  +-- Streak teller
  +-- Win/loss animatie

RouletteGame (verbeterd)
  +-- Visueel wiel met gekleurde segmenten
  +-- Uitgebreide inzetopties (rood/zwart/groen/even/oneven/hoog/laag)
  +-- Laatste 5 resultaten strip

SlotsGame (verbeterd)
  +-- Sequentiele reel stops
  +-- Progressive jackpot display
  +-- Near-miss animatie

HighLowGame (nieuw)
  +-- Huidige kaart (groot, geanimeerd)
  +-- HOGER / LAGER knoppen
  +-- Multiplier ladder (visueel)
  +-- CASH OUT knop
```

### Kaart-rendering upgrade

Kaarten krijgen een suit en kleur:

```text
Suits: spade, heart, diamond, club
Kleuren: Rood (heart, diamond) / Zwart (spade, club)
Weergave: "A spade", "K heart", "7 diamond"
Visueel: Grotere kaarten met suit-icoon en gekleurde rand
```

### Volgorde van implementatie

1. Types uitbreiden (CasinoGame + 'highlow')
2. CasinoView lobby herbouwen (VIP banner, storm check, stats, presets)
3. Blackjack upgraden (suits, double down, streak, animaties)
4. Roulette upgraden (meer opties, visueel wiel, history strip)
5. Slots upgraden (sequential stops, jackpot, near-miss)
6. High-Low poker toevoegen
7. MapView storm-check, achievements, rep-integratie
8. ProfileView casino links opruimen

