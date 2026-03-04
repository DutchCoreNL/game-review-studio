

## Analyse: Huidige staat van het wapensysteem

Het procedurele wapensysteem is functioneel maar vrij basic qua integratie:

**Wat werkt:**
- Generatie van 19.000+ combinaties (8 merken, 7 frames, 7 lopen, 7 magazines, 7 accessoires)
- Rarity systeem met stat-scaling
- Combat integratie: damage, accuracy, crit, armor pierce, DoT, stun
- Inventaris met equip/sell/compare UI
- Wapens droppen uit gevechten en campaign missies

**Wat ontbreekt / kan beter:**

### 1. Wapen Upgrade & Modding Systeem
Er is **geen manier om wapens te verbeteren**. Eenmaal gedropt is het wapen statisch. Voorstel:
- **Wapen upgraden**: Besteed geld + materialen om een wapen naar een hoger level te brengen (stats herberekenen op nieuw level)
- **Accessoire swappen**: Verander het accessoire van een wapen (bijv. van Laser Sight naar Incendiary) tegen betaling
- **Fusie**: Combineer 3 wapens van dezelfde rarity om er 1 van de volgende rarity te krijgen (3x uncommon → 1x rare)

### 2. Wapen Favoriet & Locking
Momenteel kan je per ongeluk je beste wapen verkopen. Voorstel:
- **Lock/Favoriet toggle** op wapens — gelocked wapen kan niet verkocht worden
- Visuele indicatie (🔒 icoon) in de inventory

### 3. Wapen XP & Mastery
Wapens zijn puur stat-sticks. Voorstel:
- Wapens verdienen **Mastery XP** naarmate je ermee vecht
- Mastery levels (1-5) geven kleine stat-bonussen (+2% per level)
- Bij max mastery: unlock een unieke **wapen-titel** (bijv. "Bloeddorstig") die de naam aanpast

### 4. Set Bonussen per Merk
Merken hebben individuele bonussen maar geen synergie. Voorstel:
- Als je wapen + armor van hetzelfde "merk" hebt: extra set bonus
- Aangezien gear-merken nog niet bestaan, eventueel een simpelere "Brand Loyalty" bonus: na 10 kills met hetzelfde merk krijg je +5% merkbonus

### 5. Betere UI/UX
- **Quick-swap**: Vanuit het combat-scherm snel van wapen wisselen
- **Vergelijkings-overlay** bij loot drops: direct zien of het nieuwe wapen beter is
- **Bulk verkopen**: Alle wapens onder een bepaalde rarity in één keer verkopen
- **Sorteer op DPS** (damage × fireRate) als extra sort-optie

### 6. Zeldzame Unieke Wapens
- **Named weapons**: Handmatig ontworpen legendarische wapens met vaste namen en unieke effecten die niet random genereerbaar zijn
- Drops van specifieke bosses of campaign missies
- Eigen kleur/glow in de UI

---

### Technisch plan

| Onderdeel | Bestanden |
|-----------|-----------|
| Upgrade/Fusie logica | `src/game/weaponUpgrade.ts` (nieuw) |
| Mastery tracking | Uitbreiding `GeneratedWeapon` type + reducer actions |
| Lock/favoriet | Klein veld op `GeneratedWeapon` + UI toggle |
| Named weapons | `src/game/uniqueWeapons.ts` (nieuw) |
| Bulk sell | Extra reducer action + UI knop |
| Quick-swap in combat | `CombatView.tsx` aanpassing |
| UI verbeteringen | `WeaponCard.tsx`, `WeaponInventory.tsx`, `WeaponCompare.tsx` |

Alle wijzigingen zijn client-side en vereisen geen database migraties.

