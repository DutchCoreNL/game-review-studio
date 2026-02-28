import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Crown, Shield, MapPin, Swords, MessageSquare, Plus, Coins, RefreshCw, Loader2, Star, Trash2, UserPlus, LogOut, ChevronUp, Send, ArrowLeft, TrendingUp, Zap, Eye, DoorOpen, BookOpen, Handshake } from 'lucide-react';
import { gameApi } from '@/lib/gameApi';
import { useAuth } from '@/hooks/useAuth';
import { GameButton } from './ui/GameButton';
import { GameBadge } from './ui/GameBadge';
import { SectionHeader } from './ui/SectionHeader';
import { StatBar } from './ui/StatBar';
import { Progress } from '@/components/ui/progress';
import { InfoRow } from './ui/InfoRow';
import { SubTabBar } from './ui/SubTabBar';
import { ConfirmDialog } from './ConfirmDialog';
import { supabase } from '@/integrations/supabase/client';
import { GangArcPanel } from './gang/GangArcPanel';
import { GangAlliancePanel } from './mmo/GangAlliancePanel';

type GangTab = 'overview' | 'members' | 'territory' | 'wars' | 'chat' | 'browse' | 'arcs' | 'alliances';

const DISTRICT_NAMES: Record<string, string> = {
  low: 'Lowrise', port: 'Port Nero', iron: 'Iron Borough', neon: 'Neon Strip', crown: 'Crown Heights',
};

const GANG_LEVEL_XP = (level: number) => level * 500;
const GANG_LEVEL_BONUSES: Record<number, string> = {
  1: 'Basis: 20 leden',
  2: '+2 leden, +5% war score',
  3: '+2 leden, +10% war score',
  5: '+2 leden, -10% territory kosten',
  7: '+2 leden, +15% war score',
  10: '+2 leden, -25% territory kosten',
};

