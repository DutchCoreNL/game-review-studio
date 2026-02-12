import { GameState } from './types';
import { VEHICLES, VEHICLE_UPGRADES, RACE_NPCS } from './constants';
import { RaceNPC } from './types';
import { getPlayerStat } from './engine';

export interface RaceResult {
  won: boolean;
  multiplier: number; // 1.5x - 3x on win
  conditionLoss: number; // 0 on win, 15-30 on loss
  repGain: number;
  xpGain: number;
  npc: RaceNPC;
  narrative: string;
}

/** Pick a random NPC scaled to the race difficulty */
export function pickRaceNPC(raceType: 'street' | 'harbor' | 'neon_gp'): RaceNPC {
  const pool = RACE_NPCS.filter(n => {
    if (raceType === 'street') return n.skill <= 5;
    if (raceType === 'harbor') return n.skill >= 3 && n.skill <= 7;
    return n.skill >= 5;
  });
  if (pool.length === 0) return RACE_NPCS[Math.floor(Math.random() * RACE_NPCS.length)];
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Calculate race result based on vehicle stats, upgrades, crew */
export function calculateRaceResult(state: GameState, raceType: 'street' | 'harbor' | 'neon_gp', bet: number, npc: RaceNPC): RaceResult {
  const vehicle = VEHICLES.find(v => v.id === state.activeVehicle);
  const ownedV = state.ownedVehicles.find(v => v.id === state.activeVehicle);
  if (!vehicle || !ownedV) {
    return { won: false, multiplier: 0, conditionLoss: 15, repGain: 0, xpGain: 0, npc, narrative: 'Geen voertuig beschikbaar.' };
  }

  // Player score: base speed + speed upgrades + chauffeur bonus + random
  const speedUpgrade = (ownedV.upgrades?.speed || 0);
  const speedBonus = speedUpgrade > 0 ? VEHICLE_UPGRADES.speed.bonuses[speedUpgrade - 1] : 0;
  const totalSpeed = vehicle.speed + speedBonus;
  
  const hasChauffeur = state.crew.some(c => c.role === 'Chauffeur');
  const hasRacer = state.crew.some(c => c.specialization === 'racer');
  const chauffeurBonus = hasChauffeur ? 2 : 0;
  const racerBonus = hasRacer ? 1.5 : 0;
  
  // Condition penalty
  const conditionPenalty = ownedV.condition < 50 ? (50 - ownedV.condition) * 0.05 : 0;
  
  const playerScore = totalSpeed + chauffeurBonus + racerBonus - conditionPenalty + (Math.random() * 4);
  const npcScore = npc.skill + (Math.random() * 3);

  const won = playerScore > npcScore;

  const winNarratives = [
    `Je laat ${npc.name} ver achter je! De menigte gaat wild.`,
    `${npc.name} probeert in te halen maar je bent te snel!`,
    `Een perfecte finish — ${npc.name} heeft geen schijn van kans.`,
    `Je driftt door de laatste bocht en wint met overmacht!`,
  ];

  const loseNarratives = [
    `${npc.name} in z'n ${npc.vehicle} is te snel. Volgende keer beter.`,
    `Je verliest terrein in de laatste rechte lijn. ${npc.name} wint.`,
    `Een fout in de bocht kost je de race. ${npc.name} lacht je uit.`,
    `${npc.name} snijdt je af bij de finish. Vernederend.`,
  ];

  if (won) {
    const multiplier = raceType === 'neon_gp' ? 2.5 + Math.random() * 0.5 : raceType === 'harbor' ? 2 + Math.random() * 0.5 : 1.5 + Math.random() * 0.5;
    return {
      won: true,
      multiplier: Math.round(multiplier * 10) / 10,
      conditionLoss: 0,
      repGain: raceType === 'neon_gp' ? 30 : raceType === 'harbor' ? 15 : 5,
      xpGain: raceType === 'neon_gp' ? 40 : raceType === 'harbor' ? 20 : 10,
      npc,
      narrative: winNarratives[Math.floor(Math.random() * winNarratives.length)],
    };
  } else {
    return {
      won: false,
      multiplier: 0,
      conditionLoss: 15 + Math.floor(Math.random() * 16), // 15-30
      repGain: 0,
      xpGain: 2,
      npc,
      narrative: loseNarratives[Math.floor(Math.random() * loseNarratives.length)],
    };
  }
}
