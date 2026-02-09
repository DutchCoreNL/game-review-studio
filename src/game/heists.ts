/**
 * Heist Mission System — Templates, Engine, Complications
 */

import { GameState, DistrictId, StatId, FamilyId, GoodId, CrewRole } from './types';
import { DISTRICTS, FAMILIES } from './constants';
import { getPlayerStat } from './engine';

// ========== HEIST TYPES (kept here to avoid circular deps) ==========

export type HeistRoleId = 'infiltrant' | 'techman' | 'muscle';
export type HeistPhaseId = 'infiltration' | 'execution' | 'extraction';
export type HeistEquipId = 'emp' | 'c4' | 'disguise' | 'jammer' | 'smoke' | 'drill';
export type HeistApproach = 'stealth' | 'aggressive' | 'tech';

export interface HeistRoleDef {
  id: HeistRoleId;
  name: string;
  icon: string;
  idealRole: CrewRole;
  stat: StatId;
  desc: string;
}

export interface HeistEquipDef {
  id: HeistEquipId;
  name: string;
  cost: number;
  icon: string;
  desc: string;
  bypassComplication: string; // complication type it can bypass
}

export interface HeistComplication {
  id: string;
  text: string;
  type: 'alarm' | 'guard' | 'lockdown' | 'betrayal' | 'tech_fail' | 'witness';
  phase: HeistPhaseId;
  choices: HeistComplicationChoice[];
  criticalChoice: boolean; // if true, player must choose (not auto-resolved)
}

export interface HeistComplicationChoice {
  id: string;
  label: string;
  stat: StatId;
  difficulty: number;
  successText: string;
  failText: string;
  successEffect: { heat: number; reward: number; crewDamage: number };
  failEffect: { heat: number; reward: number; crewDamage: number };
}

export interface HeistTemplate {
  id: string;
  name: string;
  desc: string;
  icon: string;
  district: DistrictId;
  tier: number; // 1-3
  minLevel: number;
  minRep: number;
  basePayout: number;
  baseHeat: number;
  factionEffect: { familyId: FamilyId; change: number } | null;
  phases: HeistPhaseDef[];
  cooldownDays: number;
}

export interface HeistPhaseDef {
  id: HeistPhaseId;
  name: string;
  desc: string;
  skillChecks: { role: HeistRoleId; stat: StatId; difficulty: number }[];
  complications: HeistComplication[];
}

export interface HeistPlan {
  heistId: string;
  approach: HeistApproach;
  crewAssignments: Record<HeistRoleId, number | null>; // crew index
  equipment: HeistEquipId[];
  reconDone: boolean;
  reconIntel: string | null;
}

export interface ActiveHeist {
  plan: HeistPlan;
  currentPhase: number;
  phaseResults: HeistPhaseResult[];
  log: string[];
  totalReward: number;
  totalHeat: number;
  totalCrewDamage: number;
  pendingComplication: HeistComplication | null;
  finished: boolean;
  success: boolean;
  aborted: boolean;
}

export interface HeistPhaseResult {
  phase: HeistPhaseId;
  success: boolean;
  details: string;
}

// ========== CONSTANTS ==========

export const HEIST_ROLES: HeistRoleDef[] = [
  { id: 'infiltrant', name: 'Infiltrant', icon: '🥷', idealRole: 'Smokkelaar', stat: 'charm', desc: 'Sluipt langs bewaking. Charm-based.' },
  { id: 'techman', name: 'Techman', icon: '💻', idealRole: 'Hacker', stat: 'brains', desc: 'Hackt systemen en schakelt cameras uit.' },
  { id: 'muscle', name: 'Spierkracht', icon: '💪', idealRole: 'Enforcer', stat: 'muscle', desc: 'Brute kracht als het misgaat.' },
];

export const HEIST_EQUIPMENT: HeistEquipDef[] = [
  { id: 'emp', name: 'EMP Granaat', cost: 3000, icon: '⚡', desc: 'Schakelt elektronica uit. Omzeilt tech_fail.', bypassComplication: 'tech_fail' },
  { id: 'c4', name: 'C4 Springstof', cost: 5000, icon: '💣', desc: 'Blaas kluizen open. Omzeilt lockdown.', bypassComplication: 'lockdown' },
  { id: 'disguise', name: 'Vermomming', cost: 2000, icon: '🎭', desc: 'Onzichtbaar voor bewakers. Omzeilt guard.', bypassComplication: 'guard' },
  { id: 'jammer', name: 'Signaal Jammer', cost: 4000, icon: '📡', desc: 'Blokkeert alarm. Omzeilt alarm.', bypassComplication: 'alarm' },
  { id: 'smoke', name: 'Rookgranaat', cost: 1500, icon: '💨', desc: 'Visuele dekking. Omzeilt witness.', bypassComplication: 'witness' },
  { id: 'drill', name: 'Diamantboor', cost: 6000, icon: '🔩', desc: 'Forceert elke kluis. Omzeilt lockdown.', bypassComplication: 'lockdown' },
];

