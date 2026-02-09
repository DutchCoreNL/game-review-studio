/**
 * Dynamic News Generator — Generates context-aware news based on game state
 */

import { GameState, DistrictId, FamilyId } from './types';
import { DISTRICTS, FAMILIES, GOODS } from './constants';

export type NewsUrgency = 'low' | 'medium' | 'high';
export type NewsCategory = 'player' | 'faction' | 'market' | 'weather' | 'heat' | 'crew' | 'corruption' | 'vehicle' | 'karma' | 'villa' | 'flavor';

export interface NewsItem {
  text: string;
  category: NewsCategory;
  urgency: NewsUrgency;
  icon: string;
  detail?: string;
}

// ========== FLAVOR POOL (32 berichten) ==========

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

// ========== HELPERS ==========

function pick<T>(arr: T[]): T {
  if (arr.length === 0) throw new Error('pick() called on empty array');
  return arr[Math.floor(Math.random() * arr.length)];
}

function safePick<T>(arr: T[], fallback: T): T {
  return arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : fallback;
}

function pickDistrict(): string {
  const ids: DistrictId[] = ['port', 'crown', 'iron', 'low', 'neon'];
  return DISTRICTS[pick(ids)].name;
}

// Pick at most one item per category to avoid repetition within a category
function deduplicateByCategory(items: NewsItem[]): NewsItem[] {
  const seen = new Set<NewsCategory>();
  return items.filter(item => {
    if (seen.has(item.category)) return false;
    seen.add(item.category);
    return true;
  });
}

// ========== GENERATOR FUNCTIONS ==========

