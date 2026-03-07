

# Cinematic UI — Overige Views die nog geüpgraded kunnen worden

Na de eerdere rondes (Combat, Missions, Heist, Casino, Hospital, District, Safehouse) zijn er nog diverse views die de oude platte stijl gebruiken. Hier een overzicht per prioriteit:

---

## Groep 1: Gameplay-kern (hoge impact)

### PvP Attack View (`PvPAttackView.tsx`, 433 regels)
- Geen cinematic header, platte speler-lijst
- **Upgrade**: Cinematic "ARENA" header, target-kaarten met stat-vergelijking als visuele bars, aanvalsresultaat als cinematic overlay

### War View (`WarView.tsx`, 353 regels)
- Standaard lijst met oorlogsdata
- **Upgrade**: Oorlogs-banner header met vlam-effecten, actieve oorlogen als "versus-kaarten" met score-vergelijking, geschiedenis als timeline

### Gang View (`GangView.tsx`, 750 regels)
- Grootste ongeüpgradede view, veel tabs
- **Upgrade**: Gang-banner header met tag/level, member-kaarten, territory als visuele grid, chat met betere styling

### Corruption View (`CorruptionView.tsx`, 348 regels)
- Platte contactenlijst
- **Upgrade**: Noir "CONNECTIES" header, contact-kaarten met portret, cost/benefit badges, actieve bescherming als stat-dashboard

---

## Groep 2: Progressie & Economie (medium impact)

### Travel View (`TravelView.tsx`, 441 regels)
- Heeft al DestinationCards maar zonder cinematic header
- **Upgrade**: Wereldkaart-header, bestemmingskaarten met vlag-banners, reis-in-progress als cinematic overlay

### Properties View (`PropertiesView.tsx`, 179 regels)
- Simpele lijst met property upgrades
- **Upgrade**: Cinematic header met huidige woning, property-kaarten met afbeelding-banners en perk-badges

### Education View (`EducationView.tsx`, 222 regels)
- Cursuskaarten zonder sfeer
- **Upgrade**: "ACADEMIE" header, cursuskaarten met categorie-kleuren en progress-indicators

### Jobs View (`JobsView.tsx`, 230 regels)
- Platte banen-lijst
- **Upgrade**: "WERKGELEGENHEID" header, job-kaarten met emoji-banner, salaris/perk als badges

### Gym View (`GymView.tsx`, 218 regels)
- Simpele stat-training UI
- **Upgrade**: "TRAININGSKAMP" header, gym-selectie als locatie-kaarten, stat-training als interactieve kaarten

---

## Groep 3: Social & Meta (lagere impact)

### Merit Points View (`MeritPointsView.tsx`, 230 regels)
- Functioneel maar plat
- **Upgrade**: "VERDIENSTEN" header, categorie-tabs als kaarten, node-upgrades met visuele skill-tree stijl

### Leaderboard View (`LeaderboardView.tsx`, 257 regels)
- Standaard tabel
- **Upgrade**: "HALL OF FAME" banner, top-3 als podium-kaarten, rest als gestylede rijen

### Profile View (`ProfileView.tsx`, 431 regels)
- Grote hub met sub-tabs
- **Upgrade**: Cinematic profiel-header met speler-stats overlay, sub-panels consistent met nieuwe stijl

### Daily Challenges (`DailyChallengesView.tsx`, 187 regels)
- Heeft al een banner — minste werk nodig
- **Upgrade**: Challenge-kaarten iets meer uitwerken met categorie-kleuren

---

## Aanbevolen aanpak

**Groep 1 eerst** — dit zijn de views die spelers het vaakst zien en waar de upgrade het meeste verschil maakt. Groep 2 en 3 kunnen daarna in batches.

Totaal: ~13 views, allemaal puur visueel, geen gameplay-logica wijzigingen.

