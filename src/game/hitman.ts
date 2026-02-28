import { GameState, HitContract, HitTargetType, DistrictId, FamilyId, AmmoType } from './types';
import { DISTRICTS, FAMILIES } from './constants';
import { getPlayerStat, gainXp, splitHeat, recomputeHeat, getActiveAmmoType } from './engine';
import { getKarmaAlignment, getKarmaRepMultiplier } from './karma';

// ========== HIT TARGET NAME POOLS ==========

const TARGET_NAMES: Record<HitTargetType, string[]> = {
  luitenant: ['Marco "De Slager" Rossi', 'Viktor Krul', 'Bones McGraw', 'Yuri Petrov', 'Santos "El Cuchillo"', 'Razor Hendrix', 'Tommy "IJzeren Vuist"'],
  ambtenaar: ['Wethouder Van Buren', 'Inspecteur Mulder', 'Commissaris Bakker', 'Officier De Groot', 'Raadslid Vermeer', 'Directeur Wolff'],
  zakenman: ['CEO Van der Berg', 'Investeerder Pietersen', 'Vastgoedmagnaat Kramer', 'Bankier De Haan', 'Tech-CEO Nakamura', 'Reder Christiansen'],
  verrader: ['De Mol', 'Judas K.', 'Dubbelspion Vos', 'Overloper Jansen', 'De Informant', 'Rat van de Haven'],
  vip: ['Ambassadeur Chen', 'Media-tycoon Sterling', 'Generaal Ivanov', 'Schaduw-bankier Kessler', 'De Kardinaal'],
};

const TARGET_DESCS: Record<HitTargetType, string[]> = {
  luitenant: [
    'Een luitenant die te veel macht verzamelt. Zijn eigen baas wil hem weg.',
    'Runt een rivaliserende operatie. Moet worden uitgeschakeld.',
    'Heeft meerdere deals gesaboteerd. Tijd voor vergelding.',
  ],
  ambtenaar: [
    'Deze ambtenaar bedreigt onze operaties met nieuwe wetgeving.',
    'Heeft een onderzoek geopend naar onze financiën. Moet stoppen.',
    'Weigert zich te laten omkopen. Er is maar één oplossing.',
  ],
  zakenman: [
    'Heeft zwart geld witgewassen voor een rivaal. Weet te veel.',
    'Financiert een anti-crime taskforce. Verwijder het probleem.',
    'Een zakenman die denkt dat hij boven de wet staat.',
  ],
  verrader: [
    'Een voormalig bondgenoot die informatie verkoopt aan de politie.',
    'Deze rat heeft onze routes verraden. Maak een voorbeeld.',
    'Overgelopen naar een rivaliserende organisatie met onze geheimen.',
  ],
  vip: [
    'Een extreem goed bewaakt doelwit. Alleen voor de beste huurmoordenaars.',
    'Dit doelwit verplaatst zich met een beveiligingskonvooi. Precisie vereist.',
    'De ultieme opdracht. Slaag en je naam wordt legendarisch.',
  ],
};

const TARGET_TYPE_CONFIG: Record<HitTargetType, {
  difficultyRange: [number, number];
  rewardRange: [number, number];
  repRange: [number, number];
  heatRange: [number, number];
  ammoRange: [number, number];
  karmaRange: [number, number];
  xpRange: [number, number];
  rarity: number; // 0-1, higher = rarer
}> = {
  luitenant: { difficultyRange: [20, 45], rewardRange: [3000, 8000], repRange: [15, 30], heatRange: [8, 15], ammoRange: [3, 4], karmaRange: [-5, -8], xpRange: [30, 50], rarity: 0 },
  ambtenaar: { difficultyRange: [35, 60], rewardRange: [6000, 15000], repRange: [10, 25], heatRange: [12, 25], ammoRange: [4, 5], karmaRange: [-8, -12], xpRange: [40, 70], rarity: 0.3 },
  zakenman: { difficultyRange: [45, 70], rewardRange: [10000, 25000], repRange: [5, 15], heatRange: [10, 20], ammoRange: [4, 6], karmaRange: [-7, -10], xpRange: [50, 80], rarity: 0.4 },
  verrader: { difficultyRange: [30, 55], rewardRange: [8000, 18000], repRange: [20, 40], heatRange: [5, 12], ammoRange: [3, 5], karmaRange: [-5, -8], xpRange: [35, 60], rarity: 0.5 },
  vip: { difficultyRange: [65, 90], rewardRange: [25000, 60000], repRange: [40, 80], heatRange: [20, 35], ammoRange: [6, 8], karmaRange: [-12, -15], xpRange: [80, 120], rarity: 0.8 },
};

