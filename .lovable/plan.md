

## Underworld Economy — Uitbreidingsplan

Na analyse van de bestaande systemen (reizen, smokkelroutes, drug imperium, corruptie, zwarte markt, goederenhandel) zijn dit de onderdelen die ontbreken of onvoldoende uitgewerkt zijn:

---

### 1. Wapenhandel Netwerk
Nieuw systeem: `src/game/armsDealing.ts`

Spelers kunnen een **wapenhandelnetwerk** opzetten parallel aan het drug imperium:
- **Wapen-contacten** per district die wekelijks bestellingen plaatsen (pistolen, SMGs, rifles)
- Inkomsten schalen met hoeveelheid contacten en district-reputatie
- **Risico**: politie-interceptie bij hoge heat, rivaliserende facties die concurreren
- Vereist: eigen wapens uit arsenaal "verkopen" aan contacten, of bulk-inkoop via internationale reizen
- UI: tab in TradeView of als sub-panel

### 2. Smokkelroute Upgrades & Specialisaties
Uitbreiding van bestaande `SmuggleRoute` in types.ts:

Huidige routes zijn simpel (from/to/good/active). Uitbreiden met:
- **Route-levels** (1-3): hogere levels = meer capaciteit, lagere interceptiekans
- **Specialisatie**: route specialiseren in één goedtype voor +50% winst
- **Escortes**: crew-leden toewijzen aan routes voor bescherming (Enforcer = -30% interceptie)
- **Upgrade-kosten** stijgen per level, vereisen scrap of dirty money

### 3. Witwas Uitbreiding
Uitbreiding van bestaand LaunderingPanel:

- **Witwas-methodes**: naast het bestaande systeem, 3 nieuwe methodes toevoegen:
  - **Casino Witwas**: via casinowinsten (laag risico, lage throughput, vereist Neon Strip)
  - **Crypto Mixing**: via crypto wallets (hoog risico, hoge throughput)
  - **Vastgoed Shell Companies**: via properties (nul risico, zeer trage throughput, vereist 3+ properties)
- Elke methode heeft eigen kosten, snelheid en detectierisico

### 4. Zwarte Markt Prijsfluctuaties
Uitbreiding van BlackMarket + goederenprijzen:

- **Dynamische wapenprijzen**: Zwarte Markt items worden duurder/goedkoper op basis van:
  - Actieve gang wars → wapenprijzen +30%
  - DEA-onderzoek actief → drugsprijzen -20% (niemand wil kopen)
  - Week-events die specifieke categorieën beïnvloeden
- **Insider-tips** via corrupte contacten: vooraf weten welke prijzen gaan stijgen
- Visueel: prijstrend-pijlen in de Zwarte Markt UI

### 5. Ondergrondse Warenhuizen (Stash Houses)
Nieuw concept gekoppeld aan safehouses:

- **Stash Houses**: opslaglocaties voor illegale goederen verspreid over districten
- Capaciteit per stash afhankelijk van safehouse-level
- Goederen opslaan buiten je hoofdinventaris (beschermt tegen raids/arrestatie)
- **Risico**: stash houses kunnen ontdekt worden als heat te hoog is → confiscatie
- Tactisch element: spreid je voorraad om risico te minimaliseren

---

### Technisch Overzicht

| Component | Bestand | Wijziging |
|---|---|---|
| Wapenhandel logica | `src/game/armsDealing.ts` | Nieuw |
| Wapenhandel UI | `src/components/game/trade/ArmsDealingPanel.tsx` | Nieuw |
| Smokkelroute upgrades | `src/game/types.ts` (SmuggleRoute), reducer | Uitbreiding |
| Smokkelroute upgrade UI | Bestaande TravelView uitbreiden | Uitbreiding |
| Witwas methodes | `src/game/constants.ts`, LaunderingPanel | Uitbreiding |
| Prijsfluctuaties | `src/game/blackMarket.ts`, BlackMarketView | Uitbreiding |
| Stash Houses | `src/game/types.ts`, safehouse reducer | Uitbreiding |
| Stash Houses UI | `src/components/game/SafehouseView.tsx` | Uitbreiding |
| View registry | `src/components/game/viewRegistry.ts` | Arms Dealing toevoegen |
| Sidebar | Desktop/Mobile sidebar | Navigatie links |

Alle wijzigingen zijn client-side. Geen database migraties nodig. GameState krijgt nieuwe velden: `armsNetwork`, `stashHouses`, `launderMethods`, `marketPriceModifiers`.

