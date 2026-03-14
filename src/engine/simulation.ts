import type { PetriNet, Marking, Arc } from '@/types/petriNet';

/** Get all arcs connected to a given node */
function getInputArcs(net: PetriNet, transitionId: string): Arc[] {
  return Object.values(net.arcs).filter((arc) => arc.targetId === transitionId);
}

function getOutputArcs(net: PetriNet, transitionId: string): Arc[] {
  return Object.values(net.arcs).filter((arc) => arc.sourceId === transitionId);
}

/** Check if a single transition is enabled under the given marking */
export function isTransitionEnabled(
  net: PetriNet,
  transitionId: string,
  marking: Marking
): boolean {
  const inputArcs = getInputArcs(net, transitionId);

  for (const arc of inputArcs) {
    const tokens = marking[arc.sourceId] ?? 0;

    switch (arc.arcType) {
      case 'normal':
        if (tokens < arc.weight) return false;
        break;
      case 'inhibitor':
        // Enabled when source has FEWER tokens than weight (typically weight=1 means "0 tokens")
        if (tokens >= arc.weight) return false;
        break;
      case 'read':
        // Like normal but doesn't consume tokens (checked here, not consumed in fire)
        if (tokens < arc.weight) return false;
        break;
    }
  }

  // Check output place capacities
  const outputArcs = getOutputArcs(net, transitionId);
  for (const arc of outputArcs) {
    const place = net.places[arc.targetId];
    if (place && place.capacity > 0) {
      const tokens = marking[arc.targetId] ?? 0;
      if (tokens + arc.weight > place.capacity) return false;
    }
  }

  return true;
}

/** Get all enabled transition IDs */
export function getEnabledTransitions(net: PetriNet, marking: Marking): string[] {
  return Object.keys(net.transitions).filter((id) =>
    isTransitionEnabled(net, id, marking)
  );
}

/** Fire a transition, returning the new marking. Does NOT check if enabled. */
export function fireTransition(
  net: PetriNet,
  transitionId: string,
  marking: Marking
): Marking {
  const newMarking = { ...marking };
  const inputArcs = getInputArcs(net, transitionId);
  const outputArcs = getOutputArcs(net, transitionId);

  // Consume tokens from input places (except read arcs)
  for (const arc of inputArcs) {
    if (arc.arcType !== 'read' && arc.arcType !== 'inhibitor') {
      newMarking[arc.sourceId] = (newMarking[arc.sourceId] ?? 0) - arc.weight;
    }
  }

  // Produce tokens in output places
  for (const arc of outputArcs) {
    newMarking[arc.targetId] = (newMarking[arc.targetId] ?? 0) + arc.weight;
  }

  return newMarking;
}

/** Get the current marking from a PetriNet */
export function getMarkingFromNet(net: PetriNet): Marking {
  const marking: Marking = {};
  for (const [id, place] of Object.entries(net.places)) {
    marking[id] = place.tokens;
  }
  return marking;
}
