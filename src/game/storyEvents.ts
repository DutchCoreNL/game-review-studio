import { DistrictId, StatId, GameState } from './types';
import { getPlayerStat } from './engine';

// ========== STREET EVENT TYPES ==========

export interface StreetEventChoice {
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
    karma?: number;
    factionRel?: { familyId: string; change: number };
    npcRel?: { npcId: string; change: number };
  };
  minigame?: 'arm_wrestle' | 'dice';
  /** If set, a follow-up event ID is queued for the next day */
  followUpEventId?: string;
  /** News broadcast text (shown to all players in district) — only on success */
  newsBroadcast?: string;
}

export interface StreetEvent {
  id: string;
  text: string;
  districtVariants?: Partial<Record<DistrictId, string>>;
  choices: StreetEventChoice[];
  minDay?: number;
  minRep?: number;
  districts?: DistrictId[];
  /** Only show if player owns this district */
  reqOwnsDistrict?: boolean;
  /** Only show if player does NOT own this district */
  reqNotOwnsDistrict?: boolean;
  /** Minimum karma to trigger (positive = good, negative = evil) */
  minKarma?: number;
  maxKarma?: number;
  /** Only during an active market event */
  reqMarketEvent?: boolean;
  /** Only when a specific faction relation is below/above threshold */
  reqFactionRel?: { familyId: string; min?: number; max?: number };
  /** Only when the player has a specific NPC relation tier */
  reqNpcRel?: { npcId: string; minValue: number };
  /** This is a follow-up event (not randomly triggered) */
  isFollowUp?: boolean;
  /** Tags for categorization */
  tags?: ('turf' | 'faction' | 'market' | 'npc' | 'chain' | 'coop' | 'karma')[];
  /** Only trigger during specific world phases (dawn/day/dusk/night) */
  reqPhase?: ('dawn' | 'day' | 'dusk' | 'night')[];
  /** Server-driven: event originated from a server district event */
  serverEventId?: string;
}

// ========== EVENT DATABASE ==========

