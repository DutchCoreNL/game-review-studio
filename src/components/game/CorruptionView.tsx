import { useGame } from '@/contexts/GameContext';
import { CORRUPT_CONTACTS } from '@/game/constants';
import { getTotalMonthlyCost, getCorruptionRaidProtection, getCorruptionFineReduction, getCorruptionSmuggleProtection, getCorruptionTradeBonus } from '@/game/corruption';
import { CONTACT_IMAGES } from '@/assets/items';
import { SectionHeader } from './ui/SectionHeader';
import { GameButton } from './ui/GameButton';
import { StatBar } from './ui/StatBar';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, AlertTriangle, DollarSign, Users, Eye, Lock, Handshake, X } from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';
import { useState } from 'react';

export function CorruptionView() {
  const { state, dispatch, showToast } = useGame();
  const [confirmFire, setConfirmFire] = useState<string | null>(null);

  const activeContacts = state.corruptContacts.filter(c => c.active && !c.compromised);
  const deadContacts = state.corruptContacts.filter(c => !c.active || c.compromised);
  const monthlyCost = getTotalMonthlyCost(state);
  const raidProtection = getCorruptionRaidProtection(state);
  const fineReduction = getCorruptionFineReduction(state);
  const smuggleProtection = getCorruptionSmuggleProtection(state);
  const tradeBonus = getCorruptionTradeBonus(state);

  const handleRecruit = (defId: string) => {
    const def = CORRUPT_CONTACTS.find(c => c.id === defId);
    if (!def) return;
    if (state.money < def.recruitCost) {
      showToast('Te weinig geld om te rekruteren!', true);
      return;
    }
    if (state.rep < (def.reqRep || 0)) {
      showToast(`Je hebt minimaal ${def.reqRep} rep nodig!`, true);
      return;
    }
    if (def.reqPoliceRel && state.policeRel < def.reqPoliceRel) {
      showToast(`Je politierelatie moet minimaal ${def.reqPoliceRel} zijn!`, true);
      return;
    }
    dispatch({ type: 'RECRUIT_CONTACT', contactDefId: defId });
    showToast(`${def.name} gerekruteerd! Betaling: €${def.monthlyCost}/week`);
  };

  const handleFire = (contactId: string) => {
    dispatch({ type: 'FIRE_CONTACT', contactId });
    setConfirmFire(null);
    showToast('Contact ontslagen. Laten we hopen dat ze zwijgen...');
  };

  return (
    <div>
      {/* Network Overview */}
      <SectionHeader title="Corruptie Netwerk" icon={<Handshake size={12} />} />
      
      {activeContacts.length > 0 && (
        <motion.div 
          className="game-card border-l-[3px] border-l-police mb-3"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        >
          <div className="grid grid-cols-2 gap-2 mb-2">
            <NetworkStat icon={<Shield size={10} />} label="Inval Bescherming" value={`${raidProtection}%`} color="text-emerald" />
            <NetworkStat icon={<DollarSign size={10} />} label="Boete Reductie" value={`${fineReduction}%`} color="text-gold" />
            <NetworkStat icon={<Eye size={10} />} label="Smokkel Bescherming" value={`${smuggleProtection}%`} color="text-ice" />
            <NetworkStat icon={<Users size={10} />} label="Handelsbonus" value={`+${tradeBonus}%`} color="text-game-purple" />
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-border">
            <span className="text-[0.55rem] text-muted-foreground">
              {activeContacts.length} actieve contacten
            </span>
            <span className="text-[0.6rem] font-bold text-blood">
              €{monthlyCost.toLocaleString()}/week
            </span>
          </div>
        </motion.div>
      )}

      {/* Active Contacts */}
      {activeContacts.length > 0 && (
        <>
          <SectionHeader title="Actieve Contacten" icon={<Users size={12} />} />
          <div className="space-y-2 mb-4">
            <AnimatePresence>
              {activeContacts.map(contact => {
                const def = CORRUPT_CONTACTS.find(d => d.id === contact.contactDefId);
                if (!def) return null;
                const daysSincePaid = state.day - contact.lastPaidDay;
                const paymentDue = daysSincePaid >= 5;

                return (
                  <motion.div
                    key={contact.id}
                    className={`game-card border-l-[3px] ${paymentDue ? 'border-l-blood' : 'border-l-police'}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded bg-muted border border-border overflow-hidden shrink-0">
                          {CONTACT_IMAGES[def.id] ? (
                            <img src={CONTACT_IMAGES[def.id]} alt={def.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-lg flex items-center justify-center w-full h-full">{def.icon}</span>
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-xs">{def.name}</h4>
                          <p className="text-[0.5rem] text-muted-foreground">{def.title}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setConfirmFire(contact.id)}
                        className="p-1 rounded hover:bg-blood/20 transition-colors"
                        title="Contact ontslaan"
                      >
                        <X size={12} className="text-muted-foreground" />
                      </button>
                    </div>

                    <p className="text-[0.5rem] text-muted-foreground mb-2">{def.desc}</p>

                    {/* Loyalty bar */}
                    <div className="mb-2">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="text-[0.45rem] text-muted-foreground uppercase">Loyaliteit</span>
                        <span className="text-[0.5rem] font-bold">{contact.loyalty}/100</span>
                      </div>
                      <StatBar 
                        value={contact.loyalty} 
                        max={100} 
                        color={contact.loyalty > 50 ? 'emerald' : contact.loyalty > 25 ? 'gold' : 'blood'} 
                      />
                    </div>

                    {/* Effects tags */}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {def.effects.heatReduction && (
                        <EffectTag label={`-${def.effects.heatReduction} Heat/dag`} color="emerald" />
                      )}
                      {def.effects.raidProtection && (
                        <EffectTag label={`-${def.effects.raidProtection}% Inval`} color="ice" />
                      )}
                      {def.effects.fineReduction && (
                        <EffectTag label={`-${def.effects.fineReduction}% Boete`} color="gold" />
                      )}
                      {def.effects.tradeBonus && (
                        <EffectTag label={`+${def.effects.tradeBonus}% Handel`} color="game-purple" />
                      )}
                      {def.effects.smuggleProtection && (
                        <EffectTag label={`-${def.effects.smuggleProtection}% Smokkel Risico`} color="police" />
                      )}
                      {def.effects.intelBonus && (
                        <EffectTag label="Intel" color="ice" />
                      )}
                    </div>

                    {/* Payment info */}
                    <div className="flex justify-between items-center text-[0.5rem]">
                      <span className={paymentDue ? 'text-blood font-bold' : 'text-muted-foreground'}>
                        {paymentDue ? '⚠️ Betaling bijna verschuldigd!' : `Betaald ${daysSincePaid}d geleden`}
                      </span>
                      <span className="text-muted-foreground">
                        €{def.monthlyCost.toLocaleString()}/week
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </>
      )}

      {/* Recruit new contacts */}
      <SectionHeader title="Beschikbare Contacten" icon={<Handshake size={12} />} />
      <p className="text-[0.55rem] text-muted-foreground mb-3">
        Rekruteer corrupte contacten voor bescherming, informatie en invloed. Betaling is wekelijks.
      </p>
      <div className="space-y-2 mb-4">
        {CORRUPT_CONTACTS.map(def => {
          const isRecruited = activeContacts.some(c => c.contactDefId === def.id);
          const wasCompromised = deadContacts.some(c => c.contactDefId === def.id && c.compromised);
          const canAfford = state.money >= def.recruitCost;
          const hasRep = state.rep >= (def.reqRep || 0);
          const hasPoliceRel = !def.reqPoliceRel || state.policeRel >= def.reqPoliceRel;
          const meetsReqs = hasRep && hasPoliceRel;
          const isLocked = !meetsReqs;

          return (
            <motion.div
              key={def.id}
              className={`game-card ${isRecruited ? 'opacity-50' : ''} ${wasCompromised ? 'border-l-[3px] border-l-blood' : ''}`}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: isRecruited ? 0.5 : 1, y: 0 }}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded bg-muted border border-border overflow-hidden shrink-0">
                    {isLocked ? (
                      <span className="text-lg flex items-center justify-center w-full h-full">🔒</span>
                    ) : CONTACT_IMAGES[def.id] ? (
                      <img src={CONTACT_IMAGES[def.id]} alt={def.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg flex items-center justify-center w-full h-full">{def.icon}</span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-xs">{isLocked ? '???' : def.name}</h4>
                      <span className="text-[0.45rem] px-1 py-0.5 rounded bg-muted text-muted-foreground uppercase">
                        {def.type}
                      </span>
                    </div>
                    <p className="text-[0.5rem] text-muted-foreground">{isLocked ? def.title : def.desc}</p>
                  </div>
                </div>
              </div>

              {/* Requirements */}
              {isLocked && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {!hasRep && (
                    <span className="text-[0.45rem] px-1.5 py-0.5 rounded bg-blood/10 text-blood">
                      Rep ≥ {def.reqRep}
                    </span>
                  )}
                  {def.reqPoliceRel && !hasPoliceRel && (
                    <span className="text-[0.45rem] px-1.5 py-0.5 rounded bg-blood/10 text-blood">
                      Politie Rel ≥ {def.reqPoliceRel}
                    </span>
                  )}
                </div>
              )}

              {/* Effects preview */}
              {!isLocked && !isRecruited && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {def.effects.heatReduction && <EffectTag label={`-${def.effects.heatReduction} Heat`} color="emerald" />}
                  {def.effects.raidProtection && <EffectTag label={`-${def.effects.raidProtection}% Inval`} color="ice" />}
                  {def.effects.fineReduction && <EffectTag label={`-${def.effects.fineReduction}% Boete`} color="gold" />}
                  {def.effects.tradeBonus && <EffectTag label={`+${def.effects.tradeBonus}% Handel`} color="game-purple" />}
                  {def.effects.smuggleProtection && <EffectTag label={`Smokkel ↓`} color="police" />}
                  {def.effects.intelBonus && <EffectTag label="Intel" color="ice" />}
                </div>
              )}

              {/* Betrayal risk */}
              {!isLocked && !isRecruited && (
                <div className="flex justify-between items-center mt-2">
                  <span className="text-[0.45rem] text-muted-foreground flex items-center gap-1">
                    <AlertTriangle size={8} />
                    Verraadrisico: {def.betrayalRisk <= 8 ? 'Laag' : def.betrayalRisk <= 15 ? 'Gemiddeld' : 'Hoog'}
                  </span>
                  <span className="text-[0.45rem] text-muted-foreground">
                    €{def.monthlyCost.toLocaleString()}/week
                  </span>
                </div>
              )}

              {/* Action button */}
              {!isRecruited && !wasCompromised && (
                <GameButton
                  variant={isLocked ? 'muted' : 'gold'}
                  size="sm"
                  fullWidth
                  disabled={isLocked || !canAfford || isRecruited}
                  onClick={() => handleRecruit(def.id)}
                  className="mt-2"
                  icon={isLocked ? <Lock size={10} /> : <Handshake size={10} />}
                >
                  {isLocked ? 'VERGRENDELD' : isRecruited ? 'ACTIEF' : `REKRUTEER €${def.recruitCost.toLocaleString()}`}
                </GameButton>
              )}

              {isRecruited && (
                <div className="mt-2 text-center text-[0.5rem] text-emerald font-bold">✓ ACTIEF</div>
              )}

              {wasCompromised && (
                <div className="mt-2 text-center text-[0.5rem] text-blood font-bold">💀 GECOMPROMITTEERD</div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Compromised history */}
      {deadContacts.length > 0 && (
        <>
          <SectionHeader title="Verloren Contacten" />
          <div className="space-y-1 mb-4">
            {deadContacts.map(contact => {
              const def = CORRUPT_CONTACTS.find(d => d.id === contact.contactDefId);
              if (!def) return null;
              return (
                <div key={contact.id} className="game-card opacity-50 flex items-center gap-2">
                  <div className="w-7 h-7 rounded bg-muted border border-border overflow-hidden shrink-0">
                    {CONTACT_IMAGES[def.id] ? (
                      <img src={CONTACT_IMAGES[def.id]} alt={def.name} className="w-full h-full object-cover grayscale" />
                    ) : (
                      <span className="text-sm flex items-center justify-center w-full h-full">{def.icon}</span>
                    )}
                  </div>
                  <div>
                    <span className="text-[0.55rem] font-bold">{def.name}</span>
                    <span className="text-[0.45rem] text-muted-foreground ml-2">
                      {contact.compromised ? '💀 Gecompromitteerd' : '❌ Ontslagen'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Fire confirmation */}
      <ConfirmDialog
        open={!!confirmFire}
        title="Contact Ontslaan"
        message="Weet je het zeker? Een ontslagen contact kan wraak nemen en je heat verhogen."
        confirmText="ONTSLAAN"
        cancelText="ANNULEER"
        variant="danger"
        onConfirm={() => confirmFire && handleFire(confirmFire)}
        onCancel={() => setConfirmFire(null)}
      />
    </div>
  );
}

function NetworkStat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="bg-muted/50 rounded p-1.5 text-center">
      <div className={`flex items-center justify-center gap-1 ${color} mb-0.5`}>{icon}</div>
      <div className="text-[0.4rem] text-muted-foreground uppercase">{label}</div>
      <div className={`text-[0.6rem] font-bold ${color}`}>{value}</div>
    </div>
  );
}

function EffectTag({ label, color }: { label: string; color: string }) {
  return (
    <span className={`text-[0.4rem] px-1.5 py-0.5 rounded bg-${color}/10 text-${color} font-semibold`}>
      {label}
    </span>
  );
}
