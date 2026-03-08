

# MMO Systeem Verbeteringen — Analyse & Plan

## Huidige MMO Staat

Het MMO-systeem bevat:
- **World Raids** — Co-op bossfights met gedeelde HP, damage leaderboard, 48u reset
- **Activity Feed** — Realtime stream van speler-acties per district
- **Online Players** — Heartbeat-systeem met 60s interval, weergave per district
- **Smuggle Routes** — Gang-smokkelroutes met capaciteit en risico
- **Gang Alliances** — Diplomatieke pact-systeem met gedeelde verdediging
- **Chat** — 4 kanalen (Global, Trade, Gang, District) met realtime sync
- **Tribunal** — Speler-gerund rechtssysteem
- **Undercover** — Factie-infiltratie met cover integrity
- **Mollen** — Spionage in rivaliserende gangs
- **Player Titles** — 10 titels met achievement-vereisten
- **Co-op Heists** — Sessie-gebaseerde gang-heists met rolverdeling

## Verbetermogelijkheden

### 1. Territory War Heatmap (Visueel)
De CityMap toont gang-territoria maar mist dynamiek. Een live heatmap die gang-activiteit, aanvallen en invloed visueel toont per district — met kleurintensiteit die verandert op basis van recente acties.
- Gloeiende randen rond betwiste districten
- Pulse-animaties bij actieve oorlogen
- Kleur-codering per dominante gang

### 2. Bounty Hunter Leaderboard
Er is een Most Wanted systeem maar geen dedicated "koppensneller" ranking. Voeg een leaderboard toe voor spelers die de meeste bounties claimen, met wekelijkse resets en exclusieve titels.
- Top 3 krijgen "Koppensneller" titel en bonus
- Wekelijkse reset met seizoens-tracking

### 3. Cross-Gang Events (Seizoensgebonden)
Huidige wekelijkse events zijn simpele modifiers. Voeg grotere seizoensgebonden competities toe waar alle gangs strijden om een gezamenlijk doel — bijv. "De Haven Blokkade" (alle gangs moeten samenwerken of concurreren om Port Nero).
- Seizoens-timer (7-14 dagen)
- Gang-scoreboard per event
- Unieke beloningen per seizoen

### 4. Reputation Echo Visualisatie
Het Reputation Echo systeem bestaat server-side maar mist een visuele UI-component. Toon per district hoe NPCs op de speler reageren op basis van eerdere acties — met visuele indicatoren (vijandig, neutraal, gerespecteerd).

### 5. Live Duel Arena
PvP bestaat maar is asynchroon. Voeg een real-time duel arena toe waar spelers elkaar kunnen uitdagen voor directe 1v1 gevechten met toeschouwers.
- Uitdagingssysteem via chat
- Live turn-based combat met realtime updates
- Toeschouwers kunnen wedden

### 6. Gang HQ Dashboard Upgrade
Gang management mist een centraal overzicht. Voeg een HQ dashboard toe met:
- Live member status (online/offline/in gevecht)
- Treasury grafiek (inkomsten/uitgaven over tijd)
- Gezamenlijke doelen/quests tracker
- War room met strategische kaart

### 7. Market Notification System
De markt mist prijswaarschuwingen. Laat spelers alerts instellen voor specifieke goederen wanneer prijzen boven/onder een drempel komen.
- Push-notificaties in de activity feed
- Max 5 actieve alerts per speler

---

## Aanbevolen Prioritering

| # | Feature | Impact | Complexiteit |
|---|---------|--------|-------------|
| 4 | Rep Echo Visualisatie | Hoog — bestaand systeem zichtbaar maken | Laag |
| 1 | Territory War Heatmap | Hoog — visuele verbetering kaart | Medium |
| 6 | Gang HQ Dashboard | Hoog — centraal gang-overzicht | Medium |
| 2 | Bounty Hunter Board | Medium — extra competitie | Laag-Medium |
| 7 | Market Notifications | Medium — QoL handelen | Medium |
| 3 | Cross-Gang Seizoenen | Hoog — langetermijn engagement | Hoog |
| 5 | Live Duel Arena | Hoog — real-time PvP | Hoog |

Alle UI-wijzigingen zijn client-side. Territory Heatmap en Rep Echo gebruiken bestaande data. Cross-Gang Events en Live Duels vereisen server-side uitbreidingen (edge functions + database).

