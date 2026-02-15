import { GameState, DistrictId, FamilyId } from './types';
import { FAMILIES, DISTRICTS } from './constants';
import { isFactionActive, addPersonalHeat, recomputeHeat, getPlayerStat, splitHeat } from './engine';
import { addPhoneMessage } from './newFeatures';

// ========== BOUNTY TYPES ==========

export interface BountyContract {
  id: string;
  targetName: string;
  targetType: 'player' | 'npc';
  reward: number;
  placedBy: string;
  deadline: number; // day when it expires
  status: 'active' | 'completed' | 'expired' | 'failed';
  district?: DistrictId;
  familyId?: FamilyId;
}

export interface BountyEncounter {
  hunterName: string;
  hunterPower: number;
  bountyReward: number;
  bountyId: string;
}

export interface BountyTarget {
  id: string;
  name: string;
  title: string;
  cost: number;
  rewardRep: number;
  rewardMoney: number;
  difficulty: number; // 0-100, chance of daily completion
  familyId?: FamilyId;
  district?: DistrictId;
  desc: string;
}

// ========== BOUNTY HUNTER NAMES ==========

const HUNTER_NAMES = [
  'De Schaduw', 'Viktor Kain', 'Nadia Voss', 'El Cuchillo', 'De Jager',
  'Iron Mike', 'Ghost', 'Serpent', 'Lady Razor', 'De Beul',
];

// ========== BOUNTY BOARD TEMPLATES ==========

export const BOUNTY_TARGETS: BountyTarget[] = [
  { id: 'cartel_lt', name: 'Carlos "El Fuego" Mendez', title: 'Cartel Luitenant', cost: 15000, rewardRep: 50, rewardMoney: 5000, difficulty: 25, familyId: 'cartel', district: 'port', desc: 'Controleert de havensmokkel. Eliminatie verzwakt het Cartel.' },
  { id: 'syndicate_lt', name: 'Chen Wei', title: 'Syndicate Hacker', cost: 20000, rewardRep: 60, rewardMoney: 8000, difficulty: 20, familyId: 'syndicate', district: 'crown', desc: 'Hoofd van Blue Lotus cyber-operaties.' },
  { id: 'bikers_lt', name: 'Axel "Wrench" Berg', title: 'Iron Skulls Sergeant', cost: 12000, rewardRep: 40, rewardMoney: 4000, difficulty: 30, familyId: 'bikers', district: 'iron', desc: 'Wapendepot manager van de Iron Skulls.' },
  { id: 'corrupt_judge', name: 'Rechter Zwart', title: 'Corrupte Rechter', cost: 25000, rewardRep: 80, rewardMoney: 10000, difficulty: 15, desc: 'Beschermt rivalen met juridische immuniteit.' },
  { id: 'arms_dealer', name: 'Nikolai Petrov', title: 'Wapenhandelaar', cost: 18000, rewardRep: 55, rewardMoney: 7000, difficulty: 22, district: 'iron', desc: 'Levert wapens aan je vijanden.' },
  { id: 'info_broker', name: 'Luna "Pixel" Park', title: 'Informant', cost: 10000, rewardRep: 35, rewardMoney: 3000, difficulty: 35, district: 'neon', desc: 'Verkoopt jouw locatiedata aan premiejagers.' },
];

// ========== BOUNTY GENERATION ==========

