
-- Anonymous marketplace listings
CREATE TABLE public.market_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL,
  seller_name text NOT NULL DEFAULT 'Onbekend',
  good_id text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  price_per_unit integer NOT NULL CHECK (price_per_unit > 0),
  district_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  status text NOT NULL DEFAULT 'active' -- active, sold, expired, cancelled
);

ALTER TABLE public.market_listings ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can see active listings
CREATE POLICY "Anyone can view active listings"
  ON public.market_listings FOR SELECT TO authenticated
  USING (status = 'active' OR seller_id = auth.uid());

-- Users can create their own listings
CREATE POLICY "Users can create listings"
  ON public.market_listings FOR INSERT TO authenticated
  WITH CHECK (seller_id = auth.uid());

-- Users can update their own listings (cancel)
CREATE POLICY "Users can update own listings"
  ON public.market_listings FOR UPDATE TO authenticated
  USING (seller_id = auth.uid());

-- Users can delete their own listings
CREATE POLICY "Users can delete own listings"
  ON public.market_listings FOR DELETE TO authenticated
  USING (seller_id = auth.uid());

-- Direct trade offers between players
CREATE TABLE public.trade_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  sender_name text NOT NULL DEFAULT 'Onbekend',
  receiver_id uuid NOT NULL,
  receiver_name text NOT NULL DEFAULT 'Onbekend',
  offer_goods jsonb NOT NULL DEFAULT '{}', -- { "drugs": 5, "tech": 2 }
  offer_cash integer NOT NULL DEFAULT 0,
  request_goods jsonb NOT NULL DEFAULT '{}', -- { "weapons": 3 }
  request_cash integer NOT NULL DEFAULT 0,
  message text,
  status text NOT NULL DEFAULT 'pending', -- pending, accepted, declined, expired, cancelled
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '12 hours')
);

ALTER TABLE public.trade_offers ENABLE ROW LEVEL SECURITY;

-- Sender and receiver can see their offers
CREATE POLICY "Users can view own trade offers"
  ON public.trade_offers FOR SELECT TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Users can create offers
CREATE POLICY "Users can create trade offers"
  ON public.trade_offers FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid());

-- Sender can cancel, receiver can accept/decline
CREATE POLICY "Users can update involved offers"
  ON public.trade_offers FOR UPDATE TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Trade history log for price influence
CREATE TABLE public.market_player_trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL,
  seller_id uuid,
  good_id text NOT NULL,
  quantity integer NOT NULL,
  price_per_unit integer NOT NULL,
  district_id text NOT NULL,
  trade_type text NOT NULL DEFAULT 'marketplace', -- marketplace, direct, npc
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.market_player_trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view trade history"
  ON public.market_player_trades FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "System can insert trades"
  ON public.market_player_trades FOR INSERT TO authenticated
  WITH CHECK (buyer_id = auth.uid() OR seller_id = auth.uid());

-- Enable realtime for listings and offers
ALTER PUBLICATION supabase_realtime ADD TABLE public.market_listings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trade_offers;

-- Index for performance
CREATE INDEX idx_listings_status_district ON public.market_listings(status, district_id);
CREATE INDEX idx_listings_good ON public.market_listings(good_id, status);
CREATE INDEX idx_trade_offers_receiver ON public.trade_offers(receiver_id, status);
CREATE INDEX idx_player_trades_good ON public.market_player_trades(good_id, district_id, created_at DESC);
