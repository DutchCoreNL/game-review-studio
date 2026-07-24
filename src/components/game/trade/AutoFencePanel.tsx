import { useGame } from '@/contexts/GameContext';
import {
  AUTO_FENCE_COST, autoFenceOwned, autoFenceActive, autoFenceIncome, marketSpreadPct,
} from '@/game/tradeNetwork';
import { GameButton } from '../ui/GameButton';
import { Radio, Power, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * The idle face of the market: buy the auto-fence once and it skims contraband
 * profit from the live district spreads every tick, hands-off, at the cost of a
 * little heat. Pause it when things get hot.
 */
export function AutoFencePanel() {
  const { state, dispatch, showToast } = useGame();
  const owned = autoFenceOwned(state);
  const active = autoFenceActive(state);
  const income = autoFenceIncome(state);
  const spread = Math.round(marketSpreadPct(state) * 100);

  if (!owned) {
    return (
      <div className="game-card border-l-[3px] border-l-emerald mb-3">
        <div className="flex items-start gap-2.5">
          <Radio size={16} className="text-emerald mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-xs">Auto-Fence opzetten</h4>
            <p className="text-[0.55rem] text-muted-foreground leading-snug mt-0.5">
              Zet een smokkelnetwerk op dat de markt vóór je afspeelt: elke dag koopt en
              verkoopt het vanzelf over de districten en int de winst. Kost een beetje hitte.
            </p>
          </div>
          <GameButton variant="emerald" size="sm" disabled={state.money < AUTO_FENCE_COST}
            onClick={() => { dispatch({ type: 'BUY_AUTO_FENCE' }); showToast('Auto-fence opgezet!'); }}>
            €{(AUTO_FENCE_COST / 1000).toFixed(0)}k
          </GameButton>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
      className={`game-card mb-3 border-l-[3px] ${active ? 'border-l-emerald' : 'border-l-muted-foreground'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <Radio size={15} className={active ? 'text-emerald' : 'text-muted-foreground'} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className="font-bold text-xs">Auto-Fence</h4>
              <span className={`text-[0.45rem] font-bold px-1.5 py-0.5 rounded-full ${active ? 'bg-emerald/15 text-emerald' : 'bg-muted text-muted-foreground'}`}>
                {active ? 'ACTIEF' : 'GEPAUZEERD'}
              </span>
            </div>
            <p className="text-[0.5rem] text-muted-foreground mt-0.5 flex items-center gap-1">
              <TrendingUp size={9} className="text-emerald" />
              {active ? <>~€{income.toLocaleString()}/dag · marktspread {spread}%</> : <>Gepauzeerd · marktspread {spread}%</>}
            </p>
          </div>
        </div>
        <GameButton variant={active ? 'muted' : 'emerald'} size="sm"
          onClick={() => { dispatch({ type: 'TOGGLE_AUTO_FENCE' }); showToast(active ? 'Auto-fence gepauzeerd.' : 'Auto-fence hervat.'); }}>
          <Power size={12} /> {active ? 'Pauze' : 'Hervat'}
        </GameButton>
      </div>
    </motion.div>
  );
}