/** Generate bounties ON the player based on heat and actions */
export function generatePlayerBounties(state: GameState): void {
  if (!state.activeBounties) state.activeBounties = [];
  
  // Remove expired bounties
  state.activeBounties = state.activeBounties.filter(b => b.deadline > state.day && b.status === 'active');
  
  // Max 3 active bounties on player
  if (state.activeBounties.length >= 3) return;
  
  const heat = state.personalHeat || 0;
  
  // High heat bounty (>60)
  if (heat > 60 && Math.random() < 0.2) {
    const reward = Math.floor(5000 + heat * 100 + state.day * 200);
    const placers = ['De Onderwereld Raad', 'Een Anonieme Vijand', 'De Politie Commissaris'];
    const placer = placers[Math.floor(Math.random() * placers.length)];
    
    state.activeBounties.push({
      id: `bounty_player_${state.day}_${Math.random().toString(36).slice(2, 6)}`,
      targetName: 'Jij',
      targetType: 'player',
      reward,
      placedBy: placer,
      deadline: state.day + 5 + Math.floor(Math.random() * 5),
      status: 'active',
    });
    
    addPhoneMessage(state, '⚠️ Premiejager', `Er is een premie van €${reward.toLocaleString()} op je hoofd gezet door ${placer}. Pas op voor premiejagers!`, 'threat');
  }
  
  // Nemesis bounty (if nemesis is alive and powerful)
  if (state.nemesis?.alive && state.nemesis.power > 50 && Math.random() < 0.1 && !state.activeBounties.some(b => b.placedBy === state.nemesis.name)) {
    const reward = Math.floor(10000 + state.nemesis.power * 150);
    state.activeBounties.push({
      id: `bounty_nemesis_${state.day}`,
      targetName: 'Jij',
      targetType: 'player',
      reward,
      placedBy: state.nemesis.name,
      deadline: state.day + 7,
      status: 'active',
    });
    
    addPhoneMessage(state, state.nemesis.name, `Ik heb €${reward.toLocaleString()} uitgeloofd voor je hoofd. De klok tikt.`, 'threat');
  }
}

/** Roll for bounty hunter encounter based on active bounties */
export function rollBountyEncounter(state: GameState): BountyEncounter | null {
  if (!state.activeBounties || state.activeBounties.length === 0) return null;
  if (state.prison || state.hospital || (state.hidingDays || 0) > 0) return null;
  
  // Total bounty determines encounter chance
  const totalBounty = state.activeBounties
    .filter(b => b.status === 'active')
    .reduce((sum, b) => sum + b.reward, 0);
  
  // Base 5% + 1% per 5000€ bounty, max 25%
  const chance = Math.min(0.25, 0.05 + (totalBounty / 500000));
  
  if (Math.random() >= chance) return null;
  
  // Pick the highest active bounty
  const activeBounties = state.activeBounties.filter(b => b.status === 'active');
  const target = activeBounties.sort((a, b) => b.reward - a.reward)[0];
  
  const hunterName = HUNTER_NAMES[Math.floor(Math.random() * HUNTER_NAMES.length)];
  const hunterPower = Math.floor(30 + target.reward / 500 + state.day * 2);
  
  return {
    hunterName,
    hunterPower,
    bountyReward: target.reward,
    bountyId: target.id,
  };
}

/** Resolve bounty encounter choice */
export function resolveBountyEncounter(
  state: GameState,
  choice: 'fight' | 'flee' | 'bribe'
): { success: boolean; text: string; moneyLost?: number; hpLost?: number; heatChange?: number; repChange?: number } {
  const encounter = state.pendingBountyEncounter;
  if (!encounter) return { success: false, text: 'Geen encounter gevonden.' };
  
  const muscle = getPlayerStat(state, 'muscle');
  const brains = getPlayerStat(state, 'brains');
  const charm = getPlayerStat(state, 'charm');
  
  switch (choice) {
    case 'fight': {
      const playerPower = muscle * 3 + state.playerHP * 0.5;
      const successChance = Math.min(0.85, playerPower / (playerPower + encounter.hunterPower));
      const success = Math.random() < successChance;
      
      if (success) {
        const hpLost = Math.floor(encounter.hunterPower * 0.3);
        state.playerHP = Math.max(1, state.playerHP - hpLost);
        state.rep += 25;
        splitHeat(state, 8);
        recomputeHeat(state);
        // Remove the bounty
        const bountyIdx = state.activeBounties?.findIndex(b => b.id === encounter.bountyId);
        if (bountyIdx !== undefined && bountyIdx >= 0) {
          state.activeBounties![bountyIdx].status = 'completed';
        }
        return { success: true, text: `Je hebt ${encounter.hunterName} verslagen! De premie is vervallen.`, hpLost, heatChange: 8, repChange: 25 };
      } else {
        const hpLost = Math.floor(encounter.hunterPower * 0.6);
        state.playerHP = Math.max(1, state.playerHP - hpLost);
        splitHeat(state, 5);
        recomputeHeat(state);
        return { success: false, text: `${encounter.hunterName} was te sterk. Je bent ontsnapt maar zwaar gewond.`, hpLost, heatChange: 5 };
      }
    }
    
    case 'flee': {
      const speedBonus = brains * 2;
      const fleeChance = Math.min(0.8, 0.4 + speedBonus / 100);
      const success = Math.random() < fleeChance;
      
      if (success) {
        splitHeat(state, 3);
        recomputeHeat(state);
        return { success: true, text: `Je bent ${encounter.hunterName} ontvlucht. Maar de premie staat nog steeds.`, heatChange: 3 };
      } else {
        const hpLost = Math.floor(encounter.hunterPower * 0.4);
        state.playerHP = Math.max(1, state.playerHP - hpLost);
        splitHeat(state, 5);
        recomputeHeat(state);
        return { success: false, text: `Vluchtpoging mislukt! ${encounter.hunterName} haalde je in.`, hpLost, heatChange: 5 };
      }
    }
    
    case 'bribe': {
      const bribeCost = Math.floor(encounter.bountyReward * 0.4);
      if (state.money < bribeCost) {
        return { success: false, text: `Niet genoeg geld om ${encounter.hunterName} om te kopen (€${bribeCost.toLocaleString()} nodig).` };
      }
      
      const charmBonus = charm * 3;
      const bribeChance = Math.min(0.9, 0.5 + charmBonus / 100);
      const success = Math.random() < bribeChance;
      
      if (success) {
        state.money -= bribeCost;
        state.stats.totalSpent += bribeCost;
        return { success: true, text: `${encounter.hunterName} accepteert €${bribeCost.toLocaleString()} en trekt zich terug.`, moneyLost: bribeCost };
      } else {
        state.money -= Math.floor(bribeCost * 0.5);
        state.stats.totalSpent += Math.floor(bribeCost * 0.5);
        const hpLost = Math.floor(encounter.hunterPower * 0.3);
        state.playerHP = Math.max(1, state.playerHP - hpLost);
        return { success: false, text: `${encounter.hunterName} nam je geld én viel aan!`, moneyLost: Math.floor(bribeCost * 0.5), hpLost };
      }
    }
  }
}

