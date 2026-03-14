'use client';

import { useEffect } from 'react';
import { useStore } from '@/store/useStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { computePlaceStats, computeTransitionStats, computeTimelineData, exportStatsToCSV } from '@/engine/analysis';
import { downloadFile } from '@/lib/serialization';

interface AnalysisPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AnalysisPanel({ open, onOpenChange }: AnalysisPanelProps) {
  const net = useStore((s) => s.net);
  const firingLog = useStore((s) => s.firingLog);
  const markingHistory = useStore((s) => s.markingHistory);
  const startTime = useStore((s) => s.startTime);
  const reachabilityMarkings = useStore((s) => s.reachabilityMarkings);

  const placeStats = useStore((s) => s.placeStats);
  const transitionStats = useStore((s) => s.transitionStats);
  const setPlaceStats = useStore((s) => s.setPlaceStats);
  const setTransitionStats = useStore((s) => s.setTransitionStats);

  useEffect(() => {
    if (!open) return;

    const totalTimeMs = startTime ? Date.now() - startTime : 0;
    setPlaceStats(computePlaceStats(net, markingHistory));
    setTransitionStats(computeTransitionStats(net, firingLog, totalTimeMs));
  }, [open, net, firingLog, markingHistory, startTime, setPlaceStats, setTransitionStats]);

  const handleExportCSV = () => {
    const csv = exportStatsToCSV(placeStats, transitionStats);
    downloadFile(csv, 'petri-net-stats.csv', 'text/csv');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Performance Analysis</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="places">
          <TabsList>
            <TabsTrigger value="places">Places</TabsTrigger>
            <TabsTrigger value="transitions">Transitions</TabsTrigger>
            <TabsTrigger value="reachability">Reachability</TabsTrigger>
          </TabsList>

          <TabsContent value="places">
            <ScrollArea className="h-64">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Place</th>
                    <th className="text-right p-2">Min</th>
                    <th className="text-right p-2">Max</th>
                    <th className="text-right p-2">Avg</th>
                  </tr>
                </thead>
                <tbody>
                  {placeStats.map((ps) => (
                    <tr key={ps.placeId} className="border-b">
                      <td className="p-2">{ps.label}</td>
                      <td className="text-right p-2">{ps.minTokens}</td>
                      <td className="text-right p-2">{ps.maxTokens}</td>
                      <td className="text-right p-2">{ps.avgTokens}</td>
                    </tr>
                  ))}
                  {placeStats.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-muted-foreground">
                        No data. Run simulation first.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="transitions">
            <ScrollArea className="h-64">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Transition</th>
                    <th className="text-right p-2">Firings</th>
                    <th className="text-right p-2">Avg Rate (/s)</th>
                  </tr>
                </thead>
                <tbody>
                  {transitionStats.map((ts) => (
                    <tr key={ts.transitionId} className="border-b">
                      <td className="p-2">{ts.label}</td>
                      <td className="text-right p-2">{ts.totalFirings}</td>
                      <td className="text-right p-2">{ts.avgRate}</td>
                    </tr>
                  ))}
                  {transitionStats.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-4 text-center text-muted-foreground">
                        No data. Run simulation first.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="reachability">
            <ScrollArea className="h-64">
              <div className="space-y-1 p-2">
                <p className="text-sm text-muted-foreground mb-2">
                  Distinct markings visited: {reachabilityMarkings.length}
                </p>
                {reachabilityMarkings.slice(0, 100).map((marking, i) => (
                  <div key={i} className="text-xs font-mono bg-muted p-1.5 rounded">
                    {Object.entries(marking)
                      .map(([placeId, tokens]) => {
                        const label = net.places[placeId]?.label ?? placeId;
                        return `${label}:${tokens}`;
                      })
                      .join(', ')}
                  </div>
                ))}
                {reachabilityMarkings.length > 100 && (
                  <p className="text-xs text-muted-foreground">
                    ...and {reachabilityMarkings.length - 100} more
                  </p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            Export CSV
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
