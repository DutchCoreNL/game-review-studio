import { CombatSkill, CombatBuff, PvPCombatState } from './types';

// ========== COMBAT SKILL DEFINITIONS ==========

export const COMBAT_SKILLS: CombatSkill[] = [
  // Level 1-5
  {
    id: 'snelle_slag',
    name: 'Snelle Slag',
    desc: 'Een razendsnelle klap die extra schade doet.',
    icon: '⚡',
    unlockLevel: 1,
    cooldownTurns: 0,
    energyCost: 0,
    ammoCost: 1,
    effect: { type: 'damage', value: 8, bonus: 'flat' },
  },
  {
    id: 'schild_muur',
    name: 'Schild Muur',
    desc: 'Verhoog je verdediging met 50% voor 2 beurten.',
    icon: '🛡️',
    unlockLevel: 3,
    cooldownTurns: 4,
    energyCost: 0,
    ammoCost: 0,
    effect: { type: 'buff', buffId: 'defense_boost', duration: 2 },
  },
  // Level 6-10
  {
    id: 'adrenaline_rush',
    name: 'Adrenaline Rush',
    desc: 'Genees jezelf en verhoog je aanvalskracht.',
    icon: '💉',
    unlockLevel: 6,
    cooldownTurns: 5,
    energyCost: 0,
    ammoCost: 0,
    effect: { type: 'heal_and_buff', healAmount: 15, buffId: 'damage_boost', duration: 2 },
  },
  {
    id: 'vuistcombo',
    name: 'Vuistcombo',
    desc: 'Een 3-hit combo die massieve schade doet. Kost 3 kogels.',
    icon: '👊',
    unlockLevel: 8,
    cooldownTurns: 4,
    energyCost: 0,
    ammoCost: 3,
    effect: { type: 'multi_hit', hits: 3, damagePerHit: 6 },
  },
  // Level 11-15
  {
    id: 'dodelijke_precisie',
    name: 'Dodelijke Precisie',
    desc: 'Gegarandeerde kritieke treffer. Kost 2 kogels.',
    icon: '🎯',
    unlockLevel: 11,
    cooldownTurns: 6,
    energyCost: 0,
    ammoCost: 2,
    effect: { type: 'crit', multiplier: 2.5 },
  },
  {
    id: 'intimidatie',
    name: 'Intimidatie',
    desc: 'Stun de vijand met pure angst (charm-based).',
    icon: '😈',
    unlockLevel: 13,
    cooldownTurns: 5,
    energyCost: 0,
    ammoCost: 1,
    effect: { type: 'stun', chance: 0.8, stat: 'charm' },
  },
  // Level 16+
  {
    id: 'executie',
    name: 'Executie',
    desc: 'Bonus schade op doelwitten met weinig HP. Kost 3 kogels.',
    icon: '💀',
    unlockLevel: 16,
    cooldownTurns: 7,
    energyCost: 0,
    ammoCost: 3,
    effect: { type: 'execute', thresholdPct: 0.3, bonusDamage: 25 },
  },
  {
    id: 'laatste_adem',
    name: 'Laatste Adem',
    desc: 'Auto-heal wanneer je HP onder 20% zakt.',
    icon: '🫁',
    unlockLevel: 18,
    cooldownTurns: 8,
    energyCost: 0,
    ammoCost: 0,
    effect: { type: 'emergency_heal', thresholdPct: 0.2, healAmount: 30 },
  },
];

// ========== BUFF DEFINITIONS ==========

export const BUFF_DEFS: Record<string, { name: string; icon: string; effect: string }> = {
  defense_boost: { name: 'Schild Muur', icon: '🛡️', effect: '+50% Defense' },
  damage_boost: { name: 'Adrenaline', icon: '💪', effect: '+30% Damage' },
  bleed: { name: 'Bloeding', icon: '🩸', effect: '-5 HP/beurt' },
  stun: { name: 'Stunned', icon: '💫', effect: 'Beurt overgeslagen' },
};

// ========== COMBO SYSTEM ==========

export const COMBO_THRESHOLD = 3; // consecutive attacks to fill combo meter
export const COMBO_FINISHER_DAMAGE = 20;
export const COMBO_FINISHER_STUN_CHANCE = 0.6;

export function getAvailableSkills(playerLevel: number): CombatSkill[] {
  return COMBAT_SKILLS.filter(s => playerLevel >= s.unlockLevel);
}

export function isSkillOnCooldown(skillId: string, cooldowns: Record<string, number>): boolean {
  return (cooldowns[skillId] || 0) > 0;
}

export function tickCooldowns(cooldowns: Record<string, number>): Record<string, number> {
  const next: Record<string, number> = {};
  for (const [k, v] of Object.entries(cooldowns)) {
    if (v > 0) next[k] = v - 1;
  }
  return next;
}

