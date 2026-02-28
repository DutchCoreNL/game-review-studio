import { useSmuggleRoutes } from '@/hooks/useSmuggleRoutes';
import { motion } from 'framer-motion';
import { Truck, ArrowRight, Clock, AlertTriangle } from 'lucide-react';
import { GameButton } from '../ui/GameButton';
import { SectionHeader } from '../ui/SectionHeader';
import { Progress } from '@/components/ui/progress';
import { useState } from 'react';

const DISTRICT_NAMES: Record<string, string> = {
  low: 'Lowrise', port: 'Port Nero', iron: 'Iron Borough', neon: 'Neon Strip', crown: 'Crown Heights',
};

const GOOD_NAMES: Record<string, string> = {
  drugs: 'Synthetica', weapons: 'Zware Wapens', tech: 'Zwarte Data', luxury: 'Geroofde Kunst', meds: 'Medische Voorraad',
};

function timeLeft(endsAt: string): string {
  const diff = Math.max(0, Math.floor((new Date(endsAt).getTime() - Date.now()) / 1000));
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  return h > 0 ? `${h}u ${m}m` : `${m}m`;
}

interface Props {
  currentDistrict?: string;
}

export function SmuggleRoutesPanel({ currentDistrict }: Props) {
  const { routes, useRoute } = useSmuggleRoutes();
  const [using, setUsing] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const relevantRoutes = routes.filter(r =>
    r.from_district === currentDistrict || r.to_district === currentDistrict || !currentDistrict
  );

  const handleUse = async (routeId: string) => {
    setUsing(routeId);
    const res = await useRoute(routeId, 1);
    setToast(res.message);
    setTimeout(() => setToast(''), 3000);
    setUsing(null);
  };

  if (relevantRoutes.length === 0) return null;

  return (
    <div>
      <SectionHeader title="Smokkelroutes" icon={<Truck size={12} />} badge={`${relevantRoutes.length}`} badgeColor="emerald" />

      {toast && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[0.5rem] text-emerald bg-emerald/10 rounded px-2 py-1 mb-2 text-center border border-emerald/20">
          {toast}
        </motion.div>
      )}

      <div className="space-y-2">
        {relevantRoutes.map(route => {
          const capacityPercent = (route.used_capacity / route.capacity) * 100;
          const isFull = route.used_capacity >= route.capacity;
          const profitColor = route.profit_multiplier >= 2 ? 'text-gold' : route.profit_multiplier >= 1.5 ? 'text-emerald' : 'text-foreground';

          return (
            <motion.div
              key={route.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="game-card"
            >
              {/* Route header */}
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[0.5rem] font-bold text-foreground">{DISTRICT_NAMES[route.from_district]}</span>
                <ArrowRight size={10} className="text-gold" />
                <span className="text-[0.5rem] font-bold text-foreground">{DISTRICT_NAMES[route.to_district]}</span>
                <span className="text-[0.45rem] bg-muted/30 px-1 rounded text-muted-foreground">{GOOD_NAMES[route.good_id] || route.good_id}</span>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-3 text-[0.45rem] mb-1.5">
                <span className={profitColor}>💰 {route.profit_multiplier}x winst</span>
                <span className="flex items-center gap-0.5 text-blood"><AlertTriangle size={7} /> {route.risk_level}% risico</span>
                <span className="flex items-center gap-0.5 text-muted-foreground"><Clock size={7} /> {timeLeft(route.expires_at)}</span>
              </div>

              {/* Capacity */}
              <div className="mb-2">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[0.4rem] text-muted-foreground">Capaciteit</span>
                  <span className="text-[0.4rem] font-bold">{route.used_capacity}/{route.capacity}</span>
                </div>
                <Progress value={capacityPercent} className="h-1 [&>div]:bg-emerald" />
              </div>

              {route.from_district === currentDistrict && !isFull && (
                <GameButton
                  variant="emerald"
                  size="sm"
                  fullWidth
                  icon={<Truck size={10} />}
                  onClick={() => handleUse(route.id)}
                  disabled={using === route.id}
                >
                  {using === route.id ? 'Smokkelen...' : 'Smokkel Starten'}
                </GameButton>
              )}
              {isFull && (
                <p className="text-[0.4rem] text-center text-muted-foreground">Route vol</p>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
