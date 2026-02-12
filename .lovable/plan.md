

# Slim Alarm: Automatische Markt Alerts

## Wat het doet
Een "Slim Alarm" feature die automatisch markt-alarmen instelt wanneer de beste handelsroute voor een goed meer dan **EUR 1.000 winst per stuk** oplevert. De speler kan dit met een enkele knop activeren/deactiveren.

## Hoe het werkt

1. **Nieuwe state**: `smartAlarmEnabled: boolean` in de GameState (default `false`)
2. **Nachtelijke check**: Tijdens de engine nacht-cyclus, als smart alarm aan staat, worden de beste routes berekend. Voor elk goed met >EUR 1.000 winst wordt automatisch een eenmalig alarm aangemaakt (als er niet al een soortgelijk alarm bestaat)
3. **UI**: Een opvallende toggle-knop in de Markt Alarmen sectie van het Analyse-paneel

## Technische Wijzigingen

### 1. `src/game/types.ts`
- Toevoegen: `smartAlarmEnabled?: boolean` aan GameState

### 2. `src/contexts/GameContext.tsx`
- Nieuw reducer action: `TOGGLE_SMART_ALARM`
- Default waarde in initial state

### 3. `src/game/engine.ts`
- In de nachtcyclus (bij alert processing): als `smartAlarmEnabled` aan staat, bereken beste routes en maak automatisch alerts aan voor goederen met winst >EUR 1.000 (max 10 alerts totaal, geen duplicaten)

### 4. `src/components/game/trade/MarketAnalysisPanel.tsx`
- Toggle-knop "Slim Alarm" boven de handmatige alarm-sectie
- Korte uitleg: "Automatisch alarm bij routes met >EUR 1.000 winst"
- Visuele indicator (aan/uit) met gouden styling

