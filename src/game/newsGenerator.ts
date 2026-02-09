/**
 * Dynamic News Generator — Generates context-aware news based on game state
 */

import { GameState, DistrictId, FamilyId } from './types';
import { DISTRICTS, FAMILIES, GOODS } from './constants';

export type NewsUrgency = 'low' | 'medium' | 'high';
export type NewsCategory = 'player' | 'faction' | 'market' | 'weather' | 'heat' | 'crew' | 'flavor';

export interface NewsItem {
  text: string;
  category: NewsCategory;
  urgency: NewsUrgency;
  icon: string;
  detail?: string;
}

// ========== FLAVOR POOL (30+ berichten) ==========

const FLAVOR_NEWS: { text: string; icon: string; detail?: string }[] = [
  { text: 'Burgemeester ontkent banden met onderwereld — "Absurd en ongefundeerd"', icon: '🏛️', detail: 'Burgemeester Van Dijk reageerde furieus op beschuldigingen tijdens een persconferentie.' },
  { text: 'Restaurant "La Notte" in Crown Heights uitgeroepen tot beste van het jaar', icon: '🍽️', detail: 'De jury was unaniem: "Een culinaire ervaring die je niet snel vergeet."' },
  { text: 'Mysterieuze graffiti verschijnt op muren in Lowrise: "WIJ ZIEN ALLES"', icon: '👁️', detail: 'Bewoners zijn ongerust. Politie heeft geen verdachten.' },
  { text: 'Noxhaven FC wint derby na controversieel doelpunt', icon: '⚽', detail: 'De VAR keurde het doelpunt goed ondanks protesten van de tegenstander.' },
  { text: 'Havenarbeiders dreigen met staking na loonconflict', icon: '⚓', detail: 'De vakbond eist 8% loonsverhoging en betere arbeidsomstandigheden.' },
  { text: 'Nieuwe nachtclub "Eclipse" trekt honderden bezoekers in Neon Strip', icon: '🌙', detail: 'De openingsavond werd bijgewoond door lokale beroemdheden en influencers.' },
  { text: 'Stroomuitval treft delen van Iron Borough — oorzaak onbekend', icon: '💡', detail: 'Energiebedrijf NoxPower belooft binnen 24 uur herstel.' },
  { text: 'Archeologen ontdekken oude tunnels onder Crown Heights', icon: '🏗️', detail: 'De tunnels dateren mogelijk uit de 18e eeuw en waren gebruikt door smokkelaars.' },
  { text: 'Populaire food truck "El Fuego" verhuist naar Port Nero', icon: '🌮', detail: 'Eigenaar zegt: "Meer klanten, meer actie, meer smaak."' },
  { text: 'Verdachte brand verwoest leegstaand pakhuis in Lowrise', icon: '🔥', detail: 'Brandweer vermoedt brandstichting. Politie start onderzoek.' },
  { text: 'Stadsraad keurt nieuw cameranetwerk goed voor binnenstad', icon: '📷', detail: 'Privacy-activisten noemen het plan "Big Brother op steroïden".' },
  { text: 'Bekende DJ gearresteerd voor drugsbezit in Neon Strip', icon: '🎧', detail: 'De artiest werd aangehouden na een optreden in club Velvet.' },
  { text: '"Kinderen van Noxhaven" organiseert liefdadigheidsactie in Lowrise', icon: '❤️', detail: 'De stichting zamelde €15.000 in voor kansarme gezinnen.' },
  { text: 'Mysterieuze zwarte bestelbus gespot in meerdere wijken', icon: '🚐', detail: 'Bewoners melden de bus al drie nachten op rij. Politie zegt "niets aan de hand".' },
  { text: 'Haven van Port Nero breekt exportrecord dit kwartaal', icon: '📦', detail: 'De toename wordt toegeschreven aan groeiende vraag uit het buitenland.' },
  { text: 'Daklozenopvang in Iron Borough dreigt te sluiten wegens bezuinigingen', icon: '🏚️', detail: 'Vrijwilligers starten een petitie om de opvang open te houden.' },
  { text: 'Luxe jacht aangemeerd in Port Nero haven — eigenaar onbekend', icon: '🛥️', detail: 'Het 40 meter lange jacht is geregistreerd in Panama.' },
  { text: 'Straatartiest wordt virale sensatie met muurschildering in Lowrise', icon: '🎨', detail: 'Het kunstwerk toont een reus die over de skyline van Noxhaven kijkt.' },
  { text: 'Dierentuin breidt uit met nieuw nachtverblijf in Iron Borough', icon: '🦁', detail: 'Het nieuwe verblijf wordt gesponsord door een anonieme donor.' },
  { text: 'Politie pakt illegale gokkring op in kelder van Crown Heights', icon: '🎲', detail: 'Twaalf verdachten werden gearresteerd. €200.000 in beslag genomen.' },
  { text: 'Metro-lijn 3 kampt opnieuw met vertragingen door defecte wissels', icon: '🚇', detail: 'Reizigers moeten rekening houden met 20 minuten extra reistijd.' },
  { text: 'Oud-commissaris schrijft onthullend boek over corruptie bij NHPD', icon: '📖', detail: '"Alles wat ik heb gezien in 30 jaar dienst — en waarom ik zweeg."' },
  { text: 'Noxhaven ontvangt UNESCO-nominatie voor historisch havengebied', icon: '🏆', detail: 'Het stadsbestuur noemt de nominatie "een eer voor onze rijke historie".' },
  { text: 'Wolkenkrabber "The Spire" in Crown Heights bijna voltooid', icon: '🏗️', detail: 'Het 65 verdiepingen tellende gebouw wordt het hoogste van Noxhaven.' },
  { text: 'Vissersboten blokkeren haven uit protest tegen milieuwetgeving', icon: '🐟', detail: 'Vissers zeggen dat de nieuwe regels hun broodwinning bedreigen.' },
  { text: 'Explosieve groei van cryptocurrency-handel in Neon Strip', icon: '₿', detail: 'Experts waarschuwen voor een mogelijke bubbel in de digitale munt.' },
  { text: 'Stadspark krijgt nieuw monument ter ere van havenarbeiders', icon: '⚓', detail: 'Het bronzen beeld wordt onthuld tijdens de jaarlijkse havendag.' },
  { text: 'Ratten overlast in Lowrise bereikt recordhoogte', icon: '🐀', detail: 'Gemeente stuurt extra ongediertebestrijders de wijk in.' },
  { text: 'Filmploeg spotted in Crown Heights — opnames van nieuwe thriller', icon: '🎬', detail: 'Geruchten spreken over een film gebaseerd op de Noxhaven onderwereld.' },
  { text: 'IT-bedrijf opent nieuw kantoor in Neon Strip — 200 banen verwacht', icon: '💻', detail: 'CEO: "Noxhaven heeft precies het talent dat we zoeken."' },
  { text: 'Traditionele markt in Iron Borough viert 50-jarig jubileum', icon: '🎉', detail: 'De markt is elke zaterdag open en trekt bezoekers uit de hele stad.' },
  { text: 'Anonieme tip leidt tot vondst van wapenarsenaal in kelder', icon: '🔫', detail: 'Politie trof tientallen vuurwapens aan in een woning in Lowrise.' },
];

