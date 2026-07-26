import { useGame } from '@/contexts/GameContext';
import { SectionHeader } from '../ui/SectionHeader';
import { InfoRow } from '../ui/InfoRow';
import { StatBar } from '../ui/StatBar';
import { TrendingUp, Flame, Coins, Users, Radio, Hand } from 'lucide-react';
import { dailyHeatFlow, heatBand } from '@/game/heat';
import { resolveRacketTick } from '@/game/rackets';
import { orgDailyUpkeep } from '@/game/organization';
import { autoFenceActive, autoFenceIncome } from '@/game/tradeNetwork';
import { tapPower, crewWorkPerSecond } from '@/game/score';
import type { DistrictId } from '@/game/types';

/**
 * WAAR JE GELD EN JE HITTE VANDAAN KOMEN.
 *
 * This panel used to summarise a game that no longer exists: district income hardcoded
 * to zero, front-business income and laundering capacity from businesses you cannot
 * buy, a vehicle-heat bar for vehicles that are retired, an "active bonuses" list
 * crediting villa modules and Hacker/Smokkelaar crew roles, and a heat-decay figure
 * computed locally — with the Hacker check written twice — that did not match what the
 * tick actually applied.
 *
 * Everything below now reads the same functions the tick reads, so the numbers on this
 * screen are the numbers the game runs on.
 */
export function StatsOverviewPanel() {
  const { state } = useGame();

  const tick = resolveRacketTick(state.org);
  const upkeep = state.org ? orgDailyUpkeep(state.org) : 0;
  const fence = autoFenceActive(state) ? autoFenceIncome(state) : 0;
  const net = tick.money + fence - upkeep;

  const flow = dailyHeatFlow(state);
  const personalHeat = Math.round(state.personalHeat ?? 0);
  const band = heatBand(personalHeat);

  const power = tapPower(state);
  const districts: DistrictId[] = ['low', 'port', 'iron', 'neon', 'crown'] as DistrictId[];
  const perSec = districts.reduce((sum, d) => sum + crewWorkPerSecond(state, d), 0);

  return (
    <div>
      <SectionHeader title="Per dag" icon={<TrendingUp size={12} />} />
      <div className="game-card mb-4">
        <div className="grid grid-cols-2 gap-2">
          <InfoRow icon={<Users size={10} />} label="Rackets" value={`€${tick.money.toLocaleString()}/dag`} valueClass="text-emerald" />
          <InfoRow icon={<Radio size={10} />} label="Fence" value={fence > 0 ? `€${fence.toLocaleString()}/dag` : '—'} valueClass={fence > 0 ? 'text-emerald' : 'text-muted-foreground'} />
          <InfoRow icon={<Coins size={10} />} label="Crewloon" value={`−€${upkeep.toLocaleString()}/dag`} valueClass="text-blood" />
          <InfoRow icon={<TrendingUp size={10} />} label="Netto" value={`€${net.toLocaleString()}/dag`} valueClass={net >= 0 ? 'text-gold' : 'text-blood'} />
          <InfoRow icon={<Coins size={10} />} label="Zwart geld" value={`€${Math.round(state.dirtyMoney || 0).toLocaleString()}`} valueClass="text-dirty" />
          <InfoRow icon={<Users size={10} />} label="Aan het werk" value={`${tick.activeCount}/${state.org?.members.length || 0}`} />
        </div>
      </div>

      <SectionHeader title="Je eigen handen" icon={<Hand size={12} />} />
      <div className="game-card mb-4">
        <div className="grid grid-cols-2 gap-2">
          <InfoRow icon={<Hand size={10} />} label="Per tik" value={`+${power}`} valueClass="text-gold" />
          <InfoRow icon={<Users size={10} />} label="Crew helpt" value={`${perSec.toFixed(1)}/sec`} valueClass="text-emerald" />
        </div>
      </div>

      <SectionHeader title="Hitte" icon={<Flame size={12} />} />
      <div className="game-card mb-4 space-y-2.5">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">{band.label}</span>
            <span className="font-bold">
              {personalHeat}/100{' '}
              <span className={`text-[0.5rem] ${flow.net > 0 ? 'text-blood' : 'text-emerald'}`}>
                ({flow.net > 0 ? '+' : ''}{flow.net}/dag)
              </span>
            </span>
          </div>
          <StatBar value={personalHeat} max={100} color="blood" height="sm" />
          <p className="text-[0.45rem] text-muted-foreground mt-1">{band.desc}</p>
        </div>
        <div className="border-t border-border/50 pt-2 space-y-1">
          {flow.rackets > 0 && <FlowRow label="Rackets" value={flow.rackets} />}
          {flow.fence > 0 && <FlowRow label="Fence" value={flow.fence} />}
          <FlowRow label="De straat vergeet" value={-flow.decay} />
          {flow.shield > 0 && <FlowRow label="Uitrusting dekt af" value={-flow.shield} />}
        </div>
      </div>
    </div>
  );
}

function FlowRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between text-[0.5rem]">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-mono font-bold ${value > 0 ? 'text-blood' : 'text-emerald'}`}>
        {value > 0 ? '+' : ''}{value}
      </span>
    </div>
  );
}
