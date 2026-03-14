import type { Position } from '@/types/petriNet';
import { PLACE_RADIUS, TRANSITION_WIDTH, TRANSITION_HEIGHT } from './constants';

function distance(a: Position, b: Position): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function lerp(a: Position, b: Position, t: number): Position {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

function clipToCircle(center: Position, target: Position, radius: number): Position {
  const d = distance(center, target);
  if (d === 0) return center;
  const t = radius / d;
  return lerp(center, target, t);
}

function clipToRect(
  center: Position,
  target: Position,
  halfWidth: number,
  halfHeight: number
): Position {
  const dx = target.x - center.x;
  const dy = target.y - center.y;

  if (dx === 0 && dy === 0) return center;

  let t = Infinity;

  if (dx !== 0) {
    const tRight = halfWidth / Math.abs(dx);
    t = Math.min(t, tRight);
  }
  if (dy !== 0) {
    const tBottom = halfHeight / Math.abs(dy);
    t = Math.min(t, tBottom);
  }

  return {
    x: center.x + dx * t,
    y: center.y + dy * t,
  };
}

export function clipPlaceBoundary(place: Position, toward: Position): Position {
  return clipToCircle(place, toward, PLACE_RADIUS);
}

export function clipTransitionBoundary(transition: Position, toward: Position): Position {
  return clipToRect(
    transition,
    toward,
    TRANSITION_WIDTH / 2,
    TRANSITION_HEIGHT / 2
  );
}

export function isCircleInRect(
  center: Position,
  radius: number,
  rect: { x: number; y: number; width: number; height: number }
): boolean {
  return (
    center.x + radius >= rect.x &&
    center.x - radius <= rect.x + rect.width &&
    center.y + radius >= rect.y &&
    center.y - radius <= rect.y + rect.height
  );
}

export function isRectInRect(
  inner: { x: number; y: number; width: number; height: number },
  outer: { x: number; y: number; width: number; height: number }
): boolean {
  return (
    inner.x + inner.width >= outer.x &&
    inner.x <= outer.x + outer.width &&
    inner.y + inner.height >= outer.y &&
    inner.y <= outer.y + outer.height
  );
}

export function screenToWorld(
  screenX: number,
  screenY: number,
  transform: { x: number; y: number; zoom: number },
  svgRect: DOMRect
): Position {
  return {
    x: (screenX - svgRect.left - transform.x) / transform.zoom,
    y: (screenY - svgRect.top - transform.y) / transform.zoom,
  };
}
