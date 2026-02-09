

# Fix & Uitbreiding: Verslagen Facties Systeem

## Probleem

Wanneer een factieleider is verslagen maar de factie nog niet is veroverd (vazal), blijven meerdere systemen op de achtergrond gewoon doordraaien alsof de factie nog actief is:

- **Contracten** worden nog steeds gegenereerd met verslagen facties als opdrachtgever of doelwit
- **Factieoorlogen** controleren alleen op "veroverd", niet op "leider dood" — een verslagen factie kan je nog steeds aanvallen en bestelen
- **Relatieveranderingen** gaan door via contracten bij een dode leider
- **Passief inkomen** van hoge relatie blijft doorlopen bij verslagen facties
- **Marktprijzen** houden geen rekening met verslagen/veroverde status
- **Straatgevechten** op de kaart kunnen nog steeds spawnen namens verslagen facties

## Oplossing

### 1. Centrale helper: `isFactionActive()`

Een nieuwe functie in `engine.ts` die overal hergebruikt wordt:

```text
isFactionActive(state, familyId):
  - return false als leider dood EN niet veroverd (chaos-fase)
  - return false als veroverd (vazal = vreedzaam)
  - return true anders
```

### 2. Contractgeneratie filteren

In `generateContracts()`: filter verslagen/veroverde facties uit als employer en target. Als er minder dan 2 actieve facties zijn, genereer "solo" contracten zonder factie-affiliatie.

### 3. Factieoorlog fix

In `applyFactionWar()`: voeg check toe op `leadersDefeated`. Een verslagen factie (leider dood) is in chaos en kan niet georganiseerd aanvallen, ongeacht relatie.

### 4. Passief inkomen fix

In `endTurn()` factie-alliantie-inkomen: sla verslagen-maar-niet-veroverde facties over. Alleen actieve allianties (rel >= 80 en leider leeft) of veroverde facties geven inkomen.

### 5. Contract relatie-effecten fix

In `executeContract()`: voorkom relatieveranderingen bij verslagen facties.

### 6. Marktprijs-impact

Verslagen facties hebben geen grip meer op hun thuismarkt: de speciale prijskorting voor cartel in port vervalt als de cartel verslagen is.

### 7. Kaart-events fix

`generateMapEvents()`: straatgevechten spawnen niet meer als alle vijandige facties verslagen zijn.

## Uitbreiding: Machtsverval Systeem

Als bonus wordt een "machtsverval" mechanisme toegevoegd voor verslagen facties die niet veroverd worden:

- **Verslagen facties verliezen elke dag -2 relatie** (hun loyalisten keren zich af)
- **Na 10 dagen zonder overname**: de factie stuurt een dreigend bericht via de telefoon ("De straat vergeet niet...")
- Dit motiveert spelers om verslagen facties snel te veroveren

## Technische Wijzigingen

| Bestand | Wijziging |
|---|---|
| `src/game/engine.ts` | Nieuwe `isFactionActive()` helper. Fixes in `generateContracts`, `applyFactionWar`, `endTurn` (passief inkomen), `executeContract`, `generatePrices`, `generateMapEvents`. Nieuw machtsverval-systeem in `endTurn`. |
| `src/game/types.ts` | Optioneel: `leaderDefeatedDay` record toevoegen voor verval-tracking |

Geen UI-wijzigingen nodig — alle fixes zijn in de game-logica.

