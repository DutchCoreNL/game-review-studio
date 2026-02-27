/**
 * Crew Loyalty Events System
 * Generates personality-based events for crew members, with choices and consequences.
 */

import type { GameState, PersonalityTrait, CrewMember, CrewRole, DistrictId, FamilyId } from './types';
import { addPhoneMessage } from './newFeatures';

export interface CrewEventChoice {
  id: string;
  label: string;
  desc: string;
}

export interface CrewLoyaltyEvent {
  id: string;
  crewIndex: number;
  crewName: string;
  personality: PersonalityTrait;
  message: string;
  choices: CrewEventChoice[];
  day: number;
}

export interface CrewEventResult {
  text: string;
  loyaltyChange: number;
  moneyChange: number;
  heatChange: number;
  repChange: number;
  karmaChange: number;
}

// ========== EVENT TEMPLATES PER PERSONALITY ==========

interface EventTemplate {
  id: string;
  message: (name: string, district: string) => string;
  choices: CrewEventChoice[];
  resolve: (choiceId: string, state: GameState, crewIndex: number) => CrewEventResult;
}

const PERSONALITY_EVENTS: Record<PersonalityTrait, EventTemplate[]> = {
  loyaal: [
    {
      id: 'loyal_mole',
      message: (name, district) => `Baas, ik hoorde dat er een mol in onze organisatie zit. Iemand lekt info naar de politie. Laat me het uitzoeken — ik vind hem. Vertrouw me.`,
      choices: [
        { id: 'investigate', label: 'Uitzoeken', desc: 'Laat hem de mol vinden' },
        { id: 'ignore', label: 'Negeren', desc: 'Te riskant, laat maar' },
        { id: 'reward', label: 'Belonen', desc: 'Geef hem geld voor de moeite' },
      ],
      resolve: (choiceId, state, crewIndex) => {
        switch (choiceId) {
          case 'investigate':
            return { text: 'Hij heeft de mol gevonden en uitgeschakeld. Je heat daalt.', loyaltyChange: 20, moneyChange: 0, heatChange: -15, repChange: 10, karmaChange: -5 };
          case 'reward':
            return { text: 'Hij voelt zich gewaardeerd en is nog loyaler geworden.', loyaltyChange: 15, moneyChange: -2000, heatChange: 0, repChange: 0, karmaChange: 5 };
          default:
            return { text: 'Hij is teleurgesteld dat je het negeert.', loyaltyChange: -10, moneyChange: 0, heatChange: 0, repChange: 0, karmaChange: 0 };
        }
      },
    },
    {
      id: 'loyal_protect',
      message: (name) => `Baas, er zijn geruchten dat iemand een aanslag op je plant. Ik stel voor dat ik de komende dagen als je persoonlijke bewaker optreedt. Geen extra kosten.`,
      choices: [
        { id: 'accept', label: 'Accepteren', desc: 'Laat hem je beschermen' },
        { id: 'decline', label: 'Afwijzen', desc: 'Niet nodig' },
      ],
      resolve: (choiceId) => {
        if (choiceId === 'accept') return { text: 'Hij heeft een aanslag verijdeld. Je bent hem dankbaar.', loyaltyChange: 25, moneyChange: 0, heatChange: -5, repChange: 15, karmaChange: 3 };
        return { text: 'Hij begrijpt het, maar is een beetje gekwetst.', loyaltyChange: -5, moneyChange: 0, heatChange: 0, repChange: 0, karmaChange: 0 };
      },
    },
  ],

  hebzuchtig: [
    {
      id: 'greedy_vault',
      message: (name) => `Ik heb een tip over een onbewaakte kluis in een verlaten pand. 50/50 split. Geen risico — bijna. Wat zeg je?`,
      choices: [
        { id: 'join', label: 'Meedoen', desc: 'Doe mee aan de kraak' },
        { id: 'refuse', label: 'Weigeren', desc: 'Te riskant' },
        { id: 'take_all', label: 'Alles voor mij', desc: 'Jij krijgt niets' },
      ],
      resolve: (choiceId) => {
        switch (choiceId) {
          case 'join':
            return { text: 'De kraak slaagt! Je krijgt je helft: €5.000.', loyaltyChange: 15, moneyChange: 5000, heatChange: 8, repChange: 5, karmaChange: -3 };
          case 'take_all':
            return { text: 'Hij is woedend maar machteloos. Volle buit, geen respect.', loyaltyChange: -25, moneyChange: 10000, heatChange: 10, repChange: -5, karmaChange: -10 };
          default:
            return { text: 'Hij doet het alleen en houdt alles. Jij krijgt niets.', loyaltyChange: -5, moneyChange: 0, heatChange: 0, repChange: 0, karmaChange: 0 };
        }
      },
    },
    {
      id: 'greedy_raise',
      message: (name) => `Luister, ik draai dubbele shifts en krijg hetzelfde als de rest. Ik wil meer geld. €3.000 extra, of ik begin rond te kijken.`,
      choices: [
        { id: 'pay', label: 'Betalen', desc: 'Geef hem de opslag' },
        { id: 'negotiate', label: 'Onderhandelen', desc: 'Bied de helft' },
        { id: 'refuse', label: 'Weigeren', desc: 'Geen extra geld' },
      ],
      resolve: (choiceId) => {
        switch (choiceId) {
          case 'pay':
            return { text: 'Hij is tevreden. Voorlopig.', loyaltyChange: 20, moneyChange: -3000, heatChange: 0, repChange: 0, karmaChange: 0 };
          case 'negotiate':
            return { text: 'Hij accepteert €1.500. Niet blij, maar hij blijft.', loyaltyChange: 5, moneyChange: -1500, heatChange: 0, repChange: 0, karmaChange: 0 };
          default:
            return { text: '"Dan ga ik zelf kijken." Zijn loyaliteit daalt sterk.', loyaltyChange: -20, moneyChange: 0, heatChange: 0, repChange: 0, karmaChange: 0 };
        }
      },
    },
  ],

  paranoid: [
    {
      id: 'paranoid_follow',
      message: (name) => `Er volgt iemand ons al drie dagen. Dezelfde auto, dezelfde vent. Ik wil een safehouse-check doen en ons beveiligingsprotocol aanscherpen.`,
      choices: [
        { id: 'check', label: 'Check doen', desc: 'Laat hem alles controleren' },
        { id: 'dismiss', label: 'Paranoia', desc: 'Hij ziet spoken' },
      ],
      resolve: (choiceId) => {
        if (choiceId === 'check') return { text: 'Hij vond inderdaad een tracker op je auto! Heat verminderd.', loyaltyChange: 20, moneyChange: -500, heatChange: -10, repChange: 5, karmaChange: 0 };
        return { text: 'Hij was gelijk — je werd geschaduwd. Heat stijgt.', loyaltyChange: -15, moneyChange: 0, heatChange: 10, repChange: 0, karmaChange: 0 };
      },
    },
    {
      id: 'paranoid_trap',
      message: (name) => `Die nieuwe deal ruikt naar een val. Ik heb de locatie gecontroleerd en er stonden ongemarkeerde auto's. Ik raad aan om niet te gaan.`,
      choices: [
        { id: 'listen', label: 'Luisteren', desc: 'Sla de deal over' },
        { id: 'go_anyway', label: 'Toch gaan', desc: 'Risico nemen' },
      ],
      resolve: (choiceId) => {
        if (choiceId === 'listen') return { text: 'Het was inderdaad een politieval. Goed dat je luisterde.', loyaltyChange: 25, moneyChange: 0, heatChange: -5, repChange: 5, karmaChange: 2 };
        return { text: 'Het was geen val, maar hij is gefrustreerd dat je niet luistert.', loyaltyChange: -10, moneyChange: 2000, heatChange: 5, repChange: 0, karmaChange: 0 };
      },
    },
  ],

  brutaal: [
    {
      id: 'brutal_revenge',
      message: (name, district) => `Die vent in ${district} had een grote mond over onze crew. Zal ik hem een bezoekje brengen? Niemand praat zo over ons.`,
      choices: [
        { id: 'allow', label: 'Ga je gang', desc: 'Laat hem wraak nemen' },
        { id: 'restrain', label: 'Rustig aan', desc: 'Niet de moeite waard' },
        { id: 'join', label: 'Samen gaan', desc: 'Doe mee' },
      ],
      resolve: (choiceId) => {
        switch (choiceId) {
          case 'allow':
            return { text: 'Hij heeft de boodschap overgebracht. Niemand praat meer.', loyaltyChange: 15, moneyChange: 0, heatChange: 8, repChange: 10, karmaChange: -8 };
          case 'join':
            return { text: 'Samen hebben jullie een statement gemaakt. De wijk weet wie de baas is.', loyaltyChange: 25, moneyChange: 0, heatChange: 12, repChange: 20, karmaChange: -12 };
          default:
            return { text: '"Pff. Softie." Hij is teleurgesteld in je.', loyaltyChange: -15, moneyChange: 0, heatChange: 0, repChange: -5, karmaChange: 3 };
        }
      },
    },
    {
      id: 'brutal_fight',
      message: (name) => `Er is een straatgevecht vanavond. Ondergronds. Flinke prijzenpot. Ik wil meedoen maar ik heb iemand nodig die me dekt. Ben je erbij?`,
      choices: [
        { id: 'back_him', label: 'Dekken', desc: 'Ga mee als backup' },
        { id: 'forbid', label: 'Verbieden', desc: 'Te gevaarlijk' },
      ],
      resolve: (choiceId) => {
        if (choiceId === 'back_him') return { text: 'Hij wint het gevecht! Flinke prijzenpot.', loyaltyChange: 20, moneyChange: 4000, heatChange: 5, repChange: 10, karmaChange: -5 };
        return { text: 'Hij gaat toch en raakt gewond. Boos op je.', loyaltyChange: -20, moneyChange: 0, heatChange: 0, repChange: 0, karmaChange: 0 };
      },
    },
  ],

  slim: [
    {
      id: 'smart_codes',
      message: (name, district) => `Ik heb de beveiligingscodes van ${district} gekraakt. Alarm-systemen, camera-rotaties, alles. Wil je ze gebruiken voor een operatie?`,
      choices: [
        { id: 'use', label: 'Gebruiken', desc: 'Gebruik de codes' },
        { id: 'sell', label: 'Verkopen', desc: 'Verkoop de info' },
        { id: 'destroy', label: 'Vernietigen', desc: 'Te gevaarlijk om te bewaren' },
      ],
      resolve: (choiceId) => {
        switch (choiceId) {
          case 'use':
            return { text: 'De codes werken perfect. Je volgende operatie wordt makkelijker.', loyaltyChange: 20, moneyChange: 0, heatChange: -5, repChange: 10, karmaChange: -2 };
          case 'sell':
            return { text: 'De informatie brengt goed op.', loyaltyChange: 10, moneyChange: 6000, heatChange: 5, repChange: -5, karmaChange: -5 };
          default:
            return { text: 'Veilige keuze, maar hij vindt het zonde van zijn werk.', loyaltyChange: -10, moneyChange: 0, heatChange: -3, repChange: 0, karmaChange: 3 };
        }
      },
    },
    {
      id: 'smart_scheme',
      message: (name) => `Ik heb een plan uitgewerkt om de politiedatabase te infiltreren. We kunnen onze dossiers laten verdwijnen. Kost wat, maar het is het waard.`,
      choices: [
        { id: 'approve', label: 'Goedkeuren', desc: 'Betaal €5.000 voor de operatie' },
        { id: 'modify', label: 'Aanpassen', desc: 'Goedkoper alternatief' },
        { id: 'reject', label: 'Afwijzen', desc: 'Te gevaarlijk' },
      ],
      resolve: (choiceId) => {
        switch (choiceId) {
          case 'approve':
            return { text: 'Dossiers gewist. Je heat daalt significant.', loyaltyChange: 25, moneyChange: -5000, heatChange: -20, repChange: 5, karmaChange: -3 };
          case 'modify':
            return { text: 'Het goedkopere plan werkt half. Beter dan niets.', loyaltyChange: 10, moneyChange: -2000, heatChange: -8, repChange: 0, karmaChange: -2 };
          default:
            return { text: 'Hij is teleurgesteld. Al dat werk voor niets.', loyaltyChange: -15, moneyChange: 0, heatChange: 0, repChange: 0, karmaChange: 0 };
        }
      },
    },
  ],

  impulsief: [
    {
      id: 'impulsive_heist',
      message: (name) => `Ik zag net een geldtransport bij de bank! Bewaking is minimaal. Als we NU gaan, pakken we het. Kom op, geen tijd om na te denken!`,
      choices: [
        { id: 'go', label: 'Nu gaan!', desc: 'Doe mee aan de overval' },
        { id: 'plan', label: 'Eerst plannen', desc: 'Wacht op een beter moment' },
        { id: 'stop', label: 'Stoppen', desc: 'Veel te riskant' },
      ],
      resolve: (choiceId) => {
        switch (choiceId) {
          case 'go':
            return Math.random() > 0.4
              ? { text: 'Het lukt! Een snelle, chaotische overval met flinke buit!', loyaltyChange: 25, moneyChange: 8000, heatChange: 15, repChange: 15, karmaChange: -10 }
              : { text: 'Het gaat fout. Sirenes overal. Je ontsnapt maar nauwelijks.', loyaltyChange: 5, moneyChange: -1000, heatChange: 20, repChange: -5, karmaChange: -5 };
          case 'plan':
            return { text: 'Hij is ongeduldig maar wacht. Het moment is voorbij.', loyaltyChange: -5, moneyChange: 0, heatChange: 0, repChange: 0, karmaChange: 2 };
          default:
            return { text: '"Laat maar, lafaard." Hij is gefrustreerd.', loyaltyChange: -20, moneyChange: 0, heatChange: 0, repChange: 0, karmaChange: 0 };
        }
      },
    },
  ],

  charmant: [
    {
      id: 'charming_contact',
      message: (name) => `Ik heb een nieuwe contactpersoon ontmoet op een feestje. Ze werkt bij de gemeente en kan ons helpen met vergunningen. Wil je dat ik het uitwerk?`,
      choices: [
        { id: 'pursue', label: 'Uitwerken', desc: 'Bouw het contact op' },
        { id: 'party', label: 'Feestje geven', desc: 'Investeer in de relatie' },
        { id: 'skip', label: 'Overslaan', desc: 'Niet geïnteresseerd' },
      ],
      resolve: (choiceId) => {
        switch (choiceId) {
          case 'pursue':
            return { text: 'Het contact levert waardevolle info op over aankomende politie-invallen.', loyaltyChange: 15, moneyChange: 0, heatChange: -8, repChange: 10, karmaChange: 0 };
          case 'party':
            return { text: 'Het feestje was een succes. Nieuwe connecties gemaakt.', loyaltyChange: 20, moneyChange: -3000, heatChange: 0, repChange: 20, karmaChange: 2 };
          default:
            return { text: 'Gemiste kans. Hij vindt het jammer.', loyaltyChange: -5, moneyChange: 0, heatChange: 0, repChange: 0, karmaChange: 0 };
        }
      },
    },
    {
      id: 'charming_diplomat',
      message: (name) => `Een rivaliserende factie wil praten. Ze sturen mij als tussenpersoon. Ik denk dat ik een deal kan sluiten. Mag ik het proberen?`,
      choices: [
        { id: 'send', label: 'Stuur hem', desc: 'Laat hem onderhandelen' },
        { id: 'go_together', label: 'Samen gaan', desc: 'Ga mee als backup' },
        { id: 'refuse', label: 'Weigeren', desc: 'Geen deals met rivalen' },
      ],
      resolve: (choiceId) => {
        switch (choiceId) {
          case 'send':
            return { text: 'Hij sluit een gunstig akkoord. Factierelatie verbeterd.', loyaltyChange: 20, moneyChange: 0, heatChange: 0, repChange: 15, karmaChange: 5 };
          case 'go_together':
            return { text: 'Samen maken jullie indruk. Een sterk akkoord.', loyaltyChange: 25, moneyChange: 2000, heatChange: 0, repChange: 20, karmaChange: 5 };
          default:
            return { text: 'Hij begrijpt je standpunt, maar vindt het een gemiste kans.', loyaltyChange: -5, moneyChange: 0, heatChange: 0, repChange: 0, karmaChange: -2 };
        }
      },
    },
  ],

  rustig: [
    {
      id: 'calm_meditate',
      message: (name) => `Baas, de spanning in de crew is hoog. Ik stel voor dat we een dag vrij nemen. Rust. Even geen operaties. Het houdt iedereen scherp.`,
      choices: [
        { id: 'agree', label: 'Goed idee', desc: 'Neem een dag rust' },
        { id: 'refuse', label: 'Geen tijd', desc: 'We hebben werk te doen' },
      ],
      resolve: (choiceId) => {
        if (choiceId === 'agree') return { text: 'De crew is uitgerust en gemotiveerd. Iedereen herstelt HP.', loyaltyChange: 15, moneyChange: 0, heatChange: -3, repChange: 0, karmaChange: 5 };
        return { text: 'Hij knikt en gaat door. Maar je merkt dat de crew moe is.', loyaltyChange: -5, moneyChange: 0, heatChange: 0, repChange: 0, karmaChange: 0 };
      },
    },
    {
      id: 'calm_counsel',
      message: (name) => `Ik merk dat sommige crewleden ontevreden zijn. Laat me met ze praten. Ik kan de sfeer verbeteren zonder dat het je iets kost.`,
      choices: [
        { id: 'allow', label: 'Ga je gang', desc: 'Laat hem bemiddelen' },
        { id: 'handle', label: 'Zelf doen', desc: 'Ik los het zelf op' },
      ],
      resolve: (choiceId) => {
        if (choiceId === 'allow') return { text: 'Hij heeft met iedereen gepraat. De sfeer is beter. Alle crew +5 loyaliteit.', loyaltyChange: 15, moneyChange: 0, heatChange: 0, repChange: 5, karmaChange: 3 };
        return { text: 'Je oplossing werkt, maar hij voelt zich gepasseerd.', loyaltyChange: -10, moneyChange: 0, heatChange: 0, repChange: 0, karmaChange: 0 };
      },
    },
  ],
};

