'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { useTranslation } from '@/lib/i18n';
import { screenToWorld } from '@/lib/geometry';
import { PLACE_RADIUS, TRANSITION_WIDTH, TRANSITION_HEIGHT } from '@/lib/constants';
import type { Place, Transition, Arc } from '@/types/petriNet';

interface TooltipState {
  x: number;
  y: number;
  element: { type: 'place'; data: Place }
    | { type: 'transition'; data: Transition; enabled: boolean }
    | { type: 'arc'; data: Arc };
}

export function useCanvasTooltip(svgRef: React.RefObject<SVGSVGElement | null>) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const lastMousePosRef = useRef({ x: 0, y: 0 });

  const clearTooltip = useCallback(() => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    setTooltip(null);
  }, []);

  const handleMouseMoveForTooltip = useCallback((e: React.MouseEvent) => {
    const clientX = e.clientX;
    const clientY = e.clientY;

    // If mouse moved significantly, clear existing tooltip
    const dx = clientX - lastMousePosRef.current.x;
    const dy = clientY - lastMousePosRef.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      setTooltip(null);
    }

    lastMousePosRef.current = { x: clientX, y: clientY };

    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);

    hoverTimerRef.current = setTimeout(() => {
      const svg = svgRef.current;
      if (!svg) return;

      const state = useStore.getState();
      const { net, viewTransform, enabledTransitionIds } = state;
      const rect = svg.getBoundingClientRect();
      const worldPos = screenToWorld(clientX, clientY, viewTransform, rect);

      // Check places
      for (const place of Object.values(net.places)) {
        const pdx = worldPos.x - place.position.x;
        const pdy = worldPos.y - place.position.y;
        if (pdx * pdx + pdy * pdy <= PLACE_RADIUS * PLACE_RADIUS) {
          setTooltip({ x: clientX, y: clientY, element: { type: 'place', data: place } });
          return;
        }
      }

      // Check transitions
      for (const tr of Object.values(net.transitions)) {
        if (
          Math.abs(worldPos.x - tr.position.x) <= TRANSITION_WIDTH / 2 &&
          Math.abs(worldPos.y - tr.position.y) <= TRANSITION_HEIGHT / 2
        ) {
          setTooltip({
            x: clientX,
            y: clientY,
            element: {
              type: 'transition',
              data: tr,
              enabled: enabledTransitionIds.includes(tr.id),
            },
          });
          return;
        }
      }

      setTooltip(null);
    }, 500);
  }, [svgRef]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    };
  }, []);

  return { tooltip, handleMouseMoveForTooltip, clearTooltip };
}

export function CanvasTooltipOverlay({ tooltip }: { tooltip: TooltipState | null }) {
  const { t } = useTranslation();
  const mode = useStore((s) => s.mode);

  if (!tooltip) return null;

  const { element } = tooltip;

  // Position tooltip with offset, keep on screen
  const tooltipStyle: React.CSSProperties = {
    position: 'fixed',
    left: Math.min(tooltip.x + 12, window.innerWidth - 260),
    top: Math.max(tooltip.y - 10, 8),
    zIndex: 9999,
    pointerEvents: 'none',
  };

  return (
    <div style={tooltipStyle}>
      <div className="bg-foreground text-background rounded-lg px-3 py-2 text-xs max-w-[240px] shadow-lg">
        {element.type === 'place' && (
          <>
            <div className="font-semibold flex items-center gap-1.5 mb-1">
              <svg width="12" height="12" viewBox="0 0 12 12">
                <circle cx="6" cy="6" r="5" fill="none" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              {t('tooltip.place')}: {element.data.label}
            </div>
            <p className="opacity-80 mb-1.5">{t('tooltip.place.desc')}</p>
            <div className="flex gap-3 opacity-70">
              <span>{t('tooltip.place.tokens')}: <b>{element.data.tokens}</b></span>
              <span>{t('tooltip.place.capacity')}: <b>{element.data.capacity > 0 ? element.data.capacity : t('tooltip.place.capacityUnlimited')}</b></span>
            </div>
          </>
        )}
        {element.type === 'transition' && (
          <>
            <div className="font-semibold flex items-center gap-1.5 mb-1">
              <svg width="12" height="8" viewBox="0 0 12 8">
                <rect x="0.5" y="0.5" width="11" height="7" fill="currentColor" rx="1" />
              </svg>
              {t('tooltip.transition')}: {element.data.label}
            </div>
            <p className="opacity-80 mb-1.5">{t('tooltip.transition.desc')}</p>
            {mode !== 'edit' && (
              <p className={`mb-1 ${element.enabled ? 'text-green-400 font-medium' : 'opacity-70'}`}>
                {element.enabled ? t('tooltip.transition.enabled') : t('tooltip.transition.disabled')}
              </p>
            )}
            <div className="flex gap-3 opacity-70">
              {element.data.delay > 0 && <span>{t('tooltip.transition.delay')}: <b>{element.data.delay}ms</b></span>}
              {element.data.priority > 0 && <span>{t('tooltip.transition.priority')}: <b>{element.data.priority}</b></span>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
