import { useState, useEffect, useCallback } from 'react';
import { useGame } from '@/contexts/GameContext';
import { useAuth } from '@/hooks/useAuth';
import { gameApi } from '@/lib/gameApi';
import { supabase } from '@/integrations/supabase/client';
import { SectionHeader } from '../ui/SectionHeader';
import { GameButton } from '../ui/GameButton';
import { motion, AnimatePresence } from 'framer-motion';
import { Gavel, Clock, User, Coins, Plus, Shield, AlertTriangle, TrendingUp } from 'lucide-react';
import { GEAR_IMAGES, GOOD_IMAGES } from '@/assets/items/index';

interface LiveAuction {
  id: string;
  seller_id: string;
  seller_name: string;
  item_type: string;
  item_id: string;
  item_name: string;
  quantity: number;
  starting_price: number;
  current_bid: number;
  current_bidder_id: string | null;
  current_bidder_name: string | null;
  bid_count: number;
  min_increment: number;
  ends_at: string;
  original_ends_at: string;
  status: string;
}

const ITEM_IMAGES: Record<string, string> = {
  glock: GEAR_IMAGES.glock,
  shotgun: GEAR_IMAGES.shotgun,
  ak47: GEAR_IMAGES.ak47,
  sniper: GEAR_IMAGES.sniper,
  cartel_blade: GEAR_IMAGES.cartelBlade,
  vest: GEAR_IMAGES.vest,
  suit: GEAR_IMAGES.suit,
  skull_armor: GEAR_IMAGES.skullArmor,
  phone: GEAR_IMAGES.phone,
  laptop: GEAR_IMAGES.laptop,
  implant: GEAR_IMAGES.implant,
  drugs: GOOD_IMAGES.drugs,
  weapons: GOOD_IMAGES.weapons,
  tech: GOOD_IMAGES.tech,
  luxury: GOOD_IMAGES.luxury,
  meds: GOOD_IMAGES.meds,
};

function useCountdown(endsAt: string) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const update = () => {
      const diff = new Date(endsAt).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft('VERLOPEN'); setIsUrgent(true); return; }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(m > 0 ? `${m}m ${s}s` : `${s}s`);
      setIsUrgent(diff < 120000); // < 2 min
    };
    update();
    const i = setInterval(update, 1000);
    return () => clearInterval(i);
  }, [endsAt]);

  return { timeLeft, isUrgent };
}