export const STREET_EVENTS: StreetEvent[] = [
  // ===== ORIGINAL EVENTS (preserved) =====
  {
    id: 'wounded_man',
    text: 'Een verwonde man strompelt naar je toe. Bloed druppelt op het plaveisel. "Help me... ik heb een koffer vol cash. Breng me naar Port Nero en hij is van jou."',
    districtVariants: {
      crown: 'Een man in een duur pak strompelt uit een steeg in Crown Heights. "Ze willen me dood... breng me naar de haven."',
      low: 'Een bloedende jongen grijpt je arm in Lowrise. "Alsjeblieft... ik heb geld. Help me."',
    },
    tags: ['karma'],
    choices: [
      {
        id: 'wm_help', label: 'HELP HEM', stat: 'charm', difficulty: 30,
        successText: 'Je brengt hem veilig weg. Hij overhandigt de koffer — €2.000 in biljetten. "Je bent een goed mens," fluistert hij.',
        failText: 'Halverwege trekt hij een mes. Het was een val. Je ontsnapt maar draagt de blauwe plekken.',
        effects: { money: 2000, heat: 5, rep: 15, dirtyMoney: 0, crewDamage: 0, karma: 5 },
      },
      {
        id: 'wm_rob', label: 'PAK DE KOFFER', stat: 'muscle', difficulty: 25,
        successText: 'Je rukt de koffer uit zijn handen en rent. €3.000 — geen vragen gesteld.',
        failText: 'Hij is sterker dan hij lijkt. Je eindigt zonder koffer én met een snee in je arm.',
        effects: { money: 0, heat: 10, rep: -10, dirtyMoney: 3000, crewDamage: 0, karma: -8 },
      },
      {
        id: 'wm_ignore', label: 'LOOP DOOR', stat: 'brains', difficulty: 10,
        successText: 'Je loopt door zonder om te kijken. Niet jouw probleem. Slim.',
        failText: 'Je loopt door, maar het beeld blijft hangen.',
        effects: { money: 0, heat: 0, rep: 0, dirtyMoney: 0, crewDamage: 0 },
      },
    ],
  },
  {
    id: 'tipster_woman',
    text: 'Een mysterieuze vrouw in een rode jurk fluistert: "Er ligt een lading in Dok 7. Onbewaakt. Vanavond om middernacht. Interesse?"',
    districtVariants: {
      neon: 'In de VIP-lounge buigt een vrouw zich naar je toe. "Ik heb een tip... maar het kost je iets."',
      port: 'Bij de haven trekt een havenarbeidster je apart. "Luister... container 47-B. Vannacht. Geen bewaking."',
    },
    choices: [
      {
        id: 'tw_trust', label: 'VERTROUW HAAR', stat: 'charm', difficulty: 35,
        successText: 'De tip klopt! De lading is miljoenen waard op de zwarte markt. Je pikt een deel.',
        failText: 'Het was een val van de politie. Je ontsnapt ternauwernood maar de heat stijgt.',
        effects: { money: 0, heat: 8, rep: 10, dirtyMoney: 4000, crewDamage: 0 },
      },
      {
        id: 'tw_investigate', label: 'ONDERZOEK EERST', stat: 'brains', difficulty: 40,
        successText: 'Je checkt het uit — de tip is echt. Je plant de operatie zorgvuldig en scoort groot.',
        failText: 'Je onderzoek kost te veel tijd. Iemand anders heeft de lading al opgehaald.',
        effects: { money: 0, heat: 3, rep: 5, dirtyMoney: 5000, crewDamage: 0 },
      },
      {
        id: 'tw_decline', label: 'WEIGER', stat: 'muscle', difficulty: 10,
        successText: '"Niet geïnteresseerd." Je loopt weg. Soms is de beste deal er geen.',
        failText: 'Je weigert, maar vraagt je af of je een kans hebt gemist.',
        effects: { money: 0, heat: 0, rep: 0, dirtyMoney: 0, crewDamage: 0 },
      },
    ],
  },
  {
    id: 'pickpocket_kid',
    text: 'Een straatkind rent langs je en grijpt naar je zak. Je voelt een ruk aan je portemonnee!',
    districtVariants: {
      low: 'In de donkere steegjes van Lowrise duikt een kind onder je arm door en grijpt je cash.',
      neon: 'Bij de ingang van het casino probeert een kind je telefoon te stelen.',
    },
    choices: [
      {
        id: 'pk_catch', label: 'GRIJP HEM', stat: 'muscle', difficulty: 20,
        successText: 'Je grijpt het kind bij zijn kraag. "Geef terug." Hij overhandigt alles — plus wat extra dat niet van jou is.',
        failText: 'Hij is te snel. Je geld is weg.',
        effects: { money: 500, heat: 0, rep: 5, dirtyMoney: 0, crewDamage: 0 },
      },
      {
        id: 'pk_outsmart', label: 'SLIM REAGEREN', stat: 'brains', difficulty: 25,
        successText: 'Je had je echte portemonnee al verstopt. Het kind rent weg met een lege beurs. Slim.',
        failText: 'Je was niet snel genoeg. De echte portemonnee is weg.',
        effects: { money: 0, heat: 0, rep: 0, dirtyMoney: 0, crewDamage: 0 },
      },
      {
        id: 'pk_recruit', label: 'BIED HEM EEN BAAN', stat: 'charm', difficulty: 35,
        successText: '"Je hebt talent, jochie." Het kind wordt een informant. Hij kent elke steeg in de stad.',
        failText: 'Het kind spuugt op de grond en rent weg. "Ik werk voor niemand."',
        effects: { money: -200, heat: 0, rep: 10, dirtyMoney: 0, crewDamage: 0, karma: 3 },
      },
    ],
  },
  {
    id: 'corrupt_cop',
    text: 'Een agent in burger houdt je aan. "Ik weet wie je bent. We kunnen dit op twee manieren oplossen..."',
    minDay: 3,
    choices: [
      {
        id: 'cc_bribe', label: 'OMKOPEN', stat: 'charm', difficulty: 30,
        successText: 'Een dikke envelop wisselt van eigenaar. "We hebben elkaar nooit gezien," grijnst hij.',
        failText: 'Hij wil meer. Veel meer. Je betaalt door de neus.',
        effects: { money: -3000, heat: -15, rep: 0, dirtyMoney: 0, crewDamage: 0 },
      },
      {
        id: 'cc_threaten', label: 'DREIG', stat: 'muscle', difficulty: 40,
        successText: '"Ik weet waar je vrouw werkt." De kleur trekt uit zijn gezicht. Hij loopt weg.',
        failText: 'Hij lacht. "Denk je dat ik bang ben?" Hij belt versterking.',
        effects: { money: 0, heat: 15, rep: 20, dirtyMoney: 0, crewDamage: 5, karma: -5 },
      },
      {
        id: 'cc_info', label: 'VRAAG INFO', stat: 'brains', difficulty: 35,
        successText: '"Deal. Ik betaal, maar jij vertelt me alles over de razzia van volgende week." Waardevolle intel.',
        failText: 'Hij geeft je nep-informatie. Je realiseert het pas als het te laat is.',
        effects: { money: -1500, heat: -10, rep: 5, dirtyMoney: 0, crewDamage: 0 },
      },
    ],
  },
  {
    id: 'rival_encounter',
    text: 'Een groep van een rivaliserende gang blokkeert de straat. Hun leider stapt naar voren. "Dit is óns territorium."',
    minDay: 5,
    choices: [
      {
        id: 're_fight', label: 'VECHT', stat: 'muscle', difficulty: 45,
        successText: 'Je slaat de eerste neer. De rest vlucht. Dit territorium is nu betwist.',
        failText: 'Ze zijn met te veel. Je trekt je terug met blauwe plekken.',
        effects: { money: 0, heat: 12, rep: 25, dirtyMoney: 0, crewDamage: 15 },
        newsBroadcast: 'Een straatgevecht brak uit — een onbekende krijger versloeg een hele bende!',
      },
      {
        id: 're_talk', label: 'ONDERHANDEL', stat: 'charm', difficulty: 35,
        successText: '"Laten we praten als zakenmannen." Na een gesprek heb je een niet-aanvalspact.',
        failText: 'Ze luisteren niet. "Praten is voorbij." Je moet rennen.',
        effects: { money: 0, heat: 0, rep: 10, dirtyMoney: 0, crewDamage: 0 },
      },
      {
        id: 're_pay', label: 'BETAAL TOLGELD', stat: 'brains', difficulty: 15,
        successText: 'Je betaalt ze af. Niet ideaal, maar je houdt je gezicht.',
        failText: 'Ze willen meer. Telkens meer.',
        effects: { money: -1000, heat: 0, rep: -5, dirtyMoney: 0, crewDamage: 0 },
      },
    ],
  },
  {
    id: 'abandoned_car',
    text: 'Je vindt een verlaten auto met draaiende motor. De deur staat open. Op de achterbank ligt een sportzak.',
    choices: [
      {
        id: 'ac_take', label: 'PAK DE TAS', stat: 'muscle', difficulty: 20,
        successText: 'Cash. Veel cash. Iemands verlies is jouw winst.',
        failText: 'De tas is leeg — een lokval. Een camera flitst.',
        effects: { money: 0, heat: 5, rep: 0, dirtyMoney: 3500, crewDamage: 0 },
      },
      {
        id: 'ac_check', label: 'CONTROLEER EERST', stat: 'brains', difficulty: 30,
        successText: 'Je scant de omgeving. Geen camera\'s, geen politie. Veilig. Je neemt de tas mee.',
        failText: 'Terwijl je controleert, komt de eigenaar terug. Je rent.',
        effects: { money: 0, heat: 2, rep: 0, dirtyMoney: 4500, crewDamage: 0 },
      },
    ],
  },
  {
    id: 'informant_message',
    text: 'Je telefoon trilt. Een onbekend nummer: "Ik heb informatie over een politie-razzia morgenavond. Ontmoet me bij de brug. Alleen."',
    minDay: 7,
    choices: [
      {
        id: 'im_go', label: 'GA ERHEEN', stat: 'charm', difficulty: 35,
        successText: 'De informant is echt. Je krijgt waardevolle intel over de politie-operatie.',
        failText: 'Het is een hinderlaag! Je ontsnapt maar niet ongedeerd.',
        effects: { money: 0, heat: -20, rep: 10, dirtyMoney: 0, crewDamage: 10 },
      },
      {
        id: 'im_trap', label: 'STUUR IEMAND ANDERS', stat: 'brains', difficulty: 30,
        successText: 'Je stuurt een verkenner. De info is echt en je bent veilig gebleven. Dubbel win.',
        failText: 'Je verkenner wordt herkend. De informant verdwijnt voorgoed.',
        effects: { money: 0, heat: -10, rep: 5, dirtyMoney: 0, crewDamage: 0 },
      },
      {
        id: 'im_ignore', label: 'NEGEER', stat: 'muscle', difficulty: 10,
        successText: 'Je vertrouwt niemand. Dat houdt je in leven.',
        failText: 'Je negeerde het, maar de razzia treft je onvoorbereid.',
        effects: { money: 0, heat: 5, rep: 0, dirtyMoney: 0, crewDamage: 0 },
      },
    ],
  },
  {
    id: 'smuggler_deal',
    text: 'Een smokkelaar biedt je een lading aan voor de helft van de prijs. "Snel handelen. De boot vertrekt over een uur."',
    districts: ['port'],
    choices: [
      {
        id: 'sd_buy', label: 'KOOP DE LADING', stat: 'charm', difficulty: 25,
        successText: 'De deal is gedaan. Premium goederen voor een dumpprijs.',
        failText: 'De goederen zijn nep. Je hebt betaald voor rommel.',
        effects: { money: -2000, heat: 5, rep: 10, dirtyMoney: 5000, crewDamage: 0 },
      },
      {
        id: 'sd_steal', label: 'STEEL DE LADING', stat: 'muscle', difficulty: 50,
        successText: 'Je overmeestert de smokkelaar en neemt alles mee. Gratis goederen.',
        failText: 'De smokkelaar heeft vrienden. Je trekt je terug met lege handen.',
        effects: { money: 0, heat: 15, rep: -10, dirtyMoney: 7000, crewDamage: 10, karma: -5 },
        newsBroadcast: 'Een brutale overval op een smokkelaar bij de haven — de dader is ontsnapt!',
      },
    ],
  },
  {
    id: 'hacker_offer',
    text: 'Een nerveuze man met een laptop biedt je aan om bankrekeningen te legen. "50/50 split. Ik heb alleen een veilige plek nodig."',
    districts: ['crown', 'neon'],
    minDay: 5,
    choices: [
      {
        id: 'ho_accept', label: 'ACCEPTEER', stat: 'brains', difficulty: 40,
        successText: 'Het werkt. De hack levert duizenden op. De man verdwijnt daarna — zoals afgesproken.',
        failText: 'Het is een undercover agent. Je ontsnapt maar je heat explodeert.',
        effects: { money: 0, heat: 10, rep: 5, dirtyMoney: 6000, crewDamage: 0 },
      },
      {
        id: 'ho_decline', label: 'TE RISKANT', stat: 'charm', difficulty: 10,
        successText: 'Je bedankt beleefd. "Niet mijn stijl." De man verdwijnt in de nacht.',
        failText: 'Hij wordt boos. "Je maakt een fout." Maar hij loopt weg.',
        effects: { money: 0, heat: 0, rep: 0, dirtyMoney: 0, crewDamage: 0 },
      },
    ],
  },
  {
    id: 'warehouse_fire',
    text: 'Een opslagloods staat in brand! Mensen rennen weg. Maar je ziet een kluis door de vlammen heen.',
    choices: [
      {
        id: 'wf_enter', label: 'GA NAAR BINNEN', stat: 'muscle', difficulty: 45,
        successText: 'Door rook en vuur bereik je de kluis. Hij staat open — vol cash. Je bent een held... en rijker.',
        failText: 'De hitte is ondragelijk. Je trekt je terug met brandwonden.',
        effects: { money: 4000, heat: 0, rep: 20, dirtyMoney: 0, crewDamage: 15 },
        newsBroadcast: 'Mysterieuze held redt cash uit brandende loods!',
      },
      {
        id: 'wf_wait', label: 'WACHT OP BRANDWEER', stat: 'brains', difficulty: 20,
        successText: 'Na het blussen glip je naar binnen. De kluis is intact. Een deel van de inhoud pak je mee.',
        failText: 'De politie zet alles af. Geen kans om binnen te komen.',
        effects: { money: 1500, heat: 3, rep: 5, dirtyMoney: 0, crewDamage: 0 },
      },
    ],
  },
  {
    id: 'drug_lab_explosion',
    text: 'BOEM! Een drugslab in de buurt explodeert. Paniek op straat. In de chaos zie je zakken product op de grond.',
    districts: ['low', 'iron'],
    choices: [
      {
        id: 'dle_grab', label: 'GRIJP WAT JE KUNT', stat: 'muscle', difficulty: 25,
        successText: 'Je grijpt drie zakken en rent. Puur geluk — pure winst.',
        failText: 'Andere plunderaars duwen je opzij. Je komt weg met bijna niks.',
        effects: { money: 0, heat: 8, rep: 0, dirtyMoney: 3000, crewDamage: 0 },
      },
      {
        id: 'dle_help', label: 'HELP GEWONDEN', stat: 'charm', difficulty: 20,
        successText: 'Je helpt mensen naar buiten. Een dankbare man geeft je een dikke fooi. "Je bent een goeie."',
        failText: 'Je helpt, maar niemand bedankt je. Tenminste geen heat.',
        effects: { money: 1000, heat: -5, rep: 15, dirtyMoney: 0, crewDamage: 0, karma: 5 },
      },
    ],
  },
  {
    id: 'underground_fight',
    text: 'Je hoort geschreeuw uit een kelder. Een underground vechtclub. De pot vanavond: €5.000. "Nog een challenger nodig!"',
    minDay: 4,
    choices: [
      {
        id: 'uf_fight', label: 'STAP IN DE RING', stat: 'muscle', difficulty: 50,
        successText: 'Drie rondes. Bloed. Zweet. Maar je staat als laatste overeind. €5.000 verdiend.',
        failText: 'Je tegenstander is een monster. Je gaat neer in ronde twee.',
        effects: { money: 5000, heat: 5, rep: 30, dirtyMoney: 0, crewDamage: 20 },
        newsBroadcast: 'Onbekende vechter domineert underground fight — de stad praat erover!',
      },
      {
        id: 'uf_bet', label: 'WED OP EEN VECHTER', stat: 'brains', difficulty: 35,
        successText: 'Je bestudeert de vechters en zet op de underdog. Hij wint! Dubbele inzet terug.',
        failText: 'Je favoriet gaat neer. Daar gaat je geld.',
        effects: { money: 2000, heat: 2, rep: 5, dirtyMoney: 0, crewDamage: 0 },
      },
      {
        id: 'uf_organize', label: 'WORD PROMOTER', stat: 'charm', difficulty: 40,
        successText: '"Ik regel de volgende avond." Je neemt een percentage van alle inzetten. Slim zakendoen.',
        failText: 'De huidige promoter is niet blij. Zijn bodyguards escorteren je naar buiten.',
        effects: { money: 3000, heat: 3, rep: 15, dirtyMoney: 0, crewDamage: 5 },
      },
    ],
  },
  {
    id: 'celebrity_encounter',
    text: 'Een bekende rapper staat in de steeg te roken. Hij ziet er nerveus uit. "Yo, ik heb wat nodig... ken je iemand?"',
    districts: ['neon', 'crown'],
    choices: [
      {
        id: 'ce_deal', label: 'REGEL HET', stat: 'charm', difficulty: 30,
        successText: 'Je regelt wat hij nodig heeft. Hij betaalt het driedubbele. "Je hoort van me," belooft hij.',
        failText: 'Je hebt niet wat hij zoekt. "Vergeet het." Hij loopt weg.',
        effects: { money: 3000, heat: 5, rep: 20, dirtyMoney: 0, crewDamage: 0 },
      },
      {
        id: 'ce_blackmail', label: 'CHANTEER', stat: 'brains', difficulty: 45,
        successText: '"Stel je voor dat dit uitlekt..." Hij betaalt. Veel. Stille afspraak.',
        failText: 'Zijn bodyguard verschijnt. "Probeer dat nog eens en je bent er geweest."',
        effects: { money: 8000, heat: 10, rep: -15, dirtyMoney: 0, crewDamage: 10, karma: -10 },
      },
    ],
  },
  {
    id: 'police_chase',
    text: 'Sirenes! Een politieauto scheurt langs. Ze zijn niet naar jou op zoek — maar ze blokkeren de straat. In de chaos kun je iets pakken.',
    choices: [
      {
        id: 'pc_hide', label: 'VERSTOPPEN', stat: 'brains', difficulty: 20,
        successText: 'Je duikt een portiek in. De politie raast voorbij. Een gevallen bewijs-zak ligt op de grond.',
        failText: 'Je verstopt je, maar een agent ziet je. "Papieren!"',
        effects: { money: 1500, heat: -5, rep: 0, dirtyMoney: 0, crewDamage: 0 },
      },
      {
        id: 'pc_run', label: 'REN MEE IN DE CHAOS', stat: 'muscle', difficulty: 30,
        successText: 'In de chaos grijp je een tas van de verdachte. Cash!',
        failText: 'Je wordt geraakt door een politieauto-deur. Au.',
        effects: { money: 0, heat: 8, rep: 5, dirtyMoney: 2500, crewDamage: 10 },
      },
    ],
  },
  {
    id: 'dying_dealer',
    text: 'Een dealer ligt in een steeg. "Neem mijn telefoon... alle contacten... alle routes... word groter dan ik ooit was..."',
    minDay: 10,
    choices: [
      {
        id: 'dd_take', label: 'NEEM DE TELEFOON', stat: 'brains', difficulty: 25,
        successText: 'De contactenlijst is goud waard. Nieuwe leveranciers, nieuwe afzetmarkten.',
        failText: 'De telefoon is vergrendeld. Je kunt er niks mee.',
        effects: { money: 0, heat: 5, rep: 25, dirtyMoney: 2000, crewDamage: 0 },
      },
      {
        id: 'dd_help', label: 'BEL EEN AMBULANCE', stat: 'charm', difficulty: 15,
        successText: 'Je belt hulp. Hij overleeft het net. Eeuwig dankbaar. Een nieuwe bondgenoot.',
        failText: 'Te laat. Maar je geweten is schoon.',
        effects: { money: 0, heat: -5, rep: 15, dirtyMoney: 0, crewDamage: 0, karma: 8 },
        followUpEventId: 'dealer_gratitude',
      },
    ],
  },
  {
    id: 'arms_deal_gone_wrong',
    text: 'Je loopt langs een parkeergarage waar een wapendeal misloopt. Schoten klinken. Eén dealer rent naar je toe.',
    districts: ['iron', 'port'],
    minDay: 6,
    choices: [
      {
        id: 'adgw_help', label: 'HELP DE DEALER', stat: 'muscle', difficulty: 40,
        successText: 'Je helpt hem ontsnappen. Als dank geeft hij je een deel van de wapens. Zwaar geschut.',
        failText: 'Je raakt verwikkeld in het vuurgevecht. Niet slim.',
        effects: { money: 0, heat: 15, rep: 20, dirtyMoney: 5000, crewDamage: 15 },
        newsBroadcast: 'Schietpartij bij parkeergarage — minstens één gewonde!',
      },
      {
        id: 'adgw_loot', label: 'PLUNDER DE ROMMEL', stat: 'brains', difficulty: 35,
        successText: 'Terwijl ze vechten, pak je een koffer met cash en loop je weg. Niemand merkt het.',
        failText: 'Een kogel fluit langs je oor. Te gevaarlijk. Je trekt je terug.',
        effects: { money: 0, heat: 5, rep: 0, dirtyMoney: 4000, crewDamage: 0 },
      },
    ],
  },
  {
    id: 'ghost_car',
    text: 'Een zwarte auto zonder nummerbord stopt naast je. Het raam gaat open. "Stap in. We moeten praten over je toekomst in deze stad."',
    minDay: 8,
    choices: [
      {
        id: 'gc_enter', label: 'STAP IN', stat: 'charm', difficulty: 40,
        successText: 'Een onbekende machtige figuur biedt je een alliantie aan. Het begin van iets groots.',
        failText: 'Ze willen je intimideren. Je stapt snel weer uit — maar de boodschap is duidelijk.',
        effects: { money: 5000, heat: 5, rep: 30, dirtyMoney: 0, crewDamage: 0 },
        followUpEventId: 'ghost_car_alliance',
      },
      {
        id: 'gc_refuse', label: 'WEIGER', stat: 'muscle', difficulty: 15,
        successText: '"Ik stap in niemands auto." De auto rijdt weg. Je behoudt je onafhankelijkheid.',
        failText: 'Ze zijn niet blij met je weigering. Je voelt ogen in je rug de rest van de dag.',
        effects: { money: 0, heat: 5, rep: 5, dirtyMoney: 0, crewDamage: 0 },
      },
    ],
  },
  {
    id: 'casino_debt_collector',
    text: 'Een grote vent met een litteken blokkeert je pad. "Je vriend heeft een schuld bij ons. Jij gaat betalen."',
    districts: ['neon'],
    choices: [
      {
        id: 'cdc_pay', label: 'BETAAL', stat: 'charm', difficulty: 20,
        successText: 'Je betaalt. De vent grijnst. "Verstandig." Hij geeft je een VIP-pas voor het casino.',
        failText: 'Je betaalt, maar hij wil meer. Telkens meer.',
        effects: { money: -2000, heat: 0, rep: 5, dirtyMoney: 0, crewDamage: 0 },
      },
      {
        id: 'cdc_fight', label: 'WEIGER & VECHT', stat: 'muscle', difficulty: 45,
        successText: 'Je slaat hem neer met één klap. De rest van zijn maten kijkt geschokt. Respect verdiend.',
        failText: 'Hij is groter dan je dacht. Je gaat neer. Hard.',
        effects: { money: 0, heat: 10, rep: 20, dirtyMoney: 0, crewDamage: 20 },
      },
    ],
  },
  {
    id: 'street_race',
    text: 'Een groep racers verzamelt zich bij de boulevard. €2.000 inzet. "Durf je mee te doen?"',
    choices: [
      {
        id: 'srace_join', label: 'RACE MEE', stat: 'muscle', difficulty: 40,
        successText: 'Je scheurt door de straten als een gek. Eerste! De pot is van jou.',
        failText: 'Je crasht in de tweede bocht. Voertuigschade en schaamte.',
        effects: { money: 4000, heat: 8, rep: 15, dirtyMoney: 0, crewDamage: 5 },
      },
      {
        id: 'srace_fix', label: 'FIX DE RACE', stat: 'brains', difficulty: 45,
        successText: 'Je saboteert de favoriete auto en zet op de underdog. Slim geld verdiend.',
        failText: 'Ze ontdekken je sabotage. De racers zijn niet blij.',
        effects: { money: 6000, heat: 5, rep: -5, dirtyMoney: 0, crewDamage: 10, karma: -3 },
      },
    ],
  },
  {
    id: 'fallen_shipment',
    text: 'Een vrachtwagen heeft zijn lading verloren op de snelweg. Dozen met onbekende inhoud liggen verspreid over de weg.',
    choices: [
      {
        id: 'fs_grab', label: 'GRIJP DOZEN', stat: 'muscle', difficulty: 20,
        successText: 'Elektronica! Duizenden euro\'s aan laptops en telefoons. Kerstcadeau voor jezelf.',
        failText: 'De chauffeur komt terug met een honkbalknuppel. Je rent.',
        effects: { money: 3000, heat: 5, rep: 0, dirtyMoney: 0, crewDamage: 0 },
      },
      {
        id: 'fs_sell_info', label: 'VERKOOP LOCATIE', stat: 'charm', difficulty: 30,
        successText: 'Je belt een heler. Hij betaalt je voor de locatie. Makkelijk geld zonder vuile handen.',
        failText: 'De heler komt niet opdagen. Iemand anders heeft de lading al.',
        effects: { money: 1500, heat: 0, rep: 5, dirtyMoney: 0, crewDamage: 0 },
      },
    ],
  },
  {
    id: 'protection_request',
    text: 'Een winkeleigenaar smeekt je: "De Iron Skulls willen beschermingsgeld. Ik kan niet meer betalen. Help me alsjeblieft."',
    minDay: 4,
    choices: [
      {
        id: 'pr_protect', label: 'BESCHERM HEM', stat: 'muscle', difficulty: 35,
        successText: 'Je confronteert de afpersers. Ze trekken zich terug. De winkelier betaalt je dankbaar.',
        failText: 'De Skulls sturen versterkingen. Niet je beste dag.',
        effects: { money: 2000, heat: 8, rep: 20, dirtyMoney: 0, crewDamage: 10, karma: 5 },
      },
      {
        id: 'pr_takeover', label: 'NEEM HET OVER', stat: 'charm', difficulty: 30,
        successText: '"Ik bescherm je voortaan. €500 per week." Een nieuwe inkomstenbron.',
        failText: 'De winkelier vertrouwt je niet. "Jij bent net als zij."',
        effects: { money: 500, heat: 5, rep: -5, dirtyMoney: 0, crewDamage: 0, karma: -5 },
      },
      {
        id: 'pr_ignore', label: 'NIET JOUW PROBLEEM', stat: 'brains', difficulty: 10,
        successText: 'Je loopt door. Niet iedereen kan gered worden.',
        failText: 'Je loopt door. De winkelier kijkt je na met lege ogen.',
        effects: { money: 0, heat: 0, rep: -3, dirtyMoney: 0, crewDamage: 0 },
      },
    ],
  },
  // ===== MINI-GAME STREET EVENTS =====
  {
    id: 'iron_arm_wrestle',
    text: 'In een rokerige bar in Iron Borough slaat een gespierde havenarbeider op de tafel. "Jij daar! Durf je een potje armworstelen? €500 inzet. Of ben je te zwak?"',
    districts: ['iron'],
    minDay: 3,
    choices: [
      {
        id: 'iaw_accept', label: '💪 NEEM DE UITDAGING AAN', stat: 'muscle', difficulty: 35,
        successText: 'Je drukt zijn arm tegen de tafel! De bar barst los in gejuich.',
        failText: 'Hij is sterker dan je dacht. Je arm knalt tegen het hout.',
        effects: { money: 500, heat: 0, rep: 10, dirtyMoney: 0, crewDamage: 0 },
        minigame: 'arm_wrestle',
      },
      {
        id: 'iaw_bet_big', label: '💰 VERHOOG NAAR €2.000', stat: 'charm', difficulty: 45,
        successText: 'Na een epische strijd win je! De menigte scandeert je naam.',
        failText: 'De hogere inzet maakt je nerveus. Je verliest €2.000 en je trots.',
        effects: { money: 2000, heat: 2, rep: 20, dirtyMoney: 0, crewDamage: 0 },
        minigame: 'arm_wrestle',
      },
      {
        id: 'iaw_decline', label: 'LOOP DOOR', stat: 'brains', difficulty: 10,
        successText: 'Je schudt je hoofd. "Niet vandaag." Slim — die vent had armen als boomstammen.',
        failText: 'Je loopt weg. Een paar mannen lachen je na.',
        effects: { money: 0, heat: 0, rep: -3, dirtyMoney: 0, crewDamage: 0 },
      },
    ],
  },
  {
    id: 'port_dice_game',
    text: 'Bij de dokken van Port Nero zit een groep havenarbeiders rond een krat te dobbelen. "Kom erbij, vriend. €300 buy-in."',
    districts: ['port'],
    minDay: 2,
    choices: [
      {
        id: 'pdg_play', label: '🎲 GOOI DE DOBBELSTENEN', stat: 'brains', difficulty: 30,
        successText: 'Je gooit een perfecte 7! €600 winst en respect bij de dokwerkers.',
        failText: 'Snake eyes. De groep grijnst terwijl ze je geld oppakken.',
        effects: { money: 600, heat: 0, rep: 5, dirtyMoney: 0, crewDamage: 0 },
        minigame: 'dice',
      },
      {
        id: 'pdg_high_stakes', label: '💎 HIGH STAKES (€1.500)', stat: 'charm', difficulty: 50,
        successText: 'Je gooit voor het grote geld en wint! €3.000 — ze noemen je "Lucky."',
        failText: 'De dobbelstenen zijn je niet gunstig gezind. €1.500 armer.',
        effects: { money: 3000, heat: 3, rep: 15, dirtyMoney: 0, crewDamage: 0 },
        minigame: 'dice',
      },
      {
        id: 'pdg_watch', label: 'KIJK ALLEEN', stat: 'brains', difficulty: 10,
        successText: 'Je kijkt toe en leert hun trucjes. Nuttige informatie voor later.',
        failText: 'Je kijkt toe. Een van hen mompelt "toerist" en de groep lacht.',
        effects: { money: 0, heat: 0, rep: 0, dirtyMoney: 0, crewDamage: 0 },
      },
    ],
  },

  // ===== NEW: DISTRICT-STATE DRIVEN EVENTS =====
  {
    id: 'turf_defense',
    text: 'Bewoners van je district kloppen aan. "Baas, er zijn indringers gezien. Ze verkennen onze straten." Je territorium wordt bedreigd.',
    tags: ['turf'],
    reqOwnsDistrict: true,
    minDay: 8,
    choices: [
      {
        id: 'td_patrol', label: 'STUUR CREW OP PATROUILLE', stat: 'muscle', difficulty: 30,
        successText: 'Je crew onderschept de verkenners. Boodschap is duidelijk: dit is jouw terrein.',
        failText: 'De verkenners ontsnappen. Ze weten nu meer over je verdediging.',
        effects: { money: 0, heat: 5, rep: 20, dirtyMoney: 0, crewDamage: 5 },
        newsBroadcast: 'Bewapende patrouilles gezien — een district wordt zwaar bewaakt!',
      },
      {
        id: 'td_trap', label: 'ZET EEN VAL', stat: 'brains', difficulty: 40,
        successText: 'De val werkt perfect. Je vangt een spion — en leert wie hem heeft gestuurd.',
        failText: 'De val mislukt. De spion ontsnapt met waardevolle informatie.',
        effects: { money: 0, heat: 3, rep: 15, dirtyMoney: 0, crewDamage: 0 },
      },
    ],
  },
  {
    id: 'rival_territory_opportunity',
    text: 'De heerser van dit district is verzwakt. Bewoners fluisteren dat het tijd is voor een machtswissel.',
    tags: ['turf'],
    reqNotOwnsDistrict: true,
    minDay: 10,
    minRep: 100,
    choices: [
      {
        id: 'rto_intimidate', label: 'INTIMIDEER DE BEVOLKING', stat: 'muscle', difficulty: 35,
        successText: 'De straat buigt. Jouw naam wordt gefluisterd met ontzag.',
        failText: 'De huidige heerser stuurt zijn mannen. Je wordt verjaagd.',
        effects: { money: 0, heat: 12, rep: 30, dirtyMoney: 0, crewDamage: 10, karma: -5 },
        newsBroadcast: 'Machtsstrijd ontbrandt — een nieuweling claimt invloed in het district!',
      },
      {
        id: 'rto_bribe', label: 'KOOP LOYALITEIT', stat: 'charm', difficulty: 30,
        successText: 'Geld praat. De sleutelfiguren zweren je trouw.',
        failText: 'Ze nemen je geld aan en lachen je uit. Niets verandert.',
        effects: { money: -3000, heat: 0, rep: 20, dirtyMoney: 0, crewDamage: 0 },
      },
    ],
  },

  // ===== NEW: FACTION RELATION EVENTS =====
  {
    id: 'cartel_warning',
    text: 'Een zwarte SUV blokkeert de straat. Een Kartel-luitenant stapt uit. "Het Kartel vergeet niet. Je hebt onze geduld getest."',
    tags: ['faction'],
    reqFactionRel: { familyId: 'cartel', max: -20 },
    minDay: 5,
    choices: [
      {
        id: 'cw_apologize', label: 'EXCUSES AANBIEDEN', stat: 'charm', difficulty: 25,
        successText: '"We geven je nog één kans." Het Kartel trekt zich terug — voor nu.',
        failText: 'Hij spuugt op je schoenen. "Excuses zijn niks waard." Je crew raakt gewond.',
        effects: { money: 0, heat: 0, rep: 0, dirtyMoney: 0, crewDamage: 0, factionRel: { familyId: 'cartel', change: 10 } },
      },
      {
        id: 'cw_defy', label: 'TROTSEER HEM', stat: 'muscle', difficulty: 45,
        successText: 'Je staart hem neer. Hij vertrekt — maar dit is niet voorbij.',
        failText: 'Zijn mannen grijpen je. Een les die je niet snel vergeet.',
        effects: { money: 0, heat: 10, rep: 15, dirtyMoney: 0, crewDamage: 15, karma: -3, factionRel: { familyId: 'cartel', change: -10 } },
        newsBroadcast: 'Confrontatie met het Kartel — een speler trotseerde hun dreigementen!',
      },
    ],
  },
  {
    id: 'syndicate_job_offer',
    text: 'Een strak geklede vrouw in een Tesla stopt. "Het Syndicaat heeft een klus. Goed betaald. Geïnteresseerd?"',
    tags: ['faction'],
    reqFactionRel: { familyId: 'syndicate', min: 10 },
    minDay: 7,
    choices: [
      {
        id: 'sjo_accept', label: 'ACCEPTEER', stat: 'brains', difficulty: 35,
        successText: 'De klus gaat soepel. €5.000 en meer respect bij het Syndicaat.',
        failText: 'De klus mislukt. Het Syndicaat is niet blij.',
        effects: { money: 5000, heat: 8, rep: 15, dirtyMoney: 0, crewDamage: 0, factionRel: { familyId: 'syndicate', change: 5 } },
      },
      {
        id: 'sjo_negotiate', label: 'ONDERHANDEL MEER GELD', stat: 'charm', difficulty: 45,
        successText: '"Slim." Ze verdubbelt het aanbod. De klus levert €8.000 op.',
        failText: '"We vragen het wel aan iemand anders." Gemiste kans.',
        effects: { money: 8000, heat: 8, rep: 20, dirtyMoney: 0, crewDamage: 0, factionRel: { familyId: 'syndicate', change: 3 } },
      },
    ],
  },
  {
    id: 'bikers_alliance',
    text: 'De Bikers sturen een prospect naar je toe. "De president wil praten. Over samenwerking. Morgen bij de garage."',
    tags: ['faction'],
    reqFactionRel: { familyId: 'bikers', min: 15 },
    minDay: 10,
    choices: [
      {
        id: 'ba_go', label: 'GA ERHEEN', stat: 'charm', difficulty: 30,
        successText: 'De president stelt een deal voor: bescherming in ruil voor territoriaal respect. Een sterke alliantie.',
        failText: 'Het blijkt een test. De Bikers vertrouwen je nog niet helemaal.',
        effects: { money: 0, heat: 0, rep: 25, dirtyMoney: 0, crewDamage: 0, factionRel: { familyId: 'bikers', change: 10 } },
      },
      {
        id: 'ba_refuse', label: 'WEIGER BELEEFD', stat: 'brains', difficulty: 15,
        successText: 'Je bedankt. De Bikers respecteren je onafhankelijkheid.',
        failText: 'Ze zijn teleurgesteld. De kans is gemist.',
        effects: { money: 0, heat: 0, rep: 0, dirtyMoney: 0, crewDamage: 0 },
      },
    ],
  },

  // ===== NEW: MARKET-DRIVEN EVENTS =====
  {
    id: 'market_chaos_opportunity',
    text: 'De markt is in chaos! Handelaren dumpen goederen op straat. "Alles moet weg — de prijzen crashen!"',
    tags: ['market'],
    reqMarketEvent: true,
    choices: [
      {
        id: 'mco_buy', label: 'KOOP ALLES OP', stat: 'brains', difficulty: 25,
        successText: 'Je koopt voor een habbekrats in. Als de prijzen herstellen, word je rijk.',
        failText: 'Te langzaam. Andere handelaren waren sneller.',
        effects: { money: -2000, heat: 0, rep: 10, dirtyMoney: 5000, crewDamage: 0 },
      },
      {
        id: 'mco_sell_info', label: 'VERKOOP INSIDER INFO', stat: 'charm', difficulty: 35,
        successText: 'Een wanhopige handelaar betaalt je €3.000 voor informatie over de crash.',
        failText: 'Niemand gelooft je. De info is waardeloos op straat.',
        effects: { money: 3000, heat: 0, rep: 5, dirtyMoney: 0, crewDamage: 0 },
      },
    ],
  },

  // ===== NEW: NPC RELATION EVENTS =====
  {
    id: 'rosa_favor',
    text: 'Rosa belt je. "Ik heb een klus. Discreet. Alleen voor mensen die ik vertrouw." Haar stem klinkt dringend.',
    tags: ['npc'],
    reqNpcRel: { npcId: 'rosa', minValue: 30 },
    minDay: 8,
    choices: [
      {
        id: 'rf_help', label: 'HELP ROSA', stat: 'charm', difficulty: 30,
        successText: 'Rosa is dankbaar. "Ik vergeet dit niet." Ze geeft je een exclusieve tip.',
        failText: 'De klus gaat mis. Rosa is teleurgesteld, maar begrijpend.',
        effects: { money: 3000, heat: 3, rep: 10, dirtyMoney: 0, crewDamage: 0, npcRel: { npcId: 'rosa', change: 10 }, karma: 3 },
      },
      {
        id: 'rf_price', label: 'VRAAG BETALING', stat: 'brains', difficulty: 20,
        successText: 'Ze betaalt. Zaken zijn zaken, ook met vrienden.',
        failText: '"Ik dacht dat je anders was." De relatie lijdt eronder.',
        effects: { money: 5000, heat: 0, rep: 0, dirtyMoney: 0, crewDamage: 0, npcRel: { npcId: 'rosa', change: -5 } },
      },
    ],
  },
  {
    id: 'krow_test',
    text: 'Viktor Krow staat plotseling voor je. "Ik test mijn bondgenoten graag. Eén keer. Eén kans." Hij gooit een envelop naar je.',
    tags: ['npc'],
    reqNpcRel: { npcId: 'krow', minValue: 20 },
    minDay: 12,
    choices: [
      {
        id: 'kt_open', label: 'OPEN DE ENVELOP', stat: 'brains', difficulty: 35,
        successText: 'Coördinaten. Een onbewaakt wapendepot. Krow kijkt tevreden. "Je hebt lef."',
        failText: 'Het is een test — de locatie is een val. Krow grijpt in voordat het fout gaat.',
        effects: { money: 0, heat: 5, rep: 20, dirtyMoney: 4000, crewDamage: 0, npcRel: { npcId: 'krow', change: 8 } },
      },
      {
        id: 'kt_refuse', label: 'GOOI HET TERUG', stat: 'muscle', difficulty: 20,
        successText: '"Ik dans niet voor jou, Krow." Hij grijnst. "Goed antwoord."',
        failText: 'Hij kijkt teleurgesteld. "Jammer. Ik had meer verwacht."',
        effects: { money: 0, heat: 0, rep: 5, dirtyMoney: 0, crewDamage: 0, npcRel: { npcId: 'krow', change: -3 } },
      },
    ],
  },

  // ===== NEW: KARMA-GATED EVENTS =====
  {
    id: 'homeless_man',
    text: 'Een dakloze man zit op de hoek. "Ik heb alles verloren door het Kartel. Alsjeblieft... help me."',
    tags: ['karma'],
    maxKarma: 20, // mostly for neutral or evil players
    choices: [
      {
        id: 'hm_help', label: 'GEEF HEM €500', stat: 'charm', difficulty: 10,
        successText: 'Hij huilt. "God zegene je." Je voelt je menselijk. Even.',
        failText: 'Hij pakt het geld en rent. Misschien niet zo hulpeloos als hij leek.',
        effects: { money: -500, heat: 0, rep: 5, dirtyMoney: 0, crewDamage: 0, karma: 10 },
      },
      {
        id: 'hm_recruit', label: 'GEEF HEM EEN BAAN', stat: 'charm', difficulty: 25,
        successText: '"Ik doe alles." Hij wordt een loyale informant. Een tweede kans.',
        failText: 'Hij verdwijnt de volgende dag. Sommige mensen zijn niet te redden.',
        effects: { money: -200, heat: 0, rep: 10, dirtyMoney: 0, crewDamage: 0, karma: 15 },
      },
      {
        id: 'hm_rob', label: 'DOORZOEK ZIJN SPULLEN', stat: 'muscle', difficulty: 15,
        successText: 'Verborgen onder zijn deken: een portemonnee met €300. Niet jouw schuld.',
        failText: 'Hij heeft niks. Je voelt je rot.',
        effects: { money: 300, heat: 0, rep: -10, dirtyMoney: 0, crewDamage: 0, karma: -15 },
      },
    ],
  },
  {
    id: 'vigilante_choice',
    text: 'Je ziet een dealer een tiener onder druk zetten. "Koop of ik maak je af." De tiener trilt van angst.',
    tags: ['karma'],
    minKarma: 10,
    minDay: 5,
    choices: [
      {
        id: 'vc_intervene', label: 'GRIJP IN', stat: 'muscle', difficulty: 30,
        successText: 'Je slaat de dealer neer. De tiener rent weg. "Dank je..." fluistert hij.',
        failText: 'De dealer heeft een mes. Je raakt gewond maar de tiener ontsnapt.',
        effects: { money: 0, heat: 5, rep: 20, dirtyMoney: 0, crewDamage: 10, karma: 10 },
        newsBroadcast: 'Mysterieuze beschermer redt tiener van drugdealer op straat!',
      },
      {
        id: 'vc_report', label: 'BEL DE POLITIE', stat: 'brains', difficulty: 15,
        successText: 'De politie arriveert snel. De dealer wordt gearresteerd. Anoniem — slim.',
        failText: 'De politie komt te laat. De dealer is al weg.',
        effects: { money: 0, heat: -5, rep: 5, dirtyMoney: 0, crewDamage: 0, karma: 8 },
      },
    ],
  },

  // ===== NEW: CONSEQUENCE CHAIN FOLLOW-UPS =====
  {
    id: 'dealer_gratitude',
    text: 'De dealer die je redde staat bij je deur. "Ik beloof het — ik sta bij je in het krijt. Hier, mijn contactenlijst."',
    isFollowUp: true,
    tags: ['chain'],
    choices: [
      {
        id: 'dg_accept', label: 'ACCEPTEER', stat: 'charm', difficulty: 10,
        successText: 'Zijn netwerk is nu jouw netwerk. Nieuwe connecties in de onderwereld.',
        failText: 'De contacten zijn verouderd. Maar de intentie telt.',
        effects: { money: 0, heat: 0, rep: 20, dirtyMoney: 3000, crewDamage: 0 },
      },
      {
        id: 'dg_favor', label: 'VRAAG EEN WEDERDIENST', stat: 'brains', difficulty: 20,
        successText: '"Alles wat je wilt." Hij regelt een veilige smokkelroute voor je.',
        failText: 'Hij kan niet leveren wat hij belooft. Maar hij probeert het.',
        effects: { money: 2000, heat: 0, rep: 10, dirtyMoney: 0, crewDamage: 0 },
      },
    ],
  },
  {
    id: 'ghost_car_alliance',
    text: 'De mysterieuze figuur uit de zwarte auto belt. "Onze alliantie begint nu. Eerste opdracht: elimineer een concurrent in Crown Heights."',
    isFollowUp: true,
    tags: ['chain'],
    choices: [
      {
        id: 'gca_obey', label: 'VOER UIT', stat: 'muscle', difficulty: 40,
        successText: 'De concurrent verdwijnt. Je ontvangt €8.000 en een nieuwe positie in het netwerk.',
        failText: 'De concurrent is beter beveiligd dan verwacht. Je trekt je terug.',
        effects: { money: 8000, heat: 15, rep: 25, dirtyMoney: 0, crewDamage: 10, karma: -10 },
        newsBroadcast: 'Prominente zakenman verdwijnt spoorloos uit Crown Heights!',
      },
      {
        id: 'gca_betray', label: 'WAARSCHUW DE CONCURRENT', stat: 'charm', difficulty: 30,
        successText: 'De concurrent is je dankbaar. Een nieuwe bondgenoot — en je hebt je onafhankelijkheid bewezen.',
        failText: 'De concurrent vertrouwt je niet. En nu heb je twee vijanden.',
        effects: { money: 3000, heat: 5, rep: 10, dirtyMoney: 0, crewDamage: 0, karma: 5 },
      },
    ],
  },

  // ===== NEW: COOPERATIVE / MMO-VISIBLE EVENTS =====
  {
    id: 'district_blackout',
    text: 'De stroom valt uit in het hele district! In de duisternis hoor je schoten en brekend glas. Chaos — en kansen.',
    tags: ['coop'],
    minDay: 6,
    choices: [
      {
        id: 'db_loot', label: 'PLUNDER IN HET DONKER', stat: 'muscle', difficulty: 25,
        successText: 'In de chaos scoor je groot. Winkels staan wagenwijd open.',
        failText: 'Je botst tegen een andere plunderaar. Gevecht in het pikkedonker.',
        effects: { money: 0, heat: 10, rep: 5, dirtyMoney: 5000, crewDamage: 5, karma: -5 },
        newsBroadcast: 'STROOMUITVAL — plunderingen gemeld in meerdere districten!',
      },
      {
        id: 'db_protect', label: 'BESCHERM DE BUURT', stat: 'charm', difficulty: 30,
        successText: 'Je organiseert de bewoners. Samen houden jullie de plunderaars tegen. Heldenstatus.',
        failText: 'Te veel plunderaars. Je wordt overrompeld.',
        effects: { money: 1000, heat: -10, rep: 30, dirtyMoney: 0, crewDamage: 10, karma: 10 },
        newsBroadcast: 'Buurtbeschermer organiseert verdediging tijdens blackout — een held!',
      },
      {
        id: 'db_hack', label: 'HACK DE SYSTEMEN', stat: 'brains', difficulty: 45,
        successText: 'Je hackt het elektriciteitsnetwerk. Wie de stroom beheert, beheert het district.',
        failText: 'Het systeem is beter beveiligd dan je dacht. Niks bereikt.',
        effects: { money: 0, heat: 5, rep: 20, dirtyMoney: 3000, crewDamage: 0 },
      },
    ],
  },
  {
    id: 'mass_arrest',
    text: 'Politie-eenheden sluiten het district af! Massale arrestatiegolf. Iedereen is een verdachte.',
    tags: ['coop'],
    minDay: 8,
    choices: [
      {
        id: 'ma_hide', label: 'DUIK ONDER', stat: 'brains', difficulty: 30,
        successText: 'Je verdwijnt in de menigte. De politie grijpt anderen, niet jou.',
        failText: 'Een agent herkent je. "Jij daar! Staan blijven!"',
        effects: { money: 0, heat: -15, rep: 5, dirtyMoney: 0, crewDamage: 0 },
      },
      {
        id: 'ma_bribe_cop', label: 'KOOP JE VRIJHEID', stat: 'charm', difficulty: 35,
        successText: 'Een corrupte agent laat je door. "Loop. Snel."',
        failText: 'De agent pakt je geld én arresteert je bijna.',
        effects: { money: -2000, heat: -20, rep: 0, dirtyMoney: 0, crewDamage: 0 },
      },
      {
        id: 'ma_help_others', label: 'HELP ANDEREN ONTSNAPPEN', stat: 'muscle', difficulty: 40,
        successText: 'Je helpt drie mensen ontsnappen. De straat onthoudt dat.',
        failText: 'Te opvallend. De politie focust nu op jou.',
        effects: { money: 0, heat: 10, rep: 25, dirtyMoney: 0, crewDamage: 5, karma: 5 },
        newsBroadcast: 'Onbekende helpt verdachten ontsnappen tijdens massale politie-actie!',
      },
    ],
  },
  // ===== PHASE-SPECIFIC EVENTS (night/dawn/dusk only) =====
  {
    id: 'night_smuggle_run',
    text: 'De nacht is perfect voor een smokkelrun. Een bekende van je staat klaar bij de kade met een boot vol goederen. "Nu of nooit."',
    districts: ['port'],
    reqPhase: ['night'],
    minDay: 5,
    tags: ['market'],
    choices: [
      {
        id: 'nsr_join', label: 'STAP IN DE BOOT', stat: 'brains', difficulty: 35,
        successText: 'De run verloopt vlekkeloos. Onder dekking van de nacht laad je de goederen uit. Flinke winst.',
        failText: 'De kustwacht patrouilleert onverwacht. Je moet de lading dumpen.',
        effects: { money: 0, heat: 5, rep: 15, dirtyMoney: 6000, crewDamage: 0 },
        newsBroadcast: 'Mysterieuze bootactiviteit bij Port Nero vannacht — kustwacht onderzoekt.',
      },
      {
        id: 'nsr_decline', label: 'TE RISKANT IN HET DONKER', stat: 'charm', difficulty: 10,
        successText: 'Je vertrouwt het niet. Slim — later hoor je dat de kustwacht die nacht extra patrouilleerde.',
        failText: 'Je loopt weg, maar de smokkelaar onthoudt je lafheid.',
        effects: { money: 0, heat: 0, rep: -5, dirtyMoney: 0, crewDamage: 0 },
      },
    ],
  },
  {
    id: 'night_alley_ambush',
    text: 'In de schaduwen van een steegje hoor je voetstappen achter je. Iemand volgt je.',
    reqPhase: ['night'],
    minDay: 4,
    tags: ['karma'],
    choices: [
      {
        id: 'naa_confront', label: 'CONFRONTEER', stat: 'muscle', difficulty: 40,
        successText: 'Je draait je om en slaat toe. De belager valt neer. In zijn jaszak: €3.000 en een mes.',
        failText: 'Hij is sneller. Een mes flitst. Je ontsnapt, maar niet ongeschonden.',
        effects: { money: 3000, heat: 8, rep: 15, dirtyMoney: 0, crewDamage: 10 },
      },
      {
        id: 'naa_run', label: 'REN', stat: 'brains', difficulty: 20,
        successText: 'Je kent de stegen beter dan hij. Na twee bochten ben je hem kwijt.',
        failText: 'Je struikelt in het donker. Hij haalt je in.',
        effects: { money: -500, heat: 0, rep: 0, dirtyMoney: 0, crewDamage: 5 },
      },
    ],
  },
  {
    id: 'night_underground_market',
    text: 'Een fluisterbericht leidt je naar een nachtelijke zwarte markt in een verlaten metro-station. Alles is te koop — voor de juiste prijs.',
    reqPhase: ['night'],
    districts: ['neon', 'iron'],
    minDay: 8,
    tags: ['market'],
    choices: [
      {
        id: 'num_trade', label: 'HANDELEN', stat: 'charm', difficulty: 30,
        successText: 'Je vindt zeldzame goederen tegen bodemprijzen. De nachtmarkt levert goud op.',
        failText: 'De prijzen zijn belachelijk. En iemand heeft je gezicht gezien.',
        effects: { money: 0, heat: 5, rep: 10, dirtyMoney: 4000, crewDamage: 0 },
      },
      {
        id: 'num_intel', label: 'VERZAMEL INTEL', stat: 'brains', difficulty: 25,
        successText: 'Je luistert meer dan je koopt. Waardevolle informatie over aankomende politieacties.',
        failText: 'Niemand vertrouwt een nieuweling. Je gaat met lege handen weg.',
        effects: { money: 0, heat: -10, rep: 5, dirtyMoney: 0, crewDamage: 0 },
      },
    ],
  },
  {
    id: 'dawn_police_sweep',
    text: 'Bij het eerste ochtendlicht begint een grote politie-operatie. Sirenes overal. Wegversperringen verschijnen.',
    reqPhase: ['dawn'],
    minDay: 6,
    tags: ['turf'],
    choices: [
      {
        id: 'dps_hide_stash', label: 'VERBERG JE VOORRAAD', stat: 'brains', difficulty: 30,
        successText: 'Net op tijd. Alles is verborgen voordat ze je blok bereiken.',
        failText: 'Te langzaam. Ze vinden een deel van je goederen.',
        effects: { money: -1500, heat: -15, rep: 0, dirtyMoney: 0, crewDamage: 0 },
      },
      {
        id: 'dps_warn_allies', label: 'WAARSCHUW BONDGENOTEN', stat: 'charm', difficulty: 25,
        successText: 'Je belt iedereen. De hele buurt is gewaarschuwd. Je reputatie stijgt enorm.',
        failText: 'Eén van je "bondgenoten" is een informant. Je heat stijgt.',
        effects: { money: 0, heat: 10, rep: 25, dirtyMoney: 0, crewDamage: 0, karma: 3 },
        newsBroadcast: 'Anonieme tipgever waarschuwt halve wijk — politie-actie mislukt grotendeels!',
      },
    ],
  },
  {
    id: 'dawn_early_delivery',
    text: 'Een koerier klopt om 5 uur \'s ochtends op je deur. "Pakket. Geen naam. Geen vragen." Hij overhandigt een zware doos.',
    reqPhase: ['dawn'],
    minDay: 3,
    choices: [
      {
        id: 'ded_open', label: 'OPEN DE DOOS', stat: 'brains', difficulty: 20,
        successText: 'Wapens. Hoogwaardige wapens. Iemand wil je bewapenen — of in je schuld.',
        failText: 'Een GPS-tracker zit erin verstopt. Je heat stijgt.',
        effects: { money: 0, heat: 8, rep: 10, dirtyMoney: 3000, crewDamage: 0 },
      },
      {
        id: 'ded_refuse', label: 'WEIGER HET PAKKET', stat: 'charm', difficulty: 15,
        successText: '"Verkeerd adres." De koerier haalt zijn schouders op en vertrekt.',
        failText: 'De koerier dringt aan. "Je wilt dit ECHT niet weigeren." Onheilspellend.',
        effects: { money: 0, heat: 0, rep: 0, dirtyMoney: 0, crewDamage: 0, karma: 2 },
      },
    ],
  },
  {
    id: 'dusk_golden_hour_deal',
    text: 'Het gouden avondlicht valt over de stad. Een zakenman in pak benadert je op het terras. "Ik heb een voorstel. Eenmalig. Vanavond nog."',
    reqPhase: ['dusk'],
    districts: ['crown', 'neon'],
    minDay: 7,
    tags: ['market'],
    choices: [
      {
        id: 'ghd_accept', label: 'LUISTER NAAR HET VOORSTEL', stat: 'charm', difficulty: 35,
        successText: 'Een witwas-deal via zijn bedrijf. Lucratief en relatief veilig.',
        failText: 'Het is een investeerder die al je geld wil. Bijna ingetrapt.',
        effects: { money: 5000, heat: 3, rep: 10, dirtyMoney: 0, crewDamage: 0 },
      },
      {
        id: 'ghd_counter', label: 'STEL EEN TEGENBOD', stat: 'brains', difficulty: 45,
        successText: 'Je draait de deal om. Híj betaalt jou. Meesterlijk onderhandeld.',
        failText: 'Te agressief. Hij staat op en loopt weg. "Jammer. Veel jammer."',
        effects: { money: 8000, heat: 5, rep: 20, dirtyMoney: 0, crewDamage: 0 },
        newsBroadcast: 'Mysterieuze deal gesloten bij zonsondergang in Crown Heights — miljoenen betrokken.',
      },
    ],
  },
  {
    id: 'dusk_street_race',
    text: 'Bij schemering verzamelen zich auto\'s bij een verlaten parkeerplaats. Een illegale straatrace staat op het punt te beginnen. "Doe je mee?"',
    reqPhase: ['dusk'],
    minDay: 5,
    choices: [
      {
        id: 'dsr_race', label: 'RACE MEE', stat: 'muscle', difficulty: 40,
        successText: 'Je wint! De pot is €4.000 en de bewondering van de hele strip.',
        failText: 'Je crasht bijna. Geen winst, wel een deuk in je ego en auto.',
        effects: { money: 4000, heat: 8, rep: 20, dirtyMoney: 0, crewDamage: 0 },
        newsBroadcast: 'Illegale straatrace bij schemering — onbekende bestuurder wint spectaculair!',
      },
      {
        id: 'dsr_bet', label: 'ZET GELD IN', stat: 'brains', difficulty: 30,
        successText: 'Je kiest de juiste favoriet. Dubbele inzet terug.',
        failText: 'De favoriet crasht. Daar gaat je geld.',
        effects: { money: 2500, heat: 2, rep: 5, dirtyMoney: 0, crewDamage: 0 },
      },
    ],
  },
];

