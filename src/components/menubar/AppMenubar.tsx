'use client';

import { useRef } from 'react';
import { useStore } from '@/store/useStore';
import { useTheme } from 'next-themes';
import { useTranslation } from '@/lib/i18n';
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
  MenubarCheckboxItem,
} from '@/components/ui/menubar';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import {
  deserializeAuto,
  readFileAsArrayBuffer,
  serializeBinaryHps,
  downloadBinaryFile,
} from '@/lib/serialization';
import { toast } from 'sonner';

interface AppMenubarProps {
  onOpenSamples: () => void;
  onOpenExport: () => void;
  onOpenAnalysis: () => void;
  onOpenShortcuts: () => void;
  onOpenHelp: () => void;
  onOpenTour: () => void;
}

export function AppMenubar({ onOpenSamples, onOpenExport, onOpenAnalysis, onOpenShortcuts, onOpenHelp, onOpenTour }: AppMenubarProps) {
  const { locale, t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { theme, setTheme } = useTheme();

  const net = useStore((s) => s.net);
  const showGrid = useStore((s) => s.showGrid);
  const snapToGrid = useStore((s) => s.snapToGrid);
  const mode = useStore((s) => s.mode);
  const setNet = useStore((s) => s.setNet);
  const setShowGrid = useStore((s) => s.setShowGrid);
  const setSnapToGrid = useStore((s) => s.setSnapToGrid);
  const resetView = useStore((s) => s.resetView);
  const pushSnapshot = useStore((s) => s.pushSnapshot);
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const selectAll = useStore((s) => s.selectAll);
  const removeElements = useStore((s) => s.removeElements);
  const selectedIds = useStore((s) => s.selectedIds);
  const clearSelection = useStore((s) => s.clearSelection);
  const copyElements = useStore((s) => s.copyElements);
  const cutElements = useStore((s) => s.cutElements);
  const pasteElements = useStore((s) => s.pasteElements);
  const clipboard = useStore((s) => s.clipboard);
  const setMode = useStore((s) => s.setMode);
  const clearHistory = useStore((s) => s.clearHistory);

  const isEmpty = Object.keys(net.places).length === 0
    && Object.keys(net.transitions).length === 0
    && Object.keys(net.annotations).length === 0;

  const handleSaveBinaryHps = () => {
    try {
      const buffer = serializeBinaryHps(net);
      const filename = (net.name || 'untitled').replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.hps';
      // Use setTimeout to escape menu dismiss, preserving the download trigger
      setTimeout(() => {
        downloadBinaryFile(buffer, filename);
        toast.success(t('toast.exported', { filename }));
      }, 0);
    } catch (err) {
      toast.error(t('toast.exportFailed') + ': ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleOpen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'hps') {
      toast.error(t('toast.unsupportedFile', { ext: ext || '' }));
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    try {
      const buffer = await readFileAsArrayBuffer(file);
      const loadedNet = deserializeAuto(buffer);
      pushSnapshot();
      setNet(loadedNet);
      clearHistory();
      toast.success(t('toast.loadedFrom', { name: loadedNet.name, file: file.name }));
    } catch (err) {
      toast.error(t('toast.loadFailed') + ': ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = () => {
    if (selectedIds.length > 0 && mode === 'edit') {
      pushSnapshot();
      removeElements(selectedIds);
      clearSelection();
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".hps,application/octet-stream"
        className="hidden"
        onChange={handleOpen}
      />

      <Menubar className="border-none rounded-none px-2 h-9 shadow-none">
        <div className="flex items-center gap-1.5 mr-2 pr-2 border-r">
          <img src="/logo.svg" alt="HPSim" className="w-4 h-4 dark:invert" />
          <span className="text-sm font-semibold">HPSim</span>
        </div>
        <MenubarMenu>
          <MenubarTrigger className="text-sm py-1">{t('menu.file')}</MenubarTrigger>
          <MenubarContent className={locale === 'es' ? 'w-42' : undefined}>
            <MenubarItem onClick={() => fileInputRef.current?.click()}>
              {t('menu.file.open')} <MenubarShortcut>Ctrl+O</MenubarShortcut>
            </MenubarItem>

            {isEmpty ? (
              <Tooltip>
                <TooltipTrigger className="w-full whitespace-nowrap">
                  <MenubarItem disabled>{t('menu.file.saveHps')}</MenubarItem>
                </TooltipTrigger>
                <TooltipContent side="right">{t('menu.file.emptyCanvas')}</TooltipContent>
              </Tooltip>
            ) : (
              <MenubarItem onClick={handleSaveBinaryHps}>{t('menu.file.saveHps')}</MenubarItem>
            )}

            <MenubarSeparator />
            {isEmpty ? (
              <Tooltip>
                <TooltipTrigger className="w-full whitespace-nowrap">
                  <MenubarItem disabled>{t('menu.file.exportImage')}</MenubarItem>
                </TooltipTrigger>
                <TooltipContent side="right">{t('menu.file.emptyCanvas')}</TooltipContent>
              </Tooltip>
            ) : (
              <MenubarItem onClick={onOpenExport}>{t('menu.file.exportImage')}</MenubarItem>
            )}
            <MenubarSeparator />
            <MenubarItem onClick={onOpenSamples}>{t('menu.file.sampleNets')}</MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger className="text-sm py-1">{t('menu.edit')}</MenubarTrigger>
          <MenubarContent className={locale === 'es' ? 'w-46' : undefined}>
            <MenubarItem onClick={undo} disabled={mode !== 'edit'}>
              {t('menu.edit.undo')} <MenubarShortcut>Ctrl+Z</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onClick={redo} disabled={mode !== 'edit'}>
              {t('menu.edit.redo')} <MenubarShortcut>Ctrl+Y</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem onClick={cutElements} disabled={mode !== 'edit' || selectedIds.length === 0}>
              {t('menu.edit.cut')} <MenubarShortcut>Ctrl+X</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onClick={copyElements} disabled={mode !== 'edit' || selectedIds.length === 0}>
              {t('menu.edit.copy')} <MenubarShortcut>Ctrl+C</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onClick={pasteElements} disabled={mode !== 'edit' || !clipboard}>
              {t('menu.edit.paste')} <MenubarShortcut>Ctrl+V</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem onClick={selectAll} disabled={mode !== 'edit'}>
              {t('menu.edit.selectAll')} <MenubarShortcut>Ctrl+A</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onClick={handleDelete} disabled={mode !== 'edit' || selectedIds.length === 0}>
              {t('menu.edit.delete')} <MenubarShortcut>Del</MenubarShortcut>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger className="text-sm py-1">{t('menu.view')}</MenubarTrigger>
          <MenubarContent className={locale === 'es' ? 'w-46' : undefined}>
            <MenubarCheckboxItem checked={showGrid} onCheckedChange={setShowGrid}>
              {t('menu.view.showGrid')}
            </MenubarCheckboxItem>
            <MenubarCheckboxItem checked={snapToGrid} onCheckedChange={setSnapToGrid}>
              {t('menu.view.snapToGrid')}
            </MenubarCheckboxItem>
            <MenubarSeparator />
            <MenubarItem onClick={resetView}>{t('menu.view.resetZoom')}</MenubarItem>
            <MenubarSeparator />
            <MenubarCheckboxItem
              checked={theme === 'dark'}
              onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
            >
              {t('menu.view.darkMode')}
            </MenubarCheckboxItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger className="text-sm py-1">{t('menu.simulation')}</MenubarTrigger>
          <MenubarContent className={locale === 'es' ? 'w-46' : undefined}>
            <MenubarItem
              onClick={() => setMode(mode === 'edit' ? 'token-game' : 'edit')}
            >
              {mode === 'edit' ? t('menu.simulation.startTokenGame') : t('menu.simulation.stopSimulation')}
            </MenubarItem>
            <MenubarItem
              onClick={() => setMode(mode === 'edit' ? 'fast-simulation' : 'edit')}
              disabled={mode === 'token-game'}
            >
              {t('menu.simulation.fastSimulation')}
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem onClick={onOpenAnalysis} disabled={mode === 'edit'}>
              {t('menu.simulation.analysis')}
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger className="text-sm py-1">{t('menu.help')}</MenubarTrigger>
          <MenubarContent className={locale === 'en' ? 'w-38' : undefined}>
            <MenubarItem onClick={onOpenHelp}>
              {t('menu.help.howItWorks')}
            </MenubarItem>
            <MenubarItem onClick={onOpenShortcuts}>
              {t('menu.help.shortcuts')}
            </MenubarItem>
            <MenubarItem onClick={onOpenTour}>
              {t('menu.help.guidedTour')}
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem disabled>
              {t('app.version')}
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </>
  );
}
