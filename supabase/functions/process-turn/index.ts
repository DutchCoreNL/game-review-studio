import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ========== INLINED CONSTANTS ==========

const DISTRICTS: Record<string, { name: string; income: number; mods: Record<string, number> }> = {
  port: { name: "Port Nero", income: 450, mods: { drugs: 0.7, weapons: 0.6, tech: 1.3, luxury: 1.4, meds: 0.8 } },
  crown: { name: "Crown Heights", income: 2800, mods: { drugs: 1.6, weapons: 1.4, tech: 0.6, luxury: 1.8, meds: 1.3 } },
  iron: { name: "Iron Borough", income: 900, mods: { drugs: 1.2, weapons: 0.5, tech: 0.8, luxury: 1.1, meds: 1.0 } },
  low: { name: "Lowrise", income: 250, mods: { drugs: 0.5, weapons: 1.5, tech: 1.0, luxury: 0.7, meds: 1.4 } },
  neon: { name: "Neon Strip", income: 1600, mods: { drugs: 1.4, weapons: 1.2, tech: 1.6, luxury: 0.9, meds: 0.6 } },
};

const BUSINESSES: Record<string, { income: number; clean: number }> = {
  restaurant: { income: 400, clean: 300 },
  club: { income: 800, clean: 600 },
  autogarage: { income: 500, clean: 400 },
  ammo_factory: { income: 0, clean: 0 },
  haven_import: { income: 1200, clean: 800 },
  goudhandel: { income: 1500, clean: 1200 },
  escort: { income: 1800, clean: 500 },
  bouwbedrijf: { income: 1000, clean: 1500 },
  cryptobeurs: { income: 2500, clean: 2000 },
  hotel: { income: 3000, clean: 2500 },
};

const GOODS = [
  { id: "drugs", name: "Synthetica", base: 200 },
  { id: "weapons", name: "Zware Wapens", base: 1100 },
  { id: "tech", name: "Zwarte Data", base: 900 },
  { id: "luxury", name: "Geroofde Kunst", base: 2400 },
  { id: "meds", name: "Medische Voorraad", base: 600 },
];

const GOOD_SPOILAGE: Record<string, number> = { drugs: 0.08, weapons: 0, tech: 0, luxury: 0, meds: 0.05 };

const FAMILIES: Record<string, { name: string; contact: string }> = {
  cartel: { name: "Rojo Cartel", contact: "El Serpiente" },
  syndicate: { name: "Blue Lotus", contact: "Mr. Wu" },
  bikers: { name: "Iron Skulls", contact: "Hammer" },
};

const POLICE_RAID_HEAT_THRESHOLD = 45;
const PRISON_ARREST_CHANCE_RAID = 0.30;
const PRISON_CREW_LOYALTY_PENALTY = 5;
const PRISON_CREW_DESERT_THRESHOLD = 4;

const PRISON_SENTENCE_TABLE = [
  { maxHeat: 30, days: 1 }, { maxHeat: 50, days: 2 }, { maxHeat: 70, days: 3 },
  { maxHeat: 85, days: 5 }, { maxHeat: 100, days: 7 },
];
const PRISON_MONEY_CONFISCATION = 0.20;
const PRISON_EVENTS = [
  { id: "cellmate_intel", effect: "brains_up", value: 1 },
  { id: "yard_fight", effect: "muscle_up", value: 1 },
  { id: "guard_deal", effect: "day_reduce", value: 1 },
  { id: "prison_respect", effect: "rep_up", value: 10 },
  { id: "infirmary", effect: "hp_loss", value: 15 },
  { id: "smooth_talker", effect: "charm_up", value: 1 },
  { id: "crew_letter", effect: "loyalty_up", value: 10 },
  { id: "bribe_guard", effect: "money_cost", value: 500 },
];

const CORRUPT_CONTACTS: Record<string, { type: string; name: string; monthlyCost: number; betrayalRisk: number; effects: Record<string, any> }> = {
  beat_cop: { type: "agent", name: "Agent Brouwer", monthlyCost: 1500, betrayalRisk: 5, effects: { heatReduction: 3, raidProtection: 15 } },
  vice_detective: { type: "detective", name: "Inspecteur De Vries", monthlyCost: 4000, betrayalRisk: 10, effects: { heatReduction: 5, raidProtection: 25, intelBonus: true } },
  customs_officer: { type: "customs", name: "Douanier Bakker", monthlyCost: 3000, betrayalRisk: 8, effects: { smuggleProtection: 40, tradeBonus: 10 } },
  district_judge: { type: "judge", name: "Rechter Van Dijk", monthlyCost: 6000, betrayalRisk: 15, effects: { fineReduction: 50, raidProtection: 10 } },
  city_councilor: { type: "politician", name: "Wethouder Jansen", monthlyCost: 8000, betrayalRisk: 20, effects: { heatReduction: 8, raidProtection: 35, fineReduction: 30, tradeBonus: 5 } },
  harbor_master: { type: "customs", name: "Havenmeester Krol", monthlyCost: 5000, betrayalRisk: 12, effects: { smuggleProtection: 60, tradeBonus: 15 } },
  defense_lawyer: { type: "lawyer", name: "Mr. Vermeer", monthlyCost: 5000, betrayalRisk: 8, effects: { fineReduction: 30, raidProtection: 5 } },
};

const AMMO_FACTORY_UPGRADES = [
  { level: 1, production: 3 }, { level: 2, production: 5 }, { level: 3, production: 8 },
];

const MARKET_EVENTS = [
  { id: "drug_bust", name: "Drugsbust", desc: "Synthetica schaars!", effects: { drugs: 2.2 }, duration: 2 },
  { id: "arms_deal", name: "Wapenembargo", desc: "Wapenprijzen kelderen.", effects: { weapons: 0.5 }, duration: 2 },
  { id: "data_leak", name: "Data Lek", desc: "Zwarte data waardeloos.", effects: { tech: 0.4 }, duration: 1 },
  { id: "art_forgery", name: "Vervalsingen", desc: "Kunstprijzen dalen.", effects: { luxury: 0.5 }, duration: 2 },
  { id: "med_shortage", name: "Medicijntekort", desc: "Medische goederen in hoge vraag!", effects: { meds: 2.5 }, duration: 2 },
  { id: "port_blockade", name: "Havenblokkade", desc: "Alles duurder via de haven.", effects: { drugs: 1.5, weapons: 1.4, luxury: 1.3 }, duration: 1 },
  { id: "tech_boom", name: "Tech Hausse", desc: "Vraag naar data explodeert!", effects: { tech: 2.0 }, duration: 2 },
  { id: "luxury_auction", name: "Geheime Veiling", desc: "Kunstprijzen stijgen!", effects: { luxury: 1.8 }, duration: 1 },
  { id: "cartel_war", name: "Karteloorlog", desc: "Drugs & wapens volatiel.", effects: { drugs: 1.6, weapons: 1.8 }, duration: 2 },
  { id: "police_sweep", name: "Grote Razzia", desc: "Alle prijzen dalen.", effects: { drugs: 0.6, weapons: 0.6, tech: 0.7, luxury: 0.6, meds: 0.8 }, duration: 1 },
];

