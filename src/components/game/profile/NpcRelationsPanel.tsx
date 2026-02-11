import { useGame } from '@/contexts/GameContext';
import { NPC_DEFS, getNpcTier } from '@/game/npcs';
import { NpcId } from '@/game/types';
import { NPC_IMAGES } from '@/assets/items';
import { SectionHeader } from '../ui/SectionHeader';
import { StatBar } from '../ui/StatBar';
import { motion } from 'framer-motion';
import { Users, Lock, Unlock, MessageCircle } from 'lucide-react';

function tierColor(min: number): string {
  if (min >= 80) return 'text-gold';
  if (min >= 50) return 'text-emerald';
  if (min >= 20) return 'text-ice';
  return 'text-muted-foreground';
}

function barColor(value: number): 'gold' | 'emerald' | 'blood' {
  if (value >= 60) return 'gold';
  if (value >= 30) return 'emerald';
  return 'blood';
}

export function NpcRelationsPanel() {
  const { state } = useGame();
  const relations = state.npcRelations;

  return (
    <>
      <SectionHeader title="NPC Relaties" icon={<Users size={12} />} />
      <div className="space-y-3 mb-4">
        {NPC_DEFS.map((npc, idx) => {
          const rel = relations?.[npc.id];
          const isMet = rel?.met ?? false;
          const value = rel?.value ?? 0;
          const currentTier = getNpcTier(state, npc.id);
          const daysSince = rel ? state.day - rel.lastInteractionDay : 0;

          return (
            <motion.div
              key={npc.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
              className={`game-card border-l-[3px] ${
                isMet
                  ? value >= 80 ? 'border-l-gold' : value >= 50 ? 'border-l-emerald' : 'border-l-ice'
                  : 'border-l-border opacity-60'
              }`}
            >
              {/* Header */}
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-9 h-9 rounded bg-muted flex items-center justify-center border border-border overflow-hidden shrink-0">
                  {NPC_IMAGES[npc.id] ? (
                    <img src={NPC_IMAGES[npc.id]} alt={npc.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg">{npc.icon}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-xs truncate">{npc.name}</h4>
                    {isMet
                      ? <Unlock size={9} className="text-emerald shrink-0" />
                      : <Lock size={9} className="text-muted-foreground shrink-0" />
                    }
                  </div>
                  <p className="text-[0.5rem] text-muted-foreground truncate">{npc.title}</p>
                </div>
                {isMet && currentTier && (
                  <span className={`text-[0.5rem] font-bold uppercase tracking-wider shrink-0 ${tierColor(currentTier.min)}`}>
                    {currentTier.label}
                  </span>
                )}
              </div>

              {isMet ? (
                <>
                  {/* Relationship bar */}
                  <div className="mb-2">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-[0.45rem] text-muted-foreground uppercase tracking-wider">Relatie</span>
                      <span className="text-[0.5rem] font-bold">{value}/100</span>
                    </div>
                    <StatBar value={value} max={100} color={barColor(value)} height="sm" />
                  </div>

                  {/* Current bonus */}
                  {currentTier && currentTier.bonus !== 'Geen' && (
                    <div className="bg-muted/40 rounded px-2 py-1 mb-2">
                      <span className="text-[0.45rem] text-muted-foreground">Actieve bonus: </span>
                      <span className="text-[0.5rem] font-semibold text-gold">{currentTier.bonus}</span>
                    </div>
                  )}

                  {/* Tier progression */}
                  <div className="flex gap-1 mb-1.5">
                    {npc.tiers.map((tier, i) => {
                      const isActive = value >= tier.min;
                      const isCurrent = currentTier?.min === tier.min;
                      return (
                        <div
                          key={i}
                          className={`flex-1 h-1 rounded-full transition-all ${
                            isCurrent ? 'bg-gold animate-pulse' :
                            isActive ? 'bg-gold/60' :
                            'bg-muted'
                          }`}
                          title={`${tier.label} (${tier.min}+)`}
                        />
                      );
                    })}
                  </div>

                  {/* Next tier hint */}
                  {(() => {
                    const nextTier = npc.tiers.find(t => t.min > value);
                    if (!nextTier) return (
                      <p className="text-[0.4rem] text-gold italic">✦ Maximale relatie bereikt</p>
                    );
                    return (
                      <p className="text-[0.4rem] text-muted-foreground">
                        Volgende: <span className="font-semibold text-foreground">{nextTier.label}</span> bij {nextTier.min}+ — {nextTier.bonus}
                      </p>
                    );
                  })()}

                  {/* Last interaction */}
                  <div className="flex items-center gap-1 mt-1.5">
                    <MessageCircle size={8} className="text-muted-foreground" />
                    <span className="text-[0.4rem] text-muted-foreground">
                      {daysSince === 0
                        ? 'Vandaag gesproken'
                        : daysSince === 1
                        ? 'Gisteren gesproken'
                        : `${daysSince} dagen geleden`
                      }
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-[0.5rem] text-muted-foreground italic">{npc.desc}</p>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="game-card bg-muted/20">
        <p className="text-[0.45rem] text-muted-foreground mb-1 font-semibold uppercase tracking-wider">Hoe relaties werken</p>
        <p className="text-[0.4rem] text-muted-foreground leading-relaxed">
          Ontmoet NPC's door hun district te bezoeken. Relaties groeien door interacties, verhaalkeuzes en dagelijkse ontmoetingen. 
          Hogere relaties ontgrendelen passieve bonussen en unieke dialoogopties.
        </p>
      </div>
    </>
  );
}
