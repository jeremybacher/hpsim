import type { Position } from '@/types/petriNet';

/**
 * Build an SVG path 'd' string for an arc.
 * If there are no bend points, returns a straight line.
 * If there are bend points, uses quadratic bezier curves through them.
 */
export function buildArcPath(
  start: Position,
  end: Position,
  bendPoints: Position[]
): string {
  if (bendPoints.length === 0) {
    return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
  }

  let d = `M ${start.x} ${start.y}`;

  if (bendPoints.length === 1) {
    const bp = bendPoints[0];
    d += ` Q ${bp.x} ${bp.y} ${end.x} ${end.y}`;
    return d;
  }

  const points = [start, ...bendPoints, end];

  for (let i = 1; i < points.length - 1; i++) {
    const curr = points[i];
    const next = points[i + 1];

    if (i === points.length - 2) {
      d += ` Q ${curr.x} ${curr.y} ${next.x} ${next.y}`;
    } else {
      const mid = { x: (curr.x + next.x) / 2, y: (curr.y + next.y) / 2 };
      d += ` Q ${curr.x} ${curr.y} ${mid.x} ${mid.y}`;
    }
  }

  return d;
}

/** Get the midpoint of an arc path (for weight label placement) */
export function getArcMidpoint(
  start: Position,
  end: Position,
  bendPoints: Position[]
): Position {
  if (bendPoints.length === 0) {
    return {
      x: start.x + (end.x - start.x) * 0.5,
      y: start.y + (end.y - start.y) * 0.5,
    };
  }

  if (bendPoints.length === 1) {
    // Midpoint of quadratic bezier at t=0.5
    const t = 0.5;
    const mt = 0.5;
    return {
      x: mt * mt * start.x + 2 * mt * t * bendPoints[0].x + t * t * end.x,
      y: mt * mt * start.y + 2 * mt * t * bendPoints[0].y + t * t * end.y,
    };
  }

  // For multiple bend points, sample linearly at midpoint
  const allPoints = [start, ...bendPoints, end];
  const totalSegments = allPoints.length - 1;
  const segIndex = Math.min(Math.floor(0.5 * totalSegments), totalSegments - 1);
  const segT = (0.5 * totalSegments) - segIndex;

  return {
    x: allPoints[segIndex].x + (allPoints[segIndex + 1].x - allPoints[segIndex].x) * segT,
    y: allPoints[segIndex].y + (allPoints[segIndex + 1].y - allPoints[segIndex].y) * segT,
  };
}
