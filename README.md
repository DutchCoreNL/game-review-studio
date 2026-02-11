# 🩸 Noxhaven: Blood & Empire

> *"De stad heeft ogen, vriend. En die ogen kijken nu naar jou."*

**Word de Kingpin van Noxhaven.** Handel, vecht, verover.

---

## 🎮 Over het spel

Noxhaven: Blood & Empire is een browser-based crime strategy game waarin je opstijgt van straatkoerier tot de onbetwiste heerser van een meedogenloze stad. Navigeer door vijf unieke districten, handel in illegale goederen, bouw een crew op, en reken af met rivaliserende facties — alles vanuit je telefoon.

Je begint met niets dan een schuld en een reputatie om op te bouwen. Elke dag is een keuze: investeer in je imperium, gok in het casino, of daag de factieleiders uit in gevecht. Maar pas op — de politie slaapt niet, en je vijanden ook niet.

---

## ⚔️ Kernsystemen

### 🗺️ Stadskaart & Districten

Verken vijf districten met unieke perks, markten en gevaren:

| District | Sfeer | Kenmerk |
|----------|-------|---------|
| **Port Nero** | Havens, containers, kranen | Smokkelroutes & scheepsladingen |
| **Crown Heights** | Wolkenkrabbers, villa's | Financiële macht & elite-toegang |
| **Iron Borough** | Fabrieken, schoorstenen | Industrie, Chop Shop & productie |
| **Lowrise** | Lage woonblokken, straatcultuur | Straathandel & rekrutering |
| **Neon Strip** | Neonverlichting, clubs | Casino, nachtleven & entertainment |

De kaart is een procedureel gegenereerd nachtelijk stadsbeeld met organisch wegennetwerk, kustlijn, brug, skyline-silhouet en district-specifieke landmarks (bewegende kranen, helipads, neonborden). Bezeten districten hebben een subtiele gloed en actieve smokkelroutes worden weergegeven als stippellijnen.

---

### 📦 Handelssysteem

- **Markt**: Koop en verkoop vijf goederen (Drugs, Wapens, Tech, Luxe, Meds) op dynamische markten met fluctuerende prijzen per district. Inclusief prijsgeschiedenis met sparkline-grafieken en route-tips.
- **Witwassen**: Was dirty money wit via dekmantelbedrijven op basis van dagelijkse capaciteit.
- **Zwarte Markt (Gear)**: Koop uitrusting (wapens, pantser, gadgets) met stat-bonussen. Daily Deals worden gefilterd op reputatie-vereisten.

---

### 👥 Crew Management

- Rekruteer tot **6 crewleden** (uitbreidbaar naar 8 via Villa-module).
- Vier rollen: **Chauffeur, Enforcer, Hacker, Smokkelaar**.
- **Specialisatie Skill Tree**: Op level 3, 5, 7 en 9 kies je specialisaties (Brute, Bodyguard, Phantom, Racer, etc.) voor unieke bonussen op missies, gevechten en handel.
- Crewleden genezen automatisch; versneld via Safehouse medbay.
- Elke crewlid krijgt een persoonlijkheidstrek die hun gedrag en dialogen beïnvloedt.

---

### ⚔️ Narratief Gevechtssysteem

Turn-based gevechten met cinematische sfeerbeschrijvingen:

- **5 acties**: Aanval, Verdediging, Zware Klap, Omgevingsactie & Tactische Actie (stat-check).
- **Typewriter-effect** voor scene-beschrijvingen per beurt.
- **District-specifieke acties** (bijv. "Verschuil achter containers" in Port Nero).
- **Visuele effecten**: Screen-shake, blood-flashes bij schade, overwinningsanimaties.
- **Ammo-systeem**: Vuurwapens verbruiken kogels; zonder ammo val je terug op melee (-50% schade).
- **Baasgevechten** met exclusieve narratieve overrides voor El Serpiente, Mr. Wu, Hammer, Commandant Voss en Commissaris Decker.

---

### 🎰 Velvet Room Casino

