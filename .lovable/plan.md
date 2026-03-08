

## Visuele Verbeteringsplan

Na een grondige audit van de UI-componenten zijn dit de gebieden met het meeste visuele verbeterpotentieel:

---

### 1. ChatView — Minimalistisch en Vlak
**Probleem:** De chatview is de minst gestylede view in het spel. Geen achtergrondafbeelding, geen cinematic header, simpele bubbels zonder avatar of niveau-indicatie.

**Verbetering:**
- Achtergrondafbeelding toevoegen (chat-bg.jpg) via `ViewWrapper`
- Cinematic header met goud-icoon toevoegen (consistent met andere views)
- Berichten voorzien van een klein profielpictogram (eerste letter van username als avatar)
- Bot-berichten visueel onderscheiden (subtiele paarse rand)
- Online-indicator toevoegen naast kanaal-tabs (aantal actieve gebruikers)
- Typing-indicator animatie

### 2. GymView — Basis Kaarten
**Probleem:** Gym-kaarten gebruiken nog emoji's (🏋️, 🛡️, ⚡) in plaats van noir-stijl thumbnails. De trainingsresultaten zijn een simpele tekstregel zonder visuele feedback.

**Verbetering:**
- Gym-kaarten upgraden met noir-stijl visuals per district
- Trainingsresultaat tonen als geanimeerde stat-boost overlay (getal dat omhoog vliegt)
- Progressiebalk per stat toevoegen die vult na training
- Tier-indicator met goud-sterren i.p.v. nummers

### 3. GameNav (Bottom Bar) — Functioneel maar Vlak
**Probleem:** De onderste navigatie is puur functioneel. Geen visuele diepte, geen actieve state-animatie buiten een dun lijntje.

**Verbetering:**
- Actieve tab een subtiele glow geven (matched met de gold kleur)
- Achtergrond gradient verbeteren met glasmorfisme-effect
- Badge-animatie toevoegen (pulse bij nieuwe notificaties)
- Iconen licht animeren bij tab-switch (scale + fade)

### 4. Loading States & Empty States
**Probleem:** Veel views tonen "Laden..." als platte tekst of lege states zonder visuele feedback.

**Verbetering:**
- Skeleton loaders toevoegen voor kaarten en lijsten
- Lege states voorzien van thematische illustraties (bv. "Geen berichten" met een noir-silhouet)
- Shimmer-effect op loading placeholders

### 5. SectionHeader — Te Klein en Onopvallend  
**Probleem:** De `SectionHeader` is 0.5rem tekst met minimale visuele aanwezigheid. Werkt functioneel maar mist impact.

**Verbetering:**
- Optionele `subtitle` prop toevoegen
- Decoratieve lijn na de titel (gold gradient fade-out)
- Iets grotere tekst (0.6rem) met betere spacing

---

### Technisch Overzicht
| Component | Wijziging | Impact |
|---|---|---|
| `ChatView.tsx` | Achtergrond, avatars, bot-styling, typing indicator | Hoog |
| `GymView.tsx` | Stat-animaties, progressiebalken, tier-visuals | Medium |
| `GameNav.tsx` | Glow, glasmorfisme, badge-pulse | Medium |
| `SectionHeader.tsx` | Subtitle, decoratieve lijn | Laag |
| Nieuw: `SkeletonCard.tsx` | Herbruikbare skeleton loader | Medium |

Totaal: ~6 bestanden aanpassen, 1 nieuw component.