// ========== EVENT LOGIC ==========

const EVENT_CHANCE_ON_TRAVEL = 0.22;
const EVENT_CHANCE_ON_END_TURN = 0.15;
const EVENT_CHANCE_ON_SOLO_OP = 0.12;

/** Minimum cooldown between street events in milliseconds (10 minutes) */
const EVENT_COOLDOWN_MS = 10 * 60 * 1000;

/**
 * Check advanced filters for an event against current game state
 */
function matchesAdvancedFilters(event: StreetEvent, state: GameState): boolean {
  // Follow-up events are never randomly triggered
  if (event.isFollowUp) return false;

  // Phase filter: check world time of day
  if (event.reqPhase && event.reqPhase.length > 0) {
    const currentPhase = (state as any).worldTimeOfDay || 'day';
    if (!event.reqPhase.includes(currentPhase)) return false;
  }

  // District ownership checks
  if (event.reqOwnsDistrict && !state.ownedDistricts.includes(state.loc)) return false;
  if (event.reqNotOwnsDistrict && state.ownedDistricts.includes(state.loc)) return false;

  // Karma checks
  if (event.minKarma !== undefined && state.karma < event.minKarma) return false;
  if (event.maxKarma !== undefined && state.karma > event.maxKarma) return false;

  // Active market event check
  if (event.reqMarketEvent && !state.activeMarketEvent) return false;

  // Faction relation check
  if (event.reqFactionRel) {
    const rel = state.familyRel[event.reqFactionRel.familyId] || 0;
    if (event.reqFactionRel.min !== undefined && rel < event.reqFactionRel.min) return false;
    if (event.reqFactionRel.max !== undefined && rel > event.reqFactionRel.max) return false;
  }

  // NPC relation check
  if (event.reqNpcRel) {
    const npcRel = state.npcRelations?.[event.reqNpcRel.npcId];
    if (!npcRel || npcRel.value < event.reqNpcRel.minValue) return false;
  }

  return true;
}

