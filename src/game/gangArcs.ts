/**
 * Gang Story Arcs — Collaborative multi-step missions for gangs.
 * Each step is resolved by individual gang members choosing in parallel.
 * The combined success rate determines the outcome.
 */

export interface GangArcChoice {
  id: string;
  label: string;
  stat: 'muscle' | 'brains' | 'charm';
  difficulty: number;
  successText: string;
  failText: string;
}

export interface GangArcStep {
  id: string;
  title: string;
  briefing: string;
  choices: GangArcChoice[];
  minParticipants: number;
}

export interface GangArcTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  steps: GangArcStep[];
  requiredGangLevel: number;
  requiredMembers: number;
  cooldownHours: number;
  rewards: {
    treasury: number;
    xp: number;
    repPerMember: number;
    moneyPerMember: number;
  };
  failRewards: {
    treasury: number;
    xp: number;
    repPerMember: number;
    moneyPerMember: number;
  };
}

export const GANG_ARCS: GangArcTemplate[] = [
  {
    id: 'kartel_connectie',
    name: 'De Kartel-Connectie',
    description: 'Een mysterieus kartel wil zaken doen met jullie gang. Maar vertrouwen moet verdiend worden — via vier gevaarlijke opdrachten.',
    icon: '🤝',
    requiredGangLevel: 3,
    requiredMembers: 3,
    cooldownHours: 48,
    rewards: { treasury: 50000, xp: 500, repPerMember: 100, moneyPerMember: 15000 },
    failRewards: { treasury: 10000, xp: 100, repPerMember: 20, moneyPerMember: 3000 },
    steps: [
      {
        id: 'kc_1', title: 'De Ontmoeting', briefing: 'Het kartel wil een ontmoeting op neutraal terrein. Stuur je beste onderhandelaars.',
        minParticipants: 2,
        choices: [
          { id: 'kc1_charm', label: 'DIPLOMATIEK OPTREDEN', stat: 'charm', difficulty: 35, successText: 'De kartel-leider is onder de indruk. "Jullie begrijpen zaken."', failText: 'Te soft. "Komen jullie hier om thee te drinken?"' },
          { id: 'kc1_brains', label: 'INTEL PRESENTEREN', stat: 'brains', difficulty: 40, successText: 'Met gedetailleerde marktanalyse overtuig je het kartel van jullie waarde.', failText: 'De cijfers kloppen niet. Het kartel twijfelt.' },
          { id: 'kc1_muscle', label: 'KRACHT TONEN', stat: 'muscle', difficulty: 30, successText: 'Jullie reputatie spreekt voor zich. Het kartel respecteert sterkte.', failText: 'Intimidatie werkt averechts. "We zijn niet onder de indruk."' },
        ],
      },
      {
        id: 'kc_2', title: 'De Proefzending', briefing: 'Het kartel stuurt een testzending. Bescherm het transport van Port Nero naar Crown Heights.',
        minParticipants: 2,
        choices: [
          { id: 'kc2_route', label: 'VEILIGE ROUTE PLANNEN', stat: 'brains', difficulty: 40, successText: 'Via achterafweggetjes bereikt de zending veilig zijn bestemming.', failText: 'De route lekt uit. Concurrenten wachten jullie op.' },
          { id: 'kc2_escort', label: 'ZWAAR ESCORTE', stat: 'muscle', difficulty: 35, successText: 'Niemand durft jullie konvooi aan te vallen.', failText: 'Een hinderlaag! Jullie vechten je eruit maar de zending raakt beschadigd.' },
          { id: 'kc2_bribe', label: 'POLITIE OMKOPEN', stat: 'charm', difficulty: 45, successText: 'De agenten kijken de andere kant op. Vlekkeloos.', failText: 'De agent bleek niet om te kopen. Nu is er heat.' },
        ],
      },
      {
        id: 'kc_3', title: 'De Verrader', briefing: 'Er is een lek in de organisatie. Het kartel eist dat jullie de verrader vinden — vóór morgen.',
        minParticipants: 3,
        choices: [
          { id: 'kc3_hack', label: 'TELEFOONS HACKEN', stat: 'brains', difficulty: 45, successText: 'Verdachte berichten gevonden. De mol is ontmaskerd.', failText: 'De encryptie is te sterk. Geen bewijs gevonden.' },
          { id: 'kc3_interrogate', label: 'VERHOREN', stat: 'muscle', difficulty: 40, successText: 'Na druk geeft de verdachte toe. "Het was ik... het spijt me."', failText: 'Niemand praat. De mol blijft verborgen.' },
          { id: 'kc3_trap', label: 'VALS PLAN LEKKEN', stat: 'charm', difficulty: 50, successText: 'Het nep-plan bereikt de vijand. Alleen de mol kende het. Gotcha.', failText: 'Het plan lekt overal. Nu weet niemand wie het was.' },
        ],
      },
      {
        id: 'kc_4', title: 'De Grote Deal', briefing: 'Het kartel biedt de ultieme deal: exclusieve toegang tot hun netwerk. Maar de uitwisseling moet vlekkeloos verlopen.',
        minParticipants: 3,
        choices: [
          { id: 'kc4_negotiate', label: 'ONDERHANDELEN', stat: 'charm', difficulty: 45, successText: 'Een historische deal. Het kartel en jullie gang zijn nu bondgenoten.', failText: 'De onderhandelingen lopen vast. Geen deal.' },
          { id: 'kc4_secure', label: 'BEVEILIGEN', stat: 'muscle', difficulty: 40, successText: 'De uitwisseling verloopt onder jullie bescherming. Geen incidenten.', failText: 'Een rivaliserende gang verstoort de deal.' },
          { id: 'kc4_logistics', label: 'LOGISTIEK REGELEN', stat: 'brains', difficulty: 50, successText: 'Perfect gepland. Elk detail klopt. Het kartel is diep onder de indruk.', failText: 'Een logistieke fout kost kostbare tijd.' },
        ],
      },
    ],
  },
  {
    id: 'haven_hegemonie',
    name: 'Haven Hegemonie',
    description: 'De haven van Port Nero is het kloppend hart van de onderwereld. Neem controle over de smokkelroutes.',
    icon: '⚓',
    requiredGangLevel: 5,
    requiredMembers: 4,
    cooldownHours: 72,
    rewards: { treasury: 80000, xp: 800, repPerMember: 150, moneyPerMember: 20000 },
    failRewards: { treasury: 15000, xp: 150, repPerMember: 30, moneyPerMember: 5000 },
    steps: [
      {
        id: 'hh_1', title: 'Verkenning', briefing: 'Breng de havenoperaties in kaart. Wie controleert welke kade?',
        minParticipants: 2,
        choices: [
          { id: 'hh1_scout', label: 'VERKENNERS STUREN', stat: 'brains', difficulty: 35, successText: 'Jullie hebben een complete kaart van alle operaties.', failText: 'De verkenners worden gespot. De haven is gewaarschuwd.' },
          { id: 'hh1_bribe', label: 'HAVENMEESTER OMKOPEN', stat: 'charm', difficulty: 40, successText: 'De havenmeester verkoopt alle schema\'s. Gouden info.', failText: 'De havenmeester is loyaal. "Wegwezen hier."' },
          { id: 'hh1_force', label: 'NACHELIJKE RAID', stat: 'muscle', difficulty: 45, successText: 'In de nacht infiltreren jullie de kantoren. Alle documenten zijn van jullie.', failText: 'Beveiligingscamera\'s. Jullie moeten vluchten.' },
        ],
      },
      {
        id: 'hh_2', title: 'Sabotage', briefing: 'Saboteer de operaties van de concurrentie om jullie positie te verstevigen.',
        minParticipants: 3,
        choices: [
          { id: 'hh2_tech', label: 'SYSTEMEN HACKEN', stat: 'brains', difficulty: 45, successText: 'De vrachtsystemen zijn gecorrumpeerd. Chaos bij de concurrentie.', failText: 'De firewall houdt stand. Geen schade.' },
          { id: 'hh2_physical', label: 'FYSIEKE SABOTAGE', stat: 'muscle', difficulty: 40, successText: 'Machines kapot, containers "verdwenen". Perfect uitgevoerd.', failText: 'Bewakers betrappen jullie crew. Gewonden.' },
          { id: 'hh2_rumor', label: 'GERUCHTEN VERSPREIDEN', stat: 'charm', difficulty: 35, successText: 'De concurrentie valt uiteen door intern wantrouwen.', failText: 'De geruchten worden teruggeleid naar jullie gang.' },
        ],
      },
      {
        id: 'hh_3', title: 'Overname', briefing: 'Het moment is daar. Neem controle over de hoofdkade.',
        minParticipants: 4,
        choices: [
          { id: 'hh3_negotiate', label: 'ONDERHANDELEN MET EIGENAAR', stat: 'charm', difficulty: 50, successText: '"Jullie gang heeft gewonnen. De kade is van jullie."', failText: 'De eigenaar weigert. "Over mijn lijk."' },
          { id: 'hh3_assault', label: 'GEWAPENDE OVERNAME', stat: 'muscle', difficulty: 45, successText: 'In een snelle actie is de kade onder jullie controle.', failText: 'Zware tegenstand. Het lukt niet zonder versterkingen.' },
          { id: 'hh3_outsmart', label: 'JURIDISCHE TRUC', stat: 'brains', difficulty: 55, successText: 'Via een schijnbedrijf staan de papieren nu op naam van jullie gang.', failText: 'De advocaat wordt doorgeprikt. Plan mislukt.' },
        ],
      },
    ],
  },
  {
    id: 'schaduw_oorlog',
    name: 'De Schaduwoorlog',
    description: 'Een onbekende vijand voert een schaduwoorlog tegen jullie gang. Vind ze en schakel ze uit.',
    icon: '🔪',
    requiredGangLevel: 7,
    requiredMembers: 4,
    cooldownHours: 96,
    rewards: { treasury: 120000, xp: 1200, repPerMember: 200, moneyPerMember: 30000 },
    failRewards: { treasury: 20000, xp: 200, repPerMember: 40, moneyPerMember: 7000 },
    steps: [
      {
        id: 'so_1', title: 'Eerste Aanwijzingen', briefing: 'Jullie goederen worden onderschept, leden worden aangevallen. Wie zit hierachter?',
        minParticipants: 3,
        choices: [
          { id: 'so1_investigate', label: 'ONDERZOEKEN', stat: 'brains', difficulty: 40, successText: 'Bewakingsbeelden onthullen gezichten. Een nieuwe speler in de stad.', failText: 'Geen bruikbaar bewijs. De vijand is slim.' },
          { id: 'so1_streets', label: 'STRAAT ONDERVRAGEN', stat: 'charm', difficulty: 35, successText: 'Een informant vertelt over een geheime operatie in Iron Borough.', failText: 'Niemand praat. De angst zit er goed in.' },
          { id: 'so1_retaliate', label: 'TERUGSLAAAN', stat: 'muscle', difficulty: 45, successText: 'Jullie tegenaanval jaagt ze op de vlucht. Ze laten sporen achter.', failText: 'Jullie slaan blind terug. Verkeerde doelwitten.' },
        ],
      },
      {
        id: 'so_2', title: 'De Schim Ontmaskerd', briefing: 'Jullie weten wie het is: een splintergroep van een oude vijand. Ze opereren vanuit een verborgen basis.',
        minParticipants: 3,
        choices: [
          { id: 'so2_infiltrate', label: 'INFILTREREN', stat: 'brains', difficulty: 50, successText: 'Een mole in hun organisatie. Jullie weten alles.', failText: 'De infiltrant wordt ontmaskerd. Ternauwernood ontsnapt.' },
          { id: 'so2_siege', label: 'BELEGEREN', stat: 'muscle', difficulty: 45, successText: 'De basis is omsingeld. Ze kunnen nergens heen.', failText: 'Ze hadden een ontsnappingsroute. De basis is leeg.' },
          { id: 'so2_diplomacy', label: 'DIPLOMATIEKE OPLOSSING', stat: 'charm', difficulty: 55, successText: 'Hun leider accepteert een gesprek. "Misschien is er een andere weg."', failText: '"Er is geen vrede mogelijk." De oorlog gaat door.' },
        ],
      },
      {
        id: 'so_3', title: 'Eindstrijd', briefing: 'De tijd van praten is voorbij. Beëindig de schaduwoorlog — definitief.',
        minParticipants: 4,
        choices: [
          { id: 'so3_total_war', label: 'TOTALE OORLOG', stat: 'muscle', difficulty: 50, successText: 'In een nacht van vuur en staal is de vijand vernietigd. Noxhaven kent weer rust.', failText: 'Zware verliezen aan beide kanten. Een pyrrusoverwinning.' },
          { id: 'so3_decapitate', label: 'ONTHOOFD DE LEIDING', stat: 'brains', difficulty: 55, successText: 'Een chirurgische operatie. De leiders worden uitgeschakeld, de rest valt uiteen.', failText: 'De leider ontsnapt. De oorlog duurt voort.' },
          { id: 'so3_absorb', label: 'ABSORBEER ZE', stat: 'charm', difficulty: 60, successText: '"Sluit je bij ons aan of verdwijn." De helft kiest jullie gang. Sterker dan ooit.', failText: 'Ze weigeren. "We gaan liever ten onder."' },
        ],
      },
    ],
  },
];

