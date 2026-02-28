import { useGame } from '@/contexts/GameContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Map, Package, Users, Crosshair, Dices, ChevronRight, Car, Flame, EyeOff, Swords, Home, TrendingUp, Heart, Crown, Globe, Target, UserCheck, Shield, Handshake, Zap, Radio } from 'lucide-react';

import tutWelcome from '@/assets/items/tut-welcome.jpg';
import tutTrade from '@/assets/items/tut-trade.jpg';
import tutCrew from '@/assets/items/tut-crew.jpg';
import tutCombat from '@/assets/items/tut-combat.jpg';
import tutHeat from '@/assets/items/tut-heat.jpg';
import tutHiding from '@/assets/items/tut-hiding.jpg';
import tutVilla from '@/assets/items/tut-villa.jpg';
import tutKarma from '@/assets/items/tut-karma.jpg';
import tutImperium from '@/assets/items/tut-imperium.jpg';
import tutKingpin from '@/assets/items/tut-kingpin.jpg';
import tutMmoMarket from '@/assets/items/tut-mmo-market.jpg';
import tutMmoBosses from '@/assets/items/tut-mmo-bosses.jpg';
import tutMmoPlayers from '@/assets/items/tut-mmo-players.jpg';

const STEPS = [
  {
    title: "Welkom in Noxhaven",
    desc: "Jij bent een straatrat met een droom: de hele stad overnemen. Handel, vecht, bouw een imperium en versla de factieleiders op weg naar de top — samen met of tegen andere spelers.",
    icon: <Map size={32} className="text-gold" />,
    image: tutWelcome,
  },
  {
    title: "Handel & Markt",
    desc: "Koop goederen laag en verkoop hoog in andere districten. Prijzen veranderen dynamisch — let op de vraag-indicatoren en weer-effecten voor maximale winst.",
    icon: <Package size={32} className="text-gold" />,
    image: tutTrade,
  },
  {
    title: "De Gedeelde Markt",
    desc: "Prijzen worden bepaald door alle spelers. Koop je veel Synthetica? Dan stijgt de prijs voor iedereen. Verkoop slim en beïnvloed de markteconomie in jouw voordeel.",
    icon: <Globe size={32} className="text-ice" />,
    image: tutMmoMarket,
  },
  {
    title: "Smokkelroutes",
    desc: "Creëer smokkelroutes tussen districten voor extra winst. Elke route heeft een risico-niveau en capaciteit. Hoe hoger het risico, hoe groter de beloning — maar pas op voor onderschepping!",
    icon: <Car size={32} className="text-gold" />,
    image: tutTrade,
  },
  {
    title: "Crew & Missies",
    desc: "Huur specialisten met unieke vaardigheden. Neem contracten aan die variëren van leveringen tot sabotage. Pas op: missies kunnen verrassende wendingen hebben.",
    icon: <Users size={32} className="text-gold" />,
    image: tutCrew,
  },
  {
    title: "Narratieve Gevechten",
    desc: "Elk gevecht speelt zich af in de sfeer van het district. Kies uit 5 acties inclusief een unieke tactische optie per locatie. Baasgevechten hebben hun eigen verhaallijnen.",
    icon: <Swords size={32} className="text-blood" />,
    image: tutCombat,
  },
  {
    title: "World Bosses",
    desc: "Factieleiders zijn gedeelde vijanden. Alle spelers vallen dezelfde boss aan — de top-3 damage dealers ontvangen extra beloningen. Na verovering reset de boss na 48 uur.",
    icon: <Target size={32} className="text-blood" />,
    image: tutMmoBosses,
  },
  {
    title: "Gangs & Allianties",
    desc: "Richt een gang op of sluit je aan bij een bestaande. Werk samen aan heists, territoriumoorlogen en georganiseerde misdaad. Sluit allianties met andere gangs voor gedeelde verdediging en handelsbonussen.",
    icon: <Handshake size={32} className="text-ice" />,
    image: tutMmoPlayers,
  },
  {
    title: "Realtime Activiteit",
    desc: "Zie wat andere spelers doen in jouw district via de live activity feed. Bekijk wie er online is, volg gevechten en reageer op kansen in real-time.",
    icon: <Radio size={32} className="text-ice" />,
    image: tutMmoPlayers,
  },
  {
    title: "Heat & Onderduiken",
    desc: "Voertuig heat stijgt door handel en reizen — laat je auto omkatten. Persoonlijke heat stijgt door geweld en mislukte missies. Te heet? Duik onder, maar vijanden kunnen je vinden!",
    icon: <Flame size={32} className="text-blood" />,
    image: tutHeat,
  },
  {
    title: "Villa Noxhaven",
    desc: "Bouw je eigen hoofdkwartier met productielabs, veilige opslag en verdedigingen. Geef feesten om factie-relaties te boosten. Upgrade je beveiliging tegen Nemesis-aanvallen.",
    icon: <Home size={32} className="text-gold" />,
    image: tutVilla,
  },
  {
    title: "Karma Systeem",
    desc: "Jouw keuzes bepalen je pad. Meedogenloos? Meer intimidatie en reputatie. Eerbaar? Sneller crew-herstel en lagere heat. Je alignment ontgrendelt exclusieve verhaallijnen.",
    icon: <Heart size={32} className="text-ice" />,
    image: tutKarma,
  },
  {
    title: "Imperium & Operaties",
    desc: "Verover districten, beheer smokkelroutes en verdedig je territorium. Solo-operaties leveren dynamische beloningen op basis van je dag, locatie en heat.",
    icon: <TrendingUp size={32} className="text-gold" />,
    image: tutImperium,
  },
  {
    title: "Andere Spelers",
    desc: "Val rivalen aan, plaats bounties, stuur berichten en handel direct met andere spelers. Verdien titels die iedereen kan zien. Check het leaderboard voor de echte Kingpin.",
    icon: <UserCheck size={32} className="text-gold" />,
    image: tutMmoPlayers,
  },
  {
    title: "Word de Kingpin",
    desc: "Verover alle 5 districten, versla de 3 factieleiders en verzamel €5.000.000. Daarna wacht het eindgevecht tegen SWAT-Commandant Voss en Commissaris Decker.",
    icon: <Crown size={32} className="text-gold" />,
    image: tutKingpin,
  },
];

