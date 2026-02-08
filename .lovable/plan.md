
# Verhaal Verdieping voor Noxhaven: Blood & Empire

Het spel heeft al een solide basis met 3 verhaalbogen (De Informant, Het Erfenis-mysterie, De Rivaal), 20+ straatgebeurtenissen, en een Nemesis-systeem. Hier zijn concrete voorstellen om het narratieve aspect significant te versterken.

---

## 1. Persoonlijk Verleden & Herkomst (Proloog Keuze-systeem)

Bij het starten van een nieuw spel kiest de speler een achtergrondverhaal. Dit beinvloedt startbonussen, unieke dialoogopties en welke verhaalbogen eerder beschikbaar worden.

**Drie achtergronden:**
- **De Weduwnaar** -- Je partner is vermoord door de politie. Je wilt wraak. Start met +3 Kracht, lagere politierelatie, en unieke wraak-verhaalboog.
- **De Gevallen Bankier** -- Je verloor alles door een corrupte deal. Start met +3 Vernuft, extra startgeld, en een unieke schuld-verhaalboog.
- **Het Straatkind** -- Opgegroeid in Lowrise, niks te verliezen. Start met +3 Charisma, extra reputatie, en een unieke loyaliteits-verhaalboog.

Elke achtergrond ontgrendelt 1 exclusieve verhaalboog (4-5 stappen) die verweven is met de hoofdverhaallijn.

---

## 2. NPC Relatie-systeem met Terugkerende Personages

In plaats van eenmalige ontmoetingen, introduceren we terugkerende NPC's die een relatie met de speler opbouwen.

**5 Kernpersonages:**
- **Rosa** (Barvrouw in Neon Strip) -- Geeft tips, wordt romantische interesse of zakenpartner afhankelijk van keuzes.
- **Oude Marco** (Gepensioneerde mafioso in Lowrise) -- Mentor-figuur. Deelt wijsheid en soms wapens.
- **Inspecteur Yilmaz** (Eerlijke politieagent) -- Tegenstander die je kunt corrumperen of respecteren. Beinvloedt het eindgevecht.
- **Luna** (Straatkind/informant) -- Groeit op naarmate het spel vordert. Wordt uiteindelijk een potentieel crewlid.
- **Viktor Krow** (Uit de bestaande Rivaal-boog) -- Wordt uitgebreid tot een terugkerend personage, ook na de boog.

Elke NPC heeft een relatiewaarde (0-100) die stijgt/daalt op basis van keuzes, en verandert dialogen en beschikbare opties.

---

## 3. Morele Keuzes met Gevolgen (Karma-systeem)

Een verborgen karma-meter die de toon van het spel beinvloedt.

**Hoe het werkt:**
- Keuzes in events en verhaalbogen verschuiven je karma richting "Meedogenloos" of "Eerbaar".
- Karma beinvloedt: welke crew je kunt rekruteren, factie-reacties, NPC-dialogen, en het einde van het spel.
- Geen "goed" of "fout" -- beide paden hebben unieke voordelen en verhaallijnen.

**Voorbeelden:**
- Meedogenloos: hogere fear-rep, goedkopere intimidatie, maar verraad-risico van crew stijgt.
- Eerbaar: loyalere crew, betere politierelatie, maar minder inkomen van illegale activiteiten.

---

## 4. District-specifieke Verhaallijnen

Elk van de 5 districten krijgt een eigen korte verhaallijn (3 stappen) die activeert wanneer je het district koopt. Dit geeft elk district meer persoonlijkheid.

**Voorbeelden:**
- **Port Nero: "De Verdwenen Lading"** -- Een mysterieuze container verschijnt in de haven. Wat zit erin? Drugs, wapens, of iets veel ergers?
- **Crown Heights: "De Gouden Gijzeling"** -- Een bankiersdochter is ontvoerd. Red je haar, of eis je een deel van het losgeld?
- **Iron Borough: "De Fabrieksbrand"** -- Een explosie onthult een ondergronds tunnelnetwerk. Wie heeft het gebouwd?
- **Lowrise: "Het Kind van de Straat"** -- Een weeskind steelt van je. Straf je hem, of neem je hem onder je hoede?
- **Neon Strip: "De Valse Jackpot"** -- Het casino wordt gebruikt voor geldwitwassen door een onbekende organisatie. Neem je het over?

---

## 5. Consequentie-Flashbacks

Na grote beslissingen (verhaalboog-afronding, factie-verovering, nemesis-gevecht) verschijnt een korte "flashback" scene die laat zien hoe je eerdere keuzes tot dit moment hebben geleid. Dit versterkt het gevoel dat keuzes ertoe doen.

**Implementatie:**
- Een FlashbackOverlay component die 2-3 regels toont als een filmische herinnering.
- Getriggerd door milestone-momenten.
- Verwijst naar specifieke keuzes die de speler eerder maakte.

---

## Aanbevolen Implementatievolgorde

1. **District-verhaallijnen** -- Meest directe impact, bouwt voort op het bestaande story-arc systeem.
2. **Terugkerende NPC's** -- Voegt diepte toe aan de wereld en maakt events persoonlijker.
3. **Persoonlijk Verleden** -- Verandert het begin van het spel en voegt herhaalspeelwaarde toe.
4. **Morele Keuzes** -- Subtiel systeem dat geleidelijk impact heeft.
5. **Consequentie-Flashbacks** -- Polijstlaag die alles samenvoegt.

---

## Technisch Overzicht

- **Nieuwe bestanden:** `src/game/backstory.ts`, `src/game/npcs.ts`, `src/game/districtStories.ts`, `src/components/game/BackstorySelection.tsx`, `src/components/game/FlashbackOverlay.tsx`
- **Bestaande wijzigingen:** `types.ts` (nieuwe state velden), `storyArcs.ts` (nieuwe bogen), `constants.ts` (NPC definities), `GameContext.tsx` (nieuwe actions), `engine.ts` (karma/relatie processing)
- Het story-arc systeem (`StoryArcTemplate`, `StoryArcStep`, `StoryArcChoice`) wordt hergebruikt voor alle nieuwe verhaallijnen, waardoor de bestaande popup-UI en logica direct werken.
