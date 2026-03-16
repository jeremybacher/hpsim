import type { StateCreator } from 'zustand';
import { nanoid } from 'nanoid';
import type { Place, Transition, Arc, Annotation, Position, PetriNet, ArcType, Marking } from '@/types/petriNet';
import {
  DEFAULT_PLACE_TOKENS,
  DEFAULT_PLACE_CAPACITY,
  DEFAULT_TRANSITION_DELAY,
  DEFAULT_TRANSITION_PRIORITY,
  DEFAULT_ARC_WEIGHT,
} from '@/lib/constants';
import type { StoreState } from './useStore';

export interface PetriNetSlice {
  net: PetriNet;

  // Places
  addPlace: (position: Position) => string;
  updatePlace: (id: string, updates: Partial<Omit<Place, 'id' | 'type'>>) => void;
  removePlace: (id: string) => void;

  // Transitions
  addTransition: (position: Position) => string;
  updateTransition: (id: string, updates: Partial<Omit<Transition, 'id' | 'type'>>) => void;
  removeTransition: (id: string) => void;

  // Arcs
  addArc: (sourceId: string, targetId: string, arcType?: ArcType) => string | null;
  updateArc: (id: string, updates: Partial<Omit<Arc, 'id' | 'type'>>) => void;
  removeArc: (id: string) => void;

  // Annotations
  addAnnotation: (annotation: Omit<Annotation, 'id' | 'type'>) => string;
  updateAnnotation: (id: string, updates: Partial<Omit<Annotation, 'id' | 'type'>>) => void;
  removeAnnotation: (id: string) => void;

  // Bulk
  removeElements: (ids: string[]) => void;
  moveElements: (ids: string[], delta: Position) => void;

  // Tokens
  setTokens: (placeId: string, tokens: number) => void;
  addToken: (placeId: string) => void;
  removeToken: (placeId: string) => void;

  // Net
  setNet: (net: PetriNet) => void;
  getMarking: () => Marking;
  setMarking: (marking: Marking) => void;
}

const createEmptyNet = (): PetriNet => ({
  name: 'Untitled Net',
  description: '',
  places: {},
  transitions: {},
  arcs: {},
  annotations: {},
});

function nextAvailableLabel(prefix: string, existing: Record<string, { label: string }>): string {
  const usedNumbers = new Set<number>();
  const pattern = new RegExp(`^${prefix}(\\d+)$`);
  for (const item of Object.values(existing)) {
    const match = item.label.match(pattern);
    if (match) usedNumbers.add(parseInt(match[1], 10));
  }
  let n = 1;
  while (usedNumbers.has(n)) n++;
  return `${prefix}${n}`;
}

