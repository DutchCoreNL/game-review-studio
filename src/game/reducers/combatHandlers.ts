import { GameState, FamilyId, FactionActionType } from '../types';
import * as Engine from '../engine';
import { COMBAT_SKILLS, isSkillOnCooldown, tickCooldowns, tickBuffs, hasActiveBuff, COMBO_THRESHOLD, COMBO_FINISHER_DAMAGE, COMBO_FINISHER_STUN_CHANCE, BUFF_DEFS, getAvailableSkills } from '../combatSkills';
import { startNemesisCombat, addPhoneMessage, resolveWarEvent, performSpionage, performSabotage, negotiateNemesis, scoutNemesis, checkNemesisWoundedRevenge } from '../newFeatures';
import { calculateEndgamePhase, buildVictoryData, startFinalBoss, createBossPhase, createNewGamePlus, getDeckDialogue } from '../endgame';
import { checkCinematicTrigger } from '../cinematics';
import { NEMESIS_TAUNTS, NEMESIS_ARCHETYPES, HOSPITAL_ADMISSION_COST_PER_MAXHP, HOSPITAL_STAY_DAYS, HOSPITAL_REP_LOSS, MAX_HOSPITALIZATIONS } from '../constants';
import { generateDailyNews } from '../newsGenerator';

export function handleStartCombat(s: GameState, familyId: FamilyId): void {
  const combat = Engine.startCombat(s, familyId);
  if (combat) s.activeCombat = combat;
}

export function handleStartNemesisCombat(s: GameState): void {
  const combat = startNemesisCombat(s);
  if (combat) s.activeCombat = combat;
}