function randBetween(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min + 1));
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ========== CONTRACT GENERATION ==========

export function generateHitContracts(state: GameState): HitContract[] {
  const existing = state.hitContracts?.filter(h => h.deadline >= state.day) || [];
  if (existing.length >= 5) return existing;

  const numNew = randBetween(2, 3);
  const contracts: HitContract[] = [...existing];
  const districtKeys = Object.keys(DISTRICTS) as DistrictId[];
  const factionKeys = Object.keys(FAMILIES) as FamilyId[];

  // Determine available types based on game state
  const availableTypes: HitTargetType[] = ['luitenant', 'ambtenaar', 'zakenman'];

  // Verrader: only if a faction has negative relation
  if (factionKeys.some(fid => (state.familyRel[fid] || 0) < -20)) {
    availableTypes.push('verrader');
  }

  // VIP: rare, only at higher levels
  if (state.player.level >= 8 && Math.random() < 0.3) {
    availableTypes.push('vip');
  }

  // Execution contracts for very meedogenloos players
  const karma = state.karma || 0;
  const isVeryMeedogenloos = karma < -50;

  for (let i = 0; i < numNew && contracts.length < 5; i++) {
    let targetType: HitTargetType;

    if (isVeryMeedogenloos && Math.random() < 0.3) {
      targetType = 'vip'; // Executie-opdrachten
    } else {
      // Weight by rarity
      const weighted = availableTypes.filter(t => Math.random() > TARGET_TYPE_CONFIG[t].rarity);
      targetType = weighted.length > 0 ? pickRandom(weighted) : pickRandom(availableTypes);
    }

    const config = TARGET_TYPE_CONFIG[targetType];
    const dayScaling = Math.min(state.day * 0.03, 2.0);

    const reward = Math.floor(randBetween(...config.rewardRange) * (1 + dayScaling));
    const repReward = randBetween(...config.repRange);
    const difficulty = randBetween(...config.difficultyRange);

    // Faction effect
    let factionEffect: HitContract['factionEffect'] = null;
    if (targetType === 'luitenant' || targetType === 'verrader') {
      const fid = pickRandom(factionKeys);
      factionEffect = {
        familyId: fid,
        change: targetType === 'verrader' ? randBetween(5, 15) : randBetween(-15, -5),
      };
    }

    const district = pickRandom(districtKeys);

    contracts.push({
      id: `hit_${state.day}_${i}_${Math.floor(Math.random() * 10000)}`,
      targetName: pickRandom(TARGET_NAMES[targetType]),
      targetType,
      difficulty,
      reward: isVeryMeedogenloos && targetType === 'vip' ? Math.floor(reward * 2) : reward,
      repReward,
      heatGain: randBetween(...config.heatRange),
      ammoCost: randBetween(...config.ammoRange),
      factionEffect,
      district,
      desc: pickRandom(TARGET_DESCS[targetType]),
      karmaEffect: -randBetween(Math.abs(config.karmaRange[0]), Math.abs(config.karmaRange[1])),
      deadline: state.day + randBetween(3, 6),
      xpReward: randBetween(...config.xpRange),
    });
  }

  return contracts;
}

// ========== SUCCESS CHANCE CALCULATION ==========

export function calculateHitSuccessChance(state: GameState, hit: HitContract): number {
  const muscle = getPlayerStat(state, 'muscle');
  const brains = getPlayerStat(state, 'brains');

  let chance = 50; // base
  chance += (muscle + brains) * 2.5;
  chance += state.player.level * 2;
  chance -= hit.difficulty;

  // Meedogenloos bonus
  if (getKarmaAlignment(state.karma || 0) === 'meedogenloos') {
    chance += 5;
  }

  // In correct district bonus
  if (state.loc === hit.district) {
    chance += 10;
  }

  // Crew bonus
  const hasEnforcer = state.crew.some(c => c.role === 'Enforcer' && c.hp > 0);
  if (hasEnforcer) chance += 8;

  return Math.max(10, Math.min(95, Math.round(chance)));
}

// ========== HIT EXECUTION ==========

