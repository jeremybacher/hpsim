'use client';

import { memo } from 'react';
import type { Place } from '@/types/petriNet';
import { PLACE_RADIUS, LABEL_OFFSET_Y, LABEL_FONT_SIZE, DEFAULT_PLACE_CAPACITY } from '@/lib/constants';
import { TokenDots } from './TokenDots';

interface PlaceNodeProps {
  place: Place;
  isSelected: boolean;
  isEnabled?: boolean;
  onMouseDown?: (e: React.MouseEvent) => void;
}

export const PlaceNode = memo(function PlaceNode({
  place,
  isSelected,
  onMouseDown,
}: PlaceNodeProps) {
  return (
    <g
      data-id={place.id}
      data-type="place"
      onMouseDown={onMouseDown}
      className="cursor-pointer"
    >
      {/* Selection highlight */}
      {isSelected && (
        <circle
          cx={place.position.x}
          cy={place.position.y}
          r={PLACE_RADIUS + 3}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          strokeDasharray="4 2"
        />
      )}

      {/* Place circle */}
      <circle
        cx={place.position.x}
        cy={place.position.y}
        r={PLACE_RADIUS}
        className="fill-background stroke-foreground"
        strokeWidth="2"
      />

      {/* Token dots */}
      <TokenDots
        tokens={place.tokens}
        cx={place.position.x}
        cy={place.position.y}
      />

      {/* Label */}
      <text
        x={place.position.x}
        y={place.position.y + LABEL_OFFSET_Y}
        textAnchor="middle"
        className="fill-foreground select-none pointer-events-none"
        fontSize={LABEL_FONT_SIZE}
      >
        {place.label}
      </text>

      {/* Capacity label */}
      {place.capacity > DEFAULT_PLACE_CAPACITY && (
        <text
          x={place.position.x}
          y={place.position.y + LABEL_OFFSET_Y + LABEL_FONT_SIZE + 2}
          textAnchor="middle"
          className="fill-muted-foreground select-none pointer-events-none"
          fontSize={LABEL_FONT_SIZE - 1}
        >
          cap: {place.capacity}
        </text>
      )}
    </g>
  );
});