// ========== ROLE-BASED PERSONAL DILEMMA EVENTS ==========

interface RoleDilemmaTemplate {
  id: string;
  /** Only triggers for this role */
  role: CrewRole;
  /** Minimum loyalty for this event to appear (personal dilemmas need some relationship) */
  minLoyalty: number;
  message: (name: string, district: string) => string;
  choices: CrewEventChoice[];
  resolve: (choiceId: string, state: GameState, crewIndex: number) => CrewEventResult;
}

const ROLE_DILEMMA_EVENTS: RoleDilemmaTemplate[] = [
  // ===== CHAUFFEUR DILEMMAS =====
  {
    id: 'chauffeur_brother',
    role: 'Chauffeur',
    minLoyalty: 25,
    message: (name) => `Baas... mijn jongere broertje is gearresteerd voor joyriding. Hij is 17. Ik kan hem eruit kopen voor €4.000, of ik haal hem er zelf uit — maar dat kost heat. Wat moet ik doen?`,
    choices: [
      { id: 'pay', label: 'Betaal het', desc: 'Koop zijn broer vrij (€4.000)' },
      { id: 'breakout', label: 'Haal hem eruit', desc: 'Riskante bevrijding' },
      { id: 'leave', label: 'Laat maar', desc: 'Niet jouw probleem' },
    ],
    resolve: (choiceId) => {
      switch (choiceId) {
        case 'pay': return { text: 'Zijn broertje is vrij. Hij zal dit nooit vergeten. "Je bent meer dan een baas."', loyaltyChange: 30, moneyChange: -4000, heatChange: 0, repChange: 5, karmaChange: 8 };
        case 'breakout': return { text: 'De bevrijding lukt, maar de politie is woedend. Zijn broertje is veilig.', loyaltyChange: 25, moneyChange: 0, heatChange: 15, repChange: 10, karmaChange: -3 };
        default: return { text: '"Oké." Hij zegt verder niets, maar je ziet iets breken in zijn ogen.', loyaltyChange: -25, moneyChange: 0, heatChange: 0, repChange: 0, karmaChange: -5 };
      }
    },
  },
  {
    id: 'chauffeur_race_debt',
    role: 'Chauffeur',
    minLoyalty: 40,
    message: (name) => `Voor ik bij jou kwam, had ik een racecarrière. Maar ik heb nog een schuld van €6.000 bij de oude racebaan-eigenaar. Hij dreigt mijn familie lastig te vallen. Kun je helpen?`,
    choices: [
      { id: 'pay_debt', label: 'Schuld afbetalen', desc: 'Betaal €6.000' },
      { id: 'intimidate', label: 'Intimideren', desc: 'Stuur een boodschap naar de eigenaar' },
      { id: 'ignore', label: 'Jouw probleem', desc: 'Los het zelf op' },
    ],
    resolve: (choiceId) => {
      switch (choiceId) {
        case 'pay_debt': return { text: 'Schuld vereffend. Hij rijdt nu met een gerust hart — en sneller dan ooit.', loyaltyChange: 25, moneyChange: -6000, heatChange: 0, repChange: 0, karmaChange: 5 };
        case 'intimidate': return { text: 'De eigenaar begrijpt de boodschap. Maar je hebt een vijand gemaakt.', loyaltyChange: 15, moneyChange: 0, heatChange: 8, repChange: 5, karmaChange: -8 };
        default: return { text: 'Hij is stil. De schuld vreet aan hem en zijn focus verslechtert.', loyaltyChange: -20, moneyChange: 0, heatChange: 0, repChange: 0, karmaChange: 0 };
      }
    },
  },

  // ===== ENFORCER DILEMMAS =====
  {
    id: 'enforcer_old_friend',
    role: 'Enforcer',
    minLoyalty: 30,
    message: (name) => `Baas, ik moet je iets vertellen. Een doelwit op de hitlijst... dat is mijn oude jeugdvriend. We groeiden samen op. Ik kan dit niet doen. Niet hem. Geef me een andere opdracht.`,
    choices: [
      { id: 'spare', label: 'Vriend sparen', desc: 'Geef hem een andere taak' },
      { id: 'force', label: 'Opdracht is opdracht', desc: 'Dwing hem' },
      { id: 'go_yourself', label: 'Ik doe het zelf', desc: 'Neem het over' },
    ],
    resolve: (choiceId) => {
      switch (choiceId) {
        case 'spare': return { text: 'Hij is dankbaar. "Sommige dingen zijn belangrijker dan de business." Zijn respect voor jou groeit.', loyaltyChange: 30, moneyChange: 0, heatChange: 0, repChange: -5, karmaChange: 10 };
        case 'force': return { text: 'Hij doet het. Maar als hij terugkomt, is hij een ander mens. Hij praat niet meer.', loyaltyChange: -30, moneyChange: 0, heatChange: 0, repChange: 10, karmaChange: -15 };
        default: return { text: 'Hij knikt. "Bedankt." Hij weet dat je hem hebt beschermd, op jouw manier.', loyaltyChange: 20, moneyChange: 0, heatChange: 5, repChange: 5, karmaChange: 3 };
      }
    },
  },
  {
    id: 'enforcer_ptsd',
    role: 'Enforcer',
    minLoyalty: 50,
    message: (name) => `Ik slaap niet meer. Elke nacht zie ik de gezichten. Ik heb hulp nodig, baas. Professionele hulp. Maar dat kost geld en tijd — een week geen gevechten.`,
    choices: [
      { id: 'therapy', label: 'Betaal therapie', desc: '€3.000 + 1 week geen gevechten' },
      { id: 'drink', label: 'Drink erover heen', desc: 'Geef hem een fles en een klap op de schouder' },
      { id: 'fire', label: 'Zwak excuus', desc: 'Als je niet kunt werken, ben je nutteloos' },
    ],
    resolve: (choiceId) => {
      switch (choiceId) {
        case 'therapy': return { text: 'Na een week is hij terug. Scherper. Stabieler. "Je hebt mijn leven gered, baas."', loyaltyChange: 35, moneyChange: -3000, heatChange: 0, repChange: 0, karmaChange: 12 };
        case 'drink': return { text: 'Hij drinkt. Het helpt even. Maar de nachtmerries komen terug.', loyaltyChange: -5, moneyChange: -200, heatChange: 0, repChange: 0, karmaChange: -3 };
        default: return { text: 'Zijn ogen worden hard. "Dan weet ik genoeg." Zijn loyaliteit daalt drastisch.', loyaltyChange: -35, moneyChange: 0, heatChange: 0, repChange: 0, karmaChange: -10 };
      }
    },
  },

  // ===== HACKER DILEMMAS =====
  {
    id: 'hacker_identity',
    role: 'Hacker',
    minLoyalty: 25,
    message: (name) => `Ik heb iets ontdekt tijdens het hacken. Mijn echte identiteit is gelekt op het darkweb. Iemand verkoopt mijn gegevens. Ik moet verdwijnen of de bron elimineren. Help me.`,
    choices: [
      { id: 'hunt', label: 'Bron vinden', desc: 'Spoor de verkoper op' },
      { id: 'new_id', label: 'Nieuwe identiteit', desc: 'Betaal €5.000 voor een nieuw leven' },
      { id: 'nothing', label: 'Niet mijn zorg', desc: 'Jouw digitale problemen' },
    ],
    resolve: (choiceId) => {
      switch (choiceId) {
        case 'hunt': return { text: 'Samen traceren jullie de verkoper. Het lek is gedicht. Hij hackt nu met hernieuwde passie.', loyaltyChange: 25, moneyChange: 0, heatChange: 5, repChange: 10, karmaChange: -3 };
        case 'new_id': return { text: 'Nieuwe identiteit aangemaakt. Hij is veilig en eeuwig dankbaar.', loyaltyChange: 30, moneyChange: -5000, heatChange: -5, repChange: 0, karmaChange: 5 };
        default: return { text: 'Hij verdwijnt een week. Als hij terugkomt, vertrouwt hij je niet meer.', loyaltyChange: -25, moneyChange: 0, heatChange: 0, repChange: 0, karmaChange: -3 };
      }
    },
  },
  {
    id: 'hacker_ethics',
    role: 'Hacker',
    minLoyalty: 45,
    message: (name) => `Baas, ik heb per ongeluk het ziekenhuis-systeem gehackt in plaats van het banknetwerk. Ik kan patiëntgegevens verkopen voor €8.000... maar dat voelt verkeerd. Wat doen we?`,
    choices: [
      { id: 'sell', label: 'Verkopen', desc: 'Data is data. €8.000 winst.' },
      { id: 'delete', label: 'Wissen', desc: 'Vernietig de data' },
      { id: 'ransom', label: 'Losgeld', desc: 'Laat het ziekenhuis betalen voor hun eigen data' },
    ],
    resolve: (choiceId) => {
      switch (choiceId) {
        case 'sell': return { text: 'De data is verkocht. Het geld stroomt binnen, maar het voelt smerig.', loyaltyChange: -10, moneyChange: 8000, heatChange: 10, repChange: -10, karmaChange: -20 };
        case 'delete': return { text: '"Bedankt, baas. Er zijn grenzen." Hij respecteert je meer dan ooit.', loyaltyChange: 30, moneyChange: 0, heatChange: 0, repChange: 5, karmaChange: 15 };
        default: return { text: 'Het ziekenhuis betaalt. Maar het nieuws lekt en je reputatie lijdt.', loyaltyChange: 0, moneyChange: 5000, heatChange: 12, repChange: -15, karmaChange: -12 };
      }
    },
  },

  // ===== SMOKKELAAR DILEMMAS =====
  {
    id: 'smokkelaar_family',
    role: 'Smokkelaar',
    minLoyalty: 30,
    message: (name) => `Mijn zus zit vast in het buitenland. Geen papieren. Ik kan haar via mijn smokkelroute hierheen halen, maar dan ligt die route een week plat. Of je betaalt €3.500 voor een legale route.`,
    choices: [
      { id: 'smuggle', label: 'Smokkelroute', desc: 'Gebruik de route (1 week geen smokkel)' },
      { id: 'pay_legal', label: 'Legaal regelen', desc: 'Betaal €3.500' },
      { id: 'refuse', label: 'Niet mogelijk', desc: 'De route is te belangrijk' },
    ],
    resolve: (choiceId) => {
      switch (choiceId) {
        case 'smuggle': return { text: 'Zijn zus is veilig. Hij huilt voor het eerst in jaren. "Ik sta bij je in het krijt."', loyaltyChange: 35, moneyChange: 0, heatChange: 3, repChange: 0, karmaChange: 8 };
        case 'pay_legal': return { text: 'Alles geregeld. Zijn zus arriveert veilig. De route blijft open.', loyaltyChange: 30, moneyChange: -3500, heatChange: 0, repChange: 0, karmaChange: 10 };
        default: return { text: '"Ik dacht dat je anders was." De teleurstelling snijdt dieper dan woede.', loyaltyChange: -30, moneyChange: 0, heatChange: 0, repChange: 0, karmaChange: -8 };
      }
    },
  },
  {
    id: 'smokkelaar_conscience',
    role: 'Smokkelaar',
    minLoyalty: 50,
    message: (name) => `Er is een nieuwe lading binnengekomen. Maar ik heb ontdekt dat er mensen bij zitten. Vluchtelingen. Ze wilden alleen maar een beter leven. Ik smokkel goederen, geen mensen. Wat doen we?`,
    choices: [
      { id: 'free', label: 'Laat ze vrij', desc: 'Verlies de lading, red de mensen' },
      { id: 'deliver', label: 'Doorleveren', desc: 'Het is business' },
      { id: 'help_resettle', label: 'Hervestigen', desc: 'Help ze op een veilige plek (€2.000)' },
    ],
    resolve: (choiceId) => {
      switch (choiceId) {
        case 'free': return { text: 'De vluchtelingen zijn vrij. Je verliest de lading maar wint respect. "Dít is waarom ik voor jou werk."', loyaltyChange: 30, moneyChange: -2000, heatChange: 0, repChange: 15, karmaChange: 20 };
        case 'deliver': return { text: 'De levering is gedaan. Maar hij kijkt je niet meer in de ogen.', loyaltyChange: -25, moneyChange: 5000, heatChange: 5, repChange: -10, karmaChange: -25 };
        default: return { text: 'Ze zijn veilig gehervestigd. Een goede daad in een duistere wereld.', loyaltyChange: 35, moneyChange: -2000, heatChange: 0, repChange: 10, karmaChange: 18 };
      }
    },
  },
];

