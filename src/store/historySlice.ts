import type { StateCreator } from 'zustand';
import type { PetriNet } from '@/types/petriNet';
import { MAX_HISTORY_SIZE } from '@/lib/constants';
import type { StoreState } from './useStore';

export interface HistorySlice {
  undoStack: PetriNet[];
  redoStack: PetriNet[];
  pushSnapshot: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearHistory: () => void;
}

export const createHistorySlice: StateCreator<StoreState, [['zustand/immer', never]], [], HistorySlice> = (set, get) => ({
  undoStack: [],
  redoStack: [],

  pushSnapshot: () => {
    const state = get();
    const snapshot = JSON.parse(JSON.stringify(state.net)) as PetriNet;
    set((s) => {
      s.undoStack.push(snapshot);
      if (s.undoStack.length > MAX_HISTORY_SIZE) {
        s.undoStack.shift();
      }
      s.redoStack = [];
    });
  },

  undo: () => {
    const state = get();
    if (state.undoStack.length === 0) return;
    const currentSnapshot = JSON.parse(JSON.stringify(state.net)) as PetriNet;
    set((s) => {
      const prev = s.undoStack.pop();
      if (prev) {
        s.redoStack.push(currentSnapshot);
        s.net = prev;
      }
    });
  },

  redo: () => {
    const state = get();
    if (state.redoStack.length === 0) return;
    const currentSnapshot = JSON.parse(JSON.stringify(state.net)) as PetriNet;
    set((s) => {
      const next = s.redoStack.pop();
      if (next) {
        s.undoStack.push(currentSnapshot);
        s.net = next;
      }
    });
  },

  canUndo: () => get().undoStack.length > 0,
  canRedo: () => get().redoStack.length > 0,

  clearHistory: () => {
    set((s) => {
      s.undoStack = [];
      s.redoStack = [];
    });
  },
});
