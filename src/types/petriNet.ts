export type ArcType = 'normal' | 'inhibitor' | 'read';

export interface Position {
  x: number;
  y: number;
}

export interface Place {
  id: string;
  type: 'place';
  label: string;
  position: Position;
  tokens: number;
  capacity: number; // 0 = unlimited
}

export interface Transition {
  id: string;
  type: 'transition';
  label: string;
  position: Position;
  delay: number; // ms, 0 = immediate
  priority: number; // higher = higher priority
}

export interface Arc {
  id: string;
  type: 'arc';
  arcType: ArcType;
  sourceId: string;
  targetId: string;
  weight: number;
  bendPoints: Position[];
}

export interface Annotation {
  id: string;
  type: 'annotation';
  annotationType: 'text' | 'rectangle' | 'line';
  position: Position;
  text?: string;
  width?: number;
  height?: number;
  endPosition?: Position;
}

export type PetriNetElement = Place | Transition | Arc | Annotation;
export type NodeElement = Place | Transition;

export interface PetriNet {
  name: string;
  description: string;
  places: Record<string, Place>;
  transitions: Record<string, Transition>;
  arcs: Record<string, Arc>;
  annotations: Record<string, Annotation>;
}

export type Marking = Record<string, number>; // placeId -> token count
