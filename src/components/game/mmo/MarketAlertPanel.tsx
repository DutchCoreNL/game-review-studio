import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellOff, Plus, Trash2, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { SectionHeader } from '../ui/SectionHeader';
import { GameButton } from '../ui/GameButton';

const GOOD_NAMES: Record<string, string> = {
  drugs: 'Synthetica', weapons: 'Zware Wapens', tech: 'Zwarte Data', luxury: 'Geroofde Kunst',
  meds: 'Medische Voorraad', explosives: 'Explosieven', crypto: 'Crypto', chemicals: 'Chemicaliën',
  electronics: 'Elektronica',
};

const DISTRICT_NAMES: Record<string, string> = {
  low: 'Lowrise', port: 'Port Nero', iron: 'Iron Borough', neon: 'Neon Strip', crown: 'Crown Heights',
};

interface PriceAlert {
  id: string;
  good_id: string;
  district_id: string;
  threshold: number;
  direction: 'above' | 'below';
  triggered: boolean;
  current_price?: number;
}

const MAX_ALERTS = 5;

export function MarketAlertPanel() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newGood, setNewGood] = useState('drugs');
  const [newDistrict, setNewDistrict] = useState('low');
  const [newThreshold, setNewThreshold] = useState('');
  const [newDirection, setNewDirection] = useState<'above' | 'below'>('below');
  const [loading, setLoading] = useState(true);

  // Since we don't have a price_alerts table yet, use localStorage
  const STORAGE_KEY = `market_alerts_${user?.id}`;

  const loadAlerts = useCallback(() => {
    if (!user) return;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setAlerts(JSON.parse(saved));
    setLoading(false);
  }, [user, STORAGE_KEY]);

  const saveAlerts = (newAlerts: PriceAlert[]) => {
    setAlerts(newAlerts);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newAlerts));
  };

  // Check prices against alerts
  const checkPrices = useCallback(async () => {
    if (alerts.length === 0) return;
    const { data } = await supabase.from('market_prices').select('good_id, district_id, current_price');
    if (!data) return;

    const priceMap: Record<string, number> = {};
    data.forEach(p => { priceMap[`${p.good_id}_${p.district_id}`] = p.current_price; });

    const updated = alerts.map(a => {
      const price = priceMap[`${a.good_id}_${a.district_id}`];
      const triggered = price !== undefined && (
        a.direction === 'below' ? price <= a.threshold : price >= a.threshold
      );
      return { ...a, current_price: price, triggered };
    });

    saveAlerts(updated);
  }, [alerts]);

  useEffect(() => { loadAlerts(); }, [loadAlerts]);
  useEffect(() => { checkPrices(); const i = setInterval(checkPrices, 60_000); return () => clearInterval(i); }, [checkPrices]);

  const handleAdd = () => {
    const threshold = parseInt(newThreshold);
    if (isNaN(threshold) || threshold <= 0) return;
    if (alerts.length >= MAX_ALERTS) return;

    const newAlert: PriceAlert = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      good_id: newGood,
      district_id: newDistrict,
      threshold,
      direction: newDirection,
      triggered: false,
    };
    saveAlerts([...alerts, newAlert]);
    setShowAdd(false);
    setNewThreshold('');
  };

  const handleRemove = (id: string) => {
    saveAlerts(alerts.filter(a => a.id !== id));
  };

  if (loading) return null;

  const triggeredCount = alerts.filter(a => a.triggered).length;

  return (
    <div>
      <SectionHeader 
        title="Prijs Alerts" 
        icon={<Bell size={12} />} 
        badge={triggeredCount > 0 ? `${triggeredCount} actief!` : `${alerts.length}/${MAX_ALERTS}`}
        badgeColor={triggeredCount > 0 ? 'blood' : 'gold'} 
      />

      {alerts.length === 0 && !showAdd ? (
        <div className="text-center py-3">
          <BellOff size={16} className="text-muted-foreground mx-auto mb-1" />
          <p className="text-[0.5rem] text-muted-foreground mb-2">Geen prijs alerts. Stel een alert in voor marktprijzen.</p>
          <GameButton variant="gold" size="sm" onClick={() => setShowAdd(true)} icon={<Plus size={10} />}>
            Alert Toevoegen
          </GameButton>
        </div>
      ) : (
        <>
          <div className="space-y-1 mb-2">
            <AnimatePresence>
              {alerts.map(a => (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded border ${
                    a.triggered 
                      ? 'bg-gold/10 border-gold/40' 
                      : 'bg-card/50 border-border/50'
                  }`}
                >
                  {a.triggered ? (
                    <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.5, repeat: Infinity }}>
                      <Bell size={10} className="text-gold" />
                    </motion.span>
                  ) : (
                    a.direction === 'below' 
                      ? <TrendingDown size={10} className="text-emerald" />
                      : <TrendingUp size={10} className="text-blood" />
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="text-[0.5rem] font-bold text-foreground">
                      {GOOD_NAMES[a.good_id]}
                    </span>
                    <span className="text-[0.4rem] text-muted-foreground ml-1">
                      {DISTRICT_NAMES[a.district_id]}
                    </span>
                    <div className="text-[0.4rem] text-muted-foreground">
                      {a.direction === 'below' ? '≤' : '≥'} €{a.threshold.toLocaleString()}
                      {a.current_price !== undefined && (
                        <span className={`ml-1 font-bold ${a.triggered ? 'text-gold' : ''}`}>
                          (nu: €{a.current_price.toLocaleString()})
                        </span>
                      )}
                    </div>
                  </div>
                  <button onClick={() => handleRemove(a.id)} className="text-muted-foreground hover:text-blood">
                    <Trash2 size={10} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Add form */}
          {showAdd ? (
            <div className="game-card space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[0.4rem] text-muted-foreground uppercase">Product</label>
                  <select value={newGood} onChange={e => setNewGood(e.target.value)}
                    className="w-full bg-muted/30 border border-border rounded px-1.5 py-1 text-[0.5rem] focus:outline-none focus:border-gold/50">
                    {Object.entries(GOOD_NAMES).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[0.4rem] text-muted-foreground uppercase">District</label>
                  <select value={newDistrict} onChange={e => setNewDistrict(e.target.value)}
                    className="w-full bg-muted/30 border border-border rounded px-1.5 py-1 text-[0.5rem] focus:outline-none focus:border-gold/50">
                    {Object.entries(DISTRICT_NAMES).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[0.4rem] text-muted-foreground uppercase">Richting</label>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => setNewDirection('below')}
                      className={`flex-1 py-1 rounded text-[0.45rem] font-bold ${newDirection === 'below' ? 'bg-emerald/20 text-emerald border border-emerald/40' : 'bg-muted/20 text-muted-foreground border border-border'}`}>
                      ≤ Onder
                    </button>
                    <button 
                      onClick={() => setNewDirection('above')}
                      className={`flex-1 py-1 rounded text-[0.45rem] font-bold ${newDirection === 'above' ? 'bg-blood/20 text-blood border border-blood/40' : 'bg-muted/20 text-muted-foreground border border-border'}`}>
                      ≥ Boven
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-[0.4rem] text-muted-foreground uppercase">Prijs (€)</label>
                  <input type="number" value={newThreshold} onChange={e => setNewThreshold(e.target.value)}
                    placeholder="bijv. 500"
                    className="w-full bg-muted/30 border border-border rounded px-1.5 py-1 text-[0.5rem] focus:outline-none focus:border-gold/50" />
                </div>
              </div>
              <div className="flex gap-1.5">
                <GameButton variant="gold" size="sm" onClick={handleAdd} disabled={!newThreshold || alerts.length >= MAX_ALERTS}>
                  Opslaan
                </GameButton>
                <GameButton variant="muted" size="sm" onClick={() => setShowAdd(false)}>Annuleer</GameButton>
              </div>
            </div>
          ) : alerts.length < MAX_ALERTS && (
            <GameButton variant="muted" size="sm" onClick={() => setShowAdd(true)} icon={<Plus size={10} />}>
              Alert Toevoegen
            </GameButton>
          )}
        </>
      )}
    </div>
  );
}
