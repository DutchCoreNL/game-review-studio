import { MissionEncounter, MissionChoice, ActiveMission, GameState, DistrictId, StatId, WeatherType } from './types';
import { SOLO_OPERATIONS, DISTRICTS } from './constants';
import { getPlayerStat, splitHeat } from './engine';

// ========== ENCOUNTER DATABASE — SOLO ==========

const SOLO_ENCOUNTERS: Record<string, MissionEncounter[]> = {
  pickpocket: [
    {
      id: 'pp_1',
      text: 'Je ziet een zakenman met een dikke portemonnee bij het station. Hij staat te bellen en let niet op.',
      districtVariants: {
        port: 'Bij de containers staat een dronken havenarbeider. Zijn loonzakje steekt uit zijn achterzak.',
        crown: 'Een rijke investeerder stapt uit een taxi bij het penthouse. Zijn Rolex schittert in het licht.',
        iron: 'Een voorman van de fabriek telt zijn weekgeld bij de poort. Hij is alleen.',
        low: 'Een dealer telt zijn cash in een steegje. Hij is afgeleid door zijn telefoon.',
        neon: 'Een dronken gokker wankelt uit het casino. Zijn zakken puilen uit.',
      },
      choices: [
        {
          id: 'pp_1a', label: 'AFLEIDEN & GRAAIEN', stat: 'charm', difficulty: 30,
          outcomes: { success: 'Je vraagt de weg en pikt zijn portemonnee zonder dat hij het merkt. Smooth.', partial: 'Je grijpt de portemonnee maar hij voelt het. Je rent weg voordat hij reageert.', fail: 'Hij trapt er niet in en roept om hulp. Je moet vluchten.' },
          effects: { heat: 3, relChange: 0, crewDamage: 0, bonusReward: 50 },
        },
        {
          id: 'pp_1b', label: 'SNELLE VINGERS', stat: 'brains', difficulty: 35,
          outcomes: { success: 'Met chirurgische precisie lift je zijn portemonnee. Hij merkt niets.', partial: 'Je hebt de portemonnee maar laat bijna je telefoon vallen. Net op tijd weg.', fail: 'Hij voelt je hand en grijpt je pols. Je trekt je los maar bent leeg.' },
          effects: { heat: 2, relChange: 0, crewDamage: 0, bonusReward: 80 },
        },
        {
          id: 'pp_1c', label: 'DUWTRUC', stat: 'muscle', difficulty: 25,
          outcomes: { success: 'Je botst tegen hem aan en pikt alles in één beweging. Klassiek.', partial: 'Je duwt te hard — hij valt. Je grijpt de portemonnee en rent.', fail: 'Hij duwt terug en schreeuwt. Voorbijgangers kijken. Weg hier.' },
          effects: { heat: 5, relChange: 0, crewDamage: 0, bonusReward: 30 },
        },
      ],
    },
    {
      id: 'pp_2',
      text: 'Je hebt buit! Maar een beveiliger heeft je zien lopen. Hij praat in zijn radio.',
      districtVariants: {
        port: 'Een havenbewaker wijst naar je. De hekken gaan dicht.',
        crown: 'Beveiligingscamera\'s draaien. Een drone komt dichterbij.',
        iron: 'Een grote kerel met een honkbalknuppel verspert de uitgang.',
        low: 'Een groepje straatjochies heeft je gezien. Ze willen een deel.',
        neon: 'De uitsmijter van het casino blokkeert de steeg. "Geef terug."',
      },
      choices: [
        {
          id: 'pp_2a', label: 'WEGRENNEN', stat: 'muscle', difficulty: 20,
          outcomes: { success: 'Je sprint door de steegjes en bent ze kwijt. Schone ontsnapping.', partial: 'Je ontsnapt maar bent buiten adem. Een deel van de buit valt uit je zak.', fail: 'Je wordt ingehaald. Ze pakken de helft van je buit.' },
          effects: { heat: 3, relChange: 0, crewDamage: 0, bonusReward: 0 },
        },
        {
          id: 'pp_2b', label: 'VERSTOPPEN', stat: 'brains', difficulty: 30,
          outcomes: { success: 'Je duikt een winkel in en wacht tot het veilig is. Niemand ziet je.', partial: 'Je verstopt je achter een container. Ze lopen voorbij, maar het was close.', fail: 'Je verstopplek wordt gevonden. Extra heat opgelopen.' },
          effects: { heat: -2, relChange: 0, crewDamage: 0, bonusReward: 20 },
        },
      ],
    },
    // NEW encounter — negotiation with a fence
    {
      id: 'pp_3',
      text: 'Een heler in een achterafgelegen kroeg biedt je aan om de buit op te kopen. Maar zijn prijs is laag.',
      districtVariants: {
        crown: 'De heler is een galeriehouder die "speciale stukken" verkoopt aan rijke verzamelaars.',
        neon: 'De barman van de Velvet Room fluistert: "Ik ken iemand die dat wil hebben."',
        low: 'Een oude vrouw in een rommelwinkel bekijkt je buit met een loep. "Ik geef je de helft."',
      },
      choices: [
        {
          id: 'pp_3a', label: 'ONDERHANDELEN', stat: 'charm', difficulty: 35,
          outcomes: { success: 'Je praat de prijs omhoog. De heler grijnst — hij respecteert je lef.', partial: 'Hij geeft iets meer, maar niet wat het waard is. Beter dan niets.', fail: 'Hij trekt zijn aanbod in. "Te veel gedoe. Ga maar weg."' },
          effects: { heat: 0, relChange: 2, crewDamage: 0, bonusReward: 120 },
        },
        {
          id: 'pp_3b', label: 'ZELF VERKOPEN', stat: 'brains', difficulty: 40,
          outcomes: { success: 'Je vindt online een koper die het dubbele betaalt. Slim.', partial: 'De deal duurt langer maar je krijgt een redelijke prijs.', fail: 'De koper is een undercover agent. Je dumpt alles en rent.' },
          effects: { heat: 4, relChange: 0, crewDamage: 0, bonusReward: 200 },
        },
        {
          id: 'pp_3c', label: 'DREIGEN', stat: 'muscle', difficulty: 30,
          outcomes: { success: '"Betaal wat het waard is, of ik zoek een andere heler — en vertel iedereen over jou."', partial: 'Hij betaalt meer uit angst, maar je hebt een vijand gemaakt.', fail: 'Hij trekt een mes onder de toonbank. "Wegwezen."' },
          effects: { heat: 3, relChange: -3, crewDamage: 5, bonusReward: 150 },
        },
      ],
    },
    // NEW encounter — unexpected twist
    {
      id: 'pp_4',
      text: 'In de gestolen portemonnee vind je een briefje: "Ontmoet me bij de brug. Middernacht. Breng het pakket." Er zit een sleutel bij.',
      districtVariants: {
        port: 'De sleutel past op een kluisje in het havenkantoor. Wat zit erin?',
        iron: 'Het briefje verwijst naar een verlaten fabriek. Een val of een kans?',
      },
      choices: [
        {
          id: 'pp_4a', label: 'ONDERZOEKEN', stat: 'brains', difficulty: 45,
          outcomes: { success: 'Het kluisje bevat documenten die duizenden waard zijn op de zwarte markt.', partial: 'Je vindt het kluisje maar het alarm gaat af. Je grijpt wat je kunt.', fail: 'Het is een val van de politie. Je ontsnapt maar net.' },
          effects: { heat: 5, relChange: 0, crewDamage: 0, bonusReward: 300 },
        },
        {
          id: 'pp_4b', label: 'NEGEREN', stat: 'charm', difficulty: 15,
          outcomes: { success: 'Je gooit het briefje weg. Niet jouw probleem. Veilige keuze.', partial: 'Je aarzelt maar besluit het te laten. Toch blijft het knagen.', fail: 'Je aarzeling trekt aandacht. Iemand heeft je de sleutel zien pakken.' },
          effects: { heat: 0, relChange: 0, crewDamage: 0, bonusReward: 0 },
        },
      ],
    },
  ],

  atm_skimming: [
    {
      id: 'atm_1',
      text: 'De ATM staat op een rustige hoek. Je hebt je skimmer-apparaat klaar. Maar er hangt een camera boven.',
      districtVariants: {
        crown: 'De ATM in Crown Heights heeft een geavanceerd beveiligingssysteem. Maar de beloning is groter.',
        port: 'De ATM bij de haven is oud en roestig. Makkelijker te hacken, maar de buurt is gevaarlijk.',
        neon: 'De ATM naast het casino wordt druk bezocht. Meer slachtoffers, maar ook meer ogen.',
      },
      choices: [
        {
          id: 'atm_1a', label: 'CAMERA UITSCHAKELEN', stat: 'brains', difficulty: 40,
          outcomes: { success: 'Je hackt de camera-feed. Niemand zal het bewijs zien.', partial: 'De camera loopt nog maar je draait hem weg. Deels effectief.', fail: 'Het alarm gaat af als je de camera aanraakt. Snel handelen!' },
          effects: { heat: -5, relChange: 0, crewDamage: 0, bonusReward: 200 },
        },
        {
          id: 'atm_1b', label: 'GEZICHT BEDEKKEN', stat: 'charm', difficulty: 25,
          outcomes: { success: 'Met je hoodie en zonnebril ben je onherkenbaar. Camera is geen probleem.', partial: 'Je vermomming is matig. Een deel van je gezicht is zichtbaar.', fail: 'Je hoodie waait af op het verkeerde moment. Perfect op camera.' },
          effects: { heat: 2, relChange: 0, crewDamage: 0, bonusReward: 50 },
        },
        {
          id: 'atm_1c', label: 'SNEL HANDELEN', stat: 'muscle', difficulty: 35,
          outcomes: { success: 'In 30 seconden is de skimmer geplaatst. Record tijd.', partial: 'Je bent snel maar niet snel genoeg. Een voorbijganger kijkt vreemd.', fail: 'Je vingers trillen. De skimmer valt en breekt. Missie mislukt.' },
          effects: { heat: 5, relChange: 0, crewDamage: 0, bonusReward: 100 },
        },
      ],
    },
    {
      id: 'atm_2',
      text: 'De skimmer draait. Na een uur heb je al data van tientallen kaarten. Dan stopt er een politieauto.',
      districtVariants: {
        crown: 'Een privébeveiliger op een segway nadert. Hij controleert de ATM.',
        low: 'Een stel junks wil je skimmer stelen. Ze denken dat het drugs bevat.',
      },
      choices: [
        {
          id: 'atm_2a', label: 'RUSTIG WEGWANDELEN', stat: 'charm', difficulty: 35,
          outcomes: { success: 'Je wandelt ontspannen weg alsof je een normale burger bent. Niemand verdenkt je.', partial: 'Je loopt weg maar vergeet de skimmer op te halen. Minder data.', fail: 'De agent roept je. Je moet rennen. De skimmer is verloren.' },
          effects: { heat: -3, relChange: 0, crewDamage: 0, bonusReward: 150 },
        },
        {
          id: 'atm_2b', label: 'SKIMMER SNEL VERWIJDEREN', stat: 'brains', difficulty: 40,
          outcomes: { success: 'Je verwijdert de skimmer in seconden en loopt weg met alle data. Perfect.', partial: 'Je haalt de skimmer eruit maar verliest een deel van de data.', fail: 'De skimmer zit vast. Je trekt te hard en de ATM piept alarm.' },
          effects: { heat: 0, relChange: 0, crewDamage: 0, bonusReward: 300 },
        },
      ],
    },
    // NEW — rival hacker encounter
    {
      id: 'atm_3',
      text: 'Als je de data bekijkt, merk je dat iemand anders ook aan het skimmen is — dezelfde ATM, andere frequentie.',
      districtVariants: {
        neon: 'De rivaal is een bekende hacker van de Neon Strip. Hij weet wie je bent.',
        iron: 'Het signaal komt uit een busje aan de overkant. Iron Skulls-logo op de zijkant.',
      },
      choices: [
        {
          id: 'atm_3a', label: 'SIGNAAL KAPEN', stat: 'brains', difficulty: 50,
          outcomes: { success: 'Je kapt zijn signaal en steelt ook zijn data. Dubbele buit!', partial: 'Je blokkeert zijn signaal maar hij merkt het. Hij is boos maar machteloos.', fail: 'Hij is beter dan jij. Hij kapt jouw data en verdwijnt.' },
          effects: { heat: 3, relChange: -2, crewDamage: 0, bonusReward: 400 },
        },
        {
          id: 'atm_3b', label: 'SAMENWERKEN', stat: 'charm', difficulty: 35,
          outcomes: { success: '"We splitsen de opbrengst. Geen gedoe." Hij stemt in. Nieuwe contactpersoon.', partial: 'Hij is wantrouwig maar gaat akkoord. Beperkte samenwerking.', fail: 'Hij vertrouwt niemand. Hij pakt zijn spullen en vertrekt — met jouw skimmer.' },
          effects: { heat: 0, relChange: 3, crewDamage: 0, bonusReward: 200 },
        },
        {
          id: 'atm_3c', label: 'CONFRONTEREN', stat: 'muscle', difficulty: 30,
          outcomes: { success: 'Je loopt naar het busje en klopt op het raam. "Dit is mijn plek." Hij rijdt weg.', partial: 'Hij schreeuwt maar maakt zich uit de voeten. Wel wat tumult.', fail: 'Hij heeft een taser. Je ligt op de grond voordat je het weet.' },
          effects: { heat: 5, relChange: -3, crewDamage: 8, bonusReward: 100 },
        },
      ],
    },
  ],

  car_theft: [
    {
      id: 'ct_1',
      text: 'De zwarte BMW staat geparkeerd in een verlaten straat. Een bewaker loopt zijn ronde. Het regent.',
      districtVariants: {
        port: 'Een Porsche Cayenne staat bij Dok 7 tussen de containers. De eigenaar is binnen aan het onderhandelen.',
        crown: 'Een Lamborghini staat voor het penthouse. Valet parking is even weg. De sleutel zit misschien nog in het contact.',
        iron: 'Een gepantserde Mercedes staat bij de fabriek. De eigenaar is de Iron Skulls baas.',
        low: 'Een opgevoerde Honda Civic staat in het steegje. Niet duur maar snel — perfect voor een snelle klus.',
        neon: 'Een Ferrari staat fout geparkeerd bij de club. De eigenaar is binnen aan het feesten.',
      },
      choices: [
        {
          id: 'ct_1a', label: 'FORCEER HET SLOT', stat: 'muscle', difficulty: 45,
          outcomes: { success: 'Het slot breekt open. Je glijdt achter het stuur.', partial: 'Het slot breekt maar het alarm gaat kort af. Je moet snel zijn.', fail: 'Het slot zit muurvast. Je maakt te veel lawaai.' },
          effects: { heat: 8, relChange: 0, crewDamage: 0, bonusReward: 200 },
        },
        {
          id: 'ct_1b', label: 'HACK DE SLEUTEL', stat: 'brains', difficulty: 50,
          outcomes: { success: 'Je relay-device pikt het signaal op. De auto opent geluidloos. Elegant.', partial: 'Het signaal is zwak maar je krijgt de auto open na meerdere pogingen.', fail: 'Het signaal wordt geblokkeerd. Nieuwer model dan verwacht.' },
          effects: { heat: 3, relChange: 0, crewDamage: 0, bonusReward: 500 },
        },
        {
          id: 'ct_1c', label: 'LEID DE BEWAKER AF', stat: 'charm', difficulty: 40,
          outcomes: { success: '"He! Daar wordt iemand beroofd!" De bewaker rent weg. Je hebt alle tijd.', partial: 'De bewaker aarzelt maar loopt uiteindelijk weg. Je hebt weinig tijd.', fail: 'De bewaker gelooft er niks van. Hij belt de politie.' },
          effects: { heat: 5, relChange: 0, crewDamage: 0, bonusReward: 300 },
        },
      ],
    },
    {
      id: 'ct_2',
      text: 'Je zit achter het stuur. De motor ronkt. Maar in je spiegel zie je koplampen — iemand achtervolgt je.',
      districtVariants: {
        port: 'De havenpolitie blokkeert de uitgang. Zoeklichten zwaaien over het terrein.',
        crown: 'Een drone volgt je met een felle schijnwerper. Privébeveiliging.',
        iron: 'Twee motoren van de Iron Skulls zitten achter je aan.',
        neon: 'De valet parking-jongen rent achter je aan, schreeuwend in zijn radio.',
      },
      choices: [
        {
          id: 'ct_2a', label: 'SCHEUR WEG', stat: 'muscle', difficulty: 40,
          outcomes: { success: 'Je trapt het gaspedaal in en laat ze achter je. De stad is een blur.', partial: 'Je ontsnapt maar schampt een lantaarnpaal. De auto heeft een deuk.', fail: 'Je verliest de controle en crasht bijna. Ze halen je in.' },
          effects: { heat: 10, relChange: 0, crewDamage: 5, bonusReward: 0 },
        },
        {
          id: 'ct_2b', label: 'NEEM DE SLUIPROUTE', stat: 'brains', difficulty: 45,
          outcomes: { success: 'Je kent een steegje dat te smal is voor hun auto. Verdwenen als een geest.', partial: 'De sluiproute werkt maar je moet langzaam rijden. Het kost je tijd.', fail: 'Het steegje is geblokkeerd door bouwwerken. Doodlopend.' },
          effects: { heat: 2, relChange: 0, crewDamage: 0, bonusReward: 200 },
        },
        {
          id: 'ct_2c', label: 'BEL EEN CONTACT', stat: 'charm', difficulty: 35,
          outcomes: { success: 'Je belt een vriend die de weg blokkeert. Je achtervolgers zijn gestrand.', partial: 'Je contact is laat maar komt net op tijd. Nipte ontsnapping.', fail: 'Geen gehoor. Je staat er alleen voor.' },
          effects: { heat: 0, relChange: 5, crewDamage: 0, bonusReward: 100 },
        },
      ],
    },
    // NEW — betrayal encounter
    {
      id: 'ct_3',
      text: 'De auto is afgeleverd bij de heler, maar hij zegt dat de eigenaar een bounty op je hoofd heeft gezet. Iemand heeft gepraat.',
      districtVariants: {
        iron: 'De Iron Skulls beweren dat de auto van hen was. Ze willen gecompenseerd worden.',
        crown: 'De eigenaar is een politicus. Hij heeft privédetectives ingehuurd om je te vinden.',
      },
      choices: [
        {
          id: 'ct_3a', label: 'HET LIJK VERBERGEN', stat: 'brains', difficulty: 45,
          outcomes: { success: 'Je wist alle sporen. De auto was nooit gestolen. Forensisch schoon.', partial: 'De meeste sporen zijn weg, maar er is nog een getuige.', fail: 'De politie heeft al DNA-materiaal. Te laat.' },
          effects: { heat: -5, relChange: 0, crewDamage: 0, bonusReward: 100 },
        },
        {
          id: 'ct_3b', label: 'DE VERRADER VINDEN', stat: 'muscle', difficulty: 40,
          outcomes: { success: 'Je vindt degene die heeft gepraat. Na een "gesprek" zal hij zwijgen.', partial: 'Je vindt hem maar hij is al gevlucht. Tenminste weet je wie het was.', fail: 'Het was een val. De verrader had backup.' },
          effects: { heat: 8, relChange: -5, crewDamage: 10, bonusReward: 0 },
        },
        {
          id: 'ct_3c', label: 'DEAL SLUITEN', stat: 'charm', difficulty: 35,
          outcomes: { success: 'Je biedt de eigenaar een deel van de opbrengst aan. Hij trekt de bounty in.', partial: 'Hij wil meer dan verwacht, maar uiteindelijk bereiken jullie een akkoord.', fail: 'Hij wil alles terug plus schadevergoeding. Geen deal.' },
          effects: { heat: -3, relChange: 2, crewDamage: 0, bonusReward: -100 },
        },
      ],
    },
    // NEW — chase encounter
    {
      id: 'ct_4',
      text: 'Een rivaliserende autodief heeft dezelfde auto op het oog. Jullie staan oog in oog op de parkeerplaats.',
      districtVariants: {
        neon: 'Het is een bekende racer van de Strip. Hij daagt je uit: wie eerst bij de auto is.',
        port: 'Een havenrat met een sloophammer loopt op de auto af. Hij wil hem strippen.',
      },
      choices: [
        {
          id: 'ct_4a', label: 'RACE ERNAARTOE', stat: 'muscle', difficulty: 35,
          outcomes: { success: 'Je bent sneller. De sleutel is in je hand voor hij halverwege is.', partial: 'Jullie komen tegelijk aan. Een kort gevecht, maar jij wint.', fail: 'Hij is sneller en groter. De auto is van hem.' },
          effects: { heat: 5, relChange: 0, crewDamage: 5, bonusReward: 150 },
        },
        {
          id: 'ct_4b', label: 'SLIM SPELEN', stat: 'brains', difficulty: 40,
          outcomes: { success: 'Je hebt het alarm al uitgeschakeld terwijl hij nog staat te kijken. De auto start.', partial: 'Je hackt het slot maar hij probeert in te stappen. Je rijdt weg met een open deur.', fail: 'Je techniek faalt onder druk. Hij lacht en rijdt weg.' },
          effects: { heat: 3, relChange: 0, crewDamage: 0, bonusReward: 300 },
        },
        {
          id: 'ct_4c', label: 'ONDERHANDELEN', stat: 'charm', difficulty: 30,
          outcomes: { success: '"Er zijn genoeg auto\'s. Neem jij de Audi, ik neem de BMW." Deal.', partial: 'Hij wil een percentage. Minder winst, maar geen problemen.', fail: 'Hij vertrouwt je niet. Het escaleert.' },
          effects: { heat: 0, relChange: 3, crewDamage: 0, bonusReward: 50 },
        },
      ],
    },
  ],

  store_robbery: [
    {
      id: 'sr_1',
      text: 'De juwelier is bijna leeg. Eén klant, één bewaker, drie vitrines vol diamanten.',
      districtVariants: {
        crown: 'De exclusieve juwelier in Crown Heights. Kogelvrij glas, laserbeveiliging, maar de buit is het dubbele waard.',
        iron: 'Een pandjesbaas in Iron Borough. Minder beveiliging, maar de buurt let op.',
        low: 'Een goudhandelaar in Lowrise. Simpele vitrine, maar de eigenaar heeft een shotgun onder de toonbank.',
        neon: 'Een luxe horlogewinkel op de Strip. Druk met toeristen — perfect dekking.',
      },
      choices: [
        {
          id: 'sr_1a', label: 'WAPEN TREKKEN', stat: 'muscle', difficulty: 50,
          outcomes: { success: '"IEDEREEN OP DE GROND!" Paniek. De bewaker bevriest. Je hebt controle.', partial: 'De bewaker aarzelt maar gehoorzaamt. De klant probeert te vluchten.', fail: 'De bewaker trekt zijn wapen. Dit wordt een vuurgevecht.' },
          effects: { heat: 15, relChange: 0, crewDamage: 10, bonusReward: 500 },
        },
        {
          id: 'sr_1b', label: 'AFLEIDINGSMANEUVER', stat: 'charm', difficulty: 45,
          outcomes: { success: 'Je creëert een scène buiten. Terwijl iedereen kijkt, grijp je de buit.', partial: 'De afleiding werkt half. De bewaker is afgeleid maar de eigenaar niet.', fail: 'Niemand trapt erin. De bewaker wordt juist alerter.' },
          effects: { heat: 8, relChange: 0, crewDamage: 0, bonusReward: 300 },
        },
        {
          id: 'sr_1c', label: 'GLAS HACKEN', stat: 'brains', difficulty: 55,
          outcomes: { success: 'Je schakelt het alarm uit en snijdt het glas. Chirurgische precisie.', partial: 'Het alarm gaat af na 30 seconden. Je grijpt wat je kunt.', fail: 'Het beveiligingssysteem is te geavanceerd. Het alarm gilt door de straat.' },
          effects: { heat: 5, relChange: 0, crewDamage: 0, bonusReward: 800 },
        },
      ],
    },
    {
      id: 'sr_2',
      text: 'Je hebt de buit! Maar buiten hoor je sirenes. De politie is snel vandaag.',
      districtVariants: {
        port: 'De havenpolitie nadert. Je hoort een helikopter.',
        crown: 'Privébeveiliging blokkeert beide uitgangen. Professioneel.',
        low: 'De buurt is opgezet. Mensen blokkeren de straat.',
      },
      choices: [
        {
          id: 'sr_2a', label: 'ACHTERUITGANG', stat: 'brains', difficulty: 40,
          outcomes: { success: 'Je vindt de nooduitgang en verdwijnt in de steegjes. Spoorloos.', partial: 'De nooduitgang is op slot. Je forceert hem maar verliest tijd.', fail: 'De nooduitgang leidt naar een doodlopende steeg. Je zit vast.' },
          effects: { heat: -5, relChange: 0, crewDamage: 0, bonusReward: 200 },
        },
        {
          id: 'sr_2b', label: 'DOORBRÉKEN', stat: 'muscle', difficulty: 50,
          outcomes: { success: 'Je rent door de politielinie alsof ze er niet staan. Puur adrenaline.', partial: 'Je breekt door maar raakt gewond. De buit is veilig.', fail: 'Je wordt getackeld. Een deel van de buit valt op straat.' },
          effects: { heat: 12, relChange: 0, crewDamage: 15, bonusReward: 0 },
        },
      ],
    },
    // NEW — hostage negotiation encounter
    {
      id: 'sr_3',
      text: 'De bewaker heeft de noodknop ingedrukt. De politie is onderweg. Een klant begint te schreeuwen. Dit escaleert snel.',
      districtVariants: {
        crown: 'De klant is de vrouw van een raadslid. Dit kan diplomatiek interessant zijn — of een nachtmerrie.',
        neon: 'De paniek trekt een menigte. Camera\'s flitsen. Je bent live op sociale media.',
      },
      choices: [
        {
          id: 'sr_3a', label: 'GIJZELINGSSITUATIE', stat: 'muscle', difficulty: 55,
          outcomes: { success: 'Je neemt de controle. De politie durft niet binnen te komen. Je dicteert de voorwaarden.', partial: 'De situatie stabiliseert maar de spanning is om te snijden. Je hebt weinig tijd.', fail: 'De SWAT-eenheid is sneller dan verwacht. Ze stormen binnen.' },
          effects: { heat: 20, relChange: -5, crewDamage: 15, bonusReward: 600 },
        },
        {
          id: 'sr_3b', label: 'IEDEREEN KALMEREN', stat: 'charm', difficulty: 45,
          outcomes: { success: '"Luister, niemand hoeft gewond te raken. Jullie laten mij gaan, en dat is het." Ze gehoorzamen.', partial: 'De klant kalmeert maar de bewaker is nog steeds een probleem.', fail: 'De paniek escaleert. Iemand probeert je wapen af te pakken.' },
          effects: { heat: 8, relChange: 0, crewDamage: 5, bonusReward: 300 },
        },
        {
          id: 'sr_3c', label: 'ROOKBOM GOOIEN', stat: 'brains', difficulty: 40,
          outcomes: { success: 'De rook vult de winkel. In de chaos glijp je naar buiten met de buit.', partial: 'De rook werkt maar je botst tegen een vitrine. Minder buit.', fail: 'De rookbom ontploft niet. Iedereen staart je aan.' },
          effects: { heat: 10, relChange: 0, crewDamage: 0, bonusReward: 400 },
        },
      ],
    },
  ],

  crypto_heist: [
    {
      id: 'ch_1',
      text: 'De cold storage wallet is verbonden met een air-gapped systeem in een serverruimte. Je hebt 10 minuten.',
      districtVariants: {
        crown: 'De serverruimte van een hedgefund in Crown Heights. State-of-the-art beveiliging.',
        neon: 'Een illegaal crypto-kantoor achter een club. Minder beveiliging, maar meer bewakers.',
      },
      choices: [
        {
          id: 'ch_1a', label: 'EXPLOIT DRAAIEN', stat: 'brains', difficulty: 65,
          outcomes: { success: 'Je zero-day exploit breekt de firewall. De wallet is open. Transferring...', partial: 'De exploit werkt half. Je krijgt toegang maar het systeem logt alles.', fail: 'De firewall detecteert de exploit. Lockdown geactiveerd.' },
          effects: { heat: 5, relChange: 0, crewDamage: 0, bonusReward: 3000 },
        },
        {
          id: 'ch_1b', label: 'SOCIAL ENGINEERING', stat: 'charm', difficulty: 55,
          outcomes: { success: 'Je belt de systeembeheerder en doet je voor als IT-support. Hij geeft je het wachtwoord.', partial: 'Hij is wantrouwig maar geeft je een hint. Genoeg om binnen te komen.', fail: 'Hij doorziet je en belt de politie.' },
          effects: { heat: 3, relChange: 0, crewDamage: 0, bonusReward: 2000 },
        },
        {
          id: 'ch_1c', label: 'USB DRIVE PLAATSEN', stat: 'muscle', difficulty: 50,
          outcomes: { success: 'Je sluipt de serverruimte in en plugt de USB in. De malware doet de rest.', partial: 'Je wordt bijna betrapt maar de USB is geplaatst. Haastig werk.', fail: 'Een bewaker ziet je en trekt zijn wapen. Missie afgebroken.' },
          effects: { heat: 8, relChange: 0, crewDamage: 5, bonusReward: 1500 },
        },
      ],
    },
    {
      id: 'ch_2',
      text: 'De transfer loopt. 80%... 90%... Dan flikkert het scherm. Iemand probeert de transfer te stoppen.',
      districtVariants: {
        crown: 'Hun counter-hacker is online. Hij probeert je IP te tracen.',
      },
      choices: [
        {
          id: 'ch_2a', label: 'COUNTER-HACK', stat: 'brains', difficulty: 60,
          outcomes: { success: 'Je overvleugelt hun hacker en voltooit de transfer. 100%. Winnaar.', partial: 'Je houdt hem tegen maar verliest een deel van de transfer.', fail: 'Hij tracet je locatie. De politie is onderweg.' },
          effects: { heat: 3, relChange: 0, crewDamage: 0, bonusReward: 2000 },
        },
        {
          id: 'ch_2b', label: 'STROOM ERUIT TREKKEN', stat: 'muscle', difficulty: 35,
          outcomes: { success: 'Je trekt de stekker uit hun server. Transfer bevroren op 95% — genoeg.', partial: 'De server heeft een UPS. Je hebt meer tijd nodig.', fail: 'Je trekt de verkeerde kabel. Je eigen verbinding valt uit.' },
          effects: { heat: 5, relChange: 0, crewDamage: 0, bonusReward: 500 },
        },
      ],
    },
    // NEW — insider betrayal
    {
      id: 'ch_3',
      text: 'Je insider-contact stuurt een bericht: "Plans zijn veranderd. Er is een extra beveiligingslaag. Ik wil meer geld."',
      districtVariants: {
        crown: 'De insider werkt voor de CFO. Hij kan het hele systeem platleggen — voor de juiste prijs.',
        neon: 'Je contact blijkt voor twee partijen te werken. Hij verkoopt info aan de hoogste bieder.',
      },
      choices: [
        {
          id: 'ch_3a', label: 'EXTRA BETALEN', stat: 'charm', difficulty: 40,
          outcomes: { success: 'Het extra geld overtuigt hem. Hij schakelt de beveiliging uit. Doorgang vrij.', partial: 'Hij wil meer, maar uiteindelijk geeft hij je gedeeltelijke toegang.', fail: 'Hij neemt het geld en verdwijnt. Geen informatie, geen toegang.' },
          effects: { heat: 2, relChange: 0, crewDamage: 0, bonusReward: 1500 },
        },
        {
          id: 'ch_3b', label: 'DREIGEN', stat: 'muscle', difficulty: 45,
          outcomes: { success: '"Ik weet waar je woont. Doe wat je moet doen." Hij gehoorzaamt trillend.', partial: 'Hij doet het, maar je weet dat hij je gaat verraden zodra het kan.', fail: 'Hij belt de beveiliging. "Er is een indringer."' },
          effects: { heat: 5, relChange: -5, crewDamage: 5, bonusReward: 2000 },
        },
        {
          id: 'ch_3c', label: 'ZELF HACKEN', stat: 'brains', difficulty: 55,
          outcomes: { success: 'Wie heeft hem nodig? Je kraakt de extra laag zelf. Pure vaardigheid.', partial: 'Het kost je meer tijd maar je komt erdoor. Net op tijd.', fail: 'De extra beveiliging is te complex. Zonder de insider kom je er niet in.' },
          effects: { heat: 3, relChange: 0, crewDamage: 0, bonusReward: 2500 },
        },
      ],
    },
    // NEW — post-heist chase
    {
      id: 'ch_4',
      text: 'De crypto is overgemaakt maar het gebouw gaat in lockdown. Alle deuren sluiten. Er zijn 60 seconden tot de politie arriveert.',
      districtVariants: {
        crown: 'Het penthouse heeft een helikopterplatform op het dak. Als je daar komt...',
        neon: 'De nooduitgang leidt naar de dansvloer van de club. Verdwijn in de menigte.',
      },
      choices: [
        {
          id: 'ch_4a', label: 'VENTILATIESCHACHT', stat: 'brains', difficulty: 45,
          outcomes: { success: 'Je kruipt door de ventilatie naar het dak. Vrije val naar de brandtrap. Vrij.', partial: 'De schacht is smaller dan verwacht. Je komt erdoor maar bent geschaafd.', fail: 'Je zit vast in de schacht. De beveiliging vindt je.' },
          effects: { heat: 0, relChange: 0, crewDamage: 3, bonusReward: 500 },
        },
        {
          id: 'ch_4b', label: 'DEUR FORCEREN', stat: 'muscle', difficulty: 50,
          outcomes: { success: 'De deur geeft mee na drie schoppen. Je rent de straat op en verdwijnt.', partial: 'De deur buigt maar breekt niet helemaal. Je wurmt je erdoor.', fail: 'De deur is versterkt staal. Je voet doet pijn en je zit nog steeds vast.' },
          effects: { heat: 8, relChange: 0, crewDamage: 5, bonusReward: 0 },
        },
        {
          id: 'ch_4c', label: 'BLUF JE ERUIT', stat: 'charm', difficulty: 40,
          outcomes: { success: '"Ik ben van IT! Er was een beveiligingslek, ik heb het gefixt." Ze laten je gaan.', partial: 'Ze geloven je half. Een escorte naar de uitgang — ongemakkelijk maar je bent vrij.', fail: '"Laat je ID zien." Je hebt geen ID. De handboelen klikken.' },
          effects: { heat: -3, relChange: 0, crewDamage: 0, bonusReward: 300 },
        },
      ],
    },
  ],
};

