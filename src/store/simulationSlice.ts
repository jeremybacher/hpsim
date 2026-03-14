import type { StateCreator } from 'zustand';
import type { SimulationMode, SimulationState, FiringRecord, TokenAnimation } from '@/types/simulation';
import type { Marking } from '@/types/petriNet';
import { DEFAULT_SPEED, DEFAULT_MAX_STEPS } from '@/lib/constants';
import type { StoreState } from './useStore';

export interface SimulationSlice extends SimulationState {
  fireTransitionHandler: ((transitionId: string) => void) | null;
  setMode: (mode: SimulationMode) => void;
  startSimulation: () => void;
  stopSimulation: () => void;
  pauseSimulation: () => void;
  resetSimulation: () => void;
  setSpeed: (speed: number) => void;
  setMaxSteps: (steps: number) => void;
  setMaxTime: (time: number) => void;
  addFiringRecord: (record: FiringRecord) => void;
  pushMarking: (marking: Marking) => void;
  setEnabledTransitions: (ids: string[]) => void;
  setDeadlocked: (deadlocked: boolean) => void;
  setTokenAnimations: (animations: TokenAnimation[]) => void;
  stepBack: () => void;
  incrementStep: () => void;
}

export const createSimulationSlice: StateCreator<StoreState, [['zustand/immer', never]], [], SimulationSlice> = (set, get) => ({
  fireTransitionHandler: null,
  mode: 'edit',
  isRunning: false,
  speed: DEFAULT_SPEED,
  currentStep: 0,
  maxSteps: DEFAULT_MAX_STEPS,
  maxTime: 0,
  firingLog: [],
  markingHistory: [],
  initialMarking: null,
  tokenAnimations: [],
  enabledTransitionIds: [],
  deadlocked: false,
  startTime: null,

  setMode: (mode) => {
    const state = get();
    set((s) => {
      s.mode = mode;
      if (mode !== 'edit' && !s.initialMarking) {
        s.initialMarking = state.getMarking();
        s.markingHistory = [state.getMarking()];
      }
      if (mode === 'edit') {
        s.isRunning = false;
        s.currentStep = 0;
        s.firingLog = [];
        s.markingHistory = [];
        s.tokenAnimations = [];
        s.enabledTransitionIds = [];
        s.deadlocked = false;
        s.startTime = null;
        // Restore initial marking
        if (s.initialMarking) {
          for (const [placeId, tokens] of Object.entries(s.initialMarking)) {
            if (s.net.places[placeId]) {
              s.net.places[placeId].tokens = tokens;
            }
          }
          s.initialMarking = null;
        }
      }
    });
  },

  startSimulation: () => {
    set((s) => {
      s.isRunning = true;
      if (!s.startTime) s.startTime = Date.now();
    });
  },

  stopSimulation: () => {
    set((s) => {
      s.isRunning = false;
    });
  },

  pauseSimulation: () => {
    set((s) => {
      s.isRunning = false;
    });
  },

  resetSimulation: () => {
    set((s) => {
      s.isRunning = false;
      s.currentStep = 0;
      s.firingLog = [];
      s.tokenAnimations = [];
      s.enabledTransitionIds = [];
      s.deadlocked = false;
      s.startTime = null;
      if (s.initialMarking) {
        for (const [placeId, tokens] of Object.entries(s.initialMarking)) {
          if (s.net.places[placeId]) {
            s.net.places[placeId].tokens = tokens;
          }
        }
        s.markingHistory = [{ ...s.initialMarking }];
      }
    });
  },

  setSpeed: (speed) => {
    set((s) => { s.speed = speed; });
  },

  setMaxSteps: (steps) => {
    set((s) => { s.maxSteps = steps; });
  },

  setMaxTime: (time) => {
    set((s) => { s.maxTime = time; });
  },

  addFiringRecord: (record) => {
    set((s) => {
      s.firingLog.push(record);
    });
  },

  pushMarking: (marking) => {
    set((s) => {
      s.markingHistory.push(marking);
    });
  },

  setEnabledTransitions: (ids) => {
    set((s) => {
      s.enabledTransitionIds = ids;
    });
  },

  setDeadlocked: (deadlocked) => {
    set((s) => {
      s.deadlocked = deadlocked;
    });
  },

  setTokenAnimations: (animations) => {
    set((s) => {
      s.tokenAnimations = animations;
    });
  },

  stepBack: () => {
    const state = get();
    if (state.markingHistory.length <= 1) return;
    set((s) => {
      s.markingHistory.pop();
      s.firingLog.pop();
      const prevMarking = s.markingHistory[s.markingHistory.length - 1];
      if (prevMarking) {
        for (const [placeId, tokens] of Object.entries(prevMarking)) {
          if (s.net.places[placeId]) {
            s.net.places[placeId].tokens = tokens;
          }
        }
      }
      s.currentStep = Math.max(0, s.currentStep - 1);
    });
  },

  incrementStep: () => {
    set((s) => { s.currentStep++; });
  },
});
