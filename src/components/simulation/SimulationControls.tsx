'use client';

import { useCallback, useRef, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Play,
  Pause,
  Square,
  SkipBack,
  StepForward,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { getEnabledTransitions, fireTransition, getMarkingFromNet } from '@/engine/simulation';
import { selectTransition } from '@/engine/conflictResolution';

export function SimulationControls() {
  const { t } = useTranslation();
  const mode = useStore((s) => s.mode);
  const isRunning = useStore((s) => s.isRunning);
  const speed = useStore((s) => s.speed);
  const currentStep = useStore((s) => s.currentStep);
  const deadlocked = useStore((s) => s.deadlocked);
  const maxSteps = useStore((s) => s.maxSteps);

  const setMode = useStore((s) => s.setMode);
  const startSimulation = useStore((s) => s.startSimulation);
  const pauseSimulation = useStore((s) => s.pauseSimulation);
  const resetSimulation = useStore((s) => s.resetSimulation);
  const setSpeed = useStore((s) => s.setSpeed);
  const stepBack = useStore((s) => s.stepBack);

  const animFrameRef = useRef<number>(0);
  const lastFireTimeRef = useRef(0);

  const fireOne = useCallback(() => {
    const state = useStore.getState();
    const net = state.net;
    const marking = getMarkingFromNet(net);
    const enabled = getEnabledTransitions(net, marking);

    if (enabled.length === 0) {
      state.setDeadlocked(true);
      state.stopSimulation();
      return;
    }

    const selected = selectTransition(net, enabled);
    if (!selected) return;

    const newMarking = fireTransition(net, selected, marking);

    state.setMarking(newMarking);
    state.incrementStep();
    state.addFiringRecord({
      step: state.currentStep + 1,
      transitionId: selected,
      transitionLabel: net.transitions[selected]?.label ?? selected,
      timestamp: Date.now(),
      markingBefore: marking,
      markingAfter: newMarking,
    });
    state.pushMarking(newMarking);
    state.addReachabilityMarking(newMarking);

    const newEnabled = getEnabledTransitions(net, newMarking);
    state.setEnabledTransitions(newEnabled);
    if (newEnabled.length === 0) {
      state.setDeadlocked(true);
      state.stopSimulation();
    }
  }, []);

  useEffect(() => {
    if (!isRunning || mode !== 'fast-simulation') return;

    const interval = 1000 / speed;

    const tick = (timestamp: number) => {
      const state = useStore.getState();
      if (!state.isRunning) return;

      if (state.currentStep >= state.maxSteps) {
        state.stopSimulation();
        return;
      }

      if (timestamp - lastFireTimeRef.current >= interval) {
        const firingsPerFrame = speed > 100 ? Math.min(Math.floor(speed / 60), 50) : 1;
        for (let i = 0; i < firingsPerFrame; i++) {
          if (!useStore.getState().isRunning) break;
          if (useStore.getState().currentStep >= useStore.getState().maxSteps) {
            useStore.getState().stopSimulation();
            break;
          }
          fireOne();
        }
        lastFireTimeRef.current = timestamp;
      }

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [isRunning, mode, speed, fireOne]);

  useEffect(() => {
    if (mode === 'token-game' || mode === 'fast-simulation') {
      const state = useStore.getState();
      const marking = getMarkingFromNet(state.net);
      const enabled = getEnabledTransitions(state.net, marking);
      state.setEnabledTransitions(enabled);
    }
  }, [mode]);

  useEffect(() => {
    useStore.setState({ fireTransitionHandler: (transitionId: string) => {
      const state = useStore.getState();
      const net = state.net;
      const marking = getMarkingFromNet(net);
      const newMarking = fireTransition(net, transitionId, marking);

      state.setMarking(newMarking);
      state.incrementStep();
      state.addFiringRecord({
        step: state.currentStep + 1,
        transitionId,
        transitionLabel: net.transitions[transitionId]?.label ?? transitionId,
        timestamp: Date.now(),
        markingBefore: marking,
        markingAfter: newMarking,
      });
      state.pushMarking(newMarking);
      state.addReachabilityMarking(newMarking);

      const newEnabled = getEnabledTransitions(net, newMarking);
      state.setEnabledTransitions(newEnabled);
      if (newEnabled.length === 0) {
        state.setDeadlocked(true);
      }
    }});
  }, []);

  if (mode === 'edit') {
    return (
      <div className="hidden md:flex items-center gap-2 px-3 py-2 border-t bg-card">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMode('token-game')}
          className="gap-1"
        >
          <StepForward className="w-4 h-4" />
          {t('sim.tokenGame')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMode('fast-simulation')}
          className="gap-1"
        >
          <Zap className="w-4 h-4" />
          {t('sim.fastSimulation')}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-t bg-card flex-wrap">
      {mode === 'token-game' && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={fireOne}
            disabled={deadlocked}
            className="gap-1"
          >
            <StepForward className="w-4 h-4" />
            {t('sim.step')}
          </Button>
          <Button variant="outline" size="sm" onClick={stepBack} className="gap-1">
            <SkipBack className="w-4 h-4" />
            {t('sim.back')}
          </Button>
        </>
      )}

      {mode === 'fast-simulation' && (
        <>
          {!isRunning ? (
            <Button
              variant="outline"
              size="sm"
              onClick={startSimulation}
              disabled={deadlocked}
              className="gap-1"
            >
              <Play className="w-4 h-4" />
              {t('sim.play')}
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={pauseSimulation}
              className="gap-1"
            >
              <Pause className="w-4 h-4" />
              {t('sim.pause')}
            </Button>
          )}

          <div className="flex items-center gap-2 min-w-[140px] md:min-w-[200px]">
            <span className="text-xs text-muted-foreground whitespace-nowrap">{t('sim.speed')}</span>
            <Slider
              value={[speed]}
              onValueChange={(v) => setSpeed(Array.isArray(v) ? v[0] : v)}
              min={1}
              max={1000}
              step={1}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-14 text-right">{speed}/s</span>
          </div>
        </>
      )}

      <Button variant="outline" size="sm" onClick={resetSimulation} className="gap-1">
        <RotateCcw className="w-4 h-4" />
        {t('sim.reset')}
      </Button>

      <Separator orientation="vertical" className="h-6" />

      <Badge variant="secondary" className="text-xs">{t('sim.stepCount')}: {currentStep}</Badge>

      {deadlocked && (
        <Badge variant="destructive" className="text-xs">{t('sim.deadlocked')}</Badge>
      )}

      <div className="ml-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMode('edit')}
        >
          <Square className="w-4 h-4 mr-1" />
          {t('sim.exitSimulation')}
        </Button>
      </div>
    </div>
  );
}
