import { ShoppingBag, Droplets, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { MarketPanel } from './trade/MarketPanel';
import { LaunderingPanel } from './trade/LaunderingPanel';
import { GearPanel } from './trade/GearPanel';

type TradeSubTab = 'market' | 'launder' | 'gear';

export function TradeView() {
  const [subTab, setSubTab] = useState<TradeSubTab>('market');

  return (
    <div>
      {/* Sub-tabs */}
      <div className="flex gap-1.5 mb-4 mt-1">
        {([
          { id: 'market' as TradeSubTab, label: 'MARKT', icon: <ShoppingBag size={11} /> },
          { id: 'launder' as TradeSubTab, label: 'WITWASSEN', icon: <Droplets size={11} /> },
          { id: 'gear' as TradeSubTab, label: 'GEAR', icon: <ShieldCheck size={11} /> },
        ]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id)}
            className={`flex-1 py-2 rounded text-[0.55rem] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${
              subTab === tab.id
                ? 'bg-gold/15 border border-gold text-gold'
                : 'bg-muted border border-border text-muted-foreground'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {subTab === 'market' && <MarketPanel />}
      {subTab === 'launder' && <LaunderingPanel />}
      {subTab === 'gear' && <GearPanel />}
    </div>
  );
}