// ========== HEIST TEMPLATES ==========

const INFILTRATION_COMPLICATIONS: HeistComplication[] = [
  {
    id: 'alarm_trip', text: 'Een bewegingssensor gaat af!', type: 'alarm', phase: 'infiltration', criticalChoice: false,
    choices: [
      { id: 'hack_alarm', label: 'Hack het alarm', stat: 'brains', difficulty: 40, successText: 'Alarm uitgeschakeld.', failText: 'Alarm gaat harder!', successEffect: { heat: 0, reward: 0, crewDamage: 0 }, failEffect: { heat: 15, reward: -500, crewDamage: 0 } },
      { id: 'run_past', label: 'Ren door', stat: 'charm', difficulty: 50, successText: 'Ongemerkt gepasseerd.', failText: 'Gezien!', successEffect: { heat: 0, reward: 0, crewDamage: 0 }, failEffect: { heat: 10, reward: 0, crewDamage: 5 } },
    ],
  },
  {
    id: 'guard_patrol', text: 'Een bewaker draait zich om!', type: 'guard', phase: 'infiltration', criticalChoice: false,
    choices: [
      { id: 'knock_out', label: 'Uitschakelen', stat: 'muscle', difficulty: 35, successText: 'Bewaker uitgeschakeld.', failText: 'Alarm getrokken!', successEffect: { heat: 5, reward: 0, crewDamage: 0 }, failEffect: { heat: 20, reward: 0, crewDamage: 10 } },
      { id: 'distract', label: 'Afleiden', stat: 'charm', difficulty: 45, successText: 'Bewaker afgeleid.', failText: 'Niet getrapt.', successEffect: { heat: 0, reward: 0, crewDamage: 0 }, failEffect: { heat: 10, reward: 0, crewDamage: 0 } },
    ],
  },
];

const EXECUTION_COMPLICATIONS: HeistComplication[] = [
  {
    id: 'vault_lock', text: 'De kluis heeft een extra beveiliging!', type: 'lockdown', phase: 'execution', criticalChoice: true,
    choices: [
      { id: 'drill_it', label: 'Forceer de kluis', stat: 'muscle', difficulty: 55, successText: 'Kluis geforceerd!', failText: 'Boor kapot, alarm gaat!', successEffect: { heat: 5, reward: 2000, crewDamage: 0 }, failEffect: { heat: 25, reward: -2000, crewDamage: 15 } },
      { id: 'hack_vault', label: 'Hack het systeem', stat: 'brains', difficulty: 60, successText: 'Systeem gehackt!', failText: 'Lockdown geactiveerd!', successEffect: { heat: 0, reward: 3000, crewDamage: 0 }, failEffect: { heat: 20, reward: -1000, crewDamage: 5 } },
      { id: 'abort_vault', label: 'Sla over', stat: 'charm', difficulty: 20, successText: 'Focus op andere buit.', failText: 'Tijd verspild.', successEffect: { heat: 0, reward: -1000, crewDamage: 0 }, failEffect: { heat: 5, reward: -2000, crewDamage: 0 } },
    ],
  },
  {
    id: 'tech_malfunction', text: 'De hackingsoftware crasht!', type: 'tech_fail', phase: 'execution', criticalChoice: false,
    choices: [
      { id: 'manual_hack', label: 'Handmatig hacken', stat: 'brains', difficulty: 50, successText: 'Systeem weer online.', failText: 'Alle data verloren!', successEffect: { heat: 0, reward: 1000, crewDamage: 0 }, failEffect: { heat: 10, reward: -3000, crewDamage: 0 } },
      { id: 'brute_force', label: 'Brute force', stat: 'muscle', difficulty: 40, successText: 'Met geweld werkt het ook.', failText: 'Hardware kapot.', successEffect: { heat: 10, reward: 500, crewDamage: 5 }, failEffect: { heat: 15, reward: -1500, crewDamage: 10 } },
    ],
  },
];