export function rollStreetEvent(
  state: GameState,
  trigger: 'travel' | 'end_turn' | 'solo_op'
): StreetEvent | null {
  if (state.pendingStreetEvent) return null;
  if (state.day < 3) return null;
  if (state.prison || state.hospital || state.hidingDays > 0) return null;

  // Cooldown check: don't trigger events too frequently (10 min minimum)
  const lastEventAt = (state as any).lastStreetEventAt;
  if (lastEventAt) {
    const elapsed = Date.now() - new Date(lastEventAt).getTime();
    if (elapsed < EVENT_COOLDOWN_MS) return null;
  }

  // Check for queued follow-up events first
  const followUpId = (state as any)._pendingFollowUpEventId;
  if (followUpId) {
    const followUp = STREET_EVENTS.find(e => e.id === followUpId);
    if (followUp) return followUp;
  }

  const chance =
    trigger === 'travel' ? EVENT_CHANCE_ON_TRAVEL :
    trigger === 'end_turn' ? EVENT_CHANCE_ON_END_TURN :
    EVENT_CHANCE_ON_SOLO_OP;

  if (Math.random() > chance) return null;

  // Filter eligible events with advanced filters
  const eligible = STREET_EVENTS.filter(e => {
    if (e.minDay && state.day < e.minDay) return false;
    if (e.minRep && state.rep < e.minRep) return false;
    if (e.districts && !e.districts.includes(state.loc)) return false;
    if (!matchesAdvancedFilters(e, state)) return false;
    return true;
  });

  if (eligible.length === 0) return null;

  // Weighted selection: prioritize context-specific events (tagged) over generic
  const tagged = eligible.filter(e => e.tags && e.tags.length > 0);
  const generic = eligible.filter(e => !e.tags || e.tags.length === 0);

  // 60% chance to pick a tagged event if available
  if (tagged.length > 0 && (generic.length === 0 || Math.random() < 0.6)) {
    return tagged[Math.floor(Math.random() * tagged.length)];
  }

  return eligible[Math.floor(Math.random() * eligible.length)];
}