// ========== DISTRICT NAMES FOR MESSAGES ==========

const DISTRICT_DISPLAY: Record<DistrictId, string> = {
  port: 'Port Nero',
  crown: 'Crown Heights',
  iron: 'Iron Borough',
  low: 'Lowrise',
  neon: 'Neon Strip',
};

// ========== EVENT GENERATION ==========

const CREW_EVENT_COOLDOWN = 5; // minimum days between events per crew member

/** Check if any crew member should trigger a loyalty event this turn */
export function rollCrewEvent(state: GameState): CrewLoyaltyEvent | null {
  if (!state.crew || state.crew.length === 0) return null;
  if (state.prison || state.hospital) return null;
  // Only one active event at a time
  if (state.pendingCrewEvent) return null;

  for (let i = 0; i < state.crew.length; i++) {
    const member = state.crew[i];
    if (member.hp <= 0) continue; // unconscious crew don't send messages

    const personality = state.crewPersonalities?.[i];
    if (!personality) continue;

    // Cooldown: check last event day for this crew member
    const lastEventDay = state.crewEventCooldowns?.[i] || 0;
    if (state.day - lastEventDay < CREW_EVENT_COOLDOWN) continue;

    // Base chance: 15%, higher if loyalty is extreme
    let chance = 0.15;
    if (member.loyalty < 30) chance += 0.15; // desperate crew reach out more
    if (member.loyalty > 80) chance += 0.10; // loyal crew also engage more

    if (Math.random() >= chance) continue;

    // 40% chance to roll a personal dilemma instead of a personality event
    const eligibleDilemmas = ROLE_DILEMMA_EVENTS.filter(
      d => d.role === member.role && member.loyalty >= d.minLoyalty
    );
    const useDilemma = eligibleDilemmas.length > 0 && Math.random() < 0.4;

    const districtName = DISTRICT_DISPLAY[state.loc] || 'de stad';

    if (useDilemma) {
      const dilemma = eligibleDilemmas[Math.floor(Math.random() * eligibleDilemmas.length)];
      return {
        id: `${dilemma.id}_${state.day}_${i}`,
        crewIndex: i,
        crewName: member.name,
        personality,
        message: dilemma.message(member.name, districtName),
        choices: dilemma.choices,
        day: state.day,
      };
    }

    // Pick a random personality event
    const templates = PERSONALITY_EVENTS[personality];
    if (!templates || templates.length === 0) continue;
    const template = templates[Math.floor(Math.random() * templates.length)];

    return {
      id: `${template.id}_${state.day}_${i}`,
      crewIndex: i,
      crewName: member.name,
      personality,
      message: template.message(member.name, districtName),
      choices: template.choices,
      day: state.day,
    };
  }

  return null;
}

