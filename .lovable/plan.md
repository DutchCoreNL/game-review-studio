

## Analyse: Huidig Kogelsysteem vs. MMO Mafia Games

### Hoe het werkt in klassieke text-based mafia MMOs (Torn City, MafiaMatrix, TheMafiaLife):

1. **Ammo is niet per type** — je koopt simpelweg "bullets" of "rounds" als universele munitie
2. **Elke aanval kost energie (niet ammo)** — ammo is gebonden aan het *wapen*, niet aan de actie
3. **Wapens hebben durability/uses** — een wapen gaat kapot na X aanvallen, niet de munitie
4. **Ammo is schaars en waardevol** — het is een serieuze economische sink, verhandelbaar op de markt
5. **Speciale munitie** geeft bonuseffecten (armor piercing, hollowpoints, tracer rounds)

### Problemen met het huidige systeem:

- **3 ammo types (9mm, 7.62mm, shells)** is onnodig complex voor een text-based game — spelers moeten steeds de juiste type bijhouden
- **Flat kogelverbruik** (1 per aanval, 2 per heavy) is te simpel en maakt ammo onbelangrijk
- **Max 99 per type** is te laag voor MMO-schaal
- **Ammo factory** produceert maar 3-5/dag — te weinig om relevant te zijn
- **Geen speciale munitie** — geen strategische keuze
- **PvP combat (`combatSkills.ts`)** gebruikt helemaal GEEN ammo — skills kosten 0 energy/ammo
- **Villa wapenkamer** beschermt ammo maar het systeem is te simpel

### Plan: MMO-Waardig Kogelsysteem

#### 1. Vereenvoudig naar één universeel ammo type + speciale rounds
- Verwijder 9mm/7.62mm/shells onderscheid
- Eén "Kogels" counter (max 500)
- **3 speciale ammo types** als consumables: 
  - **Armor Piercing** (negeert 50% armor, +20% kosten)
  - **Hollowpoints** (1.5x schade vs onbeschermde, -50% vs armor)
  - **Tracer Rounds** (+15% accuracy, onthult vijand locatie)

#### 2. Wapen-gebonden clip/magazine systeem
- Elk wapen heeft een `clipSize` (al aanwezig in data)
- Tijdens gevecht: wapen verbruikt uit geladen clip
- **Reload-actie** in combat (kost 1 beurt, laadt clip vol uit ammo voorraad)
- Lege clip = gedwongen melee (50% damage penalty, al geïmplementeerd)

#### 3. Ammo als echte economische sink
- Verhoog max naar 500
- Ammo factory: 10-25/dag afhankelijk van level
- **Ammo verhandelbaar** op P2P markt (al deels in constants)
- Combat skills kosten ammo (niet 0 zoals nu)

#### 4. PvP ammo integratie
- `pvpCombatTurn()` in `combatSkills.ts` moet ammo verbruiken
- Skills met `type: 'damage'` kosten 1-3 ammo
- Skills met `type: 'multi_hit'` kosten ammo per hit
- Combo finisher kost 3 ammo

### Bestanden die aangepast worden:

| Bestand | Wijziging |
|---|---|
| `src/game/types.ts` | Vereenvoudig `AmmoType`, voeg `SpecialAmmoType` toe, voeg `clipLoaded` aan combat state |
| `src/game/constants.ts` | Universeel ammo, speciale munitie definitie, hogere caps, skill ammo costs |
| `src/game/combatSkills.ts` | `energyCost` → ammo cost per skill, reload action, clip systeem |
| `src/game/engine.ts` | Clip/reload in PvE combat, vereenvoudigde ammo checks |
| `src/game/villa.ts` | Hogere ammo opslag caps |
| `src/components/game/trade/GearPanel.tsx` | Vereenvoudigde ammo UI, speciale munitie selector |
| `src/components/game/CombatView.tsx` | Clip indicator, reload knop, speciale ammo indicator |
| `supabase/functions/game-action/index.ts` | Server-side ammo validatie vereenvoudigen |

### Migratieplan:
- `ammoStock` → enkele `ammo: number` (backwards compatible, veld bestaat al)
- Legacy `ammoStock` waarden optellen naar één totaal
- Database: `ammo_stock` kolom behouden maar niet meer per-type gebruiken

