import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PlayerTitle {
  title_id: string;
  title_name: string;
  title_icon: string;
  is_active: boolean;
}

interface Props {
  userId: string;
  className?: string;
}

export function PlayerTitleBadge({ userId, className = '' }: Props) {
  const [title, setTitle] = useState<PlayerTitle | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('player_titles')
        .select('title_id, title_name, title_icon, is_active')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle();
      if (data) setTitle(data as unknown as PlayerTitle);
    };
    fetch();
  }, [userId]);

  if (!title) return null;

  return (
    <span className={`inline-flex items-center gap-0.5 text-[0.4rem] px-1 py-0.5 rounded bg-gold/10 border border-gold/20 text-gold font-bold ${className}`}>
      {title.title_icon} {title.title_name}
    </span>
  );
}

// Title definitions for reference
export const TITLE_DEFINITIONS = [
  { id: 'street_rat', name: 'Straatrat', icon: '🐀', req: 'Level 5' },
  { id: 'enforcer', name: 'Enforcer', icon: '💪', req: '50 PvP wins' },
  { id: 'drug_baron', name: 'Drugsbaron', icon: '💊', req: 'Drug Empire Tier 3' },
  { id: 'kingpin', name: 'Kingpin', icon: '👑', req: 'Eigen 3+ districten' },
  { id: 'shadow', name: 'Schaduw', icon: '🌑', req: '100+ stealth operaties' },
  { id: 'tycoon', name: 'Tycoon', icon: '💎', req: '€1M+ verdiend' },
  { id: 'warlord', name: 'Oorlogsheer', icon: '⚔️', req: '10 gangoorlogen gewonnen' },
  { id: 'legend', name: 'Legende', icon: '🏆', req: 'Prestige Level 3+' },
  { id: 'ghost', name: 'Spook', icon: '👻', req: 'Verdwijn 10x van Most Wanted' },
  { id: 'philanthropist', name: 'Filantroop', icon: '🕊️', req: 'Karma 80+' },
];
