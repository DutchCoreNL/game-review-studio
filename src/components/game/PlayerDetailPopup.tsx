import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Coins, Calendar, MapPin, Users, Brain, Shield, Car, Building2, Swords, Heart, TrendingUp, Trophy, Skull, Loader2 } from 'lucide-react';
import { InfoRow } from './ui/InfoRow';
import { SectionHeader } from './ui/SectionHeader';
import { StatBar } from './ui/StatBar';
import { GameBadge } from './ui/GameBadge';
import { gameApi } from '@/lib/gameApi';

interface PlayerDetailProps {
  /** Either pass full player data (leaderboard) or just userId to fetch */
  player?: {
    username: string;
    rep: number;
    cash: number;
    day: number;
    level: number;
    districts_owned: number;
    crew_size: number;
    karma: number;
    backstory: string | null;
    updated_at: string;
  };
  userId?: string;
  onClose: () => void;
}

const BACKSTORY_LABELS: Record<string, string> = {
  weduwnaar: '💀 De Weduwnaar',
  bankier: '💰 De Bankier',
  straatkind: '🔪 Het Straatkind',
};

const PHASE_LABELS: Record<string, string> = {
  straatdealer: '🔰 Straatdealer',
  dealer: '📦 Dealer',
  onderbaas: '⚔️ Onderbaas',
  kingpin: '👑 Kingpin',
};

interface PublicProfile {
  username: string;
  memberSince: string | null;
  level: number;
  xp: number;
  rep: number;
  karma: number;
  hp: number;
  maxHp: number;
  loc: string;
  locName: string;
  backstory: string | null;
  endgamePhase: string;
  day: number;
  wealth: number;
  stats: Record<string, number>;
  hospitalizations: number;
  totalEarned: number;
  tradesCompleted: number;
  missionsCompleted: number;
  casinoWon: number;
  casinoLost: number;
  gear: { id: string; name: string; type: string }[];
  vehicles: { id: string; name: string; active: boolean; condition: number }[];
  districts: { id: string; name: string; rep: number }[];
  businesses: { id: string; name: string }[];
  crew: { name: string; role: string; level: number; spec: string | null }[];
}