// ========== ENCOUNTER DATABASE — CONTRACTS ==========

const CONTRACT_ENCOUNTERS: Record<string, MissionEncounter[]> = {
  delivery: [
    {
      id: 'del_1',
      text: 'Het pakket is opgehaald. De aflevering is aan de andere kant van de stad.',
      districtVariants: {
        port: 'De lading moet via de haven verscheept worden. De kustwacht patrouilleert.',
        iron: 'De route gaat door het industriegebied. Stilstaand verkeer bij de fabriek.',
        neon: 'De aflevering is bij de achterdeur van een club op de Strip. Discreet.',
      },
      choices: [
        {
          id: 'del_1a', label: 'SNELSTE ROUTE', stat: 'muscle', difficulty: 30,
          outcomes: { success: 'Vol gas door de stad. Geen problemen onderweg.', partial: 'Bijna een ongeluk maar de lading is veilig. Wel wat heat.', fail: 'Je rijdt te snel en trekt de aandacht van de politie.' },
          effects: { heat: 5, relChange: 3, crewDamage: 0, bonusReward: 100 },
        },
        {
          id: 'del_1b', label: 'SLUIPROUTE', stat: 'brains', difficulty: 35,
          outcomes: { success: 'Via de steegjes en tunnels. Niemand ziet je. Professioneel.', partial: 'De route is langer maar veilig. Beetje laat maar de klant is tevreden.', fail: 'Je verdwaalt in de tunnels. Kostbare tijd verloren.' },
          effects: { heat: -2, relChange: 5, crewDamage: 0, bonusReward: 200 },
        },
        {
          id: 'del_1c', label: 'KOERIER INHUREN', stat: 'charm', difficulty: 25,
          outcomes: { success: 'Je regelt een betrouwbare koerier. De lading komt veilig aan.', partial: 'De koerier is laat maar het lukt. Niet ideaal.', fail: 'De koerier steelt een deel van de lading. Onbetrouwbaar.' },
          effects: { heat: 0, relChange: 2, crewDamage: 0, bonusReward: 50 },
        },
      ],
    },
    // NEW — ambush during delivery
    {
      id: 'del_2',
      text: 'Halverwege de route blokkeert een busje de weg. Gemaskerde mannen stappen uit. Dit is een hinderlaag.',
      districtVariants: {
        iron: 'De Iron Skulls hebben de route gelekt. Drie motoren versperren de weg.',
        port: 'Havenratten springen van achter containers tevoorschijn. Ze willen de lading.',
        low: 'Een rivaliserende gang in Lowrise. Ze wisten precies waar je zou zijn.',
      },
      choices: [
        {
          id: 'del_2a', label: 'DOORBRÉKEN', stat: 'muscle', difficulty: 45,
          outcomes: { success: 'Je geeft gas en ramt het busje opzij. De aanvallers duiken weg.', partial: 'Je breekt door maar de lading raakt beschadigd. De klant zal niet blij zijn.', fail: 'Het busje is te zwaar. Je auto stopt. Ze openen de deuren.' },
          effects: { heat: 10, relChange: -3, crewDamage: 10, bonusReward: 0 },
        },
        {
          id: 'del_2b', label: 'OMRIJDEN', stat: 'brains', difficulty: 40,
          outcomes: { success: 'Je zag de hinderlaag net op tijd. Achteruit, zijstraat in, alternatieve route.', partial: 'Je ontsnapt maar verliest waardevolle tijd. De klant is ongeduldig.', fail: 'De zijstraat is ook geblokkeerd. Ze hadden dit gepland.' },
          effects: { heat: 3, relChange: 0, crewDamage: 0, bonusReward: 200 },
        },
        {
          id: 'del_2c', label: 'ONDERHANDELEN', stat: 'charm', difficulty: 35,
          outcomes: { success: '"We kunnen dit op twee manieren doen. Ik stel de makkelijke manier voor." Ze laten je door.', partial: 'Ze nemen een deel van de lading als "tol." Beter dan alles verliezen.', fail: 'Ze lachen. "Grappig. Geef alles." Geen onderhandeling mogelijk.' },
          effects: { heat: 2, relChange: 2, crewDamage: 0, bonusReward: -50 },
        },
      ],
    },
    // NEW — client betrayal
    {
      id: 'del_3',
      text: 'Je arriveert op de afleverlocatie. De klant is er, maar hij heeft bewapende mannen bij zich. "Ik heb besloten om niet te betalen."',
      districtVariants: {
        crown: 'De klant is een zakenman die denkt dat hij onaantastbaar is. Zijn bodyguards dragen Armani.',
        neon: 'In de VIP-lounge van een club. De klant grijnst achter een champagneglas.',
      },
      choices: [
        {
          id: 'del_3a', label: 'KRACHT TONEN', stat: 'muscle', difficulty: 50,
          outcomes: { success: 'Je kijkt de bewakers één voor één aan. "Betaal. Nu." Ze zien het in je ogen. De klant betaalt.', partial: 'Een kort gevecht. De bewakers trekken zich terug. De klant betaalt, maar niet alles.', fail: 'De bewakers zijn beter dan verwacht. Je trekt je terug — zonder betaling.' },
          effects: { heat: 8, relChange: -5, crewDamage: 10, bonusReward: 500 },
        },
        {
          id: 'del_3b', label: 'SLIM SPELEN', stat: 'brains', difficulty: 45,
          outcomes: { success: '"Ik heb een kopie van de lading-inhoud naar je concurrent gestuurd. Betaal, of iedereen weet het."', partial: 'Je bluf werkt half. Hij betaalt de helft om het risico te beperken.', fail: 'Hij roept je bluf. "Doe maar. Ik heb niets te verliezen."' },
          effects: { heat: 3, relChange: -3, crewDamage: 0, bonusReward: 400 },
        },
        {
          id: 'del_3c', label: 'WEGLOPEN', stat: 'charm', difficulty: 30,
          outcomes: { success: '"Prima. Maar vergeet niet — ik onthoud dit." Je draait je om. Hij realiseert wat dit betekent en betaalt toch.', partial: 'Je loopt weg. Geen betaling, maar ook geen problemen. De lading is weg.', fail: 'Ze schieten op je als je wegloopt. Benen maken.' },
          effects: { heat: 0, relChange: -8, crewDamage: 5, bonusReward: -100 },
        },
      ],
    },
  ],

  combat: [
    {
      id: 'cmb_1',
      text: 'Het doelwit is gespot in een verlaten pakhuis. Twee bewakers bij de ingang.',
      districtVariants: {
        iron: 'Het pakhuis in Iron Borough is versterkt. Stalen deuren, geen ramen.',
        low: 'Een kraakpand in Lowrise. Rottige muren, maar vol verrassingen.',
        port: 'Een container aan de kade. Beperkte ruimte, maar ook beperkte ontsnapping.',
      },
      choices: [
        {
          id: 'cmb_1a', label: 'FRONTALE AANVAL', stat: 'muscle', difficulty: 45,
          outcomes: { success: 'Je breekt door de bewakers heen. Ze hadden geen schijn van kans.', partial: 'Je verslaat ze maar loopt een paar klappen op. Door naar het doelwit.', fail: 'De bewakers zijn sterker dan verwacht. Je crew raakt gewond.' },
          effects: { heat: 10, relChange: -5, crewDamage: 15, bonusReward: 300 },
        },
        {
          id: 'cmb_1b', label: 'SLUIPEN', stat: 'brains', difficulty: 40,
          outcomes: { success: 'Via het dak naar binnen. Ze merken niets tot het te laat is.', partial: 'Je maakt een geluid. Eén bewaker komt kijken. Je schakelt hem stil uit.', fail: 'Het alarm gaat af. Ze weten dat je er bent.' },
          effects: { heat: 3, relChange: -3, crewDamage: 5, bonusReward: 500 },
        },
        {
          id: 'cmb_1c', label: 'BEWAKERS OMKOPEN', stat: 'charm', difficulty: 35,
          outcomes: { success: '"Kijk even de andere kant op, vrienden." Ze accepteren je geld.', partial: 'Eén bewaker accepteert, de ander niet. Je moet hem nog uitschakelen.', fail: 'Ze zijn loyaal aan hun baas. Ze trekken hun wapens.' },
          effects: { heat: 2, relChange: 0, crewDamage: 0, bonusReward: -200 },
        },
      ],
    },
    // NEW — the confrontation
    {
      id: 'cmb_2',
      text: 'Je staat oog in oog met het doelwit. Hij is niet alleen — drie lijfwachten staan klaar.',
      districtVariants: {
        iron: 'De Iron Skulls-leider zit achter een bureau van staal. Hij glimlacht. "Ik verwachtte je."',
        crown: 'De zakenman in zijn penthouse. Panoramisch uitzicht. "Laten we dit als beschaafde mensen oplossen."',
        low: 'Een gangster in een souterrain. Het ruikt naar vocht en gevaar.',
      },
      choices: [
        {
          id: 'cmb_2a', label: 'VOLLEDIGE AANVAL', stat: 'muscle', difficulty: 55,
          outcomes: { success: 'Je valt aan met alles wat je hebt. De lijfwachten vallen één voor één. Het doelwit geeft zich over.', partial: 'Een zwaar gevecht. Je wint, maar je crew heeft flinke klappen opgelopen.', fail: 'Ze zijn met te veel. Je wordt teruggedreven en moet vluchten.' },
          effects: { heat: 15, relChange: -8, crewDamage: 20, bonusReward: 800 },
        },
        {
          id: 'cmb_2b', label: 'PSYCHOLOGISCH SPEL', stat: 'charm', difficulty: 45,
          outcomes: { success: '"Je lijfwachten werken voor geld. Ik betaal meer." Twee van de drie lopen weg.', partial: 'Eén lijfwacht aarzelt. Genoeg om een opening te creëren.', fail: 'Ze lachen je uit. De loyaliteit van deze mannen is niet te koop.' },
          effects: { heat: 5, relChange: -3, crewDamage: 5, bonusReward: 400 },
        },
        {
          id: 'cmb_2c', label: 'TACTISCH VOORDEEL', stat: 'brains', difficulty: 50,
          outcomes: { success: 'Je hebt van tevoren de stroomkast gevonden. Lichten uit. In het donker heb jij het voordeel.', partial: 'De stroom valt uit maar ze hebben zaklampen. Toch een voordeel.', fail: 'De stroomkast is vergrendeld. Plan B had je niet.' },
          effects: { heat: 5, relChange: -3, crewDamage: 8, bonusReward: 600 },
        },
      ],
    },
    // NEW — aftermath/escape
    {
      id: 'cmb_3',
      text: 'Het doelwit is uitgeschakeld, maar sirenes naderen. Iemand heeft de politie gebeld. Tijd om te verdwijnen.',
      districtVariants: {
        port: 'De haven is afgesloten. Kustwachtboten scannen het water.',
        neon: 'De Strip is vol mensen. Perfect om in te verdwijnen — of juist niet.',
      },
      choices: [
        {
          id: 'cmb_3a', label: 'VLUCHTAUTO', stat: 'muscle', difficulty: 35,
          outcomes: { success: 'De chauffeur staat klaar. Banden piepen. Binnen 30 seconden ben je verdwenen.', partial: 'De auto start niet direct. Kostbare seconden verloren, maar je ontsnapt.', fail: 'De auto is geblokkeerd door politieauto\'s. Je moet te voet verder.' },
          effects: { heat: 5, relChange: 0, crewDamage: 0, bonusReward: 0 },
        },
        {
          id: 'cmb_3b', label: 'BEWIJS VERNIETIGEN', stat: 'brains', difficulty: 40,
          outcomes: { success: 'Je wist alle sporen. Camera-beelden gewist. DNA vernietigd. Het was alsof je er nooit was.', partial: 'De meeste sporen zijn weg, maar er is een vaag camerabeeld overgebleven.', fail: 'Je vergeet de buitencamera. Perfect beeld van je gezicht.' },
          effects: { heat: -8, relChange: 0, crewDamage: 0, bonusReward: 100 },
        },
        {
          id: 'cmb_3c', label: 'VERMOMMING', stat: 'charm', difficulty: 30,
          outcomes: { success: 'Je trekt een jas aan en loopt als een toerist langs de politie. Onzichtbaar.', partial: 'De vermomming houdt stand, maar een agent kijkt twee keer. Je loopt door.', fail: 'Een getuige herkent je ondanks de vermomming. "Dat is hem!"' },
          effects: { heat: -3, relChange: 0, crewDamage: 0, bonusReward: 50 },
        },
      ],
    },
  ],

  stealth: [
    {
      id: 'stl_1',
      text: 'Het beveiligde gebouw heeft drie ingangen. Bewaking maakt rondes om de 5 minuten.',
      districtVariants: {
        crown: 'Het penthouse heeft biometrische sloten en bewegingssensoren. High-tech.',
        port: 'Het havenmagazijn is donker en vochtig. Ratten als je enige gezelschap.',
        neon: 'De achterkamer van de club. De muziek verdooft elk geluid.',
      },
      choices: [
        {
          id: 'stl_1a', label: 'BEVEILIGINGSCODES KRAKEN', stat: 'brains', difficulty: 50,
          outcomes: { success: 'De codes zijn gekraakt. Alle deuren open, alle camera\'s blind.', partial: 'Je hebt de helft van de codes. Sommige camera\'s draaien nog.', fail: 'Het systeem detecteert je poging en gaat in lockdown.' },
          effects: { heat: 2, relChange: 0, crewDamage: 0, bonusReward: 800 },
        },
        {
          id: 'stl_1b', label: 'VERMOMMING', stat: 'charm', difficulty: 40,
          outcomes: { success: 'Als onderhoudsmonteur loop je zo naar binnen. Niemand kijkt twee keer.', partial: 'Je vermomming houdt stand maar een bewaker vraagt naar je ID.', fail: 'De echte monteur arriveert. Je cover is geblazen.' },
          effects: { heat: 3, relChange: 0, crewDamage: 0, bonusReward: 400 },
        },
        {
          id: 'stl_1c', label: 'FORCEER EEN RAAM', stat: 'muscle', difficulty: 35,
          outcomes: { success: 'Het raam breekt geluidloos. Je glijdt naar binnen als een schaduw.', partial: 'Het raam kraakt. Een bewaker kijkt op maar ziet niets. Close call.', fail: 'Het glas versplintering. Het hele gebouw is gealarmeerd.' },
          effects: { heat: 8, relChange: 0, crewDamage: 5, bonusReward: 200 },
        },
      ],
    },
    // NEW — inside the vault
    {
      id: 'stl_2',
      text: 'Je bent binnen. De kluis is achter een stalen deur met een combinatieslot. De bewaker maakt zijn ronde. Twee minuten.',
      districtVariants: {
        crown: 'De kluis heeft een tijdslot — hij opent alleen tussen 02:00 en 02:05. Het is 01:58.',
        port: 'De "kluis" is een verroeste container met een hangslot. Maar er ligt een slapende bewaker naast.',
      },
      choices: [
        {
          id: 'stl_2a', label: 'COMBINATIE KRAKEN', stat: 'brains', difficulty: 55,
          outcomes: { success: 'Je hoort de pinnetjes klikken. De deur zwaait open. Jackpot.', partial: 'Het duurt langer dan verwacht. Je hoort voetstappen naderen.', fail: 'De combinatie is gewijzigd sinds je laatste intel. Niets past.' },
          effects: { heat: 0, relChange: 0, crewDamage: 0, bonusReward: 1000 },
        },
        {
          id: 'stl_2b', label: 'DEUR OPENBRÉKEN', stat: 'muscle', difficulty: 50,
          outcomes: { success: 'Met een koevoet en brute kracht buig je de deur open. Stil genoeg.', partial: 'De deur buigt maar niet genoeg. Je grijpt wat je kunt door de spleet.', fail: 'De koevoet glijdt uit. Het lawaai echoot door de hal.' },
          effects: { heat: 10, relChange: 0, crewDamage: 5, bonusReward: 600 },
        },
        {
          id: 'stl_2c', label: 'BEWAKER AFLEIDEN', stat: 'charm', difficulty: 40,
          outcomes: { success: 'Je stuurt een vals alarm naar de andere kant van het gebouw. Hij rent weg. Meer tijd.', partial: 'Het alarm werkt maar hij komt sneller terug dan verwacht.', fail: 'Hij doorziet het valse alarm en komt recht naar jou.' },
          effects: { heat: 3, relChange: 0, crewDamage: 0, bonusReward: 500 },
        },
      ],
    },
    // NEW — double cross
    {
      id: 'stl_3',
      text: 'Je hebt de buit. Maar bij de uitgang staat je opdrachtgever\'s "partner". "Ik neem het hier over. Geef me alles."',
      districtVariants: {
        crown: 'De partner is een bekende fixer in Crown Heights. Hij heeft connecties overal.',
        low: 'Een straatgangster die denkt dat hij slim is. Maar hij is alleen.',
      },
      choices: [
        {
          id: 'stl_3a', label: 'WEIGEREN', stat: 'muscle', difficulty: 45,
          outcomes: { success: 'Je duwt hem opzij. "Zeg tegen je baas dat ik niet te bestelen ben."', partial: 'Een kort gevecht. Je houdt de buit maar hij ontsnapt — en hij zal praten.', fail: 'Hij heeft een wapen. Je moet de buit achterlaten.' },
          effects: { heat: 5, relChange: -5, crewDamage: 8, bonusReward: 300 },
        },
        {
          id: 'stl_3b', label: 'SPLITSEN', stat: 'charm', difficulty: 35,
          outcomes: { success: '"Laten we het delen. 70/30, mijn kant. Dat is meer dan je verdient." Hij stemt in.', partial: '50/50. Niet ideaal, maar geen problemen.', fail: 'Hij wil 80%. En hij heeft een pistool om het af te dwingen.' },
          effects: { heat: 0, relChange: 0, crewDamage: 0, bonusReward: -200 },
        },
        {
          id: 'stl_3c', label: 'OMSLUIPEN', stat: 'brains', difficulty: 40,
          outcomes: { success: 'Je kent een andere uitgang. Je bent al buiten voor hij doorheeft dat je weg bent.', partial: 'De andere uitgang is smal. Je verliest een deel van de buit onderweg.', fail: 'Er is geen andere uitgang. Je staat vast met hem.' },
          effects: { heat: 0, relChange: -2, crewDamage: 0, bonusReward: 200 },
        },
      ],
    },
  ],

  tech: [
    {
      id: 'tech_1',
      text: 'De server staat in een beveiligde kamer. Je hebt 3 minuten voordat het wachtwoord reset.',
      districtVariants: {
        crown: 'Een high-tech datacenter met 24/7 bewaking en stroomuitval-protocollen.',
        neon: 'Een illegale serverruimte achter een gamehal. Minder beveiliging.',
        iron: 'Een oude fabriek omgebouwd tot serverboerderij. Warm en luidruchtig.',
      },
      choices: [
        {
          id: 'tech_1a', label: 'DIRECT HACKEN', stat: 'brains', difficulty: 50,
          outcomes: { success: 'Je vingers vliegen over het toetsenbord. Root access in 90 seconden.', partial: 'Je krijgt toegang maar triggert een log entry. Ze weten dat iemand is ingebroken.', fail: 'De firewall is te sterk. Drie minuten zijn voorbij.' },
          effects: { heat: 3, relChange: 0, crewDamage: 0, bonusReward: 1000 },
        },
        {
          id: 'tech_1b', label: 'HARDWARE BACKDOOR', stat: 'muscle', difficulty: 35,
          outcomes: { success: 'Je opent de serverkast en plugt een device in. Fysieke toegang wint altijd.', partial: 'Het device werkt maar de verbinding is instabiel. Halve data.', fail: 'Je beschadigt de server. De data is corrupt.' },
          effects: { heat: 5, relChange: 0, crewDamage: 0, bonusReward: 500 },
        },
        {
          id: 'tech_1c', label: 'MEDEWERKER BENADEREN', stat: 'charm', difficulty: 40,
          outcomes: { success: 'Je overtuigt een ontevreden medewerker om je het wachtwoord te geven.', partial: 'Hij geeft je een hint. Genoeg om de rest zelf te kraken.', fail: 'Hij meldt je bij HR. De beveiliging wordt verhoogd.' },
          effects: { heat: 2, relChange: 3, crewDamage: 0, bonusReward: 700 },
        },
      ],
    },
    // NEW — data extraction
    {
      id: 'tech_2',
      text: 'Je hebt toegang tot het systeem. De data is enorm — je USB kan maar 40% opslaan. Wat prioriteer je?',
      districtVariants: {
        crown: 'Het systeem bevat financiële gegevens, klantendatabases en beveiligingsprotocollen.',
        neon: 'Gokgegevens, VIP-lijsten en zwart geld-transacties. Alles waardevol.',
      },
      choices: [
        {
          id: 'tech_2a', label: 'FINANCIËLE DATA', stat: 'brains', difficulty: 45,
          outcomes: { success: 'Je downloadt de bankrekeningen en transacties. Dit is goud waard op de zwarte markt.', partial: 'De download wordt onderbroken. Je hebt 60% van de financiële data.', fail: 'De data is versleuteld. Zonder de sleutel is het waardeloos.' },
          effects: { heat: 3, relChange: 0, crewDamage: 0, bonusReward: 1200 },
        },
        {
          id: 'tech_2b', label: 'CHANTAGE-MATERIAAL', stat: 'charm', difficulty: 40,
          outcomes: { success: 'E-mails, foto\'s, geheimen. Dit geeft je macht over belangrijke mensen.', partial: 'Je vindt bruikbaar materiaal maar het is niet zo explosief als gehoopt.', fail: 'De meeste bestanden zijn onschuldig. Verspilde moeite.' },
          effects: { heat: 5, relChange: 5, crewDamage: 0, bonusReward: 800 },
        },
        {
          id: 'tech_2c', label: 'BEVEILIGINGSCODES', stat: 'muscle', difficulty: 30,
          outcomes: { success: 'Alarmsystemen, kluiscodes, bewakingsschema\'s. Dit opent deuren — letterlijk.', partial: 'Sommige codes zijn verlopen. Maar de rest is bruikbaar.', fail: 'De codes worden live geroteerd. Tegen de tijd dat je ze gebruikt, zijn ze oud.' },
          effects: { heat: 2, relChange: 0, crewDamage: 0, bonusReward: 600 },
        },
      ],
    },
    // NEW — system admin confrontation
    {
      id: 'tech_3',
      text: 'De systeembeheerder is teruggekomen van pauze. Hij ziet jou achter zijn terminal. "Wie ben jij?!"',
      districtVariants: {
        iron: 'De sysadmin is een ex-militair. Hij is niet bang en heeft een beveiligingsbadge.',
        neon: 'Een jonge nerd met koptelefoon. Hij is geschrokken maar grijpt naar zijn telefoon.',
      },
      choices: [
        {
          id: 'tech_3a', label: 'NEERSLÁAN', stat: 'muscle', difficulty: 40,
          outcomes: { success: 'Een snelle klap. Hij is bewusteloos voor hij kan schreeuwen. Bind hem vast.', partial: 'Hij valt maar schreeuwt eerst. Je hebt misschien 30 seconden.', fail: 'Hij is sterker dan hij eruitziet. Hij drukt het alarm in terwijl jullie vechten.' },
          effects: { heat: 8, relChange: 0, crewDamage: 5, bonusReward: 0 },
        },
        {
          id: 'tech_3b', label: 'BLUFFEN', stat: 'charm', difficulty: 45,
          outcomes: { success: '"Ik ben van het hoofdkantoor. Beveiligingsaudit. Alles in orde." Hij gelooft je.', partial: 'Hij is skeptisch maar belt niet de beveiliging. Nog niet tenminste.', fail: '"Onzin. Ik bel de politie." Hij pakt zijn telefoon.' },
          effects: { heat: 0, relChange: 0, crewDamage: 0, bonusReward: 300 },
        },
        {
          id: 'tech_3c', label: 'HACKEN & WISSEN', stat: 'brains', difficulty: 50,
          outcomes: { success: 'Je wist de beveiligingslogs en je eigen aanwezigheid uit het systeem. Hij kan niets bewijzen.', partial: 'De logs zijn gewist maar de sysadmin heeft je gezicht gezien.', fail: 'Het wissen triggert een backup-alarm. Het hele systeem gaat in lockdown.' },
          effects: { heat: 2, relChange: 0, crewDamage: 0, bonusReward: 500 },
        },
      ],
    },
  ],
};

