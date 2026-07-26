// ========== CODEX / JOURNAL SYSTEM — WORLD LORE ==========

import type { DistrictId } from './types';

export type CodexCategory = 'districts' | 'characters' | 'factions' | 'history' | 'secrets';

export interface CodexEntry {
  id: string;
  category: CodexCategory;
  title: string;
  icon: string;
  content: string; // rich text / markdown-like
  unlockCondition: CodexUnlockCondition;
  relatedEntries?: string[];
}

export type CodexUnlockCondition =
  | { type: 'always' }
  | { type: 'visit_district'; district: DistrictId }
  | { type: 'reach_level'; level: number }
  | { type: 'complete_chapter'; chapterId: string }
  | { type: 'kill_boss'; bossId: string }
  | { type: 'reach_rep'; rep: number }
  | { type: 'own_district'; district: DistrictId }
  | { type: 'backstory'; backstoryId: string }
  | { type: 'karma'; min?: number; max?: number }
  | { type: 'day'; day: number };

// ========== ENTRIES ==========

export const CODEX_ENTRIES: CodexEntry[] = [
  // ===== DISTRICTEN =====
  {
    id: 'district_port', category: 'districts', title: 'Port Nero', icon: '⚓',
    content: `Port Nero is de kloppende ader van Noxhaven. Gebouwd op de ruïnes van een oud vissersdorp, groeide de haven uit tot het hart van de smokkelhandel aan de westkust.\n\nDe dokken worden beheerst door de havenmeesters — een gesloten groep families die al generaties de toegang tot de zee controleren. 's Nachts transformeert de haven in een schaduwmarkt waar alles te koop is: van wapens tot valse identiteiten.\n\n**Bekende locaties:**\n- De Roestige Anker (kroeg, informatiehandel)\n- Dok 7 (smokkeloperaties)\n- Het Zoutvat (wapendepot)\n\n**Geschiedenis:** In 1923 vestigde kapitein Nero Blackwood hier de eerste georganiseerde smokkelroute. Zijn erfenis leeft voort in de naam van de haven — en in het bloed van degenen die er heersen.`,
    unlockCondition: { type: 'visit_district', district: 'port' },
    relatedEntries: ['history_founding', 'char_rosa'],
  },
  {
    id: 'district_crown', category: 'districts', title: 'Crown Heights', icon: '🏛️',
    content: `Crown Heights is het financiële en politieke centrum van Noxhaven. Hier bevinden zich de banken, het stadhuis en de villa's van de elite. Maar achter de marmeren gevels schuilt een web van corruptie.\n\nHet district is vernoemd naar de 'Kroon' — een informele titel voor degene die de meeste politieke invloed bezit. De Kroon is nooit officieel, maar iedereen in Noxhaven weet wie het is.\n\n**Bekende locaties:**\n- Het Stadhuis (politieke manipulatie)\n- De Gouden Kooi (elite casino, alleen op uitnodiging)\n- Sint-Elisabeth Ziekenhuis (het beste — en duurste — van de stad)\n\n**Geschiedenis:** Crown Heights was ooit een koloniaal bestuurscentrum. Na de val van het koloniale bewind namen de handelsfamilies de macht over. De architectuur is een mengeling van koloniale grandeur en moderne lelijkheid.`,
    unlockCondition: { type: 'visit_district', district: 'crown' },
    relatedEntries: ['history_families', 'char_marco'],
  },
  {
    id: 'district_iron', category: 'districts', title: 'Iron Borough', icon: '⚙️',
    content: `Iron Borough is het industriële hart van Noxhaven. Ooit een bloeiend fabrieksdistrict, nu een roestige schaduw van wat het was. De sluiting van de staalfabrieken in de jaren '90 veranderde het district in een wetteloos niemandsland.\n\nDe achterbuurten worden beheerst door chopshops en illegale werkplaatsen. De geur van machineolie en zweet hangt permanent in de lucht. Hier worden auto's gestript, wapens gesmeed en deals gesloten in het schijnsel van lasvonken.\n\n**Bekende locaties:**\n- De Smelterij (chopshop & wapensmederij)\n- Hangar 13 (ondergronds gevechtsarena)\n- De Molenstraat (zwarte markt)\n\n**Geschiedenis:** Iron Borough werd gebouwd door immigranten die de fabrieken bemanden. Toen de fabrieken sloten, bleven de mensen — maar de hoop vertrok. Nu is het het meest gevaarlijke, maar ook het meest eerlijke district van Noxhaven.`,
    unlockCondition: { type: 'visit_district', district: 'iron' },
    relatedEntries: ['char_yilmaz', 'faction_bikers'],
  },
  {
    id: 'district_low', category: 'districts', title: 'Lowrise', icon: '🏚️',
    content: `Lowrise is waar Noxhaven begint — en voor velen ook waar het eindigt. Het dichtstbevolkte district, een doolhof van flatgebouwen, steegjes en trappenhuizen. Hier overleef je, of je gaat ten onder.\n\nDe gemeenschap is hecht maar hard. Iedereen kent iedereen, en verraad wordt niet vergeten. De straatcultuur van Lowrise heeft legendes voortgebracht — rappers, boksers, en de meest gevreesde straatcriminelen van de stad.\n\n**Bekende locaties:**\n- Block 9 (de beruchte woonkazerne)\n- De Speeltuin (ontmoetingsplek, informatieknooppunt)\n- Mama's Kitchen (veilige haven, geen geweld)\n\n**Geschiedenis:** Lowrise werd gebouwd als sociale woningbouw in de jaren '60. Binnen tien jaar was het een vergeten ghetto. De overheid trok zich terug; de straat nam het over. Sindsdien zijn het de bewoners die de regels maken.`,
    unlockCondition: { type: 'visit_district', district: 'low' },
    relatedEntries: ['char_luna', 'history_gangs'],
  },
  {
    id: 'district_neon', category: 'districts', title: 'Neon Strip', icon: '🎰',
    content: `De Neon Strip is het gezicht dat Noxhaven aan de wereld laat zien. Glinsterend, verleidelijk, en doordrenkt van zonde. Casino's, nachtclubs en hotels trekken toeristen en gokkers van over de hele wereld.\n\nMaar achter de neonreclames draait een machine van witwassen, afpersing en mensenhandel. De eigenaren van de Strip zijn de rijkste en gevaarlijkste mensen van Noxhaven — en ze beschermen hun territorium met vuur en bloed.\n\n**Bekende locaties:**\n- Het Pantheon Casino (het grootste, gerund door het Syndicaat)\n- Club Paradox (nachtclub, inlichtingencentrum)\n- Het Verloren Uur (underground bar, criminele ontmoetingsplek)\n\n**Geschiedenis:** De Neon Strip begon als een klein entertainmentdistrict in de jaren '70. Na de legalisering van gokken in '82 explodeerde het. Nu genereert het meer geld dan alle andere districten samen — legaal én illegaal.`,
    unlockCondition: { type: 'visit_district', district: 'neon' },
    relatedEntries: ['faction_syndicate', 'history_neonwars'],
  },

  // ===== PERSONAGES =====
  {
    id: 'char_serpiente', category: 'characters', title: 'El Serpiente', icon: '🐍',
    content: `**El Serpiente** — Baas van de Rojo Cartel, heer van Port Nero\n\nNiemand kent zijn echte naam. Wat iedereen wel weet: elke container die Port Nero binnenkomt staat in zijn boeken, en hij telt ze allemaal.\n\n**Werkwijze:** Hij begint nooit met geweld. Eerst een boodschap — een onderschepte koerier, een lading die zoekraakt. Wie de hint niet begrijpt, krijgt het tweede bezoek.\n\n**Als je in zijn haven werkt:** Hoe meer je uit Port Nero haalt, hoe sneller hij je opmerkt. Dan sta je voor de keuze: terugslaan, afkopen, of de klap incasseren.`,
    unlockCondition: { type: 'visit_district', district: 'port' },
  },
  {
    id: 'char_wu', category: 'characters', title: 'Mr. Wu', icon: '🪷',
    content: `**Mr. Wu** — Het gezicht van de Blue Lotus in Crown Heights\n\nEen man die nooit zijn stem verheft en nooit iets op papier zet. Hij bestuurt het rijkste district van Noxhaven vanaf de veertigste verdieping.\n\n**Werkwijze:** Waar anderen mannen sturen, stuurt Wu advocaten. Een dagvaarding, een bevroren rekening, een huurcontract dat plots niet meer geldig is.\n\n**Als je in zijn district werkt:** Crown Heights betaalt beter dan waar ook. Dat is precies waarom hij er zo goed op let.`,
    unlockCondition: { type: 'visit_district', district: 'crown' },
  },
  {
    id: 'char_hammer', category: 'characters', title: 'Hammer', icon: '🔨',
    content: `**Hammer** — President van de Iron Skulls, Iron Borough\n\nDe enige van de drie die je waarschijnlijk zelf tegenkomt. Hij rijdt voorop, en hij komt persoonlijk langs.\n\n**Werkwijze:** Direct. Geen boodschappers, geen advocaten. Als de Skulls vinden dat je te ver gaat, staat er 's nachts een rij motoren voor je werkplaats.\n\n**Als je in zijn borough werkt:** Wapens en gestripte auto's zijn zijn handel. Doe je hetzelfde, dan pak je brood van zijn tafel — en dat weet hij binnen een week.`,
    unlockCondition: { type: 'visit_district', district: 'iron' },
  },
  {
    id: 'faction_cartel', category: 'factions', title: 'Rojo Cartel', icon: '🐍',
    content: `**Rojo Cartel** — De Drugsbaron\n\nDe Rojo Cartel controleert de drugshandel in Noxhaven met ijzeren vuist. Geleid door een raad van anonieme "Patrones", opereert de Cartel als een zakelijk imperium met militaire discipline.\n\n**Structuur:** Hiërarchisch, met Patrones aan de top, Capitanos die districten beheren, en Soldados die het vuile werk doen.\n\n**Specialiteit:** Drugs, witwassen, en corruptie van overheidsfunctionarissen.\n\n**Filosofie:** "Macht is geen recht — het is een product. En wij hebben het monopolie."\n\n**Relatie met andere facties:** Permanent in conflict met de Blue Lotus over territorium. Ongemakkelijke wapenstilstand met de Iron Skulls.\n\n**Gezicht naar buiten:** El Serpiente, die Port Nero als zijn haven beschouwt. Wie daar te goed verdient, krijgt bezoek.`,
    unlockCondition: { type: 'reach_level', level: 3 },
    relatedEntries: ['faction_syndicate', 'faction_bikers'],
  },
  {
    id: 'faction_syndicate', category: 'factions', title: 'Blue Lotus', icon: '🕸️',
    content: `**Blue Lotus** — De Onzichtbare Hand\n\nDe Blue Lotus is de oudste en meest gesofisticeerde criminele organisatie van Noxhaven. Waar de Cartel met geweld werkt, werkt de Lotus met informatie, chantage en financiële manipulatie.\n\n**Structuur:** Celgebaseerd — geen lid kent meer dan drie andere leden. De leider is alleen bekend als "De Dirigent."\n\n**Specialiteit:** Financiële fraude, chantage, spionage, en controle over de entertainment-industrie.\n\n**Filosofie:** "Waarom een stad veroveren als je haar kunt bezitten?"\n\n**Geschiedenis:** Opgericht in 1952 door een groep voormalige inlichtingenagenten. De Blue Lotus heeft elke machtswissel in Noxhaven overleefd — en de meeste georkestreerd.`,
    unlockCondition: { type: 'reach_level', level: 5 },
    relatedEntries: ['faction_cartel', 'district_neon'],
  },
  {
    id: 'faction_bikers', category: 'factions', title: 'Iron Skulls', icon: '🐺',
    content: `**Iron Skulls MC** — Broederschap van Staal\n\nDe Iron Skulls zijn meer dan een motorclub — ze zijn een familie. Ontstaan in Iron Borough na de sluiting van de fabrieken, boden ze werkloze arbeiders een doel en een thuishaven.\n\n**Structuur:** Pseudo-democratisch. De President wordt gekozen door de leden, maar in de praktijk regeert de sterkste — en dat is Hammer, die Iron Borough in zijn greep houdt.\n\n**Specialiteit:** Wapenhandel, voertuigdiefstal, en bescherming (afpersing).\n\n**Filosofie:** "Bloed is dikker dan wet."\n\n**Codes:** De Wolves leven volgens de "IJzeren Code" — een set ongeschreven regels over loyaliteit, eer en wraak. Verraad wordt bestraft met de "Laatste Rit."`,
    unlockCondition: { type: 'visit_district', district: 'iron' },
    relatedEntries: ['district_iron', 'char_yilmaz'],
  },

  // ===== GESCHIEDENIS =====
  {
    id: 'history_founding', category: 'history', title: 'De Stichting van Noxhaven', icon: '📜',
    content: `**1847 — De Stichting**\n\nNoxhaven werd gesticht als handelspost door Nederlandse kolonisten aan de monding van de Zwarte Rivier. De naam komt van "Nox" (nacht) en "Haven" — een haven van de nacht.\n\nDe locatie was strategisch: beschermd door kliffen aan drie zijden, met de zee als enige toegangspoort. Dit maakte de haven gemakkelijk te verdedigen — maar ook gemakkelijk te controleren door wie de kliffen bezat.\n\n**De Eerste Families:** Vier handelshuizen domineerden het vroege Noxhaven:\n- Huis Blackwood (scheepvaart)\n- Huis van der Berg (mijnbouw)\n- Huis Reyes (landbouw)\n- Huis Chen (handel)\n\nHun rivaliteit zou de stad de komende twee eeuwen vormen.`,
    unlockCondition: { type: 'always' },
    relatedEntries: ['history_families', 'district_port'],
  },
  {
    id: 'history_families', category: 'history', title: 'De Drie Families', icon: '👑',
    content: `**De Erfenis van de Stichtersfamilies**\n\nDe vier originele handelsfamilies van Noxhaven hebben de stad gevormd — en verscheurd.\n\n**Huis Blackwood** controleerde de haven tot 1923, toen kapitein Nero Blackwood de smokkelroutes opende. Hun afstammelingen runnen nog steeds Port Nero.\n\n**Huis van der Berg** bezat de mijnen van Iron Borough. Toen de erts opraakte, schakelden ze over op wapenproductie. De sluiting van de fabrieken in de jaren '90 vernietigde hun imperium.\n\n**Huis Reyes** transformeerde van landbouw naar drugsproductie. Carmela "La Loba" Reyes is het laatste prominente familielid.\n\n**Huis Chen** verdween mysterieus in 1978. Geruchten spreken over een zelfgekozen ballingschap — of een uitroeiing door het Syndicaat.\n\nDe rivaliteit tussen deze families is de rode draad door de geschiedenis van Noxhaven.`,
    unlockCondition: { type: 'reach_level', level: 8 },
    relatedEntries: ['history_founding'],
  },
  {
    id: 'history_gangs', category: 'history', title: 'De Opkomst van de Bendes', icon: '⚔️',
    content: `**1990-2010 — De Bendeoorlogen**\n\nDe sluiting van de fabrieken in Iron Borough creëerde een generatie werkloze jongeren. Zonder perspectief wendden velen zich tot de straat.\n\nDe eerste grote bende, de Iron Skulls, werd opgericht in 1992. Binnen vijf jaar had elke wijk zijn eigen crew. De politie trok zich terug uit de wijken, en Noxhaven werd een slagveld.\n\n**De Bloedregen van 2003:** Een driedaags bendeconflict dat 47 levens eiste en heel Noxhaven verlamde. Het was het moment waarop de stad definitief in de greep raakte van georganiseerde misdaad.\n\n**Het Grote Bestand (2008):** Een wapenstilstand gesmeed door een onbekende bemiddelaar. De bendes verdeelden de stad in vijf zones — de districten zoals ze nu bestaan.`,
    unlockCondition: { type: 'reach_level', level: 10 },
    relatedEntries: ['faction_bikers', 'district_low'],
  },
  {
    id: 'history_neonwars', category: 'history', title: 'De Neon Oorlogen', icon: '💡',
    content: `**1982-1989 — De Neon Oorlogen**\n\nDe legalisering van gokken in 1982 veranderde Noxhaven voor altijd. Binnen maanden openden tientallen casino's hun deuren. Het geld stroomde — en met het geld kwamen de conflicten.\n\nDrie jaar lang vochten de Blue Lotus, de Rojo Cartel en onafhankelijke investeerders om controle over de Neon Strip. De strijd werd uitgevochten met autobommen, sluipschutters en juridische procedures.\n\n**De Verdeling (1989):** Uiteindelijk werd de Strip verdeeld. De Blue Lotus kreeg het leeuwendeel, maar de Cartel behield strategische locaties. Deze verdeling houdt tot op de dag van vandaag stand — maar de spanningen lopen op.`,
    unlockCondition: { type: 'visit_district', district: 'neon' },
    relatedEntries: ['district_neon', 'faction_syndicate'],
  },

  // ===== GEHEIMEN =====
  {
    id: 'secret_underground', category: 'secrets', title: 'De Ondergrondse Stad', icon: '🕳️',
    content: `**[GEHEIM ONTGRENDELD]**\n\nOnder Noxhaven ligt een tweede stad. Gebouwd in de tunnels van verlaten mijnen, is het een schaduwwereld met eigen regels, eigen leiders, en eigen economie.\n\nDe Ondergrondse Stad wordt bewoond door degenen die uit de bovenwereld zijn verbannen — of die ervoor hebben gekozen om te verdwijnen. Hier vind je de beste wapenmmakers, de meest ervaren huurmoordenaars, en de gevaarlijkste geheimen van Noxhaven.\n\n**Toegang:** Alleen via uitnodiging, of door de juiste mensen het juiste bedrag te betalen.\n\n**Waarschuwing:** Wat je hier ziet, blijft hier. Wie praat, verdwijnt.`,
    unlockCondition: { type: 'complete_chapter', chapterId: 'ch6' },
    relatedEntries: ['district_iron'],
  },
  {
    id: 'secret_architect', category: 'secrets', title: 'De Ware Architect', icon: '🏛️',
    content: `**[GEHEIM ONTGRENDELD]**\n\nDe Architect is geen persoon — het is een titel. Doorgegeven van meester op leerling sinds de stichting van Noxhaven.\n\nElke Architect heeft de stad gevormd volgens hun visie. Sommigen brachten voorspoed; anderen brachten vernietiging. De huidige Architect is de dertiende — en misschien de laatste.\n\n**De Leer van de Architect:**\n1. De stad is een organisme. Voed het, of het sterft.\n2. Chaos is een instrument. Gebruik het met precisie.\n3. Elke leider moet uiteindelijk opzij stappen — of opzij geduwd worden.`,
    unlockCondition: { type: 'complete_chapter', chapterId: 'ch5' },
  },
  {
    id: 'secret_kluis', category: 'secrets', title: 'De Kluis van Noxhaven', icon: '🔐',
    content: `**[GEHEIM ONTGRENDELD]**\n\nDiep onder Crown Heights, voorbij de oudste funderingen van de stad, ligt de Kluis. Gebouwd door de eerste Architect, bevat het de verzamelde kennis — en macht — van twee eeuwen Noxhaven.\n\nNiemand weet precies wat erin ligt. Geruchten spreken over onmetelijke rijkdom, vernietigende wapens, of iets veel gevaarlijkers: de waarheid over wat Noxhaven werkelijk is.\n\n**De Drie Sleutels:** De Kluis kan alleen geopend worden met drie fragmenten, verspreid over de stad. Elk fragment wordt bewaakt door een wezen dat ouder is dan de stad zelf.`,
    unlockCondition: { type: 'complete_chapter', chapterId: 'ch8' },
  },
  {
    id: 'secret_corruption', category: 'secrets', title: 'Het Corruptienetwerk', icon: '🕸️',
    content: `**[ONTDEKT]**\n\nDe corruptie in Noxhaven is geen bug — het is een feature. Het hele systeem is ontworpen om macht te concentreren bij een kleine groep, terwijl de rest vecht om kruimels.\n\n**De Keten:**\nStraatcriminelen → Bendes → Facties → Politici → De Architect\n\nElke laag denkt dat zij de baas zijn. Geen enkele laag heeft gelijk.`,
    unlockCondition: { type: 'reach_rep', rep: 200 },
    relatedEntries: ['secret_architect'],
  },
];