const EXTRACTION_COMPLICATIONS: HeistComplication[] = [
  {
    id: 'witness', text: 'Een getuige ziet jullie vertrekken!', type: 'witness', phase: 'extraction', criticalChoice: true,
    choices: [
      { id: 'intimidate', label: 'Bedreig de getuige', stat: 'muscle', difficulty: 30, successText: 'Getuige zwijgt.', failText: 'Getuige belt politie!', successEffect: { heat: 5, reward: 0, crewDamage: 0 }, failEffect: { heat: 30, reward: 0, crewDamage: 0 } },
      { id: 'bribe_witness', label: 'Omkopen', stat: 'charm', difficulty: 35, successText: 'Stilzwijgen gekocht.', failText: 'Wil meer geld!', successEffect: { heat: 0, reward: -500, crewDamage: 0 }, failEffect: { heat: 15, reward: -2000, crewDamage: 0 } },
    ],
  },
  {
    id: 'betrayal', text: 'Een van de contacten verraadt jullie positie!', type: 'betrayal', phase: 'extraction', criticalChoice: true,
    choices: [
      { id: 'fight_out', label: 'Vechtend eruit', stat: 'muscle', difficulty: 50, successText: 'Vechtend ontsnapt!', failText: 'Zware verwondingen.', successEffect: { heat: 15, reward: 0, crewDamage: 5 }, failEffect: { heat: 25, reward: -3000, crewDamage: 25 } },
      { id: 'alternate_route', label: 'Alternatieve route', stat: 'brains', difficulty: 45, successText: 'Slim omgeleid!', failText: 'Doodlopend.', successEffect: { heat: 5, reward: 0, crewDamage: 0 }, failEffect: { heat: 20, reward: -1000, crewDamage: 15 } },
      { id: 'negotiate_out', label: 'Onderhandelen', stat: 'charm', difficulty: 55, successText: 'Deal gesloten.', failText: 'Ze willen bloed.', successEffect: { heat: 0, reward: -2000, crewDamage: 0 }, failEffect: { heat: 10, reward: -5000, crewDamage: 20 } },
    ],
  },
];

