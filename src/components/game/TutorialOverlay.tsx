import { useGame } from '@/contexts/GameContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Map, Package, Users, Crosshair, Dices, ChevronRight } from 'lucide-react';

const STEPS = [
  { title: "Welkom in Noxhaven", desc: "Jij bent een straatrat met een droom: de hele stad overnemen. Handel, vecht en verover je weg naar de top.", icon: <Map size={32} className="text-gold" /> },
  { title: "Handel", desc: "Koop laag, verkoop hoog. Reis tussen districten voor de beste prijzen. Let op de vraag-indicatoren!", icon: <Package size={32} className="text-gold" /> },
  { title: "Crew & Missies", desc: "Huur specialisten en neem contracten aan. Elke rol heeft unieke vaardigheden in gevechten.", icon: <Users size={32} className="text-gold" /> },
  { title: "Gevaar", desc: "Heat trekt politie aan. Houd je heat laag door te omkopen of te wachten. Schuld groeit 3% per dag!", icon: <Crosshair size={32} className="text-blood" /> },
  { title: "Aan de slag!", desc: "Verover alle 5 districten, versla de 3 factieleiders en verzamel €5.000.000 om Kingpin te worden.", icon: <Dices size={32} className="text-gold" /> },
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

          <div className="flex gap-2 mb-4">
            {STEPS.map((_, i) => (
              <div key={i} className={`flex-1 h-1 rounded-full ${i <= step ? 'bg-gold' : 'bg-muted'}`} />
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
