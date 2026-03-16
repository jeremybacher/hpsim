'use client';

import { useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';
import type { PetriNet } from '@/types/petriNet';

const STORAGE_KEY = 'hpsim-autosave';
const DEBOUNCE_MS = 500;

function saveToLocalStorage(net: PetriNet): void {
  try {
    const data = JSON.stringify(net);
    localStorage.setItem(STORAGE_KEY, data);
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

function loadFromLocalStorage(): PetriNet | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const net = JSON.parse(raw) as PetriNet;
    // Basic validation
    if (!net.places || !net.transitions || !net.arcs) return null;
    if (!net.annotations) net.annotations = {};
    return net;
  } catch {
    return null;
  }
}

function isNetEmpty(net: PetriNet): boolean {
  return (
    Object.keys(net.places).length === 0 &&
    Object.keys(net.transitions).length === 0 &&
    Object.keys(net.annotations).length === 0
  );
}

export function useLocalStoragePersistence(): void {
  const hasRestored = useRef(false);

  // Restore on mount (only if canvas is empty)
  useEffect(() => {
    if (hasRestored.current) return;
    hasRestored.current = true;

    const saved = loadFromLocalStorage();
    if (saved && !isNetEmpty(saved)) {
      const currentNet = useStore.getState().net;
      // Only restore if the current canvas is empty
      if (isNetEmpty(currentNet)) {
        useStore.getState().setNet(saved);
        useStore.getState().clearHistory();
      }
    }
  }, []);

  // Auto-save on net changes (debounced)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let prevNet = useStore.getState().net;

    const unsubscribe = useStore.subscribe((state) => {
      if (state.net !== prevNet) {
        prevNet = state.net;
        clearTimeout(timer);
        timer = setTimeout(() => saveToLocalStorage(state.net), DEBOUNCE_MS);
      }
    });

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);
}