export const HEIST_TEMPLATES: HeistTemplate[] = [
  {
    id: 'warehouse_raid', name: 'Havenpakhuis Overval', desc: 'Steel een lading illegale goederen uit een bewaakt pakhuis.', icon: '📦',
    district: 'port', tier: 1, minLevel: 3, minRep: 50, basePayout: 15000, baseHeat: 20,
    factionEffect: { familyId: 'cartel', change: -5 }, cooldownDays: 5,
    phases: [
      { id: 'infiltration', name: 'Infiltratie', desc: 'Breek in via de achterdeur.', skillChecks: [{ role: 'infiltrant', stat: 'charm', difficulty: 35 }], complications: INFILTRATION_COMPLICATIONS },
      { id: 'execution', name: 'Uitvoering', desc: 'Laad de goederen in.', skillChecks: [{ role: 'techman', stat: 'brains', difficulty: 30 }, { role: 'muscle', stat: 'muscle', difficulty: 25 }], complications: EXECUTION_COMPLICATIONS },
      { id: 'extraction', name: 'Extractie', desc: 'Vertrek onopgemerkt.', skillChecks: [{ role: 'muscle', stat: 'muscle', difficulty: 30 }], complications: EXTRACTION_COMPLICATIONS },
    ],
  },
  {
    id: 'casino_heist', name: 'Casino Kluis Kraak', desc: 'Kraak de kluis van een rivaliserende casino in Neon Strip.', icon: '🎰',
    district: 'neon', tier: 2, minLevel: 5, minRep: 150, basePayout: 40000, baseHeat: 35,
    factionEffect: null, cooldownDays: 7,
    phases: [
      { id: 'infiltration', name: 'Infiltratie', desc: 'Vermom je als VIP-gasten.', skillChecks: [{ role: 'infiltrant', stat: 'charm', difficulty: 50 }], complications: INFILTRATION_COMPLICATIONS },
      { id: 'execution', name: 'Uitvoering', desc: 'Hack de kluis en neem het geld.', skillChecks: [{ role: 'techman', stat: 'brains', difficulty: 55 }, { role: 'infiltrant', stat: 'charm', difficulty: 40 }], complications: EXECUTION_COMPLICATIONS },
      { id: 'extraction', name: 'Extractie', desc: 'Ontvlucht via de VIP-uitgang.', skillChecks: [{ role: 'muscle', stat: 'muscle', difficulty: 45 }], complications: EXTRACTION_COMPLICATIONS },
    ],
  },
  {
    id: 'data_center', name: 'Crown Datacenter Hack', desc: 'Steel bedrijfsgeheimen uit een zwaar beveiligd datacenter.', icon: '🖥️',
    district: 'crown', tier: 2, minLevel: 6, minRep: 200, basePayout: 55000, baseHeat: 25,
    factionEffect: { familyId: 'syndicate', change: -8 }, cooldownDays: 7,
    phases: [
      { id: 'infiltration', name: 'Infiltratie', desc: 'Omzeil de biometrische scans.', skillChecks: [{ role: 'techman', stat: 'brains', difficulty: 55 }], complications: INFILTRATION_COMPLICATIONS },
      { id: 'execution', name: 'Uitvoering', desc: 'Download de data.', skillChecks: [{ role: 'techman', stat: 'brains', difficulty: 60 }, { role: 'infiltrant', stat: 'charm', difficulty: 35 }], complications: EXECUTION_COMPLICATIONS },
      { id: 'extraction', name: 'Extractie', desc: 'Vernietig sporen en vertrek.', skillChecks: [{ role: 'infiltrant', stat: 'charm', difficulty: 45 }], complications: EXTRACTION_COMPLICATIONS },
    ],
  },
  {
    id: 'arms_convoy', name: 'Wapenkonvooi Kaping', desc: 'Kap een gepantserd wapenkonvooi van de Iron Skulls.', icon: '🚛',
    district: 'iron', tier: 3, minLevel: 8, minRep: 350, basePayout: 85000, baseHeat: 45,
    factionEffect: { familyId: 'bikers', change: -12 }, cooldownDays: 10,
    phases: [
      { id: 'infiltration', name: 'Voorbereiding', desc: 'Blokkeer de route.', skillChecks: [{ role: 'muscle', stat: 'muscle', difficulty: 50 }], complications: INFILTRATION_COMPLICATIONS },
      { id: 'execution', name: 'Uitvoering', desc: 'Overmeester de bewakers.', skillChecks: [{ role: 'muscle', stat: 'muscle', difficulty: 65 }, { role: 'techman', stat: 'brains', difficulty: 45 }], complications: EXECUTION_COMPLICATIONS },
      { id: 'extraction', name: 'Extractie', desc: 'Rij weg met de buit.', skillChecks: [{ role: 'infiltrant', stat: 'charm', difficulty: 40 }, { role: 'muscle', stat: 'muscle', difficulty: 55 }], complications: EXTRACTION_COMPLICATIONS },
    ],
  },
  {
    id: 'bank_job', name: 'De Grote Bankroof', desc: 'De ultieme klus: kraak de centrale bank van Noxhaven.', icon: '🏦',
    district: 'crown', tier: 3, minLevel: 10, minRep: 500, basePayout: 150000, baseHeat: 60,
    factionEffect: null, cooldownDays: 14,
    phases: [
      { id: 'infiltration', name: 'Infiltratie', desc: 'Infiltreer als schoonmakers.', skillChecks: [{ role: 'infiltrant', stat: 'charm', difficulty: 65 }, { role: 'techman', stat: 'brains', difficulty: 60 }], complications: INFILTRATION_COMPLICATIONS },
      { id: 'execution', name: 'Uitvoering', desc: 'Neutraliseer de kluis.', skillChecks: [{ role: 'techman', stat: 'brains', difficulty: 70 }, { role: 'muscle', stat: 'muscle', difficulty: 55 }], complications: EXECUTION_COMPLICATIONS },
      { id: 'extraction', name: 'Extractie', desc: 'Ontvlucht met de buit.', skillChecks: [{ role: 'muscle', stat: 'muscle', difficulty: 60 }, { role: 'infiltrant', stat: 'charm', difficulty: 50 }], complications: EXTRACTION_COMPLICATIONS },
    ],
  },
];

// ========== ENGINE FUNCTIONS ==========

export function getAvailableHeists(state: GameState): HeistTemplate[] {
  return HEIST_TEMPLATES.filter(h => {
    if (state.player.level < h.minLevel) return false;
    if (state.rep < h.minRep) return false;
    // Check cooldown
    const lastCompleted = (state.heistCooldowns || {})[h.id] || 0;
    if (state.day - lastCompleted < h.cooldownDays) return false;
    return true;
  });
}

