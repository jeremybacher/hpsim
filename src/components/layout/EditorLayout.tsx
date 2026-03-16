'use client';

import { useRef, useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { useTheme } from 'next-themes';
import { useTranslation } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n';
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
import { GuidedTour } from '@/components/tour/GuidedTour';
import { useLocalStoragePersistence } from '@/hooks/useLocalStoragePersistence';
import { Toaster } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { FolderOpen, Play, Square, HelpCircle, Compass, Sun, Moon, Github, Star } from 'lucide-react';
import {
  deserializeAuto,
  readFileAsArrayBuffer,
} from '@/lib/serialization';
import { toast } from 'sonner';

const TOUR_SEEN_KEY = 'hpsim-tour-seen';

export function EditorLayout() {
  const { t, locale, setLocale } = useTranslation();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [samplesOpen, setSamplesOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const mobileFileRef = useRef<HTMLInputElement>(null);

  const net = useStore((s) => s.net);
  const mode = useStore((s) => s.mode);
  const setNet = useStore((s) => s.setNet);
  const setMode = useStore((s) => s.setMode);
  const pushSnapshot = useStore((s) => s.pushSnapshot);
  const clearHistory = useStore((s) => s.clearHistory);

  useLocalStoragePersistence();

  const isEmpty = Object.keys(net.places).length === 0
    && Object.keys(net.transitions).length === 0
    && Object.keys(net.annotations).length === 0;

  const [starCount, setStarCount] = useState(0);

  useEffect(() => setMounted(true), []);

  // Fetch GitHub star count
  useEffect(() => {
    fetch('https://api.github.com/repos/jeremybacher/hpsim')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.stargazers_count != null) setStarCount(data.stargazers_count); })
      .catch(() => {});
  }, []);

  // Auto-show tour on first visit (desktop only)
  useEffect(() => {
    if (window.innerWidth < 768) return;
    const seen = localStorage.getItem(TOUR_SEEN_KEY);
    if (!seen) {
      const timer = setTimeout(() => setTourOpen(true), 600);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleCloseTour = () => {
    setTourOpen(false);
    localStorage.setItem(TOUR_SEEN_KEY, '1');
  };

  const handleMobileOpen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'hps') {
      toast.error(t('toast.unsupportedFile', { ext: ext || '' }));
      if (mobileFileRef.current) mobileFileRef.current.value = '';
      return;
    }
    try {
      const buffer = await readFileAsArrayBuffer(file);
      const loadedNet = deserializeAuto(buffer);
      pushSnapshot();
      setNet(loadedNet);
      clearHistory();
      toast.success(t('toast.loaded', { name: loadedNet.name }));
    } catch (err) {
      toast.error(t('toast.loadFailed') + ': ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
    if (mobileFileRef.current) mobileFileRef.current.value = '';
  };

  return (
    <div className="h-dvh flex flex-col overflow-hidden">
      {/* Desktop menubar */}
      <div className="hidden md:flex items-center border-b bg-card" data-tour="menubar">
        <div className="flex-1">
          <AppMenubar
            onOpenSamples={() => setSamplesOpen(true)}
            onOpenExport={() => setExportOpen(true)}
            onOpenAnalysis={() => setAnalysisOpen(true)}
            onOpenShortcuts={() => setShortcutsOpen(true)}
            onOpenHelp={() => setHelpOpen(true)}
            onOpenTour={() => setTourOpen(true)}
          />
        </div>

        {/* Right side: Tour + Theme + Language */}
        <div className="flex items-center gap-1.5 px-2">
          <button
            type="button"
            className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            onClick={() => setTourOpen(true)}
            title="Tour"
          >
            <Compass className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          >
            {mounted && resolvedTheme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          <div className="flex items-center h-7 rounded-md border bg-muted/50 p-0.5">
            <button
              type="button"
              className={`px-2 h-6 rounded-sm text-xs font-medium transition-colors ${
                locale === 'en' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setLocale('en' as Locale)}
            >
              EN
            </button>
            <button
              type="button"
              className={`px-2 h-6 rounded-sm text-xs font-medium transition-colors ${
                locale === 'es' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setLocale('es' as Locale)}
            >
              ES
            </button>
          </div>

          <a
            href="https://github.com/jeremybacher/hpsim"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 h-7 px-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            title="GitHub"
          >
            <Github className="w-3.5 h-3.5" />
            <span className="flex items-center gap-0.5 text-xs font-medium">
              <Star className="w-3 h-3" />
              {starCount}
            </span>
          </a>
        </div>
      </div>

      {/* Mobile header */}
      <div className="flex md:hidden items-center gap-2 px-3 py-2 border-b bg-card">
        <img src="/logo.svg" alt="HPSim" className="w-5 h-5 dark:invert" />
        <span className="text-sm font-semibold truncate flex-1">HPSim</span>
        <input
          ref={mobileFileRef}
          type="file"
          accept=".hps,application/octet-stream"
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
          {t('mobile.open')}
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
            {t('mobile.simulate')}
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => setMode('edit')}
          >
            <Square className="w-4 h-4" />
            {t('mobile.stop')}
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
        <div className="flex-1 relative min-w-0" data-tour="canvas">
          <Canvas />
          {isEmpty && <EmptyState />}
        </div>

        {/* Right properties panel (desktop only) */}
        <PropertiesPanel />
      </div>

      {/* Firing log (shown during simulation) */}
      <FiringLog />

      {/* Bottom simulation controls */}
      <div data-tour="simulation">
        <SimulationControls />
      </div>

      {/* Mobile footer */}
      <div className="flex md:hidden items-center justify-between px-3 py-1.5 border-t bg-card">
        <div className="flex items-center h-7 rounded-md border bg-muted/50 p-0.5">
          <button
            type="button"
            className={`px-1.5 h-6 rounded-sm text-[10px] font-medium transition-colors ${
              locale === 'en' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
            }`}
            onClick={() => setLocale('en' as Locale)}
          >
            EN
          </button>
          <button
            type="button"
            className={`px-1.5 h-6 rounded-sm text-[10px] font-medium transition-colors ${
              locale === 'es' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
            }`}
            onClick={() => setLocale('es' as Locale)}
          >
            ES
          </button>
        </div>

        <button
          type="button"
          className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
        >
          {mounted && resolvedTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <a
          href="https://github.com/jeremybacher/hpsim"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 h-8 px-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <Github className="w-4 h-4" />
          <span className="flex items-center gap-0.5 text-xs font-medium">
            <Star className="w-3 h-3" />
            {starCount}
          </span>
        </a>
      </div>

      {/* Dialogs */}
      <SampleNetsDialog open={samplesOpen} onOpenChange={setSamplesOpen} />
      <ExportDialog open={exportOpen} onOpenChange={setExportOpen} />
      <AnalysisPanel open={analysisOpen} onOpenChange={setAnalysisOpen} />
      <ShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
      <HelpDialog open={helpOpen} onOpenChange={setHelpOpen} />

      {/* Guided Tour */}
      <GuidedTour open={tourOpen} onClose={handleCloseTour} />

      {/* Toast notifications */}
      <Toaster position="bottom-right" />
    </div>
  );
}
