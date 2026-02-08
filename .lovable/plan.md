
# Huurmoordenaar & Kogelsysteem

## Overzicht
Twee onderling verbonden systemen toevoegen aan Noxhaven:
1. **Kogels/Munitie**: Een beperkte hulpbron die nodig is voor gevechten, missies en huurmoorden
2. **Huurmoordenaar**: Een nieuw Operations-subtab waarmee je hits kunt plaatsen op NPC-doelwitten voor geld, rep en factie-invloed

---

## 1. Kogelsysteem (Ammo)

### Concept
Kogels worden een schaars goed dat je moet kopen of vinden. Ze worden verbruikt bij:
- **Gevechten** (baasgevechten, nemesis): X kogels per gevechtsbeurt bij "Aanval" of "Zware Klap"
- **Solo operaties** met geweld (store_robbery, etc.)
- **Huurmoord-opdrachten**
- **Verdedigen** kost geen kogels (melee/block)

### Implementatie
- Nieuw veld in `GameState`: `ammo: number` (start: 12)
- **Kopen**: Via de Zwarte Markt (GEAR-tab) als consumable. Prijzen: 6 kogels = 500, 12 = 900, 30 = 2000
- **Vinden**: Kleine kans om kogels te vinden bij succesvolle missies/operaties (+2-5)
- **Combat**: "Aanval" kost 1 kogel, "Zware Klap" kost 2 kogels. Als je geen kogels hebt, val je terug op melee (50% schade)
- **Weergave**: Kogel-icoon + aantal in de GameHeader resource strip
- **Maximaal**: 99 kogels

### Balans
- Zonder kogels kun je nog steeds vechten, maar zwakker
- Huurmoorden kosten 3-8 kogels afhankelijk van moeilijkheidsgraad
- Night report kan random munitie-events bevatten

---

## 2. Huurmoordenaar Systeem

### Concept
Een nieuw subtab "HITS" binnen Operations. Elke dag verschijnen er 2-3 contractmoorden op NPC-doelwitten. Elk doelwit heeft een moeilijkheidsgraad, beloning, heat-impact en factie-gevolgen.

### Doelwit-types
- **Rivaal Luitenant**: Lagere moeilijkheid, minder beloning. Verlaagt factie-relatie.
- **Corrupte Ambtenaar**: Middelmatig. Verlaagt heat maar risico op politie-vergelding.
- **Zakenman**: Hoog risico, hoge beloning. Minder rep-impact.
- **Verrader**: Verschijnt als een factie een slechte relatie heeft met jou. Bonusbeloning.
- **VIP Target**: Zeldzaam. Extreem gevaarlijk maar enorme beloning en rep.

### Hit-opdracht structuur
```text
HitContract {
  id: string
  targetName: string
  targetType: 'luitenant' | 'ambtenaar' | 'zakenman' | 'verrader' | 'vip'
  difficulty: number (0-100)
  reward: number (geld)
  repReward: number
  heatGain: number
  ammoCost: number (3-8 kogels)
  factionEffect: { familyId: FamilyId, change: number } | null
  district: DistrictId (moet in dit district zijn)
  desc: string
  karmaEffect: number (-5 tot -15, huurmoorden zijn altijd meedogenloos)
  deadline: number (vervalt na X dagen)
}
```

### Gameplay Flow
1. Speler bekijkt beschikbare hits in HITS-tab
2. Selecteert een target en bevestigt (ConfirmDialog: "Dit is een punt van geen terugkeer")
3. Systeem checkt: genoeg kogels? In het juiste district? Stat-check op muscle/brains
4. Slagingskans gebaseerd op: player muscle/brains + level + gear bonussen - moeilijkheidsgraad
5. **Succes**: Geld, rep, XP. Factie-relatie verandert. Karma daalt. Heat stijgt.
6. **Falen**: Heat stijgt extra. Kans op crew-schade. Vijandige factie wordt gewaarschuwd.

### Karma-integratie
- Alle huurmoorden verlagen karma (altijd "meedogenloos" keuze)
- Meedogenloos-spelers krijgen +15% beloning bonus op hits
- Eerbaar-spelers zien een waarschuwing dat dit hun karma beschadigt
- Bij karma < -50 verschijnen exclusieve "Executie"-opdrachten met dubbele beloning

### UI Design
- Nieuw subtab "HITS" in OperationsView met skull-icoon
- Elke hit getoond als kaart met:
  - Target naam en type (badge)
  - Locatie-vereiste (district)
  - Beloningen: geld + rep + XP
  - Kosten: kogels + heat
  - Slagingskans (percentage balk)
  - Karma-impact waarschuwing
- Confirmatie-dialog voor acceptatie
- Resultaat-toast met details

---

## Technische Aanpak

### Bestanden die worden aangemaakt:
- **`src/game/hitman.ts`**: Definities van hit-contracten, generatie-logica, en uitvoerings-functies

### Bestanden die worden aangepast:

**`src/game/types.ts`**:
- Toevoegen: `ammo: number` aan `GameState`
- Toevoegen: `HitTargetType`, `HitContract` interfaces

**`src/game/constants.ts`**:
- Toevoegen: `AMMO_PACKS` (koop-opties), `HIT_TARGET_TEMPLATES` (doelwit-templates met namen en types)

**`src/game/engine.ts`**:
- `createInitialState`: `ammo: 12` toevoegen
- `combatAction`: Kogel-verbruik toevoegen bij attack/heavy. Schade halveren zonder kogels.
- `endTurn`: Genereer nieuwe hit-contracten

**`src/contexts/GameContext.tsx`**:
- Nieuwe actions: `BUY_AMMO`, `ACCEPT_HIT`, `EXECUTE_HIT`
- Reducer-logica voor munitie-aankoop en hit-uitvoering

**`src/components/game/GameHeader.tsx`**:
- Kogel-indicator toevoegen aan resource strip (kogel-icoon + aantal)

**`src/components/game/OperationsView.tsx`**:
- Nieuw subtab "HITS" met skull-icoon
- Hit-contractkaarten met alle info
- Confirm-dialog voor hit-acceptatie

**`src/components/game/trade/GearPanel.tsx`**:
- Munitie-koopsectie toevoegen bovenaan (consumable, niet equippable)

**`src/components/game/CombatView.tsx`**:
- Kogel-indicator tonen bij acties
- "Geen kogels" waarschuwing bij attack/heavy als ammo = 0
- Visuele indicator dat schade gehalveerd is zonder munitie

### Dagelijkse progressie tracking
- `dailyProgress.hits_completed` toevoegen voor daily challenges

### Balans-details
- Start met 12 kogels
- Kogels zijn relatief goedkoop (6 voor 500) zodat het geen blokkade vormt, maar wel een strategische overweging
- Hits genereren 2-3 per dag, verdwijnen na deadline
- Slagingskans varieert van 40% (VIP) tot 85% (Luitenant) voor een gemiddelde speler
- Max 5 actieve hit-contracten tegelijk
