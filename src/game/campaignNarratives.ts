// ========== CAMPAIGN NARRATIVES — Rich story content ==========

import type { EncounterType, EncounterChoice } from './campaign';

// ========== MISSION BRIEFINGS ==========

export const MISSION_BRIEFINGS: Record<string, { text: string; objective: string }> = {
  ch1_m1: {
    text: 'De haven van Port Nero is al weken onrustig. Schepen verdwijnen, containers worden leeggeroofd, en niemand durft te praten. Een oude bekende fluisterde dat er een informant is die alles weet — maar hij vertrouwt niemand. Je moet hem vinden voordat iemand anders dat doet.',
    objective: 'Vind de informant in Port Nero en verkrijg zijn informatie.',
  },
  ch1_m2: {
    text: 'De informant gaf je een adres in Iron Borough — een verlaten chemiefabriek. Volgens hem draait daar een ondergronds laboratorium dat verbonden is aan het verdwijningsnetwerk. De plek wordt bewaakt door huurlingen die vragen niet beantwoorden.',
    objective: 'Infiltreer de verlaten fabriek en vind bewijs.',
  },
  ch1_m3: {
    text: 'Het bewijs wijst naar Viktor "De Slager" Kozlov, een notoire figuur in de onderwereld. Hij opereert vanuit een pakhuis aan de waterkant. Dit wordt gevaarlijk — Kozlov staat bekend om zijn brutaliteit.',
    objective: 'Confronteer Kozlov en ontmantel zijn operatie.',
  },
  ch2_m1: {
    text: 'Na Kozlovs val duiken geruchten op over het Syndicaat — een schaduworganisatie die al jaren de onderwereld controleert. Een exclusief pokertoernooi in Crown Heights is de perfecte ingang. Maar één verkeerde zet en je dekmantel is geblazen.',
    objective: 'Infiltreer het Syndicaat via het pokertoernooi.',
  },
  ch2_m2: {
    text: 'Je bent binnen, maar het Syndicaat vertrouwt niemand volledig. Ze testen je loyaliteit met een opdracht die je dwingt om beide kanten te bespelen. Een gevaarlijk dubbelspel begint.',
    objective: 'Voltooi de opdracht zonder je dekmantel te verliezen.',
  },
  ch2_m3: {
    text: 'Er is een verrader in je kring die informatie lekt naar het Syndicaat. De cirkel wordt kleiner — je moet snel handelen voordat je eigen operatie instort.',
    objective: 'Ontmasker en elimineer de verrader.',
  },
  ch2_m4: {
    text: 'Met de verrader uitgeschakeld is het tijd voor de genadeslag. Het Syndicaat draait op geld — vernietig hun financiële netwerk en ze vallen als een kaartenhuis.',
    objective: 'Vernietig de financiële infrastructuur van het Syndicaat.',
  },
  ch3_m1: {
    text: 'De val van het Syndicaat laat een machtsvacuüm achter. De oude families van Noxhaven ruiken bloed en eisen hun territorium terug. Een onverwachte figuur biedt een alliantie aan — maar in Noxhaven is vertrouwen de duurste valuta.',
    objective: 'Evalueer het bondgenootschap en neem een beslissing.',
  },
  ch3_m2: {
    text: 'Twee rivaliserende families staan op het punt om oorlog te voeren. De straten worden onveilig en jouw operaties leiden eronder. Je kunt de vrede bewaren — of de chaos gebruiken.',
    objective: 'Grijp in bij de familiefehde.',
  },
  ch3_m3: {
    text: 'Om je waarde te bewijzen aan de oude families moet je het onmogelijke doen: de kluis van de Centrale Bank kraken. Een heist die nog niemand is gelukt.',
    objective: 'Kraak de kluis van de Centrale Bank.',
  },
  ch3_m4: {
    text: 'Verraders in je eigen organisatie ondermijnen alles wat je hebt opgebouwd. Het is tijd voor een zuivering — maar pas op dat je niet de verkeerde elimineert.',
    objective: 'Zuiver je organisatie van verraders.',
  },
  ch4_m1: {
    text: 'De onderwereld is van jou. Maar ware macht ligt in de politiek. De verkiezingen van Noxhaven naderen en jij hebt de middelen om het resultaat te bepalen.',
    objective: 'Manipuleer de verkiezingsuitslag in je voordeel.',
  },
  ch4_m2: {
    text: 'De verkiezingen zijn voorbij, maar de huidige machthebbers geven niet zomaar op. Een coup — met geweld of diplomatie — is de enige optie.',
    objective: 'Neem het stadhuis over.',
  },
  ch4_m3: {
    text: 'Een laatste verzetsbeweging probeert je machtsgreep ongedaan te maken. Ze zijn goed georganiseerd en wanhopig — een gevaarlijke combinatie.',
    objective: 'Vernietig het laatste verzet.',
  },
  ch5_m1: {
    text: 'Achter alle facties en alle corruptie staat één mysterieuze figuur: De Architect. Degene die Noxhaven heeft gevormd tot wat het is. Het is tijd om dit masker af te rukken.',
    objective: 'Onthul de ware identiteit van De Architect.',
  },
  ch5_m2: {
    text: 'De Architect verschanst zich in een fort op de kliffen boven Noxhaven. Een directe belegering is de enige optie. Maar het fort zit vol vallen en verrassingen.',
    objective: 'Bestorm het fort van De Architect.',
  },
  ch6_m1: {
    text: 'Een versleuteld signaal op een vergeten radiofrequentie leidt je naar de diepten onder Iron Borough. Iemand — of iets — zendt al jaren onopgemerkt uit.',
    objective: 'Volg het signaal naar de bron.',
  },
  ch6_m2: {
    text: 'Onder de straten van Noxhaven ligt een complete tweede stad. Hier leven de ware machthebbers — de Schaduwraad — die al generaties de bovenwereld besturen.',
    objective: 'Verken de ondergrondse stad.',
  },
  ch6_m3: {
    text: 'De Raad der Schaduwen vergadert in een verborgen kamer. Twaalf gemaskerde figuren bepalen het lot van Noxhaven. Je moet erbij zijn — als gast of als indringer.',
    objective: 'Infiltreer de geheime raad.',
  },
  ch6_m4: {
    text: 'Protocol Omega: een stadsbrede lockdown die de Schaduwraad totale controle geeft. De activering is begonnen. Je hebt beperkte tijd om het te stoppen.',
    objective: 'Voorkom de activering van Protocol Omega.',
  },
  ch7_m1: {
    text: 'Een explosie in Crown Heights markeert het begin van een burgeroorlog. De straten branden, oude allianties breken, en iemand trekt aan de touwtjes.',
    objective: 'Onderzoek de oorzaak van de burgeroorlog.',
  },
  ch7_m2: {
    text: 'De districten van Noxhaven zijn slagvelden geworden. Tussen de ruïnes zoek je overlevenden die informatie hebben over wie achter de oorlog zit.',
    objective: 'Doorkruis de verwoeste districten.',
  },
  ch7_m3: {
    text: 'Vrede of totale oorlog — beide opties liggen op tafel. Een wapenstilstandsverdrag kan de stad redden, maar de prijs is hoog.',
    objective: 'Neem een beslissing over het lot van Noxhaven.',
  },
  ch7_m4: {
    text: 'Noxhaven ligt in puin. De wederopbouw begint, en wie de herbouw controleert, controleert de toekomst van de stad.',
    objective: 'Neem de controle over de wederopbouw.',
  },
  ch8_m1: {
    text: 'Drie sleutelfragmenten, verspreid over Noxhaven, openen de weg naar de Kluis. Elk fragment wordt bewaakt door een wachter met een eigen test.',
    objective: 'Verzamel de drie sleutelfragmenten.',
  },
  ch8_m2: {
    text: 'De afdaling naar de diepste gewelven onthult steeds oudere geheimen. De muren fluisteren namen van vergeten heersers.',
    objective: 'Daal af naar de diepste gewelven.',
  },
  ch8_m3: {
    text: 'De Kluis staat open. De ultieme macht ligt voor je — maar elke keuze heeft consequenties die niet ongedaan gemaakt kunnen worden.',
    objective: 'Maak je definitieve keuze bij de Kluis.',
  },
};

