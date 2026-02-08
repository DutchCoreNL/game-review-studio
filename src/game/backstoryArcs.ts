/**
 * Backstory-exclusive Story Arcs
 * Elk backstory ontgrendelt één unieke verhaalboog van 4-5 stappen.
 * - De Weduwnaar → Wraak-boog (backstory_wraak)
 * - De Gevallen Bankier → Schuld-boog (backstory_schuld)
 * - Het Straatkind → Loyaliteits-boog (backstory_loyaliteit)
 */

import type { StoryArcTemplate } from './storyArcs';

export const BACKSTORY_ARCS: StoryArcTemplate[] = [
  // ===================================================================
  // ARC: DE WRAAK — exclusief voor De Weduwnaar
  // ===================================================================
  {
    id: 'backstory_wraak',
    name: 'De Wraak',
    description: 'Zoek de waarheid achter de moord op je partner. Hoe diep gaat het complot?',
    icon: '💀',
    triggerConditions: {
      minDay: 4,
      minRep: 20,
      requiredBackstory: 'weduwnaar',
    },
    completionReward: { money: 30000, rep: 250, dirtyMoney: 0, heat: -15 },
    steps: [
      {
        id: 'wraak_1',
        text: 'Een anoniem pakket bij je deur. Erin: een politierapport over de nacht dat je partner stierf. Hele paragrafen zijn zwartgelakt — maar één naam is leesbaar: Sergeant Hendriks. Hij was die nacht dienstdoend. En het rapport klopt niet met wat jou is verteld.',
        phonePreview: '"Er is een pakket voor je achtergelaten. Geen afzender. Maar de inhoud... dit verandert alles." — Anoniem',
        phoneFrom: 'anonymous',
        choices: [
          {
            id: 'wraak_1a', label: 'ZOEK HENDRIKS OP', stat: 'brains', difficulty: 25,
            successText: 'Je vindt Hendriks in een kroeg in Iron Borough. Een gebroken man. "Ik wilde het niet. Ze dwongen me het rapport te veranderen." Hij geeft je een naam: Inspecteur Van Dijk.',
            failText: 'Hendriks is verhuisd. Niemand weet waarheen. Maar je hebt nu tenminste een naam.',
            effects: { money: 0, heat: 5, rep: 15, dirtyMoney: 0, crewDamage: 0, karma: 5 },
          },
          {
            id: 'wraak_1b', label: 'ONDERZOEK HET RAPPORT', stat: 'brains', difficulty: 30,
            successText: 'De zwartgelakte tekst is met een simpele truc leesbaar te maken. Wat je leest bevestigt je ergste vermoedens — het was geen "routinecontrole". Het was gepland.',
            failText: 'Het rapport is te beschadigd. Maar de inconsistenties zijn duidelijk genoeg.',
            effects: { money: 0, heat: 0, rep: 10, dirtyMoney: 0, crewDamage: 0, karma: 10 },
          },
          {
            id: 'wraak_1c', label: 'CONFRONTEER DE POLITIE', stat: 'muscle', difficulty: 35,
            successText: 'Je stormt het bureau binnen en eist antwoorden. De schrik in hun ogen zegt genoeg. Iemand fluistert: "Van Dijk weet alles."',
            failText: 'Ze gooien je eruit en dreigen met arrestatie. Maar je zag de angst in hun ogen.',
            effects: { money: 0, heat: 15, rep: 20, dirtyMoney: 0, crewDamage: 0, karma: -10 },
          },
        ],
      },
      {
        id: 'wraak_2',
        text: 'Inspecteur Van Dijk. Een man met connecties tot in het stadhuis. Hij leidde die nacht de operatie — maar waarom? Je graaft dieper en ontdekt dat je partner iets had gevonden. Iets dat Van Dijk wilde begraven. Letterlijk.',
        phonePreview: '"Van Dijk heeft een schaduwadministratie. Hij chanteert halve stad. Je partner wist ervan." — Hendriks',
        phoneFrom: 'informant',
        choices: [
          {
            id: 'wraak_2a', label: 'STEEL DE ADMINISTRATIE', stat: 'brains', difficulty: 40,
            successText: 'Via een corrupt politie-archivaris krijg je een kopie van Van Dijks schaduwboekhouding. Namen, bedragen, data. Dit is explosief materiaal.',
            failText: 'De archivaris krijgt koude voeten en verdwijnt. Maar hij liet een hint achter over de locatie.',
            effects: { money: -3000, heat: 5, rep: 25, dirtyMoney: 0, crewDamage: 0, karma: 5 },
          },
          {
            id: 'wraak_2b', label: 'CHANTEER VAN DIJKS PARTNER', stat: 'charm', difficulty: 35,
            successText: 'Van Dijks rechterhand, Agent Smits, breekt onder druk. "Ik geef je alles. Maar laat me dan met rust." Hij overhandigt USB-sticks vol bewijs.',
            failText: 'Smits is loyaler dan je dacht. Hij waarschuwt Van Dijk. De jacht op jou begint.',
            effects: { money: 0, heat: 10, rep: 20, dirtyMoney: 0, crewDamage: 0, karma: -5 },
          },
          {
            id: 'wraak_2c', label: 'VAL ZIJN KANTOOR BINNEN', stat: 'muscle', difficulty: 45,
            successText: 'Midden in de nacht forceer je de deur. De kluis is makkelijker dan verwacht. Wat je vindt is overweldigend — Van Dijk runt een heel imperium vanuit het bureau.',
            failText: 'Alarm! Je ontsnapt maar het was op het nippertje. Van Dijk weet nu dat iemand achter hem aan zit.',
            effects: { money: 0, heat: 20, rep: 30, dirtyMoney: 5000, crewDamage: 10, karma: -10 },
          },
        ],
      },
      {
        id: 'wraak_3',
        text: 'Het complot gaat dieper dan je dacht. Van Dijk werkte niet alleen — hij werd beschermd door iemand hogerop. Commissaris Brandt. De man die na de dood van je partner persoonlijk condoleerde en beloofde "de daders te vinden." Hij wist het de hele tijd.',
        phonePreview: '"Commissaris Brandt. Hij gaf het bevel die nacht. Het gaat helemaal tot de top." — Anoniem',
        phoneFrom: 'anonymous',
        choices: [
          {
            id: 'wraak_3a', label: 'BOUW EEN DOSSIER', stat: 'brains', difficulty: 40,
            successText: 'Weken van werk. Maar je dossier is waterdicht. Getuigenverklaringen, financiële sporen, afgeluisterde gesprekken. Brandt kan niet meer ontsnappen.',
            failText: 'Het dossier is incompleet. Je hebt meer tijd nodig — maar die heb je misschien niet.',
            effects: { money: -5000, heat: 5, rep: 30, dirtyMoney: 0, crewDamage: 0, karma: 15 },
          },
          {
            id: 'wraak_3b', label: 'ONTVOER BRANDT', stat: 'muscle', difficulty: 50,
            successText: 'Een gewaagde operatie. Brandt wordt uit zijn eigen auto gesleurd. In een verlaten loods bekent hij alles — op tape.',
            failText: 'Brandts beveiliging is te sterk. Een van je crewleden raakt gewond bij de poging.',
            effects: { money: 0, heat: 25, rep: 40, dirtyMoney: 0, crewDamage: 20, karma: -15 },
          },
          {
            id: 'wraak_3c', label: 'LEK HET NAAR DE PERS', stat: 'charm', difficulty: 35,
            successText: 'Een journalist van de Noxhaven Courant pakt het verhaal op. Binnen 24 uur is het landelijk nieuws. Brandt ontkent — maar de druk groeit.',
            failText: 'De pers is te bang. "We kunnen dit niet publiceren zonder meer bewijs."',
            effects: { money: 0, heat: -10, rep: 35, dirtyMoney: 0, crewDamage: 0, karma: 20 },
          },
        ],
      },
      {
        id: 'wraak_4',
        text: 'Het moment van de waarheid. Je staat oog in oog met Commissaris Brandt. Hij weet dat het voorbij is. Maar de vraag blijft: wat doe je nu? Gerechtigheid? Of wraak?',
        phonePreview: '"Brandt is alleen in zijn kantoor vanavond. Geen beveiliging. Dit is je kans." — Hendriks',
        phoneFrom: 'informant',
        districtVariant: {
          iron: 'In de schaduw van de oude staalfabriek van Iron Borough ontmoet je Brandt. De geur van roest en regen. Hij kijkt je aan met de ogen van een man die weet dat het voorbij is.',
          crown: 'In zijn luxe penthouse in Crown Heights wacht Brandt. Kristallen glazen, duur whisky. Een man die gewend is aan macht — maar vanavond heeft hij geen macht meer.',
        },
        choices: [
          {
            id: 'wraak_4a', label: 'DOOD HEM', stat: 'muscle', difficulty: 30,
            successText: 'Het pistool trilt in je hand. Brandt sluit zijn ogen. "Doe het dan." Een schot echoot door de nacht. Het is voorbij. Je partner is gewroken. Maar voel je je beter?',
            failText: 'Je hand trilt te veel. Je kunt het niet. Brandt lacht bitter. "Je bent niet zoals ik."',
            effects: { money: 0, heat: 30, rep: 50, dirtyMoney: 0, crewDamage: 0, karma: -30 },
          },
          {
            id: 'wraak_4b', label: 'LEVER HEM UIT AAN JUSTITIE', stat: 'charm', difficulty: 40,
            successText: 'Je belt Inspecteur Yilmaz. "Ik heb een pakket voor je." Brandt wordt gearresteerd op nationale televisie. Gerechtigheid — op jouw voorwaarden.',
            failText: 'Brandt ontsnapt terwijl je op Yilmaz wacht. Hij vlucht het land uit. Maar het bewijs spreekt voor zich.',
            effects: { money: 10000, heat: -20, rep: 60, dirtyMoney: 0, crewDamage: 0, karma: 30, relChange: { yilmaz: 25 } },
          },
          {
            id: 'wraak_4c', label: 'CHANTEER HEM LEVENSLANG', stat: 'brains', difficulty: 45,
            successText: '"Je doet precies wat ik zeg. Elke maand €10.000. En je beschermt mijn operaties. Voor altijd." Brandt knikt verslagen. Je hebt een commissaris in je zak.',
            failText: 'Brandt weigert. "Ik ga liever de gevangenis in dan jouw hond te worden." Maar je hebt nog steeds het bewijs.',
            effects: { money: 20000, heat: -10, rep: 40, dirtyMoney: 10000, crewDamage: 0, karma: -20 },
          },
          {
            id: 'wraak_4d', label: 'VERGEEF HEM', stat: 'charm', difficulty: 45,
            requiredKarma: 'eerbaar',
            successText: '"Ik vergeef je niet. Maar ik laat je leven — zodat je elke dag moet herinneren wat je hebt gedaan." Brandt huilt. Voor het eerst in jaren. Je loopt weg. Lichter dan je in jaren bent geweest.',
            failText: 'De woorden komen er niet uit. Je hart is te zwaar. Maar je laat hem wel gaan.',
            effects: { money: 0, heat: -25, rep: 70, dirtyMoney: 0, crewDamage: 0, karma: 35, relChange: { yilmaz: 10 } },
          },
          {
            id: 'wraak_4e', label: 'LAAT HEM LIJDEN', stat: 'muscle', difficulty: 35,
            requiredKarma: 'meedogenloos',
            successText: 'Je doodt hem niet. Dat zou te snel zijn. In plaats daarvan vernietig je alles — zijn carrière, zijn familie, zijn naam. Elke dag wordt zijn hel erger. En jij kijkt toe.',
            failText: 'Brandt is taaier dan je dacht. Hij vecht terug met alles wat hij heeft.',
            effects: { money: 15000, heat: 20, rep: 55, dirtyMoney: 10000, crewDamage: 0, karma: -35 },
          },
        ],
      },
    ],
  },

  // ===================================================================
  // ARC: DE SCHULD — exclusief voor De Gevallen Bankier
  // ===================================================================
  {
    id: 'backstory_schuld',
    name: 'De Schuld',
    description: 'Ontmasker de collega\'s die je verraden hebben. Neem terug wat van jou is.',
    icon: '💰',
    triggerConditions: {
      minDay: 4,
      minRep: 20,
      requiredBackstory: 'bankier',
    },
    completionReward: { money: 50000, rep: 200, dirtyMoney: 15000, heat: -10 },
    steps: [
      {
        id: 'schuld_1',
        text: 'Je ziet hem vanuit een café in Crown Heights. Richard van der Berg — je voormalige baas, de man die je carrière vernietigde. Hij stapt uit een Bentley, lachend in zijn telefoon. Dezelfde glimlach waarmee hij je voor de wolven gooide. Je bloed kookt.',
        phonePreview: '"Richard van der Berg is gespot in Crown Heights. De man die alles van je afpakte." — Herinnering',
        phoneFrom: 'anonymous',
        choices: [
          {
            id: 'schuld_1a', label: 'VOLG HEM', stat: 'brains', difficulty: 25,
            successText: 'Je volgt Van der Berg naar een privéclub. Hij ontmoet drie mannen in pak — je herkent twee ervan. Jouw voormalige collega\'s. Ze bespreken iets met gedempte stemmen. Een nieuwe deal?',
            failText: 'Van der Berg stapt in een auto met getinte ramen. Je verliest hem in het verkeer.',
            effects: { money: 0, heat: 3, rep: 10, dirtyMoney: 0, crewDamage: 0, karma: 5 },
          },
          {
            id: 'schuld_1b', label: 'SPREEK HEM AAN', stat: 'charm', difficulty: 35,
            successText: '"Richard." Hij verbleekt als hij je ziet. "Jij? Hier?" Je glimlacht koud. "Verrast? Je zou verraster moeten zijn over wat ik weet." Hij trilt.',
            failText: 'Van der Berg herkent je en loopt door. "Beveiliging." Twee mannen blokkeren je pad.',
            effects: { money: 0, heat: 5, rep: 15, dirtyMoney: 0, crewDamage: 0, karma: 0 },
          },
          {
            id: 'schuld_1c', label: 'LAAT EEN BOODSCHAP ACHTER', stat: 'muscle', difficulty: 20,
            successText: 'Die nacht laat je een envelop in zijn brievenbus. Erin: een foto van hemzelf bij de geheime vergadering, en één woord: "Binnenkort." Laat hem maar zweten.',
            failText: 'Je wordt gefilmd door zijn beveiligingscamera. Van der Berg weet nu dat je in de stad bent.',
            effects: { money: 0, heat: 8, rep: 20, dirtyMoney: 0, crewDamage: 0, karma: -5 },
          },
        ],
      },
      {
        id: 'schuld_2',
        text: 'Je voormalige collega Sophie — de enige die destijds twijfelde — neemt contact op. "Ik wist niet dat ze je zo zouden pakken. Ik heb spijt." Ze biedt aan om te helpen. Maar kun je haar vertrouwen? Ze werkt nog steeds bij Van der Berg & Partners.',
        phonePreview: '"Ik moet met je praten. Ik heb informatie over wat ze nu van plan zijn. Het is groter dan destijds." — Sophie',
        phoneFrom: 'informant',
        choices: [
          {
            id: 'schuld_2a', label: 'VERTROUW SOPHIE', stat: 'charm', difficulty: 30,
            successText: 'Sophie levert inloggegevens voor het interne systeem. Wat je daar vindt is schokkend — ze zijn nog steeds bezig met fraude. Miljoenen. En nu gebruiken ze het bedrijf als dekmantel voor witwassen.',
            failText: 'Sophie krijgt koude voeten. "Ik kan dit niet. Ze vermoorden me." Ze verbreekt het contact.',
            effects: { money: 0, heat: 0, rep: 15, dirtyMoney: 0, crewDamage: 0, karma: 10 },
          },
          {
            id: 'schuld_2b', label: 'TEST HAAR LOYALITEIT', stat: 'brains', difficulty: 35,
            successText: 'Je geeft haar valse informatie en wacht. Niets lekt naar Van der Berg. Sophie is betrouwbaar. Ze stuurt je de echte boekhouding.',
            failText: 'De valse info bereikt Van der Berg binnen 24 uur. Sophie is een mol. Maar nu weet je het.',
            effects: { money: 0, heat: 5, rep: 10, dirtyMoney: 0, crewDamage: 0, karma: 5 },
          },
          {
            id: 'schuld_2c', label: 'HACK HET SYSTEEM ZELF', stat: 'brains', difficulty: 45,
            successText: 'Met hulp van een hacker uit je crew breek je in het financiële systeem. Jackpot — de volledige schaduwboekhouding, inclusief offshore rekeningen.',
            failText: 'Het beveiligingssysteem is te geavanceerd. Alarm. Van der Berg weet dat iemand probeert in te breken.',
            effects: { money: -5000, heat: 10, rep: 25, dirtyMoney: 0, crewDamage: 0, karma: -5 },
          },
        ],
      },
      {
        id: 'schuld_3',
        text: 'Met de bewezen fraude in handen heb je macht. Maar Van der Berg heeft vrienden op hoge plaatsen — rechters, politici, politie. Een directe aanval op het bedrijf zou een oorlog betekenen. Je hebt een strategie nodig.',
        phonePreview: '"Van der Berg heeft gisteren gebeld met een wethouder. Ze proberen je voor te zijn. Actie is nodig." — Sophie',
        phoneFrom: 'informant',
        choices: [
          {
            id: 'schuld_3a', label: 'KOOP AANDELEN — VIJANDIGE OVERNAME', stat: 'brains', difficulty: 45,
            successText: 'Via stromannnen koop je langzaam aandelen op. Wanneer je de drempel bereikt, roep je een buitengewone vergadering bijeen. De blik op Van der Bergs gezicht is onbetaalbaar.',
            failText: 'Van der Berg ruikt onraad en laat de aandelen bevriezen. Je geld zit vast.',
            effects: { money: -15000, heat: 5, rep: 40, dirtyMoney: 0, crewDamage: 0, karma: 10 },
          },
          {
            id: 'schuld_3b', label: 'REKRUTEER ZIJN PARTNERS', stat: 'charm', difficulty: 40,
            successText: 'Eén voor één benader je Van der Bergs partners. Met het fraude-bewijs in je hand draaien ze. "Richard heeft ons allemaal belazerd." Een interne coup.',
            failText: 'Eén partner praat. Van der Berg stelt een crisisteam samen. De muren sluiten.',
            effects: { money: -8000, heat: 3, rep: 35, dirtyMoney: 0, crewDamage: 0, karma: 5 },
          },
          {
            id: 'schuld_3c', label: 'PLUNDER ZIJN REKENINGEN', stat: 'brains', difficulty: 50,
            successText: 'Met de gehackte inloggegevens verplaats je miljoenen van Van der Bergs offshore rekeningen. Het geld verdwijnt via tien lagen naar jouw accounts. Digitale gerechtigheid.',
            failText: 'De transfers worden geblokkeerd door een extra beveiligingslaag. Je krijgt slechts een fractie.',
            effects: { money: 25000, heat: 15, rep: 30, dirtyMoney: 20000, crewDamage: 0, karma: -15 },
          },
        ],
      },
      {
        id: 'schuld_4',
        text: 'Het eindspel. Van der Berg staat met zijn rug tegen de muur. Zijn partners vallen af, zijn rekeningen zijn bevroren of geplunderd, en het bewijs van fraude hangt als een zwaard boven zijn hoofd. Hij vraagt een persoonlijk gesprek. "Laten we dit als zakenlieden oplossen."',
        phonePreview: '"Van der Berg wil praten. Privé. Crown Heights, vanavond. Hij klonk... bang." — Sophie',
        phoneFrom: 'informant',
        districtVariant: {
          crown: 'In de boardroom op de 40ste verdieping waar je ooit werkte. De skyline van Noxhaven glimt achter het glas. Van der Berg zit aan het hoofd van de tafel — voor het laatst.',
        },
        choices: [
          {
            id: 'schuld_4a', label: 'EIS ALLES TERUG', stat: 'charm', difficulty: 35,
            successText: '"Mijn naam wordt gezuiverd. Ik krijg mijn aandeel — met rente. En jij verdwijnt uit het bedrijf." Van der Berg tekent met trillende hand. Je loopt de boardroom uit als eigenaar van alles wat je ooit verloor. En meer.',
            failText: 'Van der Berg weigert. "Dan gaan we allebei ten onder." Een patstelling — maar jij hebt meer te winnen.',
            effects: { money: 40000, heat: 0, rep: 50, dirtyMoney: 0, crewDamage: 0, karma: 20 },
          },
          {
            id: 'schuld_4b', label: 'VERNIETIG HEM VOLLEDIG', stat: 'brains', difficulty: 40,
            successText: 'Je publiceert alles. De fraude, de witwaspraktijken, de corrupte connecties. Van der Berg wordt gearresteerd op nationale televisie. Zijn imperium stort in. De krantenkoppen schreeuwen je naam vrij.',
            failText: 'Van der Berg ontsnapt naar het buitenland voordat het bewijs volledig gepubliceerd is. Maar zijn reputatie is vernietigd.',
            effects: { money: 15000, heat: -15, rep: 80, dirtyMoney: 0, crewDamage: 0, karma: 15 },
          },
          {
            id: 'schuld_4c', label: 'MAAK HEM JE PUPPET', stat: 'charm', difficulty: 50,
            successText: '"Je blijft CEO. Maar elke beslissing gaat via mij. Elke euro winst — 60% voor mij. En je glimlacht erbij." Van der Berg knikt gebroken. Je hebt nu een legaal imperium als dekmantel.',
            failText: 'Van der Berg weigert het juk. "Dood me dan maar." Je hebt een keuze te maken.',
            effects: { money: 30000, heat: -5, rep: 40, dirtyMoney: 15000, crewDamage: 0, karma: -25 },
          },
          {
            id: 'schuld_4d', label: 'BIED EERLIJK PARTNERSCHAP', stat: 'charm', difficulty: 45,
            requiredKarma: 'eerbaar',
            successText: '"We hebben allebei fouten gemaakt, Richard. Ik bied je een eerlijke deal: 50/50, transparant, legaal." Van der Berg kijkt je verbijsterd aan. "Waarom?" "Omdat ik niet wil worden wat jij was." Een handdruk bezegelt een nieuw begin.',
            failText: 'Van der Berg vertrouwt je niet. "Eerlijk? In deze wereld?" Hij loopt weg.',
            effects: { money: 20000, heat: -10, rep: 70, dirtyMoney: 0, crewDamage: 0, karma: 25 },
          },
          {
            id: 'schuld_4e', label: 'RUÏNEER ZIJN FAMILIE', stat: 'brains', difficulty: 35,
            requiredKarma: 'meedogenloos',
            successText: 'Je stopt niet bij Van der Berg. Zijn vrouw, zijn kinderen, zijn ouders — iedereen verliest alles. Bankrekeningen bevroren, huizen geveild, namen besmeurd. Van der Berg huilt op zijn knieën. "Alsjeblieft, niet mijn kinderen." Je kijkt hem koud aan. "Dacht je dat ik wel kinderen had?"',
            failText: 'Zijn familie wordt beschermd door invloedrijke vrienden. Je raakt alleen Van der Berg zelf.',
            effects: { money: 35000, heat: 15, rep: 30, dirtyMoney: 20000, crewDamage: 0, karma: -30 },
          },
        ],
      },
    ],
  },

  // ===================================================================
  // ARC: DE LOYALITEIT — exclusief voor Het Straatkind
  // ===================================================================
  {
    id: 'backstory_loyaliteit',
    name: 'De Loyaliteit',
    description: 'Je oude straatfamilie heeft je nodig. Maar loyaliteit heeft een prijs in Noxhaven.',
    icon: '🔥',
    triggerConditions: {
      minDay: 4,
      minRep: 20,
      requiredBackstory: 'straatkind',
    },
    completionReward: { money: 20000, rep: 300, dirtyMoney: 10000, heat: -10 },
    steps: [
      {
        id: 'loyaal_1',
        text: 'Een gezicht uit het verleden. Karim — je bloedbroeder van de straat. Jullie deelden alles: eten, slaapplaatsen, klappen. Nu staat hij voor je met een blauw oog en gescheurde kleren. "Ze hebben Lowrise overgenomen. De Jackals. Iedereen die we kennen is in gevaar."',
        phonePreview: '"Er is een jongen die naar je vraagt. Zegt dat hij je kent van vroeger. Hij ziet er niet goed uit." — Crew',
        phoneFrom: 'anonymous',
        choices: [
          {
            id: 'loyaal_1a', label: 'HELP KARIM METEEN', stat: 'muscle', difficulty: 25,
            successText: 'Je brengt Karim naar je safehouse, geeft hem schone kleren en een wapen. "Vertel me alles." De Jackals — een nieuwe gang — terroriseren jullie oude buurt. Tijd om terug te slaan.',
            failText: 'Je probeert te helpen maar Karim is te trots. "Ik heb geen liefdadigheid nodig. Ik heb een soldaat nodig."',
            effects: { money: -1000, heat: 0, rep: 15, dirtyMoney: 0, crewDamage: 0, karma: 15 },
          },
          {
            id: 'loyaal_1b', label: 'ONDERZOEK DE JACKALS', stat: 'brains', difficulty: 30,
            successText: 'De Jackals zijn een nieuwe gang, geleid door een zekere "Vos." Ze persen de winkels af en hebben drie van jullie oude hangplekken overgenomen. Maar ze zijn nog jong en onervaren.',
            failText: 'Informatie over de Jackals is schaars. Ze zijn nieuw — maar groeien snel.',
            effects: { money: 0, heat: 3, rep: 10, dirtyMoney: 0, crewDamage: 0, karma: 5 },
          },
          {
            id: 'loyaal_1c', label: 'STUUR GELD NAAR DE BUURT', stat: 'charm', difficulty: 20,
            successText: 'Je stuurt €5.000 naar mevrouw Fatima, de vrouw die jullie als kinderen eten gaf. Ze koopt beveiliging voor de buurt. De mensen herinneren zich je naam met warmte.',
            failText: 'Het geld wordt onderschept door de Jackals. Ze lachen om je poging.',
            effects: { money: -5000, heat: 0, rep: 25, dirtyMoney: 0, crewDamage: 0, karma: 20 },
          },
        ],
      },
      {
        id: 'loyaal_2',
        text: 'De Jackals escaleren. Ze hebben Tiny — het jongste lid van jullie oude groep, nu 16 — gedwongen voor hen te werken als koerier. Karim is woedend. "Ze gebruiken een kind. Ons kind." De buurt kijkt naar jou. Jij bent de enige met de middelen om iets te doen.',
        phonePreview: '"Ze hebben Tiny. Die kleine jongen die altijd achter ons aanliep. Hij is nu hun slaaf." — Karim',
        phoneFrom: 'informant',
        choices: [
          {
            id: 'loyaal_2a', label: 'BEVRIJDT TINY — MET GEWELD', stat: 'muscle', difficulty: 40,
            successText: 'Je valt het Jackals-huis binnen met Karim en je crew. Tiny wordt bevrijd. De Jackals verliezen drie man. De boodschap is duidelijk.',
            failText: 'De Jackals zijn beter bewapend dan verwacht. Een vuurgevecht. Je haalt Tiny eruit, maar je crew raakt gewond.',
            effects: { money: 0, heat: 15, rep: 30, dirtyMoney: 0, crewDamage: 15, karma: 5 },
          },
          {
            id: 'loyaal_2b', label: 'ONDERHANDEL MET DE VOS', stat: 'charm', difficulty: 35,
            successText: '"Laat het kind gaan. In ruil laat ik je verder opereren — buiten mijn blokken." De Vos overweegt. "Deal. Maar als je ons kruist..." Tiny is vrij.',
            failText: 'De Vos lacht je uit. "Waarom zou ik onderhandelen met een oud straatkind dat te groot is geworden?"',
            effects: { money: 0, heat: 5, rep: 20, dirtyMoney: 0, crewDamage: 0, karma: 10 },
          },
          {
            id: 'loyaal_2c', label: 'KOOP HEM VRIJ', stat: 'brains', difficulty: 25,
            successText: 'Je biedt de Vos €8.000 voor Tiny. "Je betaalt dat voor een straatkind?" Hij pakt het geld. Tiny is vrij. Maar de Jackals zijn nu rijker.',
            failText: 'De Vos wil meer. Altijd meer. "€20.000. Anders niet."',
            effects: { money: -8000, heat: 0, rep: 15, dirtyMoney: 0, crewDamage: 0, karma: 15 },
          },
        ],
      },
      {
        id: 'loyaal_3',
        text: 'Karim komt met een voorstel. "De oude groep — iedereen die nog leeft — wil samenkomen. Onder jouw leiding. We pakken de buurt terug. Maar..." Hij aarzelt. "Sommigen willen meer dan alleen de Jackals verjagen. Ze willen dat jij Lowrise runt. Zoals een echte baas."',
        phonePreview: '"De oude garde wil je spreken. Allemaal. Ze hebben een voorstel waar je niet om gevraagd hebt." — Karim',
        phoneFrom: 'informant',
        choices: [
          {
            id: 'loyaal_3a', label: 'VERENIG DE OUDE GROEP', stat: 'charm', difficulty: 35,
            successText: 'In een kelder onder mevrouw Fatima\'s winkel komen ze samen. Zes gezichten uit je verleden. "Wij zijn geen gang," zeg je. "Wij zijn familie." Ze knikken. De Lowrise Broederschap is geboren.',
            failText: 'Niet iedereen vertrouwt je. "Je bent te groot geworden. Je bent een van hén nu." Twee weigeren.',
            effects: { money: -3000, heat: 5, rep: 35, dirtyMoney: 0, crewDamage: 0, karma: 10 },
          },
          {
            id: 'loyaal_3b', label: 'VERSLA DE JACKALS SOLO', stat: 'muscle', difficulty: 45,
            successText: 'Je neemt de Vos één-op-één te grazen in zijn eigen territorium. Het gevecht is brutaal. Maar als de Vos op de grond ligt, wijst je naam zich door de straten. De Jackals vluchten.',
            failText: 'De Vos is een betere vechter dan je dacht. Je wint, maar het kost je.',
            effects: { money: 0, heat: 20, rep: 50, dirtyMoney: 0, crewDamage: 20, karma: -10 },
          },
          {
            id: 'loyaal_3c', label: 'MAAK DE VOS EEN AANBOD', stat: 'brains', difficulty: 40,
            successText: '"Werk voor mij. Ik geef je bescherming, structuur, en een percentage. Of ik vernietig je." De Vos is slim genoeg om te weten wanneer hij verslagen is. De Jackals worden jouw soldaten.',
            failText: 'De Vos doet alsof hij akkoord gaat — maar plant in het geheim een tegenaanval.',
            effects: { money: -5000, heat: 10, rep: 30, dirtyMoney: 5000, crewDamage: 0, karma: -5 },
          },
        ],
      },
      {
        id: 'loyaal_4',
        text: 'Lowrise is veilig. De oude groep is herenigd. Maar nu staat Karim voor je met tranen in zijn ogen. "Weet je nog wat we als kinderen zeiden? \'Als een van ons het maakt, maken we het allemaal.\'" Hij wil dat je de buurt écht helpt. Niet als crimineel — als beschermer.',
        phonePreview: '"Het is tijd om te kiezen wie je bent. Voor de buurt. Voor ons. Voor jezelf." — Karim',
        phoneFrom: 'informant',
        districtVariant: {
          low: 'Op het dak van jullie oude flat in Lowrise. De stad glimt onder je. Karim naast je, net als vroeger. Maar alles is anders. Jullie zijn anders.',
        },
        choices: [
          {
            id: 'loyaal_4a', label: 'INVESTEER IN DE BUURT', stat: 'charm', difficulty: 30,
            successText: 'Je opent een buurthuis, financiert een school, en betaalt de huur voor drie families. De buurt bloeit. Kinderen groeien op met kansen die jullie nooit hadden. Karim glimlacht. "Dit is beter dan wraak."',
            failText: 'Je investeringen worden tegengewerkt door de gemeente. Maar de buurt weet wat je probeerde.',
            effects: { money: -15000, heat: -15, rep: 60, dirtyMoney: 0, crewDamage: 0, karma: 30, relChange: { marco: 15 } },
          },
          {
            id: 'loyaal_4b', label: 'MAAK LOWRISE JE FORT', stat: 'muscle', difficulty: 35,
            successText: 'Lowrise wordt jouw onneembare basis. De oude groep is je binnenste cirkel. Niemand komt erin zonder jouw toestemming. De buurt is veilig — maar op jouw voorwaarden.',
            failText: 'De buurt vreest je nu meer dan ze je respecteert. Karim is teleurgesteld.',
            effects: { money: 5000, heat: 10, rep: 40, dirtyMoney: 10000, crewDamage: 0, karma: -15 },
          },
          {
            id: 'loyaal_4c', label: 'GEEF KARIM DE LEIDING', stat: 'brains', difficulty: 40,
            successText: '"Jij bent beter dan ik hierin." Je maakt Karim de leider van Lowrise. Hij runt het eerlijk, rechtvaardig. En jij hebt een loyale bondgenoot voor het leven.',
            failText: 'Karim twijfelt of hij het aankan. "Ik ben geen leider." Maar hij probeert het — voor jou.',
            effects: { money: 0, heat: -5, rep: 50, dirtyMoney: 5000, crewDamage: 0, karma: 20, relChange: { luna: 10 } },
          },
          {
            id: 'loyaal_4d', label: 'DRAAG ALLES OVER', stat: 'charm', difficulty: 40,
            requiredKarma: 'eerbaar',
            successText: 'Je draagt je hele netwerk over aan de buurt. Legaal, transparant, eerlijk. "Dit is niet van mij. Het was altijd van ons." De buurt huilt. Karim omhelst je. "Broeder." Voor het eerst in jaren voel je vrede.',
            failText: 'Niet iedereen in de buurt vertrouwt je nobele intenties. Maar de kinderen wel.',
            effects: { money: -20000, heat: -20, rep: 80, dirtyMoney: 0, crewDamage: 0, karma: 30 },
          },
          {
            id: 'loyaal_4e', label: 'HEERS ALS KONING', stat: 'muscle', difficulty: 30,
            requiredKarma: 'meedogenloos',
            successText: 'Lowrise is van jou. De oude groep is van jou. Karim, de Jackals, de hele wijk — allemaal van jou. "Loyaliteit?" Je lacht. "Loyaliteit is wanneer ze te bang zijn om te vertrekken." Karim kijkt je aan en ziet een vreemde.',
            failText: 'Karim weigert. "Dit is niet waarvoor we vochten." Hij vertrekt. De buurt is verdeeld.',
            effects: { money: 15000, heat: 15, rep: 35, dirtyMoney: 15000, crewDamage: 0, karma: -30 },
          },
        ],
      },
    ],
  },
];
