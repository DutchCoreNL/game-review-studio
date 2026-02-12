import { useGame } from '@/contexts/GameContext';
import { GOODS, GEAR } from '@/game/constants';
import { SectionHeader } from '../ui/SectionHeader';
import { GameButton } from '../ui/GameButton';
import { motion, AnimatePresence } from 'framer-motion';
import { Gavel, Clock, User, Coins } from 'lucide-react';

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
      <div className="space-y-2 mb-4">
        <AnimatePresence>
          {items.map(item => {
            const daysLeft = item.expiresDay - state.day;
            const bidAmount = Math.floor(item.currentBid * 1.15);
            const canAfford = state.money >= bidAmount;

            return (
              <motion.div
                key={item.id}
                className="game-card border-l-[3px] border-l-game-purple"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="flex items-start justify-between mb-1.5">
                  <div>
                    <h4 className="font-bold text-xs text-game-purple">{item.name}</h4>
                    <p className="text-[0.5rem] text-muted-foreground">{item.desc}</p>
                  </div>
                  <div className="flex items-center gap-1 text-[0.5rem] text-muted-foreground">
                    <Clock size={9} />
                    <span className={daysLeft <= 1 ? 'text-blood font-bold' : ''}>{daysLeft}d</span>
                  </div>
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

                <div className="flex items-center gap-2">
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
                </div>
                {!canAfford && (
                  <p className="text-[0.45rem] text-blood text-center mt-1">Te weinig geld</p>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </>
  );
}
