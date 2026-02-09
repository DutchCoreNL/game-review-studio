import { useGame } from '@/contexts/GameContext';
import { VILLA_COST, VILLA_REQ_LEVEL, VILLA_REQ_REP, VILLA_UPGRADE_COSTS, VILLA_MODULES, getVaultMax, getStorageMax } from '@/game/villa';
import { GOODS, DISTRICTS } from '@/game/constants';
import { GoodId, DistrictId, VillaModuleId } from '@/game/types';
import { GameButton } from '../ui/GameButton';
import { SectionHeader } from '../ui/SectionHeader';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, ArrowUp, ArrowDown, Package, DollarSign, Shield, Factory, Users, Navigation, Sparkles } from 'lucide-react';

type VillaTab = 'overview' | 'production' | 'storage' | 'modules';

export function VillaView() {
  const { state, dispatch, showToast } = useGame();
  const [tab, setTab] = useState<VillaTab>('overview');
  const [depositAmount, setDepositAmount] = useState(10000);
  const [goodDepositGood, setGoodDepositGood] = useState<GoodId>('drugs');

  const villa = state.villa;
  const canBuy = !villa && state.money >= VILLA_COST && state.player.level >= VILLA_REQ_LEVEL && state.rep >= VILLA_REQ_REP;
  const meetsReqs = state.player.level >= VILLA_REQ_LEVEL && state.rep >= VILLA_REQ_REP;

  // Purchase screen
  if (!villa) {
    return (
      <div className="game-card p-4 space-y-4">
        <SectionHeader title="🏛️ Villa Noxhaven" badge="Hoofdkwartier" />
        <div className="text-xs text-muted-foreground space-y-2">
          <p>Een villa op de heuvels boven Noxhaven. Jouw persoonlijke machtsbasis met veilige opslag, productie en crew-beheer.</p>
          <div className="bg-muted/30 rounded-lg p-3 space-y-1">
            <p className="font-bold text-foreground">Vereisten:</p>
            <p className={state.player.level >= VILLA_REQ_LEVEL ? 'text-emerald' : 'text-blood'}>
              • Level {VILLA_REQ_LEVEL} {state.player.level >= VILLA_REQ_LEVEL ? '✓' : `(huidig: ${state.player.level})`}
            </p>
            <p className={state.rep >= VILLA_REQ_REP ? 'text-emerald' : 'text-blood'}>
              • Reputatie {VILLA_REQ_REP} {state.rep >= VILLA_REQ_REP ? '✓' : `(huidig: ${state.rep})`}
            </p>
            <p className={state.money >= VILLA_COST ? 'text-emerald' : 'text-blood'}>
              • €{VILLA_COST.toLocaleString()} {state.money >= VILLA_COST ? '✓' : `(huidig: €${state.money.toLocaleString()})`}
            </p>
          </div>
        </div>
        <GameButton variant="gold" fullWidth glow disabled={!canBuy} onClick={() => dispatch({ type: 'BUY_VILLA' })}>
          {canBuy ? `🏛️ KOOP VILLA — €${VILLA_COST.toLocaleString()}` : meetsReqs ? 'TE WEINIG GELD' : 'VEREISTEN NIET GEHAALD'}
        </GameButton>
      </div>
    );
  }

  const tabs: { id: VillaTab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overzicht', icon: '🏛️' },
    { id: 'production', label: 'Productie', icon: '🧪' },
    { id: 'storage', label: 'Opslag', icon: '📦' },
    { id: 'modules', label: 'Modules', icon: '🔧' },
  ];

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="game-card p-3 border-t-2 border-t-gold">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-sm text-gold uppercase tracking-wider">Villa Noxhaven</h2>
            <p className="text-[0.6rem] text-muted-foreground">Level {villa.level} • {villa.modules.length} modules</p>
          </div>
          {villa.level < 3 && (
            <GameButton variant="gold" size="sm" onClick={() => {
              const cost = VILLA_UPGRADE_COSTS[villa.level + 1];
              if (state.money < cost) { showToast(`Te weinig geld (€${cost.toLocaleString()} nodig)`, true); return; }
              dispatch({ type: 'UPGRADE_VILLA' });
              showToast(`Villa upgraded naar Level ${villa.level + 1}!`);
            }}>
              ⬆ LVL {villa.level + 1} — €{VILLA_UPGRADE_COSTS[villa.level + 1]?.toLocaleString()}
            </GameButton>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-1.5 rounded text-[0.65rem] font-bold uppercase tracking-wider transition-all ${
              tab === t.id ? 'bg-gold/20 text-gold border border-gold/30' : 'bg-muted/30 text-muted-foreground border border-transparent'
            }`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
          {tab === 'overview' && <OverviewTab />}
          {tab === 'production' && <ProductionTab />}
          {tab === 'storage' && <StorageTab depositAmount={depositAmount} setDepositAmount={setDepositAmount} goodDepositGood={goodDepositGood} setGoodDepositGood={setGoodDepositGood} />}
          {tab === 'modules' && <ModulesTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function OverviewTab() {
  const { state } = useGame();
  const villa = state.villa!;
  const vaultMax = getVaultMax(villa.level);
  const storageMax = getStorageMax(villa.level);
  const storedCount = Object.values(villa.storedGoods).reduce((a, b) => a + (b || 0), 0);

  return (
    <div className="game-card p-3 space-y-3">
      <SectionHeader title="Status" />
      <div className="grid grid-cols-2 gap-2">
        <InfoBox icon="🏛️" label="Villa Level" value={`${villa.level}/3`} />
        <InfoBox icon="🔧" label="Modules" value={`${villa.modules.length}/${VILLA_MODULES.length}`} />
        {villa.modules.includes('kluis') && <InfoBox icon="🔐" label="Kluis" value={`€${villa.vaultMoney.toLocaleString()} / €${vaultMax.toLocaleString()}`} />}
        {villa.modules.includes('opslagkelder') && <InfoBox icon="📦" label="Opslag" value={`${storedCount} / ${storageMax}`} />}
        {villa.modules.includes('wapenkamer') && <InfoBox icon="🔫" label="Ammo Opslag" value={`${villa.storedAmmo}`} />}
        {villa.modules.includes('helipad') && <InfoBox icon="🚁" label="Helipad" value={villa.helipadUsedToday ? 'Gebruikt' : 'Beschikbaar'} />}
      </div>

      {/* Helipad quick travel */}
      {villa.modules.includes('helipad') && !villa.helipadUsedToday && (
        <HelipadTravel />
      )}
    </div>
  );
}

function HelipadTravel() {
  const { state, dispatch, showToast } = useGame();
  const districts = Object.entries(DISTRICTS).filter(([id]) => id !== state.loc);

  return (
    <div className="space-y-2">
      <p className="text-[0.6rem] text-muted-foreground font-bold uppercase">🚁 Snel Reizen (0 heat, 0 kosten)</p>
      <div className="grid grid-cols-2 gap-1">
        {districts.map(([id, d]) => (
          <GameButton key={id} variant="ghost" size="sm" onClick={() => {
            dispatch({ type: 'VILLA_HELIPAD_TRAVEL', to: id as DistrictId });
            showToast(`Per helikopter naar ${d.name}!`);
          }}>
            <Navigation size={10} /> {d.name}
          </GameButton>
        ))}
      </div>
    </div>
  );
}

function ProductionTab() {
  const { state } = useGame();
  const villa = state.villa!;
  const hasWiet = villa.modules.includes('wietplantage');
  const hasCoke = villa.modules.includes('coke_lab');
  const hasLab = villa.modules.includes('synthetica_lab');

  return (
    <div className="game-card p-3 space-y-3">
      <SectionHeader title="Productie" />
      {!hasWiet && !hasCoke && !hasLab && (
        <p className="text-xs text-muted-foreground text-center py-4">Geen productie-modules geïnstalleerd. Ga naar Modules om te beginnen.</p>
      )}
      {hasWiet && (
        <div className="bg-emerald/5 border border-emerald/20 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <span>🌿</span>
            <span className="text-xs font-bold text-emerald">Wietplantage</span>
          </div>
          <p className="text-[0.6rem] text-muted-foreground">Produceert 5-10 Synthetica per nacht. Geen input nodig.</p>
          <p className="text-[0.6rem] text-emerald mt-1">Status: Actief ✓</p>
        </div>
      )}
      {hasCoke && (
        <div className="bg-game-purple/5 border border-game-purple/20 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <span>💎</span>
            <span className="text-xs font-bold text-game-purple">Coke Laboratorium</span>
          </div>
          <p className="text-[0.6rem] text-muted-foreground">Produceert 3-5 Geroofde Kunst (Puur Wit) per nacht. Vereist chemicaliën (2 per eenheid).</p>
          <p className="text-[0.6rem] text-game-purple mt-1">Chemicaliën: {state.lab.chemicals}</p>
        </div>
      )}
      {hasLab && (
        <div className="bg-blood/5 border border-blood/20 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <span>🧪</span>
            <span className="text-xs font-bold text-blood">Synthetica Lab</span>
          </div>
          <p className="text-[0.6rem] text-muted-foreground">Produceert Synthetica uit chemicaliën (max 15/nacht).</p>
          <p className="text-[0.6rem] text-blood mt-1">Chemicaliën: {state.lab.chemicals}</p>
        </div>
      )}
    </div>
  );
}

function StorageTab({ depositAmount, setDepositAmount, goodDepositGood, setGoodDepositGood }: {
  depositAmount: number; setDepositAmount: (n: number) => void;
  goodDepositGood: GoodId; setGoodDepositGood: (g: GoodId) => void;
}) {
  const { state, dispatch, showToast } = useGame();
  const villa = state.villa!;
  const hasVault = villa.modules.includes('kluis');
  const hasStorage = villa.modules.includes('opslagkelder');
  const hasAmmo = villa.modules.includes('wapenkamer');

  const vaultMax = getVaultMax(villa.level);
  const storageMax = getStorageMax(villa.level);
  const storedCount = Object.values(villa.storedGoods).reduce((a, b) => a + (b || 0), 0);

  return (
    <div className="game-card p-3 space-y-4">
      <SectionHeader title="Veilige Opslag" badge="Anti-Arrestatie" />

      {/* Money Vault */}
      {hasVault ? (
        <div className="bg-gold/5 border border-gold/20 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gold">🔐 Kluis</span>
            <span className="text-[0.6rem] text-muted-foreground">€{villa.vaultMoney.toLocaleString()} / €{vaultMax.toLocaleString()}</span>
          </div>
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gold/60 rounded-full" style={{ width: `${(villa.vaultMoney / vaultMax) * 100}%` }} />
          </div>
          <div className="flex gap-1">
            {[5000, 10000, 25000, 50000].map(amt => (
              <button key={amt} onClick={() => setDepositAmount(amt)}
                className={`flex-1 text-[0.55rem] py-1 rounded border ${depositAmount === amt ? 'border-gold text-gold bg-gold/10' : 'border-border text-muted-foreground'}`}>
                €{(amt / 1000)}k
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            <GameButton variant="gold" size="sm" fullWidth onClick={() => {
              dispatch({ type: 'DEPOSIT_VILLA_MONEY', amount: depositAmount });
              showToast(`€${Math.min(depositAmount, state.money, vaultMax - villa.vaultMoney).toLocaleString()} gestort in kluis`);
            }} disabled={state.money <= 0 || villa.vaultMoney >= vaultMax}>
              <ArrowDown size={10} /> STORTEN
            </GameButton>
            <GameButton variant="ghost" size="sm" fullWidth onClick={() => {
              dispatch({ type: 'WITHDRAW_VILLA_MONEY', amount: depositAmount });
              showToast(`€${Math.min(depositAmount, villa.vaultMoney).toLocaleString()} opgenomen`);
            }} disabled={villa.vaultMoney <= 0}>
              <ArrowUp size={10} /> OPNEMEN
            </GameButton>
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground text-center">Installeer de Kluis module om geld veilig op te slaan.</p>
      )}

      {/* Goods Storage */}
      {hasStorage && (
        <div className="bg-ice/5 border border-ice/20 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-ice">📦 Opslagkelder</span>
            <span className="text-[0.6rem] text-muted-foreground">{storedCount} / {storageMax} items</span>
          </div>
          {/* Stored goods list */}
          {Object.entries(villa.storedGoods).filter(([, v]) => (v || 0) > 0).map(([gid, qty]) => {
            const good = GOODS.find(g => g.id === gid);
            return (
              <div key={gid} className="flex items-center justify-between text-[0.6rem]">
                <span className="text-muted-foreground">{good?.name || gid}: {qty}</span>
                <button onClick={() => dispatch({ type: 'WITHDRAW_VILLA_GOODS', goodId: gid as GoodId, amount: 1 })}
                  className="text-ice text-[0.55rem] underline">opnemen</button>
              </div>
            );
          })}
          {/* Deposit goods */}
          <div className="flex gap-1 mt-2">
            <select value={goodDepositGood} onChange={e => setGoodDepositGood(e.target.value as GoodId)}
              className="flex-1 bg-muted border border-border rounded text-[0.6rem] px-1 py-1 text-foreground">
              {GOODS.map(g => <option key={g.id} value={g.id}>{g.name} ({state.inventory[g.id] || 0})</option>)}
            </select>
            <GameButton variant="purple" size="sm" onClick={() => {
              dispatch({ type: 'DEPOSIT_VILLA_GOODS', goodId: goodDepositGood, amount: 1 });
            }} disabled={(state.inventory[goodDepositGood] || 0) <= 0 || storedCount >= storageMax}>
              +1
            </GameButton>
            <GameButton variant="purple" size="sm" onClick={() => {
              dispatch({ type: 'DEPOSIT_VILLA_GOODS', goodId: goodDepositGood, amount: 5 });
            }} disabled={(state.inventory[goodDepositGood] || 0) <= 0 || storedCount >= storageMax}>
              +5
            </GameButton>
          </div>
        </div>
      )}

      {/* Ammo Storage */}
      {hasAmmo && (
        <div className="bg-blood/5 border border-blood/20 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blood">🔫 Wapenkamer</span>
            <span className="text-[0.6rem] text-muted-foreground">{villa.storedAmmo} kogels opgeslagen</span>
          </div>
          <div className="flex gap-1">
            <GameButton variant="blood" size="sm" fullWidth onClick={() => {
              dispatch({ type: 'DEPOSIT_VILLA_AMMO', amount: 6 });
            }} disabled={(state.ammo || 0) <= 0}>
              <ArrowDown size={10} /> OPSLAAN (6)
            </GameButton>
            <GameButton variant="ghost" size="sm" fullWidth onClick={() => {
              dispatch({ type: 'WITHDRAW_VILLA_AMMO', amount: 6 });
            }} disabled={villa.storedAmmo <= 0}>
              <ArrowUp size={10} /> OPNEMEN (6)
            </GameButton>
          </div>
        </div>
      )}
    </div>
  );
}

function ModulesTab() {
  const { state, dispatch, showToast } = useGame();
  const villa = state.villa!;

  return (
    <div className="game-card p-3 space-y-2">
      <SectionHeader title="Modules" badge={`Level ${villa.level}`} />
      {VILLA_MODULES.map(mod => {
        const installed = villa.modules.includes(mod.id);
        const canAfford = state.money >= mod.cost;
        const meetsLevel = villa.level >= mod.reqLevel;
        return (
          <div key={mod.id} className={`border rounded-lg p-2.5 ${installed ? 'border-emerald/30 bg-emerald/5' : 'border-border bg-muted/20'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">{mod.icon}</span>
                <div>
                  <p className={`text-xs font-bold ${installed ? 'text-emerald' : 'text-foreground'}`}>{mod.name}</p>
                  <p className="text-[0.55rem] text-muted-foreground">{mod.desc}</p>
                </div>
              </div>
              {installed ? (
                <span className="text-[0.55rem] text-emerald font-bold">✓ ACTIEF</span>
              ) : (
                <GameButton variant={meetsLevel ? 'gold' : 'muted'} size="sm" disabled={!canAfford || !meetsLevel}
                  onClick={() => {
                    dispatch({ type: 'INSTALL_VILLA_MODULE', moduleId: mod.id });
                    showToast(`${mod.name} geïnstalleerd!`);
                  }}>
                  {!meetsLevel ? `LVL ${mod.reqLevel}` : `€${mod.cost.toLocaleString()}`}
                </GameButton>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function InfoBox({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="bg-muted/30 rounded-lg p-2 text-center">
      <span className="text-sm">{icon}</span>
      <p className="text-[0.55rem] text-muted-foreground mt-0.5">{label}</p>
      <p className="text-xs font-bold text-foreground">{value}</p>
    </div>
  );
}