export function tickBuffs(buffs: CombatBuff[]): CombatBuff[] {
  return buffs
    .map(b => ({ ...b, duration: b.duration - 1 }))
    .filter(b => b.duration > 0);
}

export function hasActiveBuff(buffs: CombatBuff[], buffId: string): boolean {
  return buffs.some(b => b.id === buffId && b.duration > 0);
}

// ========== PVP COMBAT LOGIC ==========

export function createPvPCombatState(
  attackerId: string,
  attackerName: string,
  attackerLevel: number,
  attackerHP: number,
  attackerMaxHP: number,
  attackerStats: { muscle: number; brains: number; charm: number },
  attackerLoadout: Record<string, string | null>,
  defenderId: string,
  defenderName: string,
  defenderLevel: number,
  defenderHP: number,
  defenderMaxHP: number,
  defenderStats: { muscle: number; brains: number; charm: number },
  defenderLoadout: Record<string, string | null>,
): PvPCombatState {
  return {
    attackerId,
    attackerName,
    attackerHP,
    attackerMaxHP,
    attackerLevel,
    attackerStats,
    attackerLoadout,
    attackerBuffs: [],
    attackerSkillCooldowns: {},
    attackerComboCounter: 0,
    defenderId,
    defenderName,
    defenderHP,
    defenderMaxHP,
    defenderLevel,
    defenderStats,
    defenderLoadout,
    defenderBuffs: [],
    defenderComboCounter: 0,
    turn: 0,
    logs: [
      `⚔️ ${attackerName} daagt ${defenderName} uit!`,
      `Lv.${attackerLevel} vs Lv.${defenderLevel} — Het gevecht begint!`,
    ],
    finished: false,
    won: false,
    lastAction: null,
    damageDealt: 0,
    damageTaken: 0,
    skillsUsed: 0,
    combosLanded: 0,
  };
}