export function getHeistCooldownRemaining(state: GameState, heistId: string): number {
  const template = HEIST_TEMPLATES.find(h => h.id === heistId);
  if (!template) return 0;
  const lastCompleted = (state.heistCooldowns || {})[heistId] || 0;
  return Math.max(0, template.cooldownDays - (state.day - lastCompleted));
}

export function createHeistPlan(heistId: string): HeistPlan {
  return {
    heistId,
    approach: 'stealth',
    crewAssignments: { infiltrant: null, techman: null, muscle: null },
    equipment: [],
    reconDone: false,
    reconIntel: null,
  };
}

export function performRecon(state: GameState, plan: HeistPlan): string {
  const template = HEIST_TEMPLATES.find(h => h.id === plan.heistId);
  if (!template) return '';
  const brains = getPlayerStat(state, 'brains');
  const details: string[] = [
    `Locatie: ${DISTRICTS[template.district].name}`,
    `Moeilijkheid: Tier ${template.tier}`,
    `Verwachte bewaking: ${template.tier <= 1 ? 'Laag' : template.tier <= 2 ? 'Gemiddeld' : 'Zwaar'}`,
  ];
  if (brains >= 5) details.push(`Tip: ${template.phases[0].complications[0]?.text || 'Onbekend'}`);
  if (brains >= 8) details.push(`Zwakke plek gevonden: -15% moeilijkheid`);
  return details.join('\n');
}

export function validateHeistPlan(plan: HeistPlan, state: GameState): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const template = HEIST_TEMPLATES.find(h => h.id === plan.heistId);
  if (!template) { errors.push('Ongeldig heist template'); return { valid: false, errors }; }

  // Check crew assignments
  const assigned = Object.values(plan.crewAssignments).filter(v => v !== null);
  if (assigned.length < 3) errors.push('Wijs 3 crewleden toe aan rollen');
  
  // Check for duplicate assignments
  const unique = new Set(assigned);
  if (unique.size !== assigned.length) errors.push('Elk crewlid mag maar één rol hebben');

  // Check crew health
  for (const [role, idx] of Object.entries(plan.crewAssignments)) {
    if (idx !== null && state.crew[idx]) {
      if (state.crew[idx].hp <= 0) errors.push(`${state.crew[idx].name} is buiten westen`);
    }
  }

  return { valid: errors.length === 0, errors };
}

export function startHeist(state: GameState, plan: HeistPlan): ActiveHeist {
  return {
    plan,
    currentPhase: 0,
    phaseResults: [],
    log: ['🎯 Heist gestart...'],
    totalReward: 0,
    totalHeat: 0,
    totalCrewDamage: 0,
    pendingComplication: null,
    finished: false,
    success: false,
    aborted: false,
  };
}

