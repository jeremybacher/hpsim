'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { useTranslation } from '@/lib/i18n';
import type { Tool } from '@/types/editor';
import type { TranslationKey } from '@/lib/i18n';
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
  RectangleHorizontal,
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
  labelKey: TranslationKey;
  icon: React.ComponentType<{ className?: string }>;
  shortcut: string;
  group: number;
}> = [
  { id: 'select', labelKey: 'tool.select', icon: MousePointer2, shortcut: 'V', group: 0 },
  { id: 'place', labelKey: 'tool.place', icon: Circle, shortcut: 'P', group: 0 },
  { id: 'transition', labelKey: 'tool.transition', icon: RectangleHorizontal, shortcut: 'T', group: 0 },
  { id: 'arc', labelKey: 'tool.arc', icon: ArrowRight, shortcut: 'A', group: 0 },
  { id: 'token', labelKey: 'tool.token', icon: Coins, shortcut: 'K', group: 1 },
  { id: 'delete', labelKey: 'tool.delete', icon: Trash2, shortcut: 'X', group: 1 },
  { id: 'annotation', labelKey: 'tool.annotation', icon: Type, shortcut: 'N', group: 2 },
];

interface ToolbarProps {
  onOpenHelp: () => void;
}

export function Toolbar({ onOpenHelp }: ToolbarProps) {
  const { t } = useTranslation();
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
        data-tour="toolbar"
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
          title={expanded ? t('toolbar.collapse') : t('toolbar.expand')}
        >
          {expanded ? (
            <PanelLeftClose className="h-3.5 w-3.5" />
          ) : (
            <PanelLeftOpen className="h-3.5 w-3.5" />
          )}
        </button>

        {tools.map((toolDef) => {
          const Icon = toolDef.icon;
          const isActive = tool === toolDef.id;
          const showSep = toolDef.group !== lastGroup;
          lastGroup = toolDef.group;
          const label = t(toolDef.labelKey);

          if (expanded) {
            return (
              <div key={toolDef.id}>
                {showSep && <Separator className="my-1" />}
                <button
                  type="button"
                  className={toolButtonClass(isActive)}
                  onClick={() => isEditing && setTool(toolDef.id)}
                  disabled={!isEditing}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="text-xs truncate">{label}</span>
                  {toolDef.shortcut && (
                    <span className="ml-auto text-[10px] font-mono opacity-60">
                      {toolDef.shortcut.split(' / ')[0]}
                    </span>
                  )}
                </button>
              </div>
            );
          }

          return (
            <div key={toolDef.id}>
              {showSep && <Separator className="my-1" />}
              <Tooltip>
                <TooltipTrigger
                  className={toolButtonClass(isActive)}
                  onClick={() => isEditing && setTool(toolDef.id)}
                  disabled={!isEditing}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                </TooltipTrigger>
                <TooltipContent side="right">
                  {label}
                  {toolDef.shortcut && (
                    <span className="ml-1.5 opacity-60 font-mono">
                      {toolDef.shortcut}
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
            <span className="text-xs">{t('tool.help')}</span>
          </button>
        ) : (
          <Tooltip>
            <TooltipTrigger
              className="flex items-center justify-center h-9 w-9 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              onClick={onOpenHelp}
            >
              <HelpCircle className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent side="right">{t('tool.help')}</TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
