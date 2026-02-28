import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { gameApi } from '@/lib/gameApi';
import { getMoodStatus, type NpcMoodStatus } from '@/game/mmoStory';

const MOOD_CONFIG: Record<NpcMoodStatus, { color: string; label: string; emoji: string }> = {
  hostile: { color: 'text-blood', label: 'Vijandig', emoji: '😠' },
  wary: { color: 'text-amber-400', label: 'Op hoede', emoji: '😒' },
  neutral: { color: 'text-muted-foreground', label: 'Neutraal', emoji: '😐' },
  friendly: { color: 'text-emerald', label: 'Vriendelijk', emoji: '😊' },
  legendary: { color: 'text-gold', label: 'Legendarisch', emoji: '🌟' },
};

export function NpcMoodIndicator({ districtId }: { districtId: string }) {
  const [moods, setMoods] = useState<any[]>([]);

  useEffect(() => {
    gameApi.getNpcMood(districtId).then(res => {
      if (res.success && res.data) setMoods(res.data.moods || []);
    });
  }, [districtId]);

  if (moods.length === 0) return null;

  return (
    <div className="flex gap-1 flex-wrap">
      {moods.map((m: any) => {
        const status = getMoodStatus(m.collective_score);
        const config = MOOD_CONFIG[status];
        return (
          <motion.div key={m.npc_id}
            initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-muted/20 border border-border/30"
            title={`${m.npc_id}: ${config.label} (${m.collective_score})`}
          >
            <span className="text-[0.5rem]">{config.emoji}</span>
            <span className={`text-[0.4rem] font-bold uppercase ${config.color}`}>{m.npc_id}</span>
          </motion.div>
        );
      })}
    </div>
  );
}