const STOCK_DEFS = [
  { id: "nero_shipping", base: 150, volatility: 0.04, dividendRate: 0.008 },
  { id: "crown_pharma", base: 280, volatility: 0.05, dividendRate: 0.012 },
  { id: "iron_steel", base: 95, volatility: 0.03, dividendRate: 0.015 },
  { id: "neon_media", base: 420, volatility: 0.07, dividendRate: 0.005 },
  { id: "shadow_tech", base: 350, volatility: 0.06, dividendRate: 0.003 },
];

const LAB_OUTPUT_MULT: Record<number, number> = { 1: 1.0, 2: 1.5, 3: 2.0 };
const LAB_CHEM_REDUCTION: Record<number, number> = { 1: 1.0, 2: 0.8, 3: 0.7 };
const DRUG_TIER_HEAT_MULT: Record<number, number> = { 1: 1.0, 2: 1.5, 3: 2.5 };
const DRUG_TIER_PRICE_MULT: Record<number, number> = { 1: 1.0, 2: 1.8, 3: 3.0 };
const NOXCRYSTAL_HEAT = 15;
const NOXCRYSTAL_CHEM_COST = 10;
const MARKET_SHARE_GROWTH = 5;

const RAID_NAMES = ["Los Muertos", "De Schaduwjagers", "Sector 7", "Black Viper Crew", "De IJzeren Vuist", "Nachtwacht", "Rogue Unit", "De Bloedbroeders"];

// ========== HELPER FUNCTIONS ==========

function addPhoneMsg(s: any, sender: string, text: string, type: string) {
  if (!s.phone) s.phone = { messages: [], unread: 0 };
  s.phone.messages.unshift({ id: `msg_${Date.now()}_${Math.random().toString(36).slice(2,6)}`, sender, text, type, day: s.day, read: false });
  s.phone.unread = (s.phone.unread || 0) + 1;
  if (s.phone.messages.length > 50) s.phone.messages = s.phone.messages.slice(0, 50);
}

function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)); }

function getKarmaHeatDecay(karma: number): number {
  if (karma <= 20) return 0;
  return Math.floor(Math.min(1, (karma - 20) / 80) * 4);
}

function getKarmaRaidReduction(karma: number): number {
  if (karma <= 20) return 0;
  return Math.min(1, (karma - 20) / 80) * 0.25;
}

function getKarmaCrewHealBonus(karma: number): number {
  if (karma <= 20) return 0;
  return Math.min(1, (karma - 20) / 80) * 0.40;
}

function getCorruptionRaidProtection(s: any): number {
  if (!s.corruptContacts) return 0;
  let p = 0;
  for (const c of s.corruptContacts) {
    if (!c.active || c.compromised) continue;
    const def = CORRUPT_CONTACTS[c.contactDefId];
    if (def?.effects?.raidProtection) p += def.effects.raidProtection;
  }
  return Math.min(80, p);
}

function getCorruptionFineReduction(s: any): number {
  if (!s.corruptContacts) return 0;
  let r = 0;
  for (const c of s.corruptContacts) {
    if (!c.active || c.compromised) continue;
    const def = CORRUPT_CONTACTS[c.contactDefId];
    if (def?.effects?.fineReduction) r += def.effects.fineReduction;
  }
  return Math.min(70, r);
}

function getActiveVehicleHeat(s: any): number {
  const v = s.ownedVehicles?.find((v: any) => v.id === s.activeVehicle);
  return v?.vehicleHeat || 0;
}

function addPersonalHeat(s: any, amount: number) {
  s.personalHeat = clamp((s.personalHeat || 0) + amount, 0, 100);
}

function recomputeHeat(s: any) {
  s.heat = Math.max(getActiveVehicleHeat(s), s.personalHeat || 0);
}

function getVillaHeatReduction(s: any): number { return s.villa ? 10 : 0; }

function arrestPlayer(s: any, report: any) {
  const heat = s.personalHeat || 0;
  let sentence = 1;
  for (const entry of PRISON_SENTENCE_TABLE) {
    if (heat <= entry.maxHeat) { sentence = entry.days; break; }
    sentence = entry.days;
  }
  const hasLawyer = s.corruptContacts?.some((c: any) => {
    const def = CORRUPT_CONTACTS[c.contactDefId];
    return def?.type === "lawyer" && c.active && !c.compromised;
  });
  if (hasLawyer) sentence = Math.max(1, sentence - 1);
  if (s.villa?.modules?.includes("tunnel")) sentence = Math.max(1, Math.floor(sentence * 0.75));
  
  const moneyLost = Math.floor(s.money * PRISON_MONEY_CONFISCATION);
  const villaProtected = s.villa?.modules?.includes("kluis") ? Math.min(s.villa.vaultMoney || 0, 50000) : 0;
  const actualLoss = Math.max(0, moneyLost - villaProtected);
  s.money = Math.max(0, s.money - actualLoss);
  
  const dirtyMoneyLost = Math.floor((s.dirtyMoney || 0) * 0.5);
  s.dirtyMoney = Math.max(0, (s.dirtyMoney || 0) - dirtyMoneyLost);
  
  s.prison = {
    daysRemaining: sentence, totalSentence: sentence, dayServed: 0,
    moneyLost: actualLoss, dirtyMoneyLost, goodsLost: 0,
    events: [], escapeAttempted: false,
  };
  
  s.personalHeat = clamp(s.personalHeat - 30, 0, 100);
  s.ownedVehicles?.forEach((v: any) => { v.vehicleHeat = Math.max(0, (v.vehicleHeat || 0) - 20); });
  recomputeHeat(s);
  
  report.arrested = true;
  report.prisonSentence = sentence;
  addPhoneMsg(s, "NHPD", `Gearresteerd! Straf: ${sentence} dagen.`, "threat");
}

