
# Kogelsysteem Verbetering: Munitietypes & Kogelfabriek

## Wat verandert er?

Het huidige systeem heeft een enkele `ammo` teller. We splitsen dit naar **drie munitietypes** (9mm, 7.62mm, Shells) en upgraden de Kogelfabriek zodat deze het juiste type produceert en upgradebaar is.

---

## 1. Munitietypes Splitsen

De enkele `ammo: number` wordt vervangen door `ammoStock: Record<AmmoType, number>` met aparte voorraden per type.

**Wapen-munitie toewijzing (al gedefinieerd in constants):**
| Wapen | Type | Clip |
|-------|------|------|
| Glock 17 | 9mm | 8 |
| Sawn-Off Shotgun | shells | 4 |
| AK-47 | 7.62mm | 15 |
| Dragunov SVD | 7.62mm | 5 |
| El Serpiente's Blade | melee | - |

**Wat verandert:**
- Gevechten verbruiken het type munitie van je uitgeruste wapen
- Hits vereisen munitie van het type dat past bij je wapen
- Zonder het juiste type val je automatisch terug op melee (50% schade)
- Max per type: 99

---

## 2. Kogelfabriek Upgraden

De fabriek (business `ammo_factory`) krijgt **3 upgrade-niveaus** die productie verhogen en het type bepalen.

| Level | Productie | Kosten | Effect |
|-------|-----------|--------|--------|
| Basis | 3/dag | (al gekocht) | Produceert het type van je actieve wapen |
| Lvl 2 | 5/dag | 25.000 | Hogere output |
| Lvl 3 | 8/dag | 50.000 | Maximale output |

De fabriek produceert automatisch het munitietype van het wapen in je loadout. Zonder wapen of met melee: 9mm als default.

---

## 3. Ammo Packs per Type

De winkelpakketten worden per type verkocht:

| Pak | 9mm | 7.62mm | Shells | Prijs |
|-----|-----|--------|--------|-------|
| Klein | 6 | 6 | 6 | 500 |
| Medium | 12 | 12 | 12 | 900 |
| Groot | 30 | 30 | 30 | 2.000 |

De speler kiest welk type bij aankoop.

---

## Technische Wijzigingen

### `src/game/types.ts`
- Nieuw veld in `GameState`: `ammoStock: Record<AmmoType, number>` (naast bestaand `ammo` voor migratie)
- Nieuw veld: `ammoFactoryLevel: number` (1-3)
- Bestaand `ammo` veld blijft voor backwards-compat, wordt gemigreerd

### `src/game/constants.ts`
- `AMMO_PACKS` aanpassen: elk pack krijgt geen vast type meer, het type wordt gekozen in de UI
- Nieuwe constante `AMMO_FACTORY_UPGRADES` met level-kosten en productiehoeveelheden
- `AMMO_FACTORY_DAILY_PRODUCTION` wordt dynamisch op basis van level

### `src/game/engine.ts`
- `combatAction`: verbruik het specifieke type van het uitgeruste wapen uit `ammoStock[type]`
- `endTurn` (fabriek): produceer het type van het uitgeruste wapen, hoeveelheid op basis van `ammoFactoryLevel`
- Hulpfunctie `getActiveAmmoType(state): AmmoType` die het type van het huidige wapen teruggeeft

### `src/game/hitman.ts`
- `executeHit`: check en verbruik het juiste munitietype uit `ammoStock`

### `src/contexts/GameContext.tsx`
- `BUY_AMMO` action uitbreiden met `ammoType: AmmoType` parameter
- `UPGRADE_AMMO_FACTORY` nieuwe action toevoegen
- Migratie: oude `ammo` waarde verspreiden over 9mm als default, `ammoFactoryLevel` default 1

### `src/components/game/trade/GearPanel.tsx`
- Ammo-sectie: type-selector (9mm/7.62mm/Shells tabs) bij aankoop
- Toon voorraad per type

### `src/components/game/ResourcePopup.tsx` (AmmoPanel)
- Toon alle drie voorraden apart met iconen
- Type-selectie bij aankoop
- Kogelfabriek upgrade-knop met kosten/level

### `src/components/game/GameHeader.tsx`
- Kogelteller toont het type van je actieve wapen (of totaal)

### `src/components/game/HitsView.tsx`
- Toon welk munitietype nodig is en of je genoeg hebt

### `src/components/game/CombatView.tsx`
- Munitie-indicator toont het specifieke type en voorraad

### `src/components/game/NightReport.tsx`
- Fabriekproductie toont welk type is geproduceerd

### Wat er NIET verandert:
- Bestaande wapendefinities (ammoType en clipSize zijn al gedefinieerd)
- Melee wapens (El Serpiente's Blade) werken ongewijzigd
- Villa opslagkelder ammo-opslag werkt per totaal (geen type-onderscheid nodig)
- Geen nieuwe dependencies
