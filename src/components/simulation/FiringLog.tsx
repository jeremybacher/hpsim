'use client';

import { useRef, useState, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import { ScrollArea } from '@/components/ui/scroll-area';

export function FiringLog() {
  const firingLog = useStore((s) => s.firingLog);
  const mode = useStore((s) => s.mode);
  const [height, setHeight] = useState(128);
  const dragging = useRef(false);
  const startY = useRef(0);
  const startHeight = useRef(0);

  const onDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    startY.current = e.clientY;
    startHeight.current = height;

    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      const delta = startY.current - ev.clientY;
      setHeight(Math.max(64, Math.min(500, startHeight.current + delta)));
    };

    const onUp = () => {
      dragging.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [height]);

  if (mode === 'edit') return null;

  return (
    <div className="border-t bg-card flex flex-col">
      {/* Drag handle */}
      <div
        className="h-1.5 cursor-row-resize hover:bg-primary/20 active:bg-primary/30 transition-colors flex items-center justify-center group"
        onMouseDown={onDragStart}
      >
        <div className="w-8 h-0.5 rounded-full bg-border group-hover:bg-primary/40 transition-colors" />
      </div>

      <div className="flex items-center px-3 py-1 border-b">
        <span className="text-xs font-semibold">Firing Log</span>
        <span className="text-xs text-muted-foreground ml-2">({firingLog.length} firings)</span>
      </div>
      <ScrollArea style={{ height }}>
        <div className="px-3 py-1 space-y-0.5">
          {firingLog.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">No firings yet. Click an enabled transition or press Play.</p>
          ) : (
            [...firingLog].reverse().map((record, i) => (
              <div
                key={firingLog.length - 1 - i}
                className="flex items-center gap-2 text-xs font-mono py-0.5"
              >
                <span className="text-muted-foreground w-12 text-right">#{record.step}</span>
                <span className="font-semibold">{record.transitionLabel}</span>
                <span className="text-muted-foreground">fired</span>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
