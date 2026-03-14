import type { PetriNet, Marking } from '@/types/petriNet';
import { getEnabledTransitions, isTransitionEnabled, fireTransition } from './simulation';

/**
 * Select a transition to fire when multiple are enabled.
 * Priority: higher priority value wins. Ties broken randomly.
 */
export function selectTransition(
  net: PetriNet,
  enabledIds: string[],
): string | null {
  if (enabledIds.length === 0) return null;
  if (enabledIds.length === 1) return enabledIds[0];

  // Sort by priority (descending)
  const sorted = [...enabledIds].sort((a, b) => {
    const pa = net.transitions[a]?.priority ?? 0;
    const pb = net.transitions[b]?.priority ?? 0;
    return pb - pa;
  });

  // Get all with highest priority
  const highestPriority = net.transitions[sorted[0]]?.priority ?? 0;
  const topPriority = sorted.filter(
    (id) => (net.transitions[id]?.priority ?? 0) === highestPriority
  );

  // Random tie-breaking
  const idx = Math.floor(Math.random() * topPriority.length);
  return topPriority[idx];
}

/**
 * Run one step of maximal concurrency simulation.
 * Fires as many non-conflicting transitions as possible in one step.
 */
export function fireMaximalStep(
  net: PetriNet,
  marking: Marking
): { newMarking: Marking; firedTransitions: string[] } {
  const firedTransitions: string[] = [];
  let currentMarking = { ...marking };

  // Keep firing transitions until no more can be fired
  let enabled = getEnabledTransitions(net, currentMarking);

  while (enabled.length > 0) {
    const selected = selectTransition(net, enabled);
    if (!selected) break;

    currentMarking = fireTransition(net, selected, currentMarking);
    firedTransitions.push(selected);

    // Re-check which are still enabled
    enabled = enabled.filter(
      (id) => id !== selected && isTransitionEnabled(net, id, currentMarking)
    );
  }

  return { newMarking: currentMarking, firedTransitions };
}
