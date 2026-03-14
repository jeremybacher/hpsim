'use client';

import type { Position } from '@/types/petriNet';
import { clipPlaceBoundary, clipTransitionBoundary } from '@/lib/geometry';

interface GhostArcProps {
  sourcePos: Position;
  sourceType: 'place' | 'transition';
  currentPoint: Position;
}

export function GhostArc({ sourcePos, sourceType, currentPoint }: GhostArcProps) {
  const start = sourceType === 'place'
    ? clipPlaceBoundary(sourcePos, currentPoint)
    : clipTransitionBoundary(sourcePos, currentPoint);

  return (
    <line
      x1={start.x}
      y1={start.y}
      x2={currentPoint.x}
      y2={currentPoint.y}
      className="stroke-foreground"
      strokeWidth="1.5"
      strokeDasharray="6 3"
      pointerEvents="none"
      markerEnd="url(#arrowhead)"
    />
  );
}