// ========== GENERATOR FUNCTIONS ==========

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickDistrict(): string {
  const ids: DistrictId[] = ['port', 'crown', 'iron', 'low', 'neon'];
  return DISTRICTS[pick(ids)].name;
}

function playerActionNews(state: GameState): NewsItem[] {
  const items: NewsItem[] = [];

  // High money
  if (state.money > 200000) {
    items.push({
      text: `Mysterieuze miljonair investeert massaal in vastgoed — "Iemand koopt de stad op"`,
      category: 'player', urgency: 'medium', icon: '💰',
      detail: `Een onbekende investeerder met een geschat vermogen van meer dan €${Math.floor(state.money / 1000)}k is actief in Noxhaven.`,
    });
  }

  // Owned districts
  if (state.ownedDistricts.length >= 3) {
    items.push({
      text: `Vastgoed-imperium groeit: ${state.ownedDistricts.length} wijken onder nieuwe eigenaar`,
      category: 'player', urgency: 'medium', icon: '🏢',
      detail: 'Meerdere districten zijn in korte tijd van eigenaar gewisseld. Experts spreken van een "vijandige overname".',
    });
  }

  // Recent district purchase (high rep in a district)
  for (const d of state.ownedDistricts) {
    if ((state.districtRep[d] || 0) > 80) {
      items.push({
        text: `Bewoners van ${DISTRICTS[d].name} melden "nieuwe machtsstructuur" in de wijk`,
        category: 'player', urgency: 'low', icon: '🏘️',
        detail: `De invloed van een onbekende figuur in ${DISTRICTS[d].name} groeit snel. Lokale ondernemers voelen de druk.`,
      });
      break;
    }
  }

  // High level
  if (state.player.level >= 8) {
    items.push({
      text: `NHPD waarschuwt voor "nieuwe speler" in de georganiseerde misdaad`,
      category: 'player', urgency: 'high', icon: '⚠️',
      detail: 'Commissaris Decker: "We zien een nieuw netwerk opkomen dat sneller groeit dan alles wat we eerder hebben gezien."',
    });
  }

  // Active heist cooldowns (completed heists)
  const completedHeists = Object.keys(state.heistCooldowns || {});
  if (completedHeists.length > 0) {
    const district = pick(Object.keys(DISTRICTS) as DistrictId[]);
    items.push({
      text: `BREAKING: Politie onderzoekt reeks overvallen — "Professioneel werk"`,
      category: 'player', urgency: 'high', icon: '🚨',
      detail: `De NHPD ziet een verband tussen recente overvallen in ${DISTRICTS[district].name}. Forensisch bewijs is schaars.`,
    });
  }

  return items;
}

