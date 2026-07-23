import { useState, useEffect, useMemo } from 'react';
import { useGame } from '@/contexts/GameContext';
import { SectionHeader } from '../ui/SectionHeader';
import { GameButton } from '../ui/GameButton';
import { motion, AnimatePresence } from 'framer-motion';
import { Gavel, Clock, User, Coins, Plus, Shield, TrendingUp } from 'lucide-react';
import { GEAR_IMAGES, GOOD_IMAGES, VEHICLE_IMAGES } from '@/assets/items/index';
import { GEAR, VEHICLES } from '@/game/constants';
import type { WorldAuction } from '@/game/world/types';

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
  explosives: GOOD_IMAGES.explosives,
  crypto: GOOD_IMAGES.crypto,
  chemicals: GOOD_IMAGES.chemicals,
  electronics: GOOD_IMAGES.electronics,
  ...VEHICLE_IMAGES,
};

const MIN_INCREMENT = (bid: number) => Math.max(500, Math.floor(bid * 0.05));

function AuctionCard({ auction }: { auction: WorldAuction }) {
  const { state, dispatch, showToast } = useGame();
  const [customBid, setCustomBid] = useState(0);

  const daysLeft = auction.endsDay - state.day;
  const isExpired = auction.status !== 'active' || daysLeft <= 0;
  const isUrgent = !isExpired && daysLeft <= 1;
  const timeLeft = isExpired ? 'VERLOPEN' : `${daysLeft}d`;

  const increment = MIN_INCREMENT(auction.currentBid);
  const minBid = auction.currentBid + increment;

  const isSeller = auction.sellerBotId === null;
  const isWinner = auction.topBidderId === 'player';
  const image = ITEM_IMAGES[auction.itemId] || GOOD_IMAGES.drugs;

  useEffect(() => { setCustomBid(minBid); }, [minBid]);

  const handleBid = () => {
    if (customBid < minBid) return;
    if (state.money < customBid) { showToast('Niet genoeg geld voor dit bod.', true); return; }
    dispatch({ type: 'AUCTION_BID', auctionId: auction.id, amount: customBid });
    showToast(`Bod van €${customBid.toLocaleString()} geplaatst op ${auction.itemName}.`);
  };

  const handleClaim = () => {
    if (isWinner) {
      dispatch({ type: 'AUCTION_CLAIM', auctionId: auction.id });
      showToast(`${auction.itemName} geclaimd!`);
    }
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
        <img src={image} alt={auction.itemName} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />

        <div className={`absolute top-1.5 right-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded text-[0.5rem] font-bold backdrop-blur-sm ${
          isUrgent ? 'bg-blood/80 text-white animate-pulse' : 'bg-black/50 text-white'
        }`}>
          <Clock size={8} />
          {timeLeft}
        </div>

        {auction.bidCount > 0 && (
          <div className="absolute top-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded text-[0.5rem] font-bold bg-game-purple/80 text-white backdrop-blur-sm">
            <TrendingUp size={8} />
            {auction.bidCount} bod{auction.bidCount !== 1 ? 'en' : ''}
          </div>
        )}

        <div className="absolute bottom-1 left-2 right-2">
          <h4 className="font-black text-xs text-game-purple drop-shadow-lg">
            {auction.itemName}
          </h4>
        </div>
      </div>

      {/* Content */}
      <div className="p-2.5 pt-1.5">
        <div className="flex items-center justify-between text-[0.55rem] mb-2">
          <div className="flex items-center gap-1 text-muted-foreground">
            <User size={9} />
            <span>{auction.sellerName}</span>
          </div>
          <div className="flex items-center gap-1">
            <Coins size={9} className="text-gold" />
            <span className="font-bold text-gold">
              {auction.bidCount > 0 ? `€${auction.currentBid.toLocaleString()}` : `Start €${auction.startingPrice.toLocaleString()}`}
            </span>
          </div>
        </div>

        {auction.topBidderName && (
          <div className="flex items-center gap-1 text-[0.5rem] text-emerald mb-2">
            <Shield size={8} />
            Hoogste bieder: <span className="font-bold">{auction.topBidderName}</span>
            {isWinner && <span className="text-gold ml-1">(JIJ)</span>}
          </div>
        )}

        {/* Actions */}
        {isExpired ? (
          isWinner ? (
            <GameButton variant="gold" size="sm" fullWidth icon={<Gavel size={10} />} onClick={handleClaim}>
              CLAIM ITEM
            </GameButton>
          ) : (
            <p className="text-[0.5rem] text-muted-foreground text-center">Veiling afgelopen</p>
          )
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
                step={increment}
              />
              <GameButton
                variant="purple"
                size="sm"
                icon={<Gavel size={10} />}
                disabled={customBid < minBid || state.money < customBid}
                onClick={handleBid}
              >
                BIED
              </GameButton>
            </div>
            <p className="text-[0.45rem] text-muted-foreground text-center">
              Min. bod: €{minBid.toLocaleString()} · 5% fee bij verkoop
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function LiveAuctionPanel() {
  const { state } = useGame();
  const [showCreate, setShowCreate] = useState(false);

  // Live auctions come straight from the local world sim — bots list items and outbid you.
  const auctions = useMemo(() =>
    (state.world?.auctions || [])
      .filter(a => a.status === 'active' || (a.topBidderId === 'player'))
      .sort((a, b) => a.endsDay - b.endsDay),
    [state.world?.auctions]);

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
            <CreateAuctionForm onCreated={() => setShowCreate(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {auctions.length === 0 ? (
        <div className="game-card text-center py-6 mb-4">
          <Gavel size={24} className="mx-auto mb-2 text-muted-foreground opacity-30" />
          <p className="text-[0.6rem] text-muted-foreground font-bold">Geen actieve veilingen</p>
          <p className="text-[0.5rem] text-muted-foreground">Wees de eerste — plaats een item!</p>
        </div>
      ) : (
        <div className="space-y-3 mb-4">
          <AnimatePresence>
            {auctions.map(auction => (
              <AuctionCard key={auction.id} auction={auction} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </>
  );
}

function CreateAuctionForm({ onCreated }: { onCreated: () => void }) {
  const { state, dispatch, showToast } = useGame();
  const [itemType, setItemType] = useState<'gear' | 'vehicle'>('gear');
  const [itemId, setItemId] = useState('');
  const [price, setPrice] = useState(1000);

  // Only gear and vehicles can be auctioned (single, unique items).
  const ownedGear = state.ownedGear || [];
  const vehicles = (state.ownedVehicles || []).filter(v => v.id !== state.activeVehicle);

  const handleCreate = () => {
    if (!itemId || price < 500) return;
    dispatch({ type: 'CREATE_AUCTION', itemType, itemId, startingPrice: price, quantity: 1 });
    const name = itemType === 'vehicle'
      ? VEHICLES.find(v => v.id === itemId)?.name
      : GEAR.find(g => g.id === itemId)?.name;
    showToast(`${name || itemId} in de veiling gezet.`);
    onCreated();
  };

  return (
    <div className="game-card border-l-[3px] border-l-game-purple mb-3 space-y-2">
      <h4 className="font-bold text-xs text-game-purple">Nieuw Item Veilen</h4>

      <div className="flex gap-1">
        {(['gear', 'vehicle'] as const).map(t => (
          <GameButton key={t} variant={itemType === t ? 'purple' : 'muted'} size="sm"
            onClick={() => { setItemType(t); setItemId(''); }}>
            {t === 'gear' ? 'GEAR' : 'VOERTUIG'}
          </GameButton>
        ))}
      </div>

      <select
        value={itemId}
        onChange={(e) => setItemId(e.target.value)}
        className="w-full bg-muted/30 border border-border rounded px-2 py-1.5 text-[0.6rem] text-foreground"
      >
        <option value="">Selecteer item...</option>
        {itemType === 'gear' && ownedGear.map((g) => (
          <option key={g} value={g}>{GEAR.find(x => x.id === g)?.name || g}</option>
        ))}
        {itemType === 'vehicle' && vehicles.map((v) => (
          <option key={v.id} value={v.id}>{VEHICLES.find(x => x.id === v.id)?.name || v.id}</option>
        ))}
      </select>

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

      <GameButton variant="gold" size="sm" fullWidth disabled={!itemId} onClick={handleCreate}>
        VEILING STARTEN (2 dagen)
      </GameButton>
      <p className="text-[0.45rem] text-muted-foreground text-center">5% fee bij succesvolle verkoop · bots bieden mee</p>
    </div>
  );
}