// ========== EXPANDED ENCOUNTER NARRATIVES ==========

export const ENCOUNTER_NARRATIVES: Record<EncounterType, Record<EncounterChoice, string[]>> = {
  combat: {
    stealth: [
      'Je sluipt langs de bewakers en schakelt ze stil uit.',
      'Een stille eliminatie — niemand hoorde iets.',
      'Je glijdt door de schaduwen als een geest.',
      'Met chirurgische precisie neutraliseer je de doelen.',
      'De vijanden merken pas te laat dat je er bent.',
      'Eén voor één verdwijnen de bewakers in de duisternis.',
    ],
    standard: [
      'Je neemt de vijanden frontaal aan.',
      'Een kort vuurgevecht, maar je wint.',
      'De vijanden zijn uitgeschakeld.',
      'Een professionele aanpak — efficiënt en effectief.',
      'De tegenstanders hadden geen kans.',
      'Je handelt snel en doelgericht.',
    ],
    aggressive: [
      'Je stormt binnen met brute kracht!',
      'Een explosieve confrontatie — je laat niets heel.',
      'Maximale chaos, maximale schade.',
      'De muren trillen van het geweld.',
      'Geen genade — alles wordt vernietigd.',
      'Een orkaan van kogels en vuisten.',
    ],
  },
  trap: {
    stealth: [
      'Je ontdekt de val op tijd en omzeilt hem voorzichtig.',
      'Een bijna onzichtbare tripwire — maar jij zag hem.',
      'Je oog voor detail redt je leven.',
      'Voorzichtig ontmantel je het mechanisme.',
      'De val klikt onschuldig terwijl je erlangs glipt.',
    ],
    standard: [
      'Je triggert de val maar weet te ontwijken.',
      'De val gaat af, maar je reactievermogen redt je.',
      'Een haarbreedte — maar je overleeft.',
      'Met een snelle beweging spring je opzij.',
      'De val raakt je bijna, maar je bent sneller.',
    ],
    aggressive: [
      'Je forceert de val en absorbeert de schade.',
      'Dwars door de val heen — het doet pijn, maar je stopt niet.',
      'Je vernietigt het mechanisme met brute kracht.',
      'De val breekt eerder dan jij.',
      'Pijn is tijdelijk, vooruitgang is permanent.',
    ],
  },
  npc: {
    stealth: [
      'Je luistert mee vanuit de schaduwen en verkrijgt cruciale informatie.',
      'De NPC merkt je niet op — je hoort alles.',
      'Vanachter een muur vang je het hele gesprek op.',
      'Je observeert ongemerkt en leert hun zwaktes.',
      'Informatie verzamelen zonder een spoor achter te laten.',
    ],
    standard: [
      'Een gesprek levert nuttige informatie op.',
      'De NPC is bereid te helpen — tegen een prijs.',
      'Een eerlijk gesprek met onverwachte resultaten.',
      'Diplomatie opent deuren die geweld niet kan openen.',
      'Je wint vertrouwen en krijgt waardevolle tips.',
    ],
    aggressive: [
      'Je dwingt de informatie af met geweld.',
      'Intimidatie werkt, maar je maakt vijanden.',
      'Een vuist op tafel overtuigt sneller dan woorden.',
      'Ze praten snel als ze bang genoeg zijn.',
      'Bruut maar effectief — de informatie is van jou.',
    ],
  },
  exploration: {
    stealth: [
      'Je doorzoekt zorgvuldig en vindt een verborgen cache.',
      'Geduld loont — je vindt een geheime doorgang.',
      'Een verborgen compartiment onthult waardevolle spullen.',
      'Je methodische aanpak levert onverwachte vondsten op.',
      'Achter een losse baksteen vind je een verborgen kluis.',
    ],
    standard: [
      'Je verkent het gebied en vindt bruikbare items.',
      'Een grondige zoektocht levert resultaat op.',
      'Het gebied is doorzocht — niets is over het hoofd gezien.',
      'Je vindt precies wat je nodig had.',
      'Een systematische verkenning met goed resultaat.',
    ],
    aggressive: [
      'Je breekt muren open en vindt verborgen kamers.',
      'Geen subtiliteit, maar je vindt wat je zocht.',
      'Alles wordt overhoop gehaald — maar het werkt.',
      'Je sloopt alles tot je vindt wat je zoekt.',
      'Destructief maar effectief — de schatten zijn van jou.',
    ],
  },
  timed: {
    stealth: [
      'Onder tijdsdruk sluip je langs de bewaking — net op tijd.',
      'De klok tikt, maar je blijft kalm en precies.',
      'Met seconden over glijdt je door de beveiliging.',
      'Haast maakt waste, maar jij bent de uitzondering.',
      'Snel en stil — een perfecte combinatie.',
    ],
    standard: [
      'Je reageert snel op de tijdsdruk en handelt efficiënt.',
      'De deadline nadert, maar je komt er net.',
      'Onder druk presteer je op je best.',
      'De tijd raakt op, maar je missie slaagt.',
      'Gehaast maar succesvol — de klok stopt net op tijd.',
    ],
    aggressive: [
      'Geen tijd voor subtiliteit — je beukt er doorheen!',
      'De klok tikt, en je antwoord is pure agressie.',
      'Snelheid en geweld — een dodelijke combinatie.',
      'Je sprint door de obstakels met niets dan vuisten.',
      'Tijd is op? Dan maak je je eigen pad.',
    ],
  },
  puzzle: {
    stealth: [
      'Je ontcijfert het systeem voorzichtig en vindt de oplossing.',
      'Met geduld en logica kraak je de code.',
      'Een elegant antwoord op een complex probleem.',
      'Je analyseert het patroon en vindt de zwakke plek.',
      'Methodisch en precies — het puzzelstuk past perfect.',
    ],
    standard: [
      'Je probeert verschillende combinaties en vindt de juiste.',
      'Trial and error leidt uiteindelijk tot succes.',
      'Het kostte wat moeite, maar de puzzel is opgelost.',
      'Een standaard aanpak met een goed resultaat.',
      'Je logica overwint — de deur gaat open.',
    ],
    aggressive: [
      'Je forceert het mechanisme — het breekt, maar het werkt.',
      'Brute kracht vervangt logica. Het werkt... min of meer.',
      'Je slaat het paneel kapot en omzeilt de beveiliging.',
      'Elegantie is voor amateurs — jij sloopt het systeem.',
      'Het alarm gaat af, maar je bent al binnen.',
    ],
  },
  ambush: {
    stealth: [
      'Je reageert bliksemsnel op de hinderlaag en duikt in dekking.',
      'De aanval verrast je, maar je instincten redden je.',
      'Je rolt opzij en ontsnapt aan het ergste.',
    ],
    standard: [
      'Een plotselinge aanval! Je verdedigt je en slaat terug.',
      'De hinderlaag was onverwacht, maar je staat je mannetje.',
      'Ze sprongen tevoorschijn, maar je was er klaar voor.',
      'Een chaotisch gevecht, maar je overleeft.',
      'De verrassingsaanval mislukt — je bent taai.',
    ],
    aggressive: [
      'Ze vielen je aan? Grote fout. Je vernietigt ze!',
      'De hinderlaag verandert in een slachting — voor hen.',
      'Ze dachten dat ze het voordeel hadden. Dat dachten ze verkeerd.',
      'Je countert de aanval met overweldigend geweld.',
      'De overvallers worden zelf overvallen door jouw woede.',
    ],
  },
};

