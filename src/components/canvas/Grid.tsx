'use client';

import { GRID_SIZE } from '@/lib/constants';

interface GridProps {
  width: number;
  height: number;
}

export function Grid({ width, height }: GridProps) {
  const majorInterval = GRID_SIZE * 5;

  return (
    <defs>
      <pattern
        id="grid-minor"
        width={GRID_SIZE}
        height={GRID_SIZE}
        patternUnits="userSpaceOnUse"
      >
        <path
          d={`M ${GRID_SIZE} 0 L 0 0 0 ${GRID_SIZE}`}
          fill="none"
          className="stroke-[var(--grid-stroke)] dark:stroke-[hsl(0,0%,20%)]"
          strokeWidth="0.5"
        />
      </pattern>
      <pattern
        id="grid-major"
        width={majorInterval}
        height={majorInterval}
        patternUnits="userSpaceOnUse"
      >
        <rect width={majorInterval} height={majorInterval} fill="url(#grid-minor)" />
        <path
          d={`M ${majorInterval} 0 L 0 0 0 ${majorInterval}`}
          fill="none"
          className="stroke-[var(--grid-major-stroke)] dark:stroke-[hsl(0,0%,25%)]"
          strokeWidth="1"
        />
      </pattern>
      <rect id="grid-bg" width={width} height={height} fill="url(#grid-major)" />
    </defs>
  );
}