// ========== WEATHER MODIFIERS ==========

const WEATHER_DIFFICULTY_MOD: Record<WeatherType, Partial<Record<StatId, number>>> = {
  clear: {},
  rain: { muscle: 5, brains: -3, charm: 3 },     // Slippery = harder muscle, easier brains (less witnesses)
  fog: { brains: -5, muscle: 3, charm: 5 },       // Fog = easier brains (cover), harder charm (can't see faces)
  heatwave: { muscle: 8, charm: -3, brains: 3 },  // Heat = harder muscle (exhaustion), easier charm (people distracted)
  storm: { muscle: 10, brains: 5, charm: -5 },    // Storm = harder everything physical, easier charm (chaos)
};

// ========== CREW SPECIALIZATION BONUSES ==========

const SPEC_MISSION_BONUS: Record<string, { stat: StatId; difficultyReduction: number }> = {
  brute: { stat: 'muscle', difficultyReduction: 8 },
  bodyguard: { stat: 'muscle', difficultyReduction: 5 },
  phantom: { stat: 'brains', difficultyReduction: 8 },
  netrunner: { stat: 'brains', difficultyReduction: 10 },
  fixer: { stat: 'charm', difficultyReduction: 8 },
  face: { stat: 'charm', difficultyReduction: 10 },
  racer: { stat: 'muscle', difficultyReduction: 5 },
  medic: { stat: 'brains', difficultyReduction: 3 },
  demolitionist: { stat: 'muscle', difficultyReduction: 6 },
  smuggler_wagon: { stat: 'brains', difficultyReduction: 4 },
};

