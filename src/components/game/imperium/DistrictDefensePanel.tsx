import { useGame } from '@/contexts/GameContext';
import { DISTRICTS, DISTRICT_HQ_UPGRADES, FAMILIES } from '@/game/constants';
import { getDistrictDefenseLevel, hasCommandCenter } from '@/game/newFeatures';
import { DistrictId, FamilyId, DistrictHQUpgradeId } from '@/game/types';
import { SectionHeader } from '../ui/SectionHeader';
import { GameButton } from '../ui/GameButton';
import { StatBar } from '../ui/StatBar';
import { GameBadge } from '../ui/GameBadge';
import { Shield, Swords, Eye, Bomb, Handshake } from 'lucide-react';

export function DistrictDefensePanel() {
  const { state, dispatch, showToast } = useGame();

  // MMO: use all districts with defenses instead of ownedDistricts
  const activeDistricts = (['port', 'crown', 'iron', 'low', 'neon'] as DistrictId[]).filter(d => state.districtDefenses[d]);
  
  if (activeDistricts.length === 0) {
    return (
      <div className="game-card text-center py-6">
        <Shield size={24} className="mx-auto text-muted-foreground mb-2" />
        <p className="text-[0.6rem] text-muted-foreground">Bouw verdedigingen via gang influence om je territoria te beschermen.</p>
      </div>
    );
  }

  const hasCommand = activeDistricts.some(d => hasCommandCenter(state, d));
  const otherDistricts = (['port', 'crown', 'iron', 'low', 'neon'] as DistrictId[]).filter(d => !activeDistricts.includes(d));

  return (
    <div>
      {/* District Defenses */}
      <SectionHeader title="District HQ Verdediging" icon={<Shield size={12} />} />
      <div className="space-y-3 mb-4">
        {activeDistricts.map(distId => {
          const def = state.districtDefenses[distId];
          if (!def) return null;
          const defLevel = getDistrictDefenseLevel(state, distId);
          const district = DISTRICTS[distId];

          return (
            <div key={distId} className="game-card border-l-[3px] border-l-ice">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="font-bold text-xs">{district.name}</h4>
                  <p className="text-[0.5rem] text-muted-foreground">{def.upgrades.length}/{DISTRICT_HQ_UPGRADES.length} upgrades</p>
                </div>
                <span className="text-sm font-black text-ice">{defLevel}</span>
              </div>
              <StatBar value={Math.min(defLevel, 120)} max={120} color="ice" height="sm" showLabel label="Verdediging" />

              {/* Installed upgrades */}
              {def.upgrades.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {def.upgrades.map(uid => {
                    const u = DISTRICT_HQ_UPGRADES.find(u => u.id === uid);
                    return u ? <GameBadge key={uid} variant="muted" size="xs">{u.icon} {u.name}</GameBadge> : null;
                  })}
                </div>
              )}

              {/* Available upgrades */}
              {DISTRICT_HQ_UPGRADES.filter(u => !def.upgrades.includes(u.id)).length > 0 && (
                <div className="mt-2 space-y-1">
                  {DISTRICT_HQ_UPGRADES.filter(u => !def.upgrades.includes(u.id)).map(u => (
                    <div key={u.id} className="flex items-center justify-between bg-muted/30 rounded p-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{u.icon}</span>
                        <div>
                          <span className="text-[0.55rem] font-bold">{u.name}</span>
                          <p className="text-[0.4rem] text-muted-foreground">{u.desc}</p>
                        </div>
                      </div>
                      <GameButton variant="gold" size="sm" disabled={state.money < u.cost}
                        onClick={() => { dispatch({ type: 'BUY_DISTRICT_UPGRADE', districtId: distId, upgradeId: u.id }); showToast(`${u.name} geïnstalleerd in ${district.name}!`); }}>
                        €{u.cost.toLocaleString()}
                      </GameButton>
                    </div>
                  ))}
                </div>
              )}

              {/* Alliance help */}
              {(() => {
                const localFaction = Object.values(FAMILIES).find(f => f.home === distId);
                if (!localFaction) return null;
                const rel = state.familyRel[localFaction.id] || 0;
                const cooldown = state.allianceCooldowns?.[localFaction.id] || 0;
                const canAsk = rel >= 60 && cooldown <= state.day;
                return (
                  <div className="mt-2 pt-2 border-t border-border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Handshake size={10} className={canAsk ? 'text-emerald' : 'text-muted-foreground'} />
                        <span className="text-[0.5rem] text-muted-foreground">
                          {localFaction.name} ({rel}/100)
                        </span>
                      </div>
                      <GameButton variant="muted" size="sm" disabled={!canAsk}
                        onClick={() => { dispatch({ type: 'REQUEST_ALLIANCE_HELP', familyId: localFaction.id as FamilyId, districtId: distId }); showToast(`${localFaction.name} stuurt versterking! +25 verdediging`); }}>
                        {cooldown > state.day ? `CD ${cooldown - state.day}d` : rel < 60 ? `Rel ≥60` : 'HULP (-10 rel)'}
                      </GameButton>
                    </div>
                  </div>
                );
              })()}
            </div>
          );
        })}
      </div>

      {/* Spionage & Sabotage */}
      {hasCommand && otherDistricts.length > 0 && (
        <>
          <SectionHeader title="Spionage & Sabotage" icon={<Eye size={12} />} />
          <p className="text-[0.5rem] text-muted-foreground mb-2">Commandocentrum vereist. Verken vijandelijke districten.</p>
          <div className="space-y-2 mb-4">
            {otherDistricts.map(distId => {
              const district = DISTRICTS[distId];
              const intel = state.spionageIntel?.find(i => i.district === distId);
              const sabotage = state.sabotageEffects?.find(e => e.district === distId);

              return (
                <div key={distId} className="game-card flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs">{district.name}</h4>
                    {intel && (
                      <p className="text-[0.45rem] text-gold">📊 Aanvalskans: {intel.attackChance}% (nog {intel.expiresDay - state.day}d)</p>
                    )}
                    {sabotage && (
                      <p className="text-[0.45rem] text-blood">💣 Gesaboteerd: -{sabotage.reductionPercent}% (nog {sabotage.expiresDay - state.day}d)</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <GameButton variant="muted" size="sm" disabled={state.money < 2000 || !!intel}
                      onClick={() => { dispatch({ type: 'PERFORM_SPIONAGE', districtId: distId }); showToast(`Intel verzameld over ${district.name}`); }}>
                      <Eye size={10} /> €2k
                    </GameButton>
                    <GameButton variant="blood" size="sm" disabled={state.money < 5000 || !!sabotage}
                      onClick={() => { dispatch({ type: 'PERFORM_SABOTAGE', districtId: distId }); showToast(`${district.name} gesaboteerd!`); }}>
                      <Bomb size={10} /> €5k
                    </GameButton>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {!hasCommand && (
        <div className="game-card bg-muted/30 text-center py-3">
          <Eye size={16} className="mx-auto text-muted-foreground mb-1" />
          <p className="text-[0.5rem] text-muted-foreground">Bouw een Commandocentrum in een district voor spionage & sabotage.</p>
        </div>
      )}
    </div>
  );
}