function AuctionCard({ auction, userId }: { auction: LiveAuction; userId: string }) {
  const { showToast } = useGame();
  const { timeLeft, isUrgent } = useCountdown(auction.ends_at);
  const [bidding, setBidding] = useState(false);
  const [customBid, setCustomBid] = useState(0);

  const minBid = auction.current_bid > 0
    ? auction.current_bid + auction.min_increment
    : auction.starting_price;

  const isExpired = timeLeft === 'VERLOPEN';
  const isSeller = auction.seller_id === userId;
  const isWinner = auction.current_bidder_id === userId;
  const image = ITEM_IMAGES[auction.item_id] || GOOD_IMAGES.drugs;

  useEffect(() => { setCustomBid(minBid); }, [minBid]);

  const handleBid = async () => {
    if (bidding) return;
    setBidding(true);
    const res = await gameApi.bidLiveAuction(auction.id, customBid);
    showToast(res.message);
    setBidding(false);
  };

  const handleClaim = async () => {
    const res = await gameApi.claimLiveAuction(auction.id);
    showToast(res.message);
  };

  return (
    <motion.div
      className="game-card p-0 overflow-hidden border-l-[3px] border-l-game-purple"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      layout
    >
      {/* Banner */}
      <div className="relative h-16 overflow-hidden">
        <img src={image} alt={auction.item_name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />

        <div className={`absolute top-1.5 right-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded text-[0.5rem] font-bold backdrop-blur-sm ${
          isUrgent ? 'bg-blood/80 text-white animate-pulse' : 'bg-black/50 text-white'
        }`}>
          <Clock size={8} />
          {timeLeft}
        </div>

        {auction.bid_count > 0 && (
          <div className="absolute top-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded text-[0.5rem] font-bold bg-game-purple/80 text-white backdrop-blur-sm">
            <TrendingUp size={8} />
            {auction.bid_count} bod{auction.bid_count !== 1 ? 'en' : ''}
          </div>
        )}

        <div className="absolute bottom-1 left-2 right-2">
          <h4 className="font-black text-xs text-game-purple drop-shadow-lg">
            {auction.item_name}
            {auction.quantity > 1 && <span className="text-muted-foreground ml-1">x{auction.quantity}</span>}
          </h4>
        </div>
      </div>

      {/* Content */}
      <div className="p-2.5 pt-1.5">
        <div className="flex items-center justify-between text-[0.55rem] mb-2">
          <div className="flex items-center gap-1 text-muted-foreground">
            <User size={9} />
            <span>{auction.seller_name}</span>
          </div>
          <div className="flex items-center gap-1">
            <Coins size={9} className="text-gold" />
            <span className="font-bold text-gold">
              {auction.current_bid > 0 ? `€${auction.current_bid.toLocaleString()}` : `Start €${auction.starting_price.toLocaleString()}`}
            </span>
          </div>
        </div>

        {auction.current_bidder_name && (
          <div className="flex items-center gap-1 text-[0.5rem] text-emerald mb-2">
            <Shield size={8} />
            Hoogste bieder: <span className="font-bold">{auction.current_bidder_name}</span>
            {isWinner && <span className="text-gold ml-1">(JIJ)</span>}
          </div>
        )}

        {/* Actions */}
        {isExpired ? (
          <GameButton variant="gold" size="sm" fullWidth icon={<Gavel size={10} />} onClick={handleClaim}>
            {isWinner ? 'CLAIM ITEM' : isSeller ? 'CLAIM TERUG' : 'SLUIT AF'}
          </GameButton>
        ) : isSeller ? (
          <p className="text-[0.5rem] text-muted-foreground text-center">Je eigen veiling</p>
        ) : (
          <div className="space-y-1.5">
            <div className="flex gap-1.5">
              <input
                type="number"
                value={customBid}
                onChange={(e) => setCustomBid(Math.max(minBid, parseInt(e.target.value) || 0))}
                className="flex-1 bg-muted/30 border border-border rounded px-2 py-1 text-[0.6rem] text-foreground"
                min={minBid}
                step={auction.min_increment}
              />
              <GameButton
                variant="purple"
                size="sm"
                icon={<Gavel size={10} />}
                disabled={bidding || customBid < minBid}
                onClick={handleBid}
              >
                BIED
              </GameButton>
            </div>
            <p className="text-[0.45rem] text-muted-foreground text-center">
              Min. bod: €{minBid.toLocaleString()} · 5% fee bij verkoop
            </p>
            {isUrgent && (
              <div className="flex items-center justify-center gap-1 text-[0.45rem] text-blood">
                <AlertTriangle size={8} />
                Anti-snipe: bieden verlengt de veiling met 2 min
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function LiveAuctionPanel() {
  const { state } = useGame();
  const [auctions, setAuctions] = useState<LiveAuction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const { user } = useAuth();
  const userId = user?.id || '';

  const fetchAuctions = useCallback(async () => {
    const res = await gameApi.getLiveAuctions();
    if (res.success && res.data?.auctions) {
      setAuctions(res.data.auctions);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAuctions();
  }, [fetchAuctions]);

  // Realtime subscription for live updates
  useEffect(() => {
    const channel = supabase
      .channel('live-auctions')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'live_auctions',
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setAuctions(prev => [payload.new as LiveAuction, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setAuctions(prev => prev.map(a =>
            a.id === (payload.new as LiveAuction).id ? payload.new as LiveAuction : a
          ).filter(a => a.status === 'active'));
        } else if (payload.eventType === 'DELETE') {
          setAuctions(prev => prev.filter(a => a.id !== (payload.old as any).id));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <>
      <SectionHeader
        title="Live Veilingen"
        icon={<Gavel size={12} />}
        badge={auctions.length > 0 ? `${auctions.length} actief` : undefined}
      />

      <div className="flex gap-2 mb-3">
        <GameButton
          variant={showCreate ? 'muted' : 'purple'}
          size="sm"
          icon={<Plus size={10} />}
          onClick={() => setShowCreate(!showCreate)}
        >
          {showCreate ? 'ANNULEER' : 'NIEUWE VEILING'}
        </GameButton>
      </div>

      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            <CreateAuctionForm onCreated={() => { setShowCreate(false); fetchAuctions(); }} />
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="game-card text-center py-6">
          <p className="text-[0.6rem] text-muted-foreground">Laden...</p>
        </div>
      ) : auctions.length === 0 ? (
        <div className="game-card text-center py-6 mb-4">
          <Gavel size={24} className="mx-auto mb-2 text-muted-foreground opacity-30" />
          <p className="text-[0.6rem] text-muted-foreground font-bold">Geen actieve veilingen</p>
          <p className="text-[0.5rem] text-muted-foreground">Wees de eerste — plaats een item!</p>
        </div>
      ) : (
        <div className="space-y-3 mb-4">
          <AnimatePresence>
            {auctions.map(auction => (
              <AuctionCard key={auction.id} auction={auction} userId={userId} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </>
  );
}

function CreateAuctionForm({ onCreated }: { onCreated: () => void }) {
  const { state, showToast } = useGame();
  const [itemType, setItemType] = useState<'gear' | 'good' | 'vehicle'>('gear');
  const [itemId, setItemId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(1000);
  const [creating, setCreating] = useState(false);

  // Get owned items
  const ownedGear = state.ownedGear || [];
  const inventory = state.inventory || {};
  const vehicles = state.ownedVehicles || [];

  const handleCreate = async () => {
    if (!itemId || price < 500) return;
    setCreating(true);
    const res = await gameApi.createLiveAuction(itemType, itemId, price, itemType === 'good' ? quantity : 1);
    showToast(res.message);
    if (res.success) onCreated();
    setCreating(false);
  };

  return (
    <div className="game-card border-l-[3px] border-l-game-purple mb-3 space-y-2">
      <h4 className="font-bold text-xs text-game-purple">Nieuw Item Veilen</h4>

      <div className="flex gap-1">
        {(['gear', 'good', 'vehicle'] as const).map(t => (
          <GameButton key={t} variant={itemType === t ? 'purple' : 'muted'} size="sm"
            onClick={() => { setItemType(t); setItemId(''); }}>
            {t === 'gear' ? 'GEAR' : t === 'good' ? 'GOEDEREN' : 'VOERTUIG'}
          </GameButton>
        ))}
      </div>

      <select
        value={itemId}
        onChange={(e) => setItemId(e.target.value)}
        className="w-full bg-muted/30 border border-border rounded px-2 py-1.5 text-[0.6rem] text-foreground"
      >
        <option value="">Selecteer item...</option>
        {itemType === 'gear' && ownedGear.map((g: string) => (
          <option key={g} value={g}>{g}</option>
        ))}
        {itemType === 'good' && Object.entries(inventory).filter(([_, qty]) => (qty as number) > 0).map(([id, qty]) => (
          <option key={id} value={id}>{id} (x{qty as number})</option>
        ))}
        {itemType === 'vehicle' && vehicles.filter((v: any) => v.id !== state.activeVehicle).map((v: any) => (
          <option key={v.id} value={v.id}>{v.id}</option>
        ))}
      </select>

      {itemType === 'good' && itemId && (
        <div>
          <label className="text-[0.5rem] text-muted-foreground">Aantal</label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full bg-muted/30 border border-border rounded px-2 py-1 text-[0.6rem] text-foreground"
            min={1}
            max={(inventory[itemId] as number) || 1}
          />
        </div>
      )}

      <div>
        <label className="text-[0.5rem] text-muted-foreground">Startprijs (min. €500)</label>
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(Math.max(500, parseInt(e.target.value) || 500))}
          className="w-full bg-muted/30 border border-border rounded px-2 py-1 text-[0.6rem] text-foreground"
          min={500}
          step={100}
        />
      </div>

      <GameButton variant="gold" size="sm" fullWidth disabled={!itemId || creating} onClick={handleCreate}>
        {creating ? 'BEZIG...' : `VEILING STARTEN (30 min)`}
      </GameButton>
      <p className="text-[0.45rem] text-muted-foreground text-center">5% fee bij succesvolle verkoop · Anti-snipe bescherming</p>
    </div>
  );
}