// ========== ENCOUNTER ENGINE ==========

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const SOLO_PHASE_LABELS = ['VERKENNING', 'INFILTRATIE', 'UITVOERING', 'ONTSNAPPING'];
const CONTRACT_PHASE_LABELS = ['VOORBEREIDING', 'UITVOERING', 'AFRONDING', 'AFLEVERING'];

const SOLO_ATMOSPHERES: Record<string, string[]> = {
  pickpocket: [
    'De menigte stroomt langs je heen. Geluiden van de stad dempen je hartslag.',
    'Neonreclames flikkeren boven de straat. Een perfecte afleiding.',
    'De geur van streetfood mengt met uitlaatgassen. Niemand let op je.',
    'Regendruppels tikken op je capuchon. Het perfecte weer voor een zakkenroller.',
  ],
  atm_skimming: [
    'Het scherm van de ATM baadt de steeg in een blauwgroen licht.',
    'Je vingers trillen licht terwijl je de skimmer uit je jaszak haalt.',
    'De beveiligingscamera draait langzaam. Je telt de seconden.',
    'Een politiesirene loeit in de verte. Je adem stokt even.',
  ],
  car_theft: [
    'De straatlantaarns werpen lange schaduwen over het glanzende koetswerk.',
    'De motor van de auto tikt nog na — de eigenaar is net weg.',
    'Regen glijdt over de motorkap. Het slot glimt onder het licht.',
    'De geur van nieuw leer drijft uit het halfopen raam.',
  ],
  store_robbery: [
    'De diamanten schitteren achter kogelvrij glas. Je hart bonkt.',
    'De bewaker leunt tegen de deurpost, verveeld. Dat verandert zo.',
    'Buiten raast het verkeer voorbij. Binnen is het stil. Te stil.',
    'Je handschoenen zitten strak. Het masker kriebelt. Geen weg terug.',
  ],
  crypto_heist: [
    'Serverfans zoemen in de duisternis. Groene LED\'s flikkeren als vuurvliegjes.',
    'De airco blaast ijskoude lucht over je nek. Focus.',
    'Kabels kronkelen als slangen over de vloer. Het doelwit is dichtbij.',
    'Je laptop scherm werpt schaduwen op de muur. De klok tikt.',
  ],
};

