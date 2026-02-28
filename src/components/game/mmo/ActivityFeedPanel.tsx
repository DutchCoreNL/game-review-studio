import { useActivityFeed } from '@/hooks/useActivityFeed';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Clock } from 'lucide-react';
import { SectionHeader } from '../ui/SectionHeader';

const DISTRICT_NAMES: Record<string, string> = {
  low: 'Lowrise', port: 'Port Nero', iron: 'Iron Borough', neon: 'Neon Strip', crown: 'Crown Heights',
};

function timeAgo(date: string): string {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  return `${Math.floor(diff / 3600)}u`;
}

interface Props {
  districtFilter?: string;
  maxItems?: number;
}

export function ActivityFeedPanel({ districtFilter, maxItems = 15 }: Props) {
  const items = useActivityFeed(districtFilter);
  const visibleItems = items.slice(0, maxItems);

  return (
    <div>
      <SectionHeader title="Live Activiteit" icon={<Activity size={12} />} badge={`${items.length}`} badgeColor="blood" />
      <div className="space-y-1 max-h-64 overflow-y-auto scrollbar-hide">
        <AnimatePresence initial={false}>
          {visibleItems.length === 0 ? (
            <p className="text-[0.5rem] text-muted-foreground text-center py-4">Geen recente activiteit.</p>
          ) : (
            visibleItems.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: i * 0.02 }}
                className="flex items-start gap-2 px-2 py-1.5 rounded bg-card/50 border border-border/50 hover:border-gold/30 transition-colors"
              >
                <span className="text-sm mt-0.5 flex-shrink-0">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[0.55rem] text-foreground leading-tight truncate">{item.description}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[0.4rem] text-gold font-bold">{item.username}</span>
                    {item.district_id && (
                      <span className="text-[0.4rem] text-muted-foreground">{DISTRICT_NAMES[item.district_id] || item.district_id}</span>
                    )}
                  </div>
                </div>
                <span className="text-[0.4rem] text-muted-foreground flex items-center gap-0.5 flex-shrink-0">
                  <Clock size={7} /> {timeAgo(item.created_at)}
                </span>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