/** Resolve a crew event choice */
export function resolveCrewEvent(state: GameState, event: CrewLoyaltyEvent, choiceId: string): CrewEventResult {
  const personality = event.personality;
  // Try personality templates first, then role dilemma templates
  const templates = PERSONALITY_EVENTS[personality];
  let template: EventTemplate | RoleDilemmaTemplate | undefined = templates?.find(t => event.id.startsWith(t.id));

  if (!template) {
    template = ROLE_DILEMMA_EVENTS.find(d => event.id.startsWith(d.id));
  }
  
  if (!template) {
    return { text: 'Iets ging mis.', loyaltyChange: 0, moneyChange: 0, heatChange: 0, repChange: 0, karmaChange: 0 };
  }

  const result = template.resolve(choiceId, state, event.crewIndex);

  // Apply effects
  const member = state.crew[event.crewIndex];
  if (member) {
    member.loyalty = Math.max(0, Math.min(100, member.loyalty + result.loyaltyChange));
  }

  if (result.moneyChange > 0) {
    state.money += result.moneyChange;
    state.stats.totalEarned += result.moneyChange;
  } else if (result.moneyChange < 0) {
    const cost = Math.abs(result.moneyChange);
    if (state.money >= cost) {
      state.money -= cost;
      state.stats.totalSpent += cost;
    }
  }

  if (result.heatChange !== 0) {
    state.personalHeat = Math.max(0, Math.min(100, (state.personalHeat || 0) + result.heatChange));
  }

  if (result.repChange !== 0) {
    state.rep = Math.max(0, state.rep + result.repChange);
  }

  if (result.karmaChange !== 0) {
    state.karma = Math.max(-100, Math.min(100, state.karma + result.karmaChange));
  }

  // Special: "calm_counsel" heals all crew loyalty
  if (template.id === 'calm_counsel' && choiceId === 'allow') {
    state.crew.forEach(c => {
      c.loyalty = Math.min(100, c.loyalty + 5);
    });
  }

  // Special: "calm_meditate" heals all crew HP
  if (template.id === 'calm_meditate' && choiceId === 'agree') {
    state.crew.forEach(c => {
      if (c.hp > 0) c.hp = Math.min(100, c.hp + 15);
    });
  }

  // Set cooldown
  if (!state.crewEventCooldowns) state.crewEventCooldowns = {};
  state.crewEventCooldowns[event.crewIndex] = state.day;

  // Send result as phone message
  addPhoneMessage(state, event.crewName, result.text, result.loyaltyChange >= 0 ? 'info' : 'warning');

  return result;
}

