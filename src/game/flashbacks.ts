/**
 * Consequence Flashback Generator
 * Na het voltooien van een verhaalboog genereert dit systeem een cinematische
 * terugblik op de keuzes die de speler heeft gemaakt, inclusief hun gevolgen.
 */

import { GameState, FlashbackData } from './types';
import { STORY_ARCS, StoryArcTemplate, StoryArcChoice } from './storyArcs';

export interface FlashbackScene {
  /** Step label, e.g. "De Ontmoeting" */
  label: string;
  /** What the player chose */
  choiceLabel: string;
  /** The outcome text (success or fail) */
  outcomeText: string;
  /** Was the choice successful? */
  success: boolean;
  /** Karma shift of this choice */
  karma: number;
}

export interface EnrichedFlashbackData extends FlashbackData {
  scenes: FlashbackScene[];
  epilogue: string;
  arcName: string;
  arcIcon: string;
  success: boolean;
}

/** Parse keyDecisions to find choices made for a specific arc */
function getArcChoices(arcId: string, keyDecisions: string[]): string[] {
  const prefix = `arc_${arcId}_`;
  return keyDecisions
    .filter(d => d.startsWith(prefix))
    .map(d => d.slice(prefix.length));
}

/** Find a choice in a story arc template by choiceId */
function findChoice(template: StoryArcTemplate, choiceId: string): {
  stepIndex: number;
  stepId: string;
  choice: StoryArcChoice;
} | null {
  for (let i = 0; i < template.steps.length; i++) {
    const step = template.steps[i];
    const choice = step.choices.find(c => c.id === choiceId);
    if (choice) return { stepIndex: i, stepId: step.id, choice };
  }
  return null;
}

/** Atmospheric intro lines per arc mood */
const MOOD_INTROS: Record<string, string[]> = {
  positive: [
    'De stad fluistert je naam met ontzag.',
    'Elke stap die je zette bracht je dichter bij de waarheid.',
    'Je pad was niet makkelijk — maar het was het jouwe.',
  ],
  negative: [
    'De schaduwen van Noxhaven onthouden wat je deed.',
    'Elke keuze liet littekens achter — op de stad, en op jezelf.',
    'Macht heeft een prijs. En jij hebt betaald.',
  ],
  neutral: [
    'De straten van Noxhaven vergeten niets.',
    'Terwijl de nacht valt, kijk je terug op wat is geweest.',
    'Elke keuze vormde wie je nu bent.',
  ],
};

/** Generate karma-based epilogue */
function generateEpilogue(karma: number, arcSuccess: boolean, arcName: string): string {
  if (arcSuccess && karma > 20) {
    return `Je hebt "${arcName}" voltooid met eer. De stad is veranderd door jouw principes — en dat vergeet niemand.`;
  }
  if (arcSuccess && karma < -20) {
    return `"${arcName}" is voorbij. Je meedogenloosheid bracht je de overwinning, maar 's nachts, in de stilte, hoor je nog steeds de echo's.`;
  }
  if (!arcSuccess) {
    return `"${arcName}" eindigde niet zoals je had gehoopt. Maar in Noxhaven is overleven al een overwinning.`;
  }
  return `"${arcName}" is afgesloten. De keuzes die je maakte vormen nu het fundament van wie je bent in Noxhaven.`;
}

/** Generate consequence flashback for a completed story arc */
export function generateArcFlashback(
  state: GameState,
  arcId: string
): EnrichedFlashbackData | null {
  const template = STORY_ARCS.find(a => a.id === arcId);
  if (!template) return null;

  const decisions = state.keyDecisions || [];
  const choiceIds = getArcChoices(arcId, decisions);
  if (choiceIds.length === 0) return null;

  const activeArc = state.activeStoryArcs?.find(a => a.arcId === arcId);
  const arcSuccess = activeArc?.success ?? true;

  // Build scenes from actual choices
  const scenes: FlashbackScene[] = [];
  let totalKarma = 0;

  for (const choiceId of choiceIds) {
    const found = findChoice(template, choiceId);
    if (!found) continue;

    const { stepIndex, choice } = found;
    const step = template.steps[stepIndex];
    // Determine if this choice succeeded (approximation based on effects)
    const wasSuccess = !decisions.includes(`arc_${arcId}_fail_${choiceId}`);
    const karma = choice.effects.karma || 0;
    totalKarma += karma;

    scenes.push({
      label: step.id.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase()),
      choiceLabel: choice.label,
      outcomeText: wasSuccess ? choice.successText : choice.failText,
      success: wasSuccess,
      karma,
    });
  }

  // Determine mood
  const mood = totalKarma > 10 ? 'positive' : totalKarma < -10 ? 'negative' : 'neutral';
  const intros = MOOD_INTROS[mood];
  const intro = intros[Math.floor(Math.random() * intros.length)];

  const epilogue = generateEpilogue(state.karma || 0, arcSuccess, template.name);

  // Build classic lines array for backward compatibility
  const lines: string[] = [intro];
  for (const scene of scenes) {
    lines.push(`Je koos: "${scene.choiceLabel}"`);
    // Truncate outcome for the line version
    const shortOutcome = scene.outcomeText.length > 100
      ? scene.outcomeText.slice(0, 97) + '...'
      : scene.outcomeText;
    lines.push(shortOutcome);
  }
  lines.push(epilogue);

  return {
    title: `${template.name} — Terugblik`,
    icon: template.icon,
    lines,
    scenes,
    epilogue,
    arcName: template.name,
    arcIcon: template.icon,
    success: arcSuccess,
  };
}
