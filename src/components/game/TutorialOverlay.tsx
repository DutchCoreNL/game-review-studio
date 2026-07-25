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
    desc: "Vijf districten, en ze zijn allemaal al van iemand. Jij begint onderaan met een handvol mensen en de ambitie om dat te veranderen.",
    icon: <Map size={32} className="text-gold" />,
    image: tutWelcome,
  },
  {
    title: "Je crew doet het werk",
    desc: "Je zet je mensen op rackets in de districten — beschermingsgeld, koeriers, smokkel. Ze verdienen elke dag door, ook als je het spel dicht hebt.",
    icon: <Users size={32} className="text-gold" />,
    image: tutCrew,
  },
  {
    title: "Ieder z'n talent",
    desc: "Een Meedogenloos type is goud waard bij afpersing, een Spook werkt onopgemerkt. Zet de juiste man op de juiste klus — en laat wie moe is rusten.",
    icon: <UserCheck size={32} className="text-game-purple" />,
    image: tutCrew,
  },
  {
    title: "Geld trekt aandacht",
    desc: "Hoe rijker het district, hoe beter het betaalt — en hoe sneller de eigenaar je opmerkt. Ondertussen loopt de politiehitte op. Witwassen koelt allebei af.",
    icon: <Flame size={32} className="text-blood" />,
    image: tutHeat,
  },
  {
    title: "De stad slaat terug",
    desc: "Word je te zichtbaar, dan staat El Serpiente, Mr. Wu of de politie voor je deur. Dan moet je kiezen: terugslaan, afkopen, of de klap incasseren.",
    icon: <Swords size={32} className="text-blood" />,
    image: tutCombat,
  },
  {
    title: "Je nalatenschap",
    desc: "Groeit je organisatie groot genoeg, dan geef je haar door aan een opvolger. Die begint opnieuw — maar met alles wat jij hebt opgebouwd als voorsprong.",
    icon: <Crown size={32} className="text-gold" />,
    image: tutKingpin,
  },
];

export function TutorialOverlay() {
  const { dispatch } = useGame();
  const [step, setStep] = useState(0);
  const [confirmSkip, setConfirmSkip] = useState(false);

  const finishTutorial = () => {
    try {
      sessionStorage.setItem('noxhaven_tutorial_completed', '1');
    } catch {
      // ignore storage errors
    }
    dispatch({ type: 'SET_TUTORIAL_DONE' });
  };

  const next = () => {
    setConfirmSkip(false);
    if (step < STEPS.length - 1) setStep(step + 1);
    else finishTutorial();
  };

  const skipTutorial = () => {
    if (!confirmSkip) {
      setConfirmSkip(true);
      return;
    }
    finishTutorial();
  };

  const current = STEPS[step];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/95 z-[2147483647] flex items-center justify-center p-4 backdrop-blur-sm"
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
                onClick={skipTutorial}
                className="mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {confirmSkip ? 'Nogmaals drukken om over te slaan' : 'Overslaan'}
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
