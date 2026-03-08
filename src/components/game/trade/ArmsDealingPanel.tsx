import { useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { SectionHeader } from '../ui/SectionHeader';
import { GameButton } from '../ui/GameButton';
import { StatBar } from '../ui/StatBar';
import { motion } from 'framer-motion';
import { Crosshair, Users, TrendingUp, Shield, AlertTriangle, Plus, Truck } from 'lucide-react';
import { DISTRICTS } from '@/game/constants';
import { getContactRecruitCost, getDeliveryPrice, getInterceptChance, getNetworkUpgradeCost, DEMAND_LABELS, BASE_PRICES, type ArmsContact } from '@/game/armsDealing';
import { DistrictId } from '@/game/types';

export function ArmsDealingPanel() {
  const { state, dispatch, showToast } = useGame();
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictId>('port');
  const [deliveryQty, setDeliveryQty] = useState(1);

  const network = state.armsNetwork;
  const recruitCost = getContactRecruitCost(network?.networkLevel || 1);
  const maxContacts = (network?.networkLevel || 1) + 2;
  const upgradeCost = getNetworkUpgradeCost(network?.networkLevel || 1);

  const handleRecruit = () => {
    dispatch({ type: 'RECRUIT_ARMS_CONTACT', district: selectedDistrict });
    showToast('Nieuw wapencontact geworven!');
  };

  const handleDeliver = (contactId: string) => {
    dispatch({ type: 'DELIVER_ARMS', contactId, quantity: deliveryQty });
  };

  const handleUpgradeNetwork = () => {
    dispatch({ type: 'UPGRADE_ARMS_NETWORK' });
    showToast('Netwerk geüpgraded!');
  };

  const interceptChance = getInterceptChance(state.heat, state.personalHeat, network?.networkLevel || 1);

  return (
    <div className="space-y-4">
      <SectionHeader title="Wapenhandel Netwerk" icon={<Crosshair size={12} />} />

      {/* Network Overview */}
      <div className="grid grid-cols-3 gap-2">
        <div className="game-card p-2.5 text-center">
          <div className="text-[0.5rem] text-muted-foreground uppercase">Level</div>
          <div className="text-sm font-bold text-gold">{network?.networkLevel || 1}</div>
        </div>
        <div className="game-card p-2.5 text-center">
          <div className="text-[0.5rem] text-muted-foreground uppercase">Contacten</div>
          <div className="text-sm font-bold text-foreground">{network?.contacts.length || 0}/{maxContacts}</div>
        </div>
        <div className="game-card p-2.5 text-center">
          <div className="text-[0.5rem] text-muted-foreground uppercase">Omzet</div>
          <div className="text-sm font-bold text-emerald">€{(network?.totalRevenue || 0).toLocaleString()}</div>
        </div>
      </div>

      {/* Intercept Risk */}
      <div className="game-card p-2.5">
        <div className="flex items-center justify-between text-[0.6rem]">
          <span className="text-muted-foreground flex items-center gap-1"><Shield size={10} /> Interceptierisico</span>
          <span className={`font-bold ${interceptChance > 0.15 ? 'text-blood' : interceptChance > 0.08 ? 'text-gold' : 'text-emerald'}`}>
            {Math.round(interceptChance * 100)}%
          </span>
        </div>
        <StatBar value={interceptChance * 100} max={50} color={interceptChance > 0.15 ? 'blood' : 'gold'} height="sm" />
      </div>

      {/* Upgrade Network */}
      {(network?.networkLevel || 1) < 5 && (
        <GameButton variant="gold" size="sm" className="w-full" onClick={handleUpgradeNetwork} disabled={state.money < upgradeCost}>
          <TrendingUp size={12} /> Upgrade Netwerk (€{upgradeCost.toLocaleString()})
        </GameButton>
      )}

      {/* Recruit Contact */}
      {(network?.contacts.length || 0) < maxContacts && (
        <div className="game-card p-3 border-l-[3px] border-l-gold">
          <h4 className="text-xs font-bold mb-2 flex items-center gap-1"><Plus size={12} /> Nieuw Contact Werven</h4>
          <div className="flex gap-2 mb-2">
            <select
              value={selectedDistrict}
              onChange={e => setSelectedDistrict(e.target.value as DistrictId)}
              className="flex-1 bg-muted/50 border border-border rounded px-2 py-1 text-xs text-foreground"
            >
              {Object.entries(DISTRICTS).map(([id, d]) => (
                <option key={id} value={id}>{d.name}</option>
              ))}
            </select>
            <GameButton variant="gold" size="sm" onClick={handleRecruit} disabled={state.money < recruitCost}>
              €{recruitCost.toLocaleString()}
            </GameButton>
          </div>
        </div>
      )}

      {/* Contact List */}
      <SectionHeader title="Contacten" icon={<Users size={12} />} />
      {(network?.contacts || []).length === 0 ? (
        <div className="game-card p-4 text-center text-xs text-muted-foreground">
          Geen contacten. Werf je eerste wapencontact hierboven.
        </div>
      ) : (
        <div className="space-y-2">
          {(network?.contacts || []).map((contact: ArmsContact) => {
            const unitPrice = getDeliveryPrice(contact);
            const isCompromised = contact.status !== 'active';
            return (
              <motion.div
                key={contact.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`game-card p-3 ${isCompromised ? 'opacity-50 border-blood/30' : 'border-l-[3px] border-l-emerald'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-foreground">{contact.name}</span>
                      <span className="text-[0.45rem] bg-muted/50 text-muted-foreground px-1.5 py-0.5 rounded">
                        {DISTRICTS[contact.district]?.name}
                      </span>
                    </div>
                    <p className="text-[0.55rem] text-muted-foreground mt-0.5">
                      Vraagt: <span className="text-foreground font-semibold">{DEMAND_LABELS[contact.demandType]}</span> •
                      Prijs: <span className="text-gold font-semibold">€{unitPrice.toLocaleString()}/stuk</span>
                    </p>
                    <div className="flex gap-3 mt-1">
                      <span className="text-[0.5rem] text-muted-foreground">
                        Trust: <span className="text-foreground">{contact.trustLevel}%</span>
                      </span>
                      <span className="text-[0.5rem] text-muted-foreground">
                        Geleverd: <span className="text-foreground">{contact.totalDelivered}</span>
                      </span>
                    </div>
                  </div>
                  {!isCompromised && (
                    <div className="flex flex-col gap-1 items-end">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={deliveryQty}
                          onChange={e => setDeliveryQty(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-12 bg-muted/50 border border-border rounded px-1 py-0.5 text-[0.6rem] text-center text-foreground"
                        />
                        <GameButton size="sm" variant="gold" onClick={() => handleDeliver(contact.id)}>
                          <Truck size={10} /> Lever
                        </GameButton>
                      </div>
                      <span className="text-[0.45rem] text-muted-foreground">
                        = €{(unitPrice * deliveryQty).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Stats */}
      {network && network.interceptedShipments > 0 && (
        <div className="flex items-center gap-1.5 text-[0.5rem] text-blood mt-2">
          <AlertTriangle size={10} />
          <span>{network.interceptedShipments} zending(en) onderschept</span>
        </div>
      )}
    </div>
  );
}