/** Arc news templates: when a gang completes an arc step, this generates a district-wide news item */
export const GANG_ARC_NEWS: Record<string, (gangName: string, stepTitle: string, success: boolean) => { text: string; icon: string; urgency: string }> = {
  kartel_connectie: (gangName, stepTitle, success) => ({
    text: success
      ? `${gangName} sluit deal met mysterieus kartel — "${stepTitle}" geslaagd`
      : `${gangName} faalt in kartel-onderhandelingen — "${stepTitle}" mislukt`,
    icon: success ? '🤝' : '💔',
    urgency: success ? 'medium' : 'low',
  }),
  haven_hegemonie: (gangName, stepTitle, success) => ({
    text: success
      ? `${gangName} versterkt greep op de haven — "${stepTitle}" voltooid`
      : `${gangName} verliest terrein in Port Nero — "${stepTitle}" mislukt`,
    icon: success ? '⚓' : '🌊',
    urgency: success ? 'high' : 'medium',
  }),
  schaduw_oorlog: (gangName, stepTitle, success) => ({
    text: success
      ? `${gangName} slaat terug in schaduwoorlog — "${stepTitle}" gewonnen`
      : `${gangName} lijdt verliezen in schaduwoorlog — "${stepTitle}" verloren`,
    icon: success ? '🔪' : '🩸',
    urgency: 'high',
  }),
};