export function handleCombatAction(s: GameState, combatAction: 'attack' | 'heavy' | 'defend' | 'environment' | 'tactical' | 'skill' | 'combo_finisher', skillId?: string): void {
  if (!s.activeCombat) return;
  const combat = s.activeCombat;
  const hpBefore = combat.playerHP;
  const enemyHpBefore = combat.targetHP;

  // Handle skill action
  if (combatAction === 'skill' && skillId) {
    const skill = COMBAT_SKILLS.find(sk => sk.id === skillId);
    if (!skill || isSkillOnCooldown(skillId, combat.skillCooldowns)) return;
    combat.turn++;
    combat.skillCooldowns[skillId] = skill.cooldownTurns;
    const muscle = Engine.getPlayerStat(s, 'muscle');
    const brains = Engine.getPlayerStat(s, 'brains');
    const charm = Engine.getPlayerStat(s, 'charm');
    const eff = skill.effect;
    let playerDamage = 0;
    let isAttack = false;

    switch (eff.type) {
      case 'damage':
        playerDamage = Math.floor(muscle * 2 + (eff.value || 8) + Math.random() * 5);
        combat.logs.push(`${skill.icon} ${skill.name}! ${playerDamage} schade!`);
        isAttack = true;
        break;
      case 'buff':
        combat.activeBuffs.push({ id: eff.buffId!, name: BUFF_DEFS[eff.buffId!]?.name || eff.buffId!, duration: eff.duration!, effect: eff.buffId! });
        combat.logs.push(`${skill.icon} ${skill.name} geactiveerd! ${BUFF_DEFS[eff.buffId!]?.effect || ''}`);
        break;
      case 'heal_and_buff':
        combat.playerHP = Math.min(combat.playerMaxHP, combat.playerHP + (eff.healAmount || 0));
        combat.activeBuffs.push({ id: eff.buffId!, name: BUFF_DEFS[eff.buffId!]?.name || eff.buffId!, duration: eff.duration!, effect: eff.buffId! });
        combat.logs.push(`${skill.icon} ${skill.name}! +${eff.healAmount} HP, ${BUFF_DEFS[eff.buffId!]?.effect || ''}`);
        break;
      case 'multi_hit': {
        const hits = eff.hits || 3;
        let totalDmg = 0;
        for (let i = 0; i < hits; i++) {
          totalDmg += Math.floor((eff.damagePerHit || 6) + muscle * 0.8 + Math.random() * 3);
        }
        playerDamage = totalDmg;
        combat.logs.push(`${skill.icon} ${skill.name}! ${hits}x treffer = ${totalDmg} totale schade!`);
        isAttack = true;
        break;
      }
      case 'crit': {
        const baseDmg = Math.floor(10 + muscle * 2.5 + Math.random() * 8);
        playerDamage = Math.floor(baseDmg * (eff.multiplier || 2.5));
        combat.logs.push(`${skill.icon} ${skill.name}! KRITIEK! ${playerDamage} schade!`);
        isAttack = true;
        break;
      }
      case 'stun': {
        const statVal = eff.stat === 'charm' ? charm : eff.stat === 'brains' ? brains : muscle;
        const chance = (eff.chance || 0.7) + statVal * 0.02;
        if (Math.random() < chance) {
          combat.stunned = true;
          playerDamage = Math.floor(3 + charm);
          combat.logs.push(`${skill.icon} ${skill.name}! Vijand STUNNED! +${playerDamage} schade.`);
        } else {
          combat.logs.push(`${skill.icon} ${skill.name} mislukt!`);
        }
        isAttack = true;
        break;
      }
      case 'execute': {
        const thresholdHP = combat.enemyMaxHP * (eff.thresholdPct || 0.3);
        if (combat.targetHP <= thresholdHP) {
          playerDamage = Math.floor(muscle * 3 + (eff.bonusDamage || 25) + Math.random() * 10);
          combat.logs.push(`${skill.icon} ${skill.name}! Doelwit is zwak — ${playerDamage} EXECUTIE schade!`);
        } else {
          playerDamage = Math.floor(muscle * 2 + Math.random() * 8);
          combat.logs.push(`${skill.icon} ${skill.name}! ${playerDamage} schade. (HP te hoog voor bonus)`);
        }
        isAttack = true;
        break;
      }
      default: break;
    }

    if (isAttack && playerDamage > 0) combat.comboCounter++;
    if (hasActiveBuff(combat.activeBuffs, 'damage_boost') && playerDamage > 0) {
      playerDamage = Math.floor(playerDamage * 1.3);
    }
    combat.targetHP = Math.max(0, combat.targetHP - playerDamage);

    if (combat.targetHP <= 0) {
      combat.finished = true;
      combat.won = true;
      combat.logs.push(`${combat.targetName} is verslagen!`);
    } else if (!combat.stunned) {
      // Enemy counterattack (simplified)
      const defBoost = hasActiveBuff(combat.activeBuffs, 'defense_boost') ? 0.5 : 0;
      let enemyDmg = Math.floor(combat.enemyAttack * (0.7 + Math.random() * 0.6));
      if (defBoost > 0) enemyDmg = Math.floor(enemyDmg * (1 - defBoost));
      combat.playerHP = Math.max(0, combat.playerHP - enemyDmg);
      combat.logs.push(`${combat.targetName} slaat terug voor ${enemyDmg} schade!`);
      if (combat.playerHP <= 0) {
        combat.finished = true;
        combat.won = false;
        combat.logs.push('Je bent verslagen...');
      }
    } else {
      combat.logs.push(`${combat.targetName} is verdoofd en kan niet aanvallen!`);
      combat.stunned = false;
    }

    // Tick buffs/cooldowns
    combat.activeBuffs = tickBuffs(combat.activeBuffs);
    combat.skillCooldowns = tickCooldowns(combat.skillCooldowns);
    combat.lastAction = 'skill';

    // Laatste Adem passive
    const laatsteAdem = COMBAT_SKILLS.find(sk => sk.id === 'laatste_adem');
    if (laatsteAdem && s.player.level >= laatsteAdem.unlockLevel && combat.playerHP > 0) {
      if (combat.playerHP < combat.playerMaxHP * 0.2 && !isSkillOnCooldown('laatste_adem', combat.skillCooldowns)) {
        combat.playerHP = Math.min(combat.playerMaxHP, combat.playerHP + 30);
        combat.skillCooldowns['laatste_adem'] = laatsteAdem.cooldownTurns;
        combat.logs.push('🫁 Laatste Adem activeert! +30 HP!');
      }
    }
  } else if (combatAction === 'combo_finisher') {
    if (combat.comboCounter < COMBO_THRESHOLD) return;
    combat.turn++;
    const muscle = Engine.getPlayerStat(s, 'muscle');
    let playerDamage = COMBO_FINISHER_DAMAGE + Math.floor(muscle * 2);
    if (hasActiveBuff(combat.activeBuffs, 'damage_boost')) playerDamage = Math.floor(playerDamage * 1.3);
    combat.logs.push(`🔥 COMBO FINISHER! ${playerDamage} schade!`);
    if (Math.random() < COMBO_FINISHER_STUN_CHANCE) {
      combat.stunned = true;
      combat.logs.push('💫 Vijand is STUNNED!');
    }
    combat.comboCounter = 0;
    combat.targetHP = Math.max(0, combat.targetHP - playerDamage);

    if (combat.targetHP <= 0) {
      combat.finished = true;
      combat.won = true;
      combat.logs.push(`${combat.targetName} is verslagen!`);
    } else if (!combat.stunned) {
      let enemyDmg = Math.floor(combat.enemyAttack * (0.7 + Math.random() * 0.6));
      combat.playerHP = Math.max(0, combat.playerHP - enemyDmg);
      combat.logs.push(`${combat.targetName} slaat terug voor ${enemyDmg} schade!`);
      if (combat.playerHP <= 0) {
        combat.finished = true;
        combat.won = false;
        combat.logs.push('Je bent verslagen...');
      }
    } else {
      combat.logs.push(`${combat.targetName} is verdoofd!`);
      combat.stunned = false;
    }
    combat.activeBuffs = tickBuffs(combat.activeBuffs);
    combat.skillCooldowns = tickCooldowns(combat.skillCooldowns);
    combat.lastAction = 'combo_finisher';
  } else {
    // Standard combat actions (attack/heavy/defend/environment/tactical)
    Engine.combatAction(s, combatAction as 'attack' | 'heavy' | 'defend' | 'environment' | 'tactical');

    // Track combo for standard attacks
    if ((combatAction === 'attack' || combatAction === 'heavy') && combat.targetHP < enemyHpBefore) {
      combat.comboCounter++;
    } else if (combatAction === 'defend') {
      combat.comboCounter = 0;
    }

    // Tick PvE buffs/cooldowns each turn
    combat.activeBuffs = tickBuffs(combat.activeBuffs);
    combat.skillCooldowns = tickCooldowns(combat.skillCooldowns);
    combat.lastAction = combatAction;

    // Apply defense boost from buffs to reduce enemy damage retroactively
    // (already handled by engine for standard actions, buff effects apply next turn)
  }

  Engine.checkAchievements(s);
  if (s.activeCombat && s.activeCombat.bossPhase) {
    const dialogue = getDeckDialogue(s.activeCombat);
    if (dialogue) s.activeCombat.logs.push(dialogue);
  }
  if (s.activeCombat) {
    const playerTookDamage = s.activeCombat.playerHP < hpBefore;
    const dealtHeavyDamage = (enemyHpBefore - s.activeCombat.targetHP) > 15;
    const enemyDefeated = s.activeCombat.finished && s.activeCombat.won;
    const playerDefeated = s.activeCombat.finished && !s.activeCombat.won;
    if (enemyDefeated) s.screenEffect = 'gold-flash';
    else if (playerDefeated) s.screenEffect = 'blood-flash';
    else if ((combatAction === 'heavy' || combatAction === 'combo_finisher') && dealtHeavyDamage) s.screenEffect = 'shake';
    else if (playerTookDamage && (hpBefore - s.activeCombat.playerHP) > 10) s.screenEffect = 'blood-flash';
  }
  if (s.activeCombat?.finished && s.activeCombat?.won && s.activeCombat?.bossPhase === 2) {
    s._finalBossWon = true;
  }
  s.endgamePhase = calculateEndgamePhase(s);
}

