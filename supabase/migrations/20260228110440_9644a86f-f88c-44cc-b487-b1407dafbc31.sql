
-- Live P2P Auction system
CREATE TABLE public.live_auctions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL,
  seller_name TEXT NOT NULL DEFAULT 'Onbekend',
  item_type TEXT NOT NULL, -- 'gear', 'vehicle', 'good'
  item_id TEXT NOT NULL,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  starting_price INTEGER NOT NULL,
  current_bid INTEGER NOT NULL DEFAULT 0,
  current_bidder_id UUID,
  current_bidder_name TEXT,
  bid_count INTEGER NOT NULL DEFAULT 0,
  min_increment INTEGER NOT NULL DEFAULT 100,
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  original_ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- active, sold, expired, cancelled
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  claimed_at TIMESTAMP WITH TIME ZONE
);

-- Bid history for transparency
CREATE TABLE public.auction_bids (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  auction_id UUID NOT NULL REFERENCES public.live_auctions(id) ON DELETE CASCADE,
  bidder_id UUID NOT NULL,
  bidder_name TEXT NOT NULL DEFAULT 'Onbekend',
  amount INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.live_auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auction_bids ENABLE ROW LEVEL SECURITY;

-- Everyone can read active auctions
CREATE POLICY "Anyone can read auctions" ON public.live_auctions FOR SELECT USING (true);

-- Sellers can cancel their own unsold auctions
CREATE POLICY "Sellers cancel own auctions" ON public.live_auctions FOR UPDATE USING (auth.uid() = seller_id AND status = 'active' AND bid_count = 0);

-- Anyone can read bid history
CREATE POLICY "Anyone can read bids" ON public.auction_bids FOR SELECT USING (true);

-- Admin full access
CREATE POLICY "Admins manage auctions" ON public.live_auctions FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage bids" ON public.auction_bids FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_auctions;

-- Index for active auctions
CREATE INDEX idx_live_auctions_status ON public.live_auctions(status, ends_at);
CREATE INDEX idx_auction_bids_auction ON public.auction_bids(auction_id, created_at DESC);
