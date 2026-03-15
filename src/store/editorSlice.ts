import type { StateCreator } from 'zustand';
import type { Tool, ViewTransform, SelectionBox, ArcDrawingState, EditorState, ClipboardData } from '@/types/editor';
import type { Position } from '@/types/petriNet';
import { nanoid } from 'nanoid';
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

  copyElements: () => void;
  cutElements: () => void;
  pasteElements: () => void;
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
  clipboard: null,

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

  copyElements: () => {
    const state = get();
    const ids = new Set(state.selectedIds);
    if (ids.size === 0) return;

    const places = Object.values(state.net.places).filter((p) => ids.has(p.id));
    const transitions = Object.values(state.net.transitions).filter((t) => ids.has(t.id));
    const annotations = Object.values(state.net.annotations).filter((a) => ids.has(a.id));

    // Copy arcs that have both endpoints in the selection
    const nodeIds = new Set([...places.map((p) => p.id), ...transitions.map((t) => t.id)]);
    const arcs = Object.values(state.net.arcs).filter(
      (a) => nodeIds.has(a.sourceId) && nodeIds.has(a.targetId),
    );

    // Compute anchor (center of bounding box)
    const allPositions = [
      ...places.map((p) => p.position),
      ...transitions.map((t) => t.position),
      ...annotations.map((a) => a.position),
    ];
    if (allPositions.length === 0) return;

    const anchorX = allPositions.reduce((s, p) => s + p.x, 0) / allPositions.length;
    const anchorY = allPositions.reduce((s, p) => s + p.y, 0) / allPositions.length;

    // Deep clone via structuredClone
    const clipboard: ClipboardData = structuredClone({
      places,
      transitions,
      arcs,
      annotations,
      anchorX,
      anchorY,
    });

    set((s) => {
      s.clipboard = clipboard;
    });
  },

  cutElements: () => {
    const state = get();
    if (state.selectedIds.length === 0) return;
    // Copy first, then delete
    state.copyElements();
    state.pushSnapshot();
    const ids = [...state.selectedIds];
    state.removeElements(ids);
    set((s) => {
      s.selectedIds = [];
    });
  },

  pasteElements: () => {
    const state = get();
    const clipboard = state.clipboard;
    if (!clipboard) return;

    state.pushSnapshot();

    const PASTE_OFFSET = 40;
    const idMap = new Map<string, string>();

    // Generate new IDs
    for (const p of clipboard.places) idMap.set(p.id, nanoid());
    for (const t of clipboard.transitions) idMap.set(t.id, nanoid());
    for (const a of clipboard.arcs) idMap.set(a.id, nanoid());
    for (const a of clipboard.annotations) idMap.set(a.id, nanoid());

    const newIds: string[] = [];

    set((s) => {
      for (const p of clipboard.places) {
        const newId = idMap.get(p.id)!;
        newIds.push(newId);
        s.net.places[newId] = {
          ...structuredClone(p),
          id: newId,
          position: {
            x: p.position.x + PASTE_OFFSET,
            y: p.position.y + PASTE_OFFSET,
          },
        };
      }
      for (const t of clipboard.transitions) {
        const newId = idMap.get(t.id)!;
        newIds.push(newId);
        s.net.transitions[newId] = {
          ...structuredClone(t),
          id: newId,
          position: {
            x: t.position.x + PASTE_OFFSET,
            y: t.position.y + PASTE_OFFSET,
          },
        };
      }
      for (const a of clipboard.arcs) {
        const newId = idMap.get(a.id)!;
        newIds.push(newId);
        s.net.arcs[newId] = {
          ...structuredClone(a),
          id: newId,
          sourceId: idMap.get(a.sourceId) ?? a.sourceId,
          targetId: idMap.get(a.targetId) ?? a.targetId,
        };
      }
      for (const a of clipboard.annotations) {
        const newId = idMap.get(a.id)!;
        newIds.push(newId);
        s.net.annotations[newId] = {
          ...structuredClone(a),
          id: newId,
          position: {
            x: a.position.x + PASTE_OFFSET,
            y: a.position.y + PASTE_OFFSET,
          },
        };
      }
      s.selectedIds = newIds;
    });

    // Update clipboard positions so successive pastes offset further
    set((s) => {
      if (s.clipboard) {
        for (const p of s.clipboard.places) {
          p.position.x += PASTE_OFFSET;
          p.position.y += PASTE_OFFSET;
        }
        for (const t of s.clipboard.transitions) {
          t.position.x += PASTE_OFFSET;
          t.position.y += PASTE_OFFSET;
        }
        for (const a of s.clipboard.arcs) {
          for (const bp of a.bendPoints) {
            bp.x += PASTE_OFFSET;
            bp.y += PASTE_OFFSET;
          }
        }
        for (const a of s.clipboard.annotations) {
          a.position.x += PASTE_OFFSET;
          a.position.y += PASTE_OFFSET;
        }
      }
    });
  },
});
