import { useGame } from '@/contexts/GameContext';
import { ACHIEVEMENTS } from '@/game/constants';
import { ACHIEVEMENT_IMAGES } from '@/assets/items';
import { ENDGAME_PHASES, getPhaseIndex } from '@/game/endgame';
import { getRankTitle } from '@/game/engine';
import { SectionHeader } from '../ui/SectionHeader';
import { ViewWrapper } from '../ui/ViewWrapper';
import { Trophy, Crown } from 'lucide-react';
import profileBg from '@/assets/profile-bg.jpg';

export function TrophiesPanel() {
  const { state } = useGame();
  const rank = getRankTitle(state.rep);

  return (
    <ViewWrapper bg={profileBg}>
      {/* Progression Timeline */}
      <SectionHeader title="Progressie" icon={<Crown size={12} />} />
      <div className="game-card mb-4">
        <div className="space-y-2">
          {ENDGAME_PHASES.map((phase, i) => {
            const currentIdx = getPhaseIndex(state.endgamePhase);
            const isCompleted = i <= currentIdx;
            const isCurrent = i === currentIdx;
            return (
              <div key={phase.id} className={`flex items-center gap-2 text-xs rounded p-1.5 ${
                isCurrent ? 'bg-gold/10 border border-gold' : isCompleted ? 'opacity-70' : 'opacity-30'
              }`}>
                <span className="text-base">{phase.icon}</span>
                <div className="flex-1">
                  <span className={`font-bold ${isCurrent ? 'text-gold' : isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {phase.label}
                  </span>
                  <p className="text-[0.45rem] text-muted-foreground">{phase.desc}</p>
                </div>
                {isCompleted && <span className="text-emerald text-xs font-bold">✓</span>}
              </div>
            );
          })}
        </div>
      </div>

      <SectionHeader title={`Achievements (${state.achievements.length}/${ACHIEVEMENTS.length})`} icon={<Trophy size={12} />} />
      <div className="grid grid-cols-1 gap-2 mb-4">
        {ACHIEVEMENTS.map(a => {
          const unlocked = state.achievements.includes(a.id);
          const prog = !unlocked && a.progress ? a.progress(state) : null;
          const pct = prog ? Math.floor((prog.current / prog.target) * 100) : (unlocked ? 100 : 0);
          const imgSrc = ACHIEVEMENT_IMAGES[a.id];
          return (
            <div key={a.id} className={`game-card flex items-center gap-2.5 ${unlocked ? 'border-gold/60' : 'border-border'}`}>
              <div className={`w-10 h-10 rounded-full overflow-hidden border-2 flex-shrink-0 ${unlocked ? 'border-gold' : 'border-muted'}`}>
                {imgSrc ? (
                  <img src={imgSrc} alt={a.name} className={`w-full h-full object-cover ${unlocked ? '' : 'grayscale opacity-50'}`} />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center ${unlocked ? 'bg-gold/15' : 'bg-muted'}`}>
                    <Trophy size={14} className={unlocked ? 'text-gold' : 'text-muted-foreground'} />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`text-[0.6rem] font-bold truncate ${unlocked ? 'text-gold' : ''}`}>{a.name}</span>
                  {unlocked && <span className="text-[0.45rem] text-gold">✓</span>}
                </div>
                <div className="text-[0.45rem] text-muted-foreground truncate">{a.desc}</div>
                {!unlocked && prog && (
                  <div className="mt-1 flex items-center gap-1.5">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-gold/60 rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[0.4rem] text-muted-foreground font-bold whitespace-nowrap">
                      {prog.target >= 10000 ? `€${(prog.current / 1000).toFixed(0)}k/€${(prog.target / 1000).toFixed(0)}k` : `${prog.current}/${prog.target}`}
                    </span>
                  </div>
                )}
                {unlocked && (
                  <div className="mt-0.5">
                    <div className="h-1.5 bg-gold/20 rounded-full overflow-hidden">
                      <div className="h-full bg-gold rounded-full w-full" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <SectionHeader title="Reputatie Rang" />
      <div className="space-y-1.5 mb-4">
        {[
          { title: 'STRAATRAT', min: 0 }, { title: 'ASSOCIATE', min: 50 }, { title: 'SOLDAAT', min: 200 },
          { title: 'CAPO', min: 500 }, { title: 'UNDERBOSS', min: 1000 }, { title: 'CRIME LORD', min: 2000 },
          { title: 'KINGPIN', min: 5000 },
        ].map(r => (
          <div key={r.title} className={`flex justify-between items-center text-xs px-2 py-1 rounded ${
            r.title === rank ? 'bg-gold/10 border border-gold text-gold font-bold' :
            state.rep >= r.min ? 'text-foreground' : 'text-muted-foreground opacity-50'
          }`}>
            <span>{r.title}</span>
            <span>{r.min}+ REP</span>
          </div>
        ))}
      </div>
    </ViewWrapper>
  );
}
