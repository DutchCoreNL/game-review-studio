import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { NewsItem } from '@/game/newsGenerator';

interface NewsEventRow {
  id: string;
  text: string;
  category: string;
  urgency: string;
  icon: string;
  detail: string | null;
  district_id: string | null;
  created_at: string;
  expires_at: string;
}

function rowToNewsItem(row: NewsEventRow): NewsItem {
  return {
    text: row.text,
    category: row.category as NewsItem['category'],
    urgency: row.urgency as NewsItem['urgency'],
    icon: row.icon,
    detail: row.detail || undefined,
  };
}

export interface RealtimeNewsResult {
  items: NewsItem[];
  breakingItem: NewsItem | null;
  clearBreaking: () => void;
}

export function useRealtimeNews(fallbackItems: NewsItem[]): RealtimeNewsResult {
  const [serverNews, setServerNews] = useState<NewsItem[]>([]);
  const [breakingItem, setBreakingItem] = useState<NewsItem | null>(null);
  const breakingTimer = useRef<ReturnType<typeof setTimeout>>();

  const clearBreaking = useCallback(() => setBreakingItem(null), []);

  useEffect(() => {
    const fetchNews = async () => {
      const { data } = await supabase
        .from('news_events')
        .select('*')
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      if (data && data.length > 0) {
        setServerNews((data as unknown as NewsEventRow[]).map(rowToNewsItem));
      }
    };

    fetchNews();

    const channel = supabase
      .channel('news_events_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'news_events' },
        (payload) => {
          const row = payload.new as NewsEventRow;
          const item = rowToNewsItem(row);
          setServerNews(prev => [item, ...prev].slice(0, 10));

          if (row.urgency === 'high') {
            setBreakingItem(item);
            clearTimeout(breakingTimer.current);
            breakingTimer.current = setTimeout(() => setBreakingItem(null), 4000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      clearTimeout(breakingTimer.current);
    };
  }, []);

  const items = serverNews.length > 0 ? serverNews : fallbackItems;
  return { items, breakingItem, clearBreaking };
}
