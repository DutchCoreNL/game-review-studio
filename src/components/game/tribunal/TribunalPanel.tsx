import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gavel, Loader2, ThumbsUp, ThumbsDown, Plus, Users, Clock, CheckCircle } from 'lucide-react';
import { gameApi } from '@/lib/gameApi';
import { GameButton } from '../ui/GameButton';
import { SectionHeader } from '../ui/SectionHeader';
import { useAuth } from '@/hooks/useAuth';

interface TribunalCase {
  id: string;
  accuser_name: string;
  accused_name: string;
  accused_id: string;
  charge: string;
  evidence: string;
  votes_guilty: number;
  votes_innocent: number;
  jury_size: number;
  verdict: string | null;
  punishment: any;
  status: string;
  expires_at: string;
  created_at: string;
}

const CHARGES = [
  { id: 'scam', label: 'Oplichting', desc: 'Oneerlijke handel of bedrog' },
  { id: 'betrayal', label: 'Verraad', desc: 'Gang-verraad of dubbelspel' },
  { id: 'griefing', label: 'Griefing', desc: 'Herhaaldelijk targeten van zwakkere spelers' },
  { id: 'exploit', label: 'Exploit Misbruik', desc: 'Misbruik van spelfouten' },
];

export function TribunalPanel() {
  const { user } = useAuth();
  const [cases, setCases] = useState<TribunalCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [toast, setToast] = useState('');
  const [showFile, setShowFile] = useState(false);
  const [fileTarget, setFileTarget] = useState('');
  const [fileCharge, setFileCharge] = useState('scam');
  const [fileEvidence, setFileEvidence] = useState('');

  const showMsg = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchCases = useCallback(async () => {
    setLoading(true);
    const res = await gameApi.getTribunalCases();
    if (res.success && res.data) setCases(res.data.cases || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCases(); }, [fetchCases]);

  const fileCase = async () => {
    if (!fileTarget.trim() || !fileEvidence.trim()) { showMsg('Vul alle velden in.'); return; }
    setActing(true);
    const res = await gameApi.fileTribunalCase(fileTarget, fileCharge, fileEvidence);
    showMsg(res.message);
    if (res.success) { setShowFile(false); setFileTarget(''); setFileEvidence(''); fetchCases(); }
    setActing(false);
  };

  const vote = async (caseId: string, voteType: 'guilty' | 'innocent') => {
    setActing(true);
    const res = await gameApi.tribunalVote(caseId, voteType);
    showMsg(res.message);
    if (res.success) fetchCases();
    setActing(false);
  };

  const activeCases = cases.filter(c => c.status === 'voting');
  const resolvedCases = cases.filter(c => c.status !== 'voting');

  if (loading) return <div className="flex justify-center py-4"><Loader2 size={16} className="animate-spin text-gold" /></div>;

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[9999] bg-background border border-gold/40 rounded px-3 py-1.5 text-xs text-gold shadow-lg">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <SectionHeader title="Ondergronds Tribunaal" icon={<Gavel size={12} />} badge="⚖️ Recht" badgeColor="gold" />

      <p className="text-[0.55rem] text-muted-foreground">
        Klaag spelers aan voor misdaden. Een jury stemt over schuld of onschuld. Veroordeelden krijgen echte straffen.
      </p>

      <GameButton onClick={() => setShowFile(!showFile)} variant="gold" size="sm">
        <Plus size={10} /> Zaak Indienen
      </GameButton>

      {/* File case form */}
      {showFile && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
          className="game-card space-y-2">
          <h4 className="text-xs font-bold text-gold">Nieuwe Aanklacht</h4>
          <div>
            <label className="text-[0.45rem] text-muted-foreground uppercase">Verdachte (spelernaam)</label>
            <input value={fileTarget} onChange={e => setFileTarget(e.target.value)}
              className="w-full bg-muted/30 border border-border rounded px-2 py-1 text-xs focus:outline-none focus:border-gold/50" />
          </div>
          <div>
            <label className="text-[0.45rem] text-muted-foreground uppercase">Aanklacht</label>
            <select value={fileCharge} onChange={e => setFileCharge(e.target.value)}
              className="w-full bg-muted/30 border border-border rounded px-2 py-1 text-xs focus:outline-none focus:border-gold/50">
              {CHARGES.map(c => <option key={c.id} value={c.id}>{c.label} — {c.desc}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[0.45rem] text-muted-foreground uppercase">Bewijs (beschrijf wat er gebeurde)</label>
            <textarea value={fileEvidence} onChange={e => setFileEvidence(e.target.value)} maxLength={500} rows={3}
              className="w-full bg-muted/30 border border-border rounded px-2 py-1 text-xs focus:outline-none focus:border-gold/50 resize-none" />
          </div>
          <p className="text-[0.4rem] text-muted-foreground">Kost: €5.000 • Valse aanklachten kosten rep</p>
          <div className="flex gap-2">
            <GameButton onClick={fileCase} disabled={acting} variant="gold" size="sm">Indienen</GameButton>
            <GameButton onClick={() => setShowFile(false)} variant="muted" size="sm">Annuleer</GameButton>
          </div>
        </motion.div>
      )}

      {/* Active cases */}
      {activeCases.length > 0 && (
        <div>
          <SectionHeader title="Lopende Zaken" icon={<Users size={12} />} badge={`${activeCases.length}`} badgeColor="gold" />
          <div className="space-y-2">
            {activeCases.map(c => {
              const totalVotes = c.votes_guilty + c.votes_innocent;
              const timeLeft = Math.max(0, Math.floor((new Date(c.expires_at).getTime() - Date.now()) / 3600000));
              const isOwnCase = c.accused_id === user?.id;

              return (
                <motion.div key={c.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                  className={`game-card space-y-2 ${isOwnCase ? 'border-blood/40' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold">{c.accuser_name}</span>
                      <span className="text-[0.5rem] text-muted-foreground"> vs </span>
                      <span className="text-xs font-bold text-blood">{c.accused_name}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[0.45rem] text-muted-foreground">
                      <Clock size={8} /> {timeLeft}u
                    </div>
                  </div>

                  <div className="text-[0.5rem]">
                    <span className="text-gold font-bold">{CHARGES.find(ch => ch.id === c.charge)?.label || c.charge}</span>
                  </div>
                  <p className="text-[0.45rem] text-muted-foreground line-clamp-2">{c.evidence}</p>

                  {/* Vote bar */}
                  <div className="flex items-center gap-2 text-[0.5rem]">
                    <span className="text-blood font-bold">⚖️ {c.votes_guilty}</span>
                    <div className="flex-1 h-1.5 bg-muted/30 rounded overflow-hidden">
                      <div className="h-full bg-blood/60 rounded" style={{ width: totalVotes > 0 ? `${(c.votes_guilty / totalVotes) * 100}%` : '50%' }} />
                    </div>
                    <span className="text-emerald-400 font-bold">{c.votes_innocent} ✓</span>
                  </div>
                  <div className="text-[0.4rem] text-muted-foreground text-center">{totalVotes}/{c.jury_size} stemmen</div>

                  {/* Vote buttons */}
                  {!isOwnCase && (
                    <div className="flex gap-2">
                      <GameButton onClick={() => vote(c.id, 'guilty')} disabled={acting} variant="muted" size="sm" fullWidth>
                        <ThumbsDown size={10} className="text-blood" /> Schuldig
                      </GameButton>
                      <GameButton onClick={() => vote(c.id, 'innocent')} disabled={acting} variant="muted" size="sm" fullWidth>
                        <ThumbsUp size={10} className="text-emerald-400" /> Onschuldig
                      </GameButton>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Resolved cases */}
      {resolvedCases.length > 0 && (
        <div>
          <SectionHeader title="Afgeronde Zaken" icon={<CheckCircle size={12} />} badge={`${resolvedCases.length}`} badgeColor="purple" />
          <div className="space-y-1">
            {resolvedCases.slice(0, 10).map(c => (
              <div key={c.id} className="game-card opacity-70 flex items-center justify-between">
                <div>
                  <span className="text-[0.5rem] font-bold">{c.accused_name}</span>
                  <span className="text-[0.4rem] text-muted-foreground ml-1">— {CHARGES.find(ch => ch.id === c.charge)?.label}</span>
                </div>
                <span className={`text-[0.5rem] font-bold ${c.verdict === 'guilty' ? 'text-blood' : 'text-emerald-400'}`}>
                  {c.verdict === 'guilty' ? '⚖️ SCHULDIG' : '✓ ONSCHULDIG'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeCases.length === 0 && resolvedCases.length === 0 && (
        <div className="text-center py-6 text-xs text-muted-foreground">
          <Gavel size={24} className="mx-auto mb-2 opacity-30" />
          Geen lopende zaken. De onderwereld is rustig... voor nu.
        </div>
      )}
    </div>
  );
}
