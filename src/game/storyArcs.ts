/**
 * Story Arcs System — Multi-dag verhaallijnen die via de telefoon en speciale events ontvouwen.
 * Drie bogen: De Informant, Het Erfenis-mysterie, De Rivaal.
 */

import { GameState, DistrictId, StatId } from './types';
import { getPlayerStat } from './engine';
import { addPhoneMessage } from './newFeatures';
import { generateGear, type GeneratedGear, type GearType } from './gearGenerator';
import { generateWeapon, type GeneratedWeapon } from './weaponGenerator';

// ========== TYPES ==========

export interface StoryArcChoice {
  id: string;
  label: string;
  stat: StatId;
  difficulty: number;
  successText: string;
  failText: string;
  effects: {
    money: number;
    heat: number;
    rep: number;
    dirtyMoney: number;
    crewDamage: number;
    relChange?: Partial<Record<string, number>>;
    karma?: number; // positive = eerbaar, negative = meedogenloos
  };
  /** Optional: which step to jump to on success (for branching) */
  nextStepOverride?: number;
  /** Karma gate: 'eerbaar' = requires karma > 20, 'meedogenloos' = requires karma < -20 */
  requiredKarma?: 'eerbaar' | 'meedogenloos';
}

export interface StoryArcStep {
  id: string;
  text: string;
  districtVariant?: Partial<Record<DistrictId, string>>;
  choices: StoryArcChoice[];
  /** Phone message sent when this step triggers (before showing popup) */
  phonePreview?: string;
  phoneFrom?: string;
}

export interface StoryArcTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  steps: StoryArcStep[];
  /** Conditions to START this arc */
  triggerConditions: {
    minDay: number;
    minRep?: number;
    minDistricts?: number;
    requiredDistrict?: DistrictId;
    requiredBackstory?: string;
    maxActiveArcs?: number;
  };
  /** Final reward when completing the arc */
  completionReward: {
    money: number;
    rep: number;
    dirtyMoney: number;
    heat: number;
    /** Optional: type of gear reward on completion */
    gearReward?: { type: GearType; minRarity: 'uncommon' | 'rare' | 'epic'; themed?: string };
    /** Optional: weapon reward on completion */
    weaponReward?: { minRarity: 'uncommon' | 'rare' | 'epic' };
  };
}

export interface ActiveStoryArc {
  arcId: string;
  currentStep: number;
  startedDay: number;
  lastStepDay: number;
  /** Minimum days between steps */
  cooldownDays: number;
  finished: boolean;
  success: boolean;
  failedSteps: number;
}

// ========== ARC DATABASE ==========