export function generateMissionEncounters(
  missionType: 'solo' | 'contract',
  missionId: string,
  contractType?: string
): MissionEncounter[] {
  const pool = missionType === 'solo'
    ? (SOLO_ENCOUNTERS[missionId] || SOLO_ENCOUNTERS['pickpocket'])
    : (CONTRACT_ENCOUNTERS[contractType || 'delivery'] || CONTRACT_ENCOUNTERS['delivery']);

  // Shuffle the pool and pick 3-4 encounters (was 2-3)
  const shuffled = shuffleArray(pool);
  const count = Math.min(shuffled.length, Math.max(3, 3 + Math.floor(Math.random() * 2))); // 3-4
  const selected = shuffled.slice(0, count);

  // Add phase labels and atmosphere
  const phaseLabels = missionType === 'solo' ? SOLO_PHASE_LABELS : CONTRACT_PHASE_LABELS;
  const atmospheres = missionType === 'solo' ? (SOLO_ATMOSPHERES[missionId] || SOLO_ATMOSPHERES['pickpocket']) : [];

  return selected.map((enc, i) => ({
    ...enc,
    phase: phaseLabels[i] || phaseLabels[phaseLabels.length - 1],
    atmosphere: atmospheres[i % atmospheres.length] || undefined,
  }));
}