// ========== HELPER FUNCTIONS ==========

export interface CodexState {
  unlockedEntries: string[]; // entry IDs
  readEntries: string[]; // entry IDs that have been read
  newEntries: string[]; // entry IDs not yet seen (for notification badge)
}

export function createInitialCodexState(): CodexState {
  return {
    unlockedEntries: CODEX_ENTRIES.filter(e => e.unlockCondition.type === 'always').map(e => e.id),
    readEntries: [],
    newEntries: CODEX_ENTRIES.filter(e => e.unlockCondition.type === 'always').map(e => e.id),
  };
}

export function checkCodexUnlocks(
  state: {
    codex: CodexState;
    loc: DistrictId;
    player: { level: number };
    rep: number;
    karma: number;
    day: number;
    backstory: string | null;
    campaign: { chapters: { chapterId: string; completed: boolean }[]; totalBossKills: number };
    ownedDistricts: string[];
    visitedDistricts?: string[];
  }
): { newUnlocks: string[]; entries: CodexEntry[] } {
  const newUnlocks: string[] = [];
  const entries: CodexEntry[] = [];

  for (const entry of CODEX_ENTRIES) {
    if (state.codex.unlockedEntries.includes(entry.id)) continue;

    let unlocked = false;
    const c = entry.unlockCondition;

    switch (c.type) {
      case 'always':
        unlocked = true;
        break;
      case 'visit_district':
        unlocked = (state.visitedDistricts || []).includes(c.district) || state.loc === c.district;
        break;
      case 'reach_level':
        unlocked = state.player.level >= c.level;
        break;
      case 'complete_chapter':
        unlocked = state.campaign.chapters.some(ch => ch.chapterId === c.chapterId && ch.completed);
        break;
      case 'kill_boss':
        // Check via campaign state
        unlocked = state.campaign.totalBossKills > 0;
        break;
      case 'reach_rep':
        unlocked = state.rep >= c.rep;
        break;
      case 'own_district':
        unlocked = state.ownedDistricts.includes(c.district);
        break;
      case 'backstory':
        unlocked = state.backstory === c.backstoryId;
        break;
      case 'karma':
        unlocked = (c.min === undefined || state.karma >= c.min) && (c.max === undefined || state.karma <= c.max);
        break;
      case 'day':
        unlocked = state.day >= c.day;
        break;
    }

    if (unlocked) {
      newUnlocks.push(entry.id);
      entries.push(entry);
    }
  }

  return { newUnlocks, entries };
}

export function getEntryById(id: string): CodexEntry | undefined {
  return CODEX_ENTRIES.find(e => e.id === id);
}

export function getEntriesByCategory(category: CodexCategory): CodexEntry[] {
  return CODEX_ENTRIES.filter(e => e.category === category);
}

export function getUnlockedEntriesByCategory(codex: CodexState, category: CodexCategory): CodexEntry[] {
  return CODEX_ENTRIES.filter(e => e.category === category && codex.unlockedEntries.includes(e.id));
}

export const CODEX_CATEGORY_INFO: Record<CodexCategory, { label: string; icon: string; description: string }> = {
  districts: { label: 'Districten', icon: '🗺️', description: 'De vijf districten van Noxhaven' },
  characters: { label: 'Personages', icon: '👤', description: 'De sleutelfiguren van de onderwereld' },
  factions: { label: 'Facties', icon: '⚔️', description: 'De machtsblokken van Noxhaven' },
  history: { label: 'Geschiedenis', icon: '📜', description: 'Het verleden dat het heden vormde' },
  secrets: { label: 'Geheimen', icon: '🔐', description: 'Ontdek de verborgen waarheden' },
};
