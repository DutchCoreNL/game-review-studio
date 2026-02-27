
-- Shared market prices table: one row per good per district
CREATE TABLE public.market_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  good_id TEXT NOT NULL,
  district_id TEXT NOT NULL,
  current_price INTEGER NOT NULL DEFAULT 100,
  buy_volume INTEGER NOT NULL DEFAULT 0,
  sell_volume INTEGER NOT NULL DEFAULT 0,
  price_trend TEXT NOT NULL DEFAULT 'stable', -- 'up', 'down', 'stable'
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(good_id, district_id)
);

-- Enable RLS
ALTER TABLE public.market_prices ENABLE ROW LEVEL SECURITY;

-- Everyone can read prices
CREATE POLICY "Anyone can read market prices"
ON public.market_prices FOR SELECT
USING (true);

-- Only admins can directly modify (edge functions use service role)
CREATE POLICY "Admins manage market prices"
ON public.market_prices FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for live price updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.market_prices;

-- Seed initial prices for all goods x districts
INSERT INTO public.market_prices (good_id, district_id, current_price)
SELECT g.id, d.id, 
  CASE g.id
    WHEN 'drugs' THEN (CASE d.id WHEN 'low' THEN 120 WHEN 'port' THEN 100 WHEN 'iron' THEN 140 WHEN 'neon' THEN 160 WHEN 'crown' THEN 180 END)
    WHEN 'weapons' THEN (CASE d.id WHEN 'low' THEN 200 WHEN 'port' THEN 180 WHEN 'iron' THEN 160 WHEN 'neon' THEN 220 WHEN 'crown' THEN 250 END)
    WHEN 'luxury' THEN (CASE d.id WHEN 'low' THEN 300 WHEN 'port' THEN 280 WHEN 'iron' THEN 320 WHEN 'neon' THEN 350 WHEN 'crown' THEN 400 END)
    WHEN 'tech' THEN (CASE d.id WHEN 'low' THEN 150 WHEN 'port' THEN 170 WHEN 'iron' THEN 130 WHEN 'neon' THEN 200 WHEN 'crown' THEN 190 END)
    WHEN 'meds' THEN (CASE d.id WHEN 'low' THEN 80 WHEN 'port' THEN 90 WHEN 'iron' THEN 100 WHEN 'neon' THEN 110 WHEN 'crown' THEN 95 END)
    ELSE 100
  END
FROM (VALUES ('drugs'), ('weapons'), ('luxury'), ('tech'), ('meds')) AS g(id)
CROSS JOIN (VALUES ('low'), ('port'), ('iron'), ('neon'), ('crown')) AS d(id);

-- Trade history for price analytics
CREATE TABLE public.market_trade_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  good_id TEXT NOT NULL,
  district_id TEXT NOT NULL,
  price INTEGER NOT NULL,
  volume INTEGER NOT NULL,
  trade_type TEXT NOT NULL, -- 'buy' or 'sell'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.market_trade_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read trade history"
ON public.market_trade_history FOR SELECT USING (true);

CREATE POLICY "Admins manage trade history"
ON public.market_trade_history FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
