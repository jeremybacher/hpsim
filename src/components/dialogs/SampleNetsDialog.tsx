'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
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
  name: string;
  description: string;
  filename: string;
  tags: string[];
}

const sampleNets: SampleNet[] = [
  {
    name: 'Simple Sequence',
    description: 'A basic sequential flow: P1 -> T1 -> P2 -> T2 -> P3',
    filename: 'simple-sequence.hps',
    tags: ['basic'],
  },
  {
    name: 'Producer-Consumer',
    description: 'Producer fills a bounded buffer, consumer empties it',
    filename: 'producer-consumer.hps',
    tags: ['classic', 'bounded'],
  },
  {
    name: 'Mutual Exclusion',
    description: 'Two processes competing for a shared mutex resource',
    filename: 'mutual-exclusion.hps',
    tags: ['classic', 'sync'],
  },
  {
    name: 'Dining Philosophers (3)',
    description: 'Three philosophers sharing forks around a table',
    filename: 'dining-philosophers.hps',
    tags: ['classic', 'deadlock'],
  },
  {
    name: 'Reader-Writer',
    description: 'Multiple concurrent readers, exclusive writer access',
    filename: 'reader-writer.hps',
    tags: ['classic', 'sync'],
  },
];

interface SampleNetsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SampleNetsDialog({ open, onOpenChange }: SampleNetsDialogProps) {
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
      toast.success(`Loaded sample: ${net.name}`);
    } catch (err) {
      toast.error('Failed to load sample: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Sample Petri Nets</DialogTitle>
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
                  <span className="font-medium text-sm">{sample.name}</span>
                  <div className="flex gap-1 ml-auto">
                    {sample.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-[10px] h-4 px-1.5">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground font-normal">{sample.description}</span>
              </Button>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