// ========== VILLA PRODUCTION ==========

function processVillaProduction(s: any): { wiet: number; coke: number; lab: number; heat: number } {
  const result = { wiet: 0, coke: 0, lab: 0, heat: 0 };
  if (!s.villa) return result;
  const villa = s.villa;
  const de = s.drugEmpire;
  const currentInv = Object.values(s.inventory || {}).reduce((a: number, b: any) => a + (b || 0), 0) as number;
  let space = (s.maxInv || 15) - currentInv;
  const prestige = villa.prestigeModules || [];
  
  const getLabTier = (id: string) => de?.labTiers?.[id] || 1;
  const getQuality = (id: string) => de?.selectedQuality?.[id] || 1;
  const isLabOffline = (id: string) => (de?.labOffline?.[id] || 0) > 0;
  const isDEA = () => (de?.deaInvestigation || 0) > 0;
  
  // Wietplantage
  if (villa.modules?.includes("wietplantage") && space > 0 && !isLabOffline("wietplantage") && !isDEA()) {
    const isPres = prestige.includes("wietplantage");
    const tier = getLabTier("wietplantage");
    const quality = getQuality("wietplantage");
    const baseYield = isPres ? (8 + Math.floor(Math.random() * 8)) : (5 + Math.floor(Math.random() * 6));
    const produced = Math.min(Math.floor(baseYield * LAB_OUTPUT_MULT[tier]), space);
    if (!s.inventory) s.inventory = {};
    s.inventory.drugs = (s.inventory.drugs || 0) + produced;
    result.wiet = produced; space -= produced;
    result.heat += Math.ceil(2 * DRUG_TIER_HEAT_MULT[quality]);
  }
  
  // Coke Lab
  if (villa.modules?.includes("coke_lab") && space > 0 && (s.lab?.chemicals || 0) > 0 && !isLabOffline("coke_lab") && !isDEA()) {
    const isPres = prestige.includes("coke_lab");
    const tier = getLabTier("coke_lab");
    const quality = getQuality("coke_lab");
    const chemRed = LAB_CHEM_REDUCTION[tier];
    const baseYield = isPres ? (5 + Math.floor(Math.random() * 4)) : (3 + Math.floor(Math.random() * 3));
    const chemsNeeded = Math.ceil(baseYield * 2 * chemRed);
    const chemsAvail = Math.min(s.lab.chemicals, chemsNeeded);
    const produced = Math.min(Math.floor(chemsAvail / Math.max(1, Math.ceil(2 * chemRed))), space);
    if (produced > 0) {
      s.lab.chemicals -= Math.ceil(produced * 2 * chemRed);
      s.inventory.luxury = (s.inventory.luxury || 0) + produced;
      result.coke = produced; space -= produced;
      result.heat += Math.ceil(5 * DRUG_TIER_HEAT_MULT[quality]);
    }
  }
  
  // Synthetica Lab
  if (villa.modules?.includes("synthetica_lab") && space > 0 && (s.lab?.chemicals || 0) > 0 && !isLabOffline("synthetica_lab") && !isDEA()) {
    const isPres = prestige.includes("synthetica_lab");
    const tier = getLabTier("synthetica_lab");
    const quality = getQuality("synthetica_lab");
    const chemRed = LAB_CHEM_REDUCTION[tier];
    const maxBatch = Math.floor(15 * LAB_OUTPUT_MULT[tier]);
    const batch = Math.min(Math.floor(s.lab.chemicals / Math.max(1, chemRed)), maxBatch, space);
    if (batch > 0) {
      s.lab.chemicals -= Math.ceil(batch * chemRed);
      s.inventory.drugs = (s.inventory.drugs || 0) + batch;
      result.lab = batch;
      result.heat += isPres ? 0 : Math.ceil(3 * DRUG_TIER_HEAT_MULT[quality]);
    }
  }
  
  return result;
}

// ========== DRUG EMPIRE NIGHT ==========

function processDrugEmpireNight(s: any): { dealerIncome: number; noxCrystal: number; riskEvent: any } {
  const result = { dealerIncome: 0, noxCrystal: 0, riskEvent: null as any };
  const de = s.drugEmpire;
  if (!de) return result;
  
  // Decrement offline timers
  for (const lab of ["wietplantage", "coke_lab", "synthetica_lab"]) {
    if ((de.labOffline?.[lab] || 0) > 0) de.labOffline[lab]--;
  }
  
  // DEA investigation
  if ((de.deaInvestigation || 0) > 0) { de.deaInvestigation--; return result; }
  
  // NoxCrystal
  const allTier3 = de.labTiers?.wietplantage >= 3 && de.labTiers?.coke_lab >= 3 && de.labTiers?.synthetica_lab >= 3;
  if (allTier3 && (s.lab?.chemicals || 0) >= NOXCRYSTAL_CHEM_COST && de.deaInvestigation <= 0) {
    const nox = 1 + (Math.random() < 0.3 ? 1 : 0);
    s.lab.chemicals -= NOXCRYSTAL_CHEM_COST;
    de.noxCrystalStock = (de.noxCrystalStock || 0) + nox;
    de.noxCrystalProduced = (de.noxCrystalProduced || 0) + nox;
    result.noxCrystal = nox;
  }
  
  // Dealer income
  for (const dealer of (de.dealers || [])) {
    dealer.daysActive = (dealer.daysActive || 0) + 1;
    dealer.marketShare = Math.min(100, (dealer.marketShare || 0) + MARKET_SHARE_GROWTH);
    const district = DISTRICTS[dealer.district];
    if (!district) continue;
    const good = GOODS.find((g: any) => g.id === dealer.product);
    if (!good) continue;
    const distMod = district.mods[dealer.product] || 1;
    const quality = de.selectedQuality?.[dealer.product === "drugs" ? "wietplantage" : dealer.product === "luxury" ? "coke_lab" : "synthetica_lab"] || 1;
    const priceMult = DRUG_TIER_PRICE_MULT[quality] || 1;
    const crewMember = s.crew?.find((c: any) => c.name === dealer.crewName);
    const dealerLevel = crewMember?.level || 1;
    const income = Math.floor(good.base * priceMult * distMod * (dealer.marketShare / 100) * (1 + dealerLevel * 0.1));
    s.money = (s.money || 0) + income;
    s.stats.totalEarned = (s.stats.totalEarned || 0) + income;
    de.totalDealerIncome = (de.totalDealerIncome || 0) + income;
    result.dealerIncome += income;
  }
  
  // Risk events
  if (s.heat > 60 && Math.random() < 0.2) {
    const activeLabs = ["wietplantage", "coke_lab", "synthetica_lab"].filter((l) => (de.labOffline?.[l] || 0) <= 0 && s.villa?.modules?.includes(l));
    if (activeLabs.length > 0) {
      const target = activeLabs[Math.floor(Math.random() * activeLabs.length)];
      de.labOffline[target] = 2;
      de.totalLabRaids = (de.totalLabRaids || 0) + 1;
      result.riskEvent = { type: "lab_raid", labId: target };
    }
  } else if (de.noxCrystalProduced > 0 && s.heat > 40 && Math.random() < 0.15) {
    de.deaInvestigation = 3;
    de.totalDeaInvestigations = (de.totalDeaInvestigations || 0) + 1;
    result.riskEvent = { type: "dea_investigation" };
  } else if (Math.random() < 0.10) {
    s.karma = Math.max(-100, (s.karma || 0) - 5);
    s.rep = Math.max(0, (s.rep || 0) - 10);
    de.totalContaminatedBatches = (de.totalContaminatedBatches || 0) + 1;
    result.riskEvent = { type: "contaminated_batch" };
  }
  
  return result;
}

