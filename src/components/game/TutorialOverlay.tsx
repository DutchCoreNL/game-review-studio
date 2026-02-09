import { useGame } from '@/contexts/GameContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Map, Package, Users, Crosshair, Dices, ChevronRight, Car, Flame, EyeOff, Swords, Home, TrendingUp, Heart, Crown } from 'lucide-react';

const STEPS = [
  {
    title: "Welkom in Noxhaven",
    desc: "Jij bent een straatrat met een droom: de hele stad overnemen. Handel, vecht, bouw een imperium en versla de factieleiders op weg naar de top.",
    icon: <Map size={32} className="text-gold" />,
  },
  {
    title: "Handel & Markt",
    desc: "Koop goederen laag en verkoop hoog in andere districten. Prijzen veranderen dynamisch — let op de vraag-indicatoren en weer-effecten voor maximale winst.",
    icon: <Package size={32} className="text-gold" />,
  },
  {
    title: "Crew & Missies",
    desc: "Huur specialisten met unieke vaardigheden. Neem contracten aan die variëren van leveringen tot sabotage. Pas op: missies kunnen verrassende wendingen hebben.",
    icon: <Users size={32} className="text-gold" />,
  },
  {
    title: "Narratieve Gevechten",
    desc: "Elk gevecht speelt zich af in de sfeer van het district. Kies uit 5 acties inclusief een unieke tactische optie per locatie. Baasgevechten hebben hun eigen verhaallijnen.",
    icon: <Swords size={32} className="text-blood" />,
  },
  {
    title: "Voertuig & Persoonlijke Heat",
    desc: "Voertuig heat stijgt door handel en reizen — laat je auto omkatten om het te resetten. Persoonlijke heat stijgt door geweld en mislukte missies — veel lastiger weg te krijgen!",
    icon: <Flame size={32} className="text-blood" />,
  },
  {
    title: "Onderduiken",
    desc: "Te heet? Duik onder voor 1-3 dagen. Je heat daalt flink, maar je verliest inkomen en vijanden kunnen aanvallen. Een Safe House verdubbelt je natuurlijke heat decay.",
    icon: <EyeOff size={32} className="text-game-purple" />,
  },
  {
    title: "Villa Noxhaven",
    desc: "Bouw je eigen hoofdkwartier met productielabs, veilige opslag en verdedigingen. Geef feesten om factie-relaties te boosten. Upgrade je beveiliging tegen Nemesis-aanvallen.",
    icon: <Home size={32} className="text-gold" />,
  },
  {
    title: "Karma Systeem",
    desc: "Jouw keuzes bepalen je pad. Meedogenloos? Meer intimidatie en reputatie. Eerbaar? Sneller crew-herstel en lagere heat. Je alignment ontgrendelt exclusieve verhaallijnen.",
    icon: <Heart size={32} className="text-ice" />,
  },
  {
    title: "Imperium & Operaties",
    desc: "Verover districten, beheer smokkelroutes en verdedig je territorium. Solo-operaties leveren dynamische beloningen op basis van je dag, locatie en heat.",
    icon: <TrendingUp size={32} className="text-gold" />,
  },
  {
    title: "Word de Kingpin",
    desc: "Verover alle 5 districten, versla de 3 factieleiders en verzamel €5.000.000. Daarna wacht het eindgevecht tegen SWAT-Commandant Voss en Commissaris Decker.",
    icon: <Crown size={32} className="text-gold" />,
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
      className="fixed inset-0 bg-background/95 z-[10000] flex items-center justify-center p-6 backdrop-blur-sm"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="w-full max-w-sm text-center"
        >
          <div className="mb-6">{current.icon}</div>
          <h2 className="font-display text-xl text-gold uppercase tracking-widest mb-3">{current.title}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-8">{current.desc}</p>

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
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}