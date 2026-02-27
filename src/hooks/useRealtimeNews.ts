import { useState, useEffect } from 'react';
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

export function useRealtimeNews(fallbackItems: NewsItem[]): NewsItem[] {
  const [serverNews, setServerNews] = useState<NewsItem[]>([]);

  useEffect(() => {
    // Fetch recent non-expired news
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

    // Subscribe to realtime inserts
    const channel = supabase
      .channel('news_events_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'news_events' },
        (payload) => {
          const row = payload.new as NewsEventRow;
          setServerNews(prev => [rowToNewsItem(row), ...prev].slice(0, 10));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Use server news if available, fall back to client-generated
  return serverNews.length > 0 ? serverNews : fallbackItems;
}