// ========== CORRUPTION PROCESSING ==========

function processCorruption(s: any, report: any) {
  if (!s.corruptContacts || s.corruptContacts.length === 0) return;
  
  // Monthly payments (every 7 days)
  for (const contact of s.corruptContacts) {
    if (!contact.active || contact.compromised) continue;
    const daysSince = s.day - (contact.lastPaidDay || 0);
    if (daysSince >= 7) {
      const def = CORRUPT_CONTACTS[contact.contactDefId];
      if (!def) continue;
      if (s.money >= def.monthlyCost) {
        s.money -= def.monthlyCost;
        s.stats.totalSpent = (s.stats.totalSpent || 0) + def.monthlyCost;
        contact.lastPaidDay = s.day;
        contact.loyalty = Math.min(100, (contact.loyalty || 50) + 5);
      } else {
        contact.loyalty = Math.max(0, (contact.loyalty || 50) - 20);
        if (contact.loyalty <= 0) contact.active = false;
      }
    }
  }
  
  // Betrayal check
  for (const contact of s.corruptContacts) {
    if (!contact.active || contact.compromised) continue;
    const def = CORRUPT_CONTACTS[contact.contactDefId];
    if (!def) continue;
    const loyaltyMod = (100 - (contact.loyalty || 50)) / 100;
    const heatMod = (s.personalHeat || 0) > 60 ? 1.5 : 1.0;
    const chance = (def.betrayalRisk / 100) * loyaltyMod * heatMod * 0.03;
    if (Math.random() < chance) {
      contact.compromised = true; contact.active = false;
      addPersonalHeat(s, 15);
      const fine = Math.floor(s.money * 0.1);
      s.money = Math.max(0, s.money - fine);
      report.corruptionBetrayal = { contactId: contact.contactDefId, fine };
      break;
    }
  }
  
  // Passive heat reduction
  let heatRed = 0;
  for (const c of s.corruptContacts) {
    if (!c.active || c.compromised) continue;
    const def = CORRUPT_CONTACTS[c.contactDefId];
    if (def?.effects?.heatReduction) heatRed += def.effects.heatReduction;
  }
  if (heatRed > 0) addPersonalHeat(s, -heatRed);
}

// ========== CREW LOYALTY ==========

function processCrewLoyalty(s: any, report: any) {
  if (!s.crew || s.crew.length === 0) return;
  const defections: string[] = [];
  
  for (let i = s.crew.length - 1; i >= 0; i--) {
    const m = s.crew[i];
    if (m.loyalty === undefined) m.loyalty = 75;
    let change = 0;
    if (m.hp < 30) change -= 5; else if (m.hp < 50) change -= 2;
    if (m.level >= 5 && !m.specialization) change -= 2;
    if (m.hp <= 0) change -= 8;
    if ((s.karma || 0) < -50) change -= 1;
    if ((s.rep || 0) > 200) change += 1;
    if ((s.rep || 0) > 500) change += 1;
    if (s.villa?.modules?.includes("crew_kwartieren")) change += 3;
    if (m.hp === 100) change += 1;
    m.loyalty = clamp(m.loyalty + change, 0, 100);
    
    if (m.loyalty < 20 && Math.random() < 0.4) {
      defections.push(m.name);
      addPhoneMsg(s, m.name, "Ik heb genoeg. Ik ben weg.", "warning");
      s.crew.splice(i, 1);
    }
  }
  if (defections.length > 0) report.crewDefections = defections;
}

// ========== SAFEHOUSE RAIDS ==========

function processSafehouseRaids(s: any, report: any) {
  if (!s.safehouses || s.safehouses.length === 0 || (s.hidingDays || 0) > 0) return;
  
  for (const sh of s.safehouses) {
    let raidChance = 0.08;
    if ((s.personalHeat || 0) > 40) raidChance += 0.05;
    if ((s.personalHeat || 0) > 70) raidChance += 0.08;
    if (s.ownedDistricts?.includes(sh.district)) raidChance *= 0.5;
    if (sh.upgrades?.includes("reinforced")) raidChance *= 0.6;
    if (sh.upgrades?.includes("comms")) raidChance *= 0.7;
    if (Math.random() > raidChance) continue;
    
    const attackerName = RAID_NAMES[Math.floor(Math.random() * RAID_NAMES.length)];
    let defense = 10 + (sh.level || 1) * 15;
    if (sh.upgrades?.includes("reinforced")) defense += 20;
    const crewDef = (s.crew || []).filter((c: any) => c.hp > 30).reduce((sum: number, c: any) => sum + c.level * 3 + (c.role === "Enforcer" ? 10 : 0), 0);
    defense += Math.min(crewDef, 40);
    const attackStrength = 20 + Math.floor(s.day * 1.5) + Math.floor(Math.random() * 20);
    
    if (defense >= attackStrength) {
      const loot = Math.floor(500 + Math.random() * 1000 + s.day * 50);
      s.money += loot; s.stats.totalEarned += loot; s.rep += 5;
      report.safehouseRaid = { district: sh.district, won: true, loot };
    } else {
      const lost = Math.floor(s.money * 0.08);
      s.money = Math.max(0, s.money - lost);
      s.crew?.forEach((c: any) => { if (c.hp > 0) c.hp = Math.max(1, c.hp - Math.floor(Math.random() * 20 + 5)); });
      report.safehouseRaid = { district: sh.district, won: false, lost };
    }
    break; // one raid per turn
  }
}