/** Execute a phase's skill checks */
export function executePhase(state: GameState, heist: ActiveHeist): void {
  const template = HEIST_TEMPLATES.find(h => h.id === heist.plan.heistId)!;
  const phaseDef = template.phases[heist.currentPhase];
  if (!phaseDef) { heist.finished = true; return; }

  heist.log.push(`\n📍 Fase ${heist.currentPhase + 1}: ${phaseDef.name}`);
  heist.log.push(`   ${phaseDef.desc}`);

  let phaseSuccess = true;

  // Run skill checks
  for (const check of phaseDef.skillChecks) {
    const crewIdx = heist.plan.crewAssignments[check.role];
    if (crewIdx === null || !state.crew[crewIdx]) {
      heist.log.push(`   ✗ Geen crew voor ${check.role}!`);
      phaseSuccess = false;
      continue;
    }

    const crew = state.crew[crewIdx];
    const roleDef = HEIST_ROLES.find(r => r.id === check.role)!;
    let difficulty = check.difficulty;

    // Recon bonus
    if (heist.plan.reconDone) difficulty -= 10;
    // Ideal role bonus
    if (crew.role === roleDef.idealRole) difficulty -= 15;
    // Specialization bonus
    if (crew.specialization) difficulty -= 5;
    // HP penalty
    if (crew.hp < 50) difficulty += 10;
    // Player stat bonus
    const statVal = getPlayerStat(state, check.stat);
    difficulty -= statVal * 2;

    difficulty = Math.max(5, Math.min(95, difficulty));
    const roll = Math.random() * 100;
    const passed = roll > difficulty;

    if (passed) {
      heist.log.push(`   ✓ ${crew.name} (${roleDef.name}): Geslaagd!`);
      heist.totalReward += Math.floor(template.basePayout * 0.1);
    } else {
      heist.log.push(`   ✗ ${crew.name} (${roleDef.name}): Mislukt.`);
      heist.totalHeat += 5;
      heist.totalCrewDamage += 5;
      phaseSuccess = false;
    }
  }

  // Roll for complication (50% chance, higher if phase failed)
  const complicationChance = phaseSuccess ? 0.4 : 0.7;
  if (phaseDef.complications.length > 0 && Math.random() < complicationChance) {
    const complication = phaseDef.complications[Math.floor(Math.random() * phaseDef.complications.length)];
    
    // Check if equipment bypasses this
    const bypass = HEIST_EQUIPMENT.find(e => heist.plan.equipment.includes(e.id) && e.bypassComplication === complication.type);
    if (bypass) {
      heist.log.push(`   🛡️ ${bypass.name} omzeilt: ${complication.text}`);
    } else if (complication.criticalChoice) {
      // Player must choose
      heist.pendingComplication = complication;
      heist.log.push(`   ⚠️ ${complication.text}`);
      return; // Wait for player choice
    } else {
      // Auto-resolve with best available stat
      const bestChoice = complication.choices[0];
      const statVal = getPlayerStat(state, bestChoice.stat);
      const diff = Math.max(10, bestChoice.difficulty - statVal * 3);
      const roll = Math.random() * 100;
      if (roll > diff) {
        heist.log.push(`   ✓ ${complication.text} — ${bestChoice.successText}`);
        heist.totalReward += bestChoice.successEffect.reward;
        heist.totalHeat += bestChoice.successEffect.heat;
        heist.totalCrewDamage += bestChoice.successEffect.crewDamage;
      } else {
        heist.log.push(`   ✗ ${complication.text} — ${bestChoice.failText}`);
        heist.totalReward += bestChoice.failEffect.reward;
        heist.totalHeat += bestChoice.failEffect.heat;
        heist.totalCrewDamage += bestChoice.failEffect.crewDamage;
        phaseSuccess = false;
      }
    }
  }

  heist.phaseResults.push({ phase: phaseDef.id, success: phaseSuccess, details: phaseSuccess ? 'Geslaagd' : 'Problemen' });

  // Move to next phase or finish
  if (heist.currentPhase < template.phases.length - 1) {
    heist.currentPhase++;
  } else {
    finishHeist(state, heist, template);
  }
}

/** Resolve a complication choice */
export function resolveComplication(state: GameState, heist: ActiveHeist, choiceId: string): void {
  const complication = heist.pendingComplication;
  if (!complication) return;

  const choice = complication.choices.find(c => c.id === choiceId);
  if (!choice) return;

  const statVal = getPlayerStat(state, choice.stat);
  const diff = Math.max(10, choice.difficulty - statVal * 3);
  const roll = Math.random() * 100;
  const success = roll > diff;

  if (success) {
    heist.log.push(`   ✓ ${choice.label}: ${choice.successText}`);
    heist.totalReward += choice.successEffect.reward;
    heist.totalHeat += choice.successEffect.heat;
    heist.totalCrewDamage += choice.successEffect.crewDamage;
  } else {
    heist.log.push(`   ✗ ${choice.label}: ${choice.failText}`);
    heist.totalReward += choice.failEffect.reward;
    heist.totalHeat += choice.failEffect.heat;
    heist.totalCrewDamage += choice.failEffect.crewDamage;
  }

  heist.pendingComplication = null;
  heist.phaseResults.push({
    phase: complication.phase,
    success,
    details: success ? choice.successText : choice.failText,
  });

  // Continue to next phase
  const template = HEIST_TEMPLATES.find(h => h.id === heist.plan.heistId)!;
  if (heist.currentPhase < template.phases.length - 1) {
    heist.currentPhase++;
  } else {
    finishHeist(state, heist, template);
  }
}

function finishHeist(state: GameState, heist: ActiveHeist, template: HeistTemplate): void {
  const successCount = heist.phaseResults.filter(r => r.success).length;
  heist.success = successCount >= 2; // Need 2/3 phases success

  if (heist.success) {
    heist.totalReward = Math.max(0, template.basePayout + heist.totalReward);
    heist.log.push(`\n🎉 HEIST GESLAAGD! Buit: €${heist.totalReward.toLocaleString()}`);
  } else {
    heist.totalReward = Math.max(0, Math.floor(template.basePayout * 0.15) + heist.totalReward);
    heist.totalHeat += template.baseHeat;
    heist.log.push(`\n💀 HEIST MISLUKT. Restbuit: €${heist.totalReward.toLocaleString()}`);
  }

  heist.finished = true;
}
