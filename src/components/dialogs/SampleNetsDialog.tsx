'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { useTranslation } from '@/lib/i18n';
import type { TranslationKey } from '@/lib/i18n';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { deserializeAuto } from '@/lib/serialization';
import { toast } from 'sonner';

interface SampleNet {
  nameKey: TranslationKey;
  descKey: TranslationKey;
  filename: string;
  tags: string[];
}

const sampleNets: SampleNet[] = [
  {
    nameKey: 'samples.simpleSequence',
    descKey: 'samples.simpleSequenceDesc',
    filename: 'simple-sequence.hps',
    tags: ['basic'],
  },
  {
    nameKey: 'samples.producerConsumer',
    descKey: 'samples.producerConsumerDesc',
    filename: 'producer-consumer.hps',
    tags: ['classic', 'bounded'],
  },
  {
    nameKey: 'samples.mutualExclusion',
    descKey: 'samples.mutualExclusionDesc',
    filename: 'mutual-exclusion.hps',
    tags: ['classic', 'sync'],
  },
  {
    nameKey: 'samples.diningPhilosophers',
    descKey: 'samples.diningPhilosophersDesc',
    filename: 'dining-philosophers.hps',
    tags: ['classic', 'deadlock'],
  },
  {
    nameKey: 'samples.readerWriter',
    descKey: 'samples.readerWriterDesc',
    filename: 'reader-writer.hps',
    tags: ['classic', 'sync'],
  },
];

interface SampleNetsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SampleNetsDialog({ open, onOpenChange }: SampleNetsDialogProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const setNet = useStore((s) => s.setNet);
  const pushSnapshot = useStore((s) => s.pushSnapshot);
  const clearHistory = useStore((s) => s.clearHistory);

  const loadSample = async (filename: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/samples/${filename}`);
      if (!response.ok) throw new Error('Failed to fetch sample');
      const buffer = await response.arrayBuffer();
      const net = deserializeAuto(buffer);
      pushSnapshot();
      setNet(net);
      clearHistory();
      onOpenChange(false);
      toast.success(t('toast.sampleLoaded', { name: net.name }));
    } catch (err) {
      toast.error(t('toast.sampleFailed') + ': ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('samples.title')}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-2 pr-4">
            {sampleNets.map((sample) => (
              <Button
                key={sample.filename}
                variant="outline"
                className="w-full h-auto justify-start text-left p-3 flex-col items-start gap-1"
                onClick={() => loadSample(sample.filename)}
                disabled={loading}
              >
                <div className="flex items-center gap-2 w-full">
                  <span className="font-medium text-sm">{t(sample.nameKey)}</span>
                  <div className="flex gap-1 ml-auto">
                    {sample.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-[10px] h-4 px-1.5">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground font-normal">{t(sample.descKey)}</span>
              </Button>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