// ========== STOCK MARKET ==========

function updateStocks(s: any, report: any) {
  if (!s.stockPrices) {
    s.stockPrices = {}; s.stockHistory = {}; s.stockHoldings = {};
    STOCK_DEFS.forEach((st) => { s.stockPrices[st.id] = st.base; s.stockHistory[st.id] = [st.base]; });
  }
  
  // Process stock events
  const eventEffects: Record<string, number> = {};
  if (s.stockEvents) {
    for (let i = s.stockEvents.length - 1; i >= 0; i--) {
      const evt = s.stockEvents[i];
      evt.daysLeft--;
      for (const [sid, mult] of Object.entries(evt.effects)) eventEffects[sid] = (eventEffects[sid] || 1) * (mult as number);
      if (evt.daysLeft <= 0) s.stockEvents.splice(i, 1);
    }
  }
  
  let totalDiv = 0;
  for (const stock of STOCK_DEFS) {
    const old = s.stockPrices[stock.id] || stock.base;
    const rndChange = (Math.random() * 2 - 1) * stock.volatility;
    const eventMult = eventEffects[stock.id] || 1;
    const meanRev = (stock.base - old) * 0.01;
    let newPrice = Math.round(old * (1 + rndChange + meanRev) * eventMult);
    newPrice = clamp(newPrice, Math.floor(stock.base * 0.1), Math.floor(stock.base * 5));
    s.stockPrices[stock.id] = newPrice;
    if (!s.stockHistory[stock.id]) s.stockHistory[stock.id] = [];
    s.stockHistory[stock.id].push(newPrice);
    if (s.stockHistory[stock.id].length > 30) s.stockHistory[stock.id] = s.stockHistory[stock.id].slice(-30);
    
    // Dividends
    const holding = s.stockHoldings?.[stock.id];
    if (holding?.shares > 0 && stock.dividendRate > 0) {
      const div = Math.floor(newPrice * stock.dividendRate * holding.shares);
      if (div > 0) { s.money += div; s.stats.totalEarned += div; totalDiv += div; }
    }
  }
  if (totalDiv > 0) report.stockDividend = totalDiv;
}

// ========== MAIN TURN PROCESSING ==========

