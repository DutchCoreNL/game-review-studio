import { useGame } from '@/contexts/GameContext';
import { getPlayerStat } from '@/game/engine';
import { GEAR, ACHIEVEMENTS } from '@/game/constants';
import { StatId } from '@/game/types';
import { motion } from 'framer-motion';
import { Swords, Brain, Gem, Sword, Shield, Smartphone, Trophy, BarChart3, Target, Coins, Dices, Calendar } from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';
import { useState } from 'react';

const STAT_INFO: { id: StatId; label: string; icon: React.ReactNode }[] = [
  { id: 'muscle', label: 'Kracht', icon: <Swords size={14} /> },
  { id: 'brains', label: 'Vernuft', icon: <Brain size={14} /> },
  { id: 'charm', label: 'Charisma', icon: <Gem size={14} /> },
];

const SLOT_ICONS: Record<string, React.ReactNode> = {
  weapon: <Sword size={20} />,
  armor: <Shield size={20} />,
  gadget: <Smartphone size={20} />,
};

export function ProfileView() {
  const { state, dispatch, showToast } = useGame();
  const [confirmReset, setConfirmReset] = useState(false);
  const xpPct = Math.min(100, (state.player.xp / state.player.nextXp) * 100);
  const stats = state.stats;

  return (
    <div>
      <SectionHeader title="Boss Profiel" />

      {/* Player Card */}
      <div className="game-card border-l-[3px] border-l-gold mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-muted rounded-full flex items-center justify-center border border-gold">
            <span className="text-lg">👤</span>
          </div>
          <div>
            <h3 className="font-bold text-sm">The Boss</h3>
            <p className="text-[0.65rem] text-muted-foreground">
              Level {state.player.level} | Skill Points: <span className="text-gold font-bold">{state.player.skillPoints}</span>
            </p>
          </div>
        </div>
        <div className="mt-3 relative h-2 bg-muted rounded-full overflow-hidden">
          <motion.div className="h-full bg-blood rounded-full" initial={{ width: 0 }} animate={{ width: `${xpPct}%` }} transition={{ duration: 0.5 }} />
        </div>
        <div className="text-right text-[0.55rem] text-muted-foreground mt-1">XP: {state.player.xp} / {state.player.nextXp}</div>
      </div>

      {/* Stats */}
      <SectionHeader title="Eigenschappen" />
      <div className="game-card mb-4 space-y-3">
        {STAT_INFO.map(s => {
          const base = state.player.stats[s.id];
          const total = getPlayerStat(state, s.id);
          const bonus = total - base;
          return (
            <div key={s.id} className="flex items-center gap-2 text-xs">
              <div className="w-16 flex items-center gap-1.5 text-muted-foreground">{s.icon}<span>{s.label}</span></div>
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div className="h-full bg-gold rounded-full" animate={{ width: `${Math.min(100, (total / 15) * 100)}%` }} />
              </div>
              <span className="font-bold w-10 text-right">{base}{bonus > 0 && <span className="text-gold">+{bonus}</span>}</span>
              {state.player.skillPoints > 0 && (
                <button onClick={() => { dispatch({ type: 'UPGRADE_STAT', stat: s.id }); showToast(`${s.label} verhoogd!`); }}
                  className="w-5 h-5 rounded bg-muted border border-gold text-gold text-xs flex items-center justify-center hover:bg-[hsl(var(--gold)/0.1)]">+</button>
              )}
            </div>
          );
        })}
      </div>

      {/* Loadout */}
      <SectionHeader title="Loadout" />
      <div className="grid grid-cols-3 gap-2 mb-4">
        {(['weapon', 'armor', 'gadget'] as const).map(slot => {
          const gearId = state.player.loadout[slot];
          const item = gearId ? GEAR.find(g => g.id === gearId) : null;
          return (
            <motion.button key={slot} onClick={() => { if (gearId) { dispatch({ type: 'UNEQUIP', slot }); showToast('Item uitgedaan'); } }}
              className={`aspect-square rounded-lg flex flex-col items-center justify-center text-center p-2 transition-all ${item ? 'border border-gold bg-[hsl(var(--gold)/0.05)] text-foreground' : 'border border-dashed border-border bg-muted/30 text-muted-foreground'}`}
              whileTap={{ scale: 0.95 }}>
              {SLOT_ICONS[slot]}
              <span className="text-[0.5rem] mt-1 uppercase tracking-wider font-semibold">{item ? item.name : slot}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Inventory */}
      <SectionHeader title="Kluis" />
      <div className="space-y-2 mb-4">
        {state.ownedGear.filter(id => !Object.values(state.player.loadout).includes(id)).map(id => {
          const item = GEAR.find(g => g.id === id);
          if (!item) return null;
          return (
            <div key={id} className="game-card flex justify-between items-center">
              <div><h4 className="font-bold text-xs">{item.name}</h4><p className="text-[0.6rem] text-muted-foreground">{item.desc}</p></div>
              <button onClick={() => { dispatch({ type: 'EQUIP', id }); showToast(`${item.name} uitgerust`); }}
                className="px-3 py-1.5 rounded text-[0.65rem] font-bold bg-[hsl(var(--gold)/0.1)] border border-gold text-gold">DRAAG</button>
            </div>
          );
        })}
        {state.ownedGear.filter(id => !Object.values(state.player.loadout).includes(id)).length === 0 && (
          <p className="text-muted-foreground text-xs italic py-3">Kluis is leeg. Koop gear op de Zwarte Markt.</p>
        )}
      </div>

      {/* Statistics */}
      <SectionHeader title="Statistieken" />
      <div className="game-card mb-4">
        <div className="grid grid-cols-2 gap-2">
          <StatRow icon={<Coins size={12} />} label="Totaal Verdiend" value={`€${stats.totalEarned.toLocaleString()}`} color="text-emerald" />
          <StatRow icon={<Coins size={12} />} label="Totaal Uitgegeven" value={`€${stats.totalSpent.toLocaleString()}`} color="text-blood" />
          <StatRow icon={<Dices size={12} />} label="Casino Winst" value={`€${stats.casinoWon.toLocaleString()}`} color="text-gold" />
          <StatRow icon={<Dices size={12} />} label="Casino Verlies" value={`€${stats.casinoLost.toLocaleString()}`} color="text-blood" />
          <StatRow icon={<Target size={12} />} label="Missies Voltooid" value={`${stats.missionsCompleted}`} color="text-emerald" />
          <StatRow icon={<Target size={12} />} label="Missies Gefaald" value={`${stats.missionsFailed}`} color="text-blood" />
          <StatRow icon={<BarChart3 size={12} />} label="Trades" value={`${stats.tradesCompleted}`} color="text-gold" />
          <StatRow icon={<Calendar size={12} />} label="Dagen Gespeeld" value={`${stats.daysPlayed}`} color="text-foreground" />
        </div>
      </div>

      {/* Achievements */}
      <SectionHeader title="Achievements" />
      <div className="grid grid-cols-2 gap-2 mb-4">
        {ACHIEVEMENTS.map(a => {
          const unlocked = state.achievements.includes(a.id);
          return (
            <div key={a.id} className={`game-card flex items-center gap-2 ${unlocked ? 'border-gold' : 'opacity-40'}`}>
              <Trophy size={14} className={unlocked ? 'text-gold' : 'text-muted-foreground'} />
              <div><div className="text-[0.6rem] font-bold">{a.name}</div><div className="text-[0.5rem] text-muted-foreground">{a.desc}</div></div>
            </div>
          );
        })}
      </div>

      {/* Debt */}
      {state.debt > 0 && (
        <>
          <SectionHeader title="Schuld" />
          <div className="game-card border-l-[3px] border-l-blood mb-4">
            <div className="flex justify-between items-center">
              <div><h4 className="font-bold text-sm text-blood">€{state.debt.toLocaleString()}</h4><p className="text-[0.6rem] text-muted-foreground">3% rente per dag</p></div>
              <button onClick={() => { const amt = Math.min(5000, state.money, state.debt); dispatch({ type: 'PAY_DEBT', amount: amt }); showToast(`€${amt.toLocaleString()} afgelost`); }}
                className="px-3 py-1.5 rounded text-[0.65rem] font-bold bg-[hsl(var(--blood)/0.1)] border border-blood text-blood">AFLOSSEN</button>
            </div>
          </div>
        </>
      )}

      {/* Reset */}
      <button onClick={() => setConfirmReset(true)}
        className="w-full py-2.5 rounded text-xs font-semibold text-muted-foreground bg-muted border border-border mt-6 hover:text-foreground transition-colors">
        OPNIEUW BEGINNEN
      </button>

      <ConfirmDialog
        open={confirmReset}
        title="Game Resetten"
        message="Weet je zeker dat je opnieuw wilt beginnen? AL je voortgang gaat verloren — geld, districten, crew, achievements, alles."
        confirmText="RESET ALLES"
        variant="danger"
        onConfirm={() => { setConfirmReset(false); dispatch({ type: 'RESET' }); showToast('Spel gereset'); }}
        onCancel={() => setConfirmReset(false)}
      />
    </div>
  );
}

function StatRow({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-1.5 bg-muted/40 rounded px-2 py-1.5">
      <span className="text-muted-foreground">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-[0.5rem] text-muted-foreground truncate">{label}</div>
        <div className={`text-[0.65rem] font-bold ${color}`}>{value}</div>
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