export const createPetriNetSlice: StateCreator<StoreState, [['zustand/immer', never]], [], PetriNetSlice> = (set, get) => ({
  net: createEmptyNet(),

  addPlace: (position) => {
    const id = nanoid();
    const label = nextAvailableLabel('P', get().net.places);
    set((state) => {
      state.net.places[id] = {
        id,
        type: 'place',
        label,
        position: { ...position },
        tokens: DEFAULT_PLACE_TOKENS,
        capacity: DEFAULT_PLACE_CAPACITY,
      };
    });
    return id;
  },

  updatePlace: (id, updates) => {
    set((state) => {
      const place = state.net.places[id];
      if (place) Object.assign(place, updates);
    });
  },

  removePlace: (id) => {
    set((state) => {
      delete state.net.places[id];
      // Remove connected arcs
      for (const [arcId, arc] of Object.entries(state.net.arcs)) {
        if (arc.sourceId === id || arc.targetId === id) {
          delete state.net.arcs[arcId];
        }
      }
    });
  },

  addTransition: (position) => {
    const id = nanoid();
    const label = nextAvailableLabel('T', get().net.transitions);
    set((state) => {
      state.net.transitions[id] = {
        id,
        type: 'transition',
        label,
        position: { ...position },
        delay: DEFAULT_TRANSITION_DELAY,
        priority: DEFAULT_TRANSITION_PRIORITY,
      };
    });
    return id;
  },

  updateTransition: (id, updates) => {
    set((state) => {
      const transition = state.net.transitions[id];
      if (transition) Object.assign(transition, updates);
    });
  },

  removeTransition: (id) => {
    set((state) => {
      delete state.net.transitions[id];
      // Remove connected arcs
      for (const [arcId, arc] of Object.entries(state.net.arcs)) {
        if (arc.sourceId === id || arc.targetId === id) {
          delete state.net.arcs[arcId];
        }
      }
    });
  },

  addArc: (sourceId, targetId, arcType = 'normal') => {
    const state = get();
    const isSourcePlace = sourceId in state.net.places;
    const isSourceTransition = sourceId in state.net.transitions;
    const isTargetPlace = targetId in state.net.places;
    const isTargetTransition = targetId in state.net.transitions;

    // Validate: place->transition or transition->place only
    if (!(isSourcePlace && isTargetTransition) && !(isSourceTransition && isTargetPlace)) {
      return null;
    }

    // Check for duplicate arc
    for (const arc of Object.values(state.net.arcs)) {
      if (arc.sourceId === sourceId && arc.targetId === targetId) {
        return null;
      }
    }

    const id = nanoid();
    set((s) => {
      s.net.arcs[id] = {
        id,
        type: 'arc',
        arcType,
        sourceId,
        targetId,
        weight: DEFAULT_ARC_WEIGHT,
        bendPoints: [],
      };
    });
    return id;
  },

  updateArc: (id, updates) => {
    set((state) => {
      const arc = state.net.arcs[id];
      if (arc) Object.assign(arc, updates);
    });
  },

  removeArc: (id) => {
    set((state) => {
      delete state.net.arcs[id];
    });
  },

  addAnnotation: (annotation) => {
    const id = nanoid();
    set((state) => {
      state.net.annotations[id] = {
        id,
        type: 'annotation',
        ...annotation,
      };
    });
    return id;
  },

  updateAnnotation: (id, updates) => {
    set((state) => {
      const ann = state.net.annotations[id];
      if (ann) Object.assign(ann, updates);
    });
  },

  removeAnnotation: (id) => {
    set((state) => {
      delete state.net.annotations[id];
    });
  },

  removeElements: (ids) => {
    set((state) => {
      for (const id of ids) {
        if (id in state.net.places) {
          delete state.net.places[id];
        } else if (id in state.net.transitions) {
          delete state.net.transitions[id];
        } else if (id in state.net.arcs) {
          delete state.net.arcs[id];
        } else if (id in state.net.annotations) {
          delete state.net.annotations[id];
        }
      }
      // Remove orphaned arcs
      for (const [arcId, arc] of Object.entries(state.net.arcs)) {
        const sourceExists = arc.sourceId in state.net.places || arc.sourceId in state.net.transitions;
        const targetExists = arc.targetId in state.net.places || arc.targetId in state.net.transitions;
        if (!sourceExists || !targetExists) {
          delete state.net.arcs[arcId];
        }
      }
    });
  },

  moveElements: (ids, delta) => {
    set((state) => {
      for (const id of ids) {
        const place = state.net.places[id];
        if (place) {
          place.position.x += delta.x;
          place.position.y += delta.y;
          continue;
        }
        const transition = state.net.transitions[id];
        if (transition) {
          transition.position.x += delta.x;
          transition.position.y += delta.y;
          continue;
        }
        const annotation = state.net.annotations[id];
        if (annotation) {
          annotation.position.x += delta.x;
          annotation.position.y += delta.y;
        }
      }
    });
  },

  setTokens: (placeId, tokens) => {
    set((state) => {
      const place = state.net.places[placeId];
      if (place) place.tokens = Math.max(0, tokens);
    });
  },

  addToken: (placeId) => {
    set((state) => {
      const place = state.net.places[placeId];
      if (place) {
        if (place.capacity === 0 || place.tokens < place.capacity) {
          place.tokens++;
        }
      }
    });
  },

  removeToken: (placeId) => {
    set((state) => {
      const place = state.net.places[placeId];
      if (place && place.tokens > 0) place.tokens--;
    });
  },

  setNet: (net) => {
    set((state) => {
      state.net = net;
    });
  },

  getMarking: () => {
    const state = get();
    const marking: Marking = {};
    for (const [id, place] of Object.entries(state.net.places)) {
      marking[id] = place.tokens;
    }
    return marking;
  },

  setMarking: (marking) => {
    set((state) => {
      for (const [placeId, tokens] of Object.entries(marking)) {
        if (state.net.places[placeId]) {
          state.net.places[placeId].tokens = tokens;
        }
      }
    });
  },
});
