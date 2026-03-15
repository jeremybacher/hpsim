'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { Grid } from './Grid';
import { SvgDefs } from './SvgDefs';
import { PlaceNode } from './PlaceNode';
import { TransitionNode } from './TransitionNode';
import { ArcPath } from './ArcPath';
import { AnnotationNode } from './AnnotationNode';
import { SelectionBox } from './SelectionBox';
import { GhostArc } from './GhostArc';
import { screenToWorld, isCircleInRect, isRectInRect } from '@/lib/geometry';
import { DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT, ZOOM_STEP, PLACE_RADIUS, TRANSITION_WIDTH, TRANSITION_HEIGHT } from '@/lib/constants';

export function Canvas() {
  const svgRef = useRef<SVGSVGElement>(null);
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const dragStartRef = useRef<{ x: number; y: number; ids: string[] } | null>(null);
  const selectionStartRef = useRef<{ x: number; y: number } | null>(null);
  const spaceHeldRef = useRef(false);
  const touchStartRef = useRef<{ touches: Array<{ x: number; y: number }>; transform: { x: number; y: number; zoom: number } } | null>(null);

  const net = useStore((s) => s.net);
  const tool = useStore((s) => s.tool);
  const selectedIds = useStore((s) => s.selectedIds);
  const selectionBox = useStore((s) => s.selectionBox);
  const arcDrawing = useStore((s) => s.arcDrawing);
  const viewTransform = useStore((s) => s.viewTransform);
  const showGrid = useStore((s) => s.showGrid);
  const mode = useStore((s) => s.mode);
  const enabledTransitionIds = useStore((s) => s.enabledTransitionIds);

  const setTool = useStore((s) => s.setTool);
  const setSelectedIds = useStore((s) => s.setSelectedIds);
  const addToSelection = useStore((s) => s.addToSelection);
  const clearSelection = useStore((s) => s.clearSelection);
  const setSelectionBox = useStore((s) => s.setSelectionBox);
  const setArcDrawing = useStore((s) => s.setArcDrawing);
  const setViewTransform = useStore((s) => s.setViewTransform);
  const zoomToPoint = useStore((s) => s.zoomToPoint);
  const setIsPanning = useStore((s) => s.setIsPanning);
  const snapPosition = useStore((s) => s.snapPosition);

  const addPlace = useStore((s) => s.addPlace);
  const addTransition = useStore((s) => s.addTransition);
  const addArc = useStore((s) => s.addArc);
  const addToken = useStore((s) => s.addToken);
  const removeToken = useStore((s) => s.removeToken);
  const removeElements = useStore((s) => s.removeElements);
  const moveElements = useStore((s) => s.moveElements);
  const addAnnotation = useStore((s) => s.addAnnotation);
  const updateAnnotation = useStore((s) => s.updateAnnotation);
  const pushSnapshot = useStore((s) => s.pushSnapshot);

  // Annotation editing state
  const [editingAnnotationId, setEditingAnnotationId] = useState<string | null>(null);

  const getWorldPos = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    return screenToWorld(e.clientX, e.clientY, viewTransform, rect);
  }, [viewTransform]);

  const findElementAtPoint = useCallback((worldPos: { x: number; y: number }) => {
    // Check places
    for (const place of Object.values(net.places)) {
      const dx = worldPos.x - place.position.x;
      const dy = worldPos.y - place.position.y;
      if (dx * dx + dy * dy <= PLACE_RADIUS * PLACE_RADIUS) {
        return { id: place.id, type: 'place' as const };
      }
    }
    // Check transitions
    for (const tr of Object.values(net.transitions)) {
      if (
        Math.abs(worldPos.x - tr.position.x) <= TRANSITION_WIDTH / 2 &&
        Math.abs(worldPos.y - tr.position.y) <= TRANSITION_HEIGHT / 2
      ) {
        return { id: tr.id, type: 'transition' as const };
      }
    }
    // Check annotations
    for (const ann of Object.values(net.annotations)) {
      if (
        Math.abs(worldPos.x - ann.position.x) <= 80 &&
        Math.abs(worldPos.y - ann.position.y) <= 14
      ) {
        return { id: ann.id, type: 'annotation' as const };
      }
    }
    return null;
  }, [net.places, net.transitions, net.annotations]);

  // Token game - fire transition on click
  const fireTransitionFn = useStore((s) => s.fireTransitionHandler);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 2) return; // right click

    const worldPos = getWorldPos(e);

    // Middle-click or space+click for panning
    if (e.button === 1 || spaceHeldRef.current) {
      isPanningRef.current = true;
      panStartRef.current = { x: e.clientX - viewTransform.x, y: e.clientY - viewTransform.y };
      setIsPanning(true);
      e.preventDefault();
      return;
    }

    // In simulation mode, clicking on transitions fires them
    if (mode === 'token-game') {
      const elem = findElementAtPoint(worldPos);
      if (elem?.type === 'transition' && enabledTransitionIds.includes(elem.id)) {
        fireTransitionFn?.(elem.id);
      }
      return;
    }

    if (mode !== 'edit') return;

    const elem = findElementAtPoint(worldPos);

    switch (tool) {
      case 'select': {
        if (elem) {
          if (e.shiftKey) {
            addToSelection(elem.id);
          } else if (!selectedIds.includes(elem.id)) {
            setSelectedIds([elem.id]);
          }
          // Start dragging
          dragStartRef.current = { x: worldPos.x, y: worldPos.y, ids: selectedIds.includes(elem.id) ? [...selectedIds] : [elem.id] };
          if (!selectedIds.includes(elem.id) && !e.shiftKey) {
            dragStartRef.current.ids = [elem.id];
          }
        } else {
          if (!e.shiftKey) clearSelection();
          // Start rubber-band selection
          selectionStartRef.current = { x: worldPos.x, y: worldPos.y };
          setSelectionBox({ start: worldPos, end: worldPos });
        }
        break;
      }

      case 'place': {
        pushSnapshot();
        const snapped = snapPosition(worldPos);
        const id = addPlace(snapped);
        setSelectedIds([id]);
        break;
      }

      case 'transition': {
        pushSnapshot();
        const snapped = snapPosition(worldPos);
        const id = addTransition(snapped);
        setSelectedIds([id]);
        break;
      }

      case 'arc': {
        if (!arcDrawing) {
          // Start arc drawing
          if (elem && (elem.type === 'place' || elem.type === 'transition')) {
            setArcDrawing({
              sourceId: elem.id,
              sourceType: elem.type,
              currentPoint: worldPos,
            });
          }
        } else {
          // Finish arc drawing
          if (elem && elem.id !== arcDrawing.sourceId) {
            pushSnapshot();
            addArc(arcDrawing.sourceId, elem.id);
          }
          setArcDrawing(null);
        }
        break;
      }

      case 'token': {
        if (elem?.type === 'place') {
          pushSnapshot();
          if (e.shiftKey) {
            removeToken(elem.id);
          } else {
            addToken(elem.id);
          }
        }
        break;
      }

      case 'delete': {
        if (elem) {
          pushSnapshot();
          removeElements([elem.id]);
          clearSelection();
        }
        break;
      }

      case 'annotation': {
        pushSnapshot();
        const snapped = snapPosition(worldPos);
        const id = addAnnotation({
          annotationType: 'text',
          position: snapped,
          text: '',
        });
        setSelectedIds([id]);
        setEditingAnnotationId(id);
        break;
      }
    }
  }, [
    getWorldPos, viewTransform, mode, tool, arcDrawing, selectedIds,
    findElementAtPoint, enabledTransitionIds, fireTransitionFn,
    setIsPanning, addToSelection, setSelectedIds, clearSelection,
    setSelectionBox, setArcDrawing, snapPosition,
    addPlace, addTransition, addArc, addToken, removeToken,
    removeElements, addAnnotation, pushSnapshot,
  ]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanningRef.current) {
      setViewTransform({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      });
      return;
    }

    const worldPos = getWorldPos(e);

    // Update arc drawing ghost
    if (arcDrawing) {
      setArcDrawing({ ...arcDrawing, currentPoint: worldPos });
    }

    // Dragging elements
    if (dragStartRef.current) {
      const dx = worldPos.x - dragStartRef.current.x;
      const dy = worldPos.y - dragStartRef.current.y;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
        moveElements(dragStartRef.current.ids, { x: dx, y: dy });
        dragStartRef.current.x = worldPos.x;
        dragStartRef.current.y = worldPos.y;
      }
      return;
    }

    // Rubber-band selection
    if (selectionStartRef.current) {
      setSelectionBox({ start: selectionStartRef.current, end: worldPos });
    }
  }, [getWorldPos, arcDrawing, setArcDrawing, setViewTransform, moveElements, setSelectionBox]);

  const handleMouseUp = useCallback(() => {
    if (isPanningRef.current) {
      isPanningRef.current = false;
      setIsPanning(false);
    }

    if (dragStartRef.current) {
      dragStartRef.current = null;
    }

    if (selectionStartRef.current && selectionBox) {
      // Find elements inside rubber band
      const minX = Math.min(selectionBox.start.x, selectionBox.end.x);
      const minY = Math.min(selectionBox.start.y, selectionBox.end.y);
      const w = Math.abs(selectionBox.end.x - selectionBox.start.x);
      const h = Math.abs(selectionBox.end.y - selectionBox.start.y);
      const rect = { x: minX, y: minY, width: w, height: h };

      const ids: string[] = [];
      for (const place of Object.values(net.places)) {
        if (isCircleInRect(place.position, PLACE_RADIUS, rect)) {
          ids.push(place.id);
        }
      }
      for (const tr of Object.values(net.transitions)) {
        const trRect = {
          x: tr.position.x - TRANSITION_WIDTH / 2,
          y: tr.position.y - TRANSITION_HEIGHT / 2,
          width: TRANSITION_WIDTH,
          height: TRANSITION_HEIGHT,
        };
        if (isRectInRect(trRect, rect)) {
          ids.push(tr.id);
        }
      }
      for (const ann of Object.values(net.annotations)) {
        const annRect = {
          x: ann.position.x - 80,
          y: ann.position.y - 14,
          width: 160,
          height: 28,
        };
        if (isRectInRect(annRect, rect)) {
          ids.push(ann.id);
        }
      }

      if (ids.length > 0) {
        setSelectedIds(ids);
      }

      selectionStartRef.current = null;
      setSelectionBox(null);
    }
  }, [selectionBox, net.places, net.transitions, setIsPanning, setSelectedIds, setSelectionBox]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    zoomToPoint(delta, { x: e.clientX, y: e.clientY });
  }, [zoomToPoint]);

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        spaceHeldRef.current = true;
        e.preventDefault();
      }
      if (e.code === 'Escape') {
        setArcDrawing(null);
        clearSelection();
        setTool('select');
      }
      if (e.code === 'Delete' || e.code === 'Backspace') {
        if (selectedIds.length > 0 && mode === 'edit') {
          pushSnapshot();
          removeElements(selectedIds);
          clearSelection();
        }
      }
      // Tool shortcuts
      if (!e.ctrlKey && !e.metaKey && mode === 'edit') {
        switch (e.code) {
          case 'KeyV':
          case 'Digit1': setTool('select'); break;
          case 'KeyP':
          case 'Digit2': setTool('place'); break;
          case 'KeyT':
          case 'Digit3': setTool('transition'); break;
          case 'KeyA':
          case 'Digit4':
            if (!e.ctrlKey && !e.metaKey) setTool('arc');
            break;
          case 'KeyK':
          case 'Digit5': setTool('token'); break;
          case 'KeyX':
          case 'Digit6': setTool('delete'); break;
          case 'KeyN':
          case 'Digit7': setTool('annotation'); break;
        }
      }
      // Undo/Redo
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ') {
        e.preventDefault();
        if (e.shiftKey) {
          useStore.getState().redo();
        } else {
          useStore.getState().undo();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyY') {
        e.preventDefault();
        useStore.getState().redo();
      }
      // Select all
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyA') {
        e.preventDefault();
        useStore.getState().selectAll();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        spaceHeldRef.current = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedIds, mode, setTool, setArcDrawing, clearSelection, removeElements, pushSnapshot]);

  // Annotation editing handlers
  const handleCommitAnnotationText = useCallback((id: string, text: string) => {
    if (text.trim() === '') {
      // Remove empty annotations
      removeElements([id]);
      clearSelection();
    } else {
      updateAnnotation(id, { text });
    }
    setEditingAnnotationId(null);
  }, [updateAnnotation, removeElements, clearSelection]);

  const handleCancelAnnotationEdit = useCallback((id: string) => {
    const ann = net.annotations[id];
    if (ann && (!ann.text || ann.text.trim() === '')) {
      removeElements([id]);
      clearSelection();
    }
    setEditingAnnotationId(null);
  }, [net.annotations, removeElements, clearSelection]);

  // Double-click to edit annotations
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (mode !== 'edit') return;
    const worldPos = getWorldPos(e);
    const elem = findElementAtPoint(worldPos);
    if (elem && elem.type === 'annotation') {
      setEditingAnnotationId(elem.id);
    }
  }, [mode, getWorldPos, findElementAtPoint]);

  // Touch handlers for mobile pan/zoom
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length >= 1) {
      e.preventDefault();
      const touches = Array.from(e.touches).map((t) => ({ x: t.clientX, y: t.clientY }));
      touchStartRef.current = {
        touches,
        transform: { ...viewTransform },
      };
    }
  }, [viewTransform]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    e.preventDefault();

    const startData = touchStartRef.current;

    if (e.touches.length === 1 && startData.touches.length === 1) {
      // Single finger: pan
      const dx = e.touches[0].clientX - startData.touches[0].x;
      const dy = e.touches[0].clientY - startData.touches[0].y;
      setViewTransform({
        x: startData.transform.x + dx,
        y: startData.transform.y + dy,
      });
    } else if (e.touches.length === 2 && startData.touches.length >= 2) {
      // Two fingers: pinch to zoom + pan
      const startDist = Math.hypot(
        startData.touches[1].x - startData.touches[0].x,
        startData.touches[1].y - startData.touches[0].y,
      );
      const curDist = Math.hypot(
        e.touches[1].clientX - e.touches[0].clientX,
        e.touches[1].clientY - e.touches[0].clientY,
      );

      if (startDist > 0) {
        const scale = curDist / startDist;
        const newZoom = Math.max(0.1, Math.min(5, startData.transform.zoom * scale));

        // Zoom around the midpoint of the two fingers
        const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        const startMidX = (startData.touches[0].x + startData.touches[1].x) / 2;
        const startMidY = (startData.touches[0].y + startData.touches[1].y) / 2;

        const panDx = midX - startMidX;
        const panDy = midY - startMidY;

        const zoomRatio = newZoom / startData.transform.zoom;
        const newX = midX - (startMidX - startData.transform.x) * zoomRatio + panDx - (midX - startMidX);
        const newY = midY - (startMidY - startData.transform.y) * zoomRatio + panDy - (midY - startMidY);

        setViewTransform({ x: newX, y: newY, zoom: newZoom });
      }
    }
  }, [setViewTransform]);

  const handleTouchEnd = useCallback(() => {
    touchStartRef.current = null;
  }, []);

  // Get source position for arc drawing ghost
  const arcSourcePos = arcDrawing ? (
    net.places[arcDrawing.sourceId]?.position ||
    net.transitions[arcDrawing.sourceId]?.position
  ) : null;

  return (
    <svg
      ref={svgRef}
      className="w-full h-full bg-background"
      style={{
        cursor: isPanningRef.current || spaceHeldRef.current ? 'grab' : undefined,
        touchAction: 'none',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onDoubleClick={handleDoubleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onContextMenu={(e) => e.preventDefault()}
    >
      <SvgDefs />

      <g transform={`translate(${viewTransform.x}, ${viewTransform.y}) scale(${viewTransform.zoom})`}>
        {/* Grid */}
        {showGrid && (
          <>
            <Grid width={DEFAULT_CANVAS_WIDTH} height={DEFAULT_CANVAS_HEIGHT} />
            <use href="#grid-bg" x={-DEFAULT_CANVAS_WIDTH / 2} y={-DEFAULT_CANVAS_HEIGHT / 2} />
          </>
        )}

        {/* Arcs (render first, behind nodes) */}
        {Object.values(net.arcs).map((arc) => {
          const sourcePos = net.places[arc.sourceId]?.position || net.transitions[arc.sourceId]?.position;
          const targetPos = net.places[arc.targetId]?.position || net.transitions[arc.targetId]?.position;
          if (!sourcePos || !targetPos) return null;
          const sourceType: 'place' | 'transition' = arc.sourceId in net.places ? 'place' : 'transition';
          return (
            <ArcPath
              key={arc.id}
              arc={arc}
              sourcePos={sourcePos}
              targetPos={targetPos}
              sourceType={sourceType}
              isSelected={selectedIds.includes(arc.id)}
              onMouseDown={(e) => {
                if (tool === 'select') {
                  e.stopPropagation();
                  if (e.shiftKey) {
                    addToSelection(arc.id);
                  } else {
                    setSelectedIds([arc.id]);
                  }
                } else if (tool === 'delete') {
                  e.stopPropagation();
                  pushSnapshot();
                  removeElements([arc.id]);
                }
              }}
            />
          );
        })}

        {/* Places */}
        {Object.values(net.places).map((place) => (
          <PlaceNode
            key={place.id}
            place={place}
            isSelected={selectedIds.includes(place.id)}
          />
        ))}

        {/* Transitions */}
        {Object.values(net.transitions).map((tr) => (
          <TransitionNode
            key={tr.id}
            transition={tr}
            isSelected={selectedIds.includes(tr.id)}
            isEnabled={enabledTransitionIds.includes(tr.id)}
          />
        ))}

        {/* Annotations */}
        {Object.values(net.annotations).map((ann) => (
          <AnnotationNode
            key={ann.id}
            annotation={ann}
            isSelected={selectedIds.includes(ann.id)}
            isEditing={editingAnnotationId === ann.id}
            onCommitText={handleCommitAnnotationText}
            onCancelEdit={handleCancelAnnotationEdit}
          />
        ))}

        {/* Ghost arc while drawing */}
        {arcDrawing && arcSourcePos && (
          <GhostArc
            sourcePos={arcSourcePos}
            sourceType={arcDrawing.sourceType}
            currentPoint={arcDrawing.currentPoint}
          />
        )}

        {/* Rubber-band selection box */}
        {selectionBox && <SelectionBox box={selectionBox} />}
      </g>
    </svg>
  );
}
