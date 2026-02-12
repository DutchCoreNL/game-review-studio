/**
 * Corruption Network engine logic
 * Handles monthly payments, betrayal checks, and passive effects
 */

import { GameState, CorruptionEvent, NightReportData } from './types';
import { CORRUPT_CONTACTS, CORRUPTION_BETRAYAL_EVENTS, BETRAYAL_ARREST_CHANCE } from './constants';
import { addPersonalHeat, recomputeHeat, arrestPlayer } from './engine';
import { addPhoneMessage } from './newFeatures';

/**
 * Process corruption network effects during end of turn.
 * Called from engine endTurn or newFeatures applyNewFeatures.
 */
export function processCorruptionNetwork(state: GameState, report: NightReportData): void {
  if (!state.corruptContacts || state.corruptContacts.length === 0) return;

  const activeContacts = state.corruptContacts.filter(c => c.active && !c.compromised);

  // === MONTHLY PAYMENT CHECK (every 7 days = 1 "month") ===
  activeContacts.forEach(contact => {
    const daysSincePayment = state.day - contact.lastPaidDay;
    if (daysSincePayment >= 7) {
      const def = CORRUPT_CONTACTS.find(d => d.id === contact.contactDefId);
      if (!def) return;

      if (state.money >= def.monthlyCost) {
        // Pay monthly cost
        state.money -= def.monthlyCost;
        state.stats.totalSpent += def.monthlyCost;
        contact.lastPaidDay = state.day;
        // Paying on time increases loyalty
        contact.loyalty = Math.min(100, contact.loyalty + 5);
      } else {
        // Can't pay — loyalty drops significantly
        contact.loyalty = Math.max(0, contact.loyalty - 20);
        addPhoneMessage(state, def.name, 'Mijn betaling is te laat. Ik doe dit niet voor de lol. Betaal snel of we hebben een probleem.', 'warning');
        
        // If loyalty hits 0, they leave
        if (contact.loyalty <= 0) {
          contact.active = false;
          addPhoneMessage(state, def.name, 'We zijn klaar. Ik hoop voor jou dat ik mijn mond hou.', 'threat');
          // Small heat increase from angry ex-contact
          addPersonalHeat(state, 5);
        }
      }
    }
  });

  // === BETRAYAL CHECK (daily) ===
  const stillActive = state.corruptContacts.filter(c => c.active && !c.compromised);
  for (const contact of stillActive) {
    const def = CORRUPT_CONTACTS.find(d => d.id === contact.contactDefId);
    if (!def) continue;

    // Base betrayal chance modified by loyalty
    const loyaltyMod = (100 - contact.loyalty) / 100; // low loyalty = higher risk
    const heatMod = (state.personalHeat || 0) > 60 ? 1.5 : 1.0; // high heat = more risk
    const dailyBetrayalChance = (def.betrayalRisk / 100) * loyaltyMod * heatMod * 0.03; // ~3% of base per day

    if (Math.random() < dailyBetrayalChance) {
      // BETRAYAL!
      contact.compromised = true;
      contact.active = false;

      const betrayalText = CORRUPTION_BETRAYAL_EVENTS[Math.floor(Math.random() * CORRUPTION_BETRAYAL_EVENTS.length)];
      
      // Apply betrayal consequences
      const heatPenalty = 15 + Math.floor(def.monthlyCost / 500);
      addPersonalHeat(state, heatPenalty);
      
      // Possible money loss (evidence-based fines)
      const fine = Math.floor(state.money * 0.1);
      if (fine > 0) {
        state.money -= fine;
      }

      const event: CorruptionEvent = {
        type: 'betrayal',
        contactId: contact.id,
        text: `${def.name} ${betrayalText} Je verliest €${fine.toLocaleString()} en krijgt +${heatPenalty} heat.`,
        effect: `fine_${fine}_heat_${heatPenalty}`,
      };
      state.pendingCorruptionEvent = event;

      // Betrayal can lead to direct arrest (40% chance)
      if (!state.prison && Math.random() < BETRAYAL_ARREST_CHANCE) {
        arrestPlayer(state, report);
        addPhoneMessage(state, 'NHPD', `Gearresteerd door verraad van ${def.name}! Straf: ${state.prison?.daysRemaining} dagen.`, 'threat');
      }

      addPhoneMessage(state, 'anonymous', `⚠️ WAARSCHUWING: ${def.title} ${def.name} is gecompromitteerd! Vernietig alle bewijzen!`, 'threat');
      break; // Only one betrayal per turn
    }
  }

  // === PASSIVE EFFECTS ===
  const activeAfterChecks = state.corruptContacts.filter(c => c.active && !c.compromised);
  
  let totalHeatReduction = 0;
  
  activeAfterChecks.forEach(contact => {
    const def = CORRUPT_CONTACTS.find(d => d.id === contact.contactDefId);
    if (!def) return;

    // Heat reduction
    if (def.effects.heatReduction) {
      totalHeatReduction += def.effects.heatReduction;
    }

    // Intel bonus: send market tips
    if (def.effects.intelBonus && state.day % 3 === 0) {
      const districts = ['port', 'crown', 'iron', 'low', 'neon'];
      const randomDistrict = districts[Math.floor(Math.random() * districts.length)];
      const demand = state.districtDemands[randomDistrict];
      if (demand) {
        addPhoneMessage(state, def.name, `Intel: Er is grote vraag naar ${demand} in ${randomDistrict}. Handel snel.`, 'opportunity');
      }
    }
  });

  // Apply cumulative heat reduction
  if (totalHeatReduction > 0) {
    addPersonalHeat(state, -totalHeatReduction);
  }

  recomputeHeat(state);
}