export function resolveMissionChoice(
  state: GameState,
  mission: ActiveMission,
  choiceId: string
): {
  result: 'success' | 'partial' | 'fail';
  outcomeText: string;
  effects: MissionChoice['effects'];
  weatherMod?: string;
  crewBonus?: string;
} {
  const encounter = mission.encounters[mission.currentEncounter];
  if (!encounter) {
    return { result: 'fail', outcomeText: 'Encounter niet gevonden.', effects: { heat: 0, relChange: 0, crewDamage: 0, bonusReward: 0 } };
  }

  const choice = encounter.choices.find(c => c.id === choiceId);
  if (!choice) {
    return { result: 'fail', outcomeText: 'Keuze niet gevonden.', effects: { heat: 0, relChange: 0, crewDamage: 0, bonusReward: 0 } };
  }

  const statVal = getPlayerStat(state, choice.stat);
  const isLowrise = state.ownedDistricts.includes('low') && mission.type === 'solo';

  // Base difficulty
  let effectiveDifficulty = isLowrise ? Math.floor(choice.difficulty * 0.7) : choice.difficulty;

  // Approach modifier
  if (mission.approach === 'cautious') effectiveDifficulty -= 5;
  else if (mission.approach === 'aggressive') effectiveDifficulty += 5;

  // Weather modifier
  const weatherMods = WEATHER_DIFFICULTY_MOD[state.weather] || {};
  const weatherDiffMod = weatherMods[choice.stat] || 0;
  effectiveDifficulty += weatherDiffMod;
  let weatherModText: string | undefined;
  if (weatherDiffMod !== 0) {
    const weatherLabels: Record<WeatherType, string> = {
      clear: '', rain: 'Regen', fog: 'Mist', heatwave: 'Hittegolf', storm: 'Storm',
    };
    weatherModText = weatherDiffMod > 0
      ? `${weatherLabels[state.weather]}: +${weatherDiffMod} moeilijkheid`
      : `${weatherLabels[state.weather]}: ${weatherDiffMod} moeilijkheid`;
  }

  // Crew specialization bonus
  let crewBonusText: string | undefined;
  if (mission.crewIndex !== undefined) {
    const crew = state.crew[mission.crewIndex];
    if (crew?.specialization) {
      const specBonus = SPEC_MISSION_BONUS[crew.specialization];
      if (specBonus && specBonus.stat === choice.stat) {
        effectiveDifficulty -= specBonus.difficultyReduction;
        crewBonusText = `${crew.name} (${crew.specialization}): -${specBonus.difficultyReduction} moeilijkheid`;
      }
    }
  }
  // Also check all crew for passive bonuses (non-contract missions)
  if (mission.type === 'solo') {
    state.crew.forEach(c => {
      if (c.specialization) {
        const specBonus = SPEC_MISSION_BONUS[c.specialization];
        if (specBonus && specBonus.stat === choice.stat) {
          effectiveDifficulty -= Math.floor(specBonus.difficultyReduction * 0.3); // 30% passive bonus
        }
      }
    });
  }

  // Ensure minimum difficulty
  effectiveDifficulty = Math.max(5, effectiveDifficulty);

  // Calculate success: stat * 5 + random(0-30) vs difficulty
  const roll = statVal * 5 + Math.floor(Math.random() * 30);

  let result: 'success' | 'partial' | 'fail';
  if (roll >= effectiveDifficulty + 15) {
    result = 'success';
  } else if (roll >= effectiveDifficulty - 5) {
    result = 'partial';
  } else {
    result = 'fail';
  }

  // Crew bonus for contracts (level-based save)
  if (mission.type === 'contract' && mission.crewIndex !== undefined) {
    const crew = state.crew[mission.crewIndex];
    if (crew) {
      const bonusRoll = crew.level * 2;
      if (result === 'fail' && Math.random() < 0.3 + bonusRoll * 0.02) {
        result = 'partial';
      }
    }
  }

  const outcomeText = choice.outcomes[result];

  return { result, outcomeText, effects: choice.effects, weatherMod: weatherModText, crewBonus: crewBonusText };
}

