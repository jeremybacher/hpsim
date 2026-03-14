'use client';

import { ARC_ARROW_SIZE, INHIBITOR_CIRCLE_RADIUS } from '@/lib/constants';

export function SvgDefs() {
  return (
    <defs>
      {/* Normal arc arrow marker */}
      <marker
        id="arrowhead"
        markerWidth={ARC_ARROW_SIZE}
        markerHeight={ARC_ARROW_SIZE}
        refX={ARC_ARROW_SIZE}
        refY={ARC_ARROW_SIZE / 2}
        orient="auto"
        markerUnits="userSpaceOnUse"
      >
        <path
          d={`M 0 0 L ${ARC_ARROW_SIZE} ${ARC_ARROW_SIZE / 2} L 0 ${ARC_ARROW_SIZE} Z`}
          className="fill-foreground"
        />
      </marker>

      {/* Selected arc arrow marker */}
      <marker
        id="arrowhead-selected"
        markerWidth={ARC_ARROW_SIZE}
        markerHeight={ARC_ARROW_SIZE}
        refX={ARC_ARROW_SIZE}
        refY={ARC_ARROW_SIZE / 2}
        orient="auto"
        markerUnits="userSpaceOnUse"
      >
        <path
          d={`M 0 0 L ${ARC_ARROW_SIZE} ${ARC_ARROW_SIZE / 2} L 0 ${ARC_ARROW_SIZE} Z`}
          fill="#3b82f6"
        />
      </marker>

      {/* Read arc (dashed) arrow marker */}
      <marker
        id="arrowhead-read"
        markerWidth={ARC_ARROW_SIZE}
        markerHeight={ARC_ARROW_SIZE}
        refX={ARC_ARROW_SIZE}
        refY={ARC_ARROW_SIZE / 2}
        orient="auto"
        markerUnits="userSpaceOnUse"
      >
        <path
          d={`M 0 0 L ${ARC_ARROW_SIZE} ${ARC_ARROW_SIZE / 2} L 0 ${ARC_ARROW_SIZE} Z`}
          className="fill-foreground"
        />
      </marker>

      {/* Inhibitor arc circle marker */}
      <marker
        id="inhibitor-circle"
        markerWidth={INHIBITOR_CIRCLE_RADIUS * 2}
        markerHeight={INHIBITOR_CIRCLE_RADIUS * 2}
        refX={INHIBITOR_CIRCLE_RADIUS * 2}
        refY={INHIBITOR_CIRCLE_RADIUS}
        orient="auto"
        markerUnits="userSpaceOnUse"
      >
        <circle
          cx={INHIBITOR_CIRCLE_RADIUS}
          cy={INHIBITOR_CIRCLE_RADIUS}
          r={INHIBITOR_CIRCLE_RADIUS - 1}
          className="fill-background stroke-foreground"
          strokeWidth="1.5"
        />
      </marker>

      {/* Inhibitor selected marker */}
      <marker
        id="inhibitor-circle-selected"
        markerWidth={INHIBITOR_CIRCLE_RADIUS * 2}
        markerHeight={INHIBITOR_CIRCLE_RADIUS * 2}
        refX={INHIBITOR_CIRCLE_RADIUS * 2}
        refY={INHIBITOR_CIRCLE_RADIUS}
        orient="auto"
        markerUnits="userSpaceOnUse"
      >
        <circle
          cx={INHIBITOR_CIRCLE_RADIUS}
          cy={INHIBITOR_CIRCLE_RADIUS}
          r={INHIBITOR_CIRCLE_RADIUS - 1}
          fill="white"
          stroke="#3b82f6"
          strokeWidth="1.5"
        />
      </marker>
    </defs>
  );
}