export function executeHit(state: GameState, hitId: string): {
  success: boolean;
  message: string;
  reward: number;
  repGain: number;
  heatGain: number;
  karmaChange: number;
  xpGain: number;
} {
  const hit = state.hitContracts?.find(h => h.id === hitId);
  if (!hit) return { success: false, message: 'Contract niet gevonden.', reward: 0, repGain: 0, heatGain: 0, karmaChange: 0, xpGain: 0 };

  // Check ammo (universal)
  const currentAmmo = state.ammo || 0;

  if (currentAmmo < hit.ammoCost) {
    return { success: false, message: `Niet genoeg kogels (${hit.ammoCost} nodig, ${currentAmmo} beschikbaar).`, reward: 0, repGain: 0, heatGain: 0, karmaChange: 0, xpGain: 0 };
  }

  // Check district
  if (state.loc !== hit.district) {
    return { success: false, message: `Je moet in ${DISTRICTS[hit.district].name} zijn.`, reward: 0, repGain: 0, heatGain: 0, karmaChange: 0, xpGain: 0 };
  }

  // Consume ammo (universal)
  state.ammo = Math.max(0, currentAmmo - hit.ammoCost);
  if (!state.ammoStock) state.ammoStock = { '9mm': 0, '7.62mm': 0, 'shells': 0 };
  state.ammoStock['9mm'] = state.ammo;

  const chance = calculateHitSuccessChance(state, hit);
  const roll = Math.random() * 100;
  const success = roll < chance;

  if (success) {
    // Meedogenloos reward bonus
    const karmaAlign = getKarmaAlignment(state.karma || 0);
    const rewardMult = karmaAlign === 'meedogenloos' ? 1.15 : 1.0;
    const repMult = getKarmaRepMultiplier(state);

    const reward = Math.floor(hit.reward * rewardMult);
    const repGain = Math.floor(hit.repReward * repMult);
    const xpGain = hit.xpReward;

    state.dirtyMoney += reward;
    state.rep += repGain;
    state.stats.totalEarned += reward;
    state.stats.missionsCompleted++;
    gainXp(state, xpGain);

    // Heat (personal, violence-based)
    splitHeat(state, hit.heatGain, 0.2); // mostly personal heat
    recomputeHeat(state);

    // Karma
    state.karma = Math.max(-100, (state.karma || 0) + hit.karmaEffect);

    // Faction effect
    if (hit.factionEffect) {
      state.familyRel[hit.factionEffect.familyId] = Math.max(-100, Math.min(100,
        (state.familyRel[hit.factionEffect.familyId] || 0) + hit.factionEffect.change
      ));
    }

    // Remove contract
    state.hitContracts = (state.hitContracts || []).filter(h => h.id !== hitId);

    return {
      success: true,
      message: `${hit.targetName} is uitgeschakeld! +€${reward.toLocaleString()} | +${repGain} REP | +${xpGain} XP`,
      reward, repGain, heatGain: hit.heatGain, karmaChange: hit.karmaEffect, xpGain,
    };
  } else {
    // Failed hit
    const extraHeat = Math.floor(hit.heatGain * 1.5);
    splitHeat(state, extraHeat, 0.3);
    recomputeHeat(state);

    // Crew damage on failure
    if (state.crew.length > 0 && Math.random() < 0.4) {
      const target = state.crew[Math.floor(Math.random() * state.crew.length)];
      const dmg = randBetween(10, 25);
      target.hp = Math.max(1, target.hp - dmg);
    }

    // Faction warned
    if (hit.factionEffect) {
      state.familyRel[hit.factionEffect.familyId] = Math.max(-100,
        (state.familyRel[hit.factionEffect.familyId] || 0) - 10
      );
    }

    state.stats.missionsFailed++;

    // Remove contract on failure too
    state.hitContracts = (state.hitContracts || []).filter(h => h.id !== hitId);

    return {
      success: false,
      message: `De aanslag op ${hit.targetName} is mislukt! Extra heat opgelopen.`,
      reward: 0, repGain: 0, heatGain: extraHeat, karmaChange: 0, xpGain: 0,
    };
  }
}

// ========== HIT TARGET TYPE LABELS ==========

export const HIT_TYPE_LABELS: Record<HitTargetType, { label: string; color: string; icon: string }> = {
  luitenant: { label: 'LUITENANT', color: 'text-gold', icon: '⚔️' },
  ambtenaar: { label: 'AMBTENAAR', color: 'text-ice', icon: '🏛️' },
  zakenman: { label: 'ZAKENMAN', color: 'text-emerald', icon: '💼' },
  verrader: { label: 'VERRADER', color: 'text-blood', icon: '🐀' },
  vip: { label: 'VIP TARGET', color: 'text-game-purple', icon: '💀' },
};
