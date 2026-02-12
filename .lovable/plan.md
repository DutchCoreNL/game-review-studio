

# Wapen-aanpassingen: Blade wordt Melee + Sniper Toevoegen

## Wijzigingen t.o.v. het eerder goedgekeurde munitieplan

### 1. El Serpiente's Blade — Melee wapen (geen munitie)
De Blade is een legendarisch zwaard/machete en gebruikt dus **geen kogels**. In het nieuwe munitiesysteem krijgt dit wapen:
- `ammoType: null` (melee)
- `clipSize: 0` (n.v.t.)
- In combat: onbeperkte aanvallen, geen herladen nodig
- Melee-penalty vervalt (dit IS het melee-wapen, dus volle schade)
- Beschrijving wordt: "+8 Kracht. Legendarisch zwaard van El Serpiente. Geen munitie nodig."

### 2. Nieuw wapen: Dragunov Sniper
Een high-end snipergeweer wordt toegevoegd als nieuw eindgame-wapen:

| Eigenschap | Waarde |
|---|---|
| ID | `sniper` |
| Naam | Dragunov SVD |
| Type | weapon |
| Munitie | 7.62mm |
| Clipgrootte | 5 |
| Stats | muscle +7 |
| Prijs | 9.000 |
| Vereiste | Bikers rep 40 |
| Beschrijving | "+7 Kracht. Precisie op afstand. Kleine clip, verwoestende schade." |

### 3. Bijgewerkt wapenoverzicht

| Wapen | Munitie | Clip | Stats | Prijs | Vereiste |
|---|---|---|---|---|---|
| Glock 17 | 9mm | 8 | muscle +2 | 1.500 | - |
| Sawn-Off Shotgun (nieuw) | shells | 4 | muscle +4 | 3.500 | - |
| AK-47 | 7.62mm | 15 | muscle +5 | 4.500 | - |
| Dragunov SVD (nieuw) | 7.62mm | 5 | muscle +7 | 9.000 | Bikers 40 |
| El Serpiente's Blade | geen (melee) | - | muscle +8 | 12.000 | Cartel 60 |

### 4. Combat-gevolgen melee vs. ranged
- **Melee wapens** (Blade, of geen wapen): geen munitie nodig, geen herladen, maar geen ammo-kwaliteitsbonus (hollow-point/armor-piercing werkt alleen op kogels)
- **Sniper**: kleine clip (5), maar elke hit doet hoge schade. Na 5 schoten herladen (1 beurt)
- Spelers moeten kiezen: onbeperkte melee-aanvallen vs. hogere schade met beperkte munitie

## Technische details

### `src/game/constants.ts`
- `cartel_blade`: toevoegen `ammoType: null, clipSize: 0`
- `glock`: toevoegen `ammoType: '9mm', clipSize: 8`
- `ak47`: toevoegen `ammoType: '7.62mm', clipSize: 15`
- Nieuw item in GEAR array: Sawn-Off Shotgun (`ammoType: 'shells', clipSize: 4`)
- Nieuw item in GEAR array: Dragunov SVD (`ammoType: '7.62mm', clipSize: 5`)
- Afbeelding voor sniper: hergebruik `gear-ak47.jpg` (of een passende bestaande asset)

### `src/game/types.ts`
- `GearItem.ammoType` wordt `AmmoType | null` (null = melee)
- Combat engine checkt of `ammoType === null` om reload/ammo-verbruik over te slaan

### `src/game/engine.ts`
- Bij `combatAction`: als equipped weapon `ammoType === null`, sla magazijncheck en ammo-verbruik over
- Melee wapens krijgen volle schade zonder ammo-kwaliteitsbonus
- Sniper met 5-round clip: herladen na 5 schoten

### `src/components/game/CombatView.tsx`
- Bij melee-wapens: verberg clip-indicator en reload-knop
- Bij sniper: toon kleine clip-indicator (5 bullets)

### `src/components/game/trade/GearPanel.tsx`
- Wapen-cards tonen "Melee" badge bij Blade i.p.v. munitietype
- Sniper toont "7.62mm | 5 rounds" info

