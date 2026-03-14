'use client';

import { TOKEN_DOT_RADIUS } from '@/lib/constants';

interface TokenDotsProps {
  tokens: number;
  cx: number;
  cy: number;
}

// Position patterns for 1-6 dots inside a place circle
const dotPositions: Record<number, Array<{ dx: number; dy: number }>> = {
  1: [{ dx: 0, dy: 0 }],
  2: [{ dx: -5, dy: 0 }, { dx: 5, dy: 0 }],
  3: [{ dx: 0, dy: -5 }, { dx: -5, dy: 4 }, { dx: 5, dy: 4 }],
  4: [{ dx: -5, dy: -5 }, { dx: 5, dy: -5 }, { dx: -5, dy: 5 }, { dx: 5, dy: 5 }],
  5: [
    { dx: 0, dy: 0 },
    { dx: -6, dy: -6 }, { dx: 6, dy: -6 },
    { dx: -6, dy: 6 }, { dx: 6, dy: 6 },
  ],
};

export function TokenDots({ tokens, cx, cy }: TokenDotsProps) {
  if (tokens <= 0) return null;

  if (tokens <= 5) {
    const positions = dotPositions[tokens];
    return (
      <g>
        {positions.map((pos, i) => (
          <circle
            key={i}
            cx={cx + pos.dx}
            cy={cy + pos.dy}
            r={TOKEN_DOT_RADIUS}
            className="fill-foreground"
          />
        ))}
      </g>
    );
  }

  // Show numeric count for > 5 tokens
  return (
    <text
      x={cx}
      y={cy}
      textAnchor="middle"
      dominantBaseline="central"
      className="fill-foreground text-[11px] font-bold select-none pointer-events-none"
    >
      {tokens}
    </text>
  );
}