Vier casinospellen, exclusief beschikbaar in de **Neon Strip** (of Crown Heights bij 50+ reputatie):

| Spel | Beschrijving |
|------|-------------|
| **Blackjack** | Klassiek kaartspel met streak-tracking |
| **Roulette** | Kies je nummers en kleuren |
| **Slots** | Gokautomaten met progressieve jackpot (persistent in gamestate) |
| **High-Low Poker** | Raad of de volgende kaart hoger of lager is (max 12x multiplier) |

- VIP-bonus beperkt tot 15% op nettowinst.
- Geblokkeerd tijdens stormen.
- Sessiestatistieken direct zichtbaar in de lobby.

---

### 🏠 Safehouses

- Koop per district een safehouse (levels 1-3).
- **Modules**: Extra opslag, passieve heat-reductie (persoonlijk + voertuig), medische post voor versneld crew-herstel.
- Zichtbaar als klikbare markers op de stadskaart.

---

### 🏰 Villa Noxhaven

Persoonlijk hoofdkwartier (vereist Level 8, 300 Rep) met uitgebreide modules:

| Module | Effect |
|--------|--------|
| **Kluis** | Veilige geldopslag (beschermd bij arrestatie) |
| **Opslagkelder** | Veilige goederenopslag |
| **Wietplantage** | Dagelijkse drugsproductie |
| **Coke Lab** | Dagelijkse cokeproductie |
| **Synthetica Lab** | Geavanceerde productie |
| **Crew Kwartieren** | Crew-limiet +2 (naar 8) |
| **Wapenkamer** | Munitie-opslag bonus |
| **Commandocentrum** | Strategische planning |
| **Helipad** | Snelle reismogelijkheden |
| **Zwembad** | Organiseer feesten voor factie-relaties & reputatie |
| **Camera's** | +25 verdediging, -30% aanvalskans |
| **Ondergrondse Tunnel** | +25% ontsnappingskans gevangenis, halveert verliezen bij aanval |
| **Garage Uitbreiding** | +10 inventarisruimte |
| **Server Room** | -5 heat decay bonus |

De villa kan worden aangevallen door de Nemesis. Verdedigingsscore is inzichtelijk via een samenvattingspaneel in het profiel.

---

## 🌐 Wereld & Dynamiek

### 🌦️ Weer & Dag/Nacht Cyclus

- **5 weertypes**: Helder, Regen, Mist, Hittegolf, Storm — elk met gameplay-effecten.
- Stormen blokkeren casino-toegang en verhogen lab-output (1.5x).
- Sluit elke dag af met een **geanimeerd Night Report** met inkomsten, events, productie en onverwachte wendingen.

### 🔥 Heat 2.0 Systeem

Gesplitst in twee categorieën:

| Type | Bronnen | Gevolgen | Verlagen |
|------|---------|----------|----------|
| **Voertuig Heat** | Reizen, handel, bezorgmissies (70%) | Checkpoints, smokkelrisico | Omkatten (3-daagse cooldown) |
| **Persoonlijke Heat** | Geweld, raids, andere missies (70%) | Politie-invallen, district-aanvallen | Onderduiken (-15/dag, +5 met Safehouse) |

Onderduiken blokkeert acties maar verhoogt de kans op district-aanvallen (+25%) en smokkel-interceptie (+15%).

### 👤 Nemesis Systeem

- Een rivaliserende AI-tegenstander die mee-evolueert.
- **Successor-mechanisme**: Tot 5 generaties; verslagen rivalen blijven permanent dood.
- Kracht begrensd op ~85% van spelerstatistieken.
- HP en aanvalskracht schalen per generatie.
- Nemesis kan je villa aanvallen en verschijnt als marker op de kaart.

### 📰 Dynamisch Nieuwssysteem

- Dagelijks 2-3 contextuele nieuwsberichten gebaseerd op de gamestate.
- Categorieën: corruptie, voertuigen, karma, villa-activiteiten, facties.
- Interactieve ticker op de kaart — klik voor uitgebreide details.

### 📱 In-Game Telefoon