export const STORY_ARCS: StoryArcTemplate[] = [
  // ===== ARC 1: DE INFORMANT =====
  {
    id: 'informant',
    name: 'De Informant',
    description: 'Een mysterieuze bron stuurt berichten over een corrupt politienetwerk. Vertrouw je hem, of is het een val?',
    icon: '🕵️',
    triggerConditions: { minDay: 5, minRep: 50 },
    completionReward: { money: 25000, rep: 200, dirtyMoney: 0, heat: -20, gearReward: { type: 'gadget', minRarity: 'rare' } },
    steps: [
      {
        id: 'inf_1',
        text: 'Je telefoon trilt. Een onbekend nummer: "Ik weet wie je bent. Ik heb informatie over het politienetwerk in Noxhaven. Geïnteresseerd? Ontmoet me bij het station in Crown Heights."',
        phonePreview: 'Onbekend nummer: "Ik heb informatie die je wilt. Crown Heights station. Vannacht."',
        phoneFrom: 'informant',
        choices: [
          {
            id: 'inf_1a', label: 'GA NAAR DE ONTMOETING', stat: 'charm', difficulty: 25,
            successText: 'Een man in een lange jas overhandigt je een USB-stick. "Hierop staan namen van corrupte agenten. Gebruik het wijselijk. Ik neem binnenkort weer contact op."',
            failText: 'Je gaat erheen maar niemand komt opdagen. Was het een test? Of een val?',
            effects: { money: 0, heat: 5, rep: 15, dirtyMoney: 0, crewDamage: 0 },
          },
          {
            id: 'inf_1b', label: 'NEGEER HET', stat: 'brains', difficulty: 10,
            successText: 'Je negeert het bericht. Soms is voorzichtigheid wijsheid. Maar je telefoon trilt opnieuw: "Volgende keer dan."',
            failText: 'Je negeert het. Een gemiste kans? Wie weet.',
            effects: { money: 0, heat: 0, rep: 0, dirtyMoney: 0, crewDamage: 0 },
          },
          {
            id: 'inf_1c', label: 'STUUR EEN CREW LID', stat: 'brains', difficulty: 30,
            successText: 'Je stuurt iemand vooruit. De informant is echt — je krijgt de info zonder risico.',
            failText: 'Je crew lid wordt herkend. De informant verdwijnt. "Ik zei toch: alleen."',
            effects: { money: 0, heat: 3, rep: 5, dirtyMoney: 0, crewDamage: 0 },
          },
        ],
      },
      {
        id: 'inf_2',
        text: 'De informant stuurt opnieuw een bericht: "De namen op de stick zijn echt. Agent De Vries is de sleutel — hij runt een chantage-operatie vanuit Iron District. Ik heb bewijs. Maar ik heb geld nodig om te vluchten."',
        phonePreview: '"Agent De Vries chanteert halve wijk. Ik heb bewijs. Maar het kost je wat." — De Informant',
        phoneFrom: 'informant',
        choices: [
          {
            id: 'inf_2a', label: 'BETAAL VOOR HET BEWIJS (€5.000)', stat: 'charm', difficulty: 30,
            successText: 'Je betaalt. De dossiers zijn explosief — namen, data, bedragen. Hiermee kun je De Vries onder druk zetten.',
            failText: 'Je betaalt, maar de informatie is onvolledig. Niet genoeg om iets mee te doen.',
            effects: { money: -5000, heat: 0, rep: 20, dirtyMoney: 0, crewDamage: 0 },
          },
          {
            id: 'inf_2b', label: 'DREIG DE INFORMANT', stat: 'muscle', difficulty: 35,
            successText: '"Je geeft me die info gratis of ik vertel De Vries wie je bent." De man verbleekt en overhandigt alles.',
            failText: 'De informant lacht nerveus. "Dan hou ik het voor mezelf." Hij verdwijnt in de menigte.',
            effects: { money: 0, heat: 5, rep: -10, dirtyMoney: 0, crewDamage: 0, karma: -10 },
          },
          {
            id: 'inf_2c', label: 'BESCHERM HEM PERSOONLIJK', stat: 'charm', difficulty: 40,
            requiredKarma: 'eerbaar',
            successText: 'Je biedt hem onderdak en bescherming. De informant is ontroerd. "Niemand heeft ooit..." Hij geeft je álles — meer dan je vroeg. Een bondgenoot voor het leven.',
            failText: 'Je pogingen om hem te beschermen trekken aandacht. De Vries wordt gewaarschuwd.',
            effects: { money: -2000, heat: 3, rep: 30, dirtyMoney: 0, crewDamage: 0, karma: 15 },
          },
          {
            id: 'inf_2d', label: 'MARTÉL DE LOCATIE ERUIT', stat: 'muscle', difficulty: 30,
            requiredKarma: 'meedogenloos',
            successText: 'In een donker steegje laat je hem praten. Het duurt niet lang. Je hebt nu alles — de dossiers, zijn contacten, zelfs zijn noodplan. Angst is de beste motivator.',
            failText: 'De informant bijt op zijn lip en zwijgt. Taai. Maar nu weet hij dat je gevaarlijk bent.',
            effects: { money: 0, heat: 8, rep: 5, dirtyMoney: 3000, crewDamage: 0, karma: -15 },
          },
        ],
      },
      {
        id: 'inf_3',
        text: 'Met het bewijs in handen heb je opties. Agent De Vries opereert vanuit een kantoor in Iron District. Je kunt hem confronteren, chanteren, of de informatie doorspelen aan zijn rivalen bij het bureau.',
        phonePreview: '"De Vries weet dat iemand aan het graven is. Hij wordt paranoïde. Nu toeslaan." — De Informant',
        phoneFrom: 'informant',
        choices: [
          {
            id: 'inf_3a', label: 'CHANTEER DE VRIES', stat: 'brains', difficulty: 40,
            successText: 'De Vries begrijpt de situatie onmiddellijk. "Wat wil je?" Je eist maandelijks zwijggeld — en een blind oog voor jouw operaties.',
            failText: 'De Vries reageert agressief. "Denk je dat je de eerste bent?" Hij stuurt zijn mannen op je af.',
            effects: { money: 10000, heat: -15, rep: 30, dirtyMoney: 0, crewDamage: 0, relChange: {} },
          },
          {
            id: 'inf_3b', label: 'CONFRONTEER HEM', stat: 'muscle', difficulty: 45,
            successText: 'Je trapt de deur open. "Het is voorbij, De Vries." Na een korte worsteling geeft hij zich over. Je neemt alles mee.',
            failText: 'De Vries was voorbereid. Een vuurgevecht in de gang. Je ontsnapt, maar niet zonder kleerscheuren.',
            effects: { money: 5000, heat: 10, rep: 40, dirtyMoney: 5000, crewDamage: 15 },
          },
          {
            id: 'inf_3c', label: 'GEEF INFO AAN RIVALEN', stat: 'charm', difficulty: 35,
            successText: 'Je speelt het dossier door aan inspecteur Bakker. De Vries wordt gearresteerd. Bakker is je nu een gunst verschuldigd.',
            failText: 'Bakker vertrouwt je niet helemaal. "Waarom help je ons?" Het bewijs verdwijnt in een la.',
            effects: { money: 0, heat: -20, rep: 25, dirtyMoney: 0, crewDamage: 0 },
          },
        ],
      },
      {
        id: 'inf_4',
        text: 'De informant belt een laatste keer: "De Vries was slechts het begin. Er is een heel netwerk — en ik heb de volledige lijst. Ontmoet me in Port Nero. Alleen. Dit is de laatste keer."',
        phonePreview: '"Laatste ontmoeting. Alles komt samen. Port Nero, Dok 12, middernacht." — De Informant',
        phoneFrom: 'informant',
        choices: [
          {
            id: 'inf_4a', label: 'GA ERHEEN — ALLEEN', stat: 'charm', difficulty: 40,
            successText: 'De informant overhandigt een verzegelde envelop. "Hiermee kun je het hele systeem ontmantelen. Of het gebruiken." Hij loopt weg in het donker. Je opent de envelop: namen, rekeningen, alles.',
            failText: 'Het was toch een val. Politie omsingelt de dokken. Je ontsnapt via het water, maar de envelop is verloren.',
            effects: { money: 15000, heat: 5, rep: 50, dirtyMoney: 10000, crewDamage: 0 },
          },
          {
            id: 'inf_4b', label: 'STUUR JE BESTE CREWLID', stat: 'brains', difficulty: 45,
            successText: 'Je trouwste crewlid haalt de envelop op. De informant is teleurgesteld maar geeft het materiaal toch.',
            failText: 'De informant herkent je crewlid niet en vlucht. "Ik zei: alleen." De lijn wordt permanent verbroken.',
            effects: { money: 8000, heat: 0, rep: 30, dirtyMoney: 5000, crewDamage: 0 },
          },
          {
            id: 'inf_4c', label: 'ZET EEN HINDERLAAG', stat: 'muscle', difficulty: 50,
            successText: 'Je wacht hem op en neemt alles. De informant verzet zich niet. "Ik wist dat je dit zou doen." In de envelop: meer dan je ooit had verwacht.',
            failText: 'De informant had zelf beveiliging. Een kort vuurgevecht. Alles gaat verloren.',
            effects: { money: 0, heat: 15, rep: -20, dirtyMoney: 20000, crewDamage: 20 },
          },
        ],
      },
    ],
  },

  // ===== ARC 2: HET ERFENIS-MYSTERIE =====
  {
    id: 'erfenis',
    name: 'Het Erfenis-mysterie',
    description: 'Je ontdekt dat een oud maffiafortuin ergens in Noxhaven verborgen is. Volg aanwijzingen over meerdere districten.',
    icon: '🗝️',
    triggerConditions: { minDay: 8, minDistricts: 1 },
    completionReward: { money: 40000, rep: 150, dirtyMoney: 20000, heat: 0, weaponReward: { minRarity: 'rare' } },
    steps: [
      {
        id: 'erf_1',
        text: 'Bij het opruimen van een oud pand in je district vind je een verborgen kluis. Erin: een vergeeld briefje en een oude sleutel. Het briefje luidt: "De fortuin van Don Vasari rust waar het water de muur raakt — Port Nero."',
        phonePreview: 'Je hebt een mysterieus briefje gevonden in een oude kluis. Er staat een locatie op...',
        phoneFrom: 'anonymous',
        choices: [
          {
            id: 'erf_1a', label: 'VOLG DE AANWIJZING', stat: 'brains', difficulty: 20,
            successText: 'Bij de waterkant van Port Nero vind je een symbool in de muur — een Vasari familiewapen. Erachter: een tweede aanwijzing.',
            failText: 'Je zoekt urenlang maar vindt niets. Het briefje is misschien te oud om nog betrouwbaar te zijn.',
            effects: { money: 0, heat: 3, rep: 10, dirtyMoney: 0, crewDamage: 0 },
          },
          {
            id: 'erf_1b', label: 'ONDERZOEK DON VASARI', stat: 'brains', difficulty: 25,
            successText: 'Oude kranten vertellen het verhaal: Don Vasari verdween in 1987 met miljoenen. Nooit gevonden. Tot nu.',
            failText: 'De archieven zijn onvolledig. Je vindt weinig bruikbaars.',
            effects: { money: 0, heat: 0, rep: 5, dirtyMoney: 0, crewDamage: 0 },
          },
        ],
      },
      {
        id: 'erf_2',
        text: 'De tweede aanwijzing leidt naar Iron District. "Waar vuur smedt, rust de tweede sleutel — onder de aambeeldsten." Een oude smederij aan de rand van het industrieterrein.',
        phonePreview: '"Waar vuur smedt, rust de tweede sleutel." De aanwijzing leidt naar Iron District.',
        phoneFrom: 'anonymous',
        choices: [
          {
            id: 'erf_2a', label: 'BREEK IN BIJ DE SMEDERIJ', stat: 'muscle', difficulty: 35,
            successText: 'Onder een losse steen vind je een tweede sleutel en een kaartfragment. Het fortuin is echt!',
            failText: 'De smederij wordt bewaakt door een oude man met een jachtgeweer. Je vlucht.',
            effects: { money: 0, heat: 8, rep: 15, dirtyMoney: 0, crewDamage: 5 },
          },
          {
            id: 'erf_2b', label: 'PRAAT MET DE EIGENAAR', stat: 'charm', difficulty: 30,
            successText: '"Don Vasari? Die naam heb ik lang niet gehoord." De oude smid overhandigt je de sleutel. "Neem het. Het brengt mij alleen ongeluk."',
            failText: '"Ik weet nergens van. Wegwezen." De smid slaat de deur dicht.',
            effects: { money: -500, heat: 0, rep: 10, dirtyMoney: 0, crewDamage: 0 },
          },
          {
            id: 'erf_2c', label: 'STUUR JE CREW', stat: 'brains', difficulty: 30,
            successText: 'Je crew vindt de sleutel en brengt hem veilig terug. Geen sporen achtergelaten.',
            failText: 'Ze worden gezien door buurtbewoners. De politie onderzoekt de zaak.',
            effects: { money: 0, heat: 5, rep: 5, dirtyMoney: 0, crewDamage: 0 },
          },
        ],
      },
      {
        id: 'erf_3',
        text: 'Met twee sleutels en een kaartfragment weet je dat de schat verborgen is in een ondergrondse kluis. Maar iemand anders is ook aan het zoeken — je ziet verse sporen bij de locatie.',
        phonePreview: '"Iemand anders zoekt ook naar het Vasari-fortuin. Je moet sneller zijn."',
        phoneFrom: 'anonymous',
        choices: [
          {
            id: 'erf_3a', label: 'RACE ERHEEN', stat: 'muscle', difficulty: 40,
            successText: 'Je arriveert net op tijd! De concurrent vlucht als hij je ziet. De kluisdeur wacht.',
            failText: 'De concurrent is er al. Een kort gevecht — je wint, maar bent gewond.',
            effects: { money: 0, heat: 10, rep: 20, dirtyMoney: 0, crewDamage: 15 },
          },
          {
            id: 'erf_3b', label: 'ZET EEN VAL', stat: 'brains', difficulty: 45,
            successText: 'Je laat de concurrent het werk doen en grijpt in op het perfecte moment. De kluis is van jou.',
            failText: 'De val mislukt. De concurrent is slimmer dan je dacht. Maar de kluis is nog dicht.',
            effects: { money: 0, heat: 5, rep: 10, dirtyMoney: 0, crewDamage: 0 },
          },
          {
            id: 'erf_3c', label: 'WAARSCHUW DE CONCURRENT', stat: 'charm', difficulty: 35,
            requiredKarma: 'eerbaar',
            successText: '"Dit fortuin brengt alleen ongeluk. Laten we het delen." De concurrent is verbaasd, maar stemt toe. Jullie openen de kluis samen — en delen eerlijk. Respect wordt verdiend.',
            failText: 'De concurrent lacht je uit. "Delen? Ben je gek?" Hij rent naar de kluis.',
            effects: { money: 5000, heat: -5, rep: 30, dirtyMoney: 0, crewDamage: 0, karma: 20 },
          },
          {
            id: 'erf_3d', label: 'ELIMINEER DE CONCURRENT', stat: 'muscle', difficulty: 40,
            requiredKarma: 'meedogenloos',
            successText: 'Eén kogel. De concurrent zakt in elkaar. Niemand zal ooit weten dat hij hier was. De kluis — en het fortuin — is alleen van jou. Zonder getuigen.',
            failText: 'De concurrent is gewapend. Een vuurgevecht in de tunnels. Je wint, maar niet zonder kleerscheuren.',
            effects: { money: 0, heat: 15, rep: 20, dirtyMoney: 5000, crewDamage: 10, karma: -20 },
          },
        ],
      },
      {
        id: 'erf_4',
        text: 'De ondergrondse kluis ligt voor je. Twee sleutelgaten. Een combinatieslot. En een inscriptie: "Alleen de waardige openen wat Vasari achterliet." Je hart bonst.',
        phonePreview: '"De kluis is gevonden. Dit is het moment. Alles of niets."',
        phoneFrom: 'anonymous',
        choices: [
          {
            id: 'erf_4a', label: 'DRAAI DE SLEUTELS', stat: 'brains', difficulty: 35,
            successText: 'Klik. Klik. De deur zwaait open. Goudstaven, cash, diamanten — het Vasari-fortuin is legendarisch. En nu van jou.',
            failText: 'De sleutels passen, maar het combinatieslot weigert. Je bent zo dichtbij...',
            effects: { money: 30000, heat: 0, rep: 50, dirtyMoney: 15000, crewDamage: 0 },
          },
          {
            id: 'erf_4b', label: 'FORCEER DE KLUIS', stat: 'muscle', difficulty: 50,
            successText: 'Met brute kracht breek je het slot open. De inhoud is overweldigend — meer dan je ooit had gedroomd.',
            failText: 'Een veiligheidsmechanisme springt aan. De kluis verzegelt zich permanent. Het fortuin is verloren.',
            effects: { money: 20000, heat: 5, rep: 30, dirtyMoney: 20000, crewDamage: 10 },
          },
          {
            id: 'erf_4c', label: 'LAAT EEN EXPERT KOMEN', stat: 'charm', difficulty: 40,
            successText: 'Je haalt een kluiskraker erbij. Hij opent het in 20 minuten. "Professionele courtesy — ik neem 10%." Fair genoeg.',
            failText: 'De expert neemt je geld en verdwijnt. Oplichter!',
            effects: { money: 25000, heat: 3, rep: 40, dirtyMoney: 10000, crewDamage: 0 },
          },
        ],
      },
    ],
  },

  // ===== ARC 3: DE RIVAAL =====
  {
    id: 'rivaal',
    name: 'De Rivaal',
    description: 'Een nieuwe speler in Noxhaven daagt je positie uit. Diplomatie of geweld?',
    icon: '⚔️',
    triggerConditions: { minDay: 12, minRep: 100, minDistricts: 2 },
    completionReward: { money: 20000, rep: 300, dirtyMoney: 10000, heat: -10, gearReward: { type: 'armor', minRarity: 'epic' } },
    steps: [
      {
        id: 'riv_1',
        text: 'Geruchten op straat: iemand genaamd "Viktor Krow" is Noxhaven binnengekomen. Hij heeft geld, connecties, en ambities. Jouw informanten melden dat hij al contacten legt met de facties.',
        phonePreview: '"Een nieuwkomer — Viktor Krow — maakt naam in de stad. Hij vraagt rond naar jou." — Informant',
        phoneFrom: 'informant',
        choices: [
          {
            id: 'riv_1a', label: 'LAAT JE ZIEN', stat: 'charm', difficulty: 25,
            successText: 'Je verschijnt op een van Krows feestjes. "Dus jij bent de baas hier?" Hij grinnikt. "Nog wel." De spanning is voelbaar.',
            failText: 'Je probeert indruk te maken maar Krow is niet onder de indruk. "Ik verwachtte meer."',
            effects: { money: 0, heat: 5, rep: 20, dirtyMoney: 0, crewDamage: 0 },
          },
          {
            id: 'riv_1b', label: 'ONDERZOEK KROW', stat: 'brains', difficulty: 30,
            successText: 'Krow komt uit Antwerpen. Drugshandel, wapensmokkel, chantage — zijn repertoire is indrukwekkend. Maar hij heeft ook vijanden.',
            failText: 'Krow is een schim. Geen dossier, geen verleden. Dat maakt hem gevaarlijk.',
            effects: { money: 0, heat: 0, rep: 10, dirtyMoney: 0, crewDamage: 0 },
          },
          {
            id: 'riv_1c', label: 'STUUR EEN WAARSCHUWING', stat: 'muscle', difficulty: 35,
            successText: 'Je laat zijn favoriete auto in brand steken. De boodschap is duidelijk: dit is jouw stad.',
            failText: 'Krows beveiliging is te sterk. Je mannen worden afgeslagen.',
            effects: { money: 0, heat: 10, rep: 15, dirtyMoney: 0, crewDamage: 10 },
          },
        ],
      },
      {
        id: 'riv_2',
        text: 'Krow escaleert. Hij begint jouw handelsroutes te ondermijnen — lagere prijzen, betere deals. Klanten stappen over. Je merkt het in je portemonnee.',
        phonePreview: '"Krow dumpt goederen onder jouw prijs. Klanten lopen over. Je moet iets doen." — Crew',
        phoneFrom: 'anonymous',
        choices: [
          {
            id: 'riv_2a', label: 'PRIJZENOORLOG', stat: 'brains', difficulty: 35,
            successText: 'Je verlaagt je prijzen nog verder. Krow bloedt geld — zijn investeerders worden nerveus. Na twee weken trekt hij zich terug uit jouw markten.',
            failText: 'De prijzenoorlog kost je een fortuin. Krow heeft diepere zakken dan je dacht.',
            effects: { money: -8000, heat: 5, rep: 20, dirtyMoney: 0, crewDamage: 0 },
          },
          {
            id: 'riv_2b', label: 'SABOTEER ZIJN LEVERINGEN', stat: 'muscle', difficulty: 40,
            successText: 'Je onderschept drie van zijn leveringen in één nacht. Krow is woedend — maar machteloos.',
            failText: 'Zijn beveiliging is beter dan verwacht. Je verliest een crewlid bij de poging.',
            effects: { money: 0, heat: 12, rep: 25, dirtyMoney: 5000, crewDamage: 15 },
          },
          {
            id: 'riv_2c', label: 'BIED EEN DEAL AAN', stat: 'charm', difficulty: 30,
            successText: '"De stad is groot genoeg voor twee." Krow overweegt het. "Voorlopig." Een tijdelijk bestand.',
            failText: '"Ik deel niet." Krow lacht en loopt weg.',
            effects: { money: 0, heat: 0, rep: 0, dirtyMoney: 0, crewDamage: 0 },
          },
        ],
      },
      {
        id: 'riv_3',
        text: 'Het conflict bereikt een kookpunt. Krow heeft een bondgenootschap gesloten met een van de facties. Samen plannen ze een aanval op jouw hoofdkwartier. Je moet snel handelen.',
        phonePreview: '"Krow heeft de Syndicate achter zich. Ze plannen iets groots. Vanavond." — Informant',
        phoneFrom: 'informant',
        choices: [
          {
            id: 'riv_3a', label: 'VERSTERK JE VERDEDIGING', stat: 'brains', difficulty: 35,
            successText: 'Je barricadeert alles. De aanval komt — en wordt afgeslagen. Krow verliest manschappen en geloofwaardigheid.',
            failText: 'Ondanks je voorbereiding breken ze door. Schade aan je HQ en voorraad gestolen.',
            effects: { money: -3000, heat: 10, rep: 30, dirtyMoney: 0, crewDamage: 10 },
          },
          {
            id: 'riv_3b', label: 'SLUIP ER ZELF OP AF', stat: 'muscle', difficulty: 45,
            successText: 'Je slaat preventief toe. Krows staging area wordt vernietigd. De factie-bondgenoten trekken zich terug.',
            failText: 'Krow had een val gezet. Je loopt erin maar ontsnapt ternauwernood.',
            effects: { money: 0, heat: 15, rep: 35, dirtyMoney: 3000, crewDamage: 20 },
          },
          {
            id: 'riv_3c', label: 'KOOP DE FACTIE OM', stat: 'charm', difficulty: 40,
            successText: '"Krow betaalt jullie hoe veel? Ik verdubbel het." De factie draait. Krow staat er ineens alleen voor.',
            failText: 'Ze vertrouwen Krow meer. "Jij bent oud nieuws." De aanval komt toch.',
            effects: { money: -10000, heat: 0, rep: 25, dirtyMoney: 0, crewDamage: 0, relChange: {} },
          },
        ],
      },
      {
        id: 'riv_4',
        text: 'Krow is verzwakt maar niet verslagen. Hij stuurt je een bericht: "Eén-op-één. Jij en ik. De winnaar krijgt alles. De verliezer verlaat Noxhaven voor altijd."',
        phonePreview: '"Eén-op-één. Jij en ik. De winnaar krijgt alles." — Viktor Krow',
        phoneFrom: 'anonymous',
        choices: [
          {
            id: 'riv_4a', label: 'ACCEPTEER HET DUEL', stat: 'muscle', difficulty: 45,
            successText: 'Een episch gevecht op het dak van het hoogste gebouw in Neon Mile. Krow valt. "Je... bent beter dan ik dacht." Hij vertrekt uit Noxhaven. De stad is definitief van jou.',
            failText: 'Krow is een formidabele tegenstander. Het gevecht is lang en pijnlijk. Uiteindelijk win je — maar ternauwernood.',
            effects: { money: 15000, heat: 5, rep: 100, dirtyMoney: 10000, crewDamage: 25 },
          },
          {
            id: 'riv_4b', label: 'STA HEM OP MET JE CREW', stat: 'charm', difficulty: 35,
            successText: 'Krow komt alleen — jij niet. "Dit is niet eerlijk." "Dit is Noxhaven." Krow wordt de stad uitgejaagd.',
            failText: 'Krow had zelf ook backup. Een massaal straatgevecht ontvouwt zich.',
            effects: { money: 10000, heat: 10, rep: 60, dirtyMoney: 5000, crewDamage: 15 },
          },
          {
            id: 'riv_4c', label: 'BIED HEM EEN PARTNERSCHAP', stat: 'charm', difficulty: 50,
            successText: '"Waarom vechten als we samen de stad kunnen runnen?" Krow overweegt... en accepteert. Samen zijn jullie onaantastbaar.',
            failText: '"Partners? Met jou?" Krow lacht. "Nooit." Het wordt oorlog.',
            effects: { money: 5000, heat: -10, rep: 80, dirtyMoney: 0, crewDamage: 0, karma: 10 },
          },
          {
            id: 'riv_4d', label: 'GEEF HEM EEN EERVOLLE AFTOCHT', stat: 'charm', difficulty: 40,
            requiredKarma: 'eerbaar',
            successText: '"Je hebt verloren, Krow. Maar ik respecteer een vechter. Neem je geld en vertrek met waardigheid." Krow is verbijsterd. "Je bent de eerste die me zo behandelt." Hij vertrekt — en laat een bondgenootschap achter.',
            failText: 'Krow ziet het als zwakte. "Medelijden? Van jou?" Hij valt aan.',
            effects: { money: 0, heat: -15, rep: 90, dirtyMoney: 0, crewDamage: 0, karma: 25 },
          },
          {
            id: 'riv_4e', label: 'MAAK EEN VOORBEELD VAN HEM', stat: 'muscle', difficulty: 35,
            requiredKarma: 'meedogenloos',
            successText: 'Je verslaat Krow publiekelijk. Op zijn knieën, voor heel Noxhaven. "Kijk goed," zeg je tegen de menigte. "Dit is wat er gebeurt." Niemand zal je ooit meer uitdagen. De stad is van jou — door angst.',
            failText: 'Krow vecht als een beest. Het publieke schouwspel slaat in je nadeel om als hij bijna wint.',
            effects: { money: 20000, heat: 20, rep: 120, dirtyMoney: 15000, crewDamage: 15, karma: -25 },
          },
        ],
      },
    ],
  },
  // ===== ARC 4: DE DUBBELAGENT =====
  {
    id: 'dubbelagent',
    name: 'De Dubbelagent',
    description: 'Een politiemol biedt je een deal: werk undercover voor hen, of val. Dubbele loyaliteiten, dubbel gevaar.',
    icon: '🎭',
    triggerConditions: { minDay: 15, minRep: 150 },
    completionReward: { money: 35000, rep: 250, dirtyMoney: 15000, heat: -30, gearReward: { type: 'gadget', minRarity: 'epic' } },
    steps: [
      {
        id: 'dub_1',
        text: 'Een man in een onopvallend pak staat bij je auto te wachten. Hij laat een politiepenning zien — en stopt hem snel weer weg. "Inspecteur Janssen. Ik heb een voorstel dat je leven kan redden. Of beëindigen."',
        phonePreview: '"We moeten praten. Geen trucs. Ik kan je helpen — of vernietigen." — Onbekend (politie)',
        phoneFrom: 'dubbelagent',
        choices: [
          {
            id: 'dub_1a', label: 'LUISTER NAAR ZIJN VOORSTEL', stat: 'brains', difficulty: 20,
            successText: '"Ik heb een netwerk van corrupte collega\'s. Ze beschermen de echte criminelen — niet jou. Help me ze ontmaskeren, en ik zorg dat jij vrij rondloopt." Hij schuift een dossier over de tafel.',
            failText: 'Janssen is vaag en nerveus. "Ik neem later contact op." Hij verdwijnt in de menigte. Was dit echt?',
            effects: { money: 0, heat: -5, rep: 10, dirtyMoney: 0, crewDamage: 0, karma: 5 },
          },
          {
            id: 'dub_1b', label: 'WEIGER EN DREIG', stat: 'muscle', difficulty: 30,
            successText: '"Als je me ooit weer benadert, stuur ik je badge naar de krant." Janssen verbleekt. "Je maakt een fout." Maar hij vertrekt.',
            failText: 'Janssen glimlacht koud. "Dreigen? Mij?" Hij laat een foto zien van jou bij een deal. "Ik heb meer op je dan je denkt."',
            effects: { money: 0, heat: 5, rep: 15, dirtyMoney: 0, crewDamage: 0, karma: -5 },
          },
          {
            id: 'dub_1c', label: 'SPEEL MEE — MAAR VERTROUW NIEMAND', stat: 'charm', difficulty: 25,
            successText: '"Ik luister." Janssen knikt goedkeurend. Je krijgt een prepaid telefoon. "Hiermee communiceren we. Vertel niemand hierover." Een nieuw spel begint.',
            failText: 'Je probeert hem uit te horen, maar Janssen is getraind. Hij geeft niets prijs over zichzelf.',
            effects: { money: 0, heat: 0, rep: 5, dirtyMoney: 0, crewDamage: 0 },
          },
        ],
      },
      {
        id: 'dub_2',
        text: 'Janssen stuurt je de eerste opdracht via de prepaid: "Een drugsleverantie vanavond in Port Nero. Ik heb de route. Plant een tracker op de vrachtwagen — dan pakken wij de ontvangers. Jij blijft buiten beeld."',
        phonePreview: '"Vanavond. Port Nero. Plant een tracker. Geen vragen." — Janssen',
        phoneFrom: 'dubbelagent',
        districtVariant: {
          port: 'Janssen stuurt coördinaten: Dok 7, Port Nero. Een bekende plek — je hebt hier zelf gehandeld. De ironie brandt.',
        },
        choices: [
          {
            id: 'dub_2a', label: 'PLANT DE TRACKER', stat: 'brains', difficulty: 35,
            successText: 'In de duisternis bevestig je het apparaat onder de vrachtwagen. De volgende ochtend: een grote politie-inval op het nieuws. Janssens vijanden zijn gevallen. Maar jij voelt je vies.',
            failText: 'De chauffeur betrapte je bijna. Je ontsnapt, maar de tracker zit los. De inval mislukt gedeeltelijk.',
            effects: { money: 5000, heat: -10, rep: -5, dirtyMoney: 0, crewDamage: 0, karma: 10 },
          },
          {
            id: 'dub_2b', label: 'WAARSCHUW DE ONTVANGERS', stat: 'charm', difficulty: 40,
            successText: 'Je tipt de ontvangers. Zij verplaatsen de lading. Janssens inval vindt niets. "Wat is er misgegaan?" vraagt hij woedend. Jij zegt niets.',
            failText: 'De ontvangers vertrouwen je niet en vluchten. De politie vindt de lading toch. Janssen is blij — maar jij hebt vijanden gemaakt.',
            effects: { money: 3000, heat: 5, rep: 20, dirtyMoney: 5000, crewDamage: 0, karma: -10 },
          },
          {
            id: 'dub_2c', label: 'STEEL DE LADING ZELF', stat: 'muscle', difficulty: 45,
            successText: 'Terwijl iedereen op de tracker focust, rij jij de vrachtwagen een andere kant op. De politie staat voor een leeg dok. De ontvangers staan met lege handen. En jij? Jij hebt de lading.',
            failText: 'Te hebberig. De chauffeur slaat alarm en je moet vluchten zonder de lading.',
            effects: { money: 0, heat: 15, rep: 10, dirtyMoney: 15000, crewDamage: 10, karma: -15 },
          },
        ],
      },
      {
        id: 'dub_3',
        text: 'Weken gaan voorbij. Janssen wordt steeds veeleisender. Dan ontdek je iets: Janssen is zelf niet schoon. Hij gebruikt jou om zijn rivalen bij de politie uit te schakelen — niet om corruptie te bestrijden. Je bent een pion in zijn machtsspel.',
        phonePreview: '"Volgende klus: neem contact op met mijn bron in Crown Heights." — Janssen (maar klopt dit wel?)',
        phoneFrom: 'dubbelagent',
        choices: [
          {
            id: 'dub_3a', label: 'CONFRONTEER JANSSEN', stat: 'charm', difficulty: 45,
            successText: '"Je bent zelf corrupt, Janssen." Stilte aan de lijn. Dan: "Oké. Je bent slimmer dan ik dacht. Laten we... opnieuw onderhandelen." De machtsbalans verschuift naar jou.',
            failText: '"Beschuldig mij niet van iets dat je niet kunt bewijzen." Janssen klinkt ijskoud. Je hebt een gevaarlijke vijand gemaakt.',
            effects: { money: 0, heat: 5, rep: 30, dirtyMoney: 0, crewDamage: 0, karma: 10 },
          },
          {
            id: 'dub_3b', label: 'GEBRUIK HET TEGEN HEM', stat: 'brains', difficulty: 50,
            successText: 'Je verzamelt bewijs van Janssens eigen corruptie. Screenshots, opnames, data. Nu heb jij de touwtjes in handen. "Van nu af aan werk JIJ voor MIJ, inspecteur."',
            failText: 'Janssen ontdekt je spionage. "Je speelt een gevaarlijk spel." De prepaid gaat dood.',
            effects: { money: 0, heat: -15, rep: 40, dirtyMoney: 0, crewDamage: 0, karma: -5 },
          },
          {
            id: 'dub_3c', label: 'STAP ERUIT — VERNIETIG ALLES', stat: 'muscle', difficulty: 35,
            successText: 'Je vernietigt de prepaid, wist alle sporen. Janssen kan niets bewijzen. "Dit was een fout," sms je als laatste. Vrij, maar met vijanden.',
            failText: 'Janssen had backup-kopieën. Je bent niet zo vrij als je dacht.',
            effects: { money: 0, heat: 10, rep: 15, dirtyMoney: 0, crewDamage: 0, karma: 5 },
          },
        ],
      },
      {
        id: 'dub_4',
        text: 'De situatie escaleert. Janssens corrupte netwerk wordt onderzocht door Interne Zaken. Jouw naam duikt op in dossiers. Janssen belt in paniek: "Ze komen achter ons aan. We moeten samenwerken of we gaan allebei ten onder."',
        phonePreview: '"IZ opent onderzoek. Jouw naam staat in mijn dossiers. We moeten praten. NU." — Janssen',
        phoneFrom: 'dubbelagent',
        choices: [
          {
            id: 'dub_4a', label: 'WERK SAMEN — LAATSTE KEER', stat: 'brains', difficulty: 45,
            successText: 'Samen fabriceren jullie een rookgordijn. Janssen "arresteert" een stroman. IZ sluit het onderzoek. "We zijn quitte," zegt Janssen. "Laten we doen alsof dit nooit is gebeurd."',
            failText: 'Het rookgordijn werkt niet. IZ graaft dieper. Je moet onderduiken.',
            effects: { money: 10000, heat: -20, rep: 30, dirtyMoney: 10000, crewDamage: 0, karma: -10 },
          },
          {
            id: 'dub_4b', label: 'LEVER JANSSEN UIT AAN IZ', stat: 'charm', difficulty: 40,
            requiredKarma: 'eerbaar',
            successText: 'Je belt IZ anoniem met al het bewijs. Janssen wordt gearresteerd op het bureau, voor de ogen van zijn collega\'s. "JIJ..." schreeuwt hij terwijl ze hem wegvoeren. Recht zegeviert — voor deze keer.',
            failText: 'IZ gelooft je niet volledig. Janssen wordt geschorst maar niet gearresteerd. Hij zweert wraak.',
            effects: { money: 0, heat: -25, rep: 50, dirtyMoney: 0, crewDamage: 0, karma: 25 },
          },
          {
            id: 'dub_4c', label: 'ELIMINEER JANSSEN PERMANENT', stat: 'muscle', difficulty: 50,
            requiredKarma: 'meedogenloos',
            successText: 'Een "ongeluk" op de snelweg. Inspecteur Janssen overleeft het niet. Het IZ-onderzoek stopt wegens gebrek aan getuigen. Alle sporen leiden naar een dood spoor.',
            failText: 'Janssen overleeft de aanslag. Nu jaagt zowel IZ als Janssen op je.',
            effects: { money: 0, heat: 20, rep: 30, dirtyMoney: 15000, crewDamage: 10, karma: -25 },
          },
        ],
      },
      {
        id: 'dub_5',
        text: 'Maanden later. De storm is gaan liggen. Een envelop onder je deur: foto\'s van al je ontmoetingen met Janssen. Een briefje: "Ik weet alles. En ik wil praten." Geen afzender. Maar het handschrift is vrouwelijk.',
        phonePreview: '"Iemand weet van Janssen. Nieuwe speler. Wees voorzichtig." — Eigen analyse',
        phoneFrom: 'anonymous',
        choices: [
          {
            id: 'dub_5a', label: 'ONTMOET DE AFZENDER', stat: 'charm', difficulty: 40,
            successText: 'Een vrouw in het zwart. Officier van Justitie Van der Berg. "Ik wil hetzelfde als jij — de stad schoonvegen. Maar op mijn manier." Een onverwachte bondgenoot. Of een nieuwe val.',
            failText: 'Je gaat erheen, maar ze verschijnt niet. Alleen een tweede envelop: "Niet klaar. Volgende keer."',
            effects: { money: 5000, heat: -10, rep: 40, dirtyMoney: 0, crewDamage: 0, karma: 5 },
          },
          {
            id: 'dub_5b', label: 'VERBRAND ALLES EN VERDWIJN', stat: 'brains', difficulty: 35,
            successText: 'Je vernietigt alle bewijs, verhuist je operatie, en verandert je routines. Wie het ook is — ze vinden een lege schelp.',
            failText: 'Je vernietigt te veel. Waardevolle contacten gaan verloren in je paranoia.',
            effects: { money: -5000, heat: -15, rep: 20, dirtyMoney: 0, crewDamage: 5, karma: 0 },
          },
          {
            id: 'dub_5c', label: 'STUUR EEN BOODSCHAP TERUG', stat: 'muscle', difficulty: 45,
            successText: 'Je vindt haar adres en laat een tegenboodschap achter: "Ik weet ook wie jij bent. Laten we praten als gelijken." Ze belt de volgende dag.',
            failText: 'Je boodschap bereikt de verkeerde persoon. Nu weten meer mensen van Janssen.',
            effects: { money: 0, heat: 5, rep: 35, dirtyMoney: 5000, crewDamage: 0, karma: -5 },
          },
        ],
      },
    ],
  },

  // ===== ARC 5: HET SYNDICAAT KEERT TERUG =====
  {
    id: 'syndicaat',
    name: 'Het Syndicaat Keert Terug',
    description: 'Een oude machtsfactor uit het verleden van Noxhaven wil de stad heroveren. Kies je zijde.',
    icon: '🏛️',
    triggerConditions: { minDay: 20, minDistricts: 3 },
    completionReward: { money: 50000, rep: 350, dirtyMoney: 25000, heat: -15, weaponReward: { minRarity: 'epic' } },
    steps: [
      {
        id: 'syn_1',
        text: 'Zwarte SUV\'s verschijnen in meerdere districten tegelijk. Mannen in pakken — niet van hier. Op straat fluistert men: "Het Syndicaat is terug." De organisatie die Noxhaven vóór jou beheerste, voordat ze werden verdreven. Nu willen ze het terug.',
        phonePreview: '"Zwarte SUV\'s overal. Mannen in pakken. Het Syndicaat. Ze zijn terug." — Crew',
        phoneFrom: 'anonymous',
        choices: [
          {
            id: 'syn_1a', label: 'VERZAMEL INTEL', stat: 'brains', difficulty: 30,
            successText: 'Je informanten melden: het Syndicaat wordt geleid door Konstantin Varga, een Hongaarse oligarch. Hij heeft eindeloos geld en een leger huurlingen. Maar hij kent de stad niet — dat is jouw voordeel.',
            failText: 'Het Syndicaat heeft hun communicatie goed beveiligd. Je vangt slechts flarden op.',
            effects: { money: 0, heat: 5, rep: 15, dirtyMoney: 0, crewDamage: 0 },
          },
          {
            id: 'syn_1b', label: 'TOON KRACHT DIRECT', stat: 'muscle', difficulty: 35,
            successText: 'Je onderschept een van hun SUV\'s. De mannen erin zijn professionals — maar jij ook. "Vertel Varga: Noxhaven heeft al een eigenaar." Ze vertrekken met de boodschap.',
            failText: 'De SUV-mannen zijn getrainde soldaten. Een kort vuurgevecht dat je verliest. Ze laten je gaan — als boodschap.',
            effects: { money: 0, heat: 10, rep: 25, dirtyMoney: 0, crewDamage: 10 },
          },
          {
            id: 'syn_1c', label: 'NEEM CONTACT OP MET VARGA', stat: 'charm', difficulty: 30,
            successText: 'Via vijf tussenpersonen bereik je Varga. "Ah, de lokale koning," zegt hij met een zwaar accent. "Ik waardeer directheid. Laten we praten." Een gevaarlijke uitnodiging.',
            failText: 'Varga weigert contact. "Ik praat niet met straatkatten." De belediging brandt.',
            effects: { money: 0, heat: 0, rep: 10, dirtyMoney: 0, crewDamage: 0 },
          },
        ],
      },
      {
        id: 'syn_2',
        text: 'Het Syndicaat maakt zijn eerste zet: ze kopen drie bedrijven in Crown Heights op en beginnen een "legitieme" operatie die als dekmantel dient. Tegelijkertijd rekruteren ze lokale gangs als tussenpersonen. Jouw invloed slinkt.',
        phonePreview: '"Varga koopt halve Crown Heights op. Lokale gangs lopen over. Dit is oorlog." — Informant',
        phoneFrom: 'anonymous',
        choices: [
          {
            id: 'syn_2a', label: 'ECONOMISCHE TEGENACTIE', stat: 'brains', difficulty: 40,
            successText: 'Je verlaagt je prijzen, biedt betere bescherming aan winkeliers, en onthult Varga\'s criminele verleden aan de media. Zijn "legitieme" façade scheurt. Investeerders trekken zich terug.',
            failText: 'Varga heeft betere advocaten dan jij. Zijn façade houdt stand. Je verliest geld aan de prijzenoorlog.',
            effects: { money: -10000, heat: 5, rep: 25, dirtyMoney: 0, crewDamage: 0, karma: 5 },
          },
          {
            id: 'syn_2b', label: 'REKRUTEER ZIJN OVERLOPERS TERUG', stat: 'charm', difficulty: 45,
            successText: '"Varga betaalt goed — maar hij kent jullie niet. Ik ken jullie namen, jullie families." De boodschap is duidelijk. Drie gangs keren terug naar jouw zijde.',
            failText: 'De gangs zijn te bang voor Varga. "Sorry, baas. Maar die man... die is anders."',
            effects: { money: -5000, heat: 5, rep: 20, dirtyMoney: 0, crewDamage: 0 },
          },
          {
            id: 'syn_2c', label: 'SABOTEER ZIJN OPERATIES', stat: 'muscle', difficulty: 40,
            successText: 'Een nachtelijke raid op zijn pakhuizen. Goederen vernietigd, voertuigen onklaar gemaakt. Varga raakt miljoenen kwijt. "Dit is oorlog," sist hij.',
            failText: 'Zijn beveiliging is militair niveau. Je verliest twee crewleden bij de poging.',
            effects: { money: 0, heat: 15, rep: 30, dirtyMoney: 10000, crewDamage: 15 },
          },
        ],
      },
      {
        id: 'syn_3',
        text: 'Varga stuurt een ultimatum: "Geef me Port Nero en Iron District. In ruil krijg je vrede, 20% van mijn import, en bescherming tegen de politie. Weiger en ik neem alles." Je hebt 24 uur.',
        phonePreview: '"Varga\'s ultimatum: geef twee districten of oorlog. Je hebt 24 uur." — Crew',
        phoneFrom: 'anonymous',
        choices: [
          {
            id: 'syn_3a', label: 'ACCEPTEER DE DEAL', stat: 'charm', difficulty: 25,
            successText: 'Je geeft twee districten op — maar krijgt toegang tot Varga\'s internationale smokkelnetwerk. Soms is een stap terug twee stappen vooruit.',
            failText: 'Varga neemt de districten en breekt de deal binnen een week. Je hebt niets.',
            effects: { money: 20000, heat: -20, rep: -30, dirtyMoney: 15000, crewDamage: 0, karma: 0 },
          },
          {
            id: 'syn_3b', label: 'WEIGER — BEREID JE VOOR OP OORLOG', stat: 'muscle', difficulty: 45,
            successText: 'Je mobiliseert alles. Barricades, wachtposten, wapens. Wanneer Varga\'s leger aanvalt, zijn ze niet voorbereid op de weerstand. Na drie dagen van straatgevechten trekken ze zich terug.',
            failText: 'Varga\'s troepen zijn beter bewapend. Je verliest terrein, maar houdt je kerngebied vast.',
            effects: { money: -15000, heat: 25, rep: 50, dirtyMoney: 0, crewDamage: 25 },
          },
          {
            id: 'syn_3c', label: 'SMEED EEN ALLIANTIE MET DE FACTIES', stat: 'charm', difficulty: 50,
            successText: '"De vijand van mijn vijand..." Voor het eerst in de geschiedenis van Noxhaven werken alle drie de facties samen. Varga staat tegenover een verenigde stad.',
            failText: 'De facties vertrouwen elkaar te weinig. De alliantie valt uiteen voordat Varga aanvalt.',
            effects: { money: -8000, heat: 10, rep: 40, dirtyMoney: 0, crewDamage: 10, karma: 10 },
          },
        ],
      },
      {
        id: 'syn_4',
        text: 'De eindstrijd. Varga heeft zich verschanst in een gefortificeerd penthouse in het centrum. Zijn troepen zijn gedecimeerd, maar hij heeft gijzelaars. De hele stad kijkt toe. Dit is het moment dat Noxhaven\'s toekomst bepaalt.',
        phonePreview: '"Varga\'s penthouse. Gijzelaars. Dit is het einde — voor hem of voor ons." — Crew',
        phoneFrom: 'anonymous',
        choices: [
          {
            id: 'syn_4a', label: 'BESTORM HET PENTHOUSE', stat: 'muscle', difficulty: 50,
            successText: 'Een brutale aanval van alle kanten. Varga vecht als een gewond dier, maar hij staat alleen. Als de rook optrekt, knielt hij. "Dit is niet het einde," fluistert hij. Maar dat is het wel.',
            failText: 'De aanval is kostbaar. Je wint, maar het penthouse is verwoest en de gijzelaars gewond.',
            effects: { money: 25000, heat: 20, rep: 80, dirtyMoney: 20000, crewDamage: 20, karma: -10 },
          },
          {
            id: 'syn_4b', label: 'ONDERHANDEL OVER DE GIJZELAARS', stat: 'charm', difficulty: 45,
            successText: 'Uren van gespannen onderhandeling. Uiteindelijk laat Varga de gijzelaars gaan in ruil voor vrije aftocht. Bij de helikopter draait hij zich om: "We zien elkaar weer." Maar zijn imperium is gebroken.',
            failText: 'Varga breekt de onderhandeling af. Een schot weerklinkt binnen. Je moet toch aanvallen.',
            effects: { money: 15000, heat: 0, rep: 60, dirtyMoney: 10000, crewDamage: 5, karma: 15 },
          },
          {
            id: 'syn_4c', label: 'BIED HEM EEN PLEK IN JOUW ORGANISATIE', stat: 'charm', difficulty: 55,
            requiredKarma: 'eerbaar',
            successText: '"Je hebt talent, Varga. En ik kan het gebruiken." De oligarch staart je aan. Dan lacht hij — voor het eerst. "Je bent de eerste die me verrast in twintig jaar." Een onverwacht bondgenootschap.',
            failText: '"Werk voor jou? VOOR JOU?" Varga barst in lachen uit en opent het vuur.',
            effects: { money: 10000, heat: -10, rep: 100, dirtyMoney: 0, crewDamage: 0, karma: 20 },
          },
        ],
      },
    ],
  },

  // ===== ARC 6: DE TUNNELS VAN NOXHAVEN =====
  {
    id: 'tunnels',
    name: 'De Tunnels van Noxhaven',
    description: 'Onder de stad ligt een vergeten netwerk van tunnels met een eigen economie en bewoners. Ontdek het.',
    icon: '🕳️',
    triggerConditions: { minDay: 10, minRep: 80 },
    completionReward: { money: 30000, rep: 200, dirtyMoney: 10000, heat: -25, gearReward: { type: 'gadget', minRarity: 'rare' } },
    steps: [
      {
        id: 'tun_1',
        text: 'Een dakloze man grijpt je arm als je door Lowrise loopt. "Jij... jij bent sterk genoeg. Onder de stad... er is meer. Veel meer." Hij wijst naar een rooster in het trottoir. "Ga kijken. Maar pas op voor de Bewakers."',
        phonePreview: '"Een vreemde man bij Lowrise vertelde over tunnels onder de stad. Kan niets zijn — of alles."',
        phoneFrom: 'anonymous',
        choices: [
          {
            id: 'tun_1a', label: 'GA HET RIOOL IN', stat: 'muscle', difficulty: 25,
            successText: 'De afdalende trap leidt naar een wereld die je niet verwachtte. Verlichte tunnels, bewoond. Een ondergrondse markt. Mensen leven hier al jaren — buiten het zicht van iedereen.',
            failText: 'Je verdwaalt in de tunnels. Na uren vind je de weg terug naar boven. Maar je hebt genoeg gezien om te weten: daar is iets.',
            effects: { money: 0, heat: 0, rep: 10, dirtyMoney: 0, crewDamage: 0 },
          },
          {
            id: 'tun_1b', label: 'STUUR EEN DRONE', stat: 'brains', difficulty: 30,
            successText: 'De drone-beelden zijn ongelooflijk. Een heel netwerk — kamers, opslagruimtes, zelfs een bar. En bewapende wachten bij elk kruispunt.',
            failText: 'De drone verliest signaal na 200 meter. Maar de beelden die je hebt, zijn genoeg.',
            effects: { money: -500, heat: 0, rep: 5, dirtyMoney: 0, crewDamage: 0 },
          },
          {
            id: 'tun_1c', label: 'BETAAL DE DAKLOZE VOOR INFO', stat: 'charm', difficulty: 20,
            successText: 'Voor €200 tekent hij een ruwe kaart op een servet. Ingangen, routes, namen. "Vraag naar Moeder Kraai. Zij leidt alles."',
            failText: 'De man neemt je geld en verdwijnt. Oplichter — of te bang om meer te vertellen?',
            effects: { money: -200, heat: 0, rep: 5, dirtyMoney: 0, crewDamage: 0 },
          },
        ],
      },
      {
        id: 'tun_2',
        text: 'Je betreedt de tunnels opnieuw, beter voorbereid. Na een halfuur lopen bereik je een poort bewaakt door twee gespierde mannen. "Wie ben je? En wie heeft je gestuurd?" Achter hen hoor je het geluid van een bruisende markt.',
        phonePreview: '"De tunnelmarkt is echt. Bewaking is streng. Je hebt een ingang nodig." — Eigen notities',
        phoneFrom: 'anonymous',
        choices: [
          {
            id: 'tun_2a', label: 'NOEM MOEDER KRAAI', stat: 'charm', difficulty: 35,
            successText: 'De bewakers wisselen een blik. "Moeder verwacht je." Ze laten je door. De tunnelmarkt is overweldigend — goederen, wapens, informatie, alles verhandeld buiten de wet om.',
            failText: '"Moeder Kraai ontvangt geen onbekenden." Ze duwen je terug de tunnel in.',
            effects: { money: 0, heat: 0, rep: 15, dirtyMoney: 0, crewDamage: 0 },
          },
          {
            id: 'tun_2b', label: 'BAAN JE WEG ERDOORHEEN', stat: 'muscle', difficulty: 45,
            successText: 'Een kort maar intens gevecht. De bewakers zijn sterk, maar jij sterker. "Genoeg!" roept een stem. Een oude vrouw verschijnt. "Laat hem door. Iemand met zoveel lef... die wil ik spreken."',
            failText: 'De bewakers zijn getrainde vechters. Ze slaan je neer en gooien je terug naar boven.',
            effects: { money: 0, heat: 5, rep: 10, dirtyMoney: 0, crewDamage: 15 },
          },
          {
            id: 'tun_2c', label: 'BIED HANDELSWAAR AAN', stat: 'brains', difficulty: 30,
            successText: 'Je toont een monster van je beste goederen. De bewakers knikken. "Handelaars zijn altijd welkom." De poort gaat open.',
            failText: 'Ze zijn niet geïnteresseerd in wat je aanbiedt. "Wij hebben genoeg."',
            effects: { money: -1000, heat: 0, rep: 10, dirtyMoney: 0, crewDamage: 0 },
          },
        ],
      },
      {
        id: 'tun_3',
        text: 'Moeder Kraai — een oude vrouw met ogen als obsidiaan — ontvangt je in haar "paleis": een verbouwde metrostation. "Ik ken je reputatie bovengronds. Hier beneden heb je die niet. Bewijs je waarde."',
        phonePreview: '"Moeder Kraai wil dat je je bewijst. Een test — of een val." — Eigen notities',
        phoneFrom: 'anonymous',
        choices: [
          {
            id: 'tun_3a', label: 'ACCEPTEER HAAR TEST', stat: 'brains', difficulty: 40,
            successText: 'De test: los een handelsgeschil op tussen twee tunnelfacties zonder geweld. Na twee uur van onderhandelen schudden ze handen. Moeder Kraai glimlacht. "Je bent welkom hier. Als gelijke."',
            failText: 'De onderhandeling mislukt. Een van de facties trekt een mes. Je ontsnapt, maar Moeder Kraai is niet onder de indruk.',
            effects: { money: 5000, heat: 0, rep: 30, dirtyMoney: 5000, crewDamage: 0, karma: 10 },
          },
          {
            id: 'tun_3b', label: 'EIS DIRECTE TOEGANG', stat: 'muscle', difficulty: 50,
            successText: '"Ik bewijs niets. Ik neem." Moeder Kraai\'s bewakers spannen, maar zij houdt hen tegen. "Eindelijk iemand met ruggengraat. Goed. Je krijgt toegang — maar je betaalt in bloed als je me verraadt."',
            failText: 'Moeder Kraai klakt met haar tong. "Arrogantie is geen kracht." Haar bewakers escorteren je naar buiten.',
            effects: { money: 0, heat: 10, rep: 20, dirtyMoney: 0, crewDamage: 10, karma: -10 },
          },
          {
            id: 'tun_3c', label: 'BIED EEN ALLIANTIE AAN', stat: 'charm', difficulty: 45,
            successText: '"Bovengronds heb ik macht. Ondergronds hebt u kennis. Samen zijn we onaantastbaar." Moeder Kraai peinst lang. "Aangenomen. Maar verraad me, en de tunnels zullen je opslokken."',
            failText: '"Allianties... die heb ik geprobeerd. Altijd verraden." Ze wijst naar de uitgang.',
            effects: { money: 0, heat: -5, rep: 35, dirtyMoney: 0, crewDamage: 0, karma: 5 },
          },
        ],
      },
      {
        id: 'tun_4',
        text: 'Moeder Kraai onthult het diepste geheim van de tunnels: een vergeten metrolijn die alle districten verbindt — onzichtbaar voor de bovenwereld. "Wie deze lijn controleert, controleert de onderbuik van Noxhaven. Ik word oud. En ik zoek een opvolger."',
        phonePreview: '"Een geheime metrolijn onder alle districten. Moeder Kraai biedt je de sleutel aan." — Eigen notities',
        phoneFrom: 'anonymous',
        choices: [
          {
            id: 'tun_4a', label: 'NEEM DE LEIDING OVER', stat: 'charm', difficulty: 45,
            successText: 'Een ceremonie in de diepste tunnel. Moeder Kraai legt een sleutelbos in je handen. "De tunnels zijn van jou. Gebruik ze wijselijk." Een heel nieuw domein opent zich.',
            failText: 'De tunnelbewoners accepteren je niet als leider. "Je bent een buitenstaander." Moeder Kraai zucht. "Misschien volgende keer."',
            effects: { money: 15000, heat: -15, rep: 60, dirtyMoney: 15000, crewDamage: 0, karma: 5 },
          },
          {
            id: 'tun_4b', label: 'NEEM ALLES MET GEWELD', stat: 'muscle', difficulty: 55,
            successText: 'Je duwt Moeder Kraai opzij en claimt de sleutels. "Dit is nu van mij." De bewoners beven. Angst regeert. De tunnels zijn van jou — maar zonder loyaliteit.',
            failText: 'De tunnelbewoners verenigen zich tegen je. Een bittere strijd in het donker. Je vlucht met lege handen.',
            effects: { money: 10000, heat: 15, rep: 30, dirtyMoney: 20000, crewDamage: 20, karma: -20 },
          },
          {
            id: 'tun_4c', label: 'WEIGER — MAAR BEHOUD TOEGANG', stat: 'brains', difficulty: 35,
            successText: '"Ik wil geen koning zijn van de duisternis. Maar ik wil wel handelen." Moeder Kraai knikt respectvol. "Een wijze keuze. De markt staat altijd voor je open." Permanente toegang verkregen.',
            failText: 'Moeder Kraai is teleurgesteld. "Dan zoek ik iemand anders." Je verliest je voorkeursbehandeling.',
            effects: { money: 5000, heat: -10, rep: 40, dirtyMoney: 5000, crewDamage: 0, karma: 10 },
          },
        ],
      },
    ],
  },

  // ===== ARC 7: BLOEDGELD =====
  {
    id: 'bloedgeld',
    name: 'Bloedgeld',
    description: 'Een erfenis van miljoenen duikt op — maar het geld is besmet met bloed en schuld. Elke euro heeft een prijs.',
    icon: '💀',
    triggerConditions: { minDay: 7 },
    completionReward: { money: 45000, rep: 180, dirtyMoney: 30000, heat: 5, weaponReward: { minRarity: 'rare' } },
    steps: [
      {
        id: 'blg_1',
        text: 'Een advocaat in een duur pak staat op je stoep. "Mijn client is overleden. U bent de enige erfgenaam van €2.000.000. Er zijn... voorwaarden." Hij overhandigt een testament. De naam van de overledene: Antonio Ferrara — een beruchte oorlogsmisdadiger uit de jaren \'90.',
        phonePreview: '"Een erfenis van €2 miljoen. Van een oorlogsmisdadiger. Er zijn voorwaarden..." — Advocaat',
        phoneFrom: 'anonymous',
        choices: [
          {
            id: 'blg_1a', label: 'ACCEPTEER DE ERFENIS', stat: 'charm', difficulty: 20,
            successText: 'Je tekent de papieren. De advocaat glimlacht — te breed. "De eerste voorwaarde: u moet het familiegraf bezoeken. In Kroatië." Een ticket en een paspoort liggen klaar.',
            failText: 'De advocaat trekt de papieren terug. "Twijfel is een teken van zwakte. Mijn client koos u niet voor twijfel." Je hebt een kans gemist — of een kogel ontweken.',
            effects: { money: 50000, heat: 5, rep: 10, dirtyMoney: 0, crewDamage: 0, karma: -5 },
            nextStepOverride: 1,
          },
          {
            id: 'blg_1b', label: 'WEIGER — DIT GELD IS BESMET', stat: 'brains', difficulty: 15,
            successText: '"Ik wil niets te maken hebben met oorlogsgeld." De advocaat knikt langzaam. "Respectabel." Hij vertrekt. Maar drie dagen later vind je €50.000 cash in je brievenbus. Een briefje: "Weigering niet geaccepteerd."',
            failText: 'De advocaat haalt zijn schouders op en vertrekt. Maar de gedachte aan twee miljoen laat je niet los.',
            effects: { money: 50000, heat: 0, rep: 20, dirtyMoney: 0, crewDamage: 0, karma: 15 },
            nextStepOverride: 2,
          },
        ],
      },
      {
        id: 'blg_2a',
        text: 'Het graf van Ferrara. Een klein dorp in Kroatië. De grafsteen is onopvallend, maar eronder — een verborgen compartiment. Foto\'s van slachtoffers, een lijst met namen, en een sleutel voor een Zwitserse bankkluis. Het bloedgeld is echt. En er is meer. Veel meer.',
        phonePreview: '"Het graf bevat geheimen. Een Zwitserse bankkluis. Dit gaat verder dan je dacht." — Eigen notities',
        phoneFrom: 'anonymous',
        choices: [
          {
            id: 'blg_2a_1', label: 'GA NAAR DE ZWITSERSE KLUIS', stat: 'brains', difficulty: 40,
            successText: 'In Zürich open je de kluis. €800.000 in goudcertificaten. Maar ook: een dagboek van Ferrara. Zijn berouw. Zijn verzoek: "Gebruik het geld om goed te doen." Kun je dat?',
            failText: 'De bank weigert toegang. De sleutel is verlopen. Je hebt de reis voor niets gemaakt.',
            effects: { money: 200000, heat: 10, rep: 20, dirtyMoney: 0, crewDamage: 0, karma: -10 },
          },
          {
            id: 'blg_2a_2', label: 'VERKOOP DE INFORMATIE', stat: 'charm', difficulty: 35,
            successText: 'Een journalist betaalt €100.000 voor de foto\'s en namen. Het verhaal gaat de wereld over. Ferrara\'s slachtoffers krijgen gerechtigheid. Maar jij profiteert van hun leed.',
            failText: 'De journalist wil meer bewijs. "Dit is niet genoeg voor publicatie." Je hebt niets.',
            effects: { money: 100000, heat: 5, rep: -10, dirtyMoney: 0, crewDamage: 0, karma: -15 },
          },
        ],
      },
      {
        id: 'blg_2b',
        text: 'Het geld in je brievenbus was geen gift — het was een test. Ferrara\'s "familie" (zijn criminele netwerk) beschouwt jou nu als erfgenaam. Ze verschijnen: drie mannen die "bescherming" bieden. En verwachtingen hebben. "Antonio\'s erfgenaam werkt voor de familie. Altijd."',
        phonePreview: '"Ferrara\'s organisatie ziet je als erfgenaam. Ze komen vandaag. Ze verwachten loyaliteit." — Informant',
        phoneFrom: 'anonymous',
        choices: [
          {
            id: 'blg_2b_1', label: 'ACCEPTEER DE ROL', stat: 'charm', difficulty: 30,
            successText: 'Je speelt mee — voorlopig. De "familie" opent deuren die normaal gesloten zijn. Internationale smokkelroutes, politieke contacten, ongelimiteerd krediet. Maar de prijs? Je ziel.',
            failText: 'Ze vertrouwen je niet. "Je bent niet als Antonio." Ze vertrekken, maar laten bewaking achter. Je bent een gevangene in je eigen huis.',
            effects: { money: 100000, heat: 15, rep: 30, dirtyMoney: 50000, crewDamage: 0, karma: -20 },
          },
          {
            id: 'blg_2b_2', label: 'VECHT JE VRIJ', stat: 'muscle', difficulty: 45,
            successText: 'Een explosief gevecht in je eigen woonkamer. De drie mannen onderschatten je. "Zeg tegen jullie baas: ik ben niemands erfgenaam." Je gooit ze de straat op.',
            failText: 'Ze zijn professionals. Je overleeft, maar je huis is verwoest en je bent gewond.',
            effects: { money: -10000, heat: 20, rep: 25, dirtyMoney: 0, crewDamage: 15, karma: 5 },
          },
        ],
      },
    ],
  },

  // ===== ARC 8: DE LAATSTE GETUIGE =====
  {
    id: 'getuige',
    name: 'De Laatste Getuige',
    description: 'Iemand weet te veel over jou. Vind hem voor de politie dat doet. De klok tikt.',
    icon: '👁️',
    triggerConditions: { minDay: 12 },
    completionReward: { money: 20000, rep: 200, dirtyMoney: 5000, heat: -35, gearReward: { type: 'armor', minRarity: 'rare' } },
    steps: [
      {
        id: 'get_1',
        text: 'Je advocaat belt in paniek: "Er is een getuige. Iemand die alles heeft gezien — de deals, de gevechten, alles. De politie weet van hem. Ze zoeken hem. Als zij hem vinden voor jij dat doet..." Hij hoeft zijn zin niet af te maken.',
        phonePreview: '"URGENT: Een getuige. De politie zoekt hem. Vind hem eerst." — Advocaat',
        phoneFrom: 'anonymous',
        choices: [
          {
            id: 'get_1a', label: 'ZET AL JE CONTACTEN IN', stat: 'charm', difficulty: 30,
            successText: 'Elk oor op straat luistert. Binnen 12 uur heb je een naam: Piet de Boer, een voormalige buurtwacht. Hij is ondergedoken in Lowrise.',
            failText: 'Je contacten leveren niets op. De getuige is goed verborgen. De politie heeft een voorsprong.',
            effects: { money: -2000, heat: 5, rep: 10, dirtyMoney: 0, crewDamage: 0 },
          },
          {
            id: 'get_1b', label: 'HACK POLITIEDATABASES', stat: 'brains', difficulty: 40,
            successText: 'Je hacker vindt het dossier: Piet de Boer, getuige #447. Zijn verklaring is vernietigend. Maar je weet nu ook waar hij beschermd wordt.',
            failText: 'De firewall is te sterk. Je hacker wordt bijna getraceerd. Te riskant.',
            effects: { money: -3000, heat: 3, rep: 5, dirtyMoney: 0, crewDamage: 0 },
          },
          {
            id: 'get_1c', label: 'BESTOOK DE BUURT', stat: 'muscle', difficulty: 35,
            successText: 'Je crew doorzoekt systematisch elke schuilplaats. In een verlaten wasserette vind je sporen: lege blikken, dekens, een telefoonoplader. Hij was hier. Recent.',
            failText: 'Te veel lawaai. De politie wordt gewaarschuwd dat iemand ook zoekt.',
            effects: { money: 0, heat: 10, rep: 15, dirtyMoney: 0, crewDamage: 5 },
          },
        ],
      },
      {
        id: 'get_2',
        text: 'Je hebt De Boer gelokaliseerd: een goedkoop hotel in het zuiden van Crown Heights. Maar de politie is er ook achter — je ziet een onopvallende auto bij de ingang. Je hebt misschien een uur voorsprong.',
        phonePreview: '"De Boer zit in Hotel Rembrand, Crown Heights. Politie is er ook. Je hebt een uur." — Crew',
        phoneFrom: 'anonymous',
        choices: [
          {
            id: 'get_2a', label: 'GA VIA HET DAK', stat: 'muscle', difficulty: 40,
            successText: 'Via het dak en de brandtrap bereik je zijn kamer. De Boer — een bange, magere man — kijkt je aan met wijde ogen. "Alsjeblieft, doe me niets."',
            failText: 'Het dak is afgesloten. Je verliest kostbare tijd bij het forceren.',
            effects: { money: 0, heat: 5, rep: 10, dirtyMoney: 0, crewDamage: 5 },
          },
          {
            id: 'get_2b', label: 'CREËER EEN AFLEIDING', stat: 'brains', difficulty: 35,
            successText: 'Een "gaslek" in het hotel. Evacuatie. In de chaos grijp je De Boer uit de menigte. Niemand ziet het.',
            failText: 'De politie trapt er niet in en verscherpt de bewaking.',
            effects: { money: -1000, heat: 3, rep: 10, dirtyMoney: 0, crewDamage: 0 },
          },
          {
            id: 'get_2c', label: 'KOOP DE RECEPTIONIST OM', stat: 'charm', difficulty: 30,
            successText: 'Voor €5.000 geeft de receptionist je een sleutelkaart en de kamernummer. "Ik heb niets gezien." Perfect.',
            failText: 'De receptionist is al omgekocht door de politie. Hij belt ze zodra je weg bent.',
            effects: { money: -5000, heat: 0, rep: 5, dirtyMoney: 0, crewDamage: 0 },
          },
        ],
      },
      {
        id: 'get_3',
        text: 'Je staat oog in oog met Piet de Boer. Trillend, zwetend, bang. "Ik wil dit niet. Ze dwongen me om te getuigen. Mijn dochter is ziek — ze beloofden haar behandeling te betalen." Zijn ogen zijn rood van het huilen.',
        phonePreview: '"Je hebt De Boer. Wat nu? De politie komt eraan." — Crew',
        phoneFrom: 'anonymous',
        choices: [
          {
            id: 'get_3a', label: 'BETAAL VOOR ZIJN DOCHTER', stat: 'charm', difficulty: 35,
            requiredKarma: 'eerbaar',
            successText: '"Ik betaal de behandeling. Alles. En jij trekt je getuigenis in." De Boer barst in tranen uit. "Dank je... dank je..." Hij belt de officier: "Ik heb me vergist. Ik heb niets gezien." De zaak stort in.',
            failText: 'De Boer gelooft je niet. "Iedereen belooft dingen." Hij weigert.',
            effects: { money: -30000, heat: -25, rep: 30, dirtyMoney: 0, crewDamage: 0, karma: 25 },
          },
          {
            id: 'get_3b', label: 'DREIG HEM', stat: 'muscle', difficulty: 30,
            successText: '"Als je getuigt, kom ik terug. En dan niet voor een praatje." De Boer begrijpt het. De volgende dag trekt hij zijn verklaring in. "Ik heb me vergist."',
            failText: 'De Boer is te bang voor de politie om ook nog bang voor jou te zijn. Hij getuigt toch.',
            effects: { money: 0, heat: 5, rep: 15, dirtyMoney: 0, crewDamage: 0, karma: -15 },
          },
          {
            id: 'get_3c', label: 'LAAT HEM VERDWIJNEN', stat: 'brains', difficulty: 40,
            successText: 'Nieuwe identiteit, ticket naar Zuid-Amerika, €10.000 cash. "Je heet nu Carlos. Vergeet Noxhaven." De Boer pakt zijn tas en verdwijnt. Geen getuige, geen zaak.',
            failText: 'De politie vindt hem op het vliegveld. Te laat.',
            effects: { money: -10000, heat: -15, rep: 20, dirtyMoney: 0, crewDamage: 0, karma: 0 },
          },
          {
            id: 'get_3d', label: 'ELIMINEER HET PROBLEEM', stat: 'muscle', difficulty: 25,
            requiredKarma: 'meedogenloos',
            successText: 'De volgende dag meldt het nieuws: "Getuige in strafzaak vermist." Geen lichaam, geen bewijs, geen zaak. Efficiënt. Koud. Maar effectief.',
            failText: 'Het lichaam wordt gevonden. Nu heb je een moordonderzoek aan je broek.',
            effects: { money: 0, heat: 15, rep: 10, dirtyMoney: 0, crewDamage: 0, karma: -25 },
          },
        ],
      },
      {
        id: 'get_4',
        text: 'De getuige is afgehandeld, maar de officier van justitie geeft niet op. "We vinden wel een andere getuige." Je advocaat adviseert: "Eén definitieve zet. Maak de zaak onmogelijk — voor altijd."',
        phonePreview: '"De OvJ geeft niet op. We moeten de zaak permanent torpederen." — Advocaat',
        phoneFrom: 'anonymous',
        choices: [
          {
            id: 'get_4a', label: 'KOOP DE OVJ OM', stat: 'charm', difficulty: 45,
            successText: 'Iedereen heeft een prijs. Die van de OvJ is €50.000 en een villa in Spanje. De zaak wordt "wegens gebrek aan bewijs" geseponeerd. Permanent.',
            failText: 'Deze OvJ is onkreukbaar. "Jouw soort denkt dat alles te koop is." De zaak gaat door.',
            effects: { money: -50000, heat: -30, rep: 30, dirtyMoney: 0, crewDamage: 0, karma: -10 },
          },
          {
            id: 'get_4b', label: 'VERNIETIG HET BEWIJS', stat: 'brains', difficulty: 50,
            successText: 'Een ingenieuze inbraak bij het OM. Alle fysieke bewijsstukken verdwijnen. Digitale kopieën gewist. De OvJ staat met lege handen. "Dit is... onmogelijk." Maar het is gebeurd.',
            failText: 'De beveiliging van het OM is top. Je team wordt bijna gepakt.',
            effects: { money: -10000, heat: 10, rep: 40, dirtyMoney: 0, crewDamage: 10, karma: -5 },
          },
          {
            id: 'get_4c', label: 'GEEF JEZELF AAN — MET EEN PLAN', stat: 'brains', difficulty: 55,
            requiredKarma: 'eerbaar',
            successText: 'Je advocaat presenteert een waterdicht alibi, getuigenverklaringen, en procedurele fouten in het onderzoek. De rechter verwerpt de zaak. Je loopt vrij de rechtszaal uit — onschuldig verklaard.',
            failText: 'Het plan heeft gaten. De rechter gelooft het niet helemaal. Vrijspraak wegens gebrek aan bewijs, maar je staat op de radar.',
            effects: { money: -20000, heat: -35, rep: 50, dirtyMoney: 0, crewDamage: 0, karma: 20 },
          },
        ],
      },
    ],
  },
];