// ========== BOSS TAUNTS ==========

export const BOSS_TAUNTS: Record<string, string[]> = {
  boss_viktor: [
    '"Is dat alles? Mijn slachtoffers gillen harder dan jij vecht!"',
    '"Je bloedt al. Dit wordt leuker dan ik dacht."',
    '"Ik heb sterkere mannen gebroken voor het ontbijt."',
    '"Geef op. Ik beloof dat het snel voorbij is. Bijna."',
  ],
  boss_vasari: [
    '"In mijn wereld overleven alleen de slimsten. Jij bent niet slim."',
    '"Elke seconde die je vecht, kost me geld. Dat irriteert me."',
    '"Mijn voorouders hebben imperia gebouwd. Jij bent een voetnoot."',
    '"Je bent dapper. Maar dapperheid zonder macht is zinloos."',
  ],
  boss_carmela: [
    '"De roedel ruikt je angst. Ze worden hongerig."',
    '"Ik heb koningen zien vallen. Jij bent geen koning."',
    '"Elke wolf in mijn roedel is sterker dan jij alleen."',
    '"De straat heeft me groot gemaakt. En de straat neemt alles terug."',
  ],
  boss_decker: [
    '"Je vecht tegen het systeem. Het systeem wint ALTIJD."',
    '"Ik heb een heel politiekorps achter me. Jij hebt... niets."',
    '"Elk bewijs dat je verzamelt, kan ik laten verdwijnen."',
    '"De wet buigt voor macht. En ik BEN de macht."',
  ],
  boss_architect: [
    '"Alles wat je ziet — ik heb het ontworpen. Inclusief je ondergang."',
    '"Je bent een variabele in mijn vergelijking. Vervangbaar."',
    '"Dit fort heeft meer verrassingen dan je je kunt voorstellen."',
    '"Ik heb steden gebouwd en vernietigd. Jij bent slechts een obstakel."',
  ],
  boss_oracle: [
    '"Ik voorspelde dit moment. Elk detail klopt — behalve jij."',
    '"Je gedachten zijn een open boek. Ik lees elke bladzijde."',
    '"De schaduwen fluisteren me je volgende zet toe."',
    '"Chaos is slechts orde die je niet begrijpt."',
  ],
  boss_phoenix: [
    '"Vuur zuivert. En jij bent vol onzuiverheden."',
    '"Elke slag die je landt, voedt mijn vlammen."',
    '"Uit as herrijs ik. Dat kan jij niet zeggen."',
    '"De brand die Noxhaven reinigt, begon met mijn vonk."',
  ],
  boss_noxhaven: [
    '"Ik heb eeuwen gewacht op een waardige uitdager."',
    '"Elke steen van deze stad draagt mijn wil."',
    '"De tijd stroomt anders hier beneden. Heb je dat gemerkt?"',
    '"Stervelingen komen en gaan. Ik blijf."',
  ],
};

