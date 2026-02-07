/**
 * Story Arcs System — Multi-dag verhaallijnen die via de telefoon en speciale events ontvouwen.
 * Drie bogen: De Informant, Het Erfenis-mysterie, De Rivaal.
 */

import { GameState, DistrictId, StatId } from './types';
import { getPlayerStat } from './engine';
import { addPhoneMessage } from './newFeatures';

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
  };
  /** Optional: which step to jump to on success (for branching) */
  nextStepOverride?: number;
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
    maxActiveArcs?: number;
  };
  /** Final reward when completing the arc */
  completionReward: {
    money: number;
    rep: number;
    dirtyMoney: number;
    heat: number;
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
    completionReward: { money: 25000, rep: 200, dirtyMoney: 0, heat: -20 },
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
            effects: { money: 0, heat: 5, rep: -10, dirtyMoney: 0, crewDamage: 0 },
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
    completionReward: { money: 40000, rep: 150, dirtyMoney: 20000, heat: 0 },
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
    completionReward: { money: 20000, rep: 300, dirtyMoney: 10000, heat: -10 },
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
            effects: { money: 5000, heat: -10, rep: 80, dirtyMoney: 0, crewDamage: 0 },
          },
        ],
      },
    ],
  },
];

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
): { success: boolean; text: string; effects: StoryArcChoice['effects'] } {
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
      
      addPhoneMessage(state, 'anonymous', `Verhaallijn "${template.name}" voltooid! ${template.icon} Beloning: €${reward.money.toLocaleString()}`, 'opportunity');
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
  
  return { success, text, effects: success ? choice.effects : { 
    money: Math.min(0, choice.effects.money), 
    heat: Math.max(0, choice.effects.heat + 3), 
    rep: Math.min(0, choice.effects.rep),
    dirtyMoney: 0,
    crewDamage: Math.max(choice.effects.crewDamage, 5),
  }};
}