/**
 * Get the total raid protection percentage from all active contacts.
 */
export function getCorruptionRaidProtection(state: GameState): number {
  if (!state.corruptContacts) return 0;
  const active = state.corruptContacts.filter(c => c.active && !c.compromised);
  let protection = 0;
  active.forEach(contact => {
    const def = CORRUPT_CONTACTS.find(d => d.id === contact.contactDefId);
    if (def?.effects.raidProtection) {
      protection += def.effects.raidProtection;
    }
  });
  return Math.min(80, protection); // Cap at 80%
}

/**
 * Get the total fine reduction percentage from all active contacts.
 */
export function getCorruptionFineReduction(state: GameState): number {
  if (!state.corruptContacts) return 0;
  const active = state.corruptContacts.filter(c => c.active && !c.compromised);
  let reduction = 0;
  active.forEach(contact => {
    const def = CORRUPT_CONTACTS.find(d => d.id === contact.contactDefId);
    if (def?.effects.fineReduction) {
      reduction += def.effects.fineReduction;
    }
  });
  return Math.min(70, reduction); // Cap at 70%
}

/**
 * Get the total smuggle protection percentage from all active contacts.
 */
export function getCorruptionSmuggleProtection(state: GameState): number {
  if (!state.corruptContacts) return 0;
  const active = state.corruptContacts.filter(c => c.active && !c.compromised);
  let protection = 0;
  active.forEach(contact => {
    const def = CORRUPT_CONTACTS.find(d => d.id === contact.contactDefId);
    if (def?.effects.smuggleProtection) {
      protection += def.effects.smuggleProtection;
    }
  });
  return Math.min(80, protection);
}

/**
 * Get the total trade bonus percentage from all active contacts.
 */
export function getCorruptionTradeBonus(state: GameState): number {
  if (!state.corruptContacts) return 0;
  const active = state.corruptContacts.filter(c => c.active && !c.compromised);
  let bonus = 0;
  active.forEach(contact => {
    const def = CORRUPT_CONTACTS.find(d => d.id === contact.contactDefId);
    if (def?.effects.tradeBonus) {
      bonus += def.effects.tradeBonus;
    }
  });
  return Math.min(25, bonus); // Cap at 25%
}

/**
 * Get total monthly cost of all active contacts.
 */
export function getTotalMonthlyCost(state: GameState): number {
  if (!state.corruptContacts) return 0;
  return state.corruptContacts
    .filter(c => c.active && !c.compromised)
    .reduce((total, contact) => {
      const def = CORRUPT_CONTACTS.find(d => d.id === contact.contactDefId);
      return total + (def?.monthlyCost || 0);
    }, 0);
}