function factionNews(state: GameState): NewsItem[] {
  const items: NewsItem[] = [];

  for (const [fid, fam] of Object.entries(FAMILIES)) {
    const rel = state.familyRel[fid as FamilyId] || 0;

    if (rel < -30) {
      items.push({
        text: `${fam.name} mobiliseert troepen — "Er komt een afrekening"`,
        category: 'faction', urgency: 'high', icon: '⚔️',
        detail: `Bronnen melden dat ${fam.contact} bevel heeft gegeven tot vergelding na "onacceptabele provocaties".`,
      });
    } else if (rel > 50) {
      items.push({
        text: `${fam.name} breidt invloed uit met steun van onbekende partner`,
        category: 'faction', urgency: 'medium', icon: '🤝',
        detail: `${fam.contact} is recent gezien met een mysterieuze bondgenoot. De samenwerking baart rivalen zorgen.`,
      });
    }

    // War state (pendingWarEvent)
    if (state.pendingWarEvent) {
      items.push({
        text: `OORLOG: Schietpartij in ${DISTRICTS[fam.home].name} — ${fam.name} en rivalen clashen`,
        category: 'faction', urgency: 'high', icon: '💥',
        detail: `De spanningen met ${fam.name} escaleren. Bewoners worden geadviseerd binnen te blijven.`,
      });
    }
  }

  // Conquered factions
  if ((state.conqueredFactions?.length || 0) > 0) {
    const conquered = state.conqueredFactions![state.conqueredFactions!.length - 1];
    const fam = FAMILIES[conquered];
    if (fam) {
      items.push({
        text: `${fam.name} in vrije val — leiderschap ingestort na reeks nederlagen`,
        category: 'faction', urgency: 'medium', icon: '📉',
        detail: `Het rijk van ${fam.contact} brokkelt af. Voormalige leden vluchten de stad uit.`,
      });
    }
  }

  return items;
}

function marketNews(state: GameState): NewsItem[] {
  const items: NewsItem[] = [];

  // Check demand shifts
  for (const distId of Object.keys(state.districtDemands || {})) {
    const demands = (state.districtDemands as any)?.[distId];
    if (!demands) continue;
    for (const [goodId, demand] of Object.entries(demands)) {
      if ((demand as number) > 1.5) {
        const good = GOODS.find(g => g.id === goodId);
        if (good) {
          items.push({
            text: `${good.name}-prijzen stijgen explosief in ${DISTRICTS[distId as DistrictId]?.name || distId}`,
            category: 'market', urgency: 'medium', icon: '📈',
            detail: `De vraag naar ${good.name} is meer dan verdubbeld. Handelaren zien hun winsten exploderen.`,
          });
          break;
        }
      }
    }
  }

  // Debt news
  if (state.debt > 100000) {
    items.push({
      text: `Woekeraars actief in Noxhaven — "Schulden worden niet vergeten"`,
      category: 'market', urgency: 'high', icon: '💸',
      detail: `Er gaan geruchten dat een grote schuldenaar op de vlucht is. De rente tikt door.`,
    });
  }

  return items;
}

function weatherNews(state: GameState): NewsItem[] {
  const items: NewsItem[] = [];

  switch (state.weather) {
    case 'storm':
      items.push({
        text: 'Code Oranje: Zware storm trekt over Noxhaven — havens gesloten',
        category: 'weather', urgency: 'high', icon: '⛈️',
        detail: 'Het KNMI waarschuwt voor windstoten tot 100 km/u. Alle havenactiviteit is stilgelegd.',
      });
      break;
    case 'fog':
      items.push({
        text: 'Dichte mist legt verkeer lam — zichtbaarheid onder 50 meter',
        category: 'weather', urgency: 'medium', icon: '🌫️',
        detail: 'De politie adviseert om niet de weg op te gaan tenzij strikt noodzakelijk.',
      });
      break;
    case 'heatwave':
      items.push({
        text: 'Hittegolf dag 3: temperaturen boven de 35°C — "Blijf hydrateren"',
        category: 'weather', urgency: 'low', icon: '🌡️',
        detail: 'Ziekenhuizen melden een toename in hittegerelateerde klachten.',
      });
      break;
    case 'rain':
      items.push({
        text: 'Aanhoudende regenval zorgt voor wateroverlast in Lowrise',
        category: 'weather', urgency: 'low', icon: '🌧️',
        detail: 'Het riool kan de hoeveelheid water niet meer verwerken. Kelders staan onder water.',
      });
      break;
  }

  return items;
}

function heatNews(state: GameState): NewsItem[] {
  const items: NewsItem[] = [];
  const totalHeat = state.heat;

  if (totalHeat >= 80) {
    items.push({
      text: 'MANHUNT: NHPD zet speciale eenheden in — "We zitten ze op de hielen"',
      category: 'heat', urgency: 'high', icon: '🚁',
      detail: 'Commissaris Decker heeft een klopjacht bevolen. Helikopters patrouilleren boven de stad.',
    });
  } else if (totalHeat >= 60) {
    items.push({
      text: 'Politie verhoogt patrouilles in alle wijken na reeks incidenten',
      category: 'heat', urgency: 'high', icon: '🚔',
      detail: 'Extra eenheden zijn ingezet in het hele stadsgebied. Controles op de wegen nemen toe.',
    });
  } else if (totalHeat >= 40) {
    items.push({
      text: 'NHPD: "Criminaliteitscijfers stijgen — we houden de situatie scherp in de gaten"',
      category: 'heat', urgency: 'medium', icon: '👮',
      detail: 'De politie benadrukt dat ze alle middelen inzetten om de orde te handhaven.',
    });
  } else if (totalHeat <= 10) {
    items.push({
      text: 'Politie meldt rustiger week — "Noxhaven voelt veiliger"',
      category: 'heat', urgency: 'low', icon: '🕊️',
      detail: 'De criminaliteitscijfers zijn gedaald. Bewoners merken het verschil.',
    });
  }

  // Prison
  if (state.prison) {
    items.push({
      text: 'Verdachte opgepakt en vastgezet — "Gerechtigheid is gediend"',
      category: 'heat', urgency: 'high', icon: '⛓️',
      detail: 'Een verdachte van meerdere misdrijven is opgesloten in de Noxhaven Penitentiaire Inrichting.',
    });
  }

  // Hiding
  if ((state.hidingDays || 0) > 0) {
    items.push({
      text: 'Politie kampt met spoorverlies bij zoektocht naar verdachte',
      category: 'heat', urgency: 'medium', icon: '🔍',
      detail: 'De verdachte lijkt ondergedoken. De NHPD vraagt het publiek om tips.',
    });
  }

  return items;
}

