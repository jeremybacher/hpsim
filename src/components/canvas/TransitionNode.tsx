'use client';

import { memo } from 'react';
import type { Transition } from '@/types/petriNet';
import { TRANSITION_WIDTH, TRANSITION_HEIGHT, LABEL_OFFSET_Y, LABEL_FONT_SIZE } from '@/lib/constants';

interface TransitionNodeProps {
  transition: Transition;
  isSelected: boolean;
  isEnabled?: boolean;
  onMouseDown?: (e: React.MouseEvent) => void;
}

export const TransitionNode = memo(function TransitionNode({
  transition,
  isSelected,
  isEnabled,
  onMouseDown,
}: TransitionNodeProps) {
  return (
    <g
      data-id={transition.id}
      data-type="transition"
      onMouseDown={onMouseDown}
      className="cursor-pointer"
    >
      {/* Selection highlight */}
      {isSelected && (
        <rect
          x={transition.position.x - TRANSITION_WIDTH / 2 - 3}
          y={transition.position.y - TRANSITION_HEIGHT / 2 - 3}
          width={TRANSITION_WIDTH + 6}
          height={TRANSITION_HEIGHT + 6}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          strokeDasharray="4 2"
          rx="2"
        />
      )}

      {/* Transition rectangle */}
      <rect
        x={transition.position.x - TRANSITION_WIDTH / 2}
        y={transition.position.y - TRANSITION_HEIGHT / 2}
        width={TRANSITION_WIDTH}
        height={TRANSITION_HEIGHT}
        className={isEnabled ? 'fill-green-500 stroke-green-600' : 'fill-foreground stroke-foreground'}
        strokeWidth="1.5"
        rx="1"
      />

      {/* Enabled glow */}
      {isEnabled && (
        <rect
          x={transition.position.x - TRANSITION_WIDTH / 2 - 2}
          y={transition.position.y - TRANSITION_HEIGHT / 2 - 2}
          width={TRANSITION_WIDTH + 4}
          height={TRANSITION_HEIGHT + 4}
          fill="none"
          stroke="#22c55e"
          strokeWidth="2"
          opacity="0.6"
          rx="2"
        />
      )}

      {/* Label */}
      <text
        x={transition.position.x}
        y={transition.position.y + LABEL_OFFSET_Y}
        textAnchor="middle"
        className="fill-foreground select-none pointer-events-none"
        fontSize={LABEL_FONT_SIZE}
      >
        {transition.label}
      </text>

      {/* Delay label */}
      {transition.delay > 0 && (
        <text
          x={transition.position.x}
          y={transition.position.y + LABEL_OFFSET_Y + LABEL_FONT_SIZE + 2}
          textAnchor="middle"
          className="fill-muted-foreground select-none pointer-events-none"
          fontSize={LABEL_FONT_SIZE - 1}
        >
          {transition.delay}
        </text>
      )}
    </g>
  );
});
