'use client';

import { memo, useMemo } from 'react';
import type { Arc, Position } from '@/types/petriNet';
import { buildArcPath, getArcMidpoint } from '@/lib/bezier';
import { clipPlaceBoundary, clipTransitionBoundary } from '@/lib/geometry';
import { LABEL_FONT_SIZE } from '@/lib/constants';

interface ArcPathProps {
  arc: Arc;
  sourcePos: Position;
  targetPos: Position;
  sourceType: 'place' | 'transition';
  isSelected: boolean;
  onMouseDown?: (e: React.MouseEvent) => void;
}

export const ArcPath = memo(function ArcPath({
  arc,
  sourcePos,
  targetPos,
  sourceType,
  isSelected,
  onMouseDown,
}: ArcPathProps) {
  const { clippedStart, clippedEnd, pathD, midpoint } = useMemo(() => {
    // The first bend point (or target) determines exit direction
    const firstTarget = arc.bendPoints.length > 0 ? arc.bendPoints[0] : targetPos;
    const lastSource = arc.bendPoints.length > 0 ? arc.bendPoints[arc.bendPoints.length - 1] : sourcePos;

    const clippedStart = sourceType === 'place'
      ? clipPlaceBoundary(sourcePos, firstTarget)
      : clipTransitionBoundary(sourcePos, firstTarget);

    const targetType = sourceType === 'place' ? 'transition' : 'place';
    const clippedEnd = targetType === 'place'
      ? clipPlaceBoundary(targetPos, lastSource)
      : clipTransitionBoundary(targetPos, lastSource);

    const pathD = buildArcPath(clippedStart, clippedEnd, arc.bendPoints);
    const midpoint = getArcMidpoint(clippedStart, clippedEnd, arc.bendPoints);

    return { clippedStart, clippedEnd, pathD, midpoint };
  }, [arc.bendPoints, sourcePos, targetPos, sourceType]);

  const markerEnd = (() => {
    if (arc.arcType === 'inhibitor') {
      return isSelected ? 'url(#inhibitor-circle-selected)' : 'url(#inhibitor-circle)';
    }
    return isSelected ? 'url(#arrowhead-selected)' : 'url(#arrowhead)';
  })();

  const strokeColor = isSelected ? '#3b82f6' : undefined;
  const strokeDasharray = arc.arcType === 'read' ? '6 3' : undefined;

  return (
    <g
      data-id={arc.id}
      data-type="arc"
      onMouseDown={onMouseDown}
    >
      {/* Invisible fat path for easy clicking */}
      <path
        d={pathD}
        fill="none"
        stroke="transparent"
        strokeWidth="12"
        className="cursor-pointer"
      />

      {/* Visible path */}
      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        className={!isSelected ? 'stroke-foreground' : ''}
        strokeWidth={isSelected ? 2.5 : 1.5}
        strokeDasharray={strokeDasharray}
        markerEnd={markerEnd}
      />

      {/* Weight label */}
      <g>
        <rect
          x={midpoint.x - 8}
          y={midpoint.y - 8}
          width={16}
          height={16}
          rx={3}
          className="fill-background"
        />
        <text
          x={midpoint.x}
          y={midpoint.y}
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-foreground select-none pointer-events-none"
          fontSize={LABEL_FONT_SIZE - 1}
          fontWeight="bold"
        >
          {arc.weight}
        </text>
      </g>

      {/* Bend point handles */}
      {arc.bendPoints.map((bp, i) => (
        <circle
          key={i}
          cx={bp.x}
          cy={bp.y}
          r={4}
          className={`cursor-move ${isSelected ? 'fill-blue-500 stroke-blue-600' : 'fill-muted-foreground/50 stroke-muted-foreground'}`}
          strokeWidth="1"
          data-bend-index={i}
          data-arc-id={arc.id}
        />
      ))}
    </g>
  );
});
