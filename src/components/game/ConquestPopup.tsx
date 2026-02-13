import { useGame } from '@/contexts/GameContext';
import { FAMILIES, DISTRICTS, BOSS_DATA } from '@/game/constants';
import { motion, AnimatePresence } from 'framer-motion';
import { Flag, Crown, Banknote, Percent, Shield } from 'lucide-react';
import warBg from '@/assets/items/event-war.jpg';

export function ConquestPopup() {
  const { state, dispatch, showToast } = useGame();
  const familyId = state.pendingConquestPopup;
  if (!familyId) return null;

  const fam = FAMILIES[familyId];
  const boss = BOSS_DATA[familyId];

  const handleAccept = () => {
    dispatch({ type: 'ACCEPT_CONQUEST_POPUP' });
    showToast(`${fam.name} is nu jouw vazal! 👑`);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="game-card border-2 border-gold w-full max-w-md overflow-hidden"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 20 }}
        >
          {/* Banner */}
          <div className="relative h-28 overflow-hidden">
            <img src={warBg} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
            <div className="absolute bottom-2 left-4 flex items-center gap-2">
              <Crown size={20} className="text-gold" />
              <div>
                <h2 className="font-black text-sm text-gold uppercase tracking-wider">👑 Factie Veroverd!</h2>
                <p className="text-[0.55rem] text-muted-foreground">{boss?.name} is verslagen — {fam.name} is weerloos.</p>
              </div>
            </div>
          </div>

          <div className="p-4">
            <p className="text-xs text-muted-foreground mb-4">
              Met de leider uitgeschakeld ligt {fam.name} aan jouw voeten. 
              Neem ze over als vazal en profiteer van hun middelen.
            </p>

            {/* Benefits preview */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="bg-gold/10 border border-gold/30 rounded p-2 text-center">
                <Banknote size={14} className="mx-auto text-gold mb-0.5" />
                <p className="text-xs font-bold">+€1.000/dag</p>
                <p className="text-[0.4rem] text-muted-foreground">passief inkomen</p>
              </div>
              <div className="bg-emerald/10 border border-emerald/30 rounded p-2 text-center">
                <Percent size={14} className="mx-auto text-emerald mb-0.5" />
                <p className="text-xs font-bold">-30% prijzen</p>
                <p className="text-[0.4rem] text-muted-foreground">marktkorting</p>
              </div>
              <div className="bg-ice/10 border border-ice/30 rounded p-2 text-center">
                <Shield size={14} className="mx-auto text-ice mb-0.5" />
                <p className="text-xs font-bold">Bescherming</p>
                <p className="text-[0.4rem] text-muted-foreground">geen aanvallen</p>
              </div>
              <div className="bg-blood/10 border border-blood/30 rounded p-2 text-center">
                <Flag size={14} className="mx-auto text-blood mb-0.5" />
                <p className="text-xs font-bold">{DISTRICTS[fam.home].name}</p>
                <p className="text-[0.4rem] text-muted-foreground">thuisdistrict</p>
              </div>
            </div>

            <motion.button
              onClick={handleAccept}
              className="w-full py-3 rounded text-sm font-black bg-gold text-secondary-foreground uppercase tracking-wider"
              whileTap={{ scale: 0.95 }}
            >
              <Flag size={14} className="inline mr-2" />
              NEEM OVER ALS VAZAL
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
