
# Geluidsindicaties bij het Night Report

## Overzicht
Geluidseffecten toevoegen aan het Night Report zodat elke belangrijke gebeurtenis auditief wordt versterkt. We gebruiken de **Web Audio API** om synthetische geluiden te genereren — geen externe bestanden of afhankelijkheden nodig.

## Wat verandert er?

### 1. Nieuw bestand: Sound Engine (`src/game/sounds.ts`)
Een lichtgewicht geluidssysteem gebouwd op de Web Audio API met de volgende geluiden:

- **Coin/cash geluid**: Korte, hoge tonen die snel na elkaar spelen — klinkt als munten die vallen. Wordt afgespeeld bij inkomstenregels (district, bedrijf, witwassen, smokkel).
- **Alarm/sirene geluid**: Een oscillerende toon die op en neer gaat — klinkt als een politiesirene. Wordt afgespeeld bij politie-invallen.
- **Dramatisch reveal geluid**: Een lage, opbouwende toon gevolgd door een "hit" — spanning die wordt opgelost. Wordt afgespeeld bij random events.
- **Negatief geluid**: Een korte, dalende toon voor kosten en verliezen (schuld rente, verloren districten).
- **Positief "ding"**: Een helder belletje voor positieve resultaten (aanvallen afgeslagen, smokkelwinst).

### 2. Integratie in Night Report (`NightReport.tsx`)
Geluiden worden getimed aan de bestaande animatie-delays zodat ze synchroon lopen met de visuele effecten:

- Inkomstenrijen: coin-geluid op het moment dat de rij verschijnt
- Politie-inval: alarm op het moment dat het rode blok verschijnt
- Random event: dramatisch geluid synchroon met de flash-fase van `DramaticEventReveal`
- Kostenrijen: negatief geluid bij schuld rente
- Netto inkomen: coin of negatief geluid afhankelijk van positief/negatief resultaat

### 3. Integratie in DramaticEventReveal (`DramaticEventReveal.tsx`)
Het dramatische geluid wordt afgespeeld wanneer de "flash" fase start, synchroon met de visuele onthulling.

### 4. Volume-instelling
Een eenvoudige master volume-instelling (0-1) wordt opgeslagen, zodat spelers het geluid kunnen dempen als ze dat willen. Een mute-knop wordt zichtbaar in de Night Report header.

## Technische details

### Sound Engine API
```text
src/game/sounds.ts
  - playCoinSound()      -> snel stijgende tonen (pentatonisch)
  - playAlarmSound()     -> oscillerende sirene (2 sec)  
  - playDramaticReveal() -> lage drone + hit
  - playNegativeSound()  -> dalende toon
  - playPositiveSound()  -> stijgende ding
  - setVolume(v: number) -> master volume 0-1
  - isMuted() / toggleMute()
```

### Timing in NightReport
De bestaande `next()` delay-functie wordt hergebruikt om `setTimeout` calls te plannen die de geluiden op het juiste moment afspelen via een `useEffect`.

### Bestanden die worden aangemaakt
- `src/game/sounds.ts` — Web Audio API geluidssynthese

### Bestanden die worden aangepast
- `src/components/game/NightReport.tsx` — geluiden afspelen bij animatie-delays
- `src/components/game/night-report/DramaticEventReveal.tsx` — dramatisch geluid bij flash-fase