function processFullTurn(s: any): any {
  const report: any = {
    day: s.day + 1, districtIncome: 0, businessIncome: 0, totalWashed: 0,
    debtInterest: 0, labYield: 0, heatChange: 0, policeRaid: false, policeFine: 0,
    crewHealing: 0, vehicleDecay: [],
  };
  
  const pHeatBefore = s.personalHeat || 0;
  const vHeatBefore = getActiveVehicleHeat(s);
  
  // === VILLA PRODUCTION ===
  if (s.villa) {
    const vp = processVillaProduction(s);
    if (vp.heat > 0) addPersonalHeat(s, vp.heat);
    report.villaWietProduced = vp.wiet;
    report.villaCokeProduced = vp.coke;
    report.villaLabProduced = vp.lab;
    s.villa.helipadUsedToday = false;
    
    // Drug Empire init
    if (!s.drugEmpire && s.villa.modules?.some((m: string) => ["wietplantage", "coke_lab", "synthetica_lab"].includes(m))) {
      s.drugEmpire = {
        labTiers: { wietplantage: 1, coke_lab: 1, synthetica_lab: 1 },
        selectedQuality: { wietplantage: 1, coke_lab: 1, synthetica_lab: 1 },
        dealers: [], noxCrystalStock: 0, noxCrystalProduced: 0,
        labOffline: { wietplantage: 0, coke_lab: 0, synthetica_lab: 0 },
        deaInvestigation: 0, totalDealerIncome: 0, totalNoxCrystalSold: 0,
        totalNoxCrystalRevenue: 0, totalLabRaids: 0, totalDeaInvestigations: 0,
        totalContaminatedBatches: 0, totalRivalSabotages: 0, totalBigHarvests: 0,
        riskEventLog: [],
      };
    }
    
    if (s.drugEmpire) {
      const deResult = processDrugEmpireNight(s);
      if (deResult.dealerIncome > 0) report.drugEmpireDealerIncome = deResult.dealerIncome;
      if (deResult.noxCrystal > 0) { report.drugEmpireNoxCrystal = deResult.noxCrystal; addPersonalHeat(s, NOXCRYSTAL_HEAT); }
      if (deResult.riskEvent) report.drugEmpireRiskEvent = deResult.riskEvent;
    }
  }
  
  // === OLD LAB ===
  const villaHasLab = s.villa?.modules?.includes("synthetica_lab");
  if (!villaHasLab && (s.lab?.chemicals || 0) > 0) {
    const currentInv = Object.values(s.inventory || {}).reduce((a: number, b: any) => a + (b || 0), 0) as number;
    const space = (s.maxInv || 15) - currentInv;
    if (space > 0) {
      const labMult = s.weather === "storm" ? 1.5 : 1;
      const maxBatch = s.weather === "storm" ? 30 : 20;
      const batchSize = Math.min(s.lab.chemicals, maxBatch, space) * labMult;
      s.lab.chemicals -= batchSize;
      if (!s.inventory) s.inventory = {};
      s.inventory.drugs = (s.inventory.drugs || 0) + batchSize;
      report.labYield = batchSize;
      addPersonalHeat(s, 4);
    }
  }
  
  // === DAY INCREMENT ===
  s.day++;
  if (!s.stats) s.stats = { totalEarned: 0, totalSpent: 0, casinoWon: 0, casinoLost: 0, missionsCompleted: 0, missionsFailed: 0, tradesCompleted: 0, daysPlayed: 0 };
  s.stats.daysPlayed = (s.stats.daysPlayed || 0) + 1;
  
  // === HIDING ===
  const isHiding = (s.hidingDays || 0) > 0;
  if (isHiding) {
    s.hidingDays = Math.max(0, s.hidingDays - 1);
    const villaBonus = s.villa ? getVillaHeatReduction(s) : 0;
    addPersonalHeat(s, -(15 + villaBonus));
  }
  
  // === DISTRICT INCOME ===
  if (!isHiding) {
    const districts = s.ownedDistricts || [];
    report.districtIncome = districts.reduce((sum: number, id: string) => sum + (DISTRICTS[id]?.income || 0), 0);
  }
  
  // === BUSINESS INCOME & WASHING ===
  if (!isHiding) {
    for (const bid of (s.ownedBusinesses || [])) {
      const biz = BUSINESSES[bid];
      if (!biz) continue;
      report.businessIncome += biz.income;
      let washAmount = Math.min(s.dirtyMoney || 0, biz.clean);
      if (s.ownedDistricts?.includes("neon")) washAmount = Math.floor(washAmount * 1.2);
      s.dirtyMoney = Math.max(0, (s.dirtyMoney || 0) - washAmount);
      const washed = Math.floor(washAmount * 0.85);
      s.money += washed;
      report.totalWashed += washAmount;
    }
  }
  
  s.money = (s.money || 0) + report.districtIncome + report.businessIncome;
  s.stats.totalEarned += report.districtIncome + report.businessIncome;
  
  // === VEHICLE HEAT DECAY ===
  (s.ownedVehicles || []).forEach((v: any) => {
    let vDecay = 8;
    if (s.ownedDistricts?.includes("crown")) vDecay += 2;
    if (s.villa?.modules?.includes("server_room")) vDecay += 3;
    v.vehicleHeat = Math.max(0, (v.vehicleHeat || 0) - vDecay);
    if (v.rekatCooldown > 0) v.rekatCooldown--;
  });
  
  // === PERSONAL HEAT DECAY ===
  let pDecay = 2;
  if (s.ownedDistricts?.includes("crown")) pDecay += 1;
  if (s.villa?.modules?.includes("server_room")) pDecay += 3;
  if (s.crew?.some((c: any) => c.role === "Hacker")) pDecay += 2;
  pDecay += getKarmaHeatDecay(s.karma || 0);
  // Safehouse bonuses
  if (s.safehouses) {
    for (const sh of s.safehouses) {
      if (sh.district === s.loc) pDecay += sh.level <= 1 ? 2 : sh.level === 2 ? 3 : 5;
      else if (sh.level >= 2) pDecay += 1;
      if (sh.upgrades?.includes("garage") && sh.district === s.loc) {
        s.ownedVehicles?.forEach((v: any) => { v.vehicleHeat = Math.max(0, (v.vehicleHeat || 0) - 5); });
      }
    }
  }
  addPersonalHeat(s, -pDecay);
  recomputeHeat(s);
  
  // === POLICE RAID ===
  const raidProt = getCorruptionRaidProtection(s);
  const karmaRaidRed = getKarmaRaidReduction(s.karma || 0);
  const raidChance = 0.3 * (1 - raidProt / 100) * (1 - karmaRaidRed);
  if ((s.personalHeat || 0) > POLICE_RAID_HEAT_THRESHOLD && Math.random() < raidChance && (s.policeRel || 0) < 50) {
    let fine = Math.floor(s.money * 0.1);
    const fineRed = getCorruptionFineReduction(s);
    if (fineRed > 0) fine = Math.floor(fine * (1 - fineRed / 100));
    s.money -= fine;
    addPersonalHeat(s, -10);
    report.policeRaid = true; report.policeFine = fine;
    if (Math.random() < PRISON_ARREST_CHANCE_RAID * (1 - raidProt / 100)) {
      arrestPlayer(s, report);
    }
  }
  
  // === PRISON COUNTDOWN ===
  if (s.prison) {
    s.prison.dayServed++;
    s.prison.daysRemaining--;
    // Prison event
    if (s.prison.daysRemaining > 0 && Math.random() < 0.6) {
      const evt = PRISON_EVENTS[Math.floor(Math.random() * PRISON_EVENTS.length)];
      s.prison.events.push(evt);
      switch (evt.effect) {
        case "brains_up": s.player.stats.brains += evt.value; break;
        case "muscle_up": s.player.stats.muscle += evt.value; break;
        case "charm_up": s.player.stats.charm += evt.value; break;
        case "hp_loss": s.crew?.forEach((c: any) => { if (c.hp > 0) c.hp = Math.max(1, c.hp - evt.value); }); break;
        case "rep_up": s.rep = (s.rep || 0) + evt.value; break;
        case "day_reduce": if (s.prison.daysRemaining > 1) s.prison.daysRemaining -= evt.value; break;
        case "money_cost": s.money = Math.max(0, s.money - evt.value); break;
        case "loyalty_up": s.crew?.forEach((c: any) => { c.loyalty = Math.min(100, (c.loyalty || 75) + evt.value); }); break;
      }
    }
    // Crew loyalty penalty in prison
    s.crew?.forEach((c: any) => { c.loyalty = Math.max(0, (c.loyalty || 75) - PRISON_CREW_LOYALTY_PENALTY); });
    if (s.prison.dayServed >= PRISON_CREW_DESERT_THRESHOLD) {
      for (let i = (s.crew?.length || 0) - 1; i >= 0; i--) {
        if ((s.crew[i].loyalty || 75) < 20 && Math.random() < 0.3) {
          s.crew.splice(i, 1);
        }
      }
    }
    if (s.prison.daysRemaining <= 0) {
      s.personalHeat = 0;
      s.ownedVehicles?.forEach((v: any) => { v.vehicleHeat = 0; });
      recomputeHeat(s);
      s.prison = null;
      report.prisonReleased = true;
      addPhoneMsg(s, "anonymous", "Je bent vrijgelaten. Schone lei.", "info");
    }
  }
  
  // === HOSPITAL COUNTDOWN ===
  if (s.hospital) {
    s.hospital.daysRemaining--;
    if (s.hospital.daysRemaining <= 0) {
      s.playerHP = Math.floor((s.playerMaxHP || 100) * 0.5);
      s.hospital = null;
      report.hospitalReleased = true;
    }
  }
  
  // === DEBT INTEREST ===
  if ((s.debt || 0) > 0) {
    report.debtInterest = Math.floor(s.debt * 0.03);
    s.debt = Math.floor(s.debt * 1.03);
  }
  
  // === VEHICLE CONDITION DECAY ===
  (s.ownedVehicles || []).forEach((v: any) => {
    const decay = Math.floor(Math.random() * 5) + 2;
    v.condition = Math.max(10, (v.condition || 100) - decay);
  });
  
  // === CREW HEALING ===
  let totalHeal = 0;
  const hasMedbay = s.safehouses?.some((sh: any) => sh.upgrades?.includes("medbay") && sh.district === s.loc);
  const karmaHeal = getKarmaCrewHealBonus(s.karma || 0);
  (s.crew || []).forEach((c: any) => {
    if (c.hp < 100 && c.hp > 0) {
      let heal = Math.floor(Math.random() * 5) + 3;
      if (hasMedbay) heal *= 2;
      if (karmaHeal > 0) heal = Math.floor(heal * (1 + karmaHeal));
      const old = c.hp;
      c.hp = Math.min(100, c.hp + heal);
      totalHeal += c.hp - old;
    }
  });
  report.crewHealing = totalHeal;
  
  // === SPOILAGE ===
  for (const gid of Object.keys(GOOD_SPOILAGE)) {
    const rate = GOOD_SPOILAGE[gid];
    if (rate <= 0) continue;
    const owned = s.inventory?.[gid] || 0;
    if (owned <= 0) continue;
    const hasStorage = s.villa?.modules?.includes("opslagkelder");
    const effectiveRate = hasStorage ? rate * 0.5 : rate;
    const lost = Math.max(1, Math.floor(owned * effectiveRate));
    s.inventory[gid] = Math.max(0, owned - lost);
  }
  
  // === FACTION ALLIANCE INCOME ===
  for (const fid of Object.keys(FAMILIES)) {
    const rel = s.familyRel?.[fid] || 0;
    const isConquered = s.conqueredFactions?.includes(fid);
    const leaderAlive = !s.leadersDefeated?.includes(fid);
    if (isConquered) {
      s.money += 1000; s.stats.totalEarned += 1000; report.businessIncome += 1000;
    } else if (rel >= 80 && leaderAlive) {
      s.money += 500; s.stats.totalEarned += 500; report.businessIncome += 500;
    }
  }
  
  // === POWER DECAY ===
  if (!s.leaderDefeatedDay) s.leaderDefeatedDay = {};
  for (const fid of Object.keys(FAMILIES)) {
    const isDefeated = s.leadersDefeated?.includes(fid);
    const isConquered = s.conqueredFactions?.includes(fid);
    if (isDefeated && !isConquered) {
      if (!s.leaderDefeatedDay[fid]) s.leaderDefeatedDay[fid] = s.day;
      s.familyRel[fid] = Math.max(-100, (s.familyRel[fid] || 0) - 2);
    }
  }
  
  // === MARKET EVENTS ===
  if (s.activeMarketEvent?.daysLeft > 0) {
    s.activeMarketEvent.daysLeft--;
    if (s.activeMarketEvent.daysLeft <= 0) s.activeMarketEvent = null;
  }
  if (!s.activeMarketEvent && Math.random() < 0.25) {
    const evt = MARKET_EVENTS[Math.floor(Math.random() * MARKET_EVENTS.length)];
    s.activeMarketEvent = { id: evt.id, name: evt.name, desc: evt.desc, effects: evt.effects, daysLeft: evt.duration };
    report.marketEvent = { name: evt.name, desc: evt.desc };
  }
  
  // === ALLIANCE PACT PROCESSING ===
  if (s.alliancePacts) {
    for (const fid of Object.keys(s.alliancePacts)) {
      const pact = s.alliancePacts[fid];
      if (pact.active && s.day >= pact.expiresDay) {
        pact.active = false; delete s.alliancePacts[fid];
      } else if (pact.active && s.money >= pact.costPerDay) {
        s.money -= pact.costPerDay;
        s.stats.totalSpent += pact.costPerDay;
      }
    }
  }
  
  // === PRICE GENERATION ===
  if (!s.prices) s.prices = {};
  if (!s.districtDemands) s.districtDemands = {};
  if (!s.marketPressure) s.marketPressure = {};
  const eventEffects = s.activeMarketEvent?.effects || {};
  for (const id of Object.keys(DISTRICTS)) {
    s.prices[id] = {};
    s.districtDemands[id] = Math.random() > 0.8 ? GOODS[Math.floor(Math.random() * GOODS.length)].id : null;
    if (!s.marketPressure[id]) s.marketPressure[id] = {};
    for (const g of GOODS) {
      const volRange = g.base < 500 ? 0.9 : g.base < 1200 ? 0.7 : 0.5;
      const volatility = (1 - volRange / 2) + Math.random() * volRange;
      let demandMod = s.districtDemands[id] === g.id ? 1.6 : 1.0;
      const pressure = s.marketPressure[id]?.[g.id] || 0;
      const pressureMod = 1 + pressure * 0.15;
      const eventMod = eventEffects[g.id] || 1.0;
      s.prices[id][g.id] = Math.floor(g.base * volatility * (DISTRICTS[id].mods[g.id] || 1) * demandMod * pressureMod * eventMod);
      // Decay market pressure
      if (pressure > 0) s.marketPressure[id][g.id] = Math.max(0, pressure - 0.3);
      else if (pressure < 0) s.marketPressure[id][g.id] = Math.min(0, pressure + 0.3);
    }
  }
  if (!s.priceTrends) s.priceTrends = {};
  for (const g of GOODS) s.priceTrends[g.id] = Math.random() > 0.5 ? "up" : "down";
  
  // === DAILY RESETS ===
  s.washUsedToday = 0;
  s.factionCooldowns = { cartel: [], syndicate: [], bikers: [] };
  
  // === WEATHER ===
  const weatherTypes = ["clear", "clear", "rain", "fog", "heatwave", "storm"];
  const weights = [25, 25, 20, 15, 10, 5];
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  s.weather = "clear";
  for (let i = 0; i < weatherTypes.length; i++) {
    roll -= weights[i]; if (roll <= 0) { s.weather = weatherTypes[i]; break; }
  }
  // Weather effects
  if (s.weather === "rain") addPersonalHeat(s, -5);
  if (s.weather === "heatwave") {
    addPersonalHeat(s, 3);
    s.crew?.forEach((c: any) => { if (c.hp > 0) c.hp = Math.max(1, c.hp - 5); });
  }
  
  // === DISTRICT REP ===
  if (!s.districtRep) s.districtRep = { port: 0, crown: 0, iron: 0, low: 0, neon: 0 };
  (s.ownedDistricts || []).forEach((id: string) => {
    s.districtRep[id] = Math.min(100, (s.districtRep[id] || 0) + 2);
  });
  if ((s.personalHeat || 0) > 70) {
    s.districtRep[s.loc] = Math.max(0, (s.districtRep[s.loc] || 0) - 3);
  }
  
  // === NEMESIS SYSTEM (simplified) ===
  if (s.nemesis?.revengeActive && s.nemesis.revengeDaysLeft > 0) {
    s.nemesis.revengeDaysLeft--;
    if (s.nemesis.revengeActive === "heat_surge") addPersonalHeat(s, 10);
    if (s.nemesis.revengeDaysLeft <= 0) s.nemesis.revengeActive = null;
  }
  if (s.nemesis?.truceDaysLeft > 0) s.nemesis.truceDaysLeft--;
  if (s.nemesis?.alive && s.nemesis.cooldown > 0) s.nemesis.cooldown--;
  
  // === CORRUPTION ===
  processCorruption(s, report);
  
  // === CREW LOYALTY ===
  processCrewLoyalty(s, report);
  
  // === SAFEHOUSE RAIDS ===
  processSafehouseRaids(s, report);
  
  // === AMMO FACTORY ===
  if (s.ownedBusinesses?.includes("ammo_factory")) {
    if (!s.ammoStock) s.ammoStock = { "9mm": s.ammo || 0, "7.62mm": 0, shells: 0 };
    const factoryLevel = s.ammoFactoryLevel || 1;
    const upgrade = AMMO_FACTORY_UPGRADES.find((u) => u.level === factoryLevel);
    const produced = upgrade?.production || 3;
    const ammoType = "9mm"; // default
    s.ammoStock[ammoType] = Math.min(99, (s.ammoStock[ammoType] || 0) + produced);
    s.ammo = (s.ammoStock["9mm"] || 0) + (s.ammoStock["7.62mm"] || 0) + (s.ammoStock.shells || 0);
  }
  
  // === GOLDEN HOUR ===
  if (s.goldenHour?.turnsLeft > 0) {
    const bonus = report.districtIncome + report.businessIncome;
    s.money += bonus; s.stats.totalEarned += bonus;
    report.goldenHourBonus = bonus;
    s.goldenHour.turnsLeft--;
    if (s.goldenHour.turnsLeft <= 0) { s.goldenHour = null; report.goldenHourEnded = true; }
  } else if (!s.goldenHour && s.day > 5 && Math.random() < 0.08) {
    s.goldenHour = { turnsLeft: 3 };
    report.goldenHourStarted = true;
    addPhoneMsg(s, "anonymous", "🌟 GOUDEN UUR! Alle inkomsten x2 voor 3 beurten!", "opportunity");
  }
  
  // === BOUNTY PROCESSING ===
  if (s.activeBounties) {
    s.activeBounties = s.activeBounties.filter((b: any) => b.deadline > s.day && b.status === "active");
  }
  if (s.placedBounties) {
    s.placedBounties = s.placedBounties.filter((b: any) => {
      if (b.status !== "active") return false;
      if (s.day >= b.deadline) { b.status = "expired"; s.money += Math.floor(b.reward * 0.5); return false; }
      return true;
    });
  }
  
  // === STOCK MARKET ===
  updateStocks(s, report);
  
  // === PLAYER HP REGEN ===
  const baseRegen = 10;
  const regenMult = s.villa?.modules?.includes("crew_kwartieren") ? 2 : 1;
  const maxHP = 80 + ((s.player?.level || 1) * 5) + ((s.player?.stats?.muscle || 1) * 3);
  s.playerMaxHP = maxHP;
  if (s.playerHP < maxHP) s.playerHP = Math.min(maxHP, (s.playerHP || 100) + baseRegen * regenMult);
  
  // === INCOME HISTORY ===
  if (!s.incomeHistory) s.incomeHistory = [];
  s.incomeHistory.push(report.districtIncome + report.businessIncome);
  if (s.incomeHistory.length > 30) s.incomeHistory = s.incomeHistory.slice(-30);
  
  // Final heat computation
  recomputeHeat(s);
  report.personalHeatChange = (s.personalHeat || 0) - pHeatBefore;
  report.vehicleHeatChange = getActiveVehicleHeat(s) - vHeatBefore;
  report.heatChange = s.heat - Math.max(vHeatBefore, pHeatBefore);
  
  s.nightReport = report;
  return report;
}

