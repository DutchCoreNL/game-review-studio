import { useGame } from '@/contexts/GameContext';
import { SectionHeader } from '../ui/SectionHeader';
import { GameButton } from '../ui/GameButton';
import { motion, AnimatePresence } from 'framer-motion';
import { Gavel, Clock, User, Coins } from 'lucide-react';
import { GEAR_IMAGES, GOOD_IMAGES } from '@/assets/items/index';

const REWARD_IMAGES: Record<string, string> = {
  glock: GEAR_IMAGES.glock,
  drugs: GOOD_IMAGES.drugs,
  luxury: GOOD_IMAGES.luxury,
  meds: GOOD_IMAGES.meds,
  weapons: GOOD_IMAGES.weapons,
  tech: GOOD_IMAGES.tech,
  explosives: GOOD_IMAGES.explosives,
  crypto: GOOD_IMAGES.crypto,
  chemicals: GOOD_IMAGES.chemicals,
  electronics: GOOD_IMAGES.electronics,
};

function getAuctionImage(item: { rewardType: string; rewardId?: string; rewardGoodId?: string }) {
  if (item.rewardId && REWARD_IMAGES[item.rewardId]) return REWARD_IMAGES[item.rewardId];
  if (item.rewardGoodId && REWARD_IMAGES[item.rewardGoodId]) return REWARD_IMAGES[item.rewardGoodId];
  if (item.rewardType === 'rep') return GOOD_IMAGES.luxury; // fallback
  return GOOD_IMAGES.drugs; // fallback
}

export function AuctionPanel() {
  const { state, dispatch, showToast } = useGame();
  const items = state.auctionItems || [];

  if (items.length === 0) {
    return (
      <>
        <SectionHeader title="Zwarte Markt Veiling" icon={<Gavel size={12} />} />
        <div className="game-card mb-4 text-center py-6">
          <Gavel size={24} className="mx-auto mb-2 text-muted-foreground opacity-30" />
          <p className="text-[0.6rem] text-muted-foreground font-bold">Geen veilingen vandaag</p>
          <p className="text-[0.5rem] text-muted-foreground">Nieuwe items verschijnen elke paar dagen.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <SectionHeader title="Zwarte Markt Veiling" icon={<Gavel size={12} />} badge={`${items.length} items`} />
      <div className="space-y-3 mb-4">
        <AnimatePresence>
          {items.map(item => {
            const daysLeft = item.expiresDay - state.day;
            const totalDuration = 3; // auctions last 3 days
            const progress = Math.max(0, Math.min(100, (daysLeft / totalDuration) * 100));
            const bidAmount = Math.floor(item.currentBid * 1.15);
            const canAfford = state.money >= bidAmount;
            const image = getAuctionImage(item);
            const isUrgent = daysLeft <= 1;

            return (
              <motion.div
                key={item.id}
                className="game-card p-0 overflow-hidden border-l-[3px] border-l-game-purple"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                {/* Banner image */}
                <div className="relative h-20 overflow-hidden">
                  <img
                    src={image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />

                  {/* Countdown badge */}
                  <div className={`absolute top-1.5 right-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded text-[0.5rem] font-bold backdrop-blur-sm ${
                    isUrgent
                      ? 'bg-blood/80 text-white animate-pulse'
                      : 'bg-black/50 text-white'
                  }`}>
                    <Clock size={8} />
                    {isUrgent ? 'LAATSTE DAG!' : `${daysLeft} dagen`}
                  </div>

                  {/* Title overlay */}
                  <div className="absolute bottom-1.5 left-2 right-2">
                    <h4 className="font-black text-xs text-game-purple drop-shadow-lg">{item.name}</h4>
                  </div>
                </div>

                {/* Content */}
                <div className="p-2.5 pt-1.5">
                  <p className="text-[0.5rem] text-muted-foreground mb-2">{item.desc}</p>

                  {/* Countdown bar */}
                  <div className="h-1 rounded-full bg-muted/30 mb-2 overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${
                        isUrgent ? 'bg-blood' : 'bg-game-purple'
                      }`}
                      initial={{ width: '100%' }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>

                  <div className="flex items-center gap-3 text-[0.55rem] mb-2">
                    <div className="flex items-center gap-1">
                      <User size={9} className="text-muted-foreground" />
                      <span className="text-muted-foreground">{item.npcBidder}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Coins size={9} className="text-gold" />
                      <span className="font-bold text-gold">€{item.currentBid.toLocaleString()}</span>
                    </div>
                  </div>

                  <GameButton
                    variant="purple"
                    size="sm"
                    fullWidth
                    icon={<Gavel size={10} />}
                    disabled={!canAfford}
                    onClick={() => {
                      dispatch({ type: 'BID_AUCTION', itemId: item.id, amount: bidAmount });
                      showToast(`${item.name} gewonnen voor €${bidAmount.toLocaleString()}!`);
                    }}
                  >
                    BIED €{bidAmount.toLocaleString()}
                  </GameButton>
                  {!canAfford && (
                    <p className="text-[0.45rem] text-blood text-center mt-1">Te weinig geld</p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </>
  );
}
