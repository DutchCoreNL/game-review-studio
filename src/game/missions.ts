import { MissionEncounter, MissionChoice, ActiveMission, GameState, DistrictId, StatId } from './types';
import { SOLO_OPERATIONS, DISTRICTS } from './constants';
import { getPlayerStat } from './engine';

// ========== ENCOUNTER DATABASE ==========

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
  ],
};

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
  ],
};

// ========== ENCOUNTER ENGINE ==========

export function generateMissionEncounters(
  missionType: 'solo' | 'contract',
  missionId: string,
  contractType?: string
): MissionEncounter[] {
  if (missionType === 'solo') {
    return SOLO_ENCOUNTERS[missionId] || SOLO_ENCOUNTERS['pickpocket'];
  } else {
    return CONTRACT_ENCOUNTERS[contractType || 'delivery'] || CONTRACT_ENCOUNTERS['delivery'];
  }
}

export function resolveMissionChoice(
  state: GameState,
  mission: ActiveMission,
  choiceId: string
): {
  result: 'success' | 'partial' | 'fail';
  outcomeText: string;
  effects: MissionChoice['effects'];
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
  const effectiveDifficulty = isLowrise ? Math.floor(choice.difficulty * 0.7) : choice.difficulty;

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

  // Crew bonus for contracts
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

  return { result, outcomeText, effects: choice.effects };
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

  state.heat = Math.min(100, Math.max(0, state.heat + finalHeat));

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

    // Employer/target relation
    const contract = state.activeContracts.find(c => c.id === mission.contractId);
    // Already removed, but we stored the IDs in totalRelChange
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
