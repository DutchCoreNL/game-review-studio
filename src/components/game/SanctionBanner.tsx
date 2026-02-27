import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, VolumeX, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ActiveSanction {
  id: string;
  type: string;
  reason: string;
  expires_at: string | null;
  created_at: string;
}

export function SanctionBanner() {
  const [sanctions, setSanctions] = useState<ActiveSanction[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchSanctions = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('player_sanctions')
        .select('id, type, reason, expires_at, created_at')
        .eq('user_id', user.id)
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (data) {
        // Filter out expired mutes
        const now = new Date();
        const active = data.filter(s =>
          !s.expires_at || new Date(s.expires_at) > now
        );
        setSanctions(active);
      }
    };

    fetchSanctions();
  }, []);

  const visible = sanctions.filter(s => !dismissed.has(s.id));
  if (visible.length === 0) return null;

  return (
    <AnimatePresence>
      {visible.map(s => (
        <motion.div
          key={s.id}
          initial={{ opacity: 0, y: -8, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -8, height: 0 }}
          className={`relative rounded border px-3 py-2 mb-2 flex items-start gap-2 ${
            s.type === 'warning'
              ? 'bg-gold/10 border-gold/30'
              : 'bg-ice/10 border-ice/30'
          }`}
        >
          {s.type === 'warning' ? (
            <AlertTriangle size={14} className="text-gold shrink-0 mt-0.5" />
          ) : (
            <VolumeX size={14} className="text-ice shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <p className={`text-[0.6rem] font-bold ${s.type === 'warning' ? 'text-gold' : 'text-ice'}`}>
              {s.type === 'warning' ? '⚠️ Waarschuwing van admin' : '🔇 Je bent gemute'}
            </p>
            {s.reason && (
              <p className="text-[0.5rem] text-muted-foreground mt-0.5">"{s.reason}"</p>
            )}
            {s.expires_at && (
              <p className="text-[0.45rem] text-muted-foreground mt-0.5">
                Verloopt: {new Date(s.expires_at).toLocaleString('nl-NL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
          <button
            onClick={() => setDismissed(prev => new Set(prev).add(s.id))}
            className="text-muted-foreground hover:text-foreground shrink-0"
          >
            <X size={12} />
          </button>
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
