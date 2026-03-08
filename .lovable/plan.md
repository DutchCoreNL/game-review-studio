

# Plan: Taalschakelaar (NL ↔ EN) voor Noxhaven

## Scope-analyse

Dit project bevat **65+ bestanden met duizenden hardcoded Nederlandse strings** — missie-narratieven, UI-labels, tooltips, district-beschrijvingen, etc. Een volledige vertaling in één keer is niet realistisch. Het plan is daarom gefaseerd:

**Fase 1 (nu):** i18n-systeem opzetten + alle UI-labels/knoppen/menu's vertalen
**Fase 2 (vervolg):** Game-logica bestanden (missions, events, narratives) vertalen

---

## Technische aanpak

### 1. i18n Context & Hook
- Nieuw bestand `src/contexts/LanguageContext.tsx` met een React context
- Taal opslaan in `localStorage` (key: `noxhaven-lang`, values: `'nl' | 'en'`)
- Hook `useLanguage()` die `{ lang, setLang, t }` retourneert
- `t(key)` functie die de juiste vertaling ophaalt

### 2. Vertalingsbestanden
- `src/i18n/nl.ts` — Nederlandse strings (huidige tekst)
- `src/i18n/en.ts` — Engelse vertalingen
- Gestructureerd per sectie: `menu`, `nav`, `profile`, `trade`, `combat`, `missions`, etc.

### 3. Taalschakelaar UI
- Toevoegen in **MainMenu → Instellingen** als toggle (🇳🇱 NL / 🇬🇧 EN)
- Toevoegen in **ProfileView → Settings tab** als dezelfde toggle
- Visueel: twee knoppen naast elkaar, actieve taal gehighlight in goud

### 4. Bestanden die aangepast worden (Fase 1 — UI)

| Bestand | Wat |
|---------|-----|
| `src/contexts/LanguageContext.tsx` | **Nieuw** — context + provider |
| `src/i18n/nl.ts` | **Nieuw** — NL vertaalbestand |
| `src/i18n/en.ts` | **Nieuw** — EN vertaalbestand |
| `src/App.tsx` | LanguageProvider wrappen |
| `src/components/game/MainMenu.tsx` | `t()` calls + taalschakelaar in settings |
| `src/components/game/GameNav.tsx` | Labels vertalen via `t()` |
| `src/components/game/GameSidebar.tsx` | Sidebar labels via `t()` |
| `src/components/game/DesktopSidebar.tsx` | Sidebar labels via `t()` |
| `src/components/game/GameHeader.tsx` | Header tekst via `t()` |
| `src/components/game/ProfileView.tsx` | Stat labels, tabs, secties via `t()` |
| `src/components/game/TradeView.tsx` | Handel UI via `t()` |
| `src/components/game/MapView.tsx` | District namen/labels via `t()` |
| `src/components/game/OperationsView.tsx` | Missie UI via `t()` |
| `src/components/game/CombatView.tsx` | Combat UI via `t()` |
| `src/components/game/profile/AudioSettingsPanel.tsx` | Settings labels |
| + 20-30 overige component bestanden | Alle hardcoded NL strings |

### 5. Vertaalstructuur (voorbeeld)

```typescript
// src/i18n/nl.ts
export const nl = {
  menu: {
    continue: 'DOORGAAN',
    newGame: 'NIEUW SPEL',
    howToPlay: 'HOE TE SPELEN',
    settings: 'INSTELLINGEN',
    credits: 'CREDITS',
    login: 'INLOGGEN / REGISTREREN',
    logout: 'UITLOGGEN',
    online: 'ONLINE',
    permadeath: 'PERMADEATH — Dood = opnieuw beginnen',
    language: 'Taal',
  },
  nav: {
    map: 'KAART',
    actions: 'ACTIES',
    trade: 'HANDEL',
    empire: 'IMPERIUM',
    menu: 'MENU',
  },
  // ... honderden keys
};
```

### 6. Aanpak voor game-narratieven (Fase 2)
Bestanden zoals `missions.ts`, `districtStories.ts`, `campaignNarratives.ts` bevatten lange verhalende teksten. Deze worden omgezet naar een structuur met taalsleutels:
```typescript
// Van:
{ label: 'AFLEIDEN & GRAAIEN', outcomes: { success: 'Je loopt op hem af...' } }
// Naar:
{ label: { nl: 'AFLEIDEN & GRAAIEN', en: 'DISTRACT & GRAB' }, outcomes: { success: { nl: '...', en: '...' } } }
```

---

## Omvang
- **Fase 1**: ~35 bestanden, ~500 vertaalsleutels voor UI
- **Fase 2**: ~30 bestanden, ~2000+ narratieve strings (vervolgopdracht)