export function pvpCombatTurn(
  state: PvPCombatState,
  action: 'attack' | 'heavy' | 'defend' | 'skill' | 'combo_finisher',
  skillId?: string,
): PvPCombatState {
  const s = { ...state };
  s.turn++;
  s.logs = [...s.logs];
  s.attackerBuffs = [...s.attackerBuffs];
  s.defenderBuffs = [...s.defenderBuffs];
  s.attackerSkillCooldowns = { ...s.attackerSkillCooldowns };

  const muscle = s.attackerStats.muscle;
  const brains = s.attackerStats.brains;
  const charm = s.attackerStats.charm;
  const hasDefenseBoost = hasActiveBuff(s.attackerBuffs, 'defense_boost');
  const hasDamageBoost = hasActiveBuff(s.attackerBuffs, 'damage_boost');
  const defenderStunned = hasActiveBuff(s.defenderBuffs, 'stun');

  let playerDamage = 0;
  let playerDefenseBonus = 0;
  let isAttackAction = false;

  switch (action) {
    case 'attack': {
      playerDamage = Math.floor(8 + muscle * 2.5 + Math.random() * 6);
      if (hasDamageBoost) playerDamage = Math.floor(playerDamage * 1.3);
      s.logs.push(`⚔️ Aanval! ${playerDamage} schade.`);
      isAttackAction = true;
      break;
    }
    case 'heavy': {
      if (Math.random() < 0.6 + muscle * 0.03) {
        playerDamage = Math.floor(15 + muscle * 3.5 + Math.random() * 10);
        if (hasDamageBoost) playerDamage = Math.floor(playerDamage * 1.3);
        s.logs.push(`💥 ZWARE KLAP! ${playerDamage} schade!`);
      } else {
        s.logs.push('💨 Zware aanval mist!');
      }
      isAttackAction = true;
      break;
    }
    case 'defend': {
      playerDefenseBonus = 0.6;
      const heal = Math.floor(5 + brains * 1.5);
      s.attackerHP = Math.min(s.attackerMaxHP, s.attackerHP + heal);
      s.logs.push(`🛡️ Verdediging! +${heal} HP hersteld.`);
      // Break combo
      s.attackerComboCounter = 0;
      break;
    }
    case 'skill': {
      if (skillId) {
        const skill = COMBAT_SKILLS.find(sk => sk.id === skillId);
        if (skill && !isSkillOnCooldown(skillId, s.attackerSkillCooldowns)) {
          s.attackerSkillCooldowns[skillId] = skill.cooldownTurns;
          s.skillsUsed++;
          const result = applySkillEffect(skill, s, muscle, brains, charm);
          playerDamage = result.damage;
          s.attackerHP = result.newPlayerHP;
          s.attackerBuffs = result.newPlayerBuffs;
          s.defenderBuffs = result.newEnemyBuffs;
          s.logs.push(...result.logs);
          if (result.isAttack) isAttackAction = true;
        }
      }
      break;
    }
    case 'combo_finisher': {
      if (s.attackerComboCounter >= COMBO_THRESHOLD) {
        playerDamage = COMBO_FINISHER_DAMAGE + Math.floor(muscle * 2);
        if (hasDamageBoost) playerDamage = Math.floor(playerDamage * 1.3);
        s.logs.push(`🔥 COMBO FINISHER! ${playerDamage} schade!`);
        if (Math.random() < COMBO_FINISHER_STUN_CHANCE) {
          s.defenderBuffs.push({ id: 'stun', name: 'Stunned', duration: 1, effect: 'stun' });
          s.logs.push('💫 Vijand is STUNNED!');
        }
        s.attackerComboCounter = 0;
        s.combosLanded++;
        isAttackAction = true;
      }
      break;
    }
  }

  // Track combo
  if (isAttackAction && playerDamage > 0) {
    s.attackerComboCounter++;
  }

  // MMO Perk: Weduwnaar PvP damage bonus
  if (s.attackerPvpDamageBonus && playerDamage > 0) {
    playerDamage = Math.floor(playerDamage * (1 + s.attackerPvpDamageBonus));
  }

  // Apply damage
  s.defenderHP = Math.max(0, s.defenderHP - playerDamage);
  s.damageDealt += playerDamage;

  // Check defender defeated
  if (s.defenderHP <= 0) {
    s.finished = true;
    s.won = true;
    s.logs.push(`🏆 ${s.defenderName} is verslagen!`);
    return s;
  }

  // Enemy turn (AI for snapshot/bot combat)
  if (!defenderStunned) {
    const enemyResult = enemyTurn(s);
    s.attackerHP = enemyResult.newHP;
    s.damageTaken += enemyResult.damage;
    s.logs.push(...enemyResult.logs);
    if (playerDefenseBonus > 0 && enemyResult.damage > 0) {
      const reduced = Math.floor(enemyResult.damage * playerDefenseBonus);
      s.attackerHP = Math.min(s.attackerMaxHP, s.attackerHP + reduced);
      s.logs.push(`🛡️ Verdediging blokkeert ${reduced} schade.`);
    }
  } else {
    s.logs.push(`💫 ${s.defenderName} is gestunned en mist een beurt!`);
  }

  // Check attacker defeated
  if (s.attackerHP <= 0) {
    s.finished = true;
    s.won = false;
    s.logs.push(`💀 Je bent verslagen door ${s.defenderName}!`);
    return s;
  }

  // Tick buffs/cooldowns
  s.attackerBuffs = tickBuffs(s.attackerBuffs);
  s.defenderBuffs = tickBuffs(s.defenderBuffs);
  s.attackerSkillCooldowns = tickCooldowns(s.attackerSkillCooldowns);

  // Apply bleed
  const attackerBleed = hasActiveBuff(s.attackerBuffs, 'bleed');
  if (attackerBleed) {
    s.attackerHP = Math.max(1, s.attackerHP - 5);
    s.logs.push('🩸 Bloeding: -5 HP');
  }

  // Passive: Laatste Adem check
  const laatsteAdem = COMBAT_SKILLS.find(sk => sk.id === 'laatste_adem');
  if (laatsteAdem && s.attackerLevel >= laatsteAdem.unlockLevel) {
    if (s.attackerHP < s.attackerMaxHP * 0.2 && !isSkillOnCooldown('laatste_adem', s.attackerSkillCooldowns)) {
      s.attackerHP = Math.min(s.attackerMaxHP, s.attackerHP + 30);
      s.attackerSkillCooldowns['laatste_adem'] = laatsteAdem.cooldownTurns;
      s.logs.push('🫁 Laatste Adem activeert! +30 HP!');
    }
  }

  s.lastAction = action;
  return s;
}

function enemyTurn(state: PvPCombatState): { newHP: number; damage: number; logs: string[] } {
  const defMuscle = state.defenderStats.muscle;
  const hpPct = state.defenderHP / state.defenderMaxHP;
  const logs: string[] = [];

  // AI decision: defend more when low HP
  const roll = Math.random();
  let damage = 0;

  if (hpPct < 0.3 && roll < 0.4) {
    // Defend/heal
    const heal = Math.floor(5 + defMuscle);
    // Don't actually heal defender in this simplified model, just reduce damage output
    logs.push(`${state.defenderName} verdedigt zich.`);
    return { newHP: state.attackerHP, damage: 0, logs };
  } else if (roll < 0.3) {
    // Heavy attack
    if (Math.random() < 0.55) {
      damage = Math.floor(12 + defMuscle * 2.5 + Math.random() * 8);
      logs.push(`💥 ${state.defenderName} slaat hard toe! -${damage} HP`);
    } else {
      logs.push(`${state.defenderName} mist een zware aanval.`);
    }
  } else {
    // Normal attack
    damage = Math.floor(6 + defMuscle * 1.8 + Math.random() * 5);
    logs.push(`⚔️ ${state.defenderName} valt aan! -${damage} HP`);
  }

  return { newHP: Math.max(0, state.attackerHP - damage), damage, logs };
}