/** Check for loyalty milestone events (80+ = trouw bonus, <30 = ultimatum) */
export function checkLoyaltyMilestones(state: GameState): void {
  if (!state.crew) return;

  for (let i = 0; i < state.crew.length; i++) {
    const member = state.crew[i];
    const personality = state.crewPersonalities?.[i];

    // Trouw bonus at 80+ loyalty
    if (member.loyalty >= 80 && !state.crewTrouwBonusGiven?.[i]) {
      if (!state.crewTrouwBonusGiven) state.crewTrouwBonusGiven = {};
      state.crewTrouwBonusGiven[i] = true;
      
      const bonusText = personality === 'slim'
        ? `${member.name} is nu volledig loyaal. +2 Vernuft bonus voor de crew.`
        : personality === 'brutaal'
        ? `${member.name} is nu volledig loyaal. +2 Kracht bonus voor de crew.`
        : `${member.name} is nu volledig loyaal. Bonus: extra bescherming.`;

      addPhoneMessage(state, member.name, bonusText, 'opportunity');
    }

    // Ultimatum at <30 loyalty (only once)
    if (member.loyalty < 30 && member.loyalty > 0 && !state.crewUltimatumGiven?.[i]) {
      if (!state.crewUltimatumGiven) state.crewUltimatumGiven = {};
      state.crewUltimatumGiven[i] = true;
      addPhoneMessage(state, member.name, `Ik geef je nog één kans, baas. Verbeter de situatie of ik ben weg. Dit is geen dreigement — het is een belofte.`, 'warning');
    }
  }
}
