

## Analyse: Wat het spel al heeft vs. wat ontbreekt

Na het doorlopen van de volledige codebase (1224 regels types, 45+ game-modules, 60+ componenten) heeft het spel al een indrukwekkende breedte: trading, PvP, gangs, facties, nemesis, villa, drug empire, corruptie, bounties, beurs, veilingen, racing, crafting, heists, organized crimes, skill tree, karma, backstory, gevangenis, world raids, smokkelroutes, chat, leaderboard, daily challenges, week events, en news.

Wat **geen enkel** vergelijkbaar spel (Torn, Mafia Wars, Crime Inc, etc.) heeft:

---

### 1. AI-Gegenereerde Persoonlijke Verhaallijn
Gebruik een LLM (Gemini via Lovable AI) om **unieke narratieve events** te genereren op basis van de specifieke geschiedenis van elke speler. Geen vaste templates meer, maar dynamische verhalen die verwijzen naar jouw eerdere keuzes, rivalen, en gang-geschiedenis.

**Voorbeeld:** *"Marco herinnert zich hoe je vorige week zijn rivaal hebt verraden in Iron District. Hij biedt je een deal aan die alleen jij kunt krijgen..."*

**Technisch:**
- Edge function `generate-story` die speler-context (backstory, karma, recente acties, gang, nemesis) naar Gemini stuurt
- Resultaat wordt opgeslagen als `personal_story_event` en getoond als popup
- 1x per game-dag, per speler, met cooldown

---

### 2. Informant & Mol Systeem
Plant een **spion** in een rivaliserende gang. Je ontvangt geheime intel over hun treasury, oorlogsplannen, en smokkelroutes. Maar er is een kans dat je mol ontdekt wordt, wat leidt tot een gang war of bounty op jouw hoofd.

**Voorbeeld:** Je plant een mol bij "Los Serpientes". Na 3 dagen ontvang je: *"Je mol meldt: ze plannen een aanval op Port District morgen. Treasury: €45.000."*

**Technisch:**
- Database: `gang_moles` tabel (player_id, target_gang_id, planted_at, discovered, intel_reports)
- `game-action`: `plant_mole`, `extract_mole` handlers
- `world-tick`: Dagelijkse detectie-check (hoger bij actievere gangs)
- Ontdekking triggert automatisch een bounty of oorlogsverklaring

---

### 3. Ondergronds Tribunaal (Speler-gerechtshof)
Een **speler-gerund rechtssysteem** waar de community andere spelers kan aanklagen voor "misdaden" (scamming in trades, verraad, gang-hopping). Een jury van willekeurige spelers stemt, en de uitspraak heeft echte game-gevolgen.

**Voorbeeld:** *"Speler DarkViper wordt beschuldigd van gang-verraad. 7 juryleden stemmen: SCHULDIG. Straf: 48 uur trade-ban + 500 rep verlies."*

**Technisch:**
- Database: `tribunal_cases` (accuser, accused, charge, evidence, jury_votes, verdict, punishment)
- Jury wordt random geselecteerd uit spelers level 5+ die niet in dezelfde gang zitten
- Straffen: trade-ban, rep-verlies, bounty, tijdelijke stat-nerf
- UI: Tribunaal-tab met lopende zaken, stemmen, en uitspraken

---

### 4. Reputatie Echo Systeem
Jouw acties creeren een **permanente reputatie-schaduw** die door de hele stad resoneert. NPCs, handelaren, en zelfs politie reageren anders op je op basis van je volledige actiegeschiedenis, niet alleen je huidige karma.

**Voorbeeld:** Je hebt 3 keer dezelfde NPC geholpen → hij geeft je exclusieve kortingen. Je hebt Iron District 5x bestolen → handelaren daar verhogen hun prijzen voor jou met 15%.

**Technisch:**
- Database: `player_reputation_echo` (player_id, district_id, category, score, events_log)
- Categorieen: `violence`, `trade_trust`, `loyalty`, `stealth`, `generosity`
- Effecten op: prijzen, NPC-reacties, missie-opties, gang-recruitment acceptatie
- Wordt berekend in `world-tick` op basis van recente acties

---

### 5. Undercover Infiltratie Missies
Ga **undercover** in een rivaliserende factie of gang met een valse identiteit. Je krijgt toegang tot hun exclusieve missies en resources, maar moet je dekmantel bewaren door hun opdrachten uit te voeren. Eén verkeerde actie en je bent ontmaskerd.

**Voorbeeld:** Je infiltreert het Kartel. Je krijgt hun missies, maar moet af en toe drugs voor hen vervoeren. Na 5 succesvolle dagen kun je hun geheime wapenvoorraad stelen en vluchten.

**Technisch:**
- GameState uitbreiding: `undercoverMission: { targetFaction, coverIntegrity (0-100), daysActive, intelGathered }`
- Elke actie in het openbaar (chat, PvP tegen hun leden) verlaagt `coverIntegrity`
- Bij 0% → ontmaskerd → automatische bounty + factie-relatie naar -100
- Succesvolle extractie → grote beloning + gestolen intel

---

### Prioriteit & Impact

| Feature | Innovatie | MMO-waarde | Complexiteit |
|---------|-----------|------------|-------------|
| AI Persoonlijke Verhaallijn | Zeer hoog | Hoog | Medium |
| Informant & Mol | Hoog | Zeer hoog | Medium |
| Ondergronds Tribunaal | Zeer hoog | Hoog | Hoog |
| Reputatie Echo | Hoog | Medium | Medium |
| Undercover Infiltratie | Zeer hoog | Hoog | Hoog |

### Aanbevolen volgorde
1. **Informant & Mol** — Direct multiplayer-impact, relatief eenvoudig
2. **AI Verhaallijn** — Unieke selling point, al LLM-integratie beschikbaar
3. **Reputatie Echo** — Verdiept bestaande systemen
4. **Undercover Infiltratie** — Complexe maar unieke gameplay loop
5. **Ondergronds Tribunaal** — Vereist kritische massa aan spelers

