import { BET_PRESETS } from '@/game/constants';

interface BetControlsProps {
  bet: number;
  setBet: (bet: number) => void;
  money: number;
  disabled?: boolean;
}

export function BetControls({ bet, setBet, money, disabled }: BetControlsProps) {
  return (
    <div className="space-y-2">
      <input
        type="number"
        value={bet}
        onChange={e => setBet(Math.abs(parseInt(e.target.value) || 0))}
        className="w-full py-2 px-3 bg-muted border border-border rounded text-center text-foreground text-sm"
        min={10}
        disabled={disabled}
      />
      <div className="flex gap-1.5">
        {BET_PRESETS.map(preset => (
          <button
            key={preset}
            onClick={() => setBet(Math.min(preset, money))}
            disabled={disabled}
            className={`flex-1 py-1.5 rounded text-[0.55rem] font-bold transition-all ${
              bet === preset
                ? 'bg-gold/20 border border-gold text-gold'
                : 'bg-muted border border-border text-muted-foreground hover:border-gold/40'
            } disabled:opacity-50`}
          >
            €{preset >= 1000 ? `${preset/1000}k` : preset}
          </button>
        ))}
        <button
          onClick={() => setBet(money)}
          disabled={disabled}
          className={`flex-1 py-1.5 rounded text-[0.55rem] font-bold transition-all ${
            bet === money
              ? 'bg-blood/20 border border-blood text-blood'
              : 'bg-muted border border-border text-blood/60 hover:border-blood/40'
          } disabled:opacity-50`}
        >
          ALL-IN
        </button>
      </div>
    </div>
  );
}