// ========== RANDOM EVENTS ==========

export interface RandomEventResult {
  text: string;
  bonusMoney?: number;
  bonusRep?: number;
  bonusXp?: number;
}

const RANDOM_EVENTS: RandomEventResult[] = [
  { text: 'Je vindt een verborgen geldkistje!', bonusMoney: 500 },
  { text: 'Een informant geeft je een tip — extra reputatie!', bonusRep: 5 },
  { text: 'Je ontdekt een geheime route — bonus ervaring!', bonusXp: 50 },
  { text: 'Een medeplichtige sluit zich aan — moreel stijgt!', bonusRep: 3 },
  { text: 'Je vindt een voorraad munitie achter een losse muur.', bonusMoney: 300 },
  { text: 'Een afluisterapparaat onthult vijandelijke plannen.', bonusXp: 40 },
  { text: 'Je vangt een radiobericht op met nuttige coördinaten.', bonusRep: 4 },
  { text: 'Een verlaten voertuig bevat waardevolle cargo.', bonusMoney: 800 },
  { text: 'Een dankbare bewoner deelt informatie over de vijand.', bonusXp: 60 },
  { text: 'Je vindt een geheime doorgang die tijd bespaart!', bonusXp: 30 },
  { text: 'Een wapencache achter een valse muur!', bonusMoney: 600 },
  { text: 'Een oude bekende helpt je uit de brand.', bonusRep: 6 },
  { text: 'Je onderschept een vijandelijke koerier met contanten.', bonusMoney: 1000 },
  { text: 'Een verborgen terminal onthult cruciale data.', bonusXp: 80 },
  { text: 'De vijand liet munitie achter in hun haast.', bonusMoney: 400 },
];