- Ontvang berichten van NPC's, facties en informanten.
- Verhaalbogen worden afgehandeld via telefoongesprekken.
- Berichttypen: info, waarschuwing, kans en dreiging.

---

## 🏢 Imperium & Economie

### 🏗️ District Verdediging

Permanente upgrade-boom per veroverd district:

- **Straatpatrouille** — Basis verdediging
- **Muren** — Versterkte bescherming
- **Bewakingscamera's** — Spionage-opties
- **Geschutstoren** — Offensieve verdediging
- **Commandocentrum** — Strategische coördinatie

### 🚢 Smokkelroutes

- Geautomatiseerde routes tussen bezette districten.
- Genereren passief inkomen maar kunnen worden onderschept.
- Visueel weergegeven als stippellijnen op de kaart.

### 🏢 Bedrijven & Witwassen

- Koop dekmantelbedrijven voor passief inkomen en witwascapaciteit.
- **Kogelfabriek**: Speciaal bedrijf dat dagelijks 3 kogels produceert.

### ⚔️ Territoriumoorlogen

- **Kleine aanvallen**: Automatisch afgehandeld in Night Report (oorlogsbuit bij winst).
- **Grote aanvallen (War Events)**: Tactische interventie met drie keuzes:
  - 🛡️ **Verdedigen** (Muscle-check)
  - 🎯 **Hinderlaag** (Brains-check)
  - 🤝 **Onderhandelen** (Charm/Geld)
- Spionage en sabotage beschikbaar; hulp inroepen van geallieerde facties (relatie ≥ 60).

---

## 👥 Facties & Relaties

### Drie Rivaliserende Facties

Elke factie heeft een eigen leider, thuisdistrict en specialiteit:

- **Cartel** — Drugshandel
- **Syndicate** — Georganiseerde misdaad
- **Bikers** — Wapenhandel & intimidatie

### Factie Conquest

Facties veroveren via drie methoden:

1. **Combat** — Versla de factieleider in gevecht.
2. **Diplomatieke Annexatie** — Onderhandel overname.
3. **Vassalisatie** — Neem over als vazal via "NEEM OVER ALS VAZAL".

**Chaos-fase**: Na het verslaan van een leider zonder overname daalt de relatie dagelijks met -2. Na 10 dagen volgt een dreigend telefoonbericht.

Veroverde facties genereren passief inkomen en unieke perks.

### 🤝 NPC Relatiesysteem

Terugkerende personages met relatiestatus (0-100):

| NPC | Beschrijving |
|-----|-------------|
| **Rosa** | Informatiehandelaar |
| **Marco** | Straatcontact |
| **Yilmaz** | Zakelijke connectie |
| **Luna** | Mysterieuze bondgenoot |
| **Krow** | Gevaarlijke kennis |

Hogere relatie-tiers ontgrendelen passieve bonussen.

---

## 🎯 Missies & Operaties

### 📊 Solo Operaties

- Voer operaties uit voor cash, reputatie en XP.
- Schaalbare beloningen tot 3x basiswaarde op basis van level.
- Types variëren van diefstal tot sabotage.

### 📋 Contracten

- Neem contracten aan van facties.
- Beloningen geplafonneerd op 4x op dag 60.
- Beïnvloedt factie-relaties.

### 🎭 Missie Encounters

- Dynamische ontmoetingen tijdens missies: achtervolgingen, verraad, confrontaties.
- Uitkomsten beïnvloed door **karma**, **weer** en **crew-specialisaties**.
- Drie mogelijke uitkomsten per keuze: succes, gedeeltelijk en falen.

### 🎯 Huurmoordenaar (HITS)

- Dagelijkse contracten op NPC's (Luitenants, VIP's, Verraders).
- Slagingskans gebaseerd op stats en gear.
- Verbruikt munitie (3-8 kogels per hit).
- **Meedogenloos karma**: +15% bonus op hit-beloningen.

### 🏦 Heist Planning

- Interactief planningsbord met drie crew-rollen.
- Hybride uitvoering: automatische skill-checks + kritieke keuzemomenten.
- Vereist voorafgaande verkenning en specifieke uitrusting.
- Schaarse beschikbaarheid met cooldown-periode.
- Significante impact op factie-reputatie.

