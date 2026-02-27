

## Plan: Stadskaart verbeteren voor MMO

De kaart is momenteel puur single-player — je ziet alleen je eigen positie. Voor een MMO moet de kaart een **levende, gedeelde wereld** tonen met andere spelers, gang-activiteit en realtime events.

### Verbeteringen

**1. Andere spelers op de kaart tonen**
- Query `player_state` (kolom `loc`) via een nieuwe edge function action `get_district_players` die per district het aantal online spelers telt (actief in de laatste 15 min)
- Toon per district een klein teller-badge met het aantal actieve spelers (bijv. "👥 12")
- Optioneel: toon 3-5 bewegende speler-dots per district als visueel element

**2. Gang territorium-kleuren op de kaart**
- Query `gang_territories` en toon de dominante gang per district met hun kleur/tag
- Verander de district-label border-kleur naar de gang-kleur als een gang het controleert
- Toon gang-tag naast de district-naam (bijv. "[SYN] Crown Heights")

**3. Realtime district-events**
- Maak een `district_events` tabel (id, district_id, event_type, message, created_at, expires_at)
- Events: gang wars, police raids, market crashes, bounty hunts
- Toon als pulserende iconen op de kaart met tooltips
- Vul vanuit de `passive-income` edge function of game-actions

**4. District "Danger Level" indicator**
- Bereken per district: aantal recente PvP fights + politie heat + gang war status
- Toon als kleur-gradient overlay op het district (groen→geel→rood)
- Update elke 30 seconden via polling

**5. Mini-leaderboard per district**
- Bij het klikken op een district, toon de top 5 spelers die daar actief zijn
- Query `player_state` + `profiles` gefilterd op `loc = district_id`

**6. Live activity feed op de kaart**
- Vervang de huidige statische `NewsTicker` met realtime events uit de database
- Toon recente PvP kills, grote trades, gang conquests als scrollende ticker

### Implementatiestappen

1. **Database**: Maak `district_events` tabel + enable realtime op `gang_territories`
2. **Edge function**: Nieuwe action `get_district_players` die speler-counts per district + recente events retourneert
3. **CityMap component**: Voeg `PlayerCountBadge` per district toe — klein donker label met 👥 count
4. **CityMap component**: Voeg `GangTerritoryOverlay` toe — gekleurde district borders op basis van gang_territories data
5. **CityMap component**: Voeg `DistrictEventMarkers` toe — pulserende iconen voor actieve events
6. **CityMap component**: Voeg `DangerLevelOverlay` toe — subtiele kleur-tint per district op basis van activiteit
7. **DistrictPopup**: Voeg mini-leaderboard toe met top 5 actieve spelers in dat district
8. **MapView**: Hook up polling (elke 30s) voor district data + realtime subscription voor gang territory changes
9. **NewsTicker**: Vervang client-side nieuws met server-side realtime events

### Technische details

- `district_events` schema: `id uuid, district_id text, event_type text, title text, description text, data jsonb, created_at timestamptz, expires_at timestamptz`
- RLS: iedereen kan lezen (publiek zichtbaar), alleen service_role kan schrijven
- Realtime: `ALTER PUBLICATION supabase_realtime ADD TABLE public.district_events;`
- Polling endpoint retourneert: `{ playerCounts: Record<DistrictId, number>, recentEvents: DistrictEvent[], territories: GangTerritory[] }`

