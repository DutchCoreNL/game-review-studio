

# Arsenaal Verbeteringen — Analyse & Suggesties

## Huidige Staat
Het arsenaalsysteem is al uitgebreid met:
- **Procedurele generatie**: 8 merken × 7 wapen-frames × 7 lopen × 7 magazines × 7 accessoires = 19.000+ combinaties
- **Gear**: 6 merken × 10 frames (5 armor + 5 gadget) × 7 mods
- **Progression**: Upgrade (lvl 1-15), Fusion (3→1 rarity up), Accessory Swap, Mastery XP (5 levels)
- **Acquisitie**: Combat loot, Zwarte Markt, Loot Crates, Daily Rewards, Salvage/Crafting
- **Unique weapons**: Handgemaakte legendarische wapens met lore
- **UI**: Noir-stijl thumbnails, stat bars, rarity kleuren, lock/mastery systeem

## Wat Ontbreekt / Kan Beter

### 1. Weapon Set Bonussen
Als je meerdere items van hetzelfde merk uitrust (bijv. Noxforge wapen + Noxforge armor), krijg je een setbonus. Dit stimuleert thematisch verzamelen.
- 2-delig: kleine bonus (+5% damage of +10 HP)
- 3-delig (wapen + armor + gadget): krachtige bonus (+15% alle stats of uniek effect)
- UI indicator op equipped items die laat zien welke set actief is

### 2. Wapen Skins / Cosmetiek
Visuele customization voor wapens — verandert de border/glow kleur van de WeaponCard.
- Skins als zeldzame drops of Zwarte Markt exclusives
- Puur cosmetisch maar geeft eigenaarschap
- Bijv: "Neon Rood", "Gold Plated", "Skull Camo"

### 3. Enchantments / Socket Systeem
Voeg een extra laag toe bovenop accessoires — enchantments die je kunt socketten:
- "Vampirisch" (+5% lifesteal), "Snelheid" (+1 fire rate), "Gepantserd" (+10% armor pierce)
- Enchantments droppen als losse items, je socket ze in een wapen/gear
- Max 1 enchantment per item, kan vervangen worden (oude gaat verloren)
- Geeft een nieuwe crafting sink en extra diepte

### 4. Gear Durability / Slijtage
Items verliezen conditie bij gebruik in combat. Moet gerepareerd worden met geld of scrap.
- 100% → 50%: geen effect. Onder 50%: stats dalen proportioneel
- Reparatie kost scrap (1-5 afhankelijk van rarity) of geld
- Legendary items slijten 50% langzamer
- Voegt een onderhoudskost toe als gold sink

### 5. Wapen Vergrendelingsuitdagingen (Challenges)
Specifieke kill-challenges die een permanente bonus unlocken voor dat wapen:
- "100 kills met dit wapen" → +5% crit
- "Win 10 gevechten zonder geraakt te worden" → +1 accuracy
- Geeft een reden om één wapen lang te gebruiken naast mastery

### 6. Blueprint / Recepten Systeem
In plaats van alleen random crafting, voeg blueprints toe die je kunt vinden:
- Blueprint specificeert exact welk item je krijgt (merk + frame + rarity)
- Kost scrap + geld om te craftten
- Blueprints droppen van bosses, story arcs, of Zwarte Markt
- Geeft gerichte farming doelen

### 7. Loadout Presets
Sla meerdere loadout-configuraties op en wissel snel tussen sets:
- "Stealth Build": silenced pistol + cloak + scanner
- "Tank Build": LMG + exosuit + shield
- Snel wisselen vanuit het loadout-scherm
- Max 3-5 presets

---

## Impact vs Complexiteit

| # | Feature | Impact | Complexiteit |
|---|---------|--------|-------------|
| 1 | Set Bonussen | Hoog — stimuleert verzamelen | Medium |
| 3 | Enchantments | Hoog — nieuwe progressielaag | Medium-Hoog |
| 7 | Loadout Presets | Hoog — QoL | Laag |
| 5 | Challenges | Medium-Hoog — engagement | Medium |
| 6 | Blueprints | Medium — gerichte doelen | Medium |
| 2 | Wapen Skins | Medium — visueel plezier | Laag |
| 4 | Durability | Medium — gold sink | Medium |

Alle wijzigingen zijn client-side (GameState + UI), geen database migraties nodig.

