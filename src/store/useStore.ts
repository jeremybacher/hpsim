import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { createPetriNetSlice, type PetriNetSlice } from './petriNetSlice';
import { createEditorSlice, type EditorSlice } from './editorSlice';
import { createSimulationSlice, type SimulationSlice } from './simulationSlice';
import { createHistorySlice, type HistorySlice } from './historySlice';
import { createAnalysisSlice, type AnalysisSlice } from './analysisSlice';

export type StoreState = PetriNetSlice & EditorSlice & SimulationSlice & HistorySlice & AnalysisSlice;

export const useStore = create<StoreState>()(
  immer((...a) => ({
    ...createPetriNetSlice(...a),
    ...createEditorSlice(...a),
    ...createSimulationSlice(...a),
    ...createHistorySlice(...a),
    ...createAnalysisSlice(...a),
  }))
);
