'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';
import { X, ChevronRight, ChevronLeft, Circle, RectangleHorizontal, ArrowRight } from 'lucide-react';
import type { TranslationKey } from '@/lib/i18n';

interface TourStep {
  titleKey: TranslationKey;
  descKey: TranslationKey;
  target?: string;
  position?: 'center' | 'right' | 'bottom' | 'left' | 'top-right';
  icon?: React.ReactNode;
}

const tourSteps: TourStep[] = [
  {
    titleKey: 'tour.welcome.title',
    descKey: 'tour.welcome.desc',
    position: 'center',
  },
  {
    titleKey: 'tour.menu.title',
    descKey: 'tour.menu.desc',
    target: '[data-tour="menubar"]',
    position: 'bottom',
  },
  {
    titleKey: 'tour.toolbar.title',
    descKey: 'tour.toolbar.desc',
    target: '[data-tour="toolbar"]',
    position: 'right',
  },
  {
    titleKey: 'tour.canvas.title',
    descKey: 'tour.canvas.desc',
    target: '[data-tour="canvas"]',
    position: 'center',
  },
  {
    titleKey: 'tour.place.title',
    descKey: 'tour.place.desc',
    position: 'center',
    icon: <Circle className="w-6 h-6" />,
  },
  {
    titleKey: 'tour.transition.title',
    descKey: 'tour.transition.desc',
    position: 'center',
    icon: <RectangleHorizontal className="w-6 h-6" />,
  },
  {
    titleKey: 'tour.arc.title',
    descKey: 'tour.arc.desc',
    position: 'center',
    icon: <ArrowRight className="w-6 h-6" />,
  },
  {
    titleKey: 'tour.properties.title',
    descKey: 'tour.properties.desc',
    target: '[data-tour="properties"]',
    position: 'left',
  },
  {
    titleKey: 'tour.simulation.title',
    descKey: 'tour.simulation.desc',
    target: '[data-tour="simulation"]',
    position: 'top-right',
  },
  {
    titleKey: 'tour.done.title',
    descKey: 'tour.done.desc',
    position: 'center',
  },
];

interface GuidedTourProps {
  open: boolean;
  onClose: () => void;
}

export function GuidedTour({ open, onClose }: GuidedTourProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const currentStep = tourSteps[step];
  const isFirst = step === 0;
  const isLast = step === tourSteps.length - 1;

  // Compute spotlight position
  useEffect(() => {
    if (!open) return;
    if (!currentStep.target) {
      setSpotlightRect(null);
      return;
    }
    const el = document.querySelector(currentStep.target);
    if (el) {
      setSpotlightRect(el.getBoundingClientRect());
    } else {
      setSpotlightRect(null);
    }
  }, [open, step, currentStep.target]);

  // Recompute on resize
  useEffect(() => {
    if (!open) return;
    const handleResize = () => {
      if (!currentStep.target) return;
      const el = document.querySelector(currentStep.target);
      if (el) setSpotlightRect(el.getBoundingClientRect());
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [open, currentStep.target]);

  const handleNext = useCallback(() => {
    if (isLast) {
      onClose();
      setStep(0);
    } else {
      setStep((s) => s + 1);
    }
  }, [isLast, onClose]);

  const handlePrev = useCallback(() => {
    setStep((s) => Math.max(0, s - 1));
  }, []);

  const handleSkip = useCallback(() => {
    onClose();
    setStep(0);
  }, [onClose]);

  // Keyboard nav
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleSkip();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, handleSkip, handleNext, handlePrev]);

  if (!open) return null;

  // Card positioning
  const getCardStyle = (): React.CSSProperties => {
    if (!spotlightRect || currentStep.position === 'center') {
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const padding = 16;
    const cardWidth = 340;

    switch (currentStep.position) {
      case 'right':
        return {
          position: 'fixed',
          top: spotlightRect.top + spotlightRect.height / 2,
          left: spotlightRect.right + padding,
          transform: 'translateY(-50%)',
          maxWidth: cardWidth,
        };
      case 'left':
        return {
          position: 'fixed',
          top: spotlightRect.top + spotlightRect.height / 2,
          left: spotlightRect.left - padding - cardWidth,
          transform: 'translateY(-50%)',
          maxWidth: cardWidth,
        };
      case 'bottom':
        return {
          position: 'fixed',
          top: spotlightRect.bottom + padding,
          left: spotlightRect.left + spotlightRect.width / 2,
          transform: 'translateX(-50%)',
          maxWidth: cardWidth,
        };
      case 'top-right':
        return {
          position: 'fixed',
          bottom: window.innerHeight - spotlightRect.top + padding,
          left: spotlightRect.left,
          maxWidth: cardWidth,
        };
      default:
        return {
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          maxWidth: cardWidth,
        };
    }
  };

  const spotlightPadding = 8;

  return (
    <div className="fixed inset-0 z-[10000]">
      {/* Dark overlay with spotlight cutout */}
      <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
        <defs>
          <mask id="tour-spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            {spotlightRect && (
              <rect
                x={spotlightRect.left - spotlightPadding}
                y={spotlightRect.top - spotlightPadding}
                width={spotlightRect.width + spotlightPadding * 2}
                height={spotlightRect.height + spotlightPadding * 2}
                rx={8}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.55)"
          mask="url(#tour-spotlight-mask)"
        />
        {spotlightRect && (
          <rect
            x={spotlightRect.left - spotlightPadding}
            y={spotlightRect.top - spotlightPadding}
            width={spotlightRect.width + spotlightPadding * 2}
            height={spotlightRect.height + spotlightPadding * 2}
            rx={8}
            fill="none"
            stroke="rgba(59,130,246,0.6)"
            strokeWidth={2}
          />
        )}
      </svg>

      {/* Click blocker */}
      <div className="absolute inset-0" onClick={(e) => e.stopPropagation()} />

      {/* Tour card */}
      <div ref={cardRef} style={getCardStyle()} className="z-[10001] relative">
        <div className="bg-card border rounded-xl shadow-2xl p-4 min-w-[280px] max-w-[340px]">
          {/* Close button */}
          <button
            type="button"
            className="absolute top-2 right-2 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            onClick={handleSkip}
          >
            <X className="w-4 h-4" />
          </button>

          {/* Icon */}
          {currentStep.icon && (
            <div className="flex justify-center mb-3 text-primary">
              {currentStep.icon}
            </div>
          )}

          {/* Title */}
          <h3 className="font-semibold text-sm mb-1 pr-6">{t(currentStep.titleKey)}</h3>

          {/* Description */}
          <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
            {t(currentStep.descKey)}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
              {step + 1} {t('tour.stepOf')} {tourSteps.length}
            </span>
            <div className="flex items-center gap-1.5">
              {!isFirst && !isLast && (
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleSkip}>
                  {t('tour.skip')}
                </Button>
              )}
              {!isFirst && (
                <Button variant="outline" size="sm" className="h-7 text-xs gap-0.5" onClick={handlePrev}>
                  <ChevronLeft className="w-3 h-3" />
                  {t('tour.prev')}
                </Button>
              )}
              <Button size="sm" className="h-7 text-xs gap-0.5" onClick={handleNext}>
                {isLast ? t('tour.finish') : t('tour.next')}
                {!isLast && <ChevronRight className="w-3 h-3" />}
              </Button>
            </div>
          </div>

          {/* Step dots */}
          <div className="flex justify-center gap-1 mt-3">
            {tourSteps.map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === step ? 'bg-primary' : 'bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
