import { useState, useEffect } from 'react';
import { useGame } from '@/contexts/GameContext';
import { gameApi } from '@/lib/gameApi';
import { SectionHeader } from './ui/SectionHeader';
import { GameButton } from './ui/GameButton';
import { GameBadge } from './ui/GameBadge';
import { StatBar } from './ui/StatBar';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Skull, Crown, Swords, DollarSign, Clock, Shield, Eye, X } from 'lucide-react';
import { BOUNTY_IMAGES } from '@/assets/items';
import { DISTRICTS } from '@/game/constants';

interface MostWantedEntry {
  rank: number;
  userId: string;
  username: string;
  totalBounty: number;
  bountyCount: number;
}

interface RivalEntry {
  userId: string;
  username: string;
  score: number;
  source: string;
  level: number;
  rep: number;
  loc: string;
  lastInteraction: string;
}

interface BountyEntry {
  id: string;
  targetId: string;
  targetName: string;
  placerName: string;
  amount: number;
  expiresAt: string;
}

export function MostWantedView() {
  const { state, showToast } = useGame();
  const [tab, setTab] = useState<'wanted' | 'rivals' | 'bounties' | 'on_me'>('wanted');
  const [mostWanted, setMostWanted] = useState<MostWantedEntry[]>([]);
  const [myRivals, setMyRivals] = useState<RivalEntry[]>([]);
  const [activeBounties, setActiveBounties] = useState<BountyEntry[]>([]);
  const [myBounties, setMyBounties] = useState<{ id: string; placerName: string; amount: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [placingBounty, setPlacingBounty] = useState<string | null>(null);
  const [bountyAmount, setBountyAmount] = useState(5000);

  const fetchData = async () => {
    setLoading(true);
    const res = await gameApi.getMostWanted();
    if (res.success && res.data) {
      setMostWanted(res.data.mostWanted || []);
      setMyRivals(res.data.myRivals || []);
      setActiveBounties(res.data.activeBounties || []);
      setMyBounties(res.data.myBounties || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handlePlaceBounty = async (targetId: string) => {
    const res = await gameApi.placeBounty(targetId, bountyAmount);
    if (res.success) {
      showToast(res.message || 'Premie geplaatst!');
      setPlacingBounty(null);
      fetchData();
    } else {
      showToast(res.message || 'Mislukt.', true);
    }
  };

  const totalBountyOnMe = myBounties.reduce((s, b) => s + b.amount, 0);

  const RANK_COLORS = ['text-gold', 'text-muted-foreground', 'text-blood'];

  return (
    <div className="space-y-3">
      {/* Banner */}
      <div className="relative h-24 rounded-lg overflow-hidden -mx-1">
        <img src={BOUNTY_IMAGES.board} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
        <div className="absolute bottom-2 left-3">
          <div className="flex items-center gap-2">
            <Target size={16} className="text-blood" />
            <span className="text-sm font-display text-blood uppercase tracking-wider font-bold">Most Wanted</span>
          </div>
          {totalBountyOnMe > 0 && (
            <span className="text-[0.5rem] text-blood font-semibold">
              ⚠️ €{totalBountyOnMe.toLocaleString()} premie op jouw hoofd!
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1">
        {([
          { id: 'wanted' as const, label: '🏴 GEZOCHT', badge: mostWanted.length },
          { id: 'rivals' as const, label: '⚔️ RIVALEN', badge: myRivals.length },
          { id: 'bounties' as const, label: '🎯 PREMIES', badge: activeBounties.length },
          { id: 'on_me' as const, label: '💀 OP MIJ', badge: myBounties.length },
        ]).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-1.5 rounded text-[0.45rem] font-bold uppercase tracking-wider transition-all ${
              tab === t.id
                ? 'bg-blood/15 border border-blood text-blood'
                : 'bg-muted border border-border text-muted-foreground'
            }`}
          >
            {t.label}
            {t.badge > 0 && (
              <span className="ml-0.5 text-[0.35rem] bg-blood text-primary-foreground rounded-full px-1">
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground text-xs py-8">Laden...</div>
      ) : (
        <>
          {/* MOST WANTED TAB */}
          {tab === 'wanted' && (
            <div className="space-y-2">
              <p className="text-[0.5rem] text-muted-foreground">
                De meest gezochte spelers — versla ze om hun premie te claimen!
              </p>
              {mostWanted.length === 0 ? (
                <div className="text-center text-muted-foreground text-xs py-6">
                  <Target size={24} className="mx-auto mb-2 opacity-30" />
                  Geen actieve premies. De straten zijn rustig... voorlopig.
                </div>
              ) : (
                mostWanted.map((w, i) => (
                  <motion.div
                    key={w.userId}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`game-card flex items-center gap-3 ${i === 0 ? 'border-l-[3px] border-l-gold' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-display font-bold text-sm ${
                      i === 0 ? 'bg-gold/20 text-gold' : i === 1 ? 'bg-muted text-foreground' : 'bg-blood/10 text-blood'
                    }`}>
                      #{w.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs truncate">{w.username}</span>
                        {w.bountyCount > 1 && (
                          <span className="text-[0.4rem] text-blood bg-blood/10 px-1 rounded font-semibold">
                            {w.bountyCount}x
                          </span>
                        )}
                      </div>
                      <span className="text-[0.55rem] text-gold font-semibold">
                        💰 €{w.totalBounty.toLocaleString()} premie
                      </span>
                    </div>
                    <GameButton
                      variant="blood"
                      size="sm"
                      onClick={() => setPlacingBounty(w.userId)}
                    >
                      <Target size={10} className="mr-1" />PREMIE
                    </GameButton>
                  </motion.div>
                ))
              )}
            </div>
          )}

          {/* RIVALS TAB */}
          {tab === 'rivals' && (
            <div className="space-y-2">
              <p className="text-[0.5rem] text-muted-foreground">
                Spelers waarmee je een rivaliteit hebt opgebouwd door PvP, premies of territoriumconflicten.
              </p>
              {myRivals.length === 0 ? (
                <div className="text-center text-muted-foreground text-xs py-6">
                  <Swords size={24} className="mx-auto mb-2 opacity-30" />
                  Geen rivalen. Val iemand aan of zet een premie om rivaliteit te creëren.
                </div>
              ) : (
                myRivals.map((r, i) => {
                  const sourceLabel = { pvp: '⚔️ PvP', bounty: '🎯 Premie', territory: '🏴 Territorium', trade: '📈 Handel' }[r.source] || r.source;
                  const distName = DISTRICTS[r.loc]?.name || r.loc;
                  const threatLevel = r.score >= 50 ? 'AARTSVIJAND' : r.score >= 25 ? 'RIVAAL' : 'TEGENSTANDER';
                  const threatColor = r.score >= 50 ? 'text-blood' : r.score >= 25 ? 'text-gold' : 'text-muted-foreground';
                  return (
                    <motion.div
                      key={r.userId}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="game-card"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded bg-blood/10 flex items-center justify-center">
                            <Skull size={14} className="text-blood" />
                          </div>
                          <div>
                            <span className="font-bold text-xs">{r.username}</span>
                            <div className="flex items-center gap-1 text-[0.45rem] text-muted-foreground">
                              <span>Lv.{r.level}</span>
                              <span>•</span>
                              <span>{distName}</span>
                              <span>•</span>
                              <span>{sourceLabel}</span>
                            </div>
                          </div>
                        </div>
                        <span className={`text-[0.45rem] font-bold uppercase ${threatColor}`}>{threatLevel}</span>
                      </div>
                      <StatBar value={Math.min(r.score, 100)} max={100} color="blood" height="sm" />
                      <div className="flex gap-1.5 mt-2">
                        <GameButton variant="blood" size="sm" fullWidth onClick={() => setPlacingBounty(r.userId)}>
                          <Target size={9} className="mr-1" />PREMIE
                        </GameButton>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          )}

          {/* ACTIVE BOUNTIES TAB */}
          {tab === 'bounties' && (
            <div className="space-y-2">
              <p className="text-[0.5rem] text-muted-foreground">
                Alle actieve premies — versla het doelwit om de premie te claimen!
              </p>
              {activeBounties.length === 0 ? (
                <div className="text-center text-muted-foreground text-xs py-6">
                  <DollarSign size={24} className="mx-auto mb-2 opacity-30" />
                  Geen actieve premies op dit moment.
                </div>
              ) : (
                activeBounties.map((b, i) => {
                  const expiresIn = Math.max(0, Math.floor((new Date(b.expiresAt).getTime() - Date.now()) / 3600000));
                  return (
                    <motion.div
                      key={b.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="game-card flex items-center gap-3"
                    >
                      <div className="w-8 h-8 rounded bg-gold/10 flex items-center justify-center">
                        <DollarSign size={14} className="text-gold" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-xs truncate">{b.targetName}</div>
                        <div className="text-[0.5rem] text-muted-foreground">
                          Geplaatst door {b.placerName} • <Clock size={8} className="inline" /> {expiresIn}u
                        </div>
                      </div>
                      <span className="text-gold font-bold text-xs">€{b.amount.toLocaleString()}</span>
                    </motion.div>
                  );
                })
              )}
            </div>
          )}

          {/* BOUNTIES ON ME TAB */}
          {tab === 'on_me' && (
            <div className="space-y-2">
              {myBounties.length === 0 ? (
                <div className="text-center text-muted-foreground text-xs py-6">
                  <Shield size={24} className="mx-auto mb-2 opacity-30" />
                  Geen premies op jouw hoofd. Veilig... voor nu.
                </div>
              ) : (
                <>
                  <div className="game-card bg-blood/5 border-blood/20">
                    <div className="text-center">
                      <span className="text-blood text-lg font-display font-bold">
                        €{totalBountyOnMe.toLocaleString()}
                      </span>
                      <p className="text-[0.5rem] text-blood/80">Totale premie op jouw hoofd</p>
                    </div>
                  </div>
                  {myBounties.map((b, i) => (
                    <div key={b.id} className="game-card flex items-center gap-3">
                      <Skull size={14} className="text-blood" />
                      <div className="flex-1">
                        <span className="text-xs font-semibold">{b.placerName}</span>
                        <span className="text-[0.5rem] text-muted-foreground ml-1">wil je dood</span>
                      </div>
                      <span className="text-blood font-bold text-xs">€{b.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* Place Bounty Dialog */}
      <AnimatePresence>
        {placingBounty && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/70 z-[9000] backdrop-blur-sm"
              onClick={() => setPlacingBounty(null)}
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="fixed left-4 right-4 top-1/3 z-[9001] max-w-[400px] mx-auto"
            >
              <div className="game-card border-t-[3px] border-t-blood">
                <button onClick={() => setPlacingBounty(null)} className="absolute top-3 right-3 text-muted-foreground">
                  <X size={14} />
                </button>
                <h3 className="font-display text-sm font-bold mb-3 flex items-center gap-2">
                  <Target size={14} className="text-blood" /> Premie Plaatsen
                </h3>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {[1000, 5000, 10000, 25000, 50000, 100000].map(amt => (
                    <button
                      key={amt}
                      onClick={() => setBountyAmount(amt)}
                      className={`text-[0.5rem] px-2 py-1 rounded border font-semibold transition-colors ${
                        bountyAmount === amt
                          ? 'bg-blood/15 text-blood border-blood/30'
                          : 'bg-muted/50 text-muted-foreground border-border hover:border-blood/20'
                      }`}
                    >
                      €{(amt / 1000).toFixed(0)}k
                    </button>
                  ))}
                </div>
                <GameButton
                  variant="blood"
                  size="lg"
                  fullWidth
                  disabled={state.money < bountyAmount}
                  glow={state.money >= bountyAmount}
                  onClick={() => handlePlaceBounty(placingBounty)}
                >
                  🎯 PLAATS PREMIE — €{bountyAmount.toLocaleString()}
                </GameButton>
                <p className="text-[0.45rem] text-muted-foreground mt-2 text-center">
                  Premie verloopt na 7 dagen als niemand het doelwit verslaat
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