### 📅 Dagelijkse Uitdagingen

- Drie unieke uitdagingen per dag over zes categorieën: Handel, Gevecht, Imperium, Sociaal, Stealth, Rijkdom.
- Voortgang bijgehouden in de 'DOEL' tab van het missiescherm.
- Beloningen: geld, XP en reputatie.

---

## 🚗 Voertuigen & Chop Shop

### 🚙 Voertuigsysteem

- Koop voertuigen met variërende stats: opslag, snelheid, pantser en charm.
- **Upgrade-systeem** met drie categorieën:
  - 🛡️ **Pantser** — Schadereductie in combat/raids
  - ⚡ **Snelheid** — Lagere reiskosten, hogere ontsnappingskans (level 4+: halveert reisheat)
  - 📦 **Opslag** — Extra inventarisruimte
- Dynamische SVG-preview in de garage toont upgrade-levels en heat-status (Safe/Warning/Critical).

### 🔧 Chop Shop (Iron Borough)

- **Auto's stelen** via willekeurige ontmoetingen (4 zeldzaamheidsniveaus).
- **Omkatten** — Status reset (3-daagse cooldown).
- **Tunen** — Waarde verhogen via upgrades (verf, motor, interieur, bodykit, nitro).
- **Verkopen** — Op de zwarte markt of via NPC-orders voor extra bonus.
- **Auto Crusher** — Sloop auto's voor munitie (3-18 kogels, afhankelijk van zeldzaamheid/conditie).

---

## 🕵️ Corruptie & Onderwereld

### 👔 Corruptie Netwerk

Rekruteer corrupte ambtenaren via de Imperium-tab:

| Type | Voorbeeld | Voordeel |
|------|-----------|----------|
| **Agent** | Politie-infiltrant | Heat-reductie |
| **Detective** | Corrupte rechercheur | Raid-bescherming |
| **Rechter** | Omgekochte magistraat | Lagere boetes |
| **Politicus** | Wethouder | Handelsbonus |
| **Douanier** | Haven-ambtenaar | Smokkel-bescherming |
| **Advocaat** | Mr. Vermeer | Halveert arrestatiekans |

- Vereist wekelijkse betalingen; wanbetaling verhoogt verraadkans.
- Bij extreme heat kunnen contacten je verraden.

### ⛓️ Gevangenis Systeem

- **Arrestatie**: 30% kans bij heat > 60 (politie-inval) of 15-25% bij mislukte missies.
- **Straf**: 1-7 dagen op basis van heat-niveau.
- **Verliezen**: 20% legaal geld, alle dirty money, alle illegale goederen.
- **Opties**:
  - 💰 **Omkoping** — €5.000/dag voor directe vrijlating
  - 🏃 **Ontsnapping** — Brains skill-check (succes: +15 heat; falen: +2 dagen straf)
- Na volledige straf: alle heat reset naar 0.

---

## 📖 Verhaal & Narratief

### 🎭 Achtergrondkeuze

Bij de start kies je een van drie achtergronden:

| Achtergrond | Startbonus | Verhaallijn |
|-------------|-----------|-------------|
| **De Weduwnaar** | Kracht | Wraak |
| **De Gevallen Bankier** | Vernuft | Schuld |
| **Het Straatkind** | Charisma | Loyaliteit |

Elke achtergrond ontgrendelt een exclusieve verhaalboog verweven met de hoofdverhaallijn.

### ☯️ Karma Systeem (-100 tot +100)

| Alignment | Voordelen |
|-----------|----------|
| **Meedogenloos** (< -30) | +Intimidatie-opbrengsten, +reputatie-winst, schadereductie via "fear factor", +15% hit-bonussen |
| **Eerbaar** (> +30) | Sneller crew-herstel, lagere politie-invalkans, extra heat-afname, minder crew-schade, betere handelsprijzen |

Karma beïnvloedt NPC-relaties en ontgrendelt exclusieve keuzes (schild- of vlam-icoon).

