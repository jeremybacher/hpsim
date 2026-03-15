'use client';

import { useRef, useState } from 'react';
import { useStore } from '@/store/useStore';
import { useTheme } from 'next-themes';
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
}

export function AppMenubar({ onOpenSamples, onOpenExport, onOpenAnalysis, onOpenShortcuts, onOpenHelp }: AppMenubarProps) {
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
    toast.success('New net created');
  };

  const handleSaveJSON = () => {
    const json = serializeJSON(net);
    const filename = (net.name || 'untitled').replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.hps';
    downloadFile(json, filename);
    toast.success(`Saved as ${filename} (JSON)`);
  };

  const handleSaveBinaryHps = () => {
    try {
      const buffer = serializeBinaryHps(net);
      const filename = (net.name || 'untitled').replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.hps';
      downloadBinaryFile(buffer, filename);
      toast.success(`Exported as ${filename} (HPSim binary)`);
    } catch (err) {
      toast.error('Export failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleOpen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const buffer = await readFileAsArrayBuffer(file);
      const loadedNet = deserializeAuto(buffer);
      pushSnapshot();
      setNet(loadedNet);
      clearHistory();
      toast.success(`Loaded "${loadedNet.name}" from ${file.name}`);
    } catch (err) {
      toast.error('Failed to load file: ' + (err instanceof Error ? err.message : 'Unknown error'));
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
            <AlertDialogTitle>Create new net?</AlertDialogTitle>
            <AlertDialogDescription>
              This will clear the current net. Unsaved changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { doNew(); setConfirmNewOpen(false); }}>
              Create New
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Menubar className="border-b rounded-none px-2 h-9">
        <MenubarMenu>
          <MenubarTrigger className="text-sm py-1">File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem onClick={handleNew}>
              New <MenubarShortcut>Ctrl+N</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onClick={() => fileInputRef.current?.click()}>
              Open... <MenubarShortcut>Ctrl+O</MenubarShortcut>
            </MenubarItem>

            <MenubarSub>
              <MenubarSubTrigger>Save As...</MenubarSubTrigger>
              <MenubarSubContent>
                <MenubarItem onClick={handleSaveJSON}>
                  HPSim JSON (.hps)
                </MenubarItem>
                <MenubarItem onClick={handleSaveBinaryHps}>
                  HPSim Binary (.hps)
                </MenubarItem>
              </MenubarSubContent>
            </MenubarSub>

            <MenubarSeparator />
            <MenubarItem onClick={onOpenExport}>Export Image...</MenubarItem>
            <MenubarSeparator />
            <MenubarItem onClick={onOpenSamples}>Sample Nets...</MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger className="text-sm py-1">Edit</MenubarTrigger>
          <MenubarContent>
            <MenubarItem onClick={undo} disabled={mode !== 'edit'}>
              Undo <MenubarShortcut>Ctrl+Z</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onClick={redo} disabled={mode !== 'edit'}>
              Redo <MenubarShortcut>Ctrl+Y</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem onClick={selectAll} disabled={mode !== 'edit'}>
              Select All <MenubarShortcut>Ctrl+A</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onClick={handleDelete} disabled={mode !== 'edit' || selectedIds.length === 0}>
              Delete <MenubarShortcut>Del</MenubarShortcut>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger className="text-sm py-1">View</MenubarTrigger>
          <MenubarContent>
            <MenubarCheckboxItem checked={showGrid} onCheckedChange={setShowGrid}>
              Show Grid
            </MenubarCheckboxItem>
            <MenubarCheckboxItem checked={snapToGrid} onCheckedChange={setSnapToGrid}>
              Snap to Grid
            </MenubarCheckboxItem>
            <MenubarSeparator />
            <MenubarItem onClick={resetView}>Reset Zoom</MenubarItem>
            <MenubarSeparator />
            <MenubarCheckboxItem
              checked={theme === 'dark'}
              onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
            >
              Dark Mode
            </MenubarCheckboxItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger className="text-sm py-1">Simulation</MenubarTrigger>
          <MenubarContent>
            <MenubarItem
              onClick={() => setMode(mode === 'edit' ? 'token-game' : 'edit')}
            >
              {mode === 'edit' ? 'Start Token Game' : 'Stop Simulation'}
            </MenubarItem>
            <MenubarItem
              onClick={() => setMode(mode === 'edit' ? 'fast-simulation' : 'edit')}
              disabled={mode === 'token-game'}
            >
              Fast Simulation
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem onClick={onOpenAnalysis} disabled={mode === 'edit'}>
              Analysis...
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger className="text-sm py-1">Help</MenubarTrigger>
          <MenubarContent>
            <MenubarItem onClick={onOpenHelp}>
              How It Works
            </MenubarItem>
            <MenubarItem onClick={onOpenShortcuts}>
              Keyboard Shortcuts
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem disabled>
              HPSim v1.0
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </>
  );
}
