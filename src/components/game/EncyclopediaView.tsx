import { useState } from 'react';
import { SectionHeader } from './ui/SectionHeader';
import { motion, AnimatePresence } from 'framer-motion';
import { Book, ChevronRight, X, Flame, Shield, Swords, Users, MapPin, Home, Brain, Handshake, Target, Dices, Crown, Car, Skull, FlaskConical, Trophy, Globe, Radio, Crosshair, Route, Zap } from 'lucide-react';

interface EncyclopediaEntry {
  id: string;
  title: string;
  icon: React.ReactNode;
  category: string;
  content: string[];
}

const ENTRIES: EncyclopediaEntry[] = [
  {
    id: 'heat',
    title: 'Heat 2.0 Systeem',
    icon: <Flame size={14} className="text-blood" />,
    category: 'Systemen',
    content: [
      '🔥 Heat meet hoe veel aandacht de politie aan je besteedt (0-100).',
      '📊 Er zijn twee soorten heat: Persoonlijke Heat en Voertuig Heat. De hoogste bepaalt je effectieve heat.',
      '⚠️ Bij 45+ heat: kans op politie-invallen met boetes.',
      '🚨 Bij 80+ heat: GEZOCHT status — 10% kans op arrestatie bij elke actie.',
      '📉 Heat daalt elke nacht. Safehouses, Hacker-crew, Server Room en eerbaar karma verhogen de decay.',
      '🏠 Onderduiken verlaagt heat -15/dag maar je kunt niets doen.',
      '🔄 Voertuig rekatten verwijdert voertuig-heat volledig (3 dagen cooldown).',
    ],
  },
  {
    id: 'karma',
    title: 'Karma Systeem',
    icon: <Shield size={14} className="text-gold" />,
    category: 'Systemen',
    content: [
      '⚖️ Karma loopt van -100 (Meedogenloos) tot +100 (Eerbaar).',
      '🔴 Meedogenloos bonussen: +intimidatie opbrengst, +rep gain, +fear factor (minder factie-schade).',
      '🟢 Eerbaar bonussen: sneller crew-herstel, minder politie-invallen, extra heat-decay, betere handelsprijzen.',
      '🎭 Verhaalkeuzes in story arcs tonen een schild (eerbaar) of vlam (meedogenloos) icoon.',
      '📊 Karma beïnvloedt NPC-relaties en ontgrendelt exclusieve dialoogopties.',
    ],
  },
  {
    id: 'conquest',
    title: 'World Bosses & Conquest',
    icon: <Crown size={14} className="text-gold" />,
    category: 'MMO',
    content: [
      '👑 Factieleiders zijn gedeelde vijanden — alle spelers vallen dezelfde boss aan.',
      '⚔️ Elke factie heeft 3 conquest fasen: Outpost → Verdediging → Boss.',
      '🏆 De top-3 damage dealers ontvangen extra beloningen bij het verslaan van een boss.',
      '⏳ Na verovering respawnt de boss na 48 uur — iedereen kan opnieuw meedoen.',
      '📊 Je schade wordt bijgehouden in een leaderboard per boss.',
      '🎯 Verover alle 3 facties om de eindbaas (Commissaris Decker) te ontgrendelen.',
    ],
  },
  {
    id: 'nemesis',
    title: 'Nemesis Systeem',
    icon: <Skull size={14} className="text-blood" />,
    category: 'Systemen',
    content: [
      '🦹 Je nemesis is een rivaliserende AI-tegenstander die meegroeit met je voortgang.',
      '📈 Elke verslagen nemesis wordt vervangen door een sterkere opvolger (max 5 generaties).',
      '🎭 Elke nemesis heeft een archetype: Zakenman, Brute, Schaduw of Strateeg.',
      '🤝 Je kunt onderhandelen voor een wapenstilstand (vereist 30+ Charm).',
      '🔍 Stuur een informant om de nemesis te verkennen (vereist Hacker of 40+ Brains).',
      '🏠 Nemesis kan je villa aanvallen — camera\'s en verdedigingen zijn cruciaal.',
    ],
  },
  {
    id: 'gangs',
    title: 'Gang Systeem',
    icon: <Users size={14} className="text-ice" />,
    category: 'MMO',
    content: [
      '🏴‍☠️ Richt een gang op met een unieke naam en tag, of sluit je aan bij een bestaande.',
      '👑 Rollen: Leader (volledige controle), Officer (uitnodigen, treasury) en Member.',
      '💬 Privé gang chat voor coördinatie.',
      '💰 Gang treasury: leden doneren geld voor gezamenlijke operaties.',
      '⚔️ Gang Wars: verklaar oorlog aan rivalen — de gang met de meeste score wint territorium.',
      '🏗️ Territory Control: verover districten als gang en verdedig ze samen.',
      '📈 Gang XP en levels: hoe actiever de gang, hoe sterker de bonussen.',
    ],
  },
  {
    id: 'alliances',
    title: 'Allianties & Diplomatie',
    icon: <Handshake size={14} className="text-ice" />,
    category: 'MMO',
    content: [
      '🤝 Gangs kunnen allianties sluiten voor wederzijds voordeel.',
      '🛡️ Gedeelde verdediging: alliantie-leden helpen bij territorium-aanvallen.',
      '💹 Handelsbonussen: korting op transacties tussen alliantie-partners.',
      '⏰ Allianties zijn tijdelijk en verlopen na de ingestelde duur.',
      '📋 Stel een alliantie voor via het gang-menu — de andere gang moet accepteren.',
      '⚠️ Allianties blokkeren gang wars tussen partners.',
    ],
  },
  {
    id: 'smuggle_routes',
    title: 'Smokkelroutes',
    icon: <Route size={14} className="text-gold" />,
    category: 'MMO',
    content: [
      '🚢 Creëer smokkelroutes tussen districten voor specifieke goederen.',
      '💰 Elke route heeft een winstmultiplier (1.2x-2.5x) gebaseerd op risico.',
      '⚠️ Risico-niveaus (1-10): hogere risico = meer winst maar grotere kans op onderschepping.',
      '📦 Routes hebben een capaciteitslimiet — als de route vol is, moet je wachten.',
      '⏰ Routes verlopen na een bepaalde tijd en moeten hernieuwd worden.',
      '🗺️ Actieve routes zijn zichtbaar als stippellijnen op de kaart.',
      '🏴‍☠️ Gang-routes hebben extra capaciteit en lagere risico\'s.',
    ],
  },
  {
    id: 'activity_feed',
    title: 'Realtime Activiteit',
    icon: <Radio size={14} className="text-ice" />,
    category: 'MMO',
    content: [
      '📡 De activity feed toont live acties van spelers in jouw district.',
      '👀 Zie trades, gevechten, veroveringen en bounties in real-time.',
      '🟢 Online spelers indicator: bekijk wie er actief is per district met level-info.',
      '🔔 Belangrijke events verschijnen als Breaking News flitsmeldingen.',
      '📰 Speleracties genereren automatisch nieuwsberichten voor de hele server.',
      '💡 Gebruik de feed om kansen te spotten en bedreigingen te detecteren.',
    ],
  },
  {
    id: 'npc_mood',
    title: 'NPC Mood Systeem',
    icon: <Users size={14} className="text-emerald" />,
    category: 'MMO',
    content: [
      '😡 NPC\'s hebben een collectieve stemming per district, bepaald door alle spelers.',
      '📊 5 niveaus: Hostile → Wary → Neutral → Friendly → Legendary.',
      '🔴 Hostile: events geblokkeerd, prijzen +20%.',
      '🟡 Wary: beperkte interactie mogelijkheden.',
      '🟢 Friendly: district bonussen actief, handelskortingen.',
      '🌟 Legendary: unieke quests en speciale beloningen beschikbaar.',
      '💡 Positieve acties (handel, diplomatie) verhogen de mood; geweld verlaagt het.',
    ],
  },
  {
    id: 'pvp',
    title: 'PvP & Bounties',
    icon: <Crosshair size={14} className="text-blood" />,
    category: 'MMO',
    content: [
      '⚔️ Val andere spelers aan in hetzelfde district via het speler-overzicht.',
      '💰 Plaats een bounty op een rivaal — andere spelers worden beloond voor het claimen.',
      '📬 Stuur privéberichten naar spelers: dreig, onderhandel of werk samen.',
      '🔄 Trade Offers: bied goederen en geld aan in directe speler-naar-speler handel.',
      '🏆 Rivaliteiten worden bijgehouden — herhaalde conflicten verhogen de rivalry score.',
      '⚠️ PvP genereert persoonlijke heat en activity feed meldingen.',
    ],
  },
  {
    id: 'titles',
    title: 'Speler Titels',
    icon: <Crown size={14} className="text-gold" />,
    category: 'MMO',
    content: [
      '🏅 Verdien titels door bijzondere prestaties te behalen.',
      '👑 Voorbeelden: "Kingpin", "Drugsbaron", "Schaduw", "Oorlogsheer".',
      '✨ Titels zijn zichtbaar voor andere spelers naast je naam.',
      '🔄 Wissel je actieve titel via het profiel-menu.',
      '💎 Zeldzame titels worden verdiend door endgame-content en MMO-achievements.',
    ],
  },
  {
    id: 'crossover',
    title: 'Backstory Crossovers',
    icon: <Zap size={14} className="text-gold" />,
    category: 'MMO',
    content: [
      '🤝 Wanneer spelers met verschillende achtergronden elkaar ontmoeten, kunnen unieke events triggeren.',
      '📖 Weduwnaar + Bankier: "Gedeelde Vijanden" — ontdek een gedeelde samenzwering.',
      '🌃 Bankier + Straatkind: "Twee Werelden" — combineer elite-connecties met straatkennis.',
      '🔍 Straatkind + Weduwnaar: "Verborgen Plekken" — vind bewijs in geheime tunnels.',
      '💰 Crossover events geven beide spelers beloningen: geld, reputatie en karma.',
      '📰 Crossover uitkomsten genereren nieuwsberichten voor de hele server.',
    ],
  },
  {
    id: 'crew',
    title: 'Crew & Loyaliteit',
    icon: <Users size={14} className="text-emerald" />,
    category: 'Crew',
    content: [
      '👥 Crew members hebben een loyaliteitswaarde (0-100).',
      '🧠 Elke crewlid heeft een persoonlijkheidstrek die unieke events triggert.',
      '💚 Bij 80+ loyaliteit: Trouw Bonus met permanente voordelen.',
      '⚠️ Bij 30-: Ultimatum event — overtuig ze om te blijven.',
      '💀 Bij 20-: Risico op desertie of verraad (crewlid sluit zich aan bij vijandige factie).',
      '🏠 Villa Crew Kwartieren (+3 loyaliteit/dag) en Medbay (+1) helpen.',
      '🎖️ Op level 5 kiezen crewleden een specialisatie met unieke bonussen.',
    ],
  },
  {
    id: 'villa',
    title: 'Villa Systeem',
    icon: <Home size={14} className="text-gold" />,
    category: 'Imperium',
    content: [
      '🏛️ De villa is je hoofdkwartier met 14 installeerbare modules.',
      '📈 Villa heeft 3 levels die extra modules en verdediging ontgrendelen.',
      '💰 Kluis beschermt geld tegen diefstal en arrestatie.',
      '🌿 Wietplantage & Coke Lab produceren passief drugs (genereren heat).',
      '🔫 Wapenkamer, Commandocentrum en Camera\'s verbeteren verdediging.',
      '🚁 Helipad geeft gratis reizen naar elk district (1x per dag).',
      '⭐ Prestige-upgrades (gouden modules) verdubbelen de bonus van een module.',
    ],
  },
  {
    id: 'trade',
    title: 'Gedeelde Markt',
    icon: <Globe size={14} className="text-ice" />,
    category: 'Economie',
    content: [
      '📊 Prijzen worden bepaald door alle spelers — koop je veel, dan stijgt de prijs voor iedereen.',
      '📈 District-vraag (geel label) verhoogt prijzen met 60%.',
      '🏭 Market Events (bijv. "Havenstaking") beïnvloeden specifieke goederen.',
      '⏰ Goederen bederven over tijd — sla niet te veel op.',
      '💸 Witwassen zet zwart geld om in schoon geld (85% conversie, 115% met Neon Strip).',
      '🔔 Stel markt-alerts in om meldingen te krijgen bij gunstige prijzen.',
      '🤝 Trade Offers: bied direct handel aan andere spelers aan.',
    ],
  },
  {
    id: 'heist',
    title: 'Heist Systeem',
    icon: <Brain size={14} className="text-game-purple" />,
    category: 'Missies',
    content: [
      '🏦 Heists zijn grote overvaloperaties met planningsfase en uitvoering.',
      '🔍 Recon verlaagt de moeilijkheidsgraad — investeer in verkenning.',
      '🛠️ Koop heist-uitrusting (jammers, thermiet, drones) voor extra kansen.',
      '🎯 Kies een aanpak: Stealth, Direct Assault of Inside Job.',
      '⚠️ Complicaties kunnen optreden — je keuzes bepalen het resultaat.',
      '💰 Beloningen zijn enorm maar heat en risico ook.',
      '🏴‍☠️ Gang Heists: coördineer met gangleden voor grotere overvaloperaties.',
    ],
  },
  {
    id: 'corruption',
    title: 'Corruptie Netwerk',
    icon: <Handshake size={14} className="text-police" />,
    category: 'Imperium',
    content: [
      '👮 Rekruteer corrupte agenten, rechters en ambtenaren.',
      '💰 Elk contact heeft maandelijkse kosten en een verraadrisico.',
      '🛡️ Contacten bieden bescherming: minder invallen, lagere boetes, handelsvoordelen.',
      '⚠️ Contacten kunnen gecompromitteerd raken — dan verliezen ze hun nut.',
      '📋 Agent Brouwer: heat-reductie. Rechter Van Dijk: boetereductie. Mr. Vermeer: kortere celstraf.',
    ],
  },
  {
    id: 'casino',
    title: 'Casino Games',
    icon: <Dices size={14} className="text-game-purple" />,
    category: 'Activiteiten',
    content: [
      '🃏 Blackjack: Krijg 21 of meer dan de dealer zonder te busten.',
      '🎰 Slots: Trek de hendel en hoop op drie gelijke symbolen.',
      '🔴 Roulette: Zet in op rood/zwart, even/oneven of specifieke nummers.',
      '🔢 High-Low: Raad of de volgende kaart hoger of lager is. Elke ronde verdubbelt de inzet.',
      '💎 De Jackpot groeit met elke inzet en kan willekeurig gewonnen worden.',
    ],
  },
  {
    id: 'racing',
    title: 'Racing & Garage',
    icon: <Car size={14} className="text-gold" />,
    category: 'Activiteiten',
    content: [
      '🏎️ Race tegen NPC-coureurs in drie categorieën: Street, Harbor en Neon GP.',
      '🔧 Upgrade je voertuig (Armor, Speed, Storage) voor betere prestaties.',
      '🔄 Rekat je voertuig om voertuig-heat te resetten (3 dagen cooldown).',
      '🚗 Steel auto\'s en verkoop ze via de Chop Shop of aan klanten.',
      '💰 Zeldzame auto\'s (exotic) brengen veel meer op maar zijn moeilijker te stelen.',
    ],
  },
  {
    id: 'npcs',
    title: 'NPC Relaties',
    icon: <Users size={14} className="text-ice" />,
    category: 'Verhaal',
    content: [
      '🍸 Rosa (Neon Strip): Markt-tips, casino bonus (+5%), witwas efficiency (+10%).',
      '👴 Marco (Lowrise): +Kracht, crew healing bonus, gratis crew heal/dag.',
      '🔍 Yilmaz (Crown Heights): Boetereductie, minder invallen, -25% heat/dag.',
      '🌙 Luna (Lowrise): Street event warnings, +solo ops succes, gratis Hacker crewlid.',
      '🦅 Krow (Neon Strip): Factie intimidatie korting, +rep gain, +trade profit.',
      '💡 Ontmoet NPC\'s door hun district te bezoeken. Relaties groeien door events en keuzes.',
    ],
  },
  {
    id: 'prison',
    title: 'Gevangenis & Ziekenhuis',
    icon: <Shield size={14} className="text-blood" />,
    category: 'Systemen',
    content: [
      '🔒 Arrestatie: straf afhankelijk van heat (1-7 dagen). Geld en illegale goederen worden geconfisqueerd.',
      '💰 Villa kluis beschermt opgeslagen geld tijdens arrestatie.',
      '🏥 Bij verloren gevecht: ziekenhuisopname (3 dagen, kosten afhankelijk van max HP).',
      '💀 Na 3 ziekenhuisopnames: Game Over.',
      '⚡ 15% kans op "Last Stand" — overleef met 1 HP ipv ziekenhuis.',
      '🔓 Ontsnappingspoging in gevangenis: 30% basisskans, +10% met Brains.',
    ],
  },
  {
    id: 'ngplus',
    title: 'New Game+',
    icon: <Crown size={14} className="text-game-purple" />,
    category: 'Systemen',
    content: [
      '🔄 Na het verslaan van Commissaris Decker kun je een New Game+ starten.',
      '📈 Elke NG+ ronde schaalt vijanden met +25% schade per level.',
      '🎒 Je houdt tot 2 gear items en 30% van NPC-relaties.',
      '💰 Extra startgeld: €5.000 per NG+ level.',
      '⚔️ NG+2: Elite Contracten ontgrendeld — moeilijker maar lucratiever.',
      '🏦 NG+3: Legendarische Heists — unieke overvallocaties alleen beschikbaar in NG+3+.',
      '🦹 Je nemesis start met een wraakactie en een nieuw archetype elk NG+ level.',
      '🏆 Achievements en titels blijven behouden over alle NG+ runs.',
    ],
  },
  {
    id: 'drug_empire',
    title: 'Drug Imperium',
    icon: <FlaskConical size={14} className="text-game-purple" />,
    category: 'Imperium',
    content: [
      '💀 Het Drug Imperium is een endgame-systeem dat je villa-productie uitbreidt naar een volwaardige drugsoperatie.',
      '🔓 Ontgrendeld zodra je minimaal 1 productiemodule bezit (Wietplantage, Coke Lab of Synthetica Lab).',
      '',
      '🧪 KWALITEITSTIERS — Elk lab produceert in drie kwaliteitsniveaus:',
      '  • Straat (Tier 1): 1.0x prijs, 1.0x heat — standaard beschikbaar.',
      '  • Premium (Tier 2): 1.8x prijs, 1.5x heat — vereist Lab Tier 2.',
      '  • Puur (Tier 3): 3.0x prijs, 2.5x heat — vereist Lab Tier 3.',
      '',
      '🔬 LAB UPGRADES — Elk lab heeft 3 upgrade-tiers:',
      '  • Tier 1: Basisproductie (al actief bij aankoop).',
      '  • Tier 2: +50% output, -20% chemicaliënkosten. Kost €75k-€120k, vereist Villa Level 2.',
      '  • Tier 3: +100% output, unlock Puur kwaliteit + NoxCrystal recept. Kost €200k-€300k, vereist Villa Level 3 + alle districten.',
      '',
      '🤝 DISTRIBUTIENETWERK — Wijs crewleden aan als dealers:',
      '  • Max 5 dealers, 1 per district. Vereist dat je het district bezit.',
      '  • Dealers bouwen marktaandeel op (+5%/dag, max 100%).',
      '  • Inkomen = basisprijs × kwaliteit × district-vraag × marktaandeel × dealer-level.',
      '  • Hoog marktaandeel (>60%) trekt rivaal-sabotage aan.',
      '',
      '💎 NOXCRYSTAL — Het ultieme endgame-product:',
      '  • Vereist: alle 3 labs op Tier 3 + minimaal 10 chemicaliën.',
      '  • Productie: 1-2 per nacht, verkoopwaarde €8.000-€12.000 per stuk.',
      '  • Genereert +15 Heat per verkoop — alleen voor de zwaarste spelers.',
      '',
      '⚠️ RISICO-EVENTS — Elke nacht is er kans op:',
      '  • 🚨 Lab Raid (heat >60): lab 2 dagen offline, verlies voorraad.',
      '  • ☠️ Besmette Batch (10%): karma -5, reputatie -10.',
      '  • ⚔️ Rivaal Sabotage (marktaandeel >60%): dealer gewond, marktaandeel -20%.',
      '  • 🔍 DEA Onderzoek (NoxCrystal + heat >40): 3 dagen geen productie, +15% arrestatiekans.',
      '  • 🌿 Grote Oogst (5% bij Tier 3): dubbele productie die nacht!',
    ],
  },
  {
    id: 'leaderboard',
    title: 'Online Leaderboard',
    icon: <Trophy size={14} className="text-gold" />,
    category: 'MMO',
    content: [
      '🌐 Het Online Leaderboard laat je je voortgang vergelijken met andere spelers.',
      '',
      '📝 REGISTRATIE:',
      '  • Maak een account aan via het hoofdmenu (📧 Registreren).',
      '  • Kies een unieke gebruikersnaam — dit is je publieke naam op het leaderboard.',
      '',
      '🔄 SYNCHRONISATIE:',
      '  • Je stats worden automatisch gesynct.',
      '  • Alleen ingelogde spelers worden gesynchroniseerd.',
      '  • Gegevens: Reputatie, Cash, Dag, Level, Districten, Crew-grootte, Karma en Backstory.',
      '',
      '📊 RANKING CRITERIA:',
      '  • Sorteer op REP (standaard), CASH, DAGEN of LAND (districten).',
      '  • Top 50 spelers worden getoond per categorie.',
      '  • Je eigen positie wordt altijd uitgelicht met een gouden rand.',
      '',
      '🏅 TITELS:',
      '  • Je actieve titel wordt getoond naast je naam op het leaderboard.',
      '  • Verdien titels door achievements, district-veroveringen en MMO-prestaties.',
    ],
  },
];

