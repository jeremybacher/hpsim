import type { StateCreator } from 'zustand';
import type { Tool, ViewTransform, SelectionBox, ArcDrawingState, EditorState } from '@/types/editor';
import type { Position } from '@/types/petriNet';
import { GRID_SIZE, MIN_ZOOM, MAX_ZOOM } from '@/lib/constants';
import type { StoreState } from './useStore';

export interface EditorSlice extends EditorState {
  setTool: (tool: Tool) => void;
  setSelectedIds: (ids: string[]) => void;
  addToSelection: (id: string) => void;
  removeFromSelection: (id: string) => void;
  toggleSelection: (id: string) => void;
  clearSelection: () => void;
  selectAll: () => void;

  setSelectionBox: (box: SelectionBox | null) => void;
  setArcDrawing: (state: ArcDrawingState | null) => void;

  setViewTransform: (transform: Partial<ViewTransform>) => void;
  zoomToPoint: (delta: number, point: Position) => void;
  resetView: () => void;
  setIsPanning: (isPanning: boolean) => void;

  setSnapToGrid: (snap: boolean) => void;
  setShowGrid: (show: boolean) => void;
  snapPosition: (pos: Position) => Position;
}

export const createEditorSlice: StateCreator<StoreState, [['zustand/immer', never]], [], EditorSlice> = (set, get) => ({
  tool: 'select',
  selectedIds: [],
  selectionBox: null,
  arcDrawing: null,
  viewTransform: { x: 0, y: 0, zoom: 1 },
  snapToGrid: true,
  gridSize: GRID_SIZE,
  showGrid: true,
  isPanning: false,

  setTool: (tool) => {
    set((state) => {
      state.tool = tool;
      state.arcDrawing = null;
      if (tool !== 'select') {
        state.selectedIds = [];
        state.selectionBox = null;
      }
    });
  },

  setSelectedIds: (ids) => {
    set((state) => {
      state.selectedIds = ids;
    });
  },

  addToSelection: (id) => {
    set((state) => {
      if (!state.selectedIds.includes(id)) {
        state.selectedIds.push(id);
      }
    });
  },

  removeFromSelection: (id) => {
    set((state) => {
      state.selectedIds = state.selectedIds.filter((i) => i !== id);
    });
  },

  toggleSelection: (id) => {
    set((state) => {
      const idx = state.selectedIds.indexOf(id);
      if (idx >= 0) {
        state.selectedIds.splice(idx, 1);
      } else {
        state.selectedIds.push(id);
      }
    });
  },

  clearSelection: () => {
    set((state) => {
      state.selectedIds = [];
      state.selectionBox = null;
    });
  },

  selectAll: () => {
    const state = get();
    const allIds = [
      ...Object.keys(state.net.places),
      ...Object.keys(state.net.transitions),
      ...Object.keys(state.net.arcs),
      ...Object.keys(state.net.annotations),
    ];
    set((s) => {
      s.selectedIds = allIds;
    });
  },

  setSelectionBox: (box) => {
    set((state) => {
      state.selectionBox = box;
    });
  },

  setArcDrawing: (arcState) => {
    set((state) => {
      state.arcDrawing = arcState;
    });
  },

  setViewTransform: (transform) => {
    set((state) => {
      Object.assign(state.viewTransform, transform);
    });
  },

  zoomToPoint: (delta, point) => {
    set((state) => {
      const oldZoom = state.viewTransform.zoom;
      const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, oldZoom + delta));
      const scale = newZoom / oldZoom;

      state.viewTransform.x = point.x - (point.x - state.viewTransform.x) * scale;
      state.viewTransform.y = point.y - (point.y - state.viewTransform.y) * scale;
      state.viewTransform.zoom = newZoom;
    });
  },

  resetView: () => {
    set((state) => {
      state.viewTransform = { x: 0, y: 0, zoom: 1 };
    });
  },

  setIsPanning: (isPanning) => {
    set((state) => {
      state.isPanning = isPanning;
    });
  },

  setSnapToGrid: (snap) => {
    set((state) => {
      state.snapToGrid = snap;
    });
  },

  setShowGrid: (show) => {
    set((state) => {
      state.showGrid = show;
    });
  },

  snapPosition: (pos) => {
    const state = get();
    if (!state.snapToGrid) return pos;
    return {
      x: Math.round(pos.x / state.gridSize) * state.gridSize,
      y: Math.round(pos.y / state.gridSize) * state.gridSize,
    };
  },
});
