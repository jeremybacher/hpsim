import type { StateCreator } from 'zustand';
import type { AnalysisState, PlaceStats, TransitionStats } from '@/types/simulation';
import type { Marking } from '@/types/petriNet';
import type { StoreState } from './useStore';

export interface AnalysisSlice extends AnalysisState {
  setPlaceStats: (stats: PlaceStats[]) => void;
  setTransitionStats: (stats: TransitionStats[]) => void;
  addReachabilityMarking: (marking: Marking) => void;
  setTimelineData: (data: AnalysisState['timelineData']) => void;
  clearAnalysis: () => void;
}

export const createAnalysisSlice: StateCreator<StoreState, [['zustand/immer', never]], [], AnalysisSlice> = (set) => ({
  placeStats: [],
  transitionStats: [],
  reachabilityMarkings: [],
  timelineData: [],

  setPlaceStats: (stats) => {
    set((s) => { s.placeStats = stats; });
  },

  setTransitionStats: (stats) => {
    set((s) => { s.transitionStats = stats; });
  },

  addReachabilityMarking: (marking) => {
    set((s) => {
      const key = JSON.stringify(marking);
      const exists = s.reachabilityMarkings.some((m) => JSON.stringify(m) === key);
      if (!exists && s.reachabilityMarkings.length < 1000) {
        s.reachabilityMarkings.push(marking);
      }
    });
  },

  setTimelineData: (data) => {
    set((s) => { s.timelineData = data; });
  },

  clearAnalysis: () => {
    set((s) => {
      s.placeStats = [];
      s.transitionStats = [];
      s.reachabilityMarkings = [];
      s.timelineData = [];
    });
  },
});
