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
  };
  minigame?: 'arm_wrestle' | 'dice'; // triggers a mini-game instead of stat roll
}

export interface StreetEvent {
  id: string;
  text: string;
  districtVariants?: Partial<Record<DistrictId, string>>;
  choices: StreetEventChoice[];
  minDay?: number;
  minRep?: number;
  districts?: DistrictId[];
}

// ========== EVENT DATABASE (20+ events) ==========

export const STREET_EVENTS: StreetEvent[] = [
  {
    id: 'wounded_man',
    text: 'Een verwonde man strompelt naar je toe. Bloed druppelt op het plaveisel. "Help me... ik heb een koffer vol cash. Breng me naar Port Nero en hij is van jou."',
    districtVariants: {
      crown: 'Een man in een duur pak strompelt uit een steeg in Crown Heights. "Ze willen me dood... breng me naar de haven."',
      low: 'Een bloedende jongen grijpt je arm in Lowrise. "Alsjeblieft... ik heb geld. Help me."',
    },
    choices: [
      {
        id: 'wm_help', label: 'HELP HEM', stat: 'charm', difficulty: 30,
        successText: 'Je brengt hem veilig weg. Hij overhandigt de koffer — €2.000 in biljetten. "Je bent een goed mens," fluistert hij.',
        failText: 'Halverwege trekt hij een mes. Het was een val. Je ontsnapt maar draagt de blauwe plekken.',
        effects: { money: 2000, heat: 5, rep: 15, dirtyMoney: 0, crewDamage: 0 },
      },
      {
        id: 'wm_rob', label: 'PAK DE KOFFER', stat: 'muscle', difficulty: 25,
        successText: 'Je rukt de koffer uit zijn handen en rent. €3.000 — geen vragen gesteld.',
        failText: 'Hij is sterker dan hij lijkt. Je eindigt zonder koffer én met een snee in je arm.',
        effects: { money: 0, heat: 10, rep: -10, dirtyMoney: 3000, crewDamage: 0 },
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
        effects: { money: -200, heat: 0, rep: 10, dirtyMoney: 0, crewDamage: 0 },
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
        effects: { money: 0, heat: 15, rep: 20, dirtyMoney: 0, crewDamage: 5 },
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
        effects: { money: 0, heat: 15, rep: -10, dirtyMoney: 7000, crewDamage: 10 },
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
        effects: { money: 1000, heat: -5, rep: 15, dirtyMoney: 0, crewDamage: 0 },
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
        effects: { money: 8000, heat: 10, rep: -15, dirtyMoney: 0, crewDamage: 10 },
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
        effects: { money: 0, heat: -5, rep: 15, dirtyMoney: 0, crewDamage: 0 },
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
        effects: { money: 6000, heat: 5, rep: -5, dirtyMoney: 0, crewDamage: 10 },
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
        effects: { money: 2000, heat: 8, rep: 20, dirtyMoney: 0, crewDamage: 10 },
      },
      {
        id: 'pr_takeover', label: 'NEEM HET OVER', stat: 'charm', difficulty: 30,
        successText: '"Ik bescherm je voortaan. €500 per week." Een nieuwe inkomstenbron.',
        failText: 'De winkelier vertrouwt je niet. "Jij bent net als zij."',
        effects: { money: 500, heat: 5, rep: -5, dirtyMoney: 0, crewDamage: 0 },
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
        successText: 'Je drukt zijn arm tegen de tafel! De bar barst los in gejuich. De verliezer schuift mompelend €500 over de tafel. Je reputatie stijgt.',
        failText: 'Hij is sterker dan je dacht. Je arm knalt tegen het hout. €500 lichter, maar je hebt lef getoond.',
        effects: { money: 500, heat: 0, rep: 10, dirtyMoney: 0, crewDamage: 0 },
        minigame: 'arm_wrestle',
      },
      {
        id: 'iaw_bet_big', label: '💰 VERHOOG NAAR €2.000', stat: 'charm', difficulty: 45,
        successText: 'Je gooit €2.000 op tafel. De spanning stijgt. Na een epische strijd win je! De menigte scandeert je naam.',
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
    text: 'Bij de dokken van Port Nero zit een groep havenarbeiders rond een krat te dobbelen. Een oudere man met een litteken kijkt op. "Kom erbij, vriend. €300 buy-in. We spelen eerlijk... meestal."',
    districts: ['port'],
    minDay: 2,
    choices: [
      {
        id: 'pdg_play', label: '🎲 GOOI DE DOBBELSTENEN', stat: 'brains', difficulty: 30,
        successText: 'Je gooit een perfecte 7! De groep gromt, maar betaalt uit. €600 winst en respect bij de dokwerkers.',
        failText: 'Snake eyes. De groep grijnst terwijl ze je geld oppakken. Beter geluk volgende keer.',
        effects: { money: 600, heat: 0, rep: 5, dirtyMoney: 0, crewDamage: 0 },
        minigame: 'dice',
      },
      {
        id: 'pdg_high_stakes', label: '💎 HIGH STAKES (€1.500)', stat: 'charm', difficulty: 50,
        successText: 'Je gooit voor het grote geld en wint! €3.000 — de dokwerkers noemen je "Lucky." Nieuwe connecties op de kade.',
        failText: 'De dobbelstenen zijn je niet gunstig gezind. €1.500 armer. De oudere man knipoogt — "Komt goed, jongen."',
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
];

// ========== EVENT LOGIC ==========

const EVENT_CHANCE_ON_TRAVEL = 0.20;
const EVENT_CHANCE_ON_END_TURN = 0.15;
const EVENT_CHANCE_ON_SOLO_OP = 0.12;

export function rollStreetEvent(
  state: GameState,
  trigger: 'travel' | 'end_turn' | 'solo_op'
): StreetEvent | null {
  // Already have a pending event
  if (state.pendingStreetEvent) return null;

  const chance =
    trigger === 'travel' ? EVENT_CHANCE_ON_TRAVEL :
    trigger === 'end_turn' ? EVENT_CHANCE_ON_END_TURN :
    EVENT_CHANCE_ON_SOLO_OP;

  if (Math.random() > chance) return null;

  // Filter eligible events
  const eligible = STREET_EVENTS.filter(e => {
    if (e.minDay && state.day < e.minDay) return false;
    if (e.minRep && state.rep < e.minRep) return false;
    if (e.districts && !e.districts.includes(state.loc)) return false;
    return true;
  });

  if (eligible.length === 0) return null;

  return eligible[Math.floor(Math.random() * eligible.length)];
}

export function getEventText(event: StreetEvent, district: DistrictId): string {
  return event.districtVariants?.[district] || event.text;
}

export function resolveStreetChoice(
  state: GameState,
  event: StreetEvent,
  choiceId: string,
  forceResult?: 'success' | 'fail'
): { success: boolean; text: string; effects: StreetEventChoice['effects'] } {
  const choice = event.choices.find(c => c.id === choiceId);
  if (!choice) return { success: false, text: 'Onbekende keuze.', effects: { money: 0, heat: 0, rep: 0, dirtyMoney: 0, crewDamage: 0 } };

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
      money: Math.min(0, choice.effects.money), // Only negative money on fail
      heat: Math.max(0, choice.effects.heat + 3), // Extra heat on fail
      rep: Math.min(0, choice.effects.rep), // Only negative rep on fail
      dirtyMoney: 0,
      crewDamage: Math.max(0, choice.effects.crewDamage + 5), // Extra damage on fail
    },
  };
}