export function completeMission(state: GameState, mission: ActiveMission): { message: string; success: boolean } {
  const successCount = mission.log.filter(l => l.includes('✓')).length;
  const totalEncounters = mission.encounters.length;
  const successRate = successCount / totalEncounters;

  let finalReward = mission.baseReward;
  let finalHeat = mission.baseHeat;

  // Apply accumulated effects
  finalReward += mission.totalReward;
  finalHeat += mission.totalHeat;

  // Scale reward based on success rate
  if (successRate >= 0.8) {
    finalReward = Math.floor(finalReward * 1.3);
    state.rep += 15;
  } else if (successRate >= 0.5) {
    finalReward = Math.floor(finalReward * 0.8);
    state.rep += 8;
  } else {
    finalReward = Math.floor(finalReward * 0.3);
    state.rep += 2;
    finalHeat = Math.floor(finalHeat * 1.5);
  }

  const overallSuccess = successRate >= 0.5;

  if (overallSuccess) {
    state.dirtyMoney += finalReward;
    state.stats.totalEarned += finalReward;
    state.stats.missionsCompleted++;
  } else {
    state.stats.missionsFailed++;
  }

  // Split mission heat between vehicle and personal
  splitHeat(state, finalHeat, mission.type === 'contract' ? 0.5 : 0.4);

  // Apply crew damage
  if (mission.crewIndex !== undefined && mission.totalCrewDamage > 0) {
    const crew = state.crew[mission.crewIndex];
    if (crew) {
      crew.hp = Math.max(0, crew.hp - mission.totalCrewDamage);
      // XP gain for crew
      crew.xp += overallSuccess ? 10 : 3;
      if (crew.xp >= 30 * crew.level) {
        crew.xp = 0;
        crew.level = Math.min(10, crew.level + 1);
      }
    }
  }

  // Apply faction relation changes
  Object.entries(mission.totalRelChange).forEach(([fid, change]) => {
    state.familyRel[fid] = Math.max(-100, Math.min(100, (state.familyRel[fid] || 0) + change));
  });

  // XP for player
  const xpGain = overallSuccess ? 20 + Math.floor(successRate * 30) : 5;
  let xp = state.player.xp + xpGain;
  if (xp >= state.player.nextXp) {
    xp -= state.player.nextXp;
    state.player.level++;
    state.player.nextXp = Math.floor(state.player.nextXp * 1.4);
    state.player.skillPoints += 2;
  }
  state.player.xp = xp;

  // Remove contract if it was a contract mission
  if (mission.type === 'contract' && mission.contractId !== undefined) {
    state.activeContracts = state.activeContracts.filter(c => c.id !== mission.contractId);
  }

  const crewText = mission.crewName ? ` (${mission.crewName})` : '';
  const damageText = mission.totalCrewDamage > 0 ? ` | ${mission.totalCrewDamage} crew schade` : '';
  const message = overallSuccess
    ? `Missie${crewText} geslaagd! +€${finalReward} zwart geld | +${xpGain} XP${damageText}`
    : `Missie${crewText} mislukt. +${xpGain} XP | Extra heat opgelopen.${damageText}`;

  return { message, success: overallSuccess };
}

