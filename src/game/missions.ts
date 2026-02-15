import { MissionEncounter, MissionChoice, ActiveMission, GameState, DistrictId, StatId, WeatherType } from './types';
import { SOLO_OPERATIONS, DISTRICTS } from './constants';
import { getPlayerStat, splitHeat } from './engine';

// ========== ENCOUNTER DATABASE — SOLO ==========

const SOLO_ENCOUNTERS: Record<string, MissionEncounter[]> = {
  pickpocket: [
    {
      id: 'pp_1',
      text: 'Het station is stampvol tijdens het spitsuur. Tussen de haastige forensen spot je een zakenman in een duur pak — hij staat met zijn rug naar je toe, druk bellend via zijn AirPods. Zijn leren aktetas hangt halfopen aan zijn schouder en je ziet de glans van een zware portemonnee in het buitenvak. Hij heeft geen idee dat jij al vijf minuten naar hem kijkt. De menigte schuift onrustig heen en weer. Dit is je moment — of je laat hem gaan.',
      districtVariants: {
        port: 'Bij de containeroverslag staat een havenarbeider tegen een paal geleund, duidelijk aangeschoten na zijn shift. Zijn loonzakje — een bruine envelop dik van de biljetten — steekt uit zijn achterzak alsof het erom smeekt gepakt te worden. Zijn collega\'s zijn al vertrokken. De kranen piepen boven jullie hoofden.',
        crown: 'Een investeerder in een kasjmieren overjas stapt uit een zwarte Mercedes bij het penthouse. Zijn Rolex vangt het licht van de straatlantaarn terwijl hij zijn telefoon wegstopt. De chauffeur rijdt weg. Even is hij alleen op het trottoir — tien seconden, misschien vijftien.',
        iron: 'De voorman van de staalfabriek telt zijn weekgeld bij het hek, bladerend door een stapel briefjes van vijftig. De bewakingscamera boven de poort is al weken kapot — dat weet je, want je hebt het gecheckt. Zijn aandacht is volledig bij het geld. De fabriekssirene loeit.',
        low: 'In het steegje achter de wasserette telt een dealer zijn dagomzet. Zijn telefoon licht op met berichten die hij niet beantwoordt — hij is te druk met het sorteren van briefjes. Een stapel van minstens vijfhonderd euro ligt open en bloot op een kratje naast hem. Zijn pistool zit in zijn broeksband, maar zijn handen zijn bezet.',
        neon: 'Een gokker wankelt uit de Velvet Room, zijn ogen glazig van de drank en het verlies. Maar vanavond heeft hij gewonnen — zijn zakken puilen uit van de chips die hij vergat in te wisselen en het contante geld dat hij wel kreeg. Hij leunt tegen de muur en probeert een sigaret aan te steken met trillende handen.',
      },
      choices: [
        {
          id: 'pp_1a', label: 'AFLEIDEN & GRAAIEN', stat: 'charm', difficulty: 30,
          outcomes: { success: 'Je loopt op hem af met je meest vertrouwenwekkende glimlach. "Sorry, weet u misschien hoe ik bij de Kerkstraat kom?" Terwijl hij nadenkt, glijden je vingers als water langs zijn zak. De portemonnee verdwijnt in je mouw. Hij merkt niets. Smooth.', partial: 'Je afleiding werkt, maar op het moment dat je de portemonnee pakt, voelt hij de beweging. Zijn ogen worden groot. Je rukt je los en verdwijnt in de menigte voordat hij kan reageren — net op tijd.', fail: '"Wat doe je?!" Hij grijpt je pols met verrassende kracht. Mensen kijken om. Een beveiliger komt aangelopen. Je rukt je los en rent — zonder buit.' },
          effects: { heat: 3, relChange: 0, crewDamage: 0, bonusReward: 50 },
        },
        {
          id: 'pp_1b', label: 'SNELLE VINGERS', stat: 'brains', difficulty: 35,
          outcomes: { success: 'Je hebt zijn looppatroon bestudeerd, zijn gewoontes geanalyseerd. Op het exacte moment dat de trein arriveert en de menigte naar voren dringt, glijdt je hand in zijn zak. Twee vingers, een lichte draai, en de portemonnee is van jou. Hij loopt door alsof er niets is gebeurd. Chirurgische precisie.', partial: 'De portemonnee is in je hand, maar je eigen telefoon glijdt bijna uit je andere zak. Je hart slaat over. Je vangt hem net op tijd — maar de beweging trekt een blik. Je duikt weg in de stroom reizigers.', fail: 'Zijn zak is dieper dan verwacht. Je vingers raken de portemonnee maar je krijgt geen grip. Hij voelt de aanraking en draait zich bliksemsnel om. Zijn hand sluit zich om je pols. "Dief!" schreeuwt hij door het station.' },
          effects: { heat: 2, relChange: 0, crewDamage: 0, bonusReward: 80 },
        },
        {
          id: 'pp_1c', label: 'DUWTRUC', stat: 'muscle', difficulty: 25,
          outcomes: { success: 'Je loopt met vaart tegen hem aan — "Oh, sorry!" — en in dezelfde beweging trek je de portemonnee mee. Hij mompelt iets en loopt door. Klassieke duwtruc. De oudste en beste methode.', partial: 'Je duwt harder dan gepland. Hij struikelt en valt bijna. Mensen kijken. Je grijpt de portemonnee terwijl je hem "overeind helpt" en verdwijnt snel in de drukte. Slordig, maar effectief.', fail: 'Hij is steviger dan hij eruitziet. Je duw kaatst terug en hij duwt jou opzij. "Kijk uit, man!" Omstanders staren. Een bewaker komt je richting op. Tijd om te vertrekken — leeghandig.' },
          effects: { heat: 5, relChange: 0, crewDamage: 0, bonusReward: 30 },
        },
      ],
    },
    {
      id: 'pp_2',
      text: 'De portemonnee zit veilig in je binnenzak en je adrenalinespiegel daalt langzaam. Maar dan vang je een glimp op in de reflectie van een etalageruit — een beveiliger in een donker uniform spreekt in zijn portofoon. Zijn blik is op jou gericht. Hij heeft je gezien, of tenminste: hij vermoedt het. De uitgang van het station is nog vijftig meter verderop. De menigte wordt dunner.',
      districtVariants: {
        port: 'Een havenbewaker met een zaklamp wijst in jouw richting terwijl hij iets schreeuwt in zijn radio. De automatische hekken bij de uitgang beginnen langzaam dicht te gaan. Het geluid van kettingen die spannen klinkt als een waarschuwing.',
        crown: 'Hoog in de hoek draait een bewakingscamera je richting op — de rode LED knippert. Ergens boven je hoofd zoemt een beveiligingsdrone dichterbij. De privébeveiliging van Crown Heights neemt geen risico\'s.',
        iron: 'Een beer van een kerel — kaalgeschoren hoofd, tatoegaes op zijn knokkels — verspert de enige uitgang. Hij tikt een honkbalknuppel tegen zijn handpalm. "Je gaat nergens heen, vriendje."',
        low: 'Een groepje van vier straatjochies heeft je operatie gezien vanuit een portiek. Ze stappen de stoep op en blokkeren je pad. De oudste, misschien zestien, grijnst breed. "Mooie vangst. Wij willen de helft. Of we beginnen te schreeuwen."',
        neon: 'De uitsmijter van het casino — een berg van een man met littekens op zijn gezicht — blokkeert de smalle steeg. Hij vouwt zijn armen over elkaar. "Ik heb het gezien. Geef terug wat je hebt gepikt, of ik breek iets van je."',
      },
      choices: [
        {
          id: 'pp_2a', label: 'WEGRENNEN', stat: 'muscle', difficulty: 20,
          outcomes: { success: 'Je zet het op een sprinten — door de steegjes, over een hek, onder een rolluik door. Na drie minuten vol gas ben je ze kwijt. Je leunt hijgend tegen een muur. Schone ontsnapping.', partial: 'Je rent alsof je leven ervan afhangt. Je ontsnapt, maar in de haast valt een deel van de buit uit je zak. Je durft niet om te keren. Beter iets dan niets.', fail: 'Je sprint is goed, maar zij kennen de steegjes beter. Na twee bochten word je ingehaald. Ze graaien de helft van je buit weg voordat je je losrukt en verdwijnt.' },
          effects: { heat: 3, relChange: 0, crewDamage: 0, bonusReward: 0 },
        },
        {
          id: 'pp_2b', label: 'VERSTOPPEN', stat: 'brains', difficulty: 30,
          outcomes: { success: 'Je duikt zonder aarzeling een kledingwinkel in, pakt een jas van het rek, en loopt met een draagtas naar buiten alsof je net hebt gewinkeld. Ze rennen recht langs je heen. Onzichtbaar.', partial: 'Je duikt achter een rij vuilcontainers in het steegje. Voetstappen naderen... en gaan voorbij. Je hart bonkt zo hard dat je zeker weet dat ze het kunnen horen. Maar ze lopen door. Close call.', fail: 'Je denkt slim te zijn door in een portiek te duiken, maar een bewoner opent de deur. "He! Wat doe jij hier?!" Het geschreeuw trekt je achtervolgers recht naar je toe.' },
          effects: { heat: -2, relChange: 0, crewDamage: 0, bonusReward: 20 },
        },
      ],
    },
    {
      id: 'pp_3',
      text: 'In een achterafgelegen kroeg, verscholen achter een gordijn van kralensnaren, zit een heler die je kent als "De Wezel". Hij bestudeert je buit door een juwelierloep, draait het leer om, controleert de inhoud. Dan leunt hij achterover en noemt een bedrag dat beledigend laag is. "Neem het of laat het," zegt hij, terwijl hij een sigaar opsteekt. "Maar je vindt geen betere prijs vanavond."',
      districtVariants: {
        crown: 'De heler is geen gewone crimineel — het is een galeriehouder die overdag kunst verkoopt aan de elite van Crown Heights. \'s Nachts handelt hij in gestolen spullen. Zijn kantoor ruikt naar dure wijn en verborgen zonden. "Interessant stuk," mompelt hij. "Maar mijn klanten verwachten kwaliteit."',
        neon: 'De barman van de Velvet Room leunt over de bar en fluistert boven de dreunende muziek uit: "Ik ken iemand die dat wil hebben. Discreet. Vanavond nog." Hij schuift een servet naar je toe met een telefoonnummer. "Maar ik wil twintig procent. Voor de introductie."',
        low: 'Een oude vrouw in een rommelwinkel vol stoffige snuisterijen bekijkt je buit met een vergrootglas. Haar ogen zijn scherp ondanks haar leeftijd. "Niet slecht, niet slecht," mompelt ze. "Ik geef je de helft van wat het waard is. Nee, niet onderhandelen. Mijn prijs is mijn prijs." Ze legt een stapeltje biljetten op de toonbank.',
        port: 'In een roestig kantoor boven een vissersloods zit een havensmokkkelaar achter een bureau vol zeekaarten. Hij ruikt naar diesel en tabak. "Ik kan dit meenemen op het volgende schip naar Rotterdam," zegt hij, terwijl hij je buit weegt in zijn hand. "Maar mijn commissie is stevig — de haven vraagt zijn tol."',
        iron: 'De smid van Iron Borough — een berg van een man met handen als kolenschoppen — bekijkt je buit onder een werkplaatslamp. Hij smelt goud om tot onherkenbare staven in zijn illegale smelterij achter de staalfabriek. "Ik geef je vijftig procent," gromt hij. "En wees blij dat ik niet vraag waar het vandaan komt."',
      },
      choices: [
        {
          id: 'pp_3a', label: 'ONDERHANDELEN', stat: 'charm', difficulty: 35,
          outcomes: { success: 'Je leunt achterover, glimlacht, en begint te praten. Over de markt, over zijn reputatie, over wat er zou gebeuren als zijn klanten wisten hoe weinig hij betaalde. Na tien minuten is de prijs verdubbeld. De Wezel grijnst — hij respecteert lef.', partial: 'Je dringt aan en hij geeft iets meer, maar het is nog steeds geen eerlijke prijs. "Dit is mijn laatste bod," zegt hij met een blik die geen tegenspraak duldt. Je neemt het aan. Beter dan niets.', fail: 'Je pusht te hard. Hij schuift de buit terug over de tafel. "Te veel gedoe met jou. Ik ken twintig anderen die wél tevreden zijn met wat ik bied. De deur is daar."' },
          effects: { heat: 0, relChange: 2, crewDamage: 0, bonusReward: 120 },
        },
        {
          id: 'pp_3b', label: 'ZELF VERKOPEN', stat: 'brains', difficulty: 40,
          outcomes: { success: 'Je bedankt De Wezel beleefd en gaat naar huis. Online vind je via een versleuteld forum een koper die het dubbele betaalt. De transactie verloopt via crypto, clean en onherleidbaar. Slim gespeeld.', partial: 'Het online zoeken duurt langer dan verwacht en de uiteindelijke prijs is redelijk — niet spectaculair. Maar je hebt geen tussenpersoon nodig gehad.', fail: 'De "koper" op het forum blijkt een undercover agent. Je ruikt het net op tijd en dumpt alles in een vuilcontainer. Geen opbrengst, maar ook geen arrestatie.' },
          effects: { heat: 4, relChange: 0, crewDamage: 0, bonusReward: 200 },
        },
        {
          id: 'pp_3c', label: 'DREIGEN', stat: 'muscle', difficulty: 30,
          outcomes: { success: 'Je buigt je naar hem toe. Je stem is kalm maar je ogen zijn dat niet. "Betaal wat het waard is, of ik zoek een andere heler — en ik vertel iedereen in deze stad over jouw marges." Hij slikte. Het geld verschijnt.', partial: 'De dreiging werkt — hij betaalt meer uit pure angst. Maar je ziet het in zijn ogen: je hebt vandaag een vijand gemaakt. Dat gaat je ooit opbreken.', fail: 'Hij reikt onder de toonbank en haalt een broodmes tevoorschijn. Langzaam, bijna nonchalant. "Ik draai al dertig jaar mee, jochie. Wegwezen." Je vertrekt zonder een cent.' },
          effects: { heat: 3, relChange: -3, crewDamage: 5, bonusReward: 150 },
        },
      ],
    },
    {
      id: 'pp_4',
      text: 'Terwijl je de inhoud van de gestolen portemonnee doorzoekt, vind je iets onverwachts: een gevouwen briefje, geschreven in haastig handschrift. "Ontmoet me bij de brug. Middernacht. Breng het pakket." Ernaast zit een kleine koperen sleutel — oud, zwaar, met een nummer erin gegraveerd. Dit is meer dan een gewone diefstal. Iemand gebruikte deze portemonnee als droppunt. De vraag is: wat zit er achter slot en grendel?',
      districtVariants: {
        port: 'Het nummer op de sleutel komt overeen met een kluisje in het havenkantoor — je herkent de serie. Wat voor geheimen verbergt de haven? En belangrijker: is iemand bereid te betalen om ze terug te krijgen?',
        iron: 'Het briefje verwijst naar een verlaten fabriek aan de rand van Iron Borough. "Verdieping -2, deur 14." Een locatie die officieel niet bestaat. Dit ruikt naar een val — of naar een kans die je leven kan veranderen.',
        crown: 'De sleutel past op een bankkluis bij Meridian Trust — de meest exclusieve bank van Crown Heights. Het briefje bevat een rekeningnummer en een naam die je herkent van het journaal. Dit is materiaal waarmee je een politicus kunt laten vallen. Of chanteren.',
        neon: 'Het adres op het briefje leidt naar een VIP-kluis achter de Velvet Room — een plek waar gokkers hun winst verbergen voor de belasting. De sleutel is zwaar en oud, het soort dat bij een kluis van voor de digitalisering hoort. Wat er ook in zit, iemand wilde niet dat het online stond.',
        low: 'Een krakersjochie in Lowrise herkent het nummer op de sleutel — het hoort bij een opslagbox in de kelder van het oude postkantoor, nu een illegaal depot voor gestolen goederen. "Daar bewaren de grote jongens hun shit," fluistert hij. "Maar als ze erachter komen dat jij erbij was..."',
      },
      choices: [
        {
          id: 'pp_4a', label: 'ONDERZOEKEN', stat: 'brains', difficulty: 45,
          outcomes: { success: 'Je volgt de aanwijzingen en vindt het kluisje. Binnenin: een USB-stick met versleutelde bedrijfsdocumenten en een envelop met vijfduizend in contanten. Dit is goud waard op de zwarte markt — en niemand weet dat jij het hebt.', partial: 'Je vindt het kluisje, maar zodra je het opent gaat er een stil alarm af. Je grijpt wat je kunt — een stapel documenten en wat cash — en rent. Niet de grote score, maar niet slecht.', fail: 'Het blijkt een lokval van de politie. Twee agenten in burger wachten je op bij het kluisje. Je ziet ze net op tijd en duikt weg, maar de kans is verkeken. En nu weten ze je gezicht.' },
          effects: { heat: 5, relChange: 0, crewDamage: 0, bonusReward: 300 },
        },
        {
          id: 'pp_4b', label: 'NEGEREN', stat: 'charm', difficulty: 15,
          outcomes: { success: 'Je verscheurt het briefje en gooit de sleutel in een putdeksel. Niet jouw probleem, niet jouw risico. Soms is de slimste zet om niet te spelen. Je loopt door met je oorspronkelijke buit, veilig en onopgemerkt.', partial: 'Je probeert het te negeren, maar de rest van de avond knaagt het. Wat als het miljoenen waard was? Maar nee — je hebt de juiste keuze gemaakt. Waarschijnlijk.', fail: 'Je gooit het briefje weg, maar iemand heeft gezien dat je de sleutel pakte. Een onbekende belt je de volgende dag. "Ik weet wat je hebt gevonden. We moeten praten." Meer heat dan nodig.' },
          effects: { heat: 0, relChange: 0, crewDamage: 0, bonusReward: 0 },
        },
      ],
    },
  ],

  atm_skimming: [
    {
      id: 'atm_1',
      text: 'De ATM staat op een rustige hoek, verlicht door een enkel TL-buis dat zachtjes zoemt. Het is na middernacht en de straat is bijna uitgestorven — een enkel stel loopt hand in hand voorbij, een taxi passeert. Je skimmer-apparaat zit in je binnenzak: een plastic behuizing die perfect over de kaartsleuf past, een minuscuul cameraatje, en een Bluetooth-zender. Maar er is een probleem: boven de ATM hangt een beveiligingscamera, het rode lampje knipperend als een waakzaam oog.',
      districtVariants: {
        crown: 'De ATM in Crown Heights is van het nieuwste model — touchscreen, gezichtsherkenning, NFC-detectie. Het beveiligingssysteem is gekoppeld aan een privébeveiligingsbedrijf dat binnen drie minuten ter plaatse is. Maar de transactielimieten hier zijn tien keer hoger dan elders. Hoog risico, astronomische beloning.',
        port: 'De ATM bij het havenkantoor is minstens tien jaar oud — het scherm heeft dode pixels en de software draait waarschijnlijk nog op Windows XP. Makkelijker te hacken dan een kinderspeeltje. Maar de buurt is een ander verhaal: havenratten en junks die in de schaduw van de containers leven.',
        neon: 'De ATM naast de Velvet Room wordt constant gebruikt door gokkers die cash nodig hebben. Elke vijf minuten een nieuwe kaart, elke transactie honderden euro\'s. Meer data dan je ooit kunt verwerken — maar ook meer ogen. De uitsmijter staat tien meter verderop.',
        iron: 'De ATM bij de fabriekspoort is verweerd en vol krassen — het toetsenbord is vettig van de smeerolie van honderden arbeiders. Geen camera\'s, geen bewaking, maar de Iron Skulls beschouwen elke machine in deze wijk als hun eigendom. Als ze je zien, betaal je "beschermingsgeld" — met je tanden.',
        low: 'De ATM in Lowrise staat in een telefooncel waarvan de deur al jaren ontbreekt. Het scherm flikkert en de helft van de knoppen werkt nauwelijks. Maar de gebruikers — uitkeringstrekkers, alleenstaande moeders, pensionado\'s — pinnen hier hun hele maandinkomen in één keer. Makkelijke data, maar het voelt vies.',
      },
      choices: [
        {
          id: 'atm_1a', label: 'CAMERA UITSCHAKELEN', stat: 'brains', difficulty: 40,
          outcomes: { success: 'Met je laptop en een WiFi-adapter hackt je de camerafeed. Het beeld bevriest op een leeg frame — niemand zal de opname ooit terugkijken en iets verdachts zien. De perfecte dekking.', partial: 'Je kunt de camera niet hacken, maar je slaagt erin om hem fysiek weg te draaien. Niet elegant, maar effectief — voor nu. Iemand zal het morgen merken.', fail: 'Zodra je de camerakabel aanraakt, gaat er een stil alarm af. Een hoge pieptoon die alleen jij kunt horen — en de beveiligingsdienst. Je hebt misschien twee minuten.' },
          effects: { heat: -5, relChange: 0, crewDamage: 0, bonusReward: 200 },
        },
        {
          id: 'atm_1b', label: 'GEZICHT BEDEKKEN', stat: 'charm', difficulty: 25,
          outcomes: { success: 'Je trekt je hoodie diep over je gezicht, zet een zonnebril op en verandert je looppatroon. Op camera ben je een schim — onherkenbaar, onvindbaar. De perfecte vermomming voor een imperfecte wereld.', partial: 'Je vermomming is redelijk, maar een windvlaag trekt je hoodie even opzij. Een fractie van een seconde, maar genoeg voor een gedeeltelijk beeld. Hopelijk kijkt niemand het terug.', fail: 'Op het slechtst mogelijke moment waait je hoodie af. Je staat vol in beeld, recht in de camera kijkend. Drie seconden, kristalhelder. Perfect bewijs.' },
          effects: { heat: 2, relChange: 0, crewDamage: 0, bonusReward: 50 },
        },
        {
          id: 'atm_1c', label: 'SNEL HANDELEN', stat: 'muscle', difficulty: 35,
          outcomes: { success: 'Snelheid is je wapen. In dertig seconden is de skimmer geplaatst, het cameraatje uitgelijnd, en de Bluetooth-verbinding actief. Record tijd. Je loopt weg voordat de camera ook maar één frame van je gezicht kan vastleggen.', partial: 'Je bent snel, maar niet snel genoeg. Een voorbijganger stopt en kijkt je vreemd aan terwijl je bij de ATM knielt. Je doet alsof je je veters strikt en loopt snel weg. De skimmer zit, maar je bent gezien.', fail: 'De stress maakt je vingers onhandig. De skimmer glijdt uit je handen, stuitert op het trottoir en breekt in twee stukken. Het plastic klinkt als een geweerschot in de stille straat. Missie voorbij.' },
          effects: { heat: 5, relChange: 0, crewDamage: 0, bonusReward: 100 },
        },
      ],
    },
    {
      id: 'atm_2',
      text: 'De skimmer draait al een uur en de data stroomt binnen op je telefoon — tientallen kaartnummers, pincodes, expiration dates. Je zit in je auto aan de overkant van de straat, half verscholen achter een bestelbusje. Dan, in je buitenspiegel: het onmiskenbare silhouet van een politieauto die langzaam de hoek om komt. De koplampen zwaaien over het asfalt. Ze stoppen bij de ATM.',
      districtVariants: {
        crown: 'Het is geen politie — het is erger. Een privébeveiliger op een elektrische scooter nadert, gekleed in het zwart met een bodycam op zijn borst. Hij controleert systematisch elke ATM in het blok. Dit is Crown Heights; hier betaal je voor beveiliging die de politie beschaamd maakt.',
        low: 'Een stel verslaafden nadert de ATM met wankele stappen. Ze zien de skimmer en denken dat het iets waardvols is — misschien drugs, misschien elektronica. Een van hen begint eraan te trekken. Als ze hem eraf halen, is al je werk voor niets geweest.',
        port: 'Een douane-inspecteur in een fluorescerend hesje loopt over het haventerrein met een scanner in zijn hand. Hij controleert niet alleen containers vanavond — hij checkt alles wat elektronisch is. De skimmer zendt een signaal uit dat zijn scanner kan oppikken.',
        iron: 'Twee Iron Skulls op motoren rijden langzaam voorbij, hun koplampen glijdend over de gevels. Een van hen stopt bij de ATM en stapt af. Hij haalt een biertje uit zijn binnenzak en leunt tegen de machine — precies waar je skimmer zit. Eén blik naar beneden en het is voorbij.',
        neon: 'De manager van het casino aan de overkant staat buiten een sigaar te roken. Hij kent elke ATM in de buurt — ze voeden zijn klanten met cash. Als hij iets vreemds ziet aan de kaartleuf, belt hij niet de politie maar zijn eigen beveiliging. En die zijn een stuk minder vriendelijk.',
      },
      choices: [
        {
          id: 'atm_2a', label: 'RUSTIG WEGWANDELEN', stat: 'charm', difficulty: 35,
          outcomes: { success: 'Je stapt ontspannen uit je auto, steekt een sigaret op, en wandelt het blok rond alsof je een avondwandeling maakt. De agenten controleren de ATM, zien niets verdachts, en rijden door. Je keert tien minuten later terug om de skimmer op te halen. Professionaliteit.', partial: 'Je loopt weg met gespeelde nonchalance, maar in de haast vergeet je de skimmer op te halen. Als je terugkomt is hij weg — iemand anders heeft hem gevonden. Je hebt de data die al was verzonden, maar niet de volledige buit.', fail: 'De agent stapt uit en roept je. "Meneer! Even wachten!" Je hart staat stil. Wegrennen of blijven? Je kiest het eerste en verdwijnt in een sprint. De skimmer is verloren, en ze hebben je signalement.' },
          effects: { heat: -3, relChange: 0, crewDamage: 0, bonusReward: 150 },
        },
        {
          id: 'atm_2b', label: 'SKIMMER SNEL VERWIJDEREN', stat: 'brains', difficulty: 40,
          outcomes: { success: 'Je loopt ontspannen naar de ATM alsof je geld wilt opnemen. Met een vloeiende beweging verwijder je de skimmer en stopt hem in je zak — het ziet eruit alsof je gewoon je kaart terugpakt. De agenten kijken even en rijden door. Alle data veilig.', partial: 'Je haalt de skimmer eraf, maar in de haast verlies je de SD-kaart met de helft van de opgeslagen data. De Bluetooth-data heb je nog wel. Half werk, maar geen bewijs achtergelaten.', fail: 'De skimmer zit vast — de lijm is te goed. Je trekt harder en de hele kaartleuf van de ATM breekt af. Het alarm gaat schel af. De agenten springen uit hun auto. Rennen.' },
          effects: { heat: 0, relChange: 0, crewDamage: 0, bonusReward: 300 },
        },
      ],
    },
    {
      id: 'atm_3',
      text: 'Terwijl je thuis de data analyseert, valt je iets op: er is een tweede signaal actief op dezelfde ATM — een andere frequentie, een ander protocol. Iemand anders is ook aan het skimmen. Jouw skimmer en de zijne zitten op dezelfde machine, en zijn data overlapt met de jouwe. Je volgt het signaal naar een grijs busje dat geparkeerd staat aan de overkant van de straat, de ramen geblindeerd.',
      districtVariants: {
        neon: 'De rivaal is geen amateur — je herkent zijn digitale handtekening van het dark web. Een bekende hacker van de Neon Strip die eerder beveiligingssystemen van casino\'s heeft gekraakt. Hij weet wie je bent, en jij weet wie hij is. Dit kan twee kanten op.',
        iron: 'Het signaal komt uit een verroest busje met het logo van de Iron Skulls op de zijkant — half overgespoten maar nog herkenbaar. Dit is hun terrein, en ze dulden geen concurrentie. De vraag is niet óf ze je vinden, maar wanneer.',
        port: 'Het tweede signaal komt van een vissersboot die afgemeerd ligt aan Dok 12. De antenne is vermomd als een radio-antenne. Slim — havenpersoneel let niet op één antenne meer of minder. De schipper is waarschijnlijk een smokkelaar die zijn technische vaardigheden diversifieert.',
        crown: 'De rivaal blijkt een ex-bankmedewerker te zijn die vanuit zijn Audi Q7 opereert — complete mobiele werkstation in de kofferbak, dubbel scherm, 5G-verbinding. Hij is professioneel, methodisch, en hij skimmt de rijkste ATM\'s van Crown Heights al maanden zonder betrapt te worden.',
        low: 'Het signaal komt uit een flatgebouw boven de wasserette — derde verdieping, raam op een kier. Een tiener, hooguit zeventien, met meer talent dan ervaring. Hij heeft je skimmer gekopieerd met onderdelen van AliExpress. Goedkoop maar effectief. De jeugd van tegenwoordig.',
      },
      choices: [
        {
          id: 'atm_3a', label: 'SIGNAAL KAPEN', stat: 'brains', difficulty: 50,
          outcomes: { success: 'Je bent beter dan hij. Met een man-in-the-middle attack kaap je niet alleen zijn data, maar ook zijn volledige kaartenbestand van de afgelopen maand. Dubbele buit — en hij heeft geen idee wie het was.', partial: 'Je slaagt erin zijn signaal te blokkeren, maar kunt zijn data niet stelen. Hij merkt de verstoring en is woedend, maar kan niets doen. Jouw data is veilig, de zijne niet.', fail: 'Hij is beter dan jij dacht. Terwijl jij zijn signaal probeert te kapen, draait hij het om — en steelt jouw complete dataset. Je scherm wordt zwart. "Bedankt voor de data," verschijnt er in je terminal.' },
          effects: { heat: 3, relChange: -2, crewDamage: 0, bonusReward: 400 },
        },
        {
          id: 'atm_3b', label: 'SAMENWERKEN', stat: 'charm', difficulty: 35,
          outcomes: { success: 'Je klopt op het raam van het busje. Na een gespannen moment gaat het open. "We splitsen de opbrengst. Geen gedoe, geen ruzie." Na een lange stilte knikt hij. Nieuwe contactpersoon erbij — en een grotere buit dan alleen.', partial: 'Hij is wantrouwig en wil garanties. Jullie komen tot een ongemakkelijk akkoord: 60/40, zijn kant. Niet eerlijk, maar beter dan een oorlog beginnen die je niet kunt winnen.', fail: 'Hij vertrouwt niemand — "Ik werk alleen." Het raam gaat dicht. En als je terugkomt bij de ATM, is je skimmer verdwenen. Hij heeft hem meegenomen als waarschuwing.' },
          effects: { heat: 0, relChange: 3, crewDamage: 0, bonusReward: 200 },
        },
        {
          id: 'atm_3c', label: 'CONFRONTEREN', stat: 'muscle', difficulty: 30,
          outcomes: { success: 'Je loopt naar het busje en slaat op het raam. Hard. "Dit is mijn ATM, mijn wijk, mijn operatie. Opsodemieteren." De motor start en het busje scheurt weg. Boodschap ontvangen.', partial: 'Hij opent het raam en er volgt een schreeuwpartij. Uiteindelijk rijdt hij weg, maar niet voordat de halve straat heeft meegekeken. Meer aandacht dan je wilde.', fail: 'Het raam gaat open en je kijkt in de loop van een taser. Vijftigduizend volt door je lichaam. Je ligt op het trottoir en kijkt hoe hij wegrijdt. Alles doet pijn.' },
          effects: { heat: 5, relChange: -3, crewDamage: 8, bonusReward: 100 },
        },
      ],
    },
  ],

  car_theft: [
    {
      id: 'ct_1',
      text: 'De auto staat geparkeerd in een verlaten zijstraat, glinsterend onder het licht van een eenzame straatlantaarn. Een zwarte BMW M5, dit jaar\'s model — minstens honderdduizend waard op de zwarte markt. De regen tikt zachtjes op het dak, waardoor de lak schittert als obsidiaan. Een bewaker — privé, niet politie — loopt zijn ronde aan de andere kant van het blok. Je hebt zijn patroon bestudeerd: elke acht minuten passeert hij dit punt. Je hebt er vijf.',
      districtVariants: {
        port: 'Een Porsche Cayenne staat tussen de containers bij Dok 7, de motor nog warm. De eigenaar — een havenbaas met banden met het Cartel — is binnen in het kantoor aan het onderhandelen over een zending. Zijn chauffeur zit in de portiersloge koffie te drinken. De sleutel zit in het contact.',
        crown: 'Een Lamborghini Huracán staat voor het penthouse, afgeleverd door de valet parking die net naar binnen is gegaan om een telefoontje te plegen. De sleutel steekt nog in het contact — arrogantie van de rijken. Je hebt misschien twee minuten voordat hij terugkomt.',
        iron: 'Een gepantserde Mercedes-AMG staat bij de zijingang van de staalfabriek. De eigenaar is Hammer, de baas van de Iron Skulls. Dit is suïcidaal — of briljant. De auto is honderdvijftigduizend waard, maar als ze je pakken, vind je jezelf terug op de bodem van de rivier.',
        low: 'Een opgevoerde Honda Civic Type R staat in het steegje achter de kapper — niet de duurste auto, maar met custom turbo, Recaro-stoelen en een nitrous-systeem dat hem sneller maakt dan de meeste supercars. De underground-racescene betaalt grof voor zo\'n machine.',
        neon: 'Een Ferrari 488 staat fout geparkeerd voor de VIP-ingang van de club, de waarschuwingsknipperlichten nog aan. De eigenaar — een of andere influencer met meer geld dan hersens — is binnen aan het feesten. Instagram-verhalen laten zien dat hij minstens nog twee uur bezig is.',
      },
      choices: [
        {
          id: 'ct_1a', label: 'FORCEER HET SLOT', stat: 'muscle', difficulty: 45,
          outcomes: { success: 'Je haalt je slim-jim uit je jas en glijdt hem langs het raam naar beneden. Een klik, een draai — het slot springt open. Je glijdt achter het stuur alsof de auto van jou is. Snelle vingers aan de draden onder het dashboard. De motor brult tot leven.', partial: 'Het slot breekt open, maar het alarm gaat kort af — een scherpe piep die door de stille straat snijdt voordat je het systeem uitschakelt. Je hart bonkt. Snel de motor starten en wegwezen voordat iemand komt kijken.', fail: 'Het slot is versterkt — een nieuw model dat je gereedschap niet aankan. Je duwt harder en het metaal piept en krast. Te veel lawaai. In een raam verderop gaat een lamp aan. Tijd om te vertrekken.' },
          effects: { heat: 8, relChange: 0, crewDamage: 0, bonusReward: 200 },
        },
        {
          id: 'ct_1b', label: 'HACK DE SLEUTEL', stat: 'brains', difficulty: 50,
          outcomes: { success: 'Je relay-device vangt het signaal op van de sleutel die binnen op de keukentafel ligt. De auto denkt dat de eigenaar ernaast staat. De portieren ontgrendelen geluidloos, de motor start op afstand. Elegant, efficiënt, onzichtbaar. Toekomst van autodiefstal.', partial: 'Het signaal is zwak — de sleutel ligt te ver weg. Na drie pogingen krijg je eindelijk een verbinding. De auto opent, maar je systeem heeft waarschijnlijk een digitaal spoor achtergelaten in het computersysteem van de auto.', fail: 'Het signaal wordt geblokkeerd door een Faraday-kooi — de eigenaar bewaart zijn sleutel in een signaal-blokkerende box. Nieuwer model, slimmere eigenaar. Je relay-device piept machteloos.' },
          effects: { heat: 3, relChange: 0, crewDamage: 0, bonusReward: 500 },
        },
        {
          id: 'ct_1c', label: 'LEID DE BEWAKER AF', stat: 'charm', difficulty: 40,
          outcomes: { success: 'Je belt 112 vanaf een wegwerptelefoon en meldt een inbraak twee straten verderop. De bewaker sprint weg om te kijken. Je hebt alle tijd van de wereld. Dank je, nooddiensten.', partial: 'Je afleiding werkt — de bewaker loopt weg, maar aarzelt en kijkt nog een keer achterom. Je hebt minder tijd dan gepland. Snel, snel, snel.', fail: '"Mooi geprobeerd," zegt de bewaker in zijn portofoon, "maar ik trap er niet in. Stuur versterking naar sector 7." Hij belt de politie terwijl hij op je afloopt.' },
          effects: { heat: 5, relChange: 0, crewDamage: 0, bonusReward: 300 },
        },
      ],
    },
    {
      id: 'ct_2',
      text: 'De motor ronkt onder je handen, het stuur trilt licht, de geur van nieuw leer vult je neusgaten. De straat glijdt voorbij terwijl je de eerste bocht neemt — soepel, beheerst. Dan check je de achteruitkijkspiegel en je maag draait om: koplampen. Twee stuks, dichtbij en snel dichterbij komend. Ze knipperen met hun grootlicht. Iemand achtervolgt je, en ze zijn niet van plan om op te geven.',
      districtVariants: {
        port: 'De havenpolitie heeft de uitgang geblokkeerd met een barrière van betonblokken. Zoeklichten van de wachttorens zwaaien over het terrein en vinden je auto. Een stem door een megafoon: "STOP HET VOERTUIG. ONMIDDELLIJK." Je hebt misschien één ontsnappingsroute over.',
        crown: 'Een beveiligingsdrone — klein, snel, onvermoeibaar — volgt je met een schijnwerper die alles in een koud wit licht baadt. De GPS-tracking van de auto is waarschijnlijk al geactiveerd. Privébeveiliging is onderweg. Dit is Crown Heights; hier hebben ze budgetten die de politie beschaamd maken.',
        iron: 'Twee motoren — zwaar, Harley-achtig — verschijnen in je spiegels. De rijders dragen leren vesten met het Iron Skulls-embleem. Ze komen van twee kanten, ze proberen je in te sluiten. Dit is hun terrein en ze kennen elke straat, elke steeg, elke doodlopende weg.',
        neon: 'De valet parking-jongen — jonger dan je dacht, maar sneller — rent achter je auto aan terwijl hij schreeuwt in zijn portofoon. "HIJ GAAT RICHTING BOULEVARD! RODE BMW! BLOKKEER DE KRUISING!" Hij heeft vrienden, en ze zijn georganiseerd.',
        low: 'Een groep jongeren op scooters — de Lowrise Runners — heeft je zien vertrekken en ruikt een kans. Ze zwermen om je auto als wespen, trappend tegen de portieren en filmend met hun telefoons. Een van hen gooit een baksteen naar je voorruit. Dit is geen achtervolging, dit is een straatoorlog.',
      },
      choices: [
        {
          id: 'ct_2a', label: 'SCHEUR WEG', stat: 'muscle', difficulty: 40,
          outcomes: { success: 'Je trapt het gaspedaal tot de bodem. De motor schreeuwt, de banden roken, en de stad wordt een waas van lichten. Door rood, over de stoep, door een parkeergarage heen — en ze zijn weg. Je hart bonkt in je keel. Puur adrenaline.', partial: 'Je ontsnapt, maar in een scherpe bocht schamp je een lantaarnpaal. De zijspiegel vliegt eraf en er zit een lelijke deuk in het portier. De heler zal minder betalen, maar je bent vrij.', fail: 'De auto is snel, maar jouw rijvaardigheid is niet genoeg. In een te scherpe bocht verlies je de controle — de achterkant breekt uit en je schuift zijwaarts een steeg in. Ze halen je in voordat je de motor opnieuw kunt starten.' },
          effects: { heat: 10, relChange: 0, crewDamage: 5, bonusReward: 0 },
        },
        {
          id: 'ct_2b', label: 'NEEM DE SLUIPROUTE', stat: 'brains', difficulty: 45,
          outcomes: { success: 'Je herinnert je een steegje dat je vorige week hebt verkend — net breed genoeg voor een auto, maar te smal voor hun SUV. Je duikt erin, de spiegels scheren langs de muren. Aan de andere kant ben je vrij. Verdwenen als een geest.', partial: 'De sluiproute werkt, maar het steegje is smaller dan je dacht. Je moet stapvoets rijden terwijl je achtervolgers te voet langs het steegje rennen. Je ontsnapt, maar het kost kostbare minuten.', fail: 'Je draait het steegje in en — bouwsteigers. Het is geblokkeerd door renovatiewerkzaamheden die er vorige week nog niet waren. Doodlopend. De koplampen verschijnen achter je.' },
          effects: { heat: 2, relChange: 0, crewDamage: 0, bonusReward: 200 },
        },
        {
          id: 'ct_2c', label: 'BEL EEN CONTACT', stat: 'charm', difficulty: 35,
          outcomes: { success: 'Eén telefoontje naar een vriend die bij de kruising woont. "Zet je bestelbus dwars op de weg. Nu." Dertig seconden later is de weg geblokkeerd. Je achtervolgers staan muurvast. Je rijdt grijnzend weg.', partial: 'Je contact neemt op maar is laat. Net op het moment dat je achtervolgers je bijna hebben, blokkeert hij de weg. Je schiet door een gat dat net groot genoeg is. Nipte ontsnapping, trillende handen.', fail: 'Geen gehoor. Voicemail. Je probeert een tweede nummer — bezet. Je staat er alleen voor op een rechte weg met steeds dichterbij komende koplampen. Dit wordt improviseren.' },
          effects: { heat: 0, relChange: 5, crewDamage: 0, bonusReward: 100 },
        },
      ],
    },
    {
      id: 'ct_3',
      text: 'De auto is afgeleverd bij de heler in een garage ergens aan de rand van de stad. Hij inspecteert het voertuig met de blik van een chirurg — elke kras, elke deuk, het kilometerteller. Dan leunt hij tegen de werkbank en kruist zijn armen. "Er is een probleem," zegt hij. "De eigenaar heeft een bounty op je hoofd gezet. Tienduizend euro. En iemand heeft gepraat — ze weten hoe je eruitziet."',
      districtVariants: {
        iron: 'De Iron Skulls beweren dat de auto van een van hun kapiteins was — een cadeau van Hammer persoonlijk. Ze willen gecompenseerd worden: dubbele waarde van de auto, of je knieën. "Dit is Iron Borough," zegt de boodschapper. "Hier stelen we niet van onze eigen mensen."',
        crown: 'De eigenaar blijkt een gemeenteraadslid te zijn — iemand met connecties, advocaten, en een budget voor privédetectives. Ze zijn je al op het spoor: binnen 24 uur hebben ze een foto van je gezicht, je adres, je telefoonnummer. De druk stijgt met elk uur.',
        port: 'De havenbaas wiens Porsche je hebt gestolen heeft connecties met het Cartel. Een boodschapper — kalm, beleefd, met een litteken over zijn wang — klopt op je deur. "Meneer Alvarez wil zijn auto terug. Of een compensatie die hem... tevredenstelt." De implicatie is kristalhelder.',
        neon: 'De influencer wiens Ferrari je hebt gejat heeft het hele verhaal op Instagram gezet — compleet met beveiligingsbeelden en een beloning van tienduizend euro voor informatie. Zijn twee miljoen volgers zijn nu amateur-detectives. Je gezicht circuleert in elke DM-groep op de Strip.',
        low: 'De underground-racescene is een kleine wereld. Binnen een dag weet iedereen in Lowrise dat jij de Type R hebt gestolen. De eigenaar — een lokale held die drie straatracetitels heeft gewonnen — heeft zijn crew gemobiliseerd. Ze kennen elke steeg, elke doorgang, elke schuilplaats.',
      },
      choices: [
        {
          id: 'ct_3a', label: 'SPOREN WISSEN', stat: 'brains', difficulty: 45,
          outcomes: { success: 'Je gaat methodisch te werk: cameradbeelden wissen, vingerafdrukken vernietigen, DNA met bleek behandelen. Je verandert je uiterlijk, dumpt je telefoon, en verdwijnt voor twee weken. Als de storm is gaan liggen, bestaat er geen enkel bewijs dat jij het was. De auto was nooit gestolen.', partial: 'Je wist de meeste sporen, maar er is nog een getuige — een buurvrouw die je heeft gezien vanuit haar raam. Ze kan je niet identificeren, maar haar verklaring houdt het dossier open. Extra voorzichtigheid de komende weken.', fail: 'Te laat. De forensische afdeling heeft al DNA-materiaal van het stuur en een vingerafdruk van de binnenspiegel. Je sporen wissen heeft geen zin meer — het bewijs is al verzameld. De druk neemt toe.' },
          effects: { heat: -5, relChange: 0, crewDamage: 0, bonusReward: 100 },
        },
        {
          id: 'ct_3b', label: 'DE VERRADER VINDEN', stat: 'muscle', difficulty: 40,
          outcomes: { success: 'Het kostte je twee dagen en drie gesprekken met de juiste mensen, maar je vindt degene die heeft gepraat — een garageknecht die dacht snel geld te verdienen. Na een stevig "gesprek" in een verlaten pakhuis zal hij nooit meer praten. Over wat dan ook.', partial: 'Je vindt de verrader, maar hij is al gevlucht naar een andere stad. Tenminste weet je nu wie het was — en zijn adres bij zijn moeder. Dat kan later nog van pas komen.', fail: 'Het was een val. De verrader had twee mannen meegenomen voor het geval je zou komen. Het wordt een onaangenaam gesprek met vuisten als argumenten. Je trekt je terug — bont en blauw.' },
          effects: { heat: 8, relChange: -5, crewDamage: 10, bonusReward: 0 },
        },
        {
          id: 'ct_3c', label: 'DEAL SLUITEN', stat: 'charm', difficulty: 35,
          outcomes: { success: 'Via een tussenpersoon benader je de eigenaar. "Twintig procent van de waarde, cash, en dit verdwijnt." Na een dag onderhandelen trekt hij de bounty in. Business is business, zelfs in de onderwereld.', partial: 'Hij wil meer dan verwacht — dertig procent plus een verontschuldiging. Je slikt je trots in en betaalt. De bounty verdwijnt, maar je portemonnee bloedt.', fail: 'Hij wil alles terug: de auto, de opbrengst, plus vijftigduizend schadevergoeding. "Of ik stuur mijn mensen." Geen deal mogelijk. De bounty staat nog steeds.' },
          effects: { heat: -3, relChange: 2, crewDamage: 0, bonusReward: -100 },
        },
      ],
    },
    {
      id: 'ct_4',
      text: 'Je bent niet de enige die vanavond op jacht is. Op de parkeerplaats, halverwege je sprint naar de auto, sta je oog in oog met een ander: een rivaliserende autodief, gekleed in het zwart, handschoenen aan, dezelfde gereedschappen in zijn handen als jij. Jullie staren elkaar een moment aan — twee roofdieren die hetzelfde prooi hebben gekozen. De auto staat precies tussen jullie in. De spanning is tastbaar.',
      districtVariants: {
        neon: 'Het is een bekende van de Strip — een racer met een reputatie voor snelheid en roekeloos rijgedrag. Hij grijnst uitdagend. "Race? Eerste die de motor start, wint." Zijn vingers trommelen ongeduldig op zijn broek.',
        port: 'Een havenrat — breed, gespierd, met een sloophammer over zijn schouder — loopt op dezelfde auto af. Hij is niet van plan om hem te stelen; hij wil hem strippen voor onderdelen. Als hij begint, is de auto niks meer waard.',
        crown: 'Een professionele autodief in een driedelig pak — handschoenen van lamsleer, relay-device in zijn borstzak. Hij werkt voor een internationale ring die luxe auto\'s verscheept naar het Midden-Oosten. "Ik stel voor dat we dit beschaafd oplossen," zegt hij met een accent dat je niet kunt plaatsen.',
        iron: 'Een Iron Skulls-prospect — jong, hongerig, met iets te bewijzen. Hij heeft een koevoet en geen geduld. "Die auto is voor mijn initiatie," gromt hij. "Zoek een andere of ik gebruik dit ding op jou in plaats van het slot."',
        low: 'Een straatjoch van hooguit vijftien met een hoodie en een slim-jim die groter is dan zijn arm. Hij is snel, brutaal, en heeft niets te verliezen. "First come first served, ouwe," zegt hij met een grijnslach. De jeugd van Lowrise kent geen angst.',
      },
      choices: [
        {
          id: 'ct_4a', label: 'RACE ERNAARTOE', stat: 'muscle', difficulty: 35,
          outcomes: { success: 'Je zet het op een sprint. Je bent sneller — de sleutel is in je hand en de motor draait voordat hij halverwege is. Je zwaait als je wegrijdt. Tot ziens.', partial: 'Jullie komen tegelijk aan bij het portier. Een kort maar intens gevecht — duwend, trekkend. Je wint op pure wilskracht en rijdt weg met een gescheurde mouw en een brede grijns.', fail: 'Hij is groter, sneller, en sterker. Hij duwt je opzij alsof je een kind bent en rijdt weg in de auto die van jou had moeten zijn. Je staat in de regen, leeghandig.' },
          effects: { heat: 5, relChange: 0, crewDamage: 5, bonusReward: 150 },
        },
        {
          id: 'ct_4b', label: 'SLIM SPELEN', stat: 'brains', difficulty: 40,
          outcomes: { success: 'Terwijl hij staat te poseren, heb jij het alarm al uitgeschakeld via je relay-device. De auto start op afstand. Je stapt in en rijdt weg terwijl hij nog staat te kijken. Brains beats brawn.', partial: 'Je hackt het slot open maar hij probeert tegelijkertijd het andere portier te openen. Je rijdt weg met een open passagiersdeur die tegen een lantaarnpaal klapt. Niet elegant, maar effectief.', fail: 'De spanning maakt je vingers onhandig. Je techniek faalt op het slechtste moment. Hij lacht, trekt het portier open met een koevoet, en rijdt weg. Je staat als een amateur in de kou.' },
          effects: { heat: 3, relChange: 0, crewDamage: 0, bonusReward: 300 },
        },
        {
          id: 'ct_4c', label: 'ONDERHANDELEN', stat: 'charm', difficulty: 30,
          outcomes: { success: '"Hé. Er staan genoeg auto\'s hier. Jij neemt de Audi, ik neem de BMW. Iedereen blij, niemand gewond." Hij denkt na, knikt, en jullie gaan elk een kant op. Professioneel onder professionals.', partial: 'Hij wil een percentage van jouw opbrengst — dertig procent om weg te lopen. Minder winst, maar ook geen blauwe plekken. Soms is diplomatie de beste investering.', fail: 'Hij vertrouwt je niet — en eigenlijk heb je daar gelijk in. De onderhandeling escaleert naar een schreeuwpartij en dan naar vuisten. Niemand krijgt de auto vanavond.' },
          effects: { heat: 0, relChange: 3, crewDamage: 0, bonusReward: 50 },
        },
      ],
    },
  ],

  store_robbery: [
    {
      id: 'sr_1',
      text: 'De juwelier is bijna leeg — het is kwart voor sluitingstijd. Eén klant bladert door een catalogus bij de toonbank. Eén bewaker — jong, verveeld, scrollend op zijn telefoon — leunt tegen de deurpost. Achter het kogelvrije glas van drie vitrines liggen diamanten, gouden ringen en platina horloges die samen meer waard zijn dan sommige huizen. Het alarmsysteem heeft een vertraging van dertig seconden — dat heb je gecheckt. De nooduitgang is links achterin. Je ademt diep in. Hier gaat het om.',
      districtVariants: {
        crown: 'De exclusieve juwelier in Crown Heights is een fort: kogelvrij glas, laserbeveiliging, infraroodsensoren en een directe lijn naar een privébeveiligingsbedrijf. De buit is het dubbele waard van elke andere locatie — maar de beveiliging is drie niveaus hoger.',
        iron: 'Een pandjesbaas in Iron Borough — vitrines vol gestolen goud en tweedehands sieraden. De beveiliging is minimaal, maar de buurt kijkt mee. Iedereen kent iedereen hier, en iemand zal praten.',
        low: 'Een goudhandelaar in Lowrise met een simpele vitrine en een hangslot. Maar de eigenaar — een veteraan met grijs haar en koude ogen — heeft een afgekorte shotgun onder de toonbank en dertig jaar ervaring met overvallers. Onderschat hem niet.',
        neon: 'Een luxe horlogewinkel op de Strip, glanzend en modern. Het is druk met toeristen die foto\'s maken en prijzen vergelijken. Perfecte dekking — in de chaos van twintig mensen die rondlopen, valt één paar snelle handen niet op.',
        port: 'Een smokkelkantoor bij Dok 9 dat dienst doet als dekmantel voor een illegale goudsmelterij. De vitrines staan vol "souvenirs" — in werkelijkheid ongedeclareerd goud uit West-Afrika. De bewaker is een gepensioneerde zeeman met één oog en een matrozennes. Maar achter de toonbank zit voor tweehonderdduizend aan edelmetaal.',
      },
      choices: [
        {
          id: 'sr_1a', label: 'WAPEN TREKKEN', stat: 'muscle', difficulty: 50,
          outcomes: { success: '"IEDEREEN OP DE GROND! NU!" Je stem galmt door de winkel als een donderslag. De klant duikt meteen. De bewaker bevriest — zijn hand halverwege zijn holster, maar zijn ogen zeggen dat hij het niet aandurft. In twintig seconden heb je de controle over de hele situatie.', partial: 'De bewaker aarzelt maar legt uiteindelijk zijn wapen neer. De klant begint echter naar de uitgang te kruipen. Je hebt de situatie niet volledig onder controle — er zijn te veel variabelen. Snel handelen.', fail: 'De bewaker is sneller dan je dacht — een veteraan, geen amateur. Hij trekt zijn wapen in één vloeiende beweging. Jullie staan oog in oog, twee gewapende mensen in een kleine ruimte vol diamanten. Dit wordt gevaarlijk.' },
          effects: { heat: 15, relChange: 0, crewDamage: 10, bonusReward: 500 },
        },
        {
          id: 'sr_1b', label: 'AFLEIDINGSMANEUVER', stat: 'charm', difficulty: 45,
          outcomes: { success: 'Je hebt een handlanger buiten geposteerd die precies op het juiste moment een scène trapt — geschreeuw, een neppistool, paniek. De bewaker en de klant rennen naar het raam. In de chaos heb je precies dertig seconden om de vitrine leeg te halen. Meer dan genoeg.', partial: 'De afleiding werkt half — de bewaker kijkt naar buiten maar de eigenaar niet. Hij staat achter de toonbank en kijkt je recht aan met een blik die zegt: "Ik weet wat je van plan bent." Je hebt minder tijd dan gepland.', fail: 'Niemand trapt erin. De handlanger buiten is te overdreven, te nep. De bewaker kijkt even en keert terug naar zijn post — alerter dan voorheen. Je window is gesloten.' },
          effects: { heat: 8, relChange: 0, crewDamage: 0, bonusReward: 300 },
        },
        {
          id: 'sr_1c', label: 'GLAS HACKEN', stat: 'brains', difficulty: 55,
          outcomes: { success: 'Je hebt het alarmsysteem bestudeerd: een draadloos signaal op 433 MHz. Met een jammer schakkel je het uit. Dan een glassnijder — precies, stil, chirurgisch. Een perfect rond gat in de vitrine. Je hand glijdt erin en pakt de diamanten alsof ze van jou zijn. Niemand merkt iets tot morgenochtend.', partial: 'Het alarm is uitgeschakeld maar het glas is sterker dan verwacht. Na dertig seconden snijden heb je een gat dat net groot genoeg is om je hand door te steken. Je grijpt wat je kunt — het is minder dan gehoopt, maar het is iets.', fail: 'Het beveiligingssysteem is van een generatie die je niet herkent — gelaagde encryptie, anti-tamper detectie. Zodra je jammer actief wordt, schreeuwt het alarm door de hele straat. Rood-blauw licht reflecteert al op de etalageruit.' },
          effects: { heat: 5, relChange: 0, crewDamage: 0, bonusReward: 800 },
        },
      ],
    },
    {
      id: 'sr_2',
      text: 'De buit zit in je tas — zwaar, hoekig, en meer waard dan je in een maand verdient. Je hart bonkt terwijl je naar de uitgang loopt. Maar dan hoor je het: sirenes. Eerst zacht, dan snel luider wordend. De politie is onderweg, en ze zijn snel vandaag — te snel. Iemand moet een stil alarm hebben geactiveerd. Door het raam zie je al blauwe lichten de hoek om komen. Je hebt misschien zestig seconden.',
      districtVariants: {
        port: 'De havenpolitie nadert van twee kanten tegelijk — gecoördineerd, professioneel. Boven je hoofd hoor je het onmiskenbare geluid van rotorbladen. Een helikopter. Dit is geen standaard respons — iemand heeft serieuze middelen ingezet.',
        crown: 'Geen politie — erger. Twee zwarte SUV\'s van een privébeveiligingsbedrijf blokkeren beide uitgangen. Mannen in kogelvrije vesten stappen uit met de efficiëntie van een militaire operatie. In Crown Heights betaal je voor het beste.',
        low: 'De buurt is wakker geschud door het alarm. Mensen komen uit hun huizen en blokkeren de straat — niet om je te helpen, maar om het spektakel te zien. Een muur van gezichten en telefoons die filmen. Je bent trending op TikTok voordat je de hoek om bent.',
        iron: 'De fabrieksirene van de staalfabriek begint te loeien — iemand heeft het noodalarm geactiveerd. Binnen seconden stromen arbeiders de straat op, verward en boos. De chaos is perfect camouflage, maar de Iron Skulls patrouille heeft de sirene ook gehoord en komt deze kant op.',
        neon: 'De neonreclames van de Strip reflecteren in de natte straat terwijl zware bassen uit elke club pompen. Een uitsmijter bij de Velvet Room ziet je rennen en belt onmiddellijk de stripbeveiliging — een privénetwerk dat sneller reageert dan de politie. Binnen dertig seconden zijn alle uitgangen van het blok geblokkeerd.',
      },
      choices: [
        {
          id: 'sr_2a', label: 'ACHTERUITGANG', stat: 'brains', difficulty: 40,
          outcomes: { success: 'Je herinnert je de plattegrond die je vorige week hebt bestudeerd: achter de opslagruimte is een branddeur die uitkomt op een netwerk van steegjes. Je glipt naar achteren, duwt de deur open, en verdwijnt in het donker. Spoorloos.', partial: 'De branddeur is op slot — een hangslot dat er vorige week nog niet was. Je forceert het met een koevoet uit de opslag, maar het kost kostbare seconden. De sirenes zijn nu oorverdovend dichtbij.', fail: 'De branddeur opent naar een kleine binnenplaats — volledig omringd door muren van drie meter hoog. Doodlopend. De sirenes komen dichterbij. Je zit in de val als een rat.' },
          effects: { heat: -5, relChange: 0, crewDamage: 0, bonusReward: 200 },
        },
        {
          id: 'sr_2b', label: 'DOORBRÉKEN', stat: 'muscle', difficulty: 50,
          outcomes: { success: 'Je rent de voordeur uit en recht op de naderende agenten af. Ze verwachten dat je stopt — maar je stopt niet. Met een sprong over een motorkap en een sprint door de menigte ben je verdwenen voordat ze kunnen reageren. Puur adrenaline en onverwachte brutaliteit.', partial: 'Je breekt door de linie maar een agent grijpt je jas. Je trekt je los — de stof scheurt — en rent verder. Een straatsteen snijdt in je knie. Maar je bent vrij, en de buit is veilig.', fail: 'De eerste agent is te snel. Hij tackelt je op het trottoir. Diamanten rollen over het asfalt terwijl omstanders gapen. Je trekt je los maar de helft van de buit ligt verspreid op straat.' },
          effects: { heat: 12, relChange: 0, crewDamage: 15, bonusReward: 0 },
        },
      ],
    },
    {
      id: 'sr_3',
      text: 'Het plan ontspoort. De bewaker — sneller dan verwacht — heeft de noodknop onder de toonbank ingedrukt. Een rood lampje knippert boven de deur. De politie is onderweg, ETA drie minuten. En dan begint de klant te schreeuwen — een hoge, panische gil die door de hele winkel snijdt. De eigenaar duikt achter de toonbank. De bewaker grijpt naar zijn holster. Dit escaleert snel en je hebt seconden om een beslissing te nemen die alles kan veranderen.',
      districtVariants: {
        crown: 'De schreeuwende klant is de vrouw van een gemeenteraadslid — dat zie je aan de ring. Als haar iets overkomt, heb je niet alleen de politie maar het hele stadsbestuur op je dak. Maar als je haar kalmeert, heb je misschien een diplomatiek voordeel dat meer waard is dan diamanten.',
        neon: 'De paniek trekt een menigte voor het raam. Smartphones worden opgeheven. Camera\'s flitsen. Iemand is al aan het livestreamen. Je gezicht — of wat ervan zichtbaar is achter je masker — is nu live te zien voor duizenden kijkers. De klok tikt.',
        port: 'De bewaker blijkt een oud-marineman te zijn die nog steeds traint alsof hij in dienst is. Hij heeft zijn wapen al getrokken en staat in een perfecte schiethouding. De klant — een havenarbeider met armen als boomstammen — kijkt je aan alsof hij overweegt je zelf aan te pakken. De haven kent zijn eigen gerechtigheid.',
        iron: 'De pandjesbaas drukt niet op een alarmknop — hij pakt een honkbalknuppel van onder de toonbank en loopt op je af. "In Iron Borough lossen we dit zelf op," gromt hij. Buiten hoor je het gerommel van motoren — de Iron Skulls hebben het kabaal gehoord en komen poolshoogte nemen.',
        low: 'Een groep buurtbewoners verzamelt zich voor de winkel — niet om te helpen, maar om te kijken of er iets te graaien valt in de chaos. De eigenaar schreeuwt in het Turks naar iemand aan de telefoon. Zijn neven wonen drie straten verderop en ze staan bekend om hun korte lontje. Je hebt misschien twee minuten.',
      },
      choices: [
        {
          id: 'sr_3a', label: 'GIJZELINGSSITUATIE', stat: 'muscle', difficulty: 55,
          outcomes: { success: 'Je neemt de controle met een kalmte die zelfs jou verrast. "Iedereen rustig. De politie komt, en ze zullen luisteren naar wat ik te zeggen heb." Je barricadeert de deur, positioneert iedereen bij het raam als levend schild. De SWAT-onderhandelaar belt binnen drie minuten. Jij dicteert de voorwaarden.', partial: 'Je krijgt de situatie onder controle, maar de spanning is om te snijden. De bewaker kijkt je aan met ogen vol haat. De klant huilt zachtjes. Je hebt misschien twintig minuten voordat iemand iets stoms doet.', fail: 'De SWAT-eenheid was al in de buurt — een toevallige patrouille. Ze stormen binnen met flashbangs en precisie. Het is voorbij in seconden. Je ligt op de grond met een knie in je rug.' },
          effects: { heat: 20, relChange: -5, crewDamage: 15, bonusReward: 600 },
        },
        {
          id: 'sr_3b', label: 'IEDEREEN KALMEREN', stat: 'charm', difficulty: 45,
          outcomes: { success: 'Je laat je wapen zakken. "Luister. Niemand hoeft gewond te raken. Ik loop naar buiten, jullie doen alsof ik er nooit was. De verzekering dekt alles." Je stem is kalm, redelijk, bijna vriendelijk. De bewaker aarzelt. De klant stopt met schreeuwen. Ze gehoorzamen. Je loopt naar buiten alsof er niets is gebeurd.', partial: 'De klant kalmeert, maar de bewaker is een probleem — hij wil een held zijn. Je praat, kalmeert, overtuigt. Uiteindelijk laat hij je gaan, maar niet zonder een lange blik die zegt: "Ik zal je herinneren."', fail: 'De paniek escaleert in plaats van te verdwijnen. De klant grijpt naar je wapen, de bewaker sprint naar de deur. In de chaos raakt iemand gewond. Dit was niet het plan.' },
          effects: { heat: 8, relChange: 0, crewDamage: 5, bonusReward: 300 },
        },
        {
          id: 'sr_3c', label: 'ROOKBOM GOOIEN', stat: 'brains', difficulty: 40,
          outcomes: { success: 'Je trekt de pin en gooit. De rookbom vult de winkel in seconden met een dikke, grijze mist. Hoestend, struikelend, totaal gedesoriënteerd — iedereen grijpt naar hun ogen. In de chaos glijp je naar buiten met de tas vol diamanten. Als de rook optrekt, ben je drie blokken verderop.', partial: 'De rook werkt maar je oriëntatie is minder goed dan verwacht in de mist. Je botst tegen een vitrine — glas breekt, een deel van de buit valt. Je grijpt wat je kunt en verdwijnt. Minder dan gepland, maar je bent vrij.', fail: 'De rookbom sist, sputtert... en ontploft niet. Een dunne sliert rook kringelt omhoog. Iedereen in de winkel staart je aan. De bewaker grijpt zijn wapen. De klant begint weer te schreeuwen. Dit is een nachtmerrie.' },
          effects: { heat: 10, relChange: 0, crewDamage: 0, bonusReward: 400 },
        },
      ],
    },
  ],

  crypto_heist: [
    {
      id: 'ch_1',
      text: 'De serverruimte is koud — ijskoud. De airco blaast op volle kracht om de rijen servers gekoeld te houden. Groene en blauwe LED\'s flikkeren als honderden kleine ogen in het halfduister. Ergens in deze ruimte staat het doelwit: een air-gapped systeem met een cold storage wallet die miljoenen waard is aan cryptocurrency. Het is niet verbonden met het internet — fysieke toegang is de enige manier. Je hebt tien minuten voordat het wachtwoord automatisch roteert en het systeem in lockdown gaat.',
      districtVariants: {
        crown: 'De serverruimte van een hedgefund in Crown Heights — drie lagen beveiliging, biometrische deuren, en een team van cybersecurity-experts die 24/7 het netwerk monitoren. De beloning is astronomisch, maar één fout en je wordt gevonden voordat je het gebouw uit bent.',
        neon: 'Een illegaal crypto-wisselkantoor achter een club op de Strip — de beveiliging is menselijk, niet digitaal. Twee bewakers bij de deur, één camera die waarschijnlijk niet eens opneemt. Maar de walletbeheerder is een paranoïde genie die zijn systeem dagelijks verandert.',
        port: 'Een offshore server op een vrachtschip dat afgemeerd ligt aan Dok 14. Het schip beweegt zachtjes op de deining terwijl je via een roestige ladder aan boord klimt. De serverruimte is een omgebouwde container onder het dek — koud, vochtig, en buiten elke jurisdictie. De bemanning is in de stad aan het drinken.',
        iron: 'Een verlaten staalfabriek omgebouwd tot illegale mining-farm. Honderden GPU\'s gonzen achter provisorische muren van golfplaat. De warmte is ondraaglijk — vijfenveertig graden. De eigenaar is een ex-ingenieur van de fabriek die de stroomaansluiting nooit heeft opgezegd. Gratis elektriciteit, miljoenen aan crypto.',
        low: 'Een woonkamer op de derde verdieping van een flatgebouw in Lowrise. De "serverruimte" is een IKEA-kast vol tweedehands laptops die als nodes draaien. De eigenaar — een zelfgeleerde tiener — slaapt in de kamer ernaast. Zijn wallet bevat verrassend veel geld voor zo\'n amateuristische setup.',
      },
      choices: [
        {
          id: 'ch_1a', label: 'EXPLOIT DRAAIEN', stat: 'brains', difficulty: 65,
          outcomes: { success: 'Je laptop is verbonden via een Ethernet-kabel die je rechtstreeks in de server hebt geplugd. Je zero-day exploit — drie maanden research — breekt de firewall in achtenveertig seconden. De wallet opent. Transferring... 100%. Miljoenen in crypto, onherleidbaar overgemaakt naar je eigen cold wallet.', partial: 'De exploit breekt de eerste laag, maar het systeem detecteert onregelmatigheden en begint alles te loggen. Je krijgt de transfer erdoor, maar ze hebben een digitaal spoor naar je MAC-adres. Hopelijk heb je het goed gespoofed.', fail: 'De firewall detecteert je exploit binnen milliseconden — dit systeem is geüpdatet sinds je laatste reconnaissance. Een rood scherm flitst op: "INTRUSION DETECTED." Het hele gebouw gaat in lockdown. De deuren vergrendelen met een zware klik.' },
          effects: { heat: 5, relChange: 0, crewDamage: 0, bonusReward: 3000 },
        },
        {
          id: 'ch_1b', label: 'SOCIAL ENGINEERING', stat: 'charm', difficulty: 55,
          outcomes: { success: 'Je belt de systeembeheerder op zijn privénummer — verkregen via drie weken research. "Met de CTO. We hebben een beveiligingslek. Ik heb je admin-wachtwoord nodig om een patch te draaien. Nu." Zijn stem trilt maar hij geeft het. Mensen zijn altijd de zwakste schakel.', partial: 'Hij is wantrouwig maar geeft je uiteindelijk een hint — genoeg om de rest zelf te bruteforcen. Het kost je extra minuten die je niet hebt, maar je komt binnen.', fail: '"Ik bel je terug via het officiele nummer," zegt hij. Verdomme. Tien seconden later gaat je telefoon — het is de politie. Hij heeft ze gebeld terwijl jullie nog aan het praten waren.' },
          effects: { heat: 3, relChange: 0, crewDamage: 0, bonusReward: 2000 },
        },
        {
          id: 'ch_1c', label: 'USB DRIVE PLAATSEN', stat: 'muscle', difficulty: 50,
          outcomes: { success: 'Je sluipt de serverruimte in via een ventilatieschacht en plugt een USB-drive met custom malware in de juiste server. De software doet de rest: het installeert een rootkit, extraheert de private keys, en wist zijn eigen sporen. Schoon, efficiënt, onzichtbaar.', partial: 'Je bereikt de server en plugt de USB in, maar een bewaker hoort iets en opent de deur. Je rolt achter een serverkast en houdt je adem in. Hij kijkt rond, haalt zijn schouders op, en loopt weg. Maar je hart klopt in je keel.', fail: 'Halverwege de schacht hoor je een stem: "Wat doe je hier?" Een bewaker met een zaklamp schijnt in je gezicht. Zijn hand gaat naar zijn wapen. De missie is voorbij — en dit gesprek wordt onplezierig.' },
          effects: { heat: 8, relChange: 0, crewDamage: 5, bonusReward: 1500 },
        },
      ],
    },
    {
      id: 'ch_2',
      text: 'De transfer is bezig. Het voortgangsbalkon kruipt omhoog: 40%... 55%... 72%... De seconden tikken weg als druppels in een infuus. Dan, op 83%, flikkert het scherm. Foutmelding. Iemand probeert de transfer te stoppen — een counter-hack, real-time. Iemand aan de andere kant van de verbinding is wakker geworden, heeft de ongeautoriseerde toegang gezien, en vecht nu terug. De progressiebalk stottert: 84%... 84%... 83%... Ze pushen je terug.',
      districtVariants: {
        crown: 'Hun counter-hacker is geen amateur — het is een door de staat opgeleid cybersecurity-team. Ze proberen je IP te traceren terwijl ze de transfer blokkeren. Je hebt misschien twee minuten voordat ze je locatie hebben gepinpoint.',
        port: 'Het vrachtschip begint onverwacht zijn motoren te starten — de kapitein is teruggekomen van de kroeg. De vibraties verstoren je verbinding en de transfer stottert. Je laptop schuift over het bureau terwijl het schip langzaam van de kade wegdraait. Je moet dit afronden voordat je op open zee zit.',
        iron: 'De mining-farm trekt zoveel stroom dat de zekeringen beginnen te knetteren. Een van de GPU-racks begint te roken — de koeling kan het niet meer aan. Als de stroom uitvalt, verlies je alles. De temperatuur stijgt met elke seconde.',
        neon: 'De walletbeheerder is wakker geworden — je hoort zijn voetstappen boven het gebonk van de bass uit de club. Hij schreeuwt iets in het Mandarijn en je hoort het geluid van een kluis die opengaat. Hij haalt waarschijnlijk een backup-device. Of een wapen.',
        low: 'De tiener in de kamer ernaast is wakker geworden van het geluid van je toetsenbord. Door de dunne muur hoor je hem mompelen en zijn bed kraken. Als hij zijn kamer uitkomt en jou achter zijn laptops ziet...',
      },
      choices: [
        {
          id: 'ch_2a', label: 'COUNTER-HACK', stat: 'brains', difficulty: 60,
          outcomes: { success: 'Je vingers vliegen over het toetsenbord. DDoS op hun monitoring, spoof je IP drie keer, en druk de transfer door via een alternatief protocol. 90%... 95%... 100%. De verbinding verbreekt. Je leunt achterover, zwetend maar zegevierend. Alles is van jou.', partial: 'Je houdt ze af maar kunt de volledige transfer niet doordrukken. Op 91% verbreek je de verbinding om detectie te voorkomen. Niet alles, maar 91% van miljoenen is nog steeds een fortuin.', fail: 'Ze zijn beter dan jij. Terwijl jij probeert de transfer te redden, hebben zij je IP getraced, je VPN doorboord, en je fysieke locatie bepaald. Een bericht verschijnt op je scherm: "We weten waar je bent. De politie is onderweg." De transfer is geannuleerd.' },
          effects: { heat: 3, relChange: 0, crewDamage: 0, bonusReward: 2000 },
        },
        {
          id: 'ch_2b', label: 'STROOM ERUIT TREKKEN', stat: 'muscle', difficulty: 35,
          outcomes: { success: 'Fuck digitaal. Je staat op, loopt naar de serverkast, en trekt de stroomkabels eruit. De monitor wordt zwart. Hun counter-hack is dood. De transfer is bevroren op 95% — en crypto-transfers op de blockchain zijn onomkeerbaar. Vijfennegentig procent is van jou.', partial: 'De server heeft een UPS — een noodstroomvoorziening die aanslaat zodra de stroom wegvalt. De counter-hack gaat door op batterijstroom. Je hebt meer tijd nodig om de UPS te vinden en ook die uit te schakelen.', fail: 'In de haast trek je de verkeerde kabel. Je eigen verbinding valt uit — niet de hunne. De transfer wordt geannuleerd en zij hebben nog steeds stroom. Het enige dat je hebt bereikt is een kapotte ethernet-kabel en een groeiend gevoel van paniek.' },
          effects: { heat: 5, relChange: 0, crewDamage: 0, bonusReward: 500 },
        },
      ],
    },
    {
      id: 'ch_3',
      text: 'Je burner-telefoon trilt. Een bericht van je insider-contact — de medewerker die je de toegangscodes had beloofd: "Plans zijn veranderd. Er is een extra beveiligingslaag sinds gisteren. Tweefactorauthenticatie via een fysiek token dat om de nek van de CEO hangt. Ik kan het regelen — maar ik wil meer geld. Vijf keer meer." Hij weet dat je geen andere optie hebt. Of wel?',
      districtVariants: {
        crown: 'De insider is de persoonlijke assistent van de CFO — iemand met toegang tot elk systeem, elke kluis, elke vergadering. Hij kan het hele beveiligingssysteem platleggen met één telefoontje. Maar zijn prijs stijgt met elke minuut die je aarzelt.',
        neon: 'Je contact blijkt voor twee partijen te werken — hij verkoopt informatie aan de hoogste bieder. Het bericht dat hij je stuurde, heeft hij waarschijnlijk ook naar je concurrenten gestuurd. De klok tikt sneller dan je dacht.',
        port: 'Je insider is een scheepselektricien die het servernetwerk van het vrachtschip onderhoudt. Hij wil geen geld — hij wil een nieuw paspoort en een ticket naar Buenos Aires. "Ik heb dingen gezien op dit schip die ik wil vergeten," fluistert hij. "Help me verdwijnen en ik geef je alles."',
        iron: 'De ex-ingenieur die de mining-farm heeft opgezet wil terug in het spel. Hij biedt je de master-key in ruil voor dertig procent van de opbrengst — permanent. "Ik heb dat systeem gebouwd," zegt hij. "Zonder mij kom je er niet in. Met mij verdelen we een fortuin."',
        low: 'Je contact is de buurjongen van de tiener — ze zitten samen op school. Hij weet het wachtwoord omdat ze ooit samen hebben gegamed op dezelfde laptops. "Hij verandert het elke week," zegt hij. "Maar hij gebruikt altijd de naam van zijn kat plus een getal. De kat heet Pixel."',
      },
      choices: [
        {
          id: 'ch_3a', label: 'EXTRA BETALEN', stat: 'charm', difficulty: 40,
          outcomes: { success: 'Het is meer dan je wilde betalen, maar je overtuigt hem om voor de helft van zijn nieuwe prijs te werken — met de belofte van toekomstige klussen. Hij schakelt de extra beveiliging uit, levert het token af bij je drop-locatie, en verdwijnt. De doorgang is vrij. Geld goed besteed.', partial: 'Hij wil het volledige bedrag. Je betaalt tandenknarsend. In ruil geeft hij je gedeeltelijke toegang — genoeg om de heist uit te voeren, maar niet op de manier die je had gepland. Improviseren dus.', fail: 'Je maakt het geld over. Hij leest het bericht, typt "bedankt", en verdwijnt. Geen codes, geen token, geen antwoord meer. Hij heeft je geld gestolen en is in de wind. Je staat met lege handen en een lege portemonnee.' },
          effects: { heat: 2, relChange: 0, crewDamage: 0, bonusReward: 1500 },
        },
        {
          id: 'ch_3b', label: 'DREIGEN', stat: 'muscle', difficulty: 45,
          outcomes: { success: 'Je stuurt hem een foto van zijn huis. Daaronder één woord: "Nu." Drie minuten stilte. Dan een bericht met de codes en een verzoek om hem nooit meer te contacteren. Soms is angst het goedkoopste betaalmiddel.', partial: 'Je dreiging werkt — hij levert de codes. Maar je weet dat hij je zal verraden zodra hij de kans krijgt. Deze relatie heeft een houdbaarheidsdatum, en die is net begonnen af te tellen.', fail: 'Hij belt niet jou, maar de beveiliging. "Er is een indringer in het pand." Hij heeft je beschrijving, je locatie, je werkwijze. De dreiging sloeg om in verraad.' },
          effects: { heat: 5, relChange: -5, crewDamage: 5, bonusReward: 2000 },
        },
        {
          id: 'ch_3c', label: 'ZELF HACKEN', stat: 'brains', difficulty: 55,
          outcomes: { success: 'Wie heeft hem nodig? De tweefactorauthenticatie is gebaseerd op een TOTP-algoritme dat je kunt reverse-engineeren als je de seed kent. Na twintig minuten intensief werk heb je hem gekraakt. Geen insider nodig. Pure vaardigheid, pure onafhankelijkheid.', partial: 'Het duurt langer dan verwacht en je mist bijna het tijdvenster. Op de valreep kom je door de extra laag heen. Het is slordig, haastig, maar het werkt. Net.', fail: 'De extra beveiligingslaag is complexer dan je dacht — hardware-gebaseerd, niet software. Zonder het fysieke token kom je er simpelweg niet doorheen. Wiskundig onmogelijk. Je hebt de insider nodig, en hij weet het.' },
          effects: { heat: 3, relChange: 0, crewDamage: 0, bonusReward: 2500 },
        },
      ],
    },
    {
      id: 'ch_4',
      text: 'De crypto is overgemaakt — miljoenen, onherleidbaar, van jou. Maar het gebouw denkt daar anders over. Stalen luiken schuiven voor de ramen. De deuren vergrendelen met hydraulische klemmen. Rode alarmlichten pulseren door de gangen. Een digitale stem herhaalt monotoon: "Lockdown geactiveerd. Alle uitgangen geblokkeerd." Je hebt misschien zestig seconden voordat de eerste responders arriveren. De crypto is waardeloos als je in een cel zit.',
      districtVariants: {
        crown: 'Het penthouse heeft een helikopterplatform op het dak — drieëntwintig verdiepingen boven je. De liften zijn uitgeschakeld, maar het trappenhuis zou nog open moeten zijn. Als je het dak haalt voordat zij het gebouw omsingelen...',
        neon: 'De nooduitgang leidt niet naar buiten maar naar de dansvloer van de club ernaast — driehonderd mensen, knallende muziek, stroboscooplichten. In die menigte verdwijn je als een druppel in de oceaan. Als je er komt.',
        port: 'Het vrachtschip is losgeraakt van de kade en drijft langzaam de haven uit. De gangway is al ingetrokken. Je enige optie is springen — drie meter naar de kademuur, met je laptop onder je arm en miljoenen aan crypto in je broekzak. Het zwarte water klotst dreigend onder je.',
        iron: 'De stroom is uitgevallen en de mining-farm staat in het pikkedonker. De enige uitgang is door een labyrint van golfplaten muren en slingerende kabels. Ergens in het donker hoor je voetstappen — de eigenaar, of erger. Je telefoonlicht is je enige gids.',
        low: 'De voordeur van het flatgebouw zit op een elektronisch slot dat niet opengaat zonder de code. De ramen op de derde verdieping zijn te hoog om te springen. Maar de buurvrouw op de tweede verdieping heeft een balkon dat uitkomt op een brandtrap — als ze haar raam openlaat.',
      },
      choices: [
        {
          id: 'ch_4a', label: 'VENTILATIESCHACHT', stat: 'brains', difficulty: 45,
          outcomes: { success: 'Je herinnert je de bouwtekening die je hebt bestudeerd: de ventilatieschacht in de serverruimte leidt naar het dak. Je trekt het rooster eraf, hijst jezelf omhoog, en kruipt door het metalen labyrint. Op het dak spring je naar de brandtrap van het naastgelegen gebouw. Vrij. Met miljoenen in je digitale portemonnee.', partial: 'De schacht is smaller dan op de tekening — je schoudrs schuren langs het metaal, je kleren scheuren. Halverwege raak je vast en moet je achteruit kruipen en een andere route nemen. Je komt eruit, maar geschaafd, bezweet, en met minder tijd dan je dacht.', fail: 'Je kruipt vijf meter de schacht in en realiseert je dat hij doodloopt — een T-stuk dat niet op de originele bouwtekening staat. Er is een ventilator die je niet kunt passeren. Als je achteruit kruipt, hoor je voetstappen in de serverruimte. Ze vinden je.' },
          effects: { heat: 0, relChange: 0, crewDamage: 3, bonusReward: 500 },
        },
        {
          id: 'ch_4b', label: 'DEUR FORCEREN', stat: 'muscle', difficulty: 50,
          outcomes: { success: 'De hydraulische klemmen zijn sterk, maar de deur zelf is van standaard staal. Drie schoppen — voluit, met alles wat je hebt. De scharnieren buigen. Eén meer. De deur vliegt open. Je rent de straat op, mengt je met het nachtelijke verkeer, en verdwijnt.', partial: 'De deur buigt maar breekt niet volledig. Je wurmt je door een gat dat net groot genoeg is — je jas scheurt, je arm bloedt. Maar je bent buiten. De koude nachtlucht voelt als vrijheid.', fail: 'De deur is versterkt staal met titanium scharnieren. Je voet doet pijn na de eerste schop en de deur heeft niet eens een deuk. Je zit nog steeds vast, met een mogelijke gebroken teen en naderende sirenes.' },
          effects: { heat: 8, relChange: 0, crewDamage: 5, bonusReward: 0 },
        },
        {
          id: 'ch_4c', label: 'BLUF JE ERUIT', stat: 'charm', difficulty: 40,
          outcomes: { success: 'Je trekt je jas recht, bergt je laptop op, en loopt naar de eerste bewaker die je tegenkomt. "IT-support. Er was een beveiligingslek — ik heb het gefixt. De lockdown kan worden opgeheven." Je badge is nep maar je zelfvertrouwen is echt. Ze laten je gaan. Ongelooflijk.', partial: 'Ze geloven je half — genoeg om je te escorteren naar de uitgang in plaats van je vast te houden. Twee bewakers lopen naast je, en je zweet als een rund. Maar je bent buiten. Nooit meer terugkomen.', fail: '"Laat je ID-badge zien." Je badge is nep en zij weten het. De bewaker pakt zijn radio: "We hebben de indringer." De handboei klikt om je pols voordat je kunt reageren.' },
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
        port: 'De lading moet via de haven verscheept worden. Containerschepen liggen aangemeerd langs de kade, hun donkere silhouetten afgetekend tegen de mistige horizon. De kustwacht patrouilleert met zoeklichten die het zwarte water aftasten. Je contactpersoon bij het havenkantoor heeft een venster van twintig minuten geregeld — daarna wisselt de wacht.',
        iron: 'De route gaat door het hart van Iron Borough. Stilstaand verkeer bij de fabriek, de lucht zwaar van rook en dieseldampen. Vrachtwagens blokkeren de smalle doorgang bij het laadperron. De Iron Skulls controleren elk voertuig dat hun territorium binnenrijdt — je hebt precies de juiste papieren nodig, of een heel goed verhaal.',
        neon: 'De aflevering is bij de achterdeur van Club Paradiso op de Strip. Het neonlicht kleurt de natte straat paars en roze. Dronken feestvierders wankelen voorbij, de perfecte dekmantel. De portier knikt — hij verwacht je. Door de keuken, langs de DJ-booth, naar de VIP-kamer waar je contactpersoon wacht met een glas champagne.',
        crown: 'Een discrete levering aan een penthouse in Crown Heights. De conciërge staat al te wachten bij de ondergrondse parkeergarage — hij houdt de slagboom open en wijst naar lift C. Geen camera\'s in die hoek, dat heeft je opdrachtgever geregeld. Het pakket moet in de privékluis op de 32e verdieping. Geen vingerafdrukken.',
        low: 'Door de smalle steegjes van Lowrise, waar de muren vol graffiti staan en de straatlantaarns meer uit dan aan zijn. Dakroutes over de platgebouwen — je kent elke sprong, elke ladder. Een groep straatjochies biedt aan als escort te dienen voor een deel van de buit. In Lowrise betaal je altijd twee keer: aan de klant en aan de straat.',
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
    {
      id: 'del_2',
      text: 'Halverwege de route blokkeert een busje de weg. Gemaskerde mannen stappen uit. Dit is een hinderlaag.',
      districtVariants: {
        iron: 'De Iron Skulls hebben de route gelekt. Drie motoren versperren de weg bij de oude staalfabriek. De koplampen van hun Harleys verlichten het roestige hek. De leider — een beer van een vent met een sloophamer als wapen — stapt naar voren. "Tol betalen of we nemen alles."',
        port: 'Havenratten springen van achter gestapelde containers tevoorschijn. Ze dragen bivakmutsen en ruiken naar zout en diesel. Het smalle pad tussen de containermuren biedt geen ruimte om te keren. Achter je hoor je nog meer voetstappen op het natte beton. Je zit in de val.',
        low: 'Een rivaliserende gang in Lowrise. Ze wisten precies waar je zou zijn — iemand heeft gepraat. Vijf jongens, sportkleding, capuchons. De oudste heeft een honkbalknuppel. Ze blokkeren de steeg aan beide kanten. "Niets persoonlijks. Business."',
        crown: 'Een glanzend zwart SUV blokkeert de parkeergarage-uitrit. Mannen in pakken stappen uit — privébeveiliging van een concurrent. Ze hebben oorstukjes en professionele wapens. "We hebben een boodschap van onze werkgever. Het pakket gaat niet verder." Efficiënt, koud, zakelijk.',
        neon: 'De hinderlaag is opgezet in de smalle steeg achter de neonreclames. Een groep van vier man, vermomd als clubgangers, blokkeert de weg. De bassen van de club naast je verdoven elk geluid. Niemand op de Strip zal iets horen — dat is precies het probleem.',
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
    {
      id: 'del_3',
      text: 'Je arriveert op de afleverlocatie. De klant is er, maar hij heeft bewapende mannen bij zich. "Ik heb besloten om niet te betalen."',
      districtVariants: {
        crown: 'De klant is een zakenman in een maatpak die denkt dat hij onaantastbaar is. Zijn bodyguards dragen Armani en Glocks. Het penthouse biedt een panoramisch uitzicht — en maar één uitgang. "Kijk, het is niets persoonlijks. Maar waarom zou ik betalen als ik het gratis kan krijgen?"',
        neon: 'In de VIP-lounge van Club Velvet. De klant grijnst achter een champagneglas terwijl twee uitsmijters de deur blokkeren. De muziek dreunt zo hard dat niemand je zal horen als het fout gaat. "Kom, drink iets. En laat het pakket achter."',
        port: 'In een verlaten vissersloods aan de kade. De klant zit op een omgekeerd krat, omringd door havenratten met ijzeren staven. De geur van rottend zeewier hangt in de lucht. "De haven heeft zijn eigen regels, vriendje. Hier betaal ik wat ik wil."',
        iron: 'Op het fabrieksterrein, tussen de smeulende ovens en het geraas van machines. De klant is een Iron Borough-veteraan met littekens op zijn handen. Zijn mannen dragen werkhandschoenen en moersleutels. "In deze wijk verdien je je geld. Of je verliest het."',
        low: 'In een souterrain in Lowrise, bereikbaar via een smalle trap. De klant is een lokale gangster die je vanaf een kapotte bank aankijkt. Drie jongens met messen staan achter hem. "Luister, ik heb even geen cash. Maar je kunt vertrekken. Zonder het pakket."',
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
        iron: 'Het pakhuis in Iron Borough is een voormalige wapenfabriek, versterkt met stalen deuren en betonnen muren. Geen ramen, alleen smalle ventilatieroosters waar nauwelijks een arm doorheen past. De bewakers zijn ex-militairen met kogelvrije vesten en automatische wapens. De Iron Skulls nemen geen risico — hier kom je niet zomaar binnen.',
        low: 'Een kraakpand in het hart van Lowrise. De muren zijn rot, het dak lekt, maar het zit vol verrassingen: boobytraps bij de trap, een uitkijkpost op het dak, en minstens drie nooduitgangen die alleen de bewoners kennen. De twee bewakers zijn straatjochies met messen en een afgehakte shotgun.',
        port: 'Een geïsoleerde container aan het einde van pier 7. De ruimte is beperkt — vier meter breed, acht meter diep. Maar dat maakt ontsnapping ook onmogelijk. De bewakers zitten op klapstoelen voor de container en roken, hun wapens binnen handbereik. De geur van zeewater en roest omhult alles.',
        crown: 'Een luxe kantoor op de 15e verdieping van een zakentoren in Crown Heights. De bewakers zijn discreet — pakken, oorstukjes, verborgen holsters. De receptie is een façade; achter de mahonihouten deur zit het echte kantoor waar je doelwit zijn imperium runt. Beveiligingscamera\'s overal, maar ook blinde hoeken.',
        neon: 'De achterkamer van een stripclub op de Neon Strip. De bastonen van de muziek trillen door de muren. Twee uitsmijters bewaken de deur naar de privéruimte — beiden minstens 120 kilo, getraind om problemen stil op te lossen. Voorbij hen, achter een fluwelen gordijn, wacht je doelwit.',
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
    {
      id: 'cmb_2',
      text: 'Je staat oog in oog met het doelwit. Hij is niet alleen — drie lijfwachten staan klaar.',
      districtVariants: {
        iron: 'De Iron Skulls-leider zit achter een bureau van massief staal, gemaakt van omgesmolten motorblokken. Aan de muur hangen kettingen en een houten honkbalknuppel met spijkers. Hij glimlacht breed. "Ik verwachtte je al. Mijn jongens ook." Drie gespierde mannen stappen uit de schaduwen.',
        crown: 'De zakenman in zijn penthouse, panoramisch uitzicht over heel Noxhaven. Een glas single malt in zijn hand, een glimlach op zijn gezicht. "Laten we dit als beschaafde mensen oplossen." Zijn drie lijfwachten — voormalig special forces — staan roerloos als standbeelden.',
        low: 'Een gangster in een vochtig souterrain. Het ruikt naar schimmel en angst. Hij zit op een plastic stoel, pistool op schoot. Drie jongens met machetes omringen hem. Graffiti op de muur leest: "GEEN GENADE." Hij kijkt je aan met dode ogen. "Je had niet moeten komen."',
        port: 'In het roestige stuurhuis van een afgedankt vrachtschip. Het doelwit leunt tegen het kapotte stuurwiel, silhouet afgetekend tegen de havenlampen. Zijn mannen — havenarbeiders overdag, moordenaars \'s nachts — blokkeren de smalle trap. "Op zee gelden andere regels, vriend."',
        neon: 'In de VIP-skybox boven de dansvloer van Club Inferno. Het doelwit zit op een rode fluwelen bank, omringd door champagneflessen en drie lijfwachten met zichtbare littekens. De discolichten flitsen over hun gezichten. "Dans met me, of sterf met me. Jouw keuze."',
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
    {
      id: 'cmb_3',
      text: 'Het doelwit is uitgeschakeld, maar sirenes naderen. Iemand heeft de politie gebeld. Tijd om te verdwijnen.',
      districtVariants: {
        port: 'De haven is afgesloten. Kustwachtboten scannen het water met zoeklichten. Politiehelikopters cirkelen boven de pier. De enige uitweg is via het water — als je een boot kunt vinden — of dieper het doolhof van containers in.',
        neon: 'De Strip is vol mensen. Perfect om in te verdwijnen — of juist niet. De politie zet wegversperringen op bij elke uitgang van de Neon Strip. Maar de menigte is dik, en in de chaos van een zaterdagavond kan één persoon makkelijk opgaan in de stroom.',
        iron: 'Het fabrieksterrein heeft tientallen uitgangen, maar de politie kent ze allemaal. Sirenes echoen tussen de gebouwen. De enige plek waar ze niet zoeken is het rioolstelsel onder de oude smelterij — als je de stank kunt verdragen.',
        crown: 'Privébeveiliging reageert sneller dan de politie in Crown Heights. Gewapende teams in zwarte SUV\'s convergeren op je locatie. De liften zijn geblokkeerd. De trappen worden bewaakt. Het enige dat niemand verwacht: de serviceliften van het personeel.',
        low: 'In Lowrise zijn sirenes dagelijks kost. De buurtbewoners weten instinctief wat ze moeten doen: deuren open, gordijnen dicht, niemand heeft iets gezien. Een oude vrouw wenkt je naar haar flat. "Snel, jongen. Achter de kast is een deur naar het dak."',
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
        crown: 'Het penthouse van een techmagnaat in Crown Heights. Biometrische sloten, bewegingssensoren, infraroodlasers in de hal. De privébeveiliging draagt oorstukjes en draagt Sig Sauers. Maar er is één zwak punt: de ventilatieschacht op het dak is net breed genoeg voor één persoon.',
        port: 'Een verlaten havenmagazijn dat van buiten vergeten lijkt, maar van binnen vol staat met illegale goederen. Het is donker en vochtig, ratten als je enige gezelschap. De bewaking is minimaal maar onvoorspelbaar — één man met een hond die willekeurig patrouillert.',
        neon: 'De achterkamer van Casino Royale, verscholen achter drie beveiligde deuren. De dreunende muziek verdooft elk geluid — perfect voor een stille inbraak. Maar de camera\'s zijn hypermodern, en de uitsmijters maken onregelmatige rondes.',
        iron: 'Een omgebouwde fabriekshall in Iron Borough, waar achter de industriële façade een illegaal wapendepot schuilgaat. Bewegingssensoren bij de ingang, maar de muren zijn dun en verroest — met het juiste gereedschap maak je je eigen deur.',
        low: 'Een appartementencomplex in Lowrise waar de bovenste verdieping is omgebouwd tot een opslagplaats. De lift is kapot, de trap wordt bewaakt door één man die elk uur wisselt. De buren horen alles door de dunne muren — stilte is essentieel.',
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
    {
      id: 'stl_2',
      text: 'Je bent binnen. De kluis is achter een stalen deur met een combinatieslot. De bewaker maakt zijn ronde. Twee minuten.',
      districtVariants: {
        crown: 'De kluis heeft een tijdslot en retinascanner — state-of-the-art beveiliging. Hij opent alleen tussen 02:00 en 02:05 \'s nachts. Het is 01:58. Je hebt precies zeven minuten om binnen te komen, te pakken wat je nodig hebt, en te verdwijnen voordat het systeem reset.',
        port: 'De "kluis" is een verroeste scheepscontainer met drie hangsloten en een ketting zo dik als je pols. Maar er ligt een slapende bewaker naast, zijn adem ruikend naar goedkope rum. Elke klink die je aanraakt klinkt als een pistoolschot in de stilte van de haven.',
        neon: 'Achter de bar van de VIP-lounge zit een verborgen kluis, gecamoufleerd als een koelkast. Het combinatieslot is versleten — de juiste cijfers zijn bijna zichtbaar in het slijtpatroon. Maar de barman komt zo terug van zijn rookpauze.',
        iron: 'De kluis is ingebouwd in het fundament van de oude smelterij — een bunker uit de Koude Oorlog, hergebruikt als wapendepot. De deur weegt drie ton en het sleutelgat is zo oud dat moderne lockpicks niet passen. Je hebt een andere aanpak nodig.',
        low: 'Een verborgen ruimte achter een boekenkast in een appartement. De eigenaar is weg, maar zijn pitbull niet. De hond gromt zachtjes vanuit de hoek. De kluis zelf is een simpel model — als je bij de kast kunt komen zonder een arm te verliezen.',
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
    {
      id: 'stl_3',
      text: 'Je hebt de buit. Maar bij de uitgang staat je opdrachtgever\'s "partner". "Ik neem het hier over. Geef me alles."',
      districtVariants: {
        crown: 'De partner is een bekende fixer in Crown Heights met connecties in de politiek, het bedrijfsleven en de onderwereld. Hij draagt handschoenen en een kasjmieren jas. "Laten we dit netjes houden. Ik heb belangrijke vrienden die dit snel kunnen laten verdwijnen — inclusief jou."',
        low: 'Een straatgangster die denkt dat hij slim is. Maar hij is alleen, en zijn handen trillen. De tatoeage op zijn nek verraadt dat hij pas net bij een gang hoort — een nieuweling die iets wil bewijzen. "G-geef het hier. Ik meen het."',
        port: 'Een havenwerker met brede schouders en een gezicht vol littekens. Hij blokkeert de smalle doorgang tussen twee containers. "De haven eist zijn tol. Alles wat hier binnenkomt, gaat door mijn handen." Achter hem hoor je het geklots van golven tegen de kade.',
        iron: 'Een ex-staalarbeider met handen als bankschroeven. Hij draagt een overall en een helm — alsof hij net van zijn shift komt. "De fabriek heeft me niks gegeven. Dit is mijn pensioen." Hij heeft een industriële slijptol in zijn hand. Niet als gereedschap.',
        neon: 'Een gladde gokker met een gouden tand en te veel ringen. Hij leunt tegen de nooduitgang van de club en steekt een sigaar op. "Ik heb de beveiliging betaald om weg te kijken. Dat maakt mij je zakenpartner. Vijftig procent, of ik schreeuw."',
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
        crown: 'Een high-tech datacenter op de bovenste verdieping van Meridian Tower. 24/7 bewaking, stroomuitval-protocollen, en een AI-gestuurde firewall die verdacht verkeer binnen milliseconden detecteert. Maar de airconditioning maakt zoveel lawaai dat niemand je toetsaanslagen hoort.',
        neon: 'Een illegale serverruimte achter een gamehal op de Neon Strip. De beveiliging is minder — twee wachtwoorden en een slot — maar de servers draaien crypto-mining naast de gestolen data. De warmte is ondraaglijk; het voelt als een sauna. Perfect om DNA-sporen te laten verdwijnen door zweet.',
        iron: 'Een oude fabriek omgebouwd tot serverboerderij. Honderden blinkende kastjes in rijen, gekoeld door industriële ventilatoren die klinken als straaljagers. De beveiliging is fysiek: dikke muren, geen ramen, één zware metalen deur. Maar de elektriciteitsinfrastructuur is oud en kwetsbaar.',
        port: 'Een servercontainer op een vrachtschip in Port Nero. De boot deint zachtjes op de golven terwijl je door de smalle gang naar de technische ruimte loopt. De servers zijn verbonden via een satellietverbinding — als je die verbreekt, gaat alles in lockdown. Voorzichtigheid is geboden.',
        low: 'Een improviseerde serverruimte in de kelder van een kraakpand in Lowrise. Gestapelde pizza-dozen naast de servers, kabels als spaghetti over de vloer. De beveiliging is een jonge hacker die vast in slaap is gevallen — zijn energiedrank staat nog te dampen naast zijn toetsenbord.',
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
    {
      id: 'tech_2',
      text: 'Je hebt toegang tot het systeem. De data is enorm — je USB kan maar 40% opslaan. Wat prioriteer je?',
      districtVariants: {
        crown: 'Het systeem bevat financiële gegevens van de rijksten van Noxhaven, klantendatabases van exclusieve clubs, en beveiligingsprotocollen van elk penthouse in de wijk. Dit is het soort informatie waarmee je levens kunt ruïneren — of een fortuin kunt verdienen.',
        neon: 'Gokgegevens, VIP-lijsten, zwart geld-transacties, en de volledige administratie van drie casino\'s. Alles waardevol, alles illegaal. De eigenaren zouden miljoenen betalen om dit terug te krijgen — of om het te laten verdwijnen.',
        iron: 'Productieschema\'s van illegale wapenfabrieken, leverancierlijsten, en de persoonlijke financiën van de Iron Skulls-leider. Er zit ook een verborgen map bij: "Operatie Staalkoord" — een politie-infiltrant in de fabriek.',
        port: 'Scheepsmanifesten met verborgen smokkelladingen, douanecodes die containers ongecontroleerd doorlaten, en een database van elke corrupte havenambtenaar. De haven is een goudmijn — en deze data is de kaart.',
        low: 'Telefoongegevens van elke dealer in Lowrise, locaties van stash houses, en — verrassend — een lijst van politie-informanten in de buurt. Deze informatie kan het machtsbevenwicht in de hele wijk verschuiven.',
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
    {
      id: 'tech_3',
      text: 'De systeembeheerder is teruggekomen van pauze. Hij ziet jou achter zijn terminal. "Wie ben jij?!"',
      districtVariants: {
        iron: 'De sysadmin is een ex-militair met een staalhard gezicht en een beveiligingsbadge die hem toegang geeft tot het hele gebouw. Hij is niet bang — hij heeft in oorlogszones gewerkt. Zijn hand glijdt naar de alarmknop onder zijn bureau.',
        neon: 'Een jonge nerd met neongroene koptelefoon en een Monster Energy in zijn hand. Hij is geschrokken — zijn ogen zo groot als schotels — maar zijn hand grijpt instinctief naar zijn telefoon. In dit deel van de Strip belt niemand de politie, maar hij kent mensen die erger zijn.',
        crown: 'De sysadmin is een vrouw in een strak pak — voormalig cybersecurity consultant voor de overheid. Ze scant je gezicht met haar blik alsof ze je al catalogiseert. "Ik geef je vijf seconden om uit te leggen waarom ik niet de politie bel."',
        port: 'Een oude havenman met een baard als staaldraad. Hij vertrouwt technologie niet maar kent het systeem op zijn duimpje. "Ik weet niet wie je bent, maar ik weet dat je hier niet hoort." Hij pakt de telefoon — geen smartphone, een vast toestel met draad.',
        low: 'Een tiener in een hoodie die hier duidelijk zwart werkt. Hij kijkt je aan met een mengeling van angst en herkenning. "Yo... wacht. Ben jij... werk je voor [gang]?" De situatie kan beide kanten op.',
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

const DISTRICT_ATMOSPHERES: Record<DistrictId, string[]> = {
  neon: [
    'Neonreclames flikkeren in plassen op het asfalt. Bas dreunt uit een club verderop.',
    'De Strip bruist. Dronken toeristen, straatvechters, dealers — iedereen is bezig vanavond.',
    'Sigarettenrook kringelt omhoog in het paarse licht. Een uitsmijter kijkt de andere kant op.',
    'Het gezoem van gokautomaten dringt door de muren. De geur van goedkope parfum hangt overal.',
    'Een straatmuzikant speelt saxofoon in een steegje. De melodie verbergt het geluid van brekend glas.',
    'Knipperende LED-borden beloven fortuin. De straat is een carnaval van wanhoop en hoop.',
  ],
  port: [
    'De geur van zout en diesel drijft over de kade. Kranen piepen in de verte.',
    'Containerschepen doemen op als donkere reuzen. Het water klotst tegen de steigers.',
    'Mistflarden hangen laag over de haven. Voetstappen echoen op nat beton.',
    'Een scheepshoorn loeit. Meeuwen krijsen. Ergens valt iets zwaars — niemand kijkt op.',
    'Roestige ketens rammelen in de wind. De havenwachter is nergens te bekennen.',
    'Het stinkt naar vis en motorolie. Ratten schieten weg als je langsloopt.',
  ],
  crown: [
    'Marmeren lobbies en spiegelende ramen. Hier ruikt het naar geld en arrogantie.',
    'Privéchauffeurs wachten in zwarte auto\'s. Beveiligingscamera\'s registreren elke beweging.',
    'De stille straten van Crown Heights. Elke lantaarnpaal heeft een camera. Elke deur een code.',
    'Penthouses torenen boven je uit. Achter die ramen worden miljoenenbeslissingen genomen.',
    'Een dure parfumgeur hangt in de lucht. Een concierge kijkt je achterdochtig aan.',
    'Het tikken van dure hakken op graniet. Hier hoort niemand het geschreeuw van de lagere wijken.',
  ],
  iron: [
    'Fabriekschoorstenen spuwen rook de nachtlucht in. De grond trilt onder je voeten.',
    'Verlaten fabrieksgebouwen werpen vervormde schaduwen. Ergens drupt water op metaal.',
    'De lucht smaakt naar ijzer en verbrande rubber. Iron Borough slaapt nooit echt.',
    'Gebroken straatlantaarns. De enige verlichting komt van lasvonken achter een raam.',
    'Een hond blaft in de verte. Motorgeronk — de Iron Skulls patrouilleren.',
    'Roestige hekken en graffiti vertellen het verhaal van deze wijk. Hier regeert kracht.',
  ],
  low: [
    'Graffiti vertelt het verhaal van Lowrise. Elke muur is een canvas, elke steeg een verhaal.',
    'Kinderen spelen laat op straat. Hun moeders roepen vanuit open ramen.',
    'De geur van wiet en verse empanada\'s. Lowrise voelt als thuis — gevaarlijk thuis.',
    'Straatlantaarns flikkeren. Schaduwen bewegen in portieken. Iedereen let op iedereen.',
    'Bassige reggaeton dreunt uit een kelderraam. Een dealer knikt naar je — herkenning.',
    'Vochtige muren, kapotte stoeptegels. Maar er is een code hier. Respect verdien je.',
  ],
};

const OP_SPECIFIC_INTROS: Record<string, Record<DistrictId, string[]>> = {
  pickpocket: {
    neon: ['De casino-gasten zijn dronken en onoplettend. Perfect.', 'Een groep toeristen met dikke portemonnees loopt voorbij.'],
    port: ['Havenarbeiders na hun shift — moe, afgeleid, met loonzakjes.', 'De drukte bij de ferry-terminal is ideaal voor zakkenrollers.'],
    crown: ['Rijke mensen lopen met hun neus in de lucht. Ze zien je niet eens.', 'De zakenlunch-crowd stroomt uit de restaurants.'],
    iron: ['Fabrieksarbeiders tellen hun weekgeld bij de uitgang.', 'De nachtwakers zijn de makkelijkste doelwitten — altijd half slapend.'],
    low: ['In Lowrise ken je elke ontsnappingsroute uit je hoofd.', 'De marktdag trekt buitenstaanders aan. Makkelijke prooien.'],
  },
  atm_skimming: {
    neon: ['De ATM naast de club wordt non-stop gebruikt. Meer data, meer risico.', 'Gokkers halen cash op alsof het water is.'],
    port: ['De oude ATM bij de haven draait op verouderde software.', 'Zeelieden gebruiken buitenlandse kaarten — moeilijker te traceren.'],
    crown: ['High-limit ATMs. Elke transactie is duizenden waard.', 'De geavanceerde ATMs hier vereisen een nieuwer skimmer-model.'],
    iron: ['De ATM bij de fabriek is de enige in een straal van 500 meter.', 'Weinig beveiliging, maar ook weinig transacties.'],
    low: ['De ATM in Lowrise is al drie keer geskimd dit jaar. Ze verwachten het.', 'Een lokale gang "beschermt" deze ATM. Ze willen een deel.'],
  },
  car_theft: {
    neon: ['Ferrari\'s, Lamborghini\'s — de Strip is een showroom op wielen.', 'De valetparkeerders zijn de zwakste schakel.'],
    port: ['Exportcontainers staan klaar. Steel het hier, verscheep het vanavond nog.', 'De havenbeveiliging focust op drugs, niet op auto\'s.'],
    crown: ['Privéparkeergarages vol met supercars. De beveiliging is goed, maar de beloning is beter.', 'Chauffeurs laten de motor draaien terwijl ze hun baas ophalen.'],
    iron: ['Gepantserde voertuigen van de Iron Skulls. Gevaarlijk, maar ongekend waardevol.', 'Oude maar zeldzame auto\'s staan te roesten. Collectors betalen grof.'],
    low: ['De auto\'s hier zijn minder waard, maar niemand heeft een alarm.', 'Opgevoerde civic\'s en straatracers. De underground markt betaalt goed.'],
  },
  store_robbery: {
    neon: ['De luxe winkels op de Strip. Bewaking is strak, maar de buit is het waard.', 'Toeristen als dekking. De chaos is je vriend.'],
    port: ['Een smokkelkantoor vol met ongedeclareerde goederen. Wie gaat aangifte doen?', 'De haven-loodsen bevatten meer dan vis.'],
    crown: ['De exclusiefste juweliers van Noxhaven. Kogelvrij glas, laserbeveiliging.', 'Een kunstgalerie vol meesterwerken. Eén schilderij is een jaarsalaris waard.'],
    iron: ['Pandjeshuizen en illegale wapenhandelaren. De beveiliging is een man met een honkbalknuppel.', 'De voorraadkamer van de fabriek. Industrieel materiaal brengt goed op.'],
    low: ['De goudhandelaar op de hoek. Hij kent iedereen, maar vanavond kent niemand jou.', 'Een apotheek met een "speciale" voorraad in de kelder.'],
  },
  crypto_heist: {
    neon: ['Een illegaal crypto-kantoor achter een club. De beveiliging is menselijk, niet digitaal.', 'Mining-rigs in een kelder. De warmte is ondraaglijk.'],
    port: ['Een offshore server op een vrachtschip. Letterlijk buiten jurisdictie.', 'De haven-administratie draait op een antiek systeem. Kinderspel.'],
    crown: ['Het datacenter van een hedgefund. State-of-the-art. Dit wordt je grootste uitdaging.', 'Private keys in een kluis. Fysiek en digitaal beveiligd.'],
    iron: ['Een serverboerderij in een verlaten fabriek. De koeling is de elektriciteitsrekening.', 'Een mijnwerker-collectief met onbeveiligde wallets.'],
    low: ['Een kleine crypto-beurs gerund vanuit een woonkamer. Amateur-beveiliging.', 'De lokale dealer accepteert crypto. Zijn wallet is op zijn telefoon.'],
  },
};

export function generateMissionEncounters(
  missionType: 'solo' | 'contract',
  missionId: string,
  contractType?: string,
  district?: DistrictId
): MissionEncounter[] {
  const pool = missionType === 'solo'
    ? (SOLO_ENCOUNTERS[missionId] || SOLO_ENCOUNTERS['pickpocket'])
    : (CONTRACT_ENCOUNTERS[contractType || 'delivery'] || CONTRACT_ENCOUNTERS['delivery']);

  // Shuffle the pool and pick 3-4 encounters (was 2-3)
  const shuffled = shuffleArray(pool);
  const count = Math.min(shuffled.length, Math.max(3, 3 + Math.floor(Math.random() * 2))); // 3-4
  const selected = shuffled.slice(0, count);

  // Add phase labels and district-specific atmosphere
  const phaseLabels = missionType === 'solo' ? SOLO_PHASE_LABELS : CONTRACT_PHASE_LABELS;
  const loc = district || 'neon';
  const districtAtmos = DISTRICT_ATMOSPHERES[loc] || DISTRICT_ATMOSPHERES.neon;
  const opIntros = missionType === 'solo' ? (OP_SPECIFIC_INTROS[missionId]?.[loc] || []) : [];

  // Combine: first encounter gets op-specific intro, rest get district atmosphere
  return selected.map((enc, i) => {
    const opIntro = opIntros[i % Math.max(1, opIntros.length)];
    const districtAtmo = districtAtmos[(i + Math.floor(Math.random() * districtAtmos.length)) % districtAtmos.length];
    return {
      ...enc,
      phase: phaseLabels[i] || phaseLabels[phaseLabels.length - 1],
      atmosphere: i === 0 && opIntro ? opIntro : (opIntro ? `${districtAtmo} ${opIntro}` : districtAtmo),
    };
  });
}

export function resolveMissionChoice(
  state: GameState,
  mission: ActiveMission,
  choiceId: string,
  forceResult?: 'success' | 'fail'
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
  let result: 'success' | 'partial' | 'fail';
  if (forceResult) {
    result = forceResult;
  } else {
    const roll = statVal * 5 + Math.floor(Math.random() * 30);
    if (roll >= effectiveDifficulty + 15) {
      result = 'success';
    } else if (roll >= effectiveDifficulty - 5) {
      result = 'partial';
    } else {
      result = 'fail';
    }
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
