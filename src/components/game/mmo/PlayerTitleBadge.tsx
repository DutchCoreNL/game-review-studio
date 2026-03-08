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
  { id: 'street_rat', name: 'Straatrat', nameEn: 'Street Rat', icon: '🐀', req: 'Level 5', reqEn: 'Level 5' },
  { id: 'enforcer', name: 'Enforcer', nameEn: 'Enforcer', icon: '💪', req: '50 PvP wins', reqEn: '50 PvP wins' },
  { id: 'drug_baron', name: 'Drugsbaron', nameEn: 'Drug Baron', icon: '💊', req: 'Drug Empire Tier 3', reqEn: 'Drug Empire Tier 3' },
  { id: 'kingpin', name: 'Kingpin', nameEn: 'Kingpin', icon: '👑', req: 'Eigen 3+ districten', reqEn: 'Own 3+ districts' },
  { id: 'shadow', name: 'Schaduw', nameEn: 'Shadow', icon: '🌑', req: '100+ stealth operaties', reqEn: '100+ stealth operations' },
  { id: 'tycoon', name: 'Tycoon', nameEn: 'Tycoon', icon: '💎', req: '€1M+ verdiend', reqEn: '€1M+ earned' },
  { id: 'warlord', name: 'Oorlogsheer', nameEn: 'Warlord', icon: '⚔️', req: '10 gangoorlogen gewonnen', reqEn: '10 gang wars won' },
  { id: 'legend', name: 'Legende', nameEn: 'Legend', icon: '🏆', req: 'Prestige Level 3+', reqEn: 'Prestige Level 3+' },
  { id: 'ghost', name: 'Spook', nameEn: 'Ghost', icon: '👻', req: 'Verdwijn 10x van Most Wanted', reqEn: 'Disappear 10x from Most Wanted' },
  { id: 'philanthropist', name: 'Filantroop', nameEn: 'Philanthropist', icon: '🕊️', req: 'Karma 80+', reqEn: 'Karma 80+' },
];