export function TutorialOverlay() {
  const { dispatch } = useGame();
  const [step, setStep] = useState(0);

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else dispatch({ type: 'SET_TUTORIAL_DONE' });
  };

  const current = STEPS[step];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/95 z-[10000] flex items-center justify-center p-4 backdrop-blur-sm"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="w-full max-w-sm overflow-hidden rounded-lg border border-border bg-card"
        >
          {/* Banner image */}
          <div className="relative h-36 overflow-hidden">
            <img src={current.image} alt={current.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
            <div className="absolute bottom-3 left-0 right-0 flex justify-center">
              {current.icon}
            </div>
          </div>

          <div className="px-5 pb-5 pt-2 text-center">
            <h2 className="font-display text-xl text-gold uppercase tracking-widest mb-3">{current.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">{current.desc}</p>

            <div className="flex gap-1.5 mb-4">
              {STEPS.map((_, i) => (
                <div key={i} className={`flex-1 h-1 rounded-full transition-colors ${i <= step ? 'bg-gold' : 'bg-muted'}`} />
              ))}
            </div>

            <button
              onClick={next}
              className="w-full py-3 rounded bg-blood text-primary-foreground font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 glow-blood"
            >
              {step < STEPS.length - 1 ? 'VOLGENDE' : 'START HET SPEL'}
              <ChevronRight size={16} />
            </button>

            {step < STEPS.length - 1 && (
              <button
                onClick={() => dispatch({ type: 'SET_TUTORIAL_DONE' })}
                className="mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Overslaan
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