function applySkillEffect(
  skill: CombatSkill,
  state: PvPCombatState,
  muscle: number,
  brains: number,
  charm: number,
): { damage: number; newPlayerHP: number; newPlayerBuffs: CombatBuff[]; newEnemyBuffs: CombatBuff[]; logs: string[]; isAttack: boolean } {
  const logs: string[] = [];
  let damage = 0;
  let newPlayerHP = state.attackerHP;
  let newPlayerBuffs = [...state.attackerBuffs];
  let newEnemyBuffs = [...state.defenderBuffs];
  let isAttack = false;

  const eff = skill.effect;

  switch (eff.type) {
    case 'damage':
      damage = Math.floor(muscle * 2 + eff.value + Math.random() * 5);
      logs.push(`${skill.icon} ${skill.name}! ${damage} schade!`);
      isAttack = true;
      break;
    case 'buff':
      newPlayerBuffs.push({ id: eff.buffId!, name: BUFF_DEFS[eff.buffId!]?.name || eff.buffId!, duration: eff.duration!, effect: eff.buffId! });
      logs.push(`${skill.icon} ${skill.name} geactiveerd! ${BUFF_DEFS[eff.buffId!]?.effect || ''}`);
      break;
    case 'heal_and_buff':
      newPlayerHP = Math.min(state.attackerMaxHP, newPlayerHP + (eff.healAmount || 0));
      newPlayerBuffs.push({ id: eff.buffId!, name: BUFF_DEFS[eff.buffId!]?.name || eff.buffId!, duration: eff.duration!, effect: eff.buffId! });
      logs.push(`${skill.icon} ${skill.name}! +${eff.healAmount} HP, ${BUFF_DEFS[eff.buffId!]?.effect || ''}`);
      break;
    case 'multi_hit': {
      const hits = eff.hits || 3;
      let totalDmg = 0;
      for (let i = 0; i < hits; i++) {
        const hit = Math.floor((eff.damagePerHit || 6) + muscle * 0.8 + Math.random() * 3);
        totalDmg += hit;
      }
      damage = totalDmg;
      logs.push(`${skill.icon} ${skill.name}! ${hits}x treffer = ${totalDmg} totale schade!`);
      isAttack = true;
      break;
    }
    case 'crit': {
      const baseDmg = Math.floor(10 + muscle * 2.5 + Math.random() * 8);
      damage = Math.floor(baseDmg * (eff.multiplier || 2.5));
      logs.push(`${skill.icon} ${skill.name}! KRITIEK! ${damage} schade!`);
      isAttack = true;
      break;
    }
    case 'stun': {
      const statVal = eff.stat === 'charm' ? charm : eff.stat === 'brains' ? brains : muscle;
      const chance = (eff.chance || 0.7) + statVal * 0.02;
      if (Math.random() < chance) {
        newEnemyBuffs.push({ id: 'stun', name: 'Stunned', duration: 1, effect: 'stun' });
        damage = Math.floor(3 + charm);
        logs.push(`${skill.icon} ${skill.name}! Vijand STUNNED! +${damage} schade.`);
      } else {
        logs.push(`${skill.icon} ${skill.name} mislukt!`);
      }
      isAttack = true;
      break;
    }
    case 'execute': {
      const thresholdHP = state.defenderMaxHP * (eff.thresholdPct || 0.3);
      if (state.defenderHP <= thresholdHP) {
        damage = Math.floor(muscle * 3 + (eff.bonusDamage || 25) + Math.random() * 10);
        logs.push(`${skill.icon} ${skill.name}! Doelwit is zwak — ${damage} EXECUTIE schade!`);
      } else {
        damage = Math.floor(muscle * 2 + Math.random() * 8);
        logs.push(`${skill.icon} ${skill.name}! ${damage} schade. (HP te hoog voor bonus)`);
      }
      isAttack = true;
      break;
    }
    case 'emergency_heal':
      // Passive — handled in main loop
      break;
  }

  return { damage, newPlayerHP, newPlayerBuffs, newEnemyBuffs, logs, isAttack };
}
