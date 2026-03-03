

## Probleem: Street Events bij opstarten

### Root cause

Bij het openen van het spel checkt `checkTick()` **direct op mount** (regel 3211) hoeveel 30-minuten ticks er gemist zijn. Als je bijv. 2 uur weg was, worden er **4 AUTO_TICKs** achter elkaar gefired — elk met een `rollStreetEvent('end_turn')` call.

De 10-minuten cooldown (`EVENT_COOLDOWN_MS`) werkt niet in dit geval: alle ticks draaien synchroon in dezelfde render-cyclus, waardoor `Date.now()` telkens dezelfde waarde teruggeeft. Resultaat: meerdere events in de queue direct bij het openen.

Daarnaast is er geen **session-start grace period** — de allereerste tick na login kan ook al een event triggeren.

### Oplossing

Twee wijzigingen, beide in bestaande bestanden:

**1. Session-start grace period in `rollStreetEvent()`** (`src/game/storyEvents.ts`)
- Voeg een nieuwe check toe: als `state._sessionStartedAt` niet bestaat of minder dan 2 minuten geleden is, return `null`
- Dit voorkomt events direct bij het openen, ongeacht hoeveel ticks er catchup draaien

**2. Skip street events tijdens catch-up ticks** (`src/contexts/GameContext.tsx`)
- Bij de catch-up loop (regel 3201-3206), markeer ticks als `isCatchUp: true`
- In de AUTO_TICK handler: als het een catch-up tick is, sla `rollStreetEvent` over
- Alternatief (simpeler): sla `rollStreetEvent` alleen over als `ticksPassed > 1` (= catch-up scenario)

**3. Zet `_sessionStartedAt` bij mount** (`src/contexts/GameContext.tsx`)
- In de useEffect die `checkTick` runt, sla `Date.now()` op in state of ref zodat `rollStreetEvent` de grace period kan checken

### Concrete implementatie

| Bestand | Wijziging |
|---|---|
| `src/contexts/GameContext.tsx` | Catch-up ticks skippen street events; session timestamp bijhouden |
| `src/game/storyEvents.ts` | Grace period check (2 min na session start) |

### Aanpak detail

- In `GameContext.tsx`: voeg een `sessionStartRef = useRef(Date.now())` toe. Bij catch-up ticks (`ticksPassed > 1`), dispatch een variant `AUTO_TICK_CATCHUP` of voeg een flag `skipEvents` toe aan de state voor de duur van de catch-up
- In `rollStreetEvent()`: accepteer een optionele `skipEvents` flag, of check een `_sessionStartedAt` veld op state. Als het minder dan 2 minuten geleden is → geen event

Dit is minimaal invasief (2 bestanden, ~15 regels) en lost het probleem structureel op zonder de normale gameplay-flow te beïnvloeden.

