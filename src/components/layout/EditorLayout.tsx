'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Canvas } from '@/components/canvas/Canvas';
import { Toolbar } from '@/components/toolbar/Toolbar';
import { PropertiesPanel } from '@/components/properties/PropertiesPanel';
import { AppMenubar } from '@/components/menubar/AppMenubar';
import { SimulationControls } from '@/components/simulation/SimulationControls';
import { FiringLog } from '@/components/simulation/FiringLog';
import { EmptyState } from './EmptyState';
import { SampleNetsDialog } from '@/components/dialogs/SampleNetsDialog';
import { ExportDialog } from '@/components/dialogs/ExportDialog';
import { ShortcutsDialog } from '@/components/dialogs/ShortcutsDialog';
import { HelpDialog } from '@/components/dialogs/HelpDialog';
import { AnalysisPanel } from '@/components/analysis/AnalysisPanel';
import { Toaster } from '@/components/ui/sonner';

export function EditorLayout() {
  const [samplesOpen, setSamplesOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const net = useStore((s) => s.net);
  const isEmpty = Object.keys(net.places).length === 0
    && Object.keys(net.transitions).length === 0
    && Object.keys(net.annotations).length === 0;

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Top menubar */}
      <AppMenubar
        onOpenSamples={() => setSamplesOpen(true)}
        onOpenExport={() => setExportOpen(true)}
        onOpenAnalysis={() => setAnalysisOpen(true)}
        onOpenShortcuts={() => setShortcutsOpen(true)}
        onOpenHelp={() => setHelpOpen(true)}
      />

      {/* Main content */}
      <div className="flex-1 flex min-h-0">
        {/* Left toolbar */}
        <Toolbar onOpenHelp={() => setHelpOpen(true)} />

        {/* Center canvas */}
        <div className="flex-1 relative min-w-0">
          <Canvas />
          {isEmpty && <EmptyState />}
        </div>

        {/* Right properties panel */}
        <PropertiesPanel />
      </div>

      {/* Firing log (shown during simulation) */}
      <FiringLog />

      {/* Bottom simulation controls */}
      <SimulationControls />

      {/* Dialogs */}
      <SampleNetsDialog open={samplesOpen} onOpenChange={setSamplesOpen} />
      <ExportDialog open={exportOpen} onOpenChange={setExportOpen} />
      <AnalysisPanel open={analysisOpen} onOpenChange={setAnalysisOpen} />
      <ShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
      <HelpDialog open={helpOpen} onOpenChange={setHelpOpen} />

      {/* Toast notifications */}
      <Toaster position="bottom-right" />
    </div>
  );
}
