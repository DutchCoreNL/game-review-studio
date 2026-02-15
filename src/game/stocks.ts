import { GameState } from './types';
import { addPhoneMessage } from './newFeatures';

// ========== STOCK TYPES ==========

export type StockId = 'nero_shipping' | 'crown_pharma' | 'iron_steel' | 'neon_media' | 'shadow_tech';

export interface StockDef {
  id: StockId;
  name: string;
  sector: string;
  basePrice: number;
  volatility: number; // 0.02 - 0.08
  dividendRate: number; // 0 - 0.02 per day
  icon: string;
  color: string;
}

export interface StockHolding {
  shares: number;
  avgBuyPrice: number;
}

export interface StockEvent {
  id: string;
  name: string;
  desc: string;
  effects: Partial<Record<StockId, number>>; // multiplier
  daysLeft: number;
}

export interface InsiderTip {
  stockId: StockId;
  direction: 'up' | 'down';
  magnitude: 'klein' | 'groot';
  source: string;
  expiresDay: number;
}

// ========== STOCK DEFINITIONS ==========

export const STOCKS: StockDef[] = [
  { id: 'nero_shipping', name: 'Nero Shipping Co.', sector: 'Transport', basePrice: 150, volatility: 0.04, dividendRate: 0.008, icon: '🚢', color: 'hsl(var(--blood))' },
  { id: 'crown_pharma', name: 'Crown Pharmaceuticals', sector: 'Farma', basePrice: 280, volatility: 0.05, dividendRate: 0.012, icon: '💊', color: 'hsl(var(--ice))' },
  { id: 'iron_steel', name: 'Iron Steel Industries', sector: 'Industrie', basePrice: 95, volatility: 0.03, dividendRate: 0.015, icon: '⚙️', color: 'hsl(var(--gold))' },
  { id: 'neon_media', name: 'Neon Media Group', sector: 'Media', basePrice: 420, volatility: 0.07, dividendRate: 0.005, icon: '📡', color: 'hsl(var(--game-purple))' },
  { id: 'shadow_tech', name: 'Shadow Technologies', sector: 'Tech', basePrice: 350, volatility: 0.06, dividendRate: 0.003, icon: '🖥️', color: 'hsl(var(--emerald))' },
];

export const STOCK_IDS: StockId[] = ['nero_shipping', 'crown_pharma', 'iron_steel', 'neon_media', 'shadow_tech'];

// ========== STOCK EVENTS ==========

const STOCK_EVENTS_POOL: Omit<StockEvent, 'daysLeft'>[] = [
  { id: 'port_strike', name: '🚢 Havenstaking', desc: 'Havenarbeiders staken — Nero Shipping getroffen.', effects: { nero_shipping: 0.7 } },
  { id: 'pharma_scandal', name: '💊 Farma Schandaal', desc: 'Crown Pharma betrokken bij fraude-onderzoek.', effects: { crown_pharma: 0.6 } },
  { id: 'steel_boom', name: '⚙️ Staal Hausse', desc: 'Bouwprojecten stuwen staalprijzen omhoog.', effects: { iron_steel: 1.4 } },
  { id: 'media_viral', name: '📡 Viral Content', desc: 'Neon Media scoort een megahit — aandeel stijgt.', effects: { neon_media: 1.5 } },
  { id: 'tech_breach', name: '🖥️ Datalek', desc: 'Shadow Tech gehackt — vertrouwen daalt.', effects: { shadow_tech: 0.65 } },
  { id: 'market_crash', name: '📉 Marktcrash', desc: 'Paniek op de beurs — alles daalt.', effects: { nero_shipping: 0.8, crown_pharma: 0.75, iron_steel: 0.85, neon_media: 0.7, shadow_tech: 0.8 } },
  { id: 'bull_run', name: '📈 Bull Run', desc: 'Alles stijgt — investeerders zijn euforisch.', effects: { nero_shipping: 1.2, crown_pharma: 1.15, iron_steel: 1.25, neon_media: 1.3, shadow_tech: 1.2 } },
  { id: 'pharma_breakthrough', name: '🧬 Doorbraak', desc: 'Crown Pharma kondigt een wondermiddel aan.', effects: { crown_pharma: 1.6 } },
  { id: 'tech_contract', name: '🤝 Overheidscontract', desc: 'Shadow Tech wint een groot defensiecontract.', effects: { shadow_tech: 1.4 } },
  { id: 'shipping_deal', name: '🌍 Handelsverdrag', desc: 'Nieuw handelsverdrag boost transport-sector.', effects: { nero_shipping: 1.35, iron_steel: 1.15 } },
];

