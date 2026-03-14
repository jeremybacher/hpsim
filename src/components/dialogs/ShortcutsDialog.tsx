'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const shortcuts = [
  {
    group: 'Tools',
    items: [
      { keys: ['V', '1'], description: 'Select tool' },
      { keys: ['P', '2'], description: 'Place tool' },
      { keys: ['T', '3'], description: 'Transition tool' },
      { keys: ['A', '4'], description: 'Arc tool' },
      { keys: ['K', '5'], description: 'Token tool' },
      { keys: ['X', '6'], description: 'Delete tool' },
      { keys: ['N', '7'], description: 'Text annotation tool' },
    ],
  },
  {
    group: 'Edit',
    items: [
      { keys: ['Ctrl+Z'], description: 'Undo' },
      { keys: ['Ctrl+Y', 'Ctrl+Shift+Z'], description: 'Redo' },
      { keys: ['Ctrl+A'], description: 'Select all' },
      { keys: ['Delete', 'Backspace'], description: 'Delete selected' },
      { keys: ['Escape'], description: 'Cancel / Deselect' },
    ],
  },
  {
    group: 'Navigation',
    items: [
      { keys: ['Space + Drag'], description: 'Pan canvas' },
      { keys: ['Middle-click + Drag'], description: 'Pan canvas' },
      { keys: ['Scroll wheel'], description: 'Zoom in/out' },
    ],
  },
  {
    group: 'Selection',
    items: [
      { keys: ['Click'], description: 'Select element' },
      { keys: ['Shift + Click'], description: 'Add to selection' },
      { keys: ['Click + Drag (empty area)'], description: 'Rubber-band selection' },
    ],
  },
  {
    group: 'Tokens',
    items: [
      { keys: ['Click (Token tool)'], description: 'Add token to place' },
      { keys: ['Shift + Click (Token tool)'], description: 'Remove token from place' },
    ],
  },
];

export function ShortcutsDialog({ open, onOpenChange }: ShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4 pr-4">
            {shortcuts.map((section, si) => (
              <div key={si}>
                <h4 className="text-sm font-semibold mb-2">{section.group}</h4>
                <div className="space-y-1.5">
                  {section.items.map((item, ii) => (
                    <div key={ii} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{item.description}</span>
                      <div className="flex gap-1">
                        {item.keys.map((key, ki) => (
                          <span key={ki} className="flex items-center gap-0.5">
                            {ki > 0 && <span className="text-xs text-muted-foreground mx-0.5">/</span>}
                            <Badge variant="outline" className="text-xs font-mono px-1.5 h-5">
                              {key}
                            </Badge>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                {si < shortcuts.length - 1 && <Separator className="mt-3" />}
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
