import { useGame } from '@/contexts/GameContext';
import { FAMILIES, HQ_UPGRADES } from '@/game/constants';
import { getPlayerStat } from '@/game/engine';
import { motion } from 'framer-motion';

export function FamiliesView() {
  const { state, dispatch, showToast } = useGame();

  const charmStat = getPlayerStat(state, 'charm');
  const bribeCost = Math.max(1000, 3500 - (charmStat * 150));

  return (
    <div>
      <SectionHeader title="Onderwereld & Facties" />
      <p className="text-[0.65rem] text-muted-foreground mb-3">
        Relatie {'>'} 50: Korting op markt & exclusieve gear. Relatie {'<'} -20: Vijanden vallen aan.
      </p>

      <div className="space-y-2 mb-4">
        {Object.entries(FAMILIES).map(([id, fam]) => {
          const rel = state.familyRel[id] || 0;
          const dead = state.leadersDefeated.includes(id as any);
          const relPct = Math.max(0, Math.min(100, rel + 50));

          return (
            <motion.div
              key={id}
              className="game-card"
              style={{ borderLeft: `3px solid ${dead ? '#444' : fam.color}`, opacity: dead ? 0.6 : 1 }}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: dead ? 0.6 : 1, x: 0 }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-xs">{fam.name}</h4>
                    <span
                      className="text-[0.5rem] px-1.5 py-0.5 rounded uppercase font-bold"
                      style={{ backgroundColor: fam.color + '30', color: fam.color }}
                    >
                      {id.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[0.6rem] text-muted-foreground mt-0.5">{fam.contact} | {fam.desc}</p>
                </div>
                <div className="text-right">
                  <span className="text-[0.65rem] font-bold">
                    {dead ? 'LEIDER DOOD' : `${rel}/100`}
                  </span>
                </div>
              </div>

              {!dead && (
                <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${relPct}%`,
                      backgroundColor: rel > 0 ? fam.color : 'hsl(var(--blood))'
                    }}
                  />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* HQ Upgrades */}
      <SectionHeader title="HQ Upgrades" />
      <div className="space-y-2 mb-4">
        {HQ_UPGRADES.map(u => {
          const owned = state.hqUpgrades.includes(u.id);
          return (
            <div key={u.id} className="game-card flex justify-between items-center">
              <div>
                <h4 className="font-bold text-xs">{u.name}</h4>
                <p className="text-[0.55rem] text-muted-foreground">{u.desc}</p>
              </div>
              <button
                onClick={() => {
                  dispatch({ type: 'BUY_UPGRADE', id: u.id });
                  showToast(`${u.name} geïnstalleerd!`);
                }}
                disabled={owned || state.money < u.cost}
                className={`px-3 py-1.5 rounded text-[0.6rem] font-bold ${
                  owned ? 'bg-muted text-muted-foreground' : 'bg-[hsl(var(--gold)/0.1)] border border-gold text-gold disabled:opacity-30'
                }`}
              >
                {owned ? 'BEZIT' : `€${u.cost.toLocaleString()}`}
              </button>
            </div>
          );
        })}
      </div>

      {/* Police */}
      <SectionHeader title="Corruptie" />
      <div className="game-card border-l-[3px] border-l-police">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="font-bold text-xs">Politie Omkopen</h4>
            <p className="text-[0.6rem] text-muted-foreground">Relatie: {state.policeRel}/100</p>
          </div>
          <button
            onClick={() => {
              dispatch({ type: 'BRIBE_POLICE' });
              showToast('Politie omgekocht! Heat -15');
            }}
            className="px-3 py-1.5 rounded text-[0.6rem] font-bold bg-muted border border-border text-foreground"
          >
            KOOP OM (€{bribeCost.toLocaleString()})
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 mt-5 mb-3 pb-1 border-b border-border">
      <span className="text-gold text-[0.65rem] uppercase tracking-widest font-bold">{title}</span>
    </div>
  );
}
