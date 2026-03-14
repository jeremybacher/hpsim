import type { PetriNet, Marking } from '@/types/petriNet';
import type { FiringRecord, PlaceStats, TransitionStats } from '@/types/simulation';

export function computePlaceStats(
  net: PetriNet,
  markingHistory: Marking[]
): PlaceStats[] {
  const placeIds = Object.keys(net.places);
  return placeIds.map((placeId) => {
    const tokens = markingHistory.map((m) => m[placeId] ?? 0);
    const min = Math.min(...tokens);
    const max = Math.max(...tokens);
    const avg = tokens.reduce((sum, t) => sum + t, 0) / tokens.length;

    return {
      placeId,
      label: net.places[placeId]?.label ?? placeId,
      minTokens: min,
      maxTokens: max,
      avgTokens: Math.round(avg * 100) / 100,
    };
  });
}

export function computeTransitionStats(
  net: PetriNet,
  firingLog: FiringRecord[],
  totalTimeMs: number
): TransitionStats[] {
  const transitionIds = Object.keys(net.transitions);
  return transitionIds.map((transitionId) => {
    const firings = firingLog.filter((r) => r.transitionId === transitionId);
    const totalFirings = firings.length;
    const avgRate = totalTimeMs > 0 ? (totalFirings / totalTimeMs) * 1000 : 0;

    return {
      transitionId,
      label: net.transitions[transitionId]?.label ?? transitionId,
      totalFirings,
      avgRate: Math.round(avgRate * 100) / 100,
    };
  });
}

export function computeTimelineData(
  net: PetriNet,
  markingHistory: Marking[]
): Array<{ step: number; [placeId: string]: number }> {
  const placeIds = Object.keys(net.places);

  return markingHistory.map((marking, step) => {
    const row: { step: number; [key: string]: number } = { step };
    for (const placeId of placeIds) {
      const label = net.places[placeId]?.label ?? placeId;
      row[label] = marking[placeId] ?? 0;
    }
    return row;
  });
}

export function exportStatsToCSV(
  placeStats: PlaceStats[],
  transitionStats: TransitionStats[]
): string {
  let csv = 'Type,ID,Label,Min Tokens,Max Tokens,Avg Tokens,Total Firings,Avg Rate\n';

  for (const ps of placeStats) {
    csv += `Place,${ps.placeId},${ps.label},${ps.minTokens},${ps.maxTokens},${ps.avgTokens},,\n`;
  }

  for (const ts of transitionStats) {
    csv += `Transition,${ts.transitionId},${ts.label},,,,${ts.totalFirings},${ts.avgRate}\n`;
  }

  return csv;
}
