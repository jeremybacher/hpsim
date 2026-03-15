'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTranslation } from '@/lib/i18n';

interface HelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HelpDialog({ open, onOpenChange }: HelpDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl w-[90vw]">
        <DialogHeader>
          <DialogTitle>{t('help.title')}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-4 pr-4 text-sm">
            <section>
              <h4 className="font-semibold mb-1">{t('help.whatIsPetriNet')}</h4>
              <p className="text-muted-foreground" dangerouslySetInnerHTML={{ __html: t('help.whatIsPetriNetDesc') }} />
            </section>

            <Separator />

            <section>
              <h4 className="font-semibold mb-1">{t('help.buildingNet')}</h4>
              <ul className="text-muted-foreground space-y-1.5 list-disc pl-4">
                <li dangerouslySetInnerHTML={{ __html: t('help.buildingNet.place') }} />
                <li dangerouslySetInnerHTML={{ __html: t('help.buildingNet.transition') }} />
                <li dangerouslySetInnerHTML={{ __html: t('help.buildingNet.arc') }} />
                <li dangerouslySetInnerHTML={{ __html: t('help.buildingNet.token') }} />
                <li dangerouslySetInnerHTML={{ __html: t('help.buildingNet.text') }} />
              </ul>
            </section>

            <Separator />

            <section>
              <h4 className="font-semibold mb-1">{t('help.editing')}</h4>
              <ul className="text-muted-foreground space-y-1.5 list-disc pl-4">
                <li dangerouslySetInnerHTML={{ __html: t('help.editing.select') }} />
                <li>{t('help.editing.rubberBand')}</li>
                <li>{t('help.editing.props')}</li>
                <li dangerouslySetInnerHTML={{ __html: t('help.editing.pan') }} />
              </ul>
            </section>

            <Separator />

            <section>
              <h4 className="font-semibold mb-1">{t('help.simulation')}</h4>
              <p className="text-muted-foreground mb-1.5" dangerouslySetInnerHTML={{ __html: t('help.simulationDesc') }} />
              <ul className="text-muted-foreground space-y-1.5 list-disc pl-4">
                <li dangerouslySetInnerHTML={{ __html: t('help.sim.tokenGame') }} />
                <li dangerouslySetInnerHTML={{ __html: t('help.sim.fast') }} />
                <li dangerouslySetInnerHTML={{ __html: t('help.sim.analysis') }} />
                <li dangerouslySetInnerHTML={{ __html: t('help.sim.deadlock') }} />
              </ul>
            </section>

            <Separator />

            <section>
              <h4 className="font-semibold mb-1">{t('help.fileFormat')}</h4>
              <p className="text-muted-foreground" dangerouslySetInnerHTML={{ __html: t('help.fileFormatDesc') }} />
            </section>

            <Separator />

            <section>
              <h4 className="font-semibold mb-1">{t('help.arcTypes')}</h4>
              <ul className="text-muted-foreground space-y-1.5 list-disc pl-4">
                <li dangerouslySetInnerHTML={{ __html: t('help.arcType.normal') }} />
                <li dangerouslySetInnerHTML={{ __html: t('help.arcType.inhibitor') }} />
                <li dangerouslySetInnerHTML={{ __html: t('help.arcType.read') }} />
              </ul>
            </section>

            <Separator />

            <p className="text-xs text-muted-foreground pt-1">
              {t('app.version')}
            </p>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
