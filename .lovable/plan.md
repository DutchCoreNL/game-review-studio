
# Gevangenis Systeem

## Overzicht
Een gevangenissysteem waarbij je daadwerkelijk opgepakt kunt worden bij politie-invallen en mislukte missies. De straf is variabel op basis van je heat-niveau, en je verliest geld en goederen. Na vrijlating krijg je een schone lei, maar je kunt ook proberen te ontsnappen of jezelf vrij te kopen.

---

## Wanneer word je opgepakt?

### 1. Tijdens politie-invallen (Night Report)
- De bestaande raid-logica controleert of personalHeat > 60
- Als een raid plaatsvindt: **30% kans op arrestatie** (bovenop de boete)
- Corrupte contacten (agent/detective) verlagen arrestatiekans met hun beschermingspercentage
- Een advocaat-contact (nieuw corrupt contact type) kan arrestatiekans halveren

### 2. Bij mislukte missies
- Als een solo-operatie of contract faalt: **15% kans op arrestatie**
- Bij missies met hoge risk (>70): kans stijgt naar **25%**
- Charm-stat verlaagt de kans met 2% per punt

---

## Straf Duur (variabel op basis van heat)

| Personal Heat | Straf duur |
|---|---|
| 0-30 | 1 dag |
| 31-50 | 2 dagen |
| 51-70 | 3 dagen |
| 71-85 | 5 dagen |
| 86-100 | 7 dagen |

---

## Gevolgen van arrestatie

### Verlies bij opsluiting
- **Geld**: 20% van je clean money wordt in beslag genomen
- **Dirty money**: 100% van dirty money wordt in beslag genomen
- **Inventaris**: Alle illegale goederen (drugs, weapons) worden geconfisqueerd; tech/luxury/meds blijven
- **Heat**: Wordt volledig gereset naar 0 (zowel personal als vehicle) bij vrijlating

### Tijdens opsluiting (vergelijkbaar met "onderduiken")
- Geen handel, reizen, missies, of acties mogelijk
- Business-inkomsten lopen door (crew runt het)
- Kogelfabriek produceert nog steeds
- Vijanden kunnen districten aanvallen (net als bij onderduiken)
- Elke dag telt automatisch af

---

## Ontsnappingsopties

Terwijl je vastzit, kun je twee dingen proberen:

### 1. Omkoping (altijd beschikbaar)
- Kost: 5.000 euro per resterende dag
- Directe vrijlating
- Heat wordt NIET gereset (je hebt je straf niet uitgezeten)
- Vereist voldoende geld

### 2. Ontsnapping (eenmalige poging)
- Kans: 20% + (brains * 3%) + (crew bonus: +10% als je een Hacker hebt)
- Bij succes: directe vrijlating, +15 personal heat (je bent nu een voortvluchtige)
- Bij falen: +2 extra dagen straf, geen tweede poging

---

## UI: Gevangenis Overlay

Een fullscreen overlay vergelijkbaar met de bestaande `HidingOverlay`, maar met een gevangenisthema:

```text
+------------------------------------------+
|  [Handcuffs icon] GEVANGENIS             |
|                                          |
|     [ 3 ]  dagen resterend              |
|                                          |
|  Geld in beslag genomen: -€12.400       |
|  Dirty money verloren: -€8.000          |
|  Goederen geconfisqueerd: drugs, weapons |
|                                          |
|  [OMKOPEN - €15.000]                     |
|  [ONTSNAPPEN - 35% kans]                |
|  (of wacht je straf uit)                |
+------------------------------------------+
```

---

## Night Report integratie

Als je opgepakt wordt tijdens een raid, toont het Night Report:

- "Je bent gearresteerd! Straf: X dagen"
- Overzicht van verloren geld en goederen
- Na het sluiten van het report verschijnt de Prison Overlay

---

## Technische Aanpak

### Nieuwe/aangepaste bestanden:

**`src/game/types.ts`**:
- Nieuw type `PrisonState` met velden: `daysRemaining`, `totalSentence`, `moneyLost`, `dirtyMoneyLost`, `goodsLost`, `escapeAttempted`
- Toevoegen van `prison: PrisonState | null` aan `GameState`
- Toevoegen van `imprisoned: boolean` aan `NightReportData`

**`src/game/constants.ts`**:
- `PRISON_SENTENCE_TABLE`: heat-ranges naar dagen mapping
- `PRISON_BRIBE_COST_PER_DAY`: 5000
- `PRISON_ESCAPE_BASE_CHANCE`: 0.20
- `PRISON_MONEY_CONFISCATION`: 0.20 (20%)
- Toevoegen van `prison: null` aan `createInitialState`

**`src/game/engine.ts`**:
- Helper functie `calculateSentence(personalHeat)` op basis van de tabel
- Helper functie `arrestPlayer(state, report)` die geld/goederen confisqueert en `state.prison` instelt
- In `endTurn`: na raid-check, kans op arrestatie toevoegen
- In `endTurn`: als `state.prison` actief is, dagen aftellen en bij 0 heat resetten en prison clearen
- Prison blokkeert dezelfde acties als hiding

**`src/contexts/GameContext.tsx`**:
- Nieuwe actions: `BRIBE_PRISON`, `ATTEMPT_ESCAPE`, `DISMISS_PRISON`
- `BRIBE_PRISON`: betaal kosten, `prison = null`, heat blijft
- `ATTEMPT_ESCAPE`: rol de kans, bij succes vrijlaten + heat toevoegen, bij falen extra dagen
- Bij mislukte missies (bestaande SOLO_OP / END_MISSION logic): arrestatiekans toevoegen

**`src/components/game/PrisonOverlay.tsx`** (nieuw):
- Fullscreen overlay met gevangenis-thema (donker, handcuffs icoon)
- Toont: dagen resterend, verloren geld/goederen, omkoop- en ontsnappingsknoppen
- Animatie: aftellende dagen met pulsing effect
- ConfirmDialog voor omkoping en ontsnapping

**`src/components/game/GameLayout.tsx`**:
- Import en render `PrisonOverlay` wanneer `state.prison !== null`

**`src/components/game/NightReport.tsx`**:
- Nieuwe sectie tonen als `report.imprisoned`: "GEARRESTEERD" met details over confiscatie
