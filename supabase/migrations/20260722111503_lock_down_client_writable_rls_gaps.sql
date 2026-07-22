-- Several tables had RLS UPDATE/INSERT/DELETE policies for authenticated players that were
-- never actually used by the app (all real mutations for these tables go through edge
-- functions using the service-role key, which bypasses RLS entirely) but were reachable
-- directly from the browser via the Supabase client, letting a player rewrite rows the
-- edge functions treat as trusted server-side state.

-- ========== death_legacy ==========
-- Players insert/update their own row directly (this one genuinely is client-written, see
-- GameOverScreen.tsx), but with no bounds a player could set coffer_cash/legacy_xp_bonus to
-- anything. Bound them to what the game's own formulas can ever produce
-- (DEATH_COFFER_PERCENT * the money cap enforced in game-action's save_state, and
-- DEATH_LEGACY_XP_MAX — see src/game/constants.ts).
DROP POLICY IF EXISTS "Players insert own legacy" ON public.death_legacy;
DROP POLICY IF EXISTS "Players update own legacy" ON public.death_legacy;

CREATE POLICY "Players insert own legacy"
ON public.death_legacy FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND coffer_cash BETWEEN 0 AND 10000000
  AND legacy_xp_bonus BETWEEN 0 AND 0.20
  AND death_count = 1
);

CREATE POLICY "Players update own legacy"
ON public.death_legacy FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND coffer_cash BETWEEN 0 AND 10000000
  AND legacy_xp_bonus BETWEEN 0 AND 0.20
);

-- ========== market_listings ==========
-- Nothing in the client ever calls .insert/.update/.delete on this table directly (the
-- marketplace edge function does all of that with the service-role key) — these
-- player-facing policies had no legitimate caller and only exposed a real exploit: a player
-- could INSERT a phantom listing (no inventory ever deducted, since that only happens inside
-- the edge function's create_listing action) and have a buyer pay real money for goods that
-- were never actually given up. UPDATE with no WITH CHECK also let a seller silently reprice
-- an active listing instead of only cancelling it.
DROP POLICY IF EXISTS "Users can create listings" ON public.market_listings;
DROP POLICY IF EXISTS "Users can update own listings" ON public.market_listings;
DROP POLICY IF EXISTS "Users can delete own listings" ON public.market_listings;

-- ========== trade_offers ==========
-- Same story: the client never writes to trade_offers directly (marketplace edge function
-- only). The UPDATE policy had no WITH CHECK and no column restriction, so either party could
-- rewrite offer_cash/offer_goods/request_cash/request_goods right before "accepting" to steal
-- from the counterparty.
DROP POLICY IF EXISTS "Users can create trade offers" ON public.trade_offers;
DROP POLICY IF EXISTS "Users can update involved offers" ON public.trade_offers;

-- ========== player_titles ==========
-- No feature currently calls .update() on this table from the client or an edge function
-- action — it was reachable but unused, and let a player rewrite any of their earned-title
-- rows to forge an unearned title_id/title_name (titles are publicly visible).
DROP POLICY IF EXISTS "Players manage own titles" ON public.player_titles;

-- ========== live_auctions ==========
-- No "cancel my auction" feature is wired up client-side or server-side yet — this policy was
-- reachable but unused, and had no WITH CHECK, so while bid_count = 0 a seller could rewrite
-- item_name/item_id/starting_price/ends_at instead of only cancelling.
DROP POLICY IF EXISTS "Sellers cancel own auctions" ON public.live_auctions;

-- ========== player_state ==========
-- "Public read basic player info" used USING (true), exposing every column (money,
-- dirty_money, debt, save_data, prison/hospital timers, backstory, ...) to any authenticated
-- client, not just the handful of fields the one legitimate cross-player feature
-- (PlayerHelpPanel.tsx — help players out of prison/hospital) actually needs. Replace it with
-- a narrow view exposing only the safe fields; the base table goes back to owner-only SELECT.
DROP POLICY IF EXISTS "Public read basic player info" ON public.player_state;

CREATE VIEW public.player_public_status AS
  SELECT user_id, level, loc, prison_until, hospital_until
  FROM public.player_state;

GRANT SELECT ON public.player_public_status TO authenticated;
