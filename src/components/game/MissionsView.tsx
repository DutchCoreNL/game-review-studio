import { useGame } from '@/contexts/GameContext';
import { SOLO_OPERATIONS, FAMILIES } from '@/game/constants';
import { performSoloOp } from '@/game/engine';
import { motion } from 'framer-motion';
import { Crosshair, Users, UserPlus, Lock } from 'lucide-react';

export function MissionsView() {
  const { state, dispatch, showToast } = useGame();

  return (
    <div>
      {/* Solo Operations */}
      <SectionHeader title="Solo Operaties" />
      <p className="text-[0.65rem] text-muted-foreground mb-3">
        Voer zelf acties uit. Hoog risico, maar geen crew nodig.
      </p>

      <div className="space-y-2 mb-4">
        {SOLO_OPERATIONS.map(op => {
          const locked = state.player.level < op.level;
          return (
            <motion.div
              key={op.id}
              className={`game-card border-l-[3px] ${locked ? 'opacity-40 border-l-border' : 'border-l-gold'}`}
              style={{ background: locked ? undefined : 'linear-gradient(90deg, hsl(0 0% 7%) 0%, hsl(0 0% 4%) 100%)' }}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-xs">{op.name}</h4>
                    {locked && <Lock size={10} className="text-muted-foreground" />}
                  </div>
                  <p className="text-[0.55rem] text-muted-foreground">{op.desc}</p>
                  <div className="flex gap-2 mt-1">
                    <span className="text-[0.5rem] text-blood">Risico: {op.risk}%</span>
                    <span className="text-[0.5rem] text-gold">+€{op.reward}</span>
                    <span className="text-[0.5rem] text-muted-foreground">Heat +{op.heat}</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    dispatch({ type: 'SOLO_OP', opId: op.id });
                    showToast(state.player.level >= op.level ? 'Operatie uitgevoerd!' : 'Level te laag');
                  }}
                  disabled={locked}
                  className="px-3 py-1.5 rounded text-[0.6rem] font-bold bg-[hsl(var(--gold)/0.1)] border border-gold text-gold disabled:opacity-30"
                >
                  <Crosshair size={12} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Crew */}
      <SectionHeader title="Mijn Crew" />
      <div className="bg-muted/50 rounded p-2.5 mb-3 text-[0.6rem] text-muted-foreground">
        <span className="text-gold font-bold">ROLLEN:</span><br/>
        • <b>Hacker:</b> Verlaagt Heat sneller + Stun in combat<br/>
        • <b>Enforcer:</b> Doet meer schade (Berserk)<br/>
        • <b>Chauffeur:</b> Gratis reizen tussen districten<br/>
        • <b>Smokkelaar:</b> +5 Bagageruimte + Rookbom
      </div>

      <div className="space-y-2 mb-3">
        {state.crew.map((c, i) => (
          <div key={i} className="game-card flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                <Users size={14} className="text-gold" />
              </div>
              <div>
                <h4 className="font-bold text-xs">{c.name} <span className="text-muted-foreground font-normal">({c.role})</span></h4>
                <div className="flex gap-2 text-[0.5rem] text-muted-foreground">
                  <span>Lvl {c.level}</span>
                  <span className={c.hp < 50 ? 'text-blood' : 'text-emerald'}>HP: {c.hp}/100</span>
                </div>
              </div>
            </div>
            {c.hp < 100 && (
              <span className="text-[0.5rem] text-blood font-semibold">GEWOND</span>
            )}
          </div>
        ))}
        {state.crew.length === 0 && (
          <p className="text-muted-foreground text-xs italic py-3">Geen crew. Huur specialisten!</p>
        )}
      </div>

      <button
        onClick={() => {
          dispatch({ type: 'RECRUIT' });
        }}
        disabled={state.crew.length >= 6 || state.money < 2500}
        className="w-full py-2.5 rounded text-xs font-bold bg-[hsl(var(--gold)/0.1)] border border-gold text-gold disabled:opacity-30 flex items-center justify-center gap-1.5"
      >
        <UserPlus size={14} /> HUUR SPECIALIST (€2.500)
      </button>

      {/* Contracts */}
      <SectionHeader title="Dagelijkse Contracten" />
      <p className="text-[0.6rem] text-muted-foreground mb-3">Contracten veranderen elke nacht.</p>

      <div className="space-y-2">
        {state.activeContracts.map(c => (
          <div key={c.id} className="game-card">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-xs">{c.name}</h4>
                <p className="text-[0.55rem] text-muted-foreground">
                  Door: <span style={{ color: FAMILIES[c.employer]?.color }}>{FAMILIES[c.employer]?.name}</span>
                  {' vs '}
                  <span style={{ color: FAMILIES[c.target]?.color }}>{FAMILIES[c.target]?.name}</span>
                </p>
                <div className="flex gap-2 mt-1">
                  <span className="text-[0.5rem] text-blood">Risico: {c.risk}%</span>
                  <span className="text-[0.5rem] text-gold">+€{c.reward.toLocaleString()}</span>
                  <span className="text-[0.5rem] text-muted-foreground">+{c.xp} XP</span>
                </div>
              </div>
            </div>
            {state.crew.length > 0 ? (
              <div className="flex gap-2 mt-2 flex-wrap">
                {state.crew.map((cr, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      showToast(`${cr.name} stuurt op ${c.name}...`);
                      // Simplified - in full version this would start combat
                    }}
                    className="px-2 py-1 rounded text-[0.55rem] font-semibold bg-muted border border-border text-foreground hover:border-gold"
                  >
                    {cr.name}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-[0.55rem] text-muted-foreground mt-2 italic">Huur crew om contracten aan te nemen</p>
            )}
          </div>
        ))}
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
