'use client';

import { Circle, RectangleVertical, ArrowRight } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export function EmptyState() {
  const { t } = useTranslation();

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
          <h2 className="text-lg font-semibold text-foreground/60">{t('empty.title')}</h2>
          <p className="text-sm mt-1 hidden md:block">{t('empty.desktopHint')}</p>
          <p className="text-sm mt-1 md:hidden">{t('empty.mobileHint')}</p>
          <p className="text-xs mt-3 hidden md:block">
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">P</kbd> {t('tool.place')}{' '}
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">T</kbd> {t('tool.transition')}{' '}
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">A</kbd> {t('tool.arc')}{' '}
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">K</kbd> {t('tool.token')}
          </p>
        </div>
      </div>
    </div>
  );
}
