'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import type { Tool } from '@/types/editor';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  MousePointer2,
  Circle,
  RectangleVertical,
  ArrowRight,
  Coins,
  Trash2,
  Type,
  HelpCircle,
  PanelLeftOpen,
  PanelLeftClose,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const tools: Array<{
  id: Tool;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut: string;
  group: number;
}> = [
  { id: 'select', label: 'Select', icon: MousePointer2, shortcut: 'V / 1', group: 0 },
  { id: 'place', label: 'Place', icon: Circle, shortcut: 'P / 2', group: 0 },
  { id: 'transition', label: 'Transition', icon: RectangleVertical, shortcut: 'T / 3', group: 0 },
  { id: 'arc', label: 'Arc', icon: ArrowRight, shortcut: 'A / 4', group: 0 },
  { id: 'token', label: 'Token', icon: Coins, shortcut: 'K / 5', group: 1 },
  { id: 'delete', label: 'Delete', icon: Trash2, shortcut: 'X / 6', group: 1 },
  { id: 'annotation', label: 'Text', icon: Type, shortcut: 'N / 7', group: 2 },
];

interface ToolbarProps {
  onOpenHelp: () => void;
}

export function Toolbar({ onOpenHelp }: ToolbarProps) {
  const tool = useStore((s) => s.tool);
  const setTool = useStore((s) => s.setTool);
  const mode = useStore((s) => s.mode);
  const [expanded, setExpanded] = useState(false);

  const isEditing = mode === 'edit';
  let lastGroup = 0;

  const toolButtonClass = (isActive: boolean) =>
    cn(
      'flex items-center rounded-md transition-colors cursor-pointer',
      expanded ? 'h-9 gap-2 px-2.5 w-full' : 'h-9 w-9 justify-center',
      isActive
        ? 'bg-primary text-primary-foreground'
        : 'hover:bg-accent hover:text-accent-foreground',
      !isEditing && 'opacity-50 pointer-events-none'
    );

  return (
    <TooltipProvider>
      <div
        className={cn(
          'hidden md:flex flex-col items-stretch gap-1 p-2 border-r bg-card transition-all duration-200',
          expanded ? 'w-40' : 'w-[52px]'
        )}
      >
        {/* Expand/collapse toggle */}
        <button
          type="button"
          className="h-7 w-7 self-end mb-1 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          onClick={() => setExpanded(!expanded)}
          title={expanded ? 'Collapse toolbar' : 'Expand toolbar'}
        >
          {expanded ? (
            <PanelLeftClose className="h-3.5 w-3.5" />
          ) : (
            <PanelLeftOpen className="h-3.5 w-3.5" />
          )}
        </button>

        {tools.map((t) => {
          const Icon = t.icon;
          const isActive = tool === t.id;
          const showSep = t.group !== lastGroup;
          lastGroup = t.group;

          if (expanded) {
            return (
              <div key={t.id}>
                {showSep && <Separator className="my-1" />}
                <button
                  type="button"
                  className={toolButtonClass(isActive)}
                  onClick={() => isEditing && setTool(t.id)}
                  disabled={!isEditing}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="text-xs truncate">{t.label}</span>
                  {t.shortcut && (
                    <span className="ml-auto text-[10px] font-mono opacity-60">
                      {t.shortcut.split(' / ')[0]}
                    </span>
                  )}
                </button>
              </div>
            );
          }

          return (
            <div key={t.id}>
              {showSep && <Separator className="my-1" />}
              <Tooltip>
                <TooltipTrigger
                  className={toolButtonClass(isActive)}
                  onClick={() => isEditing && setTool(t.id)}
                  disabled={!isEditing}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                </TooltipTrigger>
                <TooltipContent side="right">
                  {t.label}
                  {t.shortcut && (
                    <span className="ml-1.5 opacity-60 font-mono">
                      {t.shortcut}
                    </span>
                  )}
                </TooltipContent>
              </Tooltip>
            </div>
          );
        })}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Help button */}
        <Separator className="my-1" />
        {expanded ? (
          <button
            type="button"
            className="flex items-center h-9 gap-2 px-2.5 w-full rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            onClick={onOpenHelp}
          >
            <HelpCircle className="h-4 w-4 shrink-0" />
            <span className="text-xs">Help</span>
          </button>
        ) : (
          <Tooltip>
            <TooltipTrigger
              className="flex items-center justify-center h-9 w-9 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              onClick={onOpenHelp}
            >
              <HelpCircle className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent side="right">Help</TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