export function getRandomEvent(): RandomEventResult {
  return RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];
}

export function getEncounterNarrative(type: EncounterType, choice: EncounterChoice): string {
  const pool = ENCOUNTER_NARRATIVES[type]?.[choice] || ENCOUNTER_NARRATIVES.combat[choice];
  return pool[Math.floor(Math.random() * pool.length)];
}

// ========== ENCOUNTER UI CONFIG ==========

export const ENCOUNTER_TYPE_CONFIG: Record<EncounterType, {
  icon: string;
  label: string;
  color: string;
  description: string;
  choiceLabels?: Record<EncounterChoice, { label: string; desc: string }>;
}> = {
  combat: {
    icon: '⚔️', label: 'Gevecht', color: 'text-blood',
    description: 'Vijandelijke krachten blokkeren je pad.',
  },
  trap: {
    icon: '🪤', label: 'Val', color: 'text-amber-400',
    description: 'Een verborgen val blokkeert de doorgang.',
    choiceLabels: {
      stealth: { label: 'Ontmantelen', desc: 'Voorzichtig onschadelijk maken' },
      standard: { label: 'Ontwijken', desc: 'Snel erlangs springen' },
      aggressive: { label: 'Forceren', desc: 'Dwars doorheen breken' },
    },
  },
  npc: {
    icon: '🗣️', label: 'Ontmoeting', color: 'text-emerald',
    description: 'Een figuur blokkeert je pad en wil praten.',
    choiceLabels: {
      stealth: { label: 'Afluisteren', desc: 'Informatie stelen zonder gezien te worden' },
      standard: { label: 'Onderhandelen', desc: 'Een eerlijk gesprek voeren' },
      aggressive: { label: 'Intimideren', desc: 'Met geweld de informatie afdwingen' },
    },
  },
  exploration: {
    icon: '🔍', label: 'Verkenning', color: 'text-primary',
    description: 'Een onbekend gebied wacht op verkenning.',
    choiceLabels: {
      stealth: { label: 'Grondig zoeken', desc: 'Elk hoekje doorzoeken' },
      standard: { label: 'Verkennen', desc: 'Systematisch doorzoeken' },
      aggressive: { label: 'Slopen', desc: 'Muren breken en alles overhoop halen' },
    },
  },
  timed: {
    icon: '⏱️', label: 'Tijdsdruk', color: 'text-amber-400',
    description: 'De klok tikt! Kies snel je aanpak.',
  },
  puzzle: {
    icon: '🧩', label: 'Puzzel', color: 'text-purple-400',
    description: 'Een vergrendeld systeem blokkeert je pad.',
    choiceLabels: {
      stealth: { label: 'Ontcijferen', desc: 'Voorzichtig het systeem kraken' },
      standard: { label: 'Proberen', desc: 'Verschillende combinaties testen' },
      aggressive: { label: 'Forceren', desc: 'Het systeem met geweld omzeilen' },
    },
  },
  ambush: {
    icon: '💥', label: 'Hinderlaag', color: 'text-blood',
    description: '⚠️ Verrassingsaanval! Geen stealth mogelijk.',
  },
};
