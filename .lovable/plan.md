

# Borderlands-stijl Procedureel Wapensysteem

## Concept

Wapens worden **procedureel gegenereerd** uit onderdelen: een **Merk** (fabrikant), **Frame** (wapen-basis), **Loop** (nauwkeurigheid/bereik), **Magazijn** (clip/herlaad), en **Accessoire** (special effect). Elke combinatie levert unieke stats op. Met 5 merken × 5 frames × 5 lopen × 5 magazijnen × 2 accessoires = **250 unieke combinaties**.

## Wapen-onderdelen

### Merken (5) — bepalen basiskwaliteit en visuele stijl
| Merk | Bonus | Stijl |
|---|---|---|
| **Noxforge** | +15% schade | Ruwe, industriële wapens |
| **Serpiente Arms** | +20% crit kans | Sierlijke, Latijns-geïnspireerde wapens |
| **Volkov Industries** | +25% clip size | Zware, Russische militaire stijl |
| **ShadowTech** | +10% alle stats | Futuristische, minimalistische wapens |
| **Ironjaw** | +30% armor piercing | Brute, overkill-stijl |

### Frames (5) — wapen-type
Pistol, SMG, Shotgun, Rifle, Blade (melee)

### Lopen (5) — nauwkeurigheid/bereik
Kort, Standaard, Lang, Precisie, Gedempt

### Magazijnen (5) — clip/herlaadsnelheid
Klein (snel), Standaard, Uitgebreid, Drum, Speciaal

### Accessoires (2) — optioneel special effect
Geen, Laser Sight (+accuracy), Silencer (-heat), Incendiary (+DoT), Shock (+stun kans)

## Stats per wapen

Elk gegenereerd wapen krijgt berekende stats:
- **Damage** (1-20): frame + loop + merk-bonus
- **Accuracy** (1-10): loop + accessoire
- **Fire Rate** (1-10): frame + magazijn
- **Clip Size** (4-30): frame + magazijn + merk-bonus
- **Special Effect**: accessoire-afhankelijk

Plus een **Rarity** (Common → Legendary) gebaseerd op de combinatie-kwaliteit.

## Integratie met bestaand systeem

- Het huidige `GEAR` array met vaste wapens blijft als "legacy" / winkelwapens
- Procedurele wapens worden **gevonden als loot** na combat, heists, en als daily deal
- Opgeslagen in `state.weaponInventory: GeneratedWeapon[]`
- Equip via loadout — vervangt de huidige `weapon` slot
- `muscle` stat wordt berekend uit het wapen's damage

## Technische aanpak

### Nieuwe bestanden
| Bestand | Inhoud |
|---|---|
| `src/game/weaponGenerator.ts` | Merken, onderdelen, stat-berekening, `generateWeapon()` functie, rarity roll |
| `src/components/game/weapons/WeaponCard.tsx` | Visuele kaart met stats, rarity-kleur, merk-logo |
| `src/components/game/weapons/WeaponInventory.tsx` | Inventaris-overzicht met filter/sort |
| `src/components/game/weapons/WeaponCompare.tsx` | Side-by-side vergelijking bij equip |

### Wijzigingen
| Bestand | Wijziging |
|---|---|
| `src/game/types.ts` | `GeneratedWeapon` interface, `weaponInventory` in GameState |
| `src/game/constants.ts` | Onderdelen-definities (merken, frames, lopen, etc.) |
| `src/game/combatLoot.ts` | Wapen-drops toevoegen aan loot rolls |
| `src/contexts/GameContext.tsx` | Actions: `GENERATE_WEAPON`, `EQUIP_WEAPON`, `SELL_WEAPON` |
| `src/components/game/trade/GearPanel.tsx` | Link naar wapeninventaris |
| `src/components/game/CombatView.tsx` | Wapen-drops tonen in loot reveal |

### Wapen-generatie flow
1. Bij loot-roll → `generateWeapon(level, rarity)` maakt een random combinatie
2. Stats worden berekend uit alle onderdelen
3. Naam wordt samengesteld: `[Merk] [Frame] [Accessoire-suffix]` (bv. "Noxforge SMG Incendiary")
4. Rarity bepaalt stat-multiplier (Common 0.8x → Legendary 1.5x)
5. Wapen gaat naar `weaponInventory` (max 20 slots)

