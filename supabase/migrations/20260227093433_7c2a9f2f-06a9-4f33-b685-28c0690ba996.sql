-- Add unique constraint for market_prices upsert (good_id + district_id)
CREATE UNIQUE INDEX IF NOT EXISTS market_prices_good_district_unique
ON public.market_prices (good_id, district_id);