import { useState, useEffect, useCallback } from 'react';
import { useGame } from '@/contexts/GameContext';
import { GOODS, DISTRICTS } from '@/game/constants';
import { GoodId, DistrictId } from '@/game/types';
import { supabase } from '@/integrations/supabase/client';
import { SectionHeader } from '../ui/SectionHeader';
import { GameButton } from '../ui/GameButton';
import { GameBadge } from '../ui/GameBadge';
import { SubTabBar, SubTab } from '../ui/SubTabBar';
import { ConfirmDialog } from '../ConfirmDialog';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, Send, Package, Plus, X, ArrowRightLeft, Clock, TrendingUp, Users } from 'lucide-react';

type MarketSubTab = 'browse' | 'sell' | 'offers' | 'my_listings';

interface Listing {
  id: string;
  seller_id: string;
  seller_name: string;
  good_id: string;
  quantity: number;
  price_per_unit: number;
  district_id: string;
  created_at: string;
  expires_at: string;
  status: string;
}

interface TradeOffer {
  id: string;
  sender_id: string;
  sender_name: string;
  receiver_id: string;
  receiver_name: string;
  offer_goods: Record<string, number>;
  offer_cash: number;
  request_goods: Record<string, number>;
  request_cash: number;
  message: string | null;
  status: string;
  created_at: string;
}

async function callMarketplace(action: string, params: Record<string, any> = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { error: 'Not logged in' };

  const res = await supabase.functions.invoke('marketplace', {
    body: { action, ...params },
  });
  return res.data || { error: res.error?.message };
}

export function MarketplacePanel() {
  const { state, showToast } = useGame();
  const [subTab, setSubTab] = useState<MarketSubTab>('browse');
  const [listings, setListings] = useState<Listing[]>([]);
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [incomingOffers, setIncomingOffers] = useState<TradeOffer[]>([]);
  const [outgoingOffers, setOutgoingOffers] = useState<TradeOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterGood, setFilterGood] = useState<string>('all');
  const [filterDistrict, setFilterDistrict] = useState<string>('all');

  // Sell form state
  const [sellGood, setSellGood] = useState<string>('drugs');
  const [sellQty, setSellQty] = useState(1);
  const [sellPrice, setSellPrice] = useState(100);

  // Confirm dialogs
  const [confirmBuy, setConfirmBuy] = useState<Listing | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);

  const districtNames = Object.entries(DISTRICTS).reduce((acc, [id, d]) => ({ ...acc, [id]: d.name }), {} as Record<string, string>);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    const params: any = {};
    if (filterGood !== 'all') params.goodId = filterGood;
    if (filterDistrict !== 'all') params.districtId = filterDistrict;
    const res = await callMarketplace('get_listings', params);
    if (res.listings) setListings(res.listings);
    setLoading(false);
  }, [filterGood, filterDistrict]);

  const fetchMyListings = useCallback(async () => {
    const res = await callMarketplace('get_my_listings');
    if (res.listings) setMyListings(res.listings);
  }, []);

  const fetchOffers = useCallback(async () => {
    const res = await callMarketplace('get_trade_offers');
    if (res.incoming) setIncomingOffers(res.incoming);
    if (res.outgoing) setOutgoingOffers(res.outgoing);
  }, []);

  useEffect(() => {
    if (subTab === 'browse') fetchListings();
    if (subTab === 'my_listings') fetchMyListings();
    if (subTab === 'offers') fetchOffers();
  }, [subTab, fetchListings, fetchMyListings, fetchOffers]);

  // Realtime updates for listings
  useEffect(() => {
    const channel = supabase
      .channel('marketplace-listings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'market_listings' }, () => {
        if (subTab === 'browse') fetchListings();
        if (subTab === 'my_listings') fetchMyListings();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [subTab, fetchListings, fetchMyListings]);

  // Realtime for trade offers
  useEffect(() => {
    const channel = supabase
      .channel('marketplace-offers')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trade_offers' }, () => {
        if (subTab === 'offers') fetchOffers();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [subTab, fetchOffers]);

  const handleBuy = async (listing: Listing) => {
    setLoading(true);
    const res = await callMarketplace('buy_listing', { listingId: listing.id });
    if (res.success) {
      showToast(`Gekocht! €${res.totalCost?.toLocaleString()} betaald`);
      fetchListings();
    } else {
      showToast(res.error || 'Koop mislukt', true);
    }
    setConfirmBuy(null);
    setLoading(false);
  };

  const handleSell = async () => {
    if (sellQty <= 0 || sellPrice <= 0) return showToast('Ongeldig aantal of prijs', true);
    setLoading(true);
    const res = await callMarketplace('create_listing', { goodId: sellGood, quantity: sellQty, pricePerUnit: sellPrice });
    if (res.success) {
      showToast('Listing geplaatst!');
      setSellQty(1);
      setSubTab('my_listings');
      fetchMyListings();
    } else {
      showToast(res.error || 'Plaatsen mislukt', true);
    }
    setLoading(false);
  };

  const handleCancel = async (listingId: string) => {
    setLoading(true);
    const res = await callMarketplace('cancel_listing', { listingId });
    if (res.success) {
      showToast('Listing geannuleerd, goederen teruggekregen');
      fetchMyListings();
    } else {
      showToast(res.error || 'Annuleren mislukt', true);
    }
    setConfirmCancel(null);
    setLoading(false);
  };

  const handleAcceptOffer = async (offerId: string) => {
    setLoading(true);
    const res = await callMarketplace('accept_trade_offer', { offerId });
    if (res.success) {
      showToast('Handelsaanbod geaccepteerd!');
      fetchOffers();
    } else {
      showToast(res.error || 'Accepteren mislukt', true);
    }
    setLoading(false);
  };

  const handleDeclineOffer = async (offerId: string) => {
    const res = await callMarketplace('decline_trade_offer', { offerId });
    if (res.success) {
      showToast('Aanbod geweigerd');
      fetchOffers();
    } else {
      showToast(res.error || 'Weigeren mislukt', true);
    }
  };

  const tabs: SubTab<MarketSubTab>[] = [
    { id: 'browse', label: 'BROWSE', icon: <Store size={10} /> },
    { id: 'sell', label: 'VERKOOP', icon: <Plus size={10} /> },
    { id: 'offers', label: 'AANBIEDINGEN', icon: <ArrowRightLeft size={10} />, badge: incomingOffers.length || undefined },
    { id: 'my_listings', label: 'MIJN', icon: <Package size={10} /> },
  ];

  const getGoodName = (id: string) => GOODS.find(g => g.id === id)?.name || id;
  const getGoodIcon = (id: string) => GOODS.find(g => g.id === id)?.icon || '📦';
  const timeLeft = (exp: string) => {
    const ms = new Date(exp).getTime() - Date.now();
    if (ms <= 0) return 'Verlopen';
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return `${h}u ${m}m`;
  };

  return (
    <div>
      <SectionHeader title="Speler Marktplaats" icon={<Users size={12} />} />
      <p className="text-[0.45rem] text-muted-foreground mb-3">
        Koop & verkoop direct aan andere spelers. Grote transacties beïnvloeden marktprijzen!
      </p>

      <SubTabBar tabs={tabs} active={subTab} onChange={id => setSubTab(id as MarketSubTab)} />

      {/* ========== BROWSE LISTINGS ========== */}
      {subTab === 'browse' && (
        <div>
          {/* Filters */}
          <div className="flex gap-2 mb-3">
            <select
              value={filterGood}
              onChange={e => setFilterGood(e.target.value)}
              className="flex-1 bg-muted border border-border rounded px-2 py-1.5 text-[0.55rem] text-foreground"
            >
              <option value="all">Alle goederen</option>
              {GOODS.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            <select
              value={filterDistrict}
              onChange={e => setFilterDistrict(e.target.value)}
              className="flex-1 bg-muted border border-border rounded px-2 py-1.5 text-[0.55rem] text-foreground"
            >
              <option value="all">Alle districten</option>
              {Object.entries(DISTRICTS).map(([id, d]) => <option key={id} value={id}>{d.name}</option>)}
            </select>
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground text-xs animate-pulse">Laden...</div>
          ) : listings.length === 0 ? (
            <div className="text-center py-8">
              <Store size={24} className="mx-auto text-muted-foreground mb-2 opacity-40" />
              <p className="text-xs text-muted-foreground">Geen actieve listings gevonden</p>
              <p className="text-[0.45rem] text-muted-foreground mt-1">Wees de eerste die verkoopt!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {listings.map(listing => {
                const totalCost = listing.price_per_unit * listing.quantity;
                const canAfford = state.money >= totalCost;
                return (
                  <motion.div
                    key={listing.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="game-card p-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded bg-gold/10 flex items-center justify-center text-sm flex-shrink-0">
                        {getGoodIcon(listing.good_id) === 'Pipette' ? '💊' :
                         getGoodIcon(listing.good_id) === 'Shield' ? '🔫' :
                         getGoodIcon(listing.good_id) === 'Cpu' ? '💻' :
                         getGoodIcon(listing.good_id) === 'Gem' ? '💎' : '💊'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs">{getGoodName(listing.good_id)}</span>
                          <GameBadge variant="gold" size="xs">{listing.quantity}×</GameBadge>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[0.5rem] text-gold font-bold">€{listing.price_per_unit.toLocaleString()}/stuk</span>
                          <span className="text-[0.45rem] text-muted-foreground">Totaal: €{totalCost.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[0.45rem] text-muted-foreground">{districtNames[listing.district_id] || listing.district_id}</span>
                          <span className="text-[0.45rem] text-muted-foreground flex items-center gap-0.5">
                            <Clock size={7} /> {timeLeft(listing.expires_at)}
                          </span>
                        </div>
                        <span className="text-[0.45rem] text-muted-foreground">Door: {listing.seller_name}</span>
                      </div>
                      <GameButton
                        variant="gold"
                        size="sm"
                        disabled={!canAfford || loading}
                        onClick={() => setConfirmBuy(listing)}
                      >
                        KOOP
                      </GameButton>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========== SELL / CREATE LISTING ========== */}
      {subTab === 'sell' && (
        <div className="space-y-3">
          <div className="game-card p-3">
            <h4 className="font-bold text-xs mb-2">Nieuw Aanbod Plaatsen</h4>

            <div className="space-y-2">
              <div>
                <label className="text-[0.5rem] text-muted-foreground uppercase tracking-wider">Product</label>
                <select
                  value={sellGood}
                  onChange={e => setSellGood(e.target.value)}
                  className="w-full bg-muted border border-border rounded px-2 py-1.5 text-xs text-foreground mt-0.5"
                >
                  {GOODS.map(g => {
                    const owned = state.inventory[g.id as GoodId] || 0;
                    return <option key={g.id} value={g.id} disabled={owned <= 0}>{g.name} (bezit: {owned})</option>;
                  })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[0.5rem] text-muted-foreground uppercase tracking-wider">Aantal</label>
                  <input
                    type="number"
                    min={1}
                    max={state.inventory[sellGood as GoodId] || 0}
                    value={sellQty}
                    onChange={e => setSellQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-muted border border-border rounded px-2 py-1.5 text-xs text-foreground mt-0.5"
                  />
                </div>
                <div>
                  <label className="text-[0.5rem] text-muted-foreground uppercase tracking-wider">Prijs/stuk (€)</label>
                  <input
                    type="number"
                    min={1}
                    value={sellPrice}
                    onChange={e => setSellPrice(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-muted border border-border rounded px-2 py-1.5 text-xs text-foreground mt-0.5"
                  />
                </div>
              </div>

              {/* Price suggestion */}
              {state.prices[state.loc]?.[sellGood] && (
                <div className="flex items-center gap-1.5 text-[0.45rem] text-muted-foreground">
                  <TrendingUp size={8} />
                  <span>Huidige marktprijs: €{state.prices[state.loc][sellGood].toLocaleString()}</span>
                  <button
                    onClick={() => setSellPrice(Math.floor(state.prices[state.loc][sellGood] * 0.9))}
                    className="text-gold underline"
                  >
                    -10%
                  </button>
                  <button
                    onClick={() => setSellPrice(state.prices[state.loc][sellGood])}
                    className="text-gold underline"
                  >
                    gelijk
                  </button>
                  <button
                    onClick={() => setSellPrice(Math.floor(state.prices[state.loc][sellGood] * 1.1))}
                    className="text-gold underline"
                  >
                    +10%
                  </button>
                </div>
              )}

              <div className="bg-gold/5 border border-gold/20 rounded p-2 text-center">
                <span className="text-[0.5rem] text-muted-foreground">Totale opbrengst: </span>
                <span className="text-xs font-bold text-gold">€{(sellQty * sellPrice).toLocaleString()}</span>
              </div>

              <GameButton
                variant="gold"
                size="md"
                fullWidth
                disabled={loading || (state.inventory[sellGood as GoodId] || 0) < sellQty}
                onClick={handleSell}
              >
                PLAATS AANBOD
              </GameButton>
            </div>
          </div>

          <div className="text-[0.45rem] text-muted-foreground text-center">
            💡 Listings verlopen na 24 uur. Niet-verkochte goederen worden automatisch teruggestuurd.
          </div>
        </div>
      )}

      {/* ========== TRADE OFFERS ========== */}
      {subTab === 'offers' && (
        <div className="space-y-3">
          {incomingOffers.length > 0 && (
            <>
              <h4 className="font-bold text-xs flex items-center gap-1.5">
                <Send size={10} className="text-gold" /> Ontvangen ({incomingOffers.length})
              </h4>
              {incomingOffers.map(offer => (
                <motion.div key={offer.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="game-card p-3 border-l-[3px] border-l-gold">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="font-bold text-xs">{offer.sender_name}</span>
                    <GameBadge variant="gold" size="xs">AANBOD</GameBadge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div className="bg-emerald/5 border border-emerald/20 rounded p-1.5">
                      <div className="text-[0.45rem] font-bold text-emerald uppercase mb-0.5">Je krijgt:</div>
                      {Object.entries(offer.offer_goods).map(([gid, qty]) => (
                        <div key={gid} className="text-[0.5rem]">{getGoodName(gid)} ×{qty}</div>
                      ))}
                      {offer.offer_cash > 0 && <div className="text-[0.5rem] text-gold">€{offer.offer_cash.toLocaleString()}</div>}
                    </div>
                    <div className="bg-blood/5 border border-blood/20 rounded p-1.5">
                      <div className="text-[0.45rem] font-bold text-blood uppercase mb-0.5">Je geeft:</div>
                      {Object.entries(offer.request_goods).map(([gid, qty]) => (
                        <div key={gid} className="text-[0.5rem]">{getGoodName(gid)} ×{qty}</div>
                      ))}
                      {offer.request_cash > 0 && <div className="text-[0.5rem] text-gold">€{offer.request_cash.toLocaleString()}</div>}
                    </div>
                  </div>

                  {offer.message && (
                    <p className="text-[0.45rem] text-muted-foreground italic mb-2">"{offer.message}"</p>
                  )}

                  <div className="flex gap-2">
                    <GameButton variant="emerald" size="sm" onClick={() => handleAcceptOffer(offer.id)} disabled={loading}>
                      ACCEPTEER
                    </GameButton>
                    <GameButton variant="blood" size="sm" onClick={() => handleDeclineOffer(offer.id)} disabled={loading}>
                      WEIGER
                    </GameButton>
                  </div>
                </motion.div>
              ))}
            </>
          )}

          {outgoingOffers.length > 0 && (
            <>
              <h4 className="font-bold text-xs flex items-center gap-1.5 mt-3">
                <Package size={10} className="text-muted-foreground" /> Verstuurd ({outgoingOffers.length})
              </h4>
              {outgoingOffers.map(offer => (
                <div key={offer.id} className="game-card p-3 opacity-70">
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Naar: <span className="font-bold">{offer.receiver_name}</span></span>
                    <GameBadge variant="muted" size="xs">WACHT</GameBadge>
                  </div>
                </div>
              ))}
            </>
          )}

          {incomingOffers.length === 0 && outgoingOffers.length === 0 && (
            <div className="text-center py-8">
              <ArrowRightLeft size={24} className="mx-auto text-muted-foreground mb-2 opacity-40" />
              <p className="text-xs text-muted-foreground">Geen actieve handelsaanbiedingen</p>
              <p className="text-[0.45rem] text-muted-foreground mt-1">Stuur een aanbod via het speler-profiel</p>
            </div>
          )}
        </div>
      )}

      {/* ========== MY LISTINGS ========== */}
      {subTab === 'my_listings' && (
        <div>
          {myListings.length === 0 ? (
            <div className="text-center py-8">
              <Package size={24} className="mx-auto text-muted-foreground mb-2 opacity-40" />
              <p className="text-xs text-muted-foreground">Je hebt geen actieve listings</p>
            </div>
          ) : (
            <div className="space-y-2">
              {myListings.map(listing => (
                <motion.div key={listing.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="game-card p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-xs">{getGoodName(listing.good_id)}</span>
                      <GameBadge variant="gold" size="xs" className="ml-1.5">{listing.quantity}×</GameBadge>
                      <div className="text-[0.5rem] text-gold mt-0.5">€{listing.price_per_unit.toLocaleString()}/stuk</div>
                      <div className="text-[0.45rem] text-muted-foreground flex items-center gap-1">
                        <Clock size={7} /> {timeLeft(listing.expires_at)}
                      </div>
                    </div>
                    <GameButton variant="blood" size="sm" onClick={() => setConfirmCancel(listing.id)} disabled={loading}>
                      ANNULEER
                    </GameButton>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Confirm Buy Dialog */}
      {confirmBuy && (
        <ConfirmDialog
          open={true}
          title={`${getGoodName(confirmBuy.good_id)} kopen?`}
          message={`${confirmBuy.quantity}× voor €${(confirmBuy.price_per_unit * confirmBuy.quantity).toLocaleString()} van ${confirmBuy.seller_name}`}
          onConfirm={() => handleBuy(confirmBuy)}
          onCancel={() => setConfirmBuy(null)}
        />
      )}

      {/* Confirm Cancel Dialog */}
      {confirmCancel && (
        <ConfirmDialog
          open={true}
          title="Listing annuleren?"
          message="De goederen worden teruggegeven aan je inventaris."
          onConfirm={() => handleCancel(confirmCancel)}
          onCancel={() => setConfirmCancel(null)}
        />
      )}
    </div>
  );
}
