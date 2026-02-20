
# Multiplayer Leaderboard Integratie

## Overzicht
Een async multiplayer systeem waarbij spelers hun eigen game lokaal spelen, maar hun voortgang synchroniseren naar een online leaderboard. Andere spelers kunnen elkaars statistieken, reputatie en imperium bekijken.

## Wat de speler ziet
- Een "ONLINE" tab in het profiel met een live leaderboard
- Rankings op basis van reputatie, vermogen, districten, en dag
- Mogelijkheid om op een speler te klikken en hun stats te bekijken
- Optioneel: dagelijkse/wekelijkse competities

## Stappen

### 1. Lovable Cloud activeren
- Database, authenticatie en edge functions via Lovable Cloud inschakelen

### 2. Authenticatie toevoegen
- Login/registratie scherm (email + wachtwoord)
- Optioneel: anoniem spelen zonder sync, of inloggen om te synchroniseren
- Login knop op het MainMenu scherm

### 3. Database schema aanmaken
Tabellen:
- **profiles**: `id (FK auth.users)`, `username`, `created_at`
- **leaderboard_entries**: `id`, `user_id (FK profiles)`, `username`, `rep`, `cash`, `day`, `level`, `districts_owned`, `crew_size`, `karma`, `backstory`, `updated_at`

RLS policies:
- Iedereen mag leaderboard lezen (SELECT)
- Alleen eigen entry mag worden geschreven (INSERT/UPDATE)

### 4. Sync mechanisme bouwen
- Bij elke "DAG AFSLUITEN" worden de relevante stats naar `leaderboard_entries` gestuurd via een upsert
- Dit gebeurt alleen als de speler is ingelogd
- Geen impact op gameplay als je offline/uitgelogd speelt

### 5. Leaderboard UI bouwen
- Nieuwe tab "RANKING" in het profiel (of apart scherm)
- Tabel met top 50 spelers, gesorteerd op reputatie
- Filter opties: op reputatie, vermogen, dag, of districten
- Klikbaar om detail-stats van een speler te zien
- Eigen positie wordt altijd getoond (highlighted)

### 6. Integratie in bestaande flow
- MainMenu: "ONLINE" knop naast Continue/New Game
- GameHeader: klein online-indicator icoontje als je bent ingelogd
- ProfileView: extra tab voor het leaderboard

## Technische details

### Database migratie
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  username TEXT NOT NULL,
  rep INTEGER DEFAULT 0,
  cash INTEGER DEFAULT 0,
  day INTEGER DEFAULT 1,
  level INTEGER DEFAULT 1,
  districts_owned INTEGER DEFAULT 0,
  crew_size INTEGER DEFAULT 0,
  karma INTEGER DEFAULT 0,
  backstory TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public read" ON leaderboard_entries FOR SELECT USING (true);
CREATE POLICY "Own write" ON leaderboard_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own update" ON leaderboard_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
```

### Sync functie (in GameContext of engine)
Na `END_TURN` dispatch, een `upsert` naar `leaderboard_entries` met de huidige stats.

### Nieuwe componenten
- `src/components/game/LeaderboardView.tsx` - Hoofdscherm met ranking tabel
- `src/components/game/PlayerDetailPopup.tsx` - Detail popup bij klik op speler
- `src/pages/Auth.tsx` - Login/registratie pagina

### Bestaande wijzigingen
- `src/pages/Index.tsx` - Login flow toevoegen
- `src/components/game/ProfileView.tsx` - Leaderboard tab toevoegen
- `src/contexts/GameContext.tsx` - Sync logic na END_TURN
- `src/components/game/MainMenu.tsx` - Online knop toevoegen
