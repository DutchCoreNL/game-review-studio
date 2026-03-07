

# Gevecht & Missie UI Overhaul — Noir Cinematic Layout

Geïnspireerd door de referentie-afbeelding: een immersieve layout met scène-illustratie, info-paneel, en gecategoriseerde actieknoppen als kaarten. Aangepast aan ons noir-thema en mobiel-eerst ontwerp.

---

## Huidige Staat vs. Gewenst

**Nu**: Verticale lijst van HP bars → combat log → knoppen. Functioneel maar vlak.
**Straks**: Cinematic layout met sfeer-header, vijandinfo-paneel, en gestylede actie-kaarten gegroepeerd per categorie.

---

## 1. Combat Scene Header (vervangt huidige portrait + scene text)

Grotere, immersieve header-sectie met district-achtergrond:
- District-afbeelding als achtergrond (opacity-30, grotere hoogte: h-36)
- **Speler info** overlay linksboven: naam, level, stats (muscle/brains/charm), uitgerust wapen
- **Vijand info** overlay rechtsboven: naam, HP, stance/type indicator
- **Missie/scene tekst** overlay onderaan: de typewriter scenePhrase
- Bij boss fights: boss portret centraal met fase-indicator

**Bestand**: `CombatView.tsx` — `ActiveCombat` component, regels 414-462

---

## 2. HP & Status Panel (compacter, meer visueel)

Herstructureer HP bars tot een compact paneel met:
- HP bars naast elkaar (links = speler, rechts = vijand) in plaats van gestapeld
- Stance indicator als badge naast de HP bar
- Actieve buffs/debuffs inline onder de HP bars
- Combo meter geïntegreerd als subtiele balk onder het paneel

**Bestand**: `CombatView.tsx` — regels 464-513

---

## 3. Gecategoriseerde Actie-Kaarten (kernwijziging)

Vervang de huidige grid van knoppen door **4 categorieën** zoals in de referentie:

```text
┌─────────────┬──────────────┬──────────────┬──────────────┐
│ DIRECTE      │ TACTISCH     │ STRATEGISCH  │ SPECIAAL     │
│ ACTIE        │              │              │              │
├─────────────┼──────────────┼──────────────┼──────────────┤
│ [Aanval]     │ [Verdedig]   │ [Stance]     │ [Combo       │
│ ⚔️ Betrouw- │ 🛡️ Block +  │ Wissel       │  Finisher]   │
│ baar, -1🔫  │ Heal         │ stance       │ 🔥 Als combo │
│              │              │              │ vol is       │
├─────────────┼──────────────┼──────────────┤              │
│ [Zware Klap] │ [Omgeving]   │ [Tactisch]   │ [Skills]     │
│ ⚡ Krachtig  │ 🗺️ Stun     │ 🎯 Stat      │ Toon skill   │
│              │ kans         │ check        │ menu         │
└─────────────┴──────────────┴──────────────┴──────────────┘
```

Elke kaart krijgt:
- Icoon linksboven (klein, in een cirkel met kleur-achtergrond)
- Naam **bold** als titel
- Korte beschrijving (cost, effect)
- Kleur-gecodeerde rand per categorie (blood/emerald/gold/purple)

**Bestand**: `CombatView.tsx` — regels 515-670, nieuw `ActionCategory` component

---

## 4. Combat Log Verbetering

- Grotere log-sectie met betere visuele scheiding
- "MISSIE TEKST" label boven de log (zoals in referentie)
- Log entries met meer contrast: vijand-berichten rechts-aligned met rode rand

**Bestand**: `CombatView.tsx` — regels 508-513

---

## 5. Campaign Mission View Polish

Dezelfde behandeling voor `CampaignMissionView.tsx`:
- Grotere header met chapter-afbeelding als scene
- Objectives panel rechts (mobiel: boven de acties)
- Encounter keuzes als gestylede kaarten met icoon-cirkels
- Mission text sectie met briefing-stijl

**Bestand**: `CampaignMissionView.tsx` + `EncounterCard.tsx`

---

## 6. Boss Fight View Polish

- Boss portret banner groter (h-36) met stats overlay
- Fase, rage, debuffs als compacte badges
- Actieknoppen als kaarten i.p.v. kleine buttons
- Counter-warning prominenter

**Bestand**: `BossFightView.tsx`

---

## 7. "UITVOEREN" Knop

Zoals in de referentie: een prominente execute-knop rechtsonder voor de primaire actie. In ons geval wordt dit de combo finisher / primaire aanval-knop die altijd zichtbaar is als een grote, glowing knop.

---

## Technisch Overzicht

| Wijziging | Bestand | Type |
|-----------|---------|------|
| Cinematic combat header | `CombatView.tsx` | Herstructurering |
| Actie-kaart categorieën | `CombatView.tsx` | Nieuw component |
| Compacte HP/status panel | `CombatView.tsx` | Herstructurering |
| Verbeterde combat log | `CombatView.tsx` | Uitbreiding |
| Campaign mission polish | `CampaignMissionView.tsx` | Uitbreiding |
| Encounter card upgrade | `EncounterCard.tsx` | Uitbreiding |
| Boss fight UI upgrade | `BossFightView.tsx` | Herstructurering |

Alle wijzigingen zijn puur visueel/UI — geen gameplay-logica veranderingen. Framer Motion animaties behouden. Volledig mobiel-responsief (het spel draait in een mobiel-breedte paneel).