const CATEGORIES = [...new Set(ENTRIES.map(e => e.category))];

export function EncyclopediaView() {
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filtered = selectedCategory
    ? ENTRIES.filter(e => e.category === selectedCategory)
    : ENTRIES;

  const entry = ENTRIES.find(e => e.id === selectedEntry);

  if (entry) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <button
          onClick={() => setSelectedEntry(null)}
          className="flex items-center gap-1 text-[0.55rem] text-muted-foreground hover:text-foreground mb-3"
        >
          ← Terug
        </button>
        <div className="game-card border-l-[3px] border-l-ice mb-4">
          <div className="flex items-center gap-2 mb-3">
            {entry.icon}
            <h3 className="font-display text-sm text-ice uppercase tracking-widest">{entry.title}</h3>
          </div>
          <div className="space-y-2">
            {entry.content.map((line, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="text-[0.6rem] leading-relaxed text-muted-foreground"
              >
                {line}
              </motion.p>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      <SectionHeader title="Encyclopedie" icon={<Book size={12} />} />

      {/* Category filters */}
      <div className="flex gap-1.5 mb-3 overflow-x-auto scrollbar-hide pb-1">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`shrink-0 px-2.5 py-1.5 rounded text-[0.5rem] font-bold uppercase tracking-wider transition-all ${
            !selectedCategory ? 'bg-ice/15 border border-ice text-ice' : 'bg-muted border border-border text-muted-foreground'
          }`}
        >
          Alles
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`shrink-0 px-2.5 py-1.5 rounded text-[0.5rem] font-bold uppercase tracking-wider transition-all ${
              selectedCategory === cat ? 'bg-ice/15 border border-ice text-ice' : 'bg-muted border border-border text-muted-foreground'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Entries */}
      <div className="space-y-2 mb-4">
        {filtered.map((e, idx) => (
          <motion.button
            key={e.id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03 }}
            onClick={() => setSelectedEntry(e.id)}
            className="w-full game-card flex items-center gap-2.5 hover:border-ice/30 transition-all text-left"
          >
            {e.icon}
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-[0.6rem] truncate">{e.title}</h4>
              <p className="text-[0.4rem] text-muted-foreground">{e.category}</p>
            </div>
            <ChevronRight size={12} className="text-muted-foreground shrink-0" />
          </motion.button>
        ))}
      </div>
    </>
  );
}
