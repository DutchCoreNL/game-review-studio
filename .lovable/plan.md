
# Visuele Upgrades voor Resterende Game Views

## Overzicht

De volgende views hebben al een achtergrond: **CityMap, Casino, Combat, Villa, ChopShop, Safehouse**. De resterende hoofdviews die nog geen sfeervolle achtergrond hebben:

| View | Thema | Achtergrond-idee |
|------|-------|-----------------|
| **TradeView** (Markt/Witwassen/Gear) | Zwarte markt | Donker pakhuis met kratten, neonlichten en contant geld op tafel |
| **OperationsView** (Missies/Contracten/Crew) | Operatiecentrum | War room met kaarten aan de muur, walkietalkies, tactisch bord |
| **ProfileView** (Stats/Achievements) | Persoonlijk kantoor | Luxe donker kantoor met whisky, sigaren en een bureau |
| **ImperiumView** (Assets/Business/Facties) | Machtscentrum | Penthouse met panoramisch uitzicht over de stad bij nacht |
| **HeistView** (Overvallen plannen) | Planning room | Blauwdrukken op tafel, maskers, gereedschap, donkere kelder |

## Technische aanpak

Per view dezelfde bewezen methode:

1. **Afbeelding genereren** met een passende prompt (donker, cinematisch, noir-sfeer)
2. **Asset opslaan** als JPG in `src/assets/`
3. **Import toevoegen** bovenaan de component
4. **Wrapper toevoegen** rond de return JSX:
   - `relative min-h-[70vh] -mx-3 -mt-2 px-3 pt-2` container
   - `<img>` met `opacity-20`, `object-cover`, `pointer-events-none`
   - Gradient overlay `from-background via-background/70 to-background/30`
   - Content in `relative z-10` div

## Stappen

1. Genereer 5 achtergrondafbeeldingen (parallel) met de volgende prompts:
   - **Trade**: "Dark underground warehouse black market, wooden crates with contraband, neon price tags, cash bundles on table, dim fluorescent lighting, noir atmosphere"
   - **Operations**: "Dark tactical war room interior, city maps pinned to wall, radio equipment, mission briefing board with photos connected by string, dim desk lamp, noir cinematic"
   - **Profile**: "Dark luxury mafia boss office, mahogany desk, whisky glass, cigar smoke, leather chair, city night view through blinds, noir cinematic lighting"
   - **Imperium**: "Dark penthouse overlooking city at night, floor-to-ceiling windows, empire map on wall, chess pieces on table, power and wealth atmosphere, noir cinematic"
   - **Heist**: "Dark basement heist planning room, blueprints spread on table, ski masks, lockpicking tools, duffel bags, tactical equipment, dim single hanging bulb, noir cinematic"

2. Pas elk van de 5 view-bestanden aan:
   - `src/components/game/TradeView.tsx`
   - `src/components/game/OperationsView.tsx`
   - `src/components/game/ProfileView.tsx`
   - `src/components/game/ImperiumView.tsx`
   - `src/components/game/heist/HeistView.tsx`

3. Elke aanpassing volgt hetzelfde patroon: import toevoegen, wrapper div rond de return, achtergrond + gradient + z-10 content.
