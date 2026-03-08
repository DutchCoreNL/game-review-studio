

# Casino Verbeteringen

Na analyse van alle 5 casino-games en de lobby zijn er verbeteringen in 3 categorieën: **visuele consistentie**, **UX/feedback** en **gameplay**.

---

## 1. Russian Roulette — Visuele consistentie (bug)

`RussianRouletteGame.tsx` mist de cinematic header-structuur die alle andere games wél hebben (game-card wrapper met afbeelding + gradient + titel). Het gebruikt een kale `space-y-4` layout. Dit valt visueel uit de toon.

**Fix**: Wrap in dezelfde `game-card overflow-hidden` structuur met cinematic header afbeelding, zoals de andere 4 games.

---

## 2. In-game stats balk

Sessie-statistieken (winst/verlies/streak) zijn alleen zichtbaar in de lobby. Tijdens het spelen zie je niets — je moet terug naar het menu om je sessie-voortgang te zien.

**Fix**: Voeg een compacte stats-balk toe bovenin elk actief spel: `W:3 | L:1 | +€450 | 🔥2`. Dit is een klein gedeeld component `<SessionStatsBar />`.

---

## 3. Lobby layout — Featured game + 2x2 grid

De lobby heeft 5 kaarten in een 2-kolom grid waardoor Russian Roulette alleen op de onderste rij staat. 

**Fix**: Maak het eerste spel (Blackjack) een full-width "featured" kaart bovenaan, gevolgd door de overige 4 in een 2x2 grid. Dit geeft een professionelere uitstraling.

---

## 4. Win-animatie met goudmunten

Er is geen visuele bevestiging bij winst behalve een tekstregel. Alle games tonen alleen `<motion.p>GEWONNEN!</motion.p>`.

**Fix**: Voeg een `<WinCelebration amount={number} />` component toe met 5-8 gouden muntjes die omhoog floaten met framer-motion. Wordt getriggerd bij winst in alle 5 games.

---

## 5. Blackjack — Split optie

Blackjack heeft alleen Hit/Stand/Double. Split ontbreekt — een standaard blackjack-feature wanneer je twee kaarten van dezelfde waarde hebt.

**Fix**: Voeg een SPLIT-knop toe die verschijnt wanneer de eerste twee kaarten dezelfde rang hebben. De actie wordt als `'split'` naar de server gestuurd. De UI toont twee handen naast elkaar.

---

## Implementatieplan

| # | Wat | Bestanden | Complexiteit |
|---|-----|-----------|-------------|
| 1 | Russian Roulette cinematic header | `RussianRouletteGame.tsx` | Klein |
| 2 | `SessionStatsBar` component + integratie in alle games | Nieuw component + 5 game files | Medium |
| 3 | Lobby featured layout | `CasinoView.tsx` | Klein |
| 4 | `WinCelebration` coin animatie | Nieuw component + 5 game files | Medium |
| 5 | Blackjack Split | `BlackjackGame.tsx` | Medium-groot |

Stappen 1-4 zijn puur visueel/UX. Stap 5 is gameplay. Totaal ~6 bestanden gewijzigd, 2 nieuwe components.

