'use client';

import type { SelectionBox as SelectionBoxType } from '@/types/editor';

interface SelectionBoxProps {
  box: SelectionBoxType;
}

export function SelectionBox({ box }: SelectionBoxProps) {
  const x = Math.min(box.start.x, box.end.x);
  const y = Math.min(box.start.y, box.end.y);
  const width = Math.abs(box.end.x - box.start.x);
  const height = Math.abs(box.end.y - box.start.y);

  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill="rgba(59, 130, 246, 0.1)"
      stroke="#3b82f6"
      strokeWidth={1}
      strokeDasharray="4 2"
    />
  );
}