/** Get a follow-up event by ID (for consequence chains) */
export function getFollowUpEvent(eventId: string): StreetEvent | null {
  return STREET_EVENTS.find(e => e.id === eventId) || null;
}

export function getEventText(event: StreetEvent, district: DistrictId): string {
  return event.districtVariants?.[district] || event.text;
}

export function resolveStreetChoice(
  state: GameState,
  event: StreetEvent,
  choiceId: string,
  forceResult?: 'success' | 'fail'
): {
  success: boolean;
  text: string;
  effects: StreetEventChoice['effects'];
  followUpEventId?: string;
  newsBroadcast?: string;
} {
  const choice = event.choices.find(c => c.id === choiceId);
  if (!choice) return {
    success: false, text: 'Onbekende keuze.',
    effects: { money: 0, heat: 0, rep: 0, dirtyMoney: 0, crewDamage: 0 },
  };

  let success: boolean;
  if (forceResult) {
    success = forceResult === 'success';
  } else {
    const statVal = getPlayerStat(state, choice.stat);
    const roll = Math.random() * 100;
    const successChance = Math.min(95, 100 - choice.difficulty + (statVal * 5));
    success = roll < successChance;
  }

  return {
    success,
    text: success ? choice.successText : choice.failText,
    effects: success ? choice.effects : {
      money: Math.min(0, choice.effects.money),
      heat: Math.max(0, choice.effects.heat + 3),
      rep: Math.min(0, choice.effects.rep),
      dirtyMoney: 0,
      crewDamage: Math.max(0, choice.effects.crewDamage + 5),
    },
    followUpEventId: success ? choice.followUpEventId : undefined,
    newsBroadcast: success ? choice.newsBroadcast : undefined,
  };
}
