import type { Marking } from './petriNet';

export type SimulationMode = 'edit' | 'token-game' | 'fast-simulation';

export interface FiringRecord {
  step: number;
  transitionId: string;
  transitionLabel: string;
  timestamp: number;
  markingBefore: Marking;
  markingAfter: Marking;
}

export interface TokenAnimation {
  id: string;
  arcId: string;
  progress: number; // 0 to 1
  startTime: number;
}

export interface SimulationState {
  mode: SimulationMode;
  isRunning: boolean;
  speed: number; // firings per second
  currentStep: number;
  maxSteps: number;
  maxTime: number; // ms, 0 = unlimited
  firingLog: FiringRecord[];
  markingHistory: Marking[];
  initialMarking: Marking | null;
  tokenAnimations: TokenAnimation[];
  enabledTransitionIds: string[];
  deadlocked: boolean;
  startTime: number | null;
}

export interface PlaceStats {
  placeId: string;
  label: string;
  minTokens: number;
  maxTokens: number;
  avgTokens: number;
}

export interface TransitionStats {
  transitionId: string;
  label: string;
  totalFirings: number;
  avgRate: number; // firings per second
}

export interface AnalysisState {
  placeStats: PlaceStats[];
  transitionStats: TransitionStats[];
  reachabilityMarkings: Marking[];
  timelineData: Array<{
    step: number;
    [placeId: string]: number;
  }>;
}
