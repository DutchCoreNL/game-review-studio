import { ShoppingBag, Droplets, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { MarketPanel } from './trade/MarketPanel';
import { LaunderingPanel } from './trade/LaunderingPanel';
import { GearPanel } from './trade/GearPanel';
import tradeBg from '@/assets/trade-bg.jpg';

type TradeSubTab = 'market' | 'launder' | 'gear';

export function TradeView() {
  const [subTab, setSubTab] = useState<TradeSubTab>('market');

  return (
    <div className="relative min-h-[70vh] -mx-3 -mt-2 px-3 pt-2">
      <img src={tradeBg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30 pointer-events-none" />
      <div className="relative z-10">
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
    </div>
  );
}