function playerActionNews(state: GameState): NewsItem[] {
  const items: NewsItem[] = [];

  // High money
  if (state.money > 200000) {
    items.push({
      text: 'Mysterieuze miljonair investeert massaal in vastgoed — "Iemand koopt de stad op"',
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

  // High rep in owned district
  for (const d of state.ownedDistricts) {
    if ((state.districtRep[d] || 0) > 80) {
      items.push({
        text: `Bewoners van ${DISTRICTS[d].name} melden "nieuwe machtsstructuur" in de wijk`,
        category: 'player', urgency: 'low', icon: '🏘️',
        detail: `De invloed van een onbekende figuur in ${DISTRICTS[d].name} groeit snel. Lokale ondernemers voelen de druk.`,
      });
      break; // max 1
    }
  }

  // High level
  if (state.player.level >= 8) {
    items.push({
      text: 'NHPD waarschuwt voor "nieuwe speler" in de georganiseerde misdaad',
      category: 'player', urgency: 'high', icon: '⚠️',
      detail: 'Commissaris Decker: "We zien een nieuw netwerk opkomen dat sneller groeit dan alles wat we eerder hebben gezien."',
    });
  }

  // Completed heists
  if (Object.keys(state.heistCooldowns || {}).length > 0) {
    items.push({
      text: 'BREAKING: Politie onderzoekt reeks overvallen — "Professioneel werk"',
      category: 'player', urgency: 'high', icon: '🚨',
      detail: `De NHPD ziet een verband tussen recente overvallen in ${pickDistrict()}. Forensisch bewijs is schaars.`,
    });
  }

  return items;
}

function factionNews(state: GameState): NewsItem[] {
  const items: NewsItem[] = [];

  // Pick the most extreme faction relationship for news
  let mostHostile: { fid: string; rel: number } | null = null;
  let mostFriendly: { fid: string; rel: number } | null = null;

  for (const [fid] of Object.entries(FAMILIES)) {
    const rel = state.familyRel[fid as FamilyId] || 0;
    if (rel < -30 && (!mostHostile || rel < mostHostile.rel)) mostHostile = { fid, rel };
    if (rel > 50 && (!mostFriendly || rel > mostFriendly.rel)) mostFriendly = { fid, rel };
  }

  if (mostHostile) {
    const fam = FAMILIES[mostHostile.fid];
    items.push({
      text: `${fam.name} mobiliseert troepen — "Er komt een afrekening"`,
      category: 'faction', urgency: 'high', icon: '⚔️',
      detail: `Bronnen melden dat ${fam.contact} bevel heeft gegeven tot vergelding na "onacceptabele provocaties".`,
    });
  }

  if (mostFriendly) {
    const fam = FAMILIES[mostFriendly.fid];
    items.push({
      text: `${fam.name} breidt invloed uit met steun van onbekende partner`,
      category: 'faction', urgency: 'medium', icon: '🤝',
      detail: `${fam.contact} is recent gezien met een mysterieuze bondgenoot. De samenwerking baart rivalen zorgen.`,
    });
  }

  // War event — only one war item
  if (state.pendingWarEvent) {
    // Find which faction is most likely at war
    const warFaction = mostHostile ? FAMILIES[mostHostile.fid] : Object.values(FAMILIES)[0];
    items.push({
      text: `OORLOG: Schietpartij in ${DISTRICTS[warFaction.home].name} — ${warFaction.name} en rivalen clashen`,
      category: 'faction', urgency: 'high', icon: '💥',
      detail: `De spanningen met ${warFaction.name} escaleren. Bewoners worden geadviseerd binnen te blijven.`,
    });
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

  // Check demand shifts — find the highest demand spike
  let bestSpike: { goodName: string; distName: string; demand: number } | null = null;

  for (const distId of Object.keys(state.districtDemands || {})) {
    const demands = (state.districtDemands as any)?.[distId];
    if (!demands) continue;
    for (const [goodId, demand] of Object.entries(demands)) {
      const d = demand as number;
      if (d > 1.5) {
        const good = GOODS.find(g => g.id === goodId);
        const dist = DISTRICTS[distId as DistrictId];
        if (good && dist && (!bestSpike || d > bestSpike.demand)) {
          bestSpike = { goodName: good.name, distName: dist.name, demand: d };
        }
      }
    }
  }

  if (bestSpike) {
    const pctRise = Math.round((bestSpike.demand - 1) * 100);
    items.push({
      text: `${bestSpike.goodName}-prijzen stijgen ${pctRise}% in ${bestSpike.distName} door hoge vraag`,
      category: 'market', urgency: 'medium', icon: '📈',
      detail: `De vraag naar ${bestSpike.goodName} is explosief gestegen. Handelaren zien hun winsten exploderen.`,
    });
  }

  // Debt news
  if (state.debt > 100000) {
    items.push({
      text: 'Woekeraars actief in Noxhaven — "Schulden worden niet vergeten"',
      category: 'market', urgency: 'high', icon: '💸',
      detail: `Een grote schuldenaar met een schuld van €${Math.floor(state.debt / 1000)}k wordt gezocht. De rente tikt door.`,
    });
  }

  // Low on money
  if (state.money < 1000 && state.day > 5) {
    items.push({
      text: 'Economische neergang treft kleine ondernemers in de stad',
      category: 'market', urgency: 'low', icon: '📉',
      detail: 'Meerdere winkels in Lowrise sluiten hun deuren. "Het geld stroomt de verkeerde kant op."',
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

  // Prison — separate category to not conflict with heat
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
      detail: 'Ziekenhuizen behandelen meerdere patiënten met verwondingen die wijzen op crimineel geweld.',
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

function corruptionNews(state: GameState): NewsItem[] {
  const items: NewsItem[] = [];
  const contacts = (state as any).corruptContacts || [];
  const activeContacts = contacts.filter((c: any) => c.recruited);

  if (activeContacts.length >= 3) {
    items.push({
      text: 'Interne Zaken opent onderzoek naar "systematische corruptie" bij NHPD',
      category: 'corruption', urgency: 'high', icon: '🕵️',
      detail: 'Anonieme bronnen spreken van een netwerk dat tot in de hoogste regionen reikt.',
    });
  } else if (activeContacts.length >= 1) {
    const names = ['agent', 'wethouder', 'douanier', 'ambtenaar'];
    items.push({
      text: `Corruptie-schandaal: ${pick(names)} verdacht van banden met onderwereld`,
      category: 'corruption', urgency: 'medium', icon: '💼',
      detail: 'Een hoge ambtenaar wordt beschuldigd van het lekken van informatie aan criminelen.',
    });
  }

  // Mr. Vermeer / advocate
  if (contacts.some((c: any) => c.recruited && c.id === 'advocate')) {
    items.push({
      text: 'Strafpleiter "Mr. Vermeer" wint opnieuw spraakmakende zaak',
      category: 'corruption', urgency: 'low', icon: '⚖️',
      detail: 'Critici noemen hem "de advocaat van de duivel". Vermeer zelf: "Iedereen verdient verdediging."',
    });
  }

  // Betrayal risk (high heat + contacts)
  if (state.heat >= 70 && activeContacts.length > 0) {
    items.push({
      text: 'Geruchten over "klokkenluider" binnen crimineel netwerk — contacten nerveus',
      category: 'corruption', urgency: 'high', icon: '🐀',
      detail: 'Bij toenemende politiedruk groeit de angst voor verraad binnen het corruptienetwerk.',
    });
  }

  return items;
}

function vehicleNews(state: GameState): NewsItem[] {
  const items: NewsItem[] = [];
  const activeVehicle = state.ownedVehicles.find(v => v.id === state.activeVehicle);
  const vehicleHeat = activeVehicle?.vehicleHeat ?? 0;

  if (vehicleHeat >= 60) {
    items.push({
      text: 'Politie geeft signalement vrij van "veelgezocht voertuig" — extra controles',
      category: 'vehicle', urgency: 'high', icon: '🚗',
      detail: 'Het voertuig is meermaals gespot bij verdachte activiteiten. Wegblokkades worden opgesteld.',
    });
  } else if (vehicleHeat >= 30) {
    items.push({
      text: 'Verkeerscontroles opgevoerd: NHPD zoekt naar verdacht voertuig',
      category: 'vehicle', urgency: 'medium', icon: '🚔',
      detail: 'Automobilisten klagen over lange wachttijden bij checkpoints door de stad.',
    });
  }

  if ((state.stolenCars?.length || 0) >= 3) {
    items.push({
      text: `Autodiefstallen bereiken recordhoogte — ${state.stolenCars.length} voertuigen vermist`,
      category: 'vehicle', urgency: 'medium', icon: '🔑',
      detail: 'De politie vermoedt een georganiseerd netwerk achter de golf van autodiefstallen.',
    });
  }

  if (activeVehicle && ['lupoghini', 'royaleryce', 'meridiolux'].includes(activeVehicle.id)) {
    items.push({
      text: `Opvallend luxe voertuig gespot in ${DISTRICTS[state.loc].name} — "Wie rijdt daarin?"`,
      category: 'vehicle', urgency: 'low', icon: '🏎️',
      detail: 'Buurtbewoners fotograferen het voertuig en plaatsen het op social media.',
    });
  }

  if ((state.stolenCars?.length || 0) > 0 && state.loc === 'iron') {
    items.push({
      text: 'Verdachte activiteit gemeld bij garages in Iron Borough — "Er wordt gesleuteld"',
      category: 'vehicle', urgency: 'low', icon: '🔧',
      detail: "Bewoners horen 's nachts geluiden van metaalbewerking uit verlaten panden.",
    });
  }

  return items;
}

function karmaNews(state: GameState): NewsItem[] {
  const items: NewsItem[] = [];
  const karma = state.karma || 0;

  if (karma <= -60) {
    items.push(safePick([
      {
        text: 'Bewoners leven in angst: "Er heerst een schrikbewind in Noxhaven"',
        category: 'karma' as NewsCategory, urgency: 'high' as NewsUrgency, icon: '😨',
        detail: 'Een anonieme brief aan de krant beschrijft een stad gegijzeld door een meedogenloze crimineel.',
      },
      {
        text: '"De Slager van Noxhaven" — bijnaam duikt op in onderwereldkringen',
        category: 'karma' as NewsCategory, urgency: 'high' as NewsUrgency, icon: '🔪',
        detail: 'Rivalen fluisteren over een figuur die geen genade kent. De reputatie groeit.',
      },
    ], {
      text: 'Bewoners leven in angst: "Er heerst een schrikbewind in Noxhaven"',
      category: 'karma', urgency: 'high', icon: '😨',
      detail: 'Een anonieme brief aan de krant beschrijft een stad gegijzeld door een meedogenloze crimineel.',
    }));
  } else if (karma <= -30) {
    items.push({
      text: 'Criminaliteitsexpert: "Er is iemand die de regels niet respecteert"',
      category: 'karma', urgency: 'medium', icon: '⚠️',
      detail: 'Analisten wijzen op een patroon van meedogenloos geweld dat steeds brutaler wordt.',
    });
  } else if (karma >= 60) {
    items.push(safePick([
      {
        text: 'Mysterieuze weldoener doneert aan goede doelen in Lowrise',
        category: 'karma' as NewsCategory, urgency: 'low' as NewsUrgency, icon: '🕊️',
        detail: 'Anonieme donaties stromen binnen bij opvanghuizen en voedselbanken.',
      },
      {
        text: '"Robin Hood van de onderwereld" — verhalen over een crimineel met een hart',
        category: 'karma' as NewsCategory, urgency: 'medium' as NewsUrgency, icon: '💚',
        detail: 'Straatbewoners spreken lovend over een figuur die steelt van de rijken en geeft aan de armen.',
      },
    ], {
      text: 'Mysterieuze weldoener doneert aan goede doelen in Lowrise',
      category: 'karma', urgency: 'low', icon: '🕊️',
      detail: 'Anonieme donaties stromen binnen bij opvanghuizen en voedselbanken.',
    }));
  } else if (karma >= 30) {
    items.push({
      text: 'Buurtcomité bedankt anonieme sponsor voor renovatie speeltuin Lowrise',
      category: 'karma', urgency: 'low', icon: '🌱',
      detail: 'De nieuwe speeltuin is gefinancierd door een onbekende gulle gever uit de "zakenwereld".',
    });
  }

  return items;
}

// ========== VILLA NEWS ==========

function villaNews(state: GameState): NewsItem[] {
  const items: NewsItem[] = [];
  const villa = state.villa;
  if (!villa) return items;

  // Recently bought villa
  if (state.day - villa.purchaseDay <= 3) {
    items.push({
      text: 'Mysterieuze koper neemt luxe villa op de heuvels over — "Alles was contant"',
      category: 'villa', urgency: 'high', icon: '🏛️',
      detail: 'Een mega-villa boven de stad is in handen gevallen van een onbekende. Makelaars zijn verbijsterd door de snelle deal.',
    });
  }

  // Party thrown recently
  if (villa.lastPartyDay && state.day - villa.lastPartyDay <= 2) {
    items.push(safePick([
      {
        text: 'EXCLUSIEF: Wild feest op heuvelvilla — politici, celebs en "dubieuze figuren" gespot',
        category: 'villa' as NewsCategory, urgency: 'high' as NewsUrgency, icon: '🎉',
        detail: 'Buren klagen over muziek tot diep in de nacht. Dure sportwagens blokkeerden de oprit.',
      },
      {
        text: 'Mysterieus gala trekt de elite van Noxhaven naar privé-landgoed',
        category: 'villa' as NewsCategory, urgency: 'medium' as NewsUrgency, icon: '🥂',
        detail: 'Genodigden spreken over "een avond die je niet snel vergeet". Details blijven geheim.',
      },
      {
        text: '"Het feest van het jaar" — luxe villa-eigenaar viert met de top van Noxhaven',
        category: 'villa' as NewsCategory, urgency: 'medium' as NewsUrgency, icon: '🍾',
        detail: 'Catering ter waarde van duizenden euro\'s, live muziek en vuurwerk. De gastenlijst is streng geheim.',
      },
    ], {
      text: 'EXCLUSIEF: Wild feest op heuvelvilla — politici, celebs en "dubieuze figuren" gespot',
      category: 'villa', urgency: 'high', icon: '🎉',
      detail: 'Buren klagen over muziek tot diep in de nacht. Dure sportwagens blokkeerden de oprit.',
    }));
  }

  // Villa level upgrades
  if (villa.level >= 3) {
    items.push({
      text: 'Luchtfoto onthult fortress-achtig landgoed op heuvels boven Noxhaven',
      category: 'villa', urgency: 'medium', icon: '🏰',
      detail: 'Drone-beelden tonen een zwaar beveiligd complex met bewakingscamera\'s, een helipad en een zwembad.',
    });
  } else if (villa.level >= 2) {
    items.push({
      text: 'Bouwactiviteit op heuvelvilla wekt argwaan — "Wat bouwen ze daar?"',
      category: 'villa', urgency: 'low', icon: '🏗️',
      detail: 'Aannemers werken dag en nacht aan uitbreidingen. Buren melden zware machines en betonmixers.',
    });
  }

  // Many modules installed
  if (villa.modules.length >= 8) {
    items.push({
      text: 'Insider: "Die villa is een compleet operatiecentrum — labs, wapens, alles"',
      category: 'villa', urgency: 'high', icon: '🔬',
      detail: 'Een anonieme bron beweert dat het landgoed op de heuvels fungeert als hoofdkwartier voor criminele operaties.',
    });
  }

  // Camera module
  if (villa.modules.includes('camera')) {
    items.push({
      text: 'High-tech bewakingssysteem geïnstalleerd bij privé-landgoed — "Beter dan de FBI"',
      category: 'villa', urgency: 'low', icon: '📹',
      detail: 'Beveiligingsexperts schatten de waarde van het camerasysteem op meer dan €100.000.',
    });
  }

  // Tunnel module
  if (villa.modules.includes('tunnel')) {
    items.push({
      text: 'Geruchten over geheime tunnels onder heuvelvilla — "Net als El Chapo"',
      category: 'villa', urgency: 'medium', icon: '🕳️',
      detail: 'Een ex-aannemer beweert dat er ondergrondse gangen zijn gegraven. De eigenaar ontkent alles.',
    });
  }

  // Production active
  const hasProduction = villa.modules.includes('wietplantage') || villa.modules.includes('coke_lab') || villa.modules.includes('synthetica_lab');
  if (hasProduction) {
    items.push(safePick([
      {
        text: 'Sterke chemische geur gemeld in heuvels boven Noxhaven — "Ruikt naar ammoniak"',
        category: 'villa' as NewsCategory, urgency: 'medium' as NewsUrgency, icon: '🧪',
        detail: 'Wandelaars klagen over een penetrante geur. De milieudienst start een onderzoek.',
      },
      {
        text: 'Elektriciteitsverbruik in heuvels abnormaal hoog — energiebedrijf doet onderzoek',
        category: 'villa' as NewsCategory, urgency: 'low' as NewsUrgency, icon: '⚡',
        detail: 'Het stroomverbruik in het gebied is 400% hoger dan normaal. "Dat is niet voor een jacuzzi," aldus een technicus.',
      },
    ], {
      text: 'Sterke chemische geur gemeld in heuvels boven Noxhaven — "Ruikt naar ammoniak"',
      category: 'villa', urgency: 'medium', icon: '🧪',
      detail: 'Wandelaars klagen over een penetrante geur. De milieudienst start een onderzoek.',
    }));
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
    ...corruptionNews(state),
    ...vehicleNews(state),
    ...karmaNews(state),
    ...villaNews(state),
  ];

  // Deduplicate: max 1 item per category
  const deduplicated = deduplicateByCategory(
    allContextual.sort(() => Math.random() - 0.5)
  );

  // Pick 2-3 contextual items (was 1-2, now more variety with 9 categories)
  const contextCount = Math.min(deduplicated.length, 2 + (Math.random() < 0.5 ? 1 : 0));
  const selected: NewsItem[] = deduplicated.slice(0, contextCount);

  // Always add 1 flavor item
  const usedTexts = new Set(selected.map(n => n.text));
  const availableFlavor = FLAVOR_NEWS.filter(f => !usedTexts.has(f.text));
  const flavorPool = availableFlavor.length > 0 ? availableFlavor : FLAVOR_NEWS;
  const flavor = flavorPool[Math.floor(Math.random() * flavorPool.length)];
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
