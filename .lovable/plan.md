

## Plan: Straatgebeurtenissen Systeem Hervormen

### Probleem
Bij het opnieuw inloggen na een tijdje verschijnt er direct een straatgebeurtenis-popup omdat:
1. Een `pendingStreetEvent` wordt bewaard in localStorage en verschijnt opnieuw
2. De 10-minuten cooldown is verlopen tijdens offline-tijd, dus de eerste actie triggert meteen een nieuw event
3. Elk event is een blokkerende fullscreen popup — er is geen manier om ze later te bekijken

### Oplossing: Event Queue + Dedicated Sectie

In plaats van directe popups, worden straatgebeurtenissen verzameld in een **event queue** die de speler zelf kan openen. Dit past bij de MMO-setting waar je na het inloggen een overzicht krijgt van "wat er is gebeurd" in plaats van meteen geblokkeerd te worden.

**1. Event Queue systeem**
- Nieuw veld `streetEventQueue: StreetEvent[]` (max 5 events) in GameState
- `rollStreetEvent` voegt events toe aan de queue in plaats van direct `pendingStreetEvent` te zetten
- Speler kiest zelf wanneer een event te openen vanuit de queue
- Bij inloggen: wis oude `pendingStreetEvent` (als die ouder is dan 30 min), stel cooldown in op "nu"

**2. Straatgebeurtenissen-sectie in de navigatie**
- Nieuwe `GameView: 'street_events'` + bijbehorende `StreetEventsView.tsx`
- Toont lijst van actieve events met urgentie-indicator en district-tag
- Badge op nav-item toont aantal openstaande events
- Elk event kan worden "geopend" → dan verschijnt de bestaande StoryEventPopup

**3. Cooldown na login**
- Bij het laden van een save: zet `lastStreetEventAt` op `now()` zodat er een 10-min buffer is
- Wis `pendingStreetEvent` bij laden als het event ouder is dan 30 minuten

**4. Aanpassingen per bestand**

| Bestand | Wijziging |
|---|---|
| `src/game/types.ts` | Voeg `streetEventQueue` toe, voeg `'street_events'` toe aan `GameView` |
| `src/game/constants.ts` | Initialiseer `streetEventQueue: []` in INITIAL_STATE |
| `src/game/storyEvents.ts` | Geen wijziging in rollStreetEvent zelf |
| `src/contexts/GameContext.tsx` | Queue-logica: events gaan naar queue i.p.v. direct popup; login-cooldown; nieuw `OPEN_QUEUED_EVENT` action |
| `src/components/game/StreetEventsView.tsx` | **Nieuw**: lijst van queued events met open-knoppen |
| `src/components/game/GameLayout.tsx` | Registreer `street_events` view |
| `src/components/game/DesktopSidebar.tsx` | Nav-item met badge |
| `src/components/game/GameNav.tsx` | Badge count voor queue |

