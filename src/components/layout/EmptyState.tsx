'use client';

import { Circle, RectangleVertical, ArrowRight } from 'lucide-react';

export function EmptyState() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-4">
      <div className="text-center space-y-4 text-muted-foreground max-w-sm">
        <div className="flex items-center justify-center gap-3">
          <Circle className="w-8 h-8" />
          <ArrowRight className="w-6 h-6" />
          <RectangleVertical className="w-8 h-8" />
          <ArrowRight className="w-6 h-6" />
          <Circle className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground/60">Start building your Petri Net</h2>
          <p className="text-sm mt-1 hidden md:block">Use the tools on the left, or load a sample from File menu</p>
          <p className="text-sm mt-1 md:hidden">Tap Open to load an .hps file</p>
          <p className="text-xs mt-3 hidden md:block">
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">P</kbd> Place{' '}
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">T</kbd> Transition{' '}
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">A</kbd> Arc{' '}
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">K</kbd> Token
          </p>
        </div>
      </div>
    </div>
  );
}
