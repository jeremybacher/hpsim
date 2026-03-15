'use client';

import { useRef, useState } from 'react';
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
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
} from '@/components/ui/menubar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  serializeJSON,
  deserializeAuto,
  readFileAsArrayBuffer,
  downloadFile,
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
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmNewOpen, setConfirmNewOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const net = useStore((s) => s.net);
  const showGrid = useStore((s) => s.showGrid);
  const snapToGrid = useStore((s) => s.snapToGrid);
  const mode = useStore((s) => s.mode);
  const setNet = useStore((s) => s.setNet);
  const clearNet = useStore((s) => s.clearNet);
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

  const hasContent = Object.keys(net.places).length > 0 || Object.keys(net.transitions).length > 0;

  const handleNew = () => {
    if (hasContent) {
      setConfirmNewOpen(true);
    } else {
      doNew();
    }
  };

  const doNew = () => {
    clearNet();
    clearHistory();
    toast.success(t('toast.newNet'));
  };

  const handleSaveJSON = () => {
    const json = serializeJSON(net);
    const filename = (net.name || 'untitled').replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.hps';
    downloadFile(json, filename);
    toast.success(t('toast.saved', { filename }));
  };

  const handleSaveBinaryHps = () => {
    try {
      const buffer = serializeBinaryHps(net);
      const filename = (net.name || 'untitled').replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.hps';
      downloadBinaryFile(buffer, filename);
      toast.success(t('toast.exported', { filename }));
    } catch (err) {
      toast.error(t('toast.exportFailed') + ': ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleOpen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'hps' && ext !== 'json') {
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
        accept=".hps,.json,application/json,application/octet-stream,*/*"
        className="hidden"
        onChange={handleOpen}
      />

      {/* Confirm New dialog */}
      <AlertDialog open={confirmNewOpen} onOpenChange={setConfirmNewOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('confirm.newNet.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('confirm.newNet.desc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('confirm.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => { doNew(); setConfirmNewOpen(false); }}>
              {t('confirm.createNew')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Menubar className="border-none rounded-none px-2 h-9 shadow-none">
        <div className="flex items-center gap-1.5 mr-2 pr-2 border-r">
          <img src="/logo.svg" alt="HPSim" className="w-4 h-4 dark:invert" />
          <span className="text-sm font-semibold">HPSim</span>
        </div>
        <MenubarMenu>
          <MenubarTrigger className="text-sm py-1">{t('menu.file')}</MenubarTrigger>
          <MenubarContent>
            <MenubarItem onClick={handleNew}>
              {t('menu.file.new')} <MenubarShortcut>Ctrl+N</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onClick={() => fileInputRef.current?.click()}>
              {t('menu.file.open')} <MenubarShortcut>Ctrl+O</MenubarShortcut>
            </MenubarItem>

            <MenubarSub>
              <MenubarSubTrigger>{t('menu.file.saveAs')}</MenubarSubTrigger>
              <MenubarSubContent>
                <MenubarItem onClick={handleSaveJSON}>
                  {t('menu.file.saveJson')}
                </MenubarItem>
                <MenubarItem onClick={handleSaveBinaryHps}>
                  {t('menu.file.saveBinary')}
                </MenubarItem>
              </MenubarSubContent>
            </MenubarSub>

            <MenubarSeparator />
            <MenubarItem onClick={onOpenExport}>{t('menu.file.exportImage')}</MenubarItem>
            <MenubarSeparator />
            <MenubarItem onClick={onOpenSamples}>{t('menu.file.sampleNets')}</MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger className="text-sm py-1">{t('menu.edit')}</MenubarTrigger>
          <MenubarContent>
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
          <MenubarContent>
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
          <MenubarContent>
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
          <MenubarContent>
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
