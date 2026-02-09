
# Dynamisch Nieuwssysteem — Levende Wereld van Noxhaven

## Probleem
Het huidige nieuwssysteem is een statische lijst van 9 berichten die op basis van dagnummer rouleren. Ze hebben geen relatie met wat er daadwerkelijk in het spel gebeurt en voegen niets toe aan de immersie.

## Oplossing
Een **dynamische nieuwsgenerator** die berichten genereert op basis van de echte gamestate. Elke dag krijg je 2-3 nieuwsberichten die reageren op jouw acties, factie-activiteit, marktbewegingen en wereldgebeurtenissen.

## Nieuwscategorieen

| Categorie | Trigger | Voorbeeld |
|-----------|---------|-----------|
| **Speler-acties** | Heist voltooid, district gekocht, combat gewonnen | "BREAKING: Gewapende overval op Havenpakhuis — politie staat voor raadsel" |
| **Factie-activiteit** | Relatie hoog/laag, oorlog, leider verslagen | "Blue Lotus trekt zich terug uit Crown Heights na mysterieuze nederlaag" |
| **Markt & Economie** | Prijsveranderingen, demand shifts | "Synthetica-prijzen stijgen met 40% door tekorten in Port Nero" |
| **Weer & Omgeving** | Storm, mist, hitte | "Zware storm legt havenactiviteit plat — smokkelroutes verstoord" |
| **Heat & Politie** | Heat-niveau, politie-invallen | "Politie verhoogt patrouilles in Lowrise na reeks incidenten" |
| **Crew & Imperium** | Crew gewond, safehouse, upgrades | "Mysterieuze bouwactiviteit gespot in Iron Borough" |
| **Wereld-kleur** | Random flavor, altijd beschikbaar | "Burgemeester ontkent banden met onderwereld — 'absurd'" |

## Nieuwsticker Redesign

De enkele scrollende regel wordt vervangen door een ticker die door meerdere berichten roteert:

- 2-3 berichten per dag, automatisch wisselend (elke 6 seconden)
- Urgentie-kleuring: rood voor gevaarlijk, goud voor kansen, wit voor neutraal
- Kleine pulse-animatie bij dag-overgang om aandacht te trekken
- Klikbaar: toon een kort popup met meer detail

## Technische Aanpak

### Nieuw bestand: `src/game/newsGenerator.ts`
- Functie `generateDailyNews(state: GameState): NewsItem[]`
- Controleert 15+ gamestate-condities en genereert relevante berichten
- Elke `NewsItem` bevat: `text`, `category`, `urgency` (low/medium/high), `icon`
- Fallback: altijd minimaal 1 flavor-bericht zodat er nooit lege nieuws is
- Pool van 30+ flavor-berichten voor variatie

### Aanpassing: `src/game/types.ts`
- Nieuw type `NewsItem` met `text`, `category`, `urgency`, `icon`
- `GameState` krijgt `dailyNews: NewsItem[]`

### Aanpassing: `src/game/constants.ts`
- Verwijder oude `NEWS_ITEMS` array
- Voeg `dailyNews: []` toe aan initial state

### Aanpassing: `src/contexts/GameContext.tsx`
- Bij `END_TURN`: genereer nieuws via `generateDailyNews()` en sla op in state
- Migratie: `dailyNews` default `[]`

### Aanpassing: `src/components/game/MapView.tsx`
- Vervang statische tekstregel door dynamische ticker-component
- Roteer door `state.dailyNews` items met interval
- Urgentie-kleuring (high = `text-blood`, medium = `text-gold`, low = `text-muted-foreground`)
- Klikbaar voor detail-popup

### Nieuw component: `src/components/game/map/NewsTicker.tsx`
- Accepteert `items: NewsItem[]`
- Auto-roteert met fade-animatie (framer-motion)
- Toont categorie-icoon + urgentie-kleur
- Optionele klik-handler voor detail

### Voorbeelden van dynamische berichten

**Na een heist:**
> "BREAKING: Onbekende criminelen slaan toe bij [locatie] — buit geschat op €XX.XXX"

**Bij hoge heat:**
> "MANHUNT: Politie zet extra eenheden in — 'We zitten ze op de hielen'"

**Na district kopen:**
> "Vastgoedtransactie in [district] — geruchten over nieuwe machtsstructuur"

**Bij factie-oorlog:**
> "Schietpartij in [district]: [factie] en rivalen clashen over territorium"

**Bij storm:**
> "Code Oranje: Zware storm trekt over Noxhaven — havens gesloten"

**Flavor (random):**
> "Burgemeester belooft 'schonere straten' in verkiezingstoespraak"
> "Restaurant 'La Notte' in Crown Heights uitgeroepen tot beste van het jaar"
> "Mysterieuze graffiti verschijnt op muren in Lowrise: 'WIJ ZIEN ALLES'"
