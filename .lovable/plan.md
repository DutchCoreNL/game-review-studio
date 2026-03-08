

## Arsenaal Uitbreidingsplan

Het huidige systeem heeft 7 wapen-frames, 5 armor-frames, 5 gadget-frames, 8 brands, 6 gear brands, 12 enchantments, 12 skins en 5 unique weapons. Hier is het uitbreidingsplan:

---

### 1. Nieuwe Wapen-Frames (+3)
Toevoegen aan `weaponGenerator.ts` en `WEAPON_FRAMES`:

| Frame | Base DMG | ACC | Fire Rate | Clip | Niche |
|---|---|---|---|---|---|
| **Sniper** | 16 | 10 | 2 | 5 | Hoge schade + accuracy, laag vuur |
| **Crossbow** | 11 | 7 | 3 | 4 | Silent kills, geen heat |
| **Dual Pistols** | 5 | 4 | 10 | 24 | Extreem hoge vuursnelheid |

- `FrameId` type uitbreiden met `'sniper' | 'crossbow' | 'duals'`
- Thumbnail-assets genereren via imagegen (3 nieuwe noir-style .png)
- `WEAPON_FRAME_IMAGES` in `arsenal.ts` uitbreiden

### 2. Nieuwe Gear-Frames (+2 armor, +2 gadget)
Toevoegen aan `gearGenerator.ts`:

| Frame | Type | DEF | BRN | CRM | HP | Niche |
|---|---|---|---|---|---|---|
| **Helm** | armor | 4 | 2 | 0 | 12 | Balanced armor |
| **Boots** | armor | 3 | 0 | 2 | 8 | Speed/mobility |
| **Jammer** | gadget | 0 | 5 | 0 | 0 | Anti-tech counter |
| **Holowatch** | gadget | 0 | 2 | 5 | 0 | Charm-focused gadget |

- `ArmorFrameId` uitbreiden met `'helm' | 'boots'`
- `GadgetFrameId` uitbreiden met `'jammer' | 'holowatch'`
- 4 nieuwe thumbnail-assets genereren

### 3. Meer Content Variatie

**Nieuwe Brands (+2 wapen, +2 gear)**:
- **Wapen**: `Havoc Arms` (explosief: +splash damage) en `Wraithsteel` (precision: +headshot bonus)
- **Gear**: `Ironhide` (tank: +HP focus) en `Nexus Systems` (+charm specialist)

**Nieuwe Enchantments (+4)**:
- `Executioner` (legendary): +40% schade tegen targets onder 25% HP
- `Guardian` (epic): 15% kans schade te halveren
- `Pyromaniac` (rare): DoT stapelt 2x sneller
- `Momentum` (epic): +5% schade per opeenvolgende hit (reset bij miss)

**Nieuwe Skins (+4)**:
- `Holographic` (legendary): regenboog-shimmer effect
- `Crimson Dragonscale` (epic): rode geschubde textuur
- `Ghost Wire` (rare): transparante wireframe look
- `Rusted Iron` (uncommon): verweerde industriele look

**Nieuwe Unique Weapons (+3)**:
- `De Weduwemaker` (sniper, Wraithsteel) — drops van Gang War legendary
- `Echo` (crossbow, Phantom) — drops van dungeon boss
- `Tweelingvuur` (duals, Havoc Arms) — drops van organized crime milestone

---

### Technisch Overzicht

| Bestand | Wijziging |
|---|---|
| `src/game/weaponGenerator.ts` | +3 frames, +2 brands, FrameId/BrandId types uitbreiden |
| `src/game/gearGenerator.ts` | +4 frames, +2 brands, FrameId/BrandId types uitbreiden |
| `src/game/enchantments.ts` | +4 enchantments, EnchantmentId type uitbreiden |
| `src/game/weaponSkins.ts` | +4 skins, SkinId type uitbreiden |
| `src/game/uniqueWeapons.ts` | +3 unique weapons |
| `src/assets/items/arsenal.ts` | Nieuwe frame images registreren |
| 9× imagegen | Noir-style thumbnails voor 3 weapon + 4 gear frames + 2 extra |

Alle wijzigingen zijn additief — geen bestaande data breekt. De generator-functies pikken automatisch nieuwe frames/brands op via de bestaande `pickRandom()` arrays.

