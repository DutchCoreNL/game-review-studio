/**
 * Crew Loyalty System
 * Crew members have a loyalty value (0-100).
 * Loyalty decays when members are neglected (low HP, no specialization, not used).
 * Below 20 loyalty, crew can defect at the end of a turn.
 */

import type { GameState, NightReportData, FamilyId } from './types';
import { addPhoneMessage } from './newFeatures';
import { rollCrewEvent, checkLoyaltyMilestones } from './crewEvents';

const DEFECTION_THRESHOLD = 20;
const DEFECTION_CHANCE = 0.4; // 40% chance to defect when below threshold

/** Process crew loyalty at end of turn */
export function processCrewLoyalty(state: GameState, report: NightReportData): void {
  if (!state.crew || state.crew.length === 0) return;

  const defections: { name: string; reason: string }[] = [];

  for (let i = state.crew.length - 1; i >= 0; i--) {
    const member = state.crew[i];
    
    // Initialize loyalty if missing (migration)
    if (member.loyalty === undefined || member.loyalty === null) {
      member.loyalty = 75;
    }

    let loyaltyChange = 0;
    let decayReason = '';

    // Neglect: low HP for too long
    if (member.hp < 30) {
      loyaltyChange -= 5;
      decayReason = 'verwaarlozing (lage HP)';
    } else if (member.hp < 50) {
      loyaltyChange -= 2;
    }

    // No specialization at high level = feels undervalued
    if (member.level >= 5 && !member.specialization) {
      loyaltyChange -= 2;
      if (!decayReason) decayReason = 'geen specialisatie';
    }

    // Unconscious = major loyalty hit
    if (member.hp <= 0) {
      loyaltyChange -= 8;
      decayReason = 'bewusteloos gelaten';
    }

    // Low karma makes crew nervous
    if (state.karma < -50) {
      loyaltyChange -= 1;
    }

    // Positive factors
    // High rep = prestigious to work for
    if (state.rep > 200) loyaltyChange += 1;
    if (state.rep > 500) loyaltyChange += 1;
    
    // Villa crew quarters boost morale
    if (state.villa?.modules.includes('crew_kwartieren')) {
      loyaltyChange += 3;
    }

    // Safehouse medbay shows you care
    if (state.safehouses?.some(sh => sh.upgrades.includes('medbay'))) {
      loyaltyChange += 1;
    }

    // Full HP = content
    if (member.hp === 100) {
      loyaltyChange += 1;
    }

    // Apply loyalty change
    member.loyalty = Math.max(0, Math.min(100, member.loyalty + loyaltyChange));

    // Check for defection
    if (member.loyalty < DEFECTION_THRESHOLD && Math.random() < DEFECTION_CHANCE) {
      const reason = decayReason || 'ontrouw';
      defections.push({ name: member.name, reason });
      
      // Remove crew member
      state.crew.splice(i, 1);
      
      // Send phone message
      addPhoneMessage(
        state,
        member.name,
        `Ik heb genoeg van deze crew. Je behandelt ons als vee. Ik ben weg. Reden: ${reason}.`,
        'warning'
      );

      // Possible faction join — the defector joins a hostile faction
      const hostileFactions = (['cartel', 'syndicate', 'bikers'] as FamilyId[])
        .filter(fid => (state.familyRel[fid] || 0) < -20);
      if (hostileFactions.length > 0) {
        const joinedFaction = hostileFactions[Math.floor(Math.random() * hostileFactions.length)];
        addPhoneMessage(
          state,
          'anonymous',
          `Gerucht: ${member.name} is gespot bij de ${joinedFaction}. Ze kennen nu je werkwijze.`,
          'threat'
        );
      }
    }
  }

  if (defections.length > 0) {
    report.crewDefections = defections;
  }

  // Check loyalty milestones (trouw bonus, ultimatum)
  checkLoyaltyMilestones(state);

  // Roll for crew loyalty event
  const crewEvent = rollCrewEvent(state);
  if (crewEvent) {
    state.pendingCrewEvent = crewEvent;
    addPhoneMessage(
      state,
      crewEvent.crewName,
      crewEvent.message,
      'opportunity'
    );
  }
}

/** Get loyalty status label */
export function getLoyaltyLabel(loyalty: number): { text: string; color: string } {
  if (loyalty >= 80) return { text: 'Trouw', color: 'text-emerald' };
  if (loyalty >= 50) return { text: 'Neutraal', color: 'text-gold' };
  if (loyalty >= 20) return { text: 'Onrustig', color: 'text-orange-400' };
  return { text: 'Ontrouw', color: 'text-blood' };
}
