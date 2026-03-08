

# AI Bot Verbeteringen — Meer Realistische Spelers

## Huidige Status

Het bot-systeem heeft **38+ simulatiefuncties** die de meeste systemen dekken. Maar er zijn significante gaten en verbeterpunten die bots onrealistisch maken.

## Wat Ontbreekt

### 1. Bots sturen geen directe trade offers naar spelers
Bots plaatsen markt-listings maar sturen nooit `trade_offers` aan echte spelers. Echte spelers handelen direct — bots zouden dit ook moeten doen.

### 2. Bots hebben geen Reputation Echo
`player_reputation_echo` wordt gebruikt door het AI-verhaalsysteem en NPC-reacties, maar bots bouwen geen reputatie op per district. Dit maakt ze onzichtbaar in het reputatiesysteem.

### 3. Bots racen niet
Er is geen `simulateBotRacing` — races en leaderboards zien er leeg uit qua bot-activiteit. Bots zouden activity feed entries moeten genereren over races.

### 4. Bots doen geen education/cursussen
`player_education` wordt niet bevolkt door bots. Echte spelers zien geen bot-activiteit bij cursussen.

### 5. Bot chat is niet contextueel
Chat-berichten zijn statische templates. Bots reageren niet op wat er daadwerkelijk in de wereld gebeurt (lopende gang wars, actieve raids, markttrends).

### 6. Bots hebben geen personality/gedragsprofielen
Alle bots gedragen zich identiek — zelfde kansen, zelfde patronen. Echte spelers hebben verschillende speelstijlen.

### 7. Bots verlaten/joinen nooit gangs dynamisch
`ensureBotGangs` maakt initiële gangs, maar bots wisselen nooit van gang, worden nooit gekickt, of joinen andere gangs.

### 8. Bot PvP is oppervlakkig
`simulateBotPvP` maakt alleen een rivalry-record + activity feed, maar start geen echte `pvp_combat_sessions`. Spelers zien nooit echte gevechtsresultaten.

## Implementatieplan

### A. Bot Personality System (nieuw)
Voeg een `personality` veld toe aan `bot_players` met types: `aggressive`, `trader`, `social`, `stealthy`. Dit beïnvloedt:
- Welke acties ze vaker doen (aggressive = meer fights/pvp, trader = meer market/trades)
- Chat-stijl en frequentie
- Karma-richting (aggressive gaat negatief, social gaat positief)

**Implementatie**: Database migratie voor `personality` kolom + logica in `simulateBots` die `BOT_ACTIONS` weights aanpast per personality.

### B. Contextuele Bot Chat
Bots lezen actieve game-events en reageren erop:
- Actieve gang war → "Die oorlog tussen [X] en [Y] is heftig, kies je kant!"
- World raid bijna down → "Die boss heeft nog maar 15% HP, laten we finishen!"
- Marktprijs-spike → "Drugs zijn 40% duurder geworden, goed moment om te verkopen"
- Iemand op leaderboard passeert → "GG [naam], rank #3 nu!"

**Implementatie**: Query actieve events/raids/prices in `simulateBotChat`, genereer dynamische berichten.

### C. Bot Direct Trade Offers
Bots sturen trade offers naar echte spelers met interessante deals:
- Koppel aan bot personality (traders doen dit vaker)
- Bied items aan onder marktprijs (5-15% korting)
- Auto-expire na 2 uur

**Implementatie**: Nieuwe `simulateBotTradeOffers` functie die `trade_offers` inserts.

### D. Bot Reputation Echo
Bots bouwen reputatie op per district gebaseerd op hun acties:
- Fights → violence+
- Trades → trade_trust+
- Gang loyalty → loyalty+
- Crimes → stealth+

**Implementatie**: Nieuwe `simulateBotReputationEcho` die `player_reputation_echo` upserts.

### E. Bot Racing Activity
Bots genereren race-gerelateerde activity feed entries en nieuws. Geen echte race-records nodig, maar zichtbare activiteit.

**Implementatie**: Nieuwe `simulateBotRacing` met activity feed + news entries.

### F. Bot Gang Dynamiek
- Bots kunnen van gang wisselen (5% kans per tick als loyalty < 30)
- Bots kunnen gangs verlaten na een verloren gang war
- Activity feed: "[Bot] heeft [Gang] verlaten!"

**Implementatie**: Uitbreiding van `ensureBotGangs` met churn-logica.

### G. Bot Education
Bots schrijven zich in voor cursussen en voltooien ze over tijd.

**Implementatie**: Nieuwe `simulateBotEducation` die `player_education` inserts en updates.

### H. Bot PvP Resultaten in Activity Feed
Maak bot PvP zichtbaarder met gedetailleerde resultaatberichten en win/loss stats.

**Implementatie**: Uitbreiding van `simulateBotPvP` met meer gedetailleerde activity feed entries.

---

## Bestanden

| Wijziging | Bestand |
|-----------|---------|
| Personality kolom | Database migratie |
| Alle bot-simulatie functies | `supabase/functions/world-tick/index.ts` |

Alle wijzigingen zitten in één bestand (`world-tick/index.ts`) plus een kleine database migratie.

