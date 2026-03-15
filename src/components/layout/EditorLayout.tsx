'use client';

import { useRef, useState } from 'react';
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
import { Button } from '@/components/ui/button';
import { FolderOpen, Play, Square, HelpCircle } from 'lucide-react';
import {
  deserializeAuto,
  readFileAsArrayBuffer,
} from '@/lib/serialization';
import { toast } from 'sonner';

export function EditorLayout() {
  const [samplesOpen, setSamplesOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const mobileFileRef = useRef<HTMLInputElement>(null);

  const net = useStore((s) => s.net);
  const mode = useStore((s) => s.mode);
  const setNet = useStore((s) => s.setNet);
  const setMode = useStore((s) => s.setMode);
  const pushSnapshot = useStore((s) => s.pushSnapshot);
  const clearHistory = useStore((s) => s.clearHistory);

  const isEmpty = Object.keys(net.places).length === 0
    && Object.keys(net.transitions).length === 0
    && Object.keys(net.annotations).length === 0;

  const handleMobileOpen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const buffer = await readFileAsArrayBuffer(file);
      const loadedNet = deserializeAuto(buffer);
      pushSnapshot();
      setNet(loadedNet);
      clearHistory();
      toast.success(`Loaded "${loadedNet.name}"`);
    } catch (err) {
      toast.error('Failed to load: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
    if (mobileFileRef.current) mobileFileRef.current.value = '';
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Desktop menubar */}
      <div className="hidden md:block">
        <AppMenubar
          onOpenSamples={() => setSamplesOpen(true)}
          onOpenExport={() => setExportOpen(true)}
          onOpenAnalysis={() => setAnalysisOpen(true)}
          onOpenShortcuts={() => setShortcutsOpen(true)}
          onOpenHelp={() => setHelpOpen(true)}
        />
      </div>

      {/* Mobile header */}
      <div className="flex md:hidden items-center gap-2 px-3 py-2 border-b bg-card">
        <span className="text-sm font-semibold truncate flex-1">
          {net.name || 'HPSim'}
        </span>
        <input
          ref={mobileFileRef}
          type="file"
          accept=".hps,.json,application/json,application/octet-stream,*/*"
          className="hidden"
          onChange={handleMobileOpen}
        />
        <Button
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={() => mobileFileRef.current?.click()}
        >
          <FolderOpen className="w-4 h-4" />
          Open
        </Button>
        {mode === 'edit' ? (
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => setMode('token-game')}
            disabled={isEmpty}
          >
            <Play className="w-4 h-4" />
            Simulate
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => setMode('edit')}
          >
            <Square className="w-4 h-4" />
            Stop
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setHelpOpen(true)}
        >
          <HelpCircle className="w-4 h-4" />
        </Button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex min-h-0">
        {/* Left toolbar (desktop only) */}
        <Toolbar onOpenHelp={() => setHelpOpen(true)} />

        {/* Center canvas */}
        <div className="flex-1 relative min-w-0">
          <Canvas />
          {isEmpty && <EmptyState />}
        </div>

        {/* Right properties panel (desktop only) */}
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
