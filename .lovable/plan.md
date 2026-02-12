

# Visual Character Progression System (Paperdoll)

## Overzicht

Een CharacterAvatar component dat de speler visueel representeert door meerdere lagen over elkaar te stapelen. Het systeem leest direct uit de bestaande GameState (level, karma, loadout, district) en past de visuele representatie dynamisch aan. Omdat er nog geen PNG-assets zijn, gebruiken we gestylede SVG/div placeholders die later eenvoudig vervangen kunnen worden door echte afbeeldingen.

---

## Visuele Lagen (van onder naar boven)

| Z-index | Laag | Bron in GameState | Placeholder |
|---------|------|-------------------|-------------|
| 0 | Achtergrond | `state.loc` (district) | Gekleurde gradient per district |
| 1 | Lichaam | Vast (uitbreidbaar) | SVG silhouet |
| 2 | Cybernetics | `ownedGear` bevat `lotus_implant` | Neon lijnen op silhouet |
| 3 | Kleding | `player.level` (1-9: vodden, 10-29: casual, 30+: pak) | Gekleurde vormen |
| 4 | Bovenkleding | `player.loadout.armor` | Vest/pak overlay |
| 5 | Hoofddeksel | Level 30+ of specifieke gear | Cyber-optics strip |
| 6 | Wapen | `player.loadout.weapon` | Wapen-silhouet met naam |
| 7 | Karma Overlay | `state.karma` | Gekleurde glow (rood/blauw/goud) |

---

## Componentstructuur

### Nieuw bestand: `src/components/game/profile/CharacterAvatar.tsx`

Het hoofdcomponent dat alle lagen rendert. Accepteert optionele `size` prop (sm/md/lg) voor hergebruik.

**Props:**
- `size?: 'sm' | 'md' | 'lg'` (default: 'md')
- `showPreviewControls?: boolean` (voor het Preview Dashboard)
- `className?: string`

**Mapping logica:**
- **District achtergronden**: Mapping van DistrictId naar gradient kleuren (Port Nero = donkerblauw, Crown Heights = goud/zwart, Iron Borough = grijs/oranje, Lowrise = groen/zwart, Neon Strip = paars/roze)
- **Level tiers**: 1-9 = "Straatrat" (gescheurde kleding), 10-29 = "Soldaat" (donker jasje), 30+ = "Baas" (luxe pak)
- **Wapen visuals**: Mapping van gear ID naar SVG-vormen (glock = pistool, shotgun = kort geweer, ak47 = groot geweer, sniper = lang geweer, cartel_blade = zwaard)
- **Armor visuals**: vest = kogelvrij vest overlay, suit = pak overlay, skull_armor = zware plating
- **Karma glow**: karma < -20 = rode/oranje pulserende glow, karma > 20 = blauwe/gouden glow, neutraal = geen overlay
- **Cybernetics**: Neural Implant (lotus_implant) in bezit = neon circuit-lijnen op het gezicht

**Glitch-animatie**: Bij level-up (detecteerbaar via `player.level` change) speelt een korte CSS glitch-animatie af (horizontal offset + color channel split via CSS filters).

### Nieuw bestand: `src/components/game/profile/AvatarPreviewDashboard.tsx`

Een "Preview Dashboard" panel met sliders/toggles om de avatar live te testen:
- Level slider (1-50)
- Karma slider (-100 tot +100)
- District selector (5 knoppen)
- Wapen selector (dropdown van beschikbare gear)
- Armor selector (dropdown)
- Cybernetics toggle

Dit component gebruikt lokale state (niet de echte game state) zodat je vrij kunt experimenteren.

### Aangepast bestand: `src/components/game/ProfileView.tsx`

- Importeer `CharacterAvatar`
- Vervang het huidige statische "Boss Card" icoon (de `span` met emoji) door de `CharacterAvatar` component in `size="sm"`
- Voeg een nieuw profiel-subtab toe: `'avatar'` met label `'AVATAR'`
- In die tab: toon de CharacterAvatar in groot formaat (size="lg") met het AvatarPreviewDashboard eronder

### Aangepast type: `ProfileTab`

Uitbreiden met `'avatar'` als optie.

---

## Technische Details

### CSS/Styling
- Container: `relative` met vaste aspect-ratio (3:4), responsief via Tailwind (`w-full max-w-[200px]` voor md)
- Lagen: `absolute inset-0` met oplopende `z-index`
- Glitch-effect: CSS keyframe animatie met `clip-path` en `transform: translate` voor RGB-split
- Karma glow: `box-shadow` met `inset` + radiale gradient overlay
- Alle placeholders gebruiken Tailwind kleuren en inline SVG

### Responsiviteit
- `sm`: 48x64px (voor header/boss card)
- `md`: 150x200px (standaard)
- `lg`: 250x333px (preview dashboard)

### Performance
- Geen extra state in GameState nodig
- Puur visueel component, leest alleen uit bestaande state
- Framer Motion alleen voor de glitch-animatie bij level-up
- Geen nieuwe dependencies

---

## Wat er NIET verandert
- Geen wijzigingen aan game logica, engine, of reducer
- Geen nieuwe velden in GameState
- Bestaande profiel-tabs en functionaliteit blijven identiek
- Geen impact op performance of save-systeem