// Merge district-specific story arcs
import { DISTRICT_STORY_ARCS } from './districtStories';
STORY_ARCS.push(...DISTRICT_STORY_ARCS);

// Merge backstory-exclusive arcs
import { BACKSTORY_ARCS } from './backstoryArcs';
STORY_ARCS.push(...BACKSTORY_ARCS);

// ========== ARC LOGIC ==========

/** Check if any new arcs should trigger */
export function checkArcTriggers(state: GameState): void {
  const activeArcs = state.activeStoryArcs || [];
  const completedArcs = state.completedArcs || [];
  
  for (const arc of STORY_ARCS) {
    // Skip if already active or completed
    if (activeArcs.some(a => a.arcId === arc.id)) continue;
    if (completedArcs.includes(arc.id)) continue;
    
    // Check max active arcs (default 1)
    const maxActive = arc.triggerConditions.maxActiveArcs ?? 1;
    if (activeArcs.filter(a => !a.finished).length >= maxActive) continue;
    
    // Check conditions
    const c = arc.triggerConditions;
    if (state.day < c.minDay) continue;
    if (c.minRep && state.rep < c.minRep) continue;
    if (c.minDistricts && state.ownedDistricts.length < c.minDistricts) continue;
    if (c.requiredDistrict && !state.ownedDistricts.includes(c.requiredDistrict)) continue;
    if (c.requiredBackstory && state.backstory !== c.requiredBackstory) continue;
    
    // Random chance to trigger (30% per eligible day)
    if (Math.random() > 0.3) continue;
    
    // Start the arc!
    const newArc: ActiveStoryArc = {
      arcId: arc.id,
      currentStep: 0,
      startedDay: state.day,
      lastStepDay: state.day,
      cooldownDays: 2 + Math.floor(Math.random() * 2), // 2-3 days between steps
      finished: false,
      success: false,
      failedSteps: 0,
    };
    
    state.activeStoryArcs.push(newArc);
    
    // Send introductory phone message
    const step = arc.steps[0];
    if (step.phonePreview) {
      addPhoneMessage(state, step.phoneFrom || 'anonymous', step.phonePreview, 'opportunity');
    }
    
    // Only trigger one arc per day
    break;
  }
}