export function getEncounterText(encounter: MissionEncounter, district: DistrictId): string {
  return encounter.districtVariants[district] || encounter.text;
}

// ========== DIFFICULTY HELPER (for UI) ==========

export function getEffectiveDifficulty(
  state: GameState,
  choice: MissionChoice,
  mission: ActiveMission
): { difficulty: number; weatherMod: number; crewMod: number } {
  let difficulty = choice.difficulty;
  const isLowrise = state.ownedDistricts.includes('low') && mission.type === 'solo';
  if (isLowrise) difficulty = Math.floor(difficulty * 0.7);

  // Approach modifier
  if (mission.approach === 'cautious') difficulty -= 5;
  else if (mission.approach === 'aggressive') difficulty += 5;

  // Weather
  const weatherMods = WEATHER_DIFFICULTY_MOD[state.weather] || {};
  const weatherMod = weatherMods[choice.stat] || 0;
  difficulty += weatherMod;

  // Crew specs
  let crewMod = 0;
  if (mission.crewIndex !== undefined) {
    const crew = state.crew[mission.crewIndex];
    if (crew?.specialization) {
      const specBonus = SPEC_MISSION_BONUS[crew.specialization];
      if (specBonus && specBonus.stat === choice.stat) {
        crewMod = -specBonus.difficultyReduction;
        difficulty -= specBonus.difficultyReduction;
      }
    }
  }
  if (mission.type === 'solo') {
    state.crew.forEach(c => {
      if (c.specialization) {
        const specBonus = SPEC_MISSION_BONUS[c.specialization];
        if (specBonus && specBonus.stat === choice.stat) {
          const passive = -Math.floor(specBonus.difficultyReduction * 0.3);
          crewMod += passive;
          difficulty += passive;
        }
      }
    });
  }

  difficulty = Math.max(5, difficulty);

  return { difficulty, weatherMod, crewMod };
}