export function handleEndCombat(s: GameState): void {
  if (s.activeCombat) {
    if (s.activeCombat.won) {
      s.playerHP = Math.max(1, s.activeCombat.playerHP);
    } else {
      // Universal permadeath: death = game over
      s.gameOver = true;
      s.playerHP = 0;
      s.hospitalizations = (s.hospitalizations || 0) + 1;
    }
    if (s.activeCombat?.isNemesis && !s.activeCombat.won && s.nemesis?.alive) {
      s.nemesis.hp = s.activeCombat.targetHP;
      checkNemesisWoundedRevenge(s);
    }
  }
  const wasFinalBoss = s._finalBossWon;
  delete s._finalBossWon;
  if (s.activeCombat?.won) {
    const combatCinematic = checkCinematicTrigger(s, 'combat_won');
    if (combatCinematic) s.pendingCinematic = combatCinematic;
  }
  if (s.activeCombat?.isNemesis && s.activeCombat?.won) {
    const nemCinematic = checkCinematicTrigger(s, 'nemesis_combat_start');
    if (nemCinematic) s.pendingCinematic = nemCinematic;
  }
  s.activeCombat = null;
  if (wasFinalBoss) {
    s.finalBossDefeated = true;
    s.endgamePhase = 'noxhaven_baas';
    s.rep += 500;
    s.money += 100000;
    s.stats.totalEarned += 100000;
    Engine.gainXp(s, 500);
    s.heat = 0;
    s.personalHeat = 0;
    s.ownedVehicles.forEach(v => { v.vehicleHeat = 0; });
    s.playerHP = s.playerMaxHP;
    s.victoryData = buildVictoryData(s);
    addPhoneMessage(s, 'anonymous', 'Commissaris Decker is verslagen. Noxhaven is van jou. De stad knielt.', 'opportunity');
  }
}