function crewNews(state: GameState): NewsItem[] {
  const items: NewsItem[] = [];

  // Injured crew
  const injured = state.crew.filter(c => c.hp < 40 && c.hp > 0);
  if (injured.length > 0) {
    items.push({
      text: `Gewonden gemeld na vermoedelijk bendegeweld in ${pickDistrict()}`,
      category: 'crew', urgency: 'medium', icon: '🏥',
      detail: `Ziekenhuizen behandelen meerdere patiënten met verwondingen die wijzen op crimineel geweld.`,
    });
  }

  // Large crew
  if (state.crew.length >= 6) {
    items.push({
      text: 'Politie waarschuwt voor groeiende criminele organisatie in Noxhaven',
      category: 'crew', urgency: 'medium', icon: '👥',
      detail: 'Inlichtingendiensten signaleren een snelgroeiend netwerk van criminelen dat opereert vanuit meerdere wijken.',
    });
  }

  // Safehouses
  if (state.safehouses.length >= 2) {
    items.push({
      text: `Mysterieuze bouwactiviteit gespot in ${pickDistrict()} — "Niemand weet wie de opdrachtgever is"`,
      category: 'crew', urgency: 'low', icon: '🏠',
      detail: 'Meerdere panden in de stad zijn recentelijk verbouwd. Buren klagen over nachtelijk lawaai.',
    });
  }

  // Nemesis
  if (state.nemesis && !state.nemesis.defeated) {
    items.push({
      text: `Rivaliserende crimineel "${state.nemesis.name}" claimt territorium in ${DISTRICTS[state.nemesis.location]?.name || 'onbekende wijk'}`,
      category: 'crew', urgency: 'high', icon: '🎭',
      detail: `${state.nemesis.name} wordt steeds brutaler. Bewoners vrezen een escalatie.`,
    });
  }

  return items;
}

// ========== MAIN GENERATOR ==========

export function generateDailyNews(state: GameState): NewsItem[] {
  // Collect all possible contextual news
  const allContextual: NewsItem[] = [
    ...playerActionNews(state),
    ...factionNews(state),
    ...marketNews(state),
    ...weatherNews(state),
    ...heatNews(state),
    ...crewNews(state),
  ];

  // Shuffle and pick 1-2 contextual items
  const shuffled = allContextual.sort(() => Math.random() - 0.5);
  const contextCount = Math.min(shuffled.length, 1 + (Math.random() < 0.6 ? 1 : 0));
  const selected: NewsItem[] = shuffled.slice(0, contextCount);

  // Always add 1 flavor item
  const usedTexts = new Set(selected.map(n => n.text));
  const availableFlavor = FLAVOR_NEWS.filter(f => !usedTexts.has(f.text));
  const flavor = pick(availableFlavor.length > 0 ? availableFlavor : FLAVOR_NEWS);
  selected.push({
    text: flavor.text,
    category: 'flavor',
    urgency: 'low',
    icon: flavor.icon,
    detail: flavor.detail,
  });

  // Ensure high-urgency items come first
  selected.sort((a, b) => {
    const order: Record<NewsUrgency, number> = { high: 0, medium: 1, low: 2 };
    return order[a.urgency] - order[b.urgency];
  });

  return selected;
}