/** Check if any active arc is ready for its next step */
export function checkArcProgression(state: GameState): void {
  const activeArcs = state.activeStoryArcs || [];
  
  for (const arc of activeArcs) {
    if (arc.finished) continue;
    
    const template = STORY_ARCS.find(a => a.id === arc.arcId);
    if (!template) continue;
    
    // Check cooldown
    const daysSinceLastStep = state.day - arc.lastStepDay;
    if (daysSinceLastStep < arc.cooldownDays) continue;
    
    // Trigger the current step as a popup event
    const step = template.steps[arc.currentStep];
    if (!step) continue;
    
    // Set pending arc event (will show popup)
    state.pendingArcEvent = {
      arcId: arc.arcId,
      stepIndex: arc.currentStep,
    };
    
    // Only one arc event per day
    break;
  }
}

/** Resolve a player's choice in an arc step */
export function resolveArcChoice(
  state: GameState,
  arcId: string,
  choiceId: string
): { success: boolean; text: string; effects: StoryArcChoice['effects']; broadcastNews?: { choiceId: string; arcId: string; district: string; success: boolean } } {
  const activeArc = state.activeStoryArcs.find(a => a.arcId === arcId);
  if (!activeArc) return { success: false, text: 'Arc niet gevonden.', effects: { money: 0, heat: 0, rep: 0, dirtyMoney: 0, crewDamage: 0 } };
  
  const template = STORY_ARCS.find(a => a.id === arcId);
  if (!template) return { success: false, text: 'Arc template niet gevonden.', effects: { money: 0, heat: 0, rep: 0, dirtyMoney: 0, crewDamage: 0 } };
  
  const step = template.steps[activeArc.currentStep];
  if (!step) return { success: false, text: 'Step niet gevonden.', effects: { money: 0, heat: 0, rep: 0, dirtyMoney: 0, crewDamage: 0 } };
  
  const choice = step.choices.find(c => c.id === choiceId);
  if (!choice) return { success: false, text: 'Keuze niet gevonden.', effects: { money: 0, heat: 0, rep: 0, dirtyMoney: 0, crewDamage: 0 } };
  
  // Stat check
  const statVal = getPlayerStat(state, choice.stat);
  const chance = Math.min(95, 100 - choice.difficulty + statVal * 5);
  const success = Math.random() * 100 < chance;
  
  const text = success ? choice.successText : choice.failText;
  
  // Mark step as done
  activeArc.lastStepDay = state.day;
  
  if (!success) {
    activeArc.failedSteps++;
  }
  
  // Advance to next step (or override)
  if (success && choice.nextStepOverride !== undefined) {
    activeArc.currentStep = choice.nextStepOverride;
  } else {
    activeArc.currentStep++;
  }
  
  // MMO: Generate broadcast news for important arc choices
  let broadcastNews: { choiceId: string; arcId: string; district: string; success: boolean } | undefined;
  // Only broadcast on step 3+ (climactic moments)
  if (activeArc.currentStep >= 3 || activeArc.currentStep >= template.steps.length) {
    broadcastNews = { choiceId: choice.id, arcId, district: state.loc, success };
  }
  
  // Check if arc is complete
  if (activeArc.currentStep >= template.steps.length) {
    activeArc.finished = true;
    activeArc.success = activeArc.failedSteps < template.steps.length / 2;
    
    // Apply completion reward if successful enough
    if (activeArc.success) {
      const reward = template.completionReward;
      state.money += reward.money;
      state.rep += reward.rep;
      state.dirtyMoney += reward.dirtyMoney;
      state.heat = Math.max(0, state.heat + reward.heat);
      if (reward.money > 0) state.stats.totalEarned += reward.money;
      if (reward.dirtyMoney > 0) state.stats.totalEarned += reward.dirtyMoney;
      
      // Generate gear reward if specified
      if (reward.gearReward) {
        const gearDrop = generateGear(state.player.level, reward.gearReward.type, reward.gearReward.minRarity as any);
        const gInv = reward.gearReward.type === 'armor' ? 'armorInventory' : 'gadgetInventory';
        if (!state[gInv]) (state as any)[gInv] = [];
        if ((state as any)[gInv].length < 20) (state as any)[gInv].push(gearDrop);
      }
      // Generate weapon reward if specified
      if (reward.weaponReward) {
        const wpnDrop = generateWeapon(state.player.level, reward.weaponReward.minRarity as any);
        if (!state.weaponInventory) state.weaponInventory = [];
        if (state.weaponInventory.length < 20) state.weaponInventory.push(wpnDrop);
      }
      
      addPhoneMessage(state, 'anonymous', `Verhaallijn "${template.name}" voltooid! ${template.icon} Beloning: €${reward.money.toLocaleString()}${reward.gearReward ? ' + Gear!' : ''}${reward.weaponReward ? ' + Wapen!' : ''}`, 'opportunity');
    } else {
      addPhoneMessage(state, 'anonymous', `Verhaallijn "${template.name}" afgerond. Te veel mislukkingen — beperkte beloning.`, 'info');
      // Half reward on partial failure
      state.money += Math.floor(template.completionReward.money * 0.3);
      state.rep += Math.floor(template.completionReward.rep * 0.3);
    }
    
    // Add to completed
    state.completedArcs.push(arcId);
  } else {
    // Send phone message for next step
    const nextStep = template.steps[activeArc.currentStep];
    if (nextStep?.phonePreview) {
      // Delayed message — will appear next cycle
      setTimeout(() => {
        addPhoneMessage(state, nextStep.phoneFrom || 'anonymous', nextStep.phonePreview!, 'opportunity');
      }, 0);
    }
  }
  
  return { success, text, broadcastNews, effects: success ? choice.effects : { 
    money: Math.min(0, choice.effects.money), 
    heat: Math.max(0, choice.effects.heat + 3), 
    rep: Math.min(0, choice.effects.rep),
    dirtyMoney: 0,
    crewDamage: Math.max(choice.effects.crewDamage, 5),
  }};
}
