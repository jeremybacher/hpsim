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
import { useTranslation } from '@/lib/i18n';
import type { TranslationKey } from '@/lib/i18n';

interface ShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const shortcuts: Array<{
  groupKey: TranslationKey;
  items: Array<{ keys: string[]; descKey: TranslationKey }>;
}> = [
  {
    groupKey: 'shortcuts.tools',
    items: [
      { keys: ['V', '1'], descKey: 'shortcuts.selectTool' },
      { keys: ['P', '2'], descKey: 'shortcuts.placeTool' },
      { keys: ['T', '3'], descKey: 'shortcuts.transitionTool' },
      { keys: ['A', '4'], descKey: 'shortcuts.arcTool' },
      { keys: ['K', '5'], descKey: 'shortcuts.tokenTool' },
      { keys: ['X', '6'], descKey: 'shortcuts.deleteTool' },
      { keys: ['N', '7'], descKey: 'shortcuts.annotationTool' },
    ],
  },
  {
    groupKey: 'shortcuts.edit',
    items: [
      { keys: ['Ctrl+Z'], descKey: 'shortcuts.undo' },
      { keys: ['Ctrl+Y', 'Ctrl+Shift+Z'], descKey: 'shortcuts.redo' },
      { keys: ['Ctrl+A'], descKey: 'shortcuts.selectAll' },
      { keys: ['Delete', 'Backspace'], descKey: 'shortcuts.deleteSelected' },
      { keys: ['Escape'], descKey: 'shortcuts.cancelDeselect' },
    ],
  },
  {
    groupKey: 'shortcuts.navigation',
    items: [
      { keys: ['Space + Drag'], descKey: 'shortcuts.panCanvas' },
      { keys: ['Middle-click + Drag'], descKey: 'shortcuts.panCanvas' },
      { keys: ['Scroll wheel'], descKey: 'shortcuts.zoom' },
    ],
  },
  {
    groupKey: 'shortcuts.selection',
    items: [
      { keys: ['Click'], descKey: 'shortcuts.selectElement' },
      { keys: ['Shift + Click'], descKey: 'shortcuts.addToSelection' },
      { keys: ['Click + Drag (empty area)'], descKey: 'shortcuts.rubberBand' },
    ],
  },
  {
    groupKey: 'shortcuts.tokens',
    items: [
      { keys: ['Click (Token tool)'], descKey: 'shortcuts.addToken' },
      { keys: ['Shift + Click (Token tool)'], descKey: 'shortcuts.removeToken' },
    ],
  },
];

export function ShortcutsDialog({ open, onOpenChange }: ShortcutsDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('shortcuts.title')}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4 pr-4">
            {shortcuts.map((section, si) => (
              <div key={si}>
                <h4 className="text-sm font-semibold mb-2">{t(section.groupKey)}</h4>
                <div className="space-y-1.5">
                  {section.items.map((item, ii) => (
                    <div key={ii} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{t(item.descKey)}</span>
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