export function handleFactionAction(s: GameState, familyId: FamilyId, actionType: FactionActionType): void {
  const result = Engine.performFactionAction(s, familyId, actionType);
  s._lastFactionResult = result;
  Engine.checkAchievements(s);
  if (s.dailyProgress) { s.dailyProgress.faction_actions++; }
  const { syncChallenges } = require('./helpers');
  syncChallenges(s);
}

export function handleNemesisDefeatChoice(s: GameState, choice: 'execute' | 'exile' | 'recruit'): void {
  const nem = s.nemesis;
  if (!nem) return;
  nem.pendingDefeatChoice = false;
  nem.defeatChoice = choice;
  switch (choice) {
    case 'execute':
      s.rep += 50;
      Engine.splitHeat(s, 15, 0.7);
      nem.nextSpawnDay = Math.max(s.day + 1, nem.nextSpawnDay - 5);
      addPhoneMessage(s, 'anonymous', `Je hebt ${nem.name} geëxecuteerd. De straten sidderen. Maar zijn opvolger zal wraak willen...`, 'warning');
      break;
    case 'exile':
      addPhoneMessage(s, 'anonymous', `${nem.name} is verbannen uit Noxhaven. Een neutrale opvolger zal verschijnen.`, 'info');
      break;
    case 'recruit':
      s.rep -= 25;
      const archetypes: import('../types').NemesisArchetype[] = ['zakenman', 'brute', 'schaduw', 'strateeg'];
      const nextArchetype = archetypes[Math.floor(Math.random() * archetypes.length)];
      nem.informantArchetype = nextArchetype;
      const archDef = NEMESIS_ARCHETYPES.find(a => a.id === nextArchetype);
      addPhoneMessage(s, 'informant', `${nem.name} werkt nu als informant. De volgende rivaal wordt een ${archDef?.icon} ${archDef?.name}.`, 'opportunity');
      nem.nextSpawnDay = Math.max(nem.nextSpawnDay, s.day + 15);
      break;
  }
}

export function handleStartFinalBoss(s: GameState): void {
  const finalCombat = startFinalBoss(s);
  if (finalCombat) {
    s.activeCombat = finalCombat;
    s.screenEffect = 'shake';
  }
}

export function handleStartBossPhase2(s: GameState): void {
  s.activeCombat = createBossPhase(s, 2);
  s.screenEffect = 'blood-flash';
}

export function handleResolveFinalBoss(s: GameState): void {
  s.finalBossDefeated = true;
  s.endgamePhase = 'noxhaven_baas';
  s.rep += 500;
  s.money += 100000;
  s.stats.totalEarned += 100000;
  Engine.gainXp(s, 500);
  s.heat = 0;
  s.personalHeat = 0;
  s.ownedVehicles.forEach(v => { v.vehicleHeat = 0; });
  s.victoryData = buildVictoryData(s);
  addPhoneMessage(s, 'anonymous', 'Commissaris Decker is verslagen. Noxhaven is van jou. De stad knielt.', 'opportunity');
}

export function handleNewGamePlus(s: GameState): GameState {
  const ngPlus = createNewGamePlus(s);
  Engine.generatePrices(ngPlus);
  // Contracts generated server-side via gameApi.acceptContract()
  return ngPlus;
}

export function handleResolveWarEvent(s: GameState, tactic: import('../types').WarTactic): void {
  if (!s.pendingWarEvent) return;
  const result = resolveWarEvent(s, tactic);
  if (result.won) {
    s.screenEffect = 'gold-flash';
    s.lastRewardAmount = result.loot;
  } else {
    s.screenEffect = 'blood-flash';
  }
}

export function handleFormAlliance(s: GameState, familyId: FamilyId): void {
  const rel = s.familyRel[familyId] || 0;
  if (rel < 30) return;
  const cost = Math.max(5000, 15000 - rel * 100);
  if (s.money < cost) return;
  s.money -= cost;
  s.stats.totalSpent += cost;
  if (!s.alliancePacts) s.alliancePacts = {};
  s.alliancePacts[familyId] = {
    familyId,
    active: true,
    expiresDay: s.day + 10,
    benefit: familyId === 'cartel' ? '-15% Marktprijzen Drugs' : familyId === 'syndicate' ? '+20% Hack Inkomsten' : '+15% Combat Bonus',
    costPerDay: Math.floor(cost / 10),
  };
  s.familyRel[familyId] = Math.min(100, rel + 10);
}

export function handleBreakAlliance(s: GameState, familyId: FamilyId): void {
  if (!s.alliancePacts?.[familyId]) return;
  delete s.alliancePacts[familyId];
  s.familyRel[familyId] = Math.max(-100, (s.familyRel[familyId] || 0) - 20);
}