// ========== STOCK MARKET LOGIC ==========

/** Initialize stock market state if needed */
export function ensureStockState(state: GameState): void {
  if (!state.stockPrices) {
    state.stockPrices = {} as Record<StockId, number>;
    STOCKS.forEach(s => { state.stockPrices![s.id] = s.basePrice; });
  }
  if (!state.stockHistory) {
    state.stockHistory = {} as Record<StockId, number[]>;
    STOCKS.forEach(s => { state.stockHistory![s.id] = [s.basePrice]; });
  }
  if (!state.stockHoldings) {
    state.stockHoldings = {} as Record<StockId, StockHolding>;
  }
  if (!state.stockEvents) state.stockEvents = [];
  if (state.pendingInsiderTip === undefined) state.pendingInsiderTip = null;
}

/** Daily stock price update */
export function updateStockPrices(state: GameState, report: any): void {
  ensureStockState(state);
  
  // Process active stock events
  const eventEffects: Partial<Record<StockId, number>> = {};
  if (state.stockEvents) {
    for (let i = state.stockEvents.length - 1; i >= 0; i--) {
      const evt = state.stockEvents[i];
      evt.daysLeft--;
      Object.entries(evt.effects).forEach(([sid, mult]) => {
        eventEffects[sid as StockId] = (eventEffects[sid as StockId] || 1) * (mult as number);
      });
      if (evt.daysLeft <= 0) state.stockEvents.splice(i, 1);
    }
  }
  
  // Update prices
  const priceChanges: { stockId: StockId; oldPrice: number; newPrice: number; change: number }[] = [];
  
  STOCKS.forEach(stock => {
    const oldPrice = state.stockPrices![stock.id];
    
    // Random daily fluctuation
    const randomChange = (Math.random() * 2 - 1) * stock.volatility;
    
    // Event effect
    const eventMult = eventEffects[stock.id] || 1;
    
    // Game event correlation (market events affect stocks too)
    let gameEventMult = 1;
    if (state.activeMarketEvent) {
      // Drug bust boosts pharma, police sweep drops everything
      if (state.activeMarketEvent.id === 'drug_bust') gameEventMult = stock.id === 'crown_pharma' ? 1.05 : 1;
      if (state.activeMarketEvent.id === 'police_sweep') gameEventMult = 0.97;
      if (state.activeMarketEvent.id === 'tech_boom') gameEventMult = stock.id === 'shadow_tech' ? 1.08 : stock.id === 'neon_media' ? 1.04 : 1;
      if (state.activeMarketEvent.id === 'cartel_war') gameEventMult = stock.id === 'iron_steel' ? 1.06 : 0.98;
      if (state.activeMarketEvent.id === 'port_blockade') gameEventMult = stock.id === 'nero_shipping' ? 0.9 : 1;
    }
    
    // Apply changes with mean-reversion toward base price
    const meanReversion = (stock.basePrice - oldPrice) * 0.01;
    const changePercent = randomChange + meanReversion;
    let newPrice = Math.round(oldPrice * (1 + changePercent) * eventMult * gameEventMult);
    
    // Floor at 10% of base, cap at 500% of base
    newPrice = Math.max(Math.floor(stock.basePrice * 0.1), Math.min(Math.floor(stock.basePrice * 5), newPrice));
    
    state.stockPrices![stock.id] = newPrice;
    
    // Track history (30 days)
    if (!state.stockHistory![stock.id]) state.stockHistory![stock.id] = [];
    state.stockHistory![stock.id].push(newPrice);
    if (state.stockHistory![stock.id].length > 30) {
      state.stockHistory![stock.id] = state.stockHistory![stock.id].slice(-30);
    }
    
    const change = newPrice - oldPrice;
    if (change !== 0) priceChanges.push({ stockId: stock.id, oldPrice, newPrice, change });
  });
  
  // Report stock changes
  if (priceChanges.length > 0) {
    report.stockChanges = priceChanges;
  }
  
  // Pay dividends
  let totalDividend = 0;
  STOCKS.forEach(stock => {
    const holding = state.stockHoldings?.[stock.id];
    if (!holding || holding.shares <= 0 || stock.dividendRate <= 0) return;
    
    const dividend = Math.floor(state.stockPrices![stock.id] * stock.dividendRate * holding.shares);
    if (dividend > 0) {
      state.money += dividend;
      state.stats.totalEarned += dividend;
      totalDividend += dividend;
    }
  });
  
  if (totalDividend > 0) report.stockDividend = totalDividend;
  
  // Roll for new stock event (10% chance if none active)
  if ((!state.stockEvents || state.stockEvents.length === 0) && Math.random() < 0.1) {
    const template = STOCK_EVENTS_POOL[Math.floor(Math.random() * STOCK_EVENTS_POOL.length)];
    const evt: StockEvent = { ...template, daysLeft: 1 + Math.floor(Math.random() * 2) };
    state.stockEvents!.push(evt);
    report.stockEvent = { name: evt.name, desc: evt.desc };
    addPhoneMessage(state, '📈 Beurs', `${evt.name}: ${evt.desc}`, 'info');
  }
  
  // Insider tip generation (separate function to avoid async)
  rollInsiderTip(state);
}

