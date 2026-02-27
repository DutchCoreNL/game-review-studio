

## Plan: Popup Sidebar Navigation

### Probleem nu
De 5 hoofd-tabs bevatten elk te veel sub-tabs:
- **MISSIES**: 9 sub-tabs (Solo, Contracts, Crew, Hits, Heists, Bounties, Wanted, Challenges, PvP)
- **HANDEL**: 8 sub-tabs (Markt, Analyse, Globaal, Veiling, Beurs, Witwas, Gear, Log)
- **IMPERIUM**: 7 sub-tabs (Garage, Business, Facties, Gang, Oorlog, Wijken, Corruptie)
- **PROFIEL**: 12 sub-tabs (Stats, Skills, Loadout, NPCs, Reputatie, Bogen, Trofeeën, Online, Mail, Imperium, Settings, Admin)

### Nieuwe indeling — Sidebar met categorieën

```text
┌──────────────────────────┐
│  NOXHAVEN     Dag 42  ✕  │
│──────────────────────────│
│  🗺  STAD                │
│     Kaart                │
│     Casino               │
│     Ziekenhuis           │
│     Safehouse            │
│     Villa                │
│──────────────────────────│
│  ⚔  ACTIES               │
│     Operaties            │
│     Contracten           │
│     Heists               │
│     Bounties             │
│     PvP                  │
│     Dagelijks            │
│──────────────────────────│
│  💰 HANDEL               │
│     Markt                │
│     Analyse              │
│     Veiling              │
│     Beurs                │
│     Witwassen            │
│     Gear                 │
│──────────────────────────│
│  👥 CREW & OORLOG        │
│     Crew                 │
│     Facties              │
│     Gang                 │
│     Oorlog               │
│     Corruptie            │
│──────────────────────────│
│  🏛  IMPERIUM             │
│     Business             │
│     Garage               │
│     Wijken               │
│──────────────────────────│
│  👤 PROFIEL              │
│     Stats & Skills       │
│     Loadout              │
│     NPC Relaties         │
│     Reputatie            │
│     Story Arcs           │
│     Trofeeën            │
│     Leaderboard          │
│     Berichten            │
│     Instellingen         │
│──────────────────────────│
│  🛡  ADMIN (als admin)    │
└──────────────────────────┘
```

### Technische aanpak

1. **Nieuw `GameView` type uitbreiden** — `src/game/types.ts`  
   Voeg alle directe views toe als eigen `GameView` waarden (bijv. `'casino'`, `'safehouse'`, `'villa'`, `'heists'`, `'bounties'`, `'pvp'`, `'crew'`, `'garage'`, `'business'`, etc.) zodat elke sidebar-entry direct een view opent zonder sub-tab logica.

2. **Nieuw component: `GameSidebar.tsx`**  
   - Gebruikt de bestaande `Sheet` component (slide-in van links)
   - Gegroepeerde menu-items met iconen en categorie-headers
   - Badge counts per item (bestaande logica hergebruiken)
   - Sluit automatisch bij selectie
   - Geopend via een hamburger-knop in de `GameHeader`

3. **`GameHeader.tsx` aanpassen**  
   - Hamburger menu-knop toevoegen (linksboven)
   - Sidebar open/close state beheren

4. **`GameNav.tsx` vervangen**  
   - De bottom nav bar wordt vervangen door een minimale bar met max 4-5 snelkoppelingen (Kaart, Acties, Handel, Imperium, Menu) OF wordt volledig verwijderd ten gunste van alleen de sidebar

5. **`DesktopSidebar.tsx` aanpassen**  
   - Desktop sidebar krijgt dezelfde gecategoriseerde structuur
   - Altijd zichtbaar op desktop, collapsible naar iconen

6. **View routing in `GameLayout.tsx` aanpassen**  
   - De `views` record uitbreiden met alle nieuwe directe views
   - Sub-views als Casino, Villa, Safehouse uit MapView halen naar eigen top-level views
   - Bestaande sub-tab componenten hergebruiken als standalone views

7. **Bestaande sub-tab views vereenvoudigen**  
   - `OperationsView`, `TradeView`, `ImperiumView`, `ProfileView` worden ofwel gesplitst in aparte views, ofwel behouden als container maar met minder sub-tabs doordat items nu direct bereikbaar zijn via de sidebar

### Aanpak voor bottom nav (mobiel)

De bottom nav blijft bestaan maar wordt vereenvoudigd tot 4 items + menu-knop:
```text
[ 🗺 Kaart | ⚔ Acties | 💰 Handel | 🏛 Imperium | ☰ Menu ]
```
De "Menu" knop opent de volledige sidebar sheet. Profiel en andere secties zijn dan via het menu bereikbaar.