export function PlayerDetailPopup({ player, userId, onClose }: PlayerDetailProps) {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      setLoading(true);
      gameApi.getPublicProfile(userId).then(res => {
        if (res.success && res.data) {
          setProfile(res.data as unknown as PublicProfile);
        } else {
          setError(res.message);
        }
        setLoading(false);
      }).catch(() => {
        setError('Kon profiel niet laden.');
        setLoading(false);
      });
    }
  }, [userId]);

  // Legacy mode: simple leaderboard data
  if (player && !userId) {
    return <LegacyPopup player={player} onClose={onClose} />;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        onClick={e => e.stopPropagation()}
        className="game-card w-full max-w-[380px] max-h-[85vh] overflow-y-auto border-gold/40"
      >
        {loading && (
          <div className="flex flex-col items-center py-8">
            <Loader2 size={24} className="animate-spin text-gold mb-2" />
            <span className="text-xs text-muted-foreground">Profiel laden...</span>
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <Skull size={24} className="text-blood mx-auto mb-2" />
            <p className="text-xs text-blood">{error}</p>
            <button onClick={onClose} className="mt-2 text-xs text-muted-foreground underline">Sluiten</button>
          </div>
        )}

        {profile && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-display text-lg font-bold text-gold tracking-wider">{profile.username}</h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <GameBadge variant="gold" size="xs">Lv.{profile.level}</GameBadge>
                  <GameBadge variant="muted" size="xs">{PHASE_LABELS[profile.endgamePhase] || profile.endgamePhase}</GameBadge>
                  {profile.backstory && (
                    <span className="text-[0.45rem] text-muted-foreground">{BACKSTORY_LABELS[profile.backstory] || profile.backstory}</span>
                  )}
                </div>
              </div>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            {/* HP bar */}
            <div className="mb-3">
              <div className="flex items-center justify-between text-[0.45rem] mb-0.5">
                <span className="flex items-center gap-1 text-muted-foreground"><Heart size={8} /> HP</span>
                <span className="font-bold">{profile.hp}/{profile.maxHp}</span>
              </div>
              <StatBar value={profile.hp} max={profile.maxHp} color="blood" height="sm" />
            </div>

            {/* Core stats */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <InfoRow icon={<Star size={10} />} label="Reputatie" value={`${profile.rep}`} valueClass="text-gold" />
              <InfoRow icon={<Coins size={10} />} label="Vermogen" value={`€${profile.wealth.toLocaleString()}`} valueClass="text-emerald" />
              <InfoRow icon={<MapPin size={10} />} label="Locatie" value={profile.locName} />
              <InfoRow icon={<Calendar size={10} />} label="Dag" value={`${profile.day}`} />
              <InfoRow icon={<Brain size={10} />} label="Karma" value={`${profile.karma}`} valueClass={profile.karma > 20 ? 'text-emerald' : profile.karma < -20 ? 'text-blood' : ''} />
              <InfoRow icon={<Swords size={10} />} label="Muscle" value={`${profile.stats?.muscle || 1}`} />
              <InfoRow icon={<Brain size={10} />} label="Brains" value={`${profile.stats?.brains || 1}`} />
              <InfoRow icon={<Star size={10} />} label="Charm" value={`${profile.stats?.charm || 1}`} />
            </div>

            {/* Districts */}
            {profile.districts.length > 0 && (
              <>
                <SectionHeader title="Districten" icon={<MapPin size={10} />} badge={`${profile.districts.length}`} badgeColor="blood" />
                <div className="flex flex-wrap gap-1 mb-3">
                  {profile.districts.map(d => (
                    <GameBadge key={d.id} variant="blood" size="xs">{d.name}</GameBadge>
                  ))}
                </div>
              </>
            )}

            {/* Businesses */}
            {profile.businesses.length > 0 && (
              <>
                <SectionHeader title="Bedrijven" icon={<Building2 size={10} />} badge={`${profile.businesses.length}`} badgeColor="emerald" />
                <div className="flex flex-wrap gap-1 mb-3">
                  {profile.businesses.map(b => (
                    <GameBadge key={b.id} variant="emerald" size="xs">{b.name}</GameBadge>
                  ))}
                </div>
              </>
            )}

            {/* Vehicles */}
            {profile.vehicles.length > 0 && (
              <>
                <SectionHeader title="Voertuigen" icon={<Car size={10} />} badge={`${profile.vehicles.length}`} badgeColor="gold" />
                <div className="space-y-1 mb-3">
                  {profile.vehicles.map(v => (
                    <div key={v.id} className="flex items-center justify-between text-[0.5rem]">
                      <span className={v.active ? 'text-gold font-bold' : 'text-muted-foreground'}>{v.name} {v.active && '⭐'}</span>
                      <span className="text-muted-foreground">{v.condition}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Gear */}
            {profile.gear.length > 0 && (
              <>
                <SectionHeader title="Uitrusting" icon={<Shield size={10} />} badge={`${profile.gear.length}`} badgeColor="purple" />
                <div className="flex flex-wrap gap-1 mb-3">
                  {profile.gear.map(g => (
                    <GameBadge key={g.id} variant="purple" size="xs">{g.name}</GameBadge>
                  ))}
                </div>
              </>
            )}

            {/* Crew */}
            {profile.crew.length > 0 && (
              <>
                <SectionHeader title="Crew" icon={<Users size={10} />} badge={`${profile.crew.length}`} badgeColor="gold" />
                <div className="space-y-1 mb-3">
                  {profile.crew.map((c, i) => (
                    <div key={i} className="flex items-center justify-between text-[0.5rem]">
                      <span className="text-foreground font-bold">{c.name}</span>
                      <div className="flex items-center gap-1">
                        <GameBadge variant="muted" size="xs">{c.role}</GameBadge>
                        <span className="text-muted-foreground">Lv.{c.level}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Statistics */}
            <SectionHeader title="Statistieken" icon={<TrendingUp size={10} />} />
            <div className="grid grid-cols-2 gap-2 mb-2">
              <InfoRow icon={<Coins size={10} />} label="Totaal Verdiend" value={`€${profile.totalEarned.toLocaleString()}`} valueClass="text-emerald" />
              <InfoRow icon={<Swords size={10} />} label="Missies" value={`${profile.missionsCompleted}`} />
              <InfoRow icon={<TrendingUp size={10} />} label="Trades" value={`${profile.tradesCompleted}`} />
              <InfoRow icon={<Trophy size={10} />} label="Casino W/L" value={`€${profile.casinoWon.toLocaleString()} / €${profile.casinoLost.toLocaleString()}`} valueClass="text-gold" />
              <InfoRow icon={<Heart size={10} />} label="Hospitalisaties" value={`${profile.hospitalizations}`} valueClass="text-blood" />
            </div>

            {profile.memberSince && (
              <p className="text-[0.4rem] text-muted-foreground text-right mt-2">
                Lid sinds {new Date(profile.memberSince).toLocaleDateString('nl-NL')}
              </p>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}

/** Legacy popup for leaderboard entries (no server fetch needed) */
function LegacyPopup({ player, onClose }: { player: NonNullable<PlayerDetailProps['player']>; onClose: () => void }) {
  const karmaLabel = player.karma > 20 ? '😇 Goed' : player.karma < -20 ? '😈 Kwaad' : '😐 Neutraal';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        onClick={e => e.stopPropagation()}
        className="game-card w-full max-w-[340px] border-gold/40"
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-display text-lg font-bold text-gold tracking-wider">{player.username}</h2>
            <p className="text-[0.55rem] text-muted-foreground">
              Level {player.level} • {player.backstory ? BACKSTORY_LABELS[player.backstory] || player.backstory : 'Onbekend'}
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <InfoRow icon={<Star size={10} />} label="Reputatie" value={`${player.rep}`} valueClass="text-gold" />
          <InfoRow icon={<Coins size={10} />} label="Vermogen" value={`€${player.cash.toLocaleString()}`} valueClass="text-emerald" />
          <InfoRow icon={<Calendar size={10} />} label="Dag" value={`${player.day}`} />
          <InfoRow icon={<MapPin size={10} />} label="Districten" value={`${player.districts_owned}`} valueClass="text-blood" />
          <InfoRow icon={<Users size={10} />} label="Crew" value={`${player.crew_size}`} />
          <InfoRow icon={<Brain size={10} />} label="Karma" value={karmaLabel} valueClass={player.karma > 20 ? 'text-emerald' : player.karma < -20 ? 'text-blood' : ''} />
        </div>

        <p className="text-[0.45rem] text-muted-foreground mt-3 text-right">
          Laatst bijgewerkt: {new Date(player.updated_at).toLocaleDateString('nl-NL')}
        </p>
      </motion.div>
    </div>
  );
}