/** Generate insider tip (called separately to avoid async issues) */
export function rollInsiderTip(state: GameState): void {
  if (state.pendingInsiderTip) return;
  if (Math.random() > 0.05) return;
  
  // Check for intel-providing contacts
  const hasIntel = state.corruptContacts?.some(c => c.active && !c.compromised);
  if (!hasIntel) return;
  
  const stock = STOCKS[Math.floor(Math.random() * STOCKS.length)];
  const direction: 'up' | 'down' = Math.random() > 0.5 ? 'up' : 'down';
  const magnitude: 'klein' | 'groot' = Math.random() > 0.7 ? 'groot' : 'klein';
  
  state.pendingInsiderTip = {
    stockId: stock.id,
    direction,
    magnitude,
    source: 'Inspecteur De Vries',
    expiresDay: state.day + 2,
  };
}

/** Buy stocks */
export function buyStock(state: GameState, stockId: StockId, shares: number): { success: boolean; message: string } {
  ensureStockState(state);
  
  const price = state.stockPrices![stockId];
  const totalCost = price * shares;
  
  if (state.money < totalCost) {
    return { success: false, message: 'Niet genoeg geld.' };
  }
  
  state.money -= totalCost;
  state.stats.totalSpent += totalCost;
  
  const holding = state.stockHoldings![stockId] || { shares: 0, avgBuyPrice: 0 };
  const totalShares = holding.shares + shares;
  holding.avgBuyPrice = Math.floor(((holding.avgBuyPrice * holding.shares) + (price * shares)) / totalShares);
  holding.shares = totalShares;
  state.stockHoldings![stockId] = holding;
  
  const stock = STOCKS.find(s => s.id === stockId)!;
  return { success: true, message: `${shares}x ${stock.name} gekocht voor €${totalCost.toLocaleString()}.` };
}

/** Sell stocks */
export function sellStock(state: GameState, stockId: StockId, shares: number): { success: boolean; message: string; profit?: number } {
  ensureStockState(state);
  
  const holding = state.stockHoldings![stockId];
  if (!holding || holding.shares < shares) {
    return { success: false, message: 'Niet genoeg aandelen.' };
  }
  
  const price = state.stockPrices![stockId];
  const totalRevenue = price * shares;
  const profit = (price - holding.avgBuyPrice) * shares;
  
  state.money += totalRevenue;
  state.stats.totalEarned += totalRevenue;
  
  holding.shares -= shares;
  if (holding.shares <= 0) {
    delete state.stockHoldings![stockId];
  }
  
  const stock = STOCKS.find(s => s.id === stockId)!;
  return { success: true, message: `${shares}x ${stock.name} verkocht voor €${totalRevenue.toLocaleString()}.`, profit };
}

/** Calculate total portfolio value */
export function getPortfolioValue(state: GameState): number {
  ensureStockState(state);
  let total = 0;
  STOCKS.forEach(stock => {
    const holding = state.stockHoldings?.[stock.id];
    if (holding && holding.shares > 0) {
      total += state.stockPrices![stock.id] * holding.shares;
    }
  });
  return total;
}

/** Get total invested amount */
export function getPortfolioCost(state: GameState): number {
  let total = 0;
  STOCKS.forEach(stock => {
    const holding = state.stockHoldings?.[stock.id];
    if (holding && holding.shares > 0) {
      total += holding.avgBuyPrice * holding.shares;
    }
  });
  return total;
}