// ========== MAIN HANDLER ==========

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    
    const body = await req.json().catch(() => ({}));
    const mode = body.mode || "single"; // "single" (player-triggered) or "batch" (cron)
    
    if (mode === "batch") {
      // Process all active players (called by cron/passive-income)
      const { data: players } = await supabase.from("player_state")
        .select("user_id, save_data, day, game_over")
        .eq("game_over", false)
        .not("save_data", "is", null);
      
      let processed = 0;
      for (const player of (players || [])) {
        if (!player.save_data) continue;
        const state = typeof player.save_data === "string" ? JSON.parse(player.save_data) : { ...player.save_data };
        const report = processFullTurn(state);
        
        await supabase.from("player_state").update({
          save_data: state,
          day: state.day,
          money: state.money,
          dirty_money: state.dirtyMoney || 0,
          heat: state.heat || 0,
          personal_heat: state.personalHeat || 0,
          hp: state.playerHP || 100,
          rep: state.rep || 0,
          karma: state.karma || 0,
          loc: state.loc || "low",
          level: state.player?.level || 1,
          updated_at: new Date().toISOString(),
        }).eq("user_id", player.user_id);
        
        processed++;
      }
      
      return new Response(JSON.stringify({ success: true, processed }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // Single player mode — requires auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, message: "Niet ingelogd." }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ success: false, message: "Niet ingelogd." }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // Load save_data
    const { data: ps } = await supabase.from("player_state")
      .select("save_data, game_over, day")
      .eq("user_id", user.id).maybeSingle();
    
    if (!ps || !ps.save_data || ps.game_over) {
      return new Response(JSON.stringify({ success: false, message: "Geen actief spel." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    const state = typeof ps.save_data === "string" ? JSON.parse(ps.save_data) : { ...ps.save_data };
    const report = processFullTurn(state);
    
    // Write back
    await supabase.from("player_state").update({
      save_data: state,
      save_version: (ps as any).save_version ? (ps as any).save_version + 1 : 1,
      last_save_at: new Date().toISOString(),
      day: state.day,
      money: state.money,
      dirty_money: state.dirtyMoney || 0,
      heat: state.heat || 0,
      personal_heat: state.personalHeat || 0,
      hp: state.playerHP || 100,
      rep: state.rep || 0,
      karma: state.karma || 0,
      loc: state.loc || "low",
      level: state.player?.level || 1,
      updated_at: new Date().toISOString(),
    }).eq("user_id", user.id);
    
    return new Response(JSON.stringify({
      success: true, message: "Dag verwerkt.",
      data: { report, saveData: state },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
    
  } catch (err: any) {
    console.error("Process turn error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