/** Process placed bounties (daily resolution check) */
export function processPlacedBounties(state: GameState, report: any): void {
  if (!state.placedBounties) return;
  
  for (const bounty of state.placedBounties) {
    if (bounty.status !== 'active') continue;
    
    // Check expiry
    if (state.day >= bounty.deadline) {
      bounty.status = 'expired';
      addPhoneMessage(state, 'Premiejager', `De premie op ${bounty.targetName} is verlopen zonder resultaat. Je geld is terug.`, 'info');
      state.money += Math.floor(bounty.reward * 0.5); // refund half
      continue;
    }
    
    // Find target definition
    const target = BOUNTY_TARGETS.find(t => t.name === bounty.targetName);
    if (!target) continue;
    
    // Daily completion chance
    if (Math.random() * 100 < target.difficulty) {
      bounty.status = 'completed';
      state.rep += target.rewardRep;
      state.money += target.rewardMoney;
      state.stats.totalEarned += target.rewardMoney;
      
      // Faction relation impact
      if (target.familyId) {
        state.familyRel[target.familyId] = Math.max(-100, (state.familyRel[target.familyId] || 0) - 15);
      }
      
      addPhoneMessage(state, 'Premiejager', `Premie voltooid! ${bounty.targetName} is uitgeschakeld. +€${target.rewardMoney.toLocaleString()} en +${target.rewardRep} rep.`, 'opportunity');
      
      if (!report.bountyResults) report.bountyResults = [];
      report.bountyResults.push({ targetName: bounty.targetName, success: true, rewardMoney: target.rewardMoney, rewardRep: target.rewardRep });
    }
  }
  
  // Clean up completed/expired
  state.placedBounties = state.placedBounties.filter(b => b.status === 'active');
}

/** Refresh bounty board (available targets) */
export function refreshBountyBoard(state: GameState): void {
  if (!state.bountyBoard) state.bountyBoard = [];
  
  // Refresh every 3 days
  if (state.day % 3 !== 0 && state.bountyBoard.length > 0) return;
  
  // Pick 3-4 random targets, exclude already placed bounties
  const placedNames = (state.placedBounties || []).map(b => b.targetName);
  const available = BOUNTY_TARGETS.filter(t => !placedNames.includes(t.name));
  
  // Shuffle and pick
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  state.bountyBoard = shuffled.slice(0, Math.min(4, shuffled.length));
}
