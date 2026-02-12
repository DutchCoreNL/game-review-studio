import { useGame } from '@/contexts/GameContext';
import { VILLA_COST, VILLA_REQ_LEVEL, VILLA_REQ_REP, VILLA_UPGRADE_COSTS, VILLA_MODULES, VILLA_PRESTIGE_UPGRADES, getVaultMax, getStorageMax } from '@/game/villa';
import { GOODS, DISTRICTS } from '@/game/constants';
import { GoodId, DistrictId, VillaModuleId } from '@/game/types';
import { GameButton } from '../ui/GameButton';
import { SectionHeader } from '../ui/SectionHeader';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, ArrowUp, ArrowDown, Package, DollarSign, Shield, Factory, Users, Navigation, Sparkles } from 'lucide-react';
import villaBg from '@/assets/villa-bg.jpg';
import { VILLA_MODULE_IMAGES } from '@/assets/items';

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
    <div className="relative min-h-[70vh] -mx-3 -mt-2 px-3 pt-2">
      <img src={villaBg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-25 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent pointer-events-none" />
      <div className="relative z-10 space-y-3">
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
    </div>
  );
}

function OverviewTab() {
  const { state, dispatch, showToast } = useGame();
  const villa = state.villa!;
  const prestige = villa.prestigeModules || [];
  const vaultMax = getVaultMax(villa.level, prestige.includes('kluis'));
  const storageMax = getStorageMax(villa.level, prestige.includes('opslagkelder'));
  const storedCount = Object.values(villa.storedGoods).reduce((a, b) => a + (b || 0), 0);

  const partyCost = [0, 15000, 25000, 40000][villa.level] || 15000;
  const cooldownDays = 5;
  const daysSinceParty = state.day - (villa.lastPartyDay || 0);
  const canParty = villa.modules.includes('zwembad') && state.money >= partyCost && daysSinceParty >= cooldownDays;
  const partyCooldownLeft = Math.max(0, cooldownDays - daysSinceParty);
  const relBoost = [0, 8, 12, 18][villa.level] || 8;
  const repBoost = [0, 15, 25, 40][villa.level] || 15;

  // Defense score calculation
  const baseDefense = villa.level * 10;
  const moduleDefense = (villa.modules.includes('camera') ? 25 : 0)
    + (villa.modules.includes('wapenkamer') ? 10 : 0)
    + (villa.modules.includes('commandocentrum') ? 15 : 0);
  const tunnelBonus = villa.modules.includes('tunnel');
  const cameraBonus = villa.modules.includes('camera');
  const totalDefense = baseDefense + moduleDefense;
  const maxDefense = 30 + 25 + 10 + 15; // max level (30) + camera (25) + wapenkamer (10) + commando (15)
  const defensePct = Math.min(100, Math.round((totalDefense / maxDefense) * 100));

  const defenseRating = totalDefense >= 60 ? 'FORT KNOX' : totalDefense >= 40 ? 'GOED BEWAAKT' : totalDefense >= 20 ? 'REDELIJK' : 'KWETSBAAR';
  const defenseColor = totalDefense >= 60 ? 'text-emerald' : totalDefense >= 40 ? 'text-gold' : totalDefense >= 20 ? 'text-orange-400' : 'text-blood';

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

      {/* Defense Score */}
      <div className="bg-muted/30 border border-border rounded-lg p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield size={14} className={defenseColor} />
            <span className="text-xs font-bold">Verdedigingsscore</span>
          </div>
          <span className={`text-xs font-bold ${defenseColor}`}>{defenseRating}</span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${totalDefense >= 60 ? 'bg-emerald' : totalDefense >= 40 ? 'bg-gold' : totalDefense >= 20 ? 'bg-orange-400' : 'bg-blood'}`}
            initial={{ width: 0 }}
            animate={{ width: `${defensePct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between text-[0.55rem] text-muted-foreground">
          <span>{totalDefense} / {maxDefense} punten</span>
          <span>{defensePct}%</span>
        </div>
        <div className="space-y-1 mt-1">
          <div className="flex items-center justify-between text-[0.5rem]">
            <span className="text-muted-foreground">🏛️ Villa Level {villa.level}</span>
            <span className="text-foreground font-bold">+{baseDefense}</span>
          </div>
          {cameraBonus && (
            <div className="flex items-center justify-between text-[0.5rem]">
              <span className="text-muted-foreground">📹 Camera's (-30% aanvalkans)</span>
              <span className="text-emerald font-bold">+25</span>
            </div>
          )}
          {villa.modules.includes('wapenkamer') && (
            <div className="flex items-center justify-between text-[0.5rem]">
              <span className="text-muted-foreground">🔫 Wapenkamer</span>
              <span className="text-emerald font-bold">+10</span>
            </div>
          )}
          {villa.modules.includes('commandocentrum') && (
            <div className="flex items-center justify-between text-[0.5rem]">
              <span className="text-muted-foreground">🎯 Commandocentrum</span>
              <span className="text-emerald font-bold">+15</span>
            </div>
          )}
          {tunnelBonus && (
            <div className="flex items-center justify-between text-[0.5rem]">
              <span className="text-muted-foreground">🕳️ Tunnel (verlies gehalveerd)</span>
              <span className="text-gold font-bold">✓</span>
            </div>
          )}
          {!cameraBonus && !tunnelBonus && !villa.modules.includes('wapenkamer') && !villa.modules.includes('commandocentrum') && (
            <p className="text-[0.5rem] text-muted-foreground italic">Installeer verdedigingsmodules om je score te verhogen.</p>
          )}
        </div>
      </div>

      {/* Helipad quick travel */}
      {villa.modules.includes('helipad') && !villa.helipadUsedToday && (
        <HelipadTravel />
      )}

      {/* Party section */}
      {villa.modules.includes('zwembad') && (
        <div className="bg-gold/5 border border-gold/20 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-base">🎉</span>
            <div>
              <p className="text-xs font-bold text-gold">Feest Geven</p>
              <p className="text-[0.55rem] text-muted-foreground">
                Nodig alle facties uit. +{relBoost} relaties, +{repBoost} rep, +10 crew HP.
              </p>
            </div>
          </div>
          {partyCooldownLeft > 0 && (
            <p className="text-[0.55rem] text-muted-foreground">⏳ Cooldown: nog {partyCooldownLeft} {partyCooldownLeft === 1 ? 'dag' : 'dagen'}</p>
          )}
          <GameButton variant="gold" size="sm" fullWidth glow disabled={!canParty}
            onClick={() => {
              dispatch({ type: 'VILLA_THROW_PARTY' });
              showToast(`🎉 Legendarisch feest! +${relBoost} factie-relaties, +${repBoost} rep!`);
            }}>
            🎉 FEEST GEVEN — €{partyCost.toLocaleString()}
          </GameButton>
        </div>
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

  const prestige = villa.prestigeModules || [];
  const vaultMax = getVaultMax(villa.level, prestige.includes('kluis'));
  const storageMax = getStorageMax(villa.level, prestige.includes('opslagkelder'));
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
  const prestige = villa.prestigeModules || [];

  return (
    <div className="game-card p-3 space-y-2">
      <SectionHeader title="Modules" badge={`Level ${villa.level}`} />
      {VILLA_MODULES.map(mod => {
        const installed = villa.modules.includes(mod.id);
        const canAfford = state.money >= mod.cost;
        const meetsLevel = villa.level >= mod.reqLevel;
        const isPrestiged = prestige.includes(mod.id);
        const prestigeDef = VILLA_PRESTIGE_UPGRADES.find(p => p.id === mod.id);
        const canPrestige = installed && !isPrestiged && villa.level >= 3 && prestigeDef && state.money >= prestigeDef.cost;
        return (
          <div key={mod.id} className={`border rounded-lg p-2.5 ${
            isPrestiged ? 'border-gold/50 bg-gold/10 ring-1 ring-gold/20' :
            installed ? 'border-emerald/30 bg-emerald/5' : 'border-border bg-muted/20'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-10 h-10 rounded overflow-hidden flex-shrink-0 border ${isPrestiged ? 'border-gold/50 ring-1 ring-gold/30' : 'border-border'}`}>
                  {VILLA_MODULE_IMAGES[mod.id] ? (
                    <img src={VILLA_MODULE_IMAGES[mod.id]} alt={mod.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center text-base">{mod.icon}</div>
                  )}
                </div>
                <div>
                  <p className={`text-xs font-bold ${isPrestiged ? 'text-gold' : installed ? 'text-emerald' : 'text-foreground'}`}>
                    {isPrestiged && '👑 '}{mod.name}
                  </p>
                  <p className="text-[0.55rem] text-muted-foreground">{mod.desc}</p>
                  {isPrestiged && prestigeDef && (
                    <p className="text-[0.45rem] text-gold font-bold mt-0.5">✦ {prestigeDef.bonus}</p>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                {isPrestiged ? (
                  <span className="text-[0.5rem] text-gold font-bold">👑 PRESTIGE</span>
                ) : installed ? (
                  <>
                    <span className="text-[0.55rem] text-emerald font-bold">✓ ACTIEF</span>
                    {villa.level >= 3 && prestigeDef && (
                      <GameButton variant="gold" size="sm" disabled={!canPrestige} glow={canPrestige}
                        onClick={() => {
                          dispatch({ type: 'PRESTIGE_VILLA_MODULE', moduleId: mod.id });
                          showToast(`👑 ${mod.name} is nu Prestige!`);
                        }}>
                        👑 €{prestigeDef.cost.toLocaleString()}
                      </GameButton>
                    )}
                  </>
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
          </div>
        );
      })}

      {/* Prestige info */}
      {villa.level >= 3 && (
        <div className="bg-gold/5 border border-gold/20 rounded-lg p-2.5 mt-3">
          <p className="text-[0.6rem] text-gold font-bold">👑 Prestige Upgrades</p>
          <p className="text-[0.5rem] text-muted-foreground mt-0.5">
            Villa Level 3 ontgrendelt gouden prestige-versies van alle modules. Prestige-modules bieden sterkere bonussen en gouden status.
          </p>
          <p className="text-[0.45rem] text-gold/70 mt-1">
            {prestige.length}/{VILLA_MODULES.length} modules geprestiged
          </p>
        </div>
      )}
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