export function GangView() {
  const { user } = useAuth();
  const [tab, setTab] = useState<GangTab>('overview');
  const [gang, setGang] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [territories, setTerritories] = useState<any[]>([]);
  const [activeWars, setActiveWars] = useState<any[]>([]);
  const [myRole, setMyRole] = useState<string | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [invites, setInvites] = useState<any[]>([]);
  const [gangsList, setGangsList] = useState<any[]>([]);
  const [selectedGang, setSelectedGang] = useState<any>(null);
  const [toast, setToast] = useState('');

  // Create gang state
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createTag, setCreateTag] = useState('');
  const [createDesc, setCreateDesc] = useState('');

  // Donate state
  const [donateAmount, setDonateAmount] = useState('');

  // Chat state
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Confirm dialogs
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmKick, setConfirmKick] = useState<string | null>(null);

  const showMsg = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchGang = useCallback(async () => {
    setLoading(true);
    const res = await gameApi.getGang();
    if (res.success && res.data) {
      setGang(res.data.gang);
      setMembers(res.data.members || []);
      setTerritories(res.data.territories || []);
      setActiveWars(res.data.activeWars || []);
      setMyRole(res.data.myRole);
      setIsMember(res.data.isMember);
    } else {
      setGang(null);
      setIsMember(false);
    }
    setLoading(false);
  }, []);

  const fetchInvites = useCallback(async () => {
    const res = await gameApi.getGangInvites();
    if (res.success && res.data) setInvites(res.data.invites || []);
  }, []);

  const fetchGangsList = useCallback(async () => {
    const res = await gameApi.listGangs();
    if (res.success && res.data) setGangsList(res.data.gangs || []);
  }, []);

  useEffect(() => { fetchGang(); fetchInvites(); }, [fetchGang, fetchInvites]);

  // Chat realtime subscription
  useEffect(() => {
    if (!gang?.id) return;

    // Fetch initial messages
    supabase.from('gang_chat').select('*').eq('gang_id', gang.id)
      .order('created_at', { ascending: true }).limit(50)
      .then(({ data }) => { if (data) setChatMessages(data); });

    const channel = supabase.channel(`gang-chat-${gang.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'gang_chat', filter: `gang_id=eq.${gang.id}` },
        (payload) => { setChatMessages(prev => [...prev.slice(-99), payload.new]); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [gang?.id]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  const handleCreate = async () => {
    const res = await gameApi.createGang(createName, createTag, createDesc);
    showMsg(res.message);
    if (res.success) { setShowCreate(false); fetchGang(); }
  };

  const handleAcceptInvite = async (inviteId: string) => {
    const res = await gameApi.gangAcceptInvite(inviteId);
    showMsg(res.message);
    if (res.success) { fetchGang(); fetchInvites(); }
  };

  const handleLeave = async () => {
    const res = await gameApi.gangLeave();
    showMsg(res.message);
    if (res.success) { setConfirmLeave(false); fetchGang(); }
  };

  const handleKick = async (targetUserId: string) => {
    const res = await gameApi.gangKick(targetUserId);
    showMsg(res.message);
    if (res.success) { setConfirmKick(null); fetchGang(); }
  };

  const handlePromote = async (targetUserId: string, newRole: string) => {
    const res = await gameApi.gangPromote(targetUserId, newRole);
    showMsg(res.message);
    if (res.success) fetchGang();
  };

  const handleDonate = async () => {
    const amt = parseInt(donateAmount);
    if (isNaN(amt) || amt < 1000) { showMsg('Minimaal €1.000'); return; }
    const res = await gameApi.gangDonate(amt);
    showMsg(res.message);
    if (res.success) { setDonateAmount(''); fetchGang(); }
  };

  const handleClaimTerritory = async (districtId: string) => {
    const res = await gameApi.gangClaimTerritory(districtId);
    showMsg(res.message);
    if (res.success) fetchGang();
  };

  const handleDeclareWar = async (targetGangId: string, districtId?: string) => {
    const res = await gameApi.gangDeclareWar(targetGangId, districtId);
    showMsg(res.message);
    if (res.success) fetchGang();
  };

  const handleWarAttack = async (warId: string) => {
    const res = await gameApi.gangWarAttack(warId);
    showMsg(res.message);
    if (res.success) fetchGang();
  };

  const handleJoinGang = async (gangId: string) => {
    const res = await gameApi.joinGang(gangId);
    showMsg(res.message);
    if (res.success) { fetchGang(); }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    await gameApi.gangChat(chatInput);
    setChatInput('');
  };

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-gold" /></div>;
  }

  // Toast
  const toastEl = toast ? (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[9999] bg-background border border-gold/40 rounded px-3 py-1.5 text-xs text-gold shadow-lg">
      {toast}
    </motion.div>
  ) : null;

  // Not in a gang
  if (!isMember) {
    return (
      <div>
        <AnimatePresence>{toastEl}</AnimatePresence>

        {/* Pending invites */}
        {invites.length > 0 && (
          <div className="mb-4">
            <SectionHeader title="Uitnodigingen" icon={<UserPlus size={12} />} badge={`${invites.length}`} badgeColor="gold" />
            <div className="space-y-2">
              {invites.map(inv => (
                <div key={inv.id} className="game-card flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold">[{inv.gangTag}] {inv.gangName}</span>
                    <p className="text-[0.45rem] text-muted-foreground">Uitgenodigd door {inv.inviterName}</p>
                  </div>
                  <GameButton onClick={() => handleAcceptInvite(inv.id)} variant="gold" size="sm">Accepteer</GameButton>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create gang */}
        {showCreate ? (
          <div className="game-card space-y-3 mb-4">
            <h3 className="font-display text-sm text-gold uppercase tracking-widest">Gang Oprichten</h3>
            <div>
              <label className="text-[0.5rem] text-muted-foreground uppercase">Naam (3-24 tekens)</label>
              <input value={createName} onChange={e => setCreateName(e.target.value)} maxLength={24}
                className="w-full bg-muted/30 border border-border rounded px-2 py-1.5 text-xs focus:outline-none focus:border-gold/50" />
            </div>
            <div>
              <label className="text-[0.5rem] text-muted-foreground uppercase">Tag (2-5 tekens)</label>
              <input value={createTag} onChange={e => setCreateTag(e.target.value.toUpperCase())} maxLength={5}
                className="w-full bg-muted/30 border border-border rounded px-2 py-1.5 text-xs focus:outline-none focus:border-gold/50" />
            </div>
            <div>
              <label className="text-[0.5rem] text-muted-foreground uppercase">Beschrijving</label>
              <textarea value={createDesc} onChange={e => setCreateDesc(e.target.value)} maxLength={200} rows={2}
                className="w-full bg-muted/30 border border-border rounded px-2 py-1.5 text-xs focus:outline-none focus:border-gold/50 resize-none" />
            </div>
            <p className="text-[0.45rem] text-muted-foreground">Kost: €25.000 • Min. Level 5</p>
            <div className="flex gap-2">
              <GameButton onClick={handleCreate} variant="gold" size="sm">Oprichten</GameButton>
              <GameButton onClick={() => setShowCreate(false)} variant="muted" size="sm">Annuleer</GameButton>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <Users size={32} className="text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground mb-3">Je zit nog niet in een gang.</p>
            <div className="flex gap-2 justify-center">
              <GameButton onClick={() => setShowCreate(true)} variant="gold" size="sm"><Plus size={10} /> Gang Oprichten</GameButton>
              <GameButton onClick={() => { fetchGangsList(); setTab('browse'); }} variant="muted" size="sm">Gangs Bekijken</GameButton>
            </div>
          </div>
        )}

        {/* Browse gangs */}
        {tab === 'browse' && (
          <div className="mt-4">
            <SectionHeader title="Alle Gangs" icon={<Users size={12} />} />
            {gangsList.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Geen gangs gevonden.</p>
            ) : (
              <div className="space-y-2">
                {gangsList.map(g => {
                  const isFull = g.memberCount >= (g.max_members || 20);
                  return (
                    <motion.div key={g.id}
                      initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                      className="game-card cursor-pointer hover:border-gold/40 transition-colors"
                      onClick={() => setSelectedGang(g)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gold truncate">[{g.tag}] {g.name}</span>
                            <GameBadge variant="gold" size="xs">Lv.{g.level}</GameBadge>
                          </div>
                          <div className="flex gap-2 text-[0.45rem] text-muted-foreground mt-0.5">
                            <span className="flex items-center gap-0.5"><Users size={8} /> {g.memberCount}/{g.max_members || 20}</span>
                            <span className="flex items-center gap-0.5"><MapPin size={8} /> {g.territoryCount} gebieden</span>
                            {g.activeWars > 0 && <span className="flex items-center gap-0.5 text-blood"><Swords size={8} /> {g.activeWars} oorlog</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {isFull ? (
                            <span className="text-[0.45rem] text-muted-foreground font-bold uppercase">Vol</span>
                          ) : (
                            <GameButton size="sm" variant="gold" onClick={() => { handleJoinGang(g.id); }}>
                              <DoorOpen size={10} /> Join
                            </GameButton>
                          )}
                          <Eye size={14} className="text-muted-foreground" />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Gang Detail Popup */}
        <AnimatePresence>
          {selectedGang && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
              onClick={() => setSelectedGang(null)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                className="bg-card border border-border rounded-xl p-4 max-w-sm w-full max-h-[80vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h2 className="font-display text-lg font-bold text-gold">[{selectedGang.tag}] {selectedGang.name}</h2>
                    <p className="text-[0.5rem] text-muted-foreground flex items-center gap-1">
                      <Crown size={9} className="text-gold" /> Leider: <span className="text-foreground font-medium">{selectedGang.leaderName}</span>
                    </p>
                  </div>
                  <GameBadge variant="gold" size="xs">Lv.{selectedGang.level}</GameBadge>
                </div>

                {/* Description */}
                <div className="game-card mb-3">
                  <p className="text-[0.55rem] text-muted-foreground">
                    {selectedGang.description || 'Geen beschrijving.'}
                  </p>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <InfoRow icon={<Users size={10} />} label="Leden" value={`${selectedGang.memberCount}/${selectedGang.max_members || 20}`} />
                  <InfoRow icon={<MapPin size={10} />} label="Gebieden" value={`${selectedGang.territoryCount}`} valueClass="text-blood" />
                  <InfoRow icon={<Coins size={10} />} label="Treasury" value={`€${(selectedGang.treasury || 0).toLocaleString()}`} valueClass="text-emerald" />
                  <InfoRow icon={<Swords size={10} />} label="Oorlogen" value={`${selectedGang.activeWars || 0}`} />
                  <InfoRow icon={<TrendingUp size={10} />} label="Gang XP" value={`${selectedGang.xp || 0}`} valueClass="text-gold" />
                  <InfoRow icon={<Star size={10} />} label="Opgericht" value={new Date(selectedGang.created_at).toLocaleDateString('nl-NL')} />
                </div>

                {/* Territory districts */}
                {selectedGang.territoryDistricts && selectedGang.territoryDistricts.length > 0 && (
                  <div className="mb-3">
                    <span className="text-[0.5rem] text-muted-foreground uppercase tracking-wider font-bold">Gecontroleerde Districten</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedGang.territoryDistricts.map((d: string) => (
                        <span key={d} className="text-[0.45rem] px-1.5 py-0.5 rounded bg-blood/20 text-blood font-bold border border-blood/30">
                          {DISTRICT_NAMES[d] || d}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* XP bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[0.5rem] text-muted-foreground">XP naar Lv.{(selectedGang.level || 1) + 1}</span>
                    <span className="text-[0.5rem] font-bold text-gold">{selectedGang.xp || 0} / {(selectedGang.level || 1) * 500}</span>
                  </div>
                  <Progress value={((selectedGang.xp || 0) / ((selectedGang.level || 1) * 500)) * 100} className="h-1.5 bg-muted/30" />
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {selectedGang.memberCount < (selectedGang.max_members || 20) ? (
                    <GameButton variant="gold" size="sm" fullWidth onClick={() => { handleJoinGang(selectedGang.id); setSelectedGang(null); }}>
                      <DoorOpen size={12} /> Gang Joinen
                    </GameButton>
                  ) : (
                    <div className="flex-1 text-center text-[0.5rem] text-muted-foreground py-2 bg-muted/20 rounded border border-border">
                      Gang is vol ({selectedGang.memberCount}/{selectedGang.max_members || 20})
                    </div>
                  )}
                  <GameButton variant="muted" size="sm" onClick={() => setSelectedGang(null)}>Sluiten</GameButton>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // In a gang — tabbed view
  const tabs = [
    { id: 'overview' as GangTab, label: 'INFO', icon: <Crown size={10} /> },
    { id: 'members' as GangTab, label: 'LEDEN', icon: <Users size={10} />, badge: members.length },
    { id: 'territory' as GangTab, label: 'GEBIED', icon: <MapPin size={10} />, badge: territories.length },
    { id: 'wars' as GangTab, label: 'OORLOG', icon: <Swords size={10} />, badge: activeWars.length || undefined },
    { id: 'arcs' as GangTab, label: 'MISSIES', icon: <BookOpen size={10} /> },
    { id: 'alliances' as GangTab, label: 'ALLIANTIES', icon: <Handshake size={10} /> },
    { id: 'chat' as GangTab, label: 'CHAT', icon: <MessageSquare size={10} /> },
  ];

  return (
    <div>
      <AnimatePresence>{toastEl}</AnimatePresence>

      <SubTabBar tabs={tabs} active={tab} onChange={t => setTab(t as GangTab)} />

      {/* OVERVIEW */}
      {tab === 'overview' && gang && (
        <div className="space-y-3">
          <div className="game-card border-l-[3px] border-l-gold">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="font-display text-lg font-bold text-gold">[{gang.tag}] {gang.name}</h3>
                <p className="text-[0.5rem] text-muted-foreground">{gang.description || 'Geen beschrijving'}</p>
              </div>
              <GameBadge variant="gold" size="xs">Lv.{gang.level}</GameBadge>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <InfoRow icon={<Coins size={10} />} label="Treasury" value={`€${(gang.treasury || 0).toLocaleString()}`} valueClass="text-emerald" />
              <InfoRow icon={<Users size={10} />} label="Leden" value={`${members.length}/${gang.max_members}`} />
              <InfoRow icon={<MapPin size={10} />} label="Gebieden" value={`${territories.length}`} valueClass="text-blood" />
              <InfoRow icon={<Swords size={10} />} label="Oorlogen" value={`${activeWars.length}`} />
            </div>

            {/* XP Progress */}
            <div className="mt-3 pt-2 border-t border-border/30">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[0.5rem] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <TrendingUp size={8} /> Gang XP
                </span>
                <span className="text-[0.5rem] font-bold text-gold">
                  {gang.xp || 0} / {GANG_LEVEL_XP(gang.level || 1)}
                </span>
              </div>
              <Progress value={((gang.xp || 0) / GANG_LEVEL_XP(gang.level || 1)) * 100} className="h-1.5 bg-muted/30" />
            </div>
            </div>

            {/* District Dominance Score */}
            <div className="mt-3 pt-2 border-t border-border/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[0.55rem] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <MapPin size={9} /> District Dominantie
                </span>
                <span className="text-sm font-bold text-blood">
                  {territories.length}<span className="text-muted-foreground font-normal text-[0.5rem]"> / 5</span>
                </span>
              </div>
              <div className="flex gap-1.5 mb-1.5">
                {Object.entries(DISTRICT_NAMES).map(([id, name]) => {
                  const owned = territories.some((t: any) => t.district_id === id);
                  return (
                    <div key={id} className="flex-1 text-center">
                      <div className={`h-2 rounded-full transition-all ${owned ? 'bg-blood glow-blood' : 'bg-muted/30'}`} />
                      <span className={`text-[0.4rem] mt-0.5 block ${owned ? 'text-blood font-bold' : 'text-muted-foreground/50'}`}>
                        {name.split(' ')[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
              {territories.length >= 5 && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="text-center text-[0.5rem] text-gold font-bold uppercase tracking-widest gold-text-glow">
                  ⚔ Totale Dominantie ⚔
                </motion.div>
              )}
              {territories.length === 0 && (
                <p className="text-[0.45rem] text-muted-foreground/60 text-center">Claim gebieden via het GEBIED-tabblad</p>
              )}
            </div>
          <div className="game-card">
            <SectionHeader title="Level Bonussen" icon={<Zap size={12} />} />
            <div className="space-y-1">
              {Object.entries(GANG_LEVEL_BONUSES).map(([lvl, desc]) => {
                const level = parseInt(lvl);
                const unlocked = (gang.level || 1) >= level;
                return (
                  <div key={lvl} className={`flex items-center gap-2 text-[0.5rem] ${unlocked ? 'text-gold' : 'text-muted-foreground/50'}`}>
                    <span className={`w-5 h-5 rounded flex items-center justify-center text-[0.4rem] font-bold ${unlocked ? 'bg-gold/20 text-gold' : 'bg-muted/20'}`}>
                      {lvl}
                    </span>
                    <span className={unlocked ? 'font-medium' : ''}>{desc}</span>
                    {unlocked && <Star size={7} className="text-gold ml-auto" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Donate */}
          <div className="game-card">
            <SectionHeader title="Doneer aan Treasury" icon={<Coins size={12} />} />
            <div className="flex gap-2 items-center">
              <input value={donateAmount} onChange={e => setDonateAmount(e.target.value.replace(/\D/g, ''))}
                placeholder="Bedrag (min. €1.000)"
                className="flex-1 bg-muted/30 border border-border rounded px-2 py-1.5 text-xs focus:outline-none focus:border-gold/50" />
              <GameButton onClick={handleDonate} variant="gold" size="sm"><Coins size={10} /> Doneer</GameButton>
            </div>
          </div>

          {/* Leave gang */}
          <GameButton onClick={() => setConfirmLeave(true)} variant="blood" size="sm" fullWidth>
            <LogOut size={10} /> Gang Verlaten
          </GameButton>
        </div>
      )}

      {/* MEMBERS */}
      {tab === 'members' && (
        <div className="space-y-2">
          {members.sort((a: any, b: any) => {
            const order = { leader: 0, officer: 1, member: 2 };
            return (order[a.role as keyof typeof order] ?? 2) - (order[b.role as keyof typeof order] ?? 2);
          }).map((m: any) => (
            <div key={m.userId} className="game-card flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                  {m.role === 'leader' ? <Crown size={10} className="text-gold" /> :
                   m.role === 'officer' ? <Shield size={10} className="text-emerald" /> :
                   <Users size={10} className="text-muted-foreground" />}
                </div>
                <div>
                  <span className="text-xs font-bold">{m.username}</span>
                  <div className="flex items-center gap-1">
                    <GameBadge variant={m.role === 'leader' ? 'gold' : m.role === 'officer' ? 'emerald' : 'muted'} size="xs">
                      {m.role}
                    </GameBadge>
                    {m.contributed > 0 && <span className="text-[0.4rem] text-muted-foreground">€{m.contributed.toLocaleString()}</span>}
                  </div>
                </div>
              </div>
              {myRole === 'leader' && m.userId !== user?.id && (
                <div className="flex gap-1">
                  <GameButton onClick={() => handlePromote(m.userId, m.role === 'officer' ? 'member' : 'officer')} variant="muted" size="sm">
                    <ChevronUp size={8} />
                  </GameButton>
                  <GameButton onClick={() => setConfirmKick(m.userId)} variant="blood" size="sm">
                    <Trash2 size={8} />
                  </GameButton>
                </div>
              )}
              {myRole === 'officer' && m.role === 'member' && m.userId !== user?.id && (
                <GameButton onClick={() => setConfirmKick(m.userId)} variant="blood" size="sm">
                  <Trash2 size={8} />
                </GameButton>
              )}
            </div>
          ))}
        </div>
      )}

      {/* TERRITORY */}
      {tab === 'territory' && (
        <div className="space-y-3">
          {territories.length > 0 && (
            <div className="space-y-2">
              {territories.map((t: any) => (
                <div key={t.district_id} className="game-card flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin size={12} className="text-blood" />
                    <span className="text-xs font-bold">{DISTRICT_NAMES[t.district_id] || t.district_id}</span>
                  </div>
                  <GameBadge variant="blood" size="xs">Verdediging Lv.{t.defense_level}</GameBadge>
                </div>
              ))}
            </div>
          )}

          {(myRole === 'leader' || myRole === 'officer') && (
            <div>
              <SectionHeader title="Claim nieuw district" icon={<Plus size={12} />} />
              <p className="text-[0.45rem] text-muted-foreground mb-2">Kost €50.000 uit de treasury.</p>
              <div className="grid grid-cols-2 gap-1.5">
                {Object.entries(DISTRICT_NAMES).filter(([id]) => !territories.some((t: any) => t.district_id === id)).map(([id, name]) => (
                  <GameButton key={id} onClick={() => handleClaimTerritory(id)} variant="muted" size="sm">
                    <MapPin size={8} /> {name}
                  </GameButton>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* WARS */}
      {tab === 'wars' && (
        <div className="space-y-3">
          {activeWars.length > 0 ? (
            activeWars.map((w: any) => {
              const isAttacker = w.attacker_gang_id === gang?.id;
              const myScore = isAttacker ? w.attacker_score : w.defender_score;
              const theirScore = isAttacker ? w.defender_score : w.attacker_score;
              const endsAt = new Date(w.ends_at);
              const hoursLeft = Math.max(0, Math.floor((endsAt.getTime() - Date.now()) / 3600000));

              return (
                <div key={w.id} className="game-card border-l-[3px] border-l-blood">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-blood">⚔️ Actieve Oorlog</span>
                    <span className="text-[0.45rem] text-muted-foreground">{hoursLeft}u resterend</span>
                  </div>
                  <div className="flex items-center justify-around mb-2">
                    <div className="text-center">
                      <span className="text-lg font-bold text-gold">{myScore}</span>
                      <p className="text-[0.4rem] text-muted-foreground">Jouw gang</p>
                    </div>
                    <span className="text-xs text-muted-foreground">VS</span>
                    <div className="text-center">
                      <span className="text-lg font-bold text-blood">{theirScore}</span>
                      <p className="text-[0.4rem] text-muted-foreground">Tegenstander</p>
                    </div>
                  </div>
                  {w.district_id && (
                    <p className="text-[0.45rem] text-muted-foreground text-center mb-2">
                      Gevochten om: {DISTRICT_NAMES[w.district_id] || w.district_id}
                    </p>
                  )}
                  <GameButton onClick={() => handleWarAttack(w.id)} variant="blood" size="sm" fullWidth glow>
                    <Swords size={10} /> Aanvallen (10⚡ 5🧠)
                  </GameButton>
                </div>
              );
            })
          ) : (
            <div className="text-center py-6">
              <Swords size={24} className="text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Geen actieve oorlogen.</p>
            </div>
          )}

          {(myRole === 'leader' || myRole === 'officer') && (
            <div>
              <SectionHeader title="Oorlog Verklaren" icon={<Swords size={12} />} />
              <p className="text-[0.45rem] text-muted-foreground mb-2">Kost €25.000 uit de treasury. 24 uur om te scoren.</p>
              <GameButton onClick={() => { fetchGangsList(); setTab('browse'); }} variant="blood" size="sm">
                <Swords size={10} /> Kies Doelgang
              </GameButton>
            </div>
          )}
        </div>
      )}

      {/* GANG ARCS / MISSIES */}
      {tab === 'arcs' && gang && (
        <GangArcPanel gangLevel={gang.level || 1} />
      )}

      {/* ALLIANTIES */}
      {tab === 'alliances' && gang && (
        <GangAlliancePanel gangId={gang.id} />
      )}

      {/* CHAT */}
      {tab === 'chat' && (
        <div className="flex flex-col" style={{ height: 'calc(60vh - 80px)' }}>
          <div className="flex-1 overflow-y-auto game-scroll space-y-1 mb-2">
            {chatMessages.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Nog geen berichten.</p>
            ) : (
              chatMessages.map((msg: any) => {
                const isMine = msg.sender_id === user?.id;
                return (
                  <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded px-2 py-1 ${isMine ? 'bg-gold/10 border border-gold/20' : 'bg-muted/30 border border-border'}`}>
                      {!isMine && <span className="text-[0.4rem] font-bold text-gold">{msg.sender_name}</span>}
                      <p className="text-[0.5rem] leading-relaxed">{msg.message}</p>
                      <span className="text-[0.35rem] text-muted-foreground">
                        {new Date(msg.created_at).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="flex gap-1">
            <input value={chatInput} onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendChat()}
              maxLength={300} placeholder="Typ een bericht..."
              className="flex-1 bg-muted/30 border border-border rounded px-2 py-1.5 text-xs focus:outline-none focus:border-gold/50" />
            <GameButton onClick={handleSendChat} variant="gold" size="sm"><Send size={10} /></GameButton>
          </div>
        </div>
      )}

      {/* BROWSE (for war declaration) */}
      {tab === 'browse' && isMember && (
        <div>
          <button onClick={() => setTab('wars')} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3">
            <ArrowLeft size={12} /> Terug
          </button>
          <SectionHeader title="Kies een gang om aan te vallen" icon={<Swords size={12} />} />
          {gangsList.filter(g => g.id !== gang?.id).length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">Geen andere gangs.</p>
          ) : (
            <div className="space-y-2">
              {gangsList.filter(g => g.id !== gang?.id).map(g => (
                <div key={g.id} className="game-card flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold">[{g.tag}] {g.name}</span>
                    <div className="flex gap-2 text-[0.45rem] text-muted-foreground">
                      <span>Lv.{g.level}</span>
                      <span>{g.memberCount} leden</span>
                      <span>{g.territoryCount} gebieden</span>
                    </div>
                  </div>
                  <GameButton onClick={() => handleDeclareWar(g.id)} variant="blood" size="sm">
                    <Swords size={8} /> Oorlog
                  </GameButton>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Confirm dialogs */}
      <ConfirmDialog
        open={confirmLeave}
        title="Gang Verlaten"
        message={myRole === 'leader' ? 'Als leader wordt het leiderschap overgedragen. Weet je het zeker?' : 'Weet je zeker dat je de gang wilt verlaten?'}
        confirmText="Verlaten"
        variant="danger"
        onConfirm={handleLeave}
        onCancel={() => setConfirmLeave(false)}
      />

      <ConfirmDialog
        open={!!confirmKick}
        title="Lid Kicken"
        message="Weet je zeker dat je dit lid wilt verwijderen?"
        confirmText="Kicken"
        variant="danger"
        onConfirm={() => confirmKick && handleKick(confirmKick)}
        onCancel={() => setConfirmKick(null)}
      />
    </div>
  );
}
