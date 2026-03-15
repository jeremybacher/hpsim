import type { Position, Place, Transition, Arc, Annotation } from './petriNet';

export interface ClipboardData {
  places: Place[];
  transitions: Transition[];
  arcs: Arc[];
  annotations: Annotation[];
  anchorX: number;
  anchorY: number;
}

export type Tool =
  | 'select'
  | 'place'
  | 'transition'
  | 'arc'
  | 'token'
  | 'delete'
  | 'annotation';

export interface ViewTransform {
  x: number; // pan offset x
  y: number; // pan offset y
  zoom: number;
}

export interface SelectionBox {
  start: Position;
  end: Position;
}

export interface ArcDrawingState {
  sourceId: string;
  sourceType: 'place' | 'transition';
  currentPoint: Position;
}

export interface EditorState {
  tool: Tool;
  selectedIds: string[];
  selectionBox: SelectionBox | null;
  arcDrawing: ArcDrawingState | null;
  viewTransform: ViewTransform;
  snapToGrid: boolean;
  gridSize: number;
  showGrid: boolean;
  isPanning: boolean;
  clipboard: ClipboardData | null;
}