### 📚 Verhaalbogen

- Multi-dag verhaallijnen die via de telefoon worden afgehandeld.
- Voortgang zichtbaar in de 'BOGEN' tab van het Profiel.
- Inclusief tijdlijn, historisch overzicht en unlock-vereisten.
- District-specifieke verhaallijnen activeren bij aankoop van een district.

### 🔮 Flashback Systeem

Na belangrijke mijlpalen verschijnt een cinematische "Consequence Flashback" die eerdere keuzes en hun gevolgen recapituleert via typewriter-effect.

### 🎲 District-Specifieke Events

50% kans op locatiespecifiek event bij dagovergang:

- **Port Nero** — Havengebeurtenissen
- **Crown Heights** — Financiële incidenten
- **Iron Borough** — Industriële acties
- **Lowrise** — Straatcultuur
- **Neon Strip** — Gokgerelateerde events

---

## 🏆 Progressie & Endgame

### 📈 Rangsysteem

Stijg in rang van **Straatrat** tot **Kingpin**. Verdien achievements en ontgrendel nieuwe mogelijkheden.

### 🏅 Achievements

Geanimeerd achievement-systeem met popups bij het behalen van mijlpalen.

### 🎖️ Endgame Progressie

Vijf fasen van opkomst:

1. **Straatdealer** — Begin
2. **Wijkbaas** — Eerste territorium
3. **Districtheerser** — Meerdere districten
4. **OnderwereldsKoning** — Factie-dominantie
5. **Noxhaven Baas** — Ultieme macht

### 🗡️ Eindgevecht

Twee-fase baasgevecht:

1. **Fase 1**: SWAT-Commandant Voss
2. **Fase 2**: Commissaris Decker

- Inclusief dynamische gevechtsdialoog.
- Permanente **DECKER-knop** op de kaart zodra de finale beschikbaar is.
- Na overwinning: resultaatoverzicht met ranking (S-D rang).
- Keuze: **Vrij Spelen** of **New Game+**.

---

## 🎨 UI & Feedback

### Statusbalk

Compacte header met gelabelde Resource Tiles: REP, LVL, KOGELS, HEAT, KARMA, SCHULD. Bijna alle tegels zijn interactief (skill-verdeling, munitie-aankoop, omkoping).

### Navigatie

5 primaire tabs permanent onderaan: **KAART · HANDEL · MISSIES · IMPERIUM · PROFIEL**.

### Visuele Feedback

- Geanimeerd Night Report met dramatische onthullingen.
- Typewriter-effecten voor narratieve momenten.
- Zwevende reward-popups bij beloningen.
- Screen-shake en blood-flashes in gevechten.
- Procedurele audio-engine voor gevechten, handel en verhaal.

### Onboarding

Verhalende proloog gevolgd door een 10-stappen tutorial die alle kernmechanieken behandelt.

---

## 🛠️ Tech Stack

| Technologie | Doel |
|-------------|------|
| **React 18** | UI framework |
| **TypeScript** | Type-safe development |
| **Vite** | Build tool & dev server |
| **Tailwind CSS** | Utility-first styling |
| **Framer Motion** | Animaties & transities |
| **shadcn/ui** | UI componenten |
| **TanStack Query** | Data management |
| **Recharts** | Prijsgrafieken & statistieken |
| **localStorage** | Persistentie met versiebeheer |

---

## 🚀 Lokaal draaien

```bash
# Clone het project
git clone <repository-url>
cd noxhaven

# Installeer dependencies
npm install

# Start de dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in je browser.

---

## 📱 Ontworpen voor mobiel

Noxhaven is geoptimaliseerd voor mobiele schermen (max 600px breed), maar speelbaar op elk apparaat. De dark crime-noir esthetiek met goud- en bloed-accenten, noise-texturen en Cinzel-typografie creëert een meeslepende onderwereldervaring.

---

<p align="center">
  <em>De straten van Noxhaven wachten. Hoeveel bloed ben jij bereid te vergieten?</em>
</p>
