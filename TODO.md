# Prompt: Build an Online Petri Net Simulator (inspired by HPSim)

## Overview

Build a **fully functional, browser-based Petri Net editor and simulator** inspired by the desktop application [HPSim / HPetriSim](https://github.com/Uzuul23/HOldPetriSim). The app must run entirely client-side — **no backend, no database, no authentication**. It should be a single-page Next.js application using React, TypeScript, and Tailwind CSS. Use an HTML5 Canvas (or SVG layer) for the interactive drawing area.

---

## Core Concepts (Petri Net Theory)

A **Place/Transition Net** consists of:

- **Places** (circles): Hold tokens (black dots). Each place can have an optional **capacity** (max tokens it can hold; 0 or blank = unlimited).
- **Transitions** (rectangles/bars): Represent events. A transition is **enabled** when every input place has at least as many tokens as the weight of the connecting arc, AND every output place has room for incoming tokens (respecting capacity). Transitions can optionally have a **firing delay** (timed transitions, in milliseconds).
- **Arcs** (directed arrows): Connect places to transitions or transitions to places. Each arc has a **weight** (default = 1). Support these arc types:
  - **Normal arc** (solid arrow): Standard token flow.
  - **Inhibitor arc** (circle-headed arrow): The transition is enabled only if the input place has **fewer** tokens than the arc weight.
  - **Read arc / Test arc** (dashed arrow): Checks tokens without consuming them.
- **Tokens** (black dots inside places): Represent resources or state. Display as dots (up to ~5), then show the numeric count.

---

## Feature Requirements

### 1. Graphical Editor (Canvas)

- **Infinite pannable and zoomable canvas** with a subtle grid background.
- **Toolbar** (left sidebar or top bar) with tools:
  - **Select / Move** (pointer tool) — click to select, drag to move elements. Support multi-select with a rubber-band box or Shift+Click.
  - **Place tool** — click on canvas to add a place.
  - **Transition tool** — click on canvas to add a transition.
  - **Arc tool** — click a source (place or transition), then click a target (must alternate: place→transition or transition→place). Draw the arc with a smooth path. If the user tries to connect place→place or transition→transition, reject it with a subtle visual cue.
  - **Token tool** — click on a place to add a token; Shift+Click or right-click to remove a token.
  - **Delete tool** — click any element to remove it (and its connected arcs).
  - **Annotation tool** — add text labels or simple geometric shapes (rectangles, lines) for documentation purposes.
- **Properties panel** (right sidebar): When an element is selected, show editable properties:
  - Place: name/label, initial tokens, capacity.
  - Transition: name/label, firing delay (ms), priority (for conflict resolution).
  - Arc: weight, arc type (Normal / Inhibitor / Read).
- **Snap to grid** toggle.
- **Undo / Redo** (Ctrl+Z / Ctrl+Shift+Z) with a history stack.
- **Keyboard shortcuts**: Delete key to remove selected, Escape to deselect, Ctrl+A to select all, Ctrl+C/V for copy/paste of selected elements.
- **Arc rendering**: Arcs should route with smooth Bézier curves. If an arc connects through other elements, allow the user to add **bend points** by double-clicking the arc and dragging.
- **Visual feedback**: Highlight enabled transitions with a green glow or color change. Disabled transitions should appear dimmed.

### 2. Token Game Animation (Step-by-step Simulation)

- A **"Token Game" mode** toggled via a button. When active:
  - The editor becomes read-only (no adding/moving elements).
  - Enabled transitions are visually highlighted (e.g., green border or pulsing glow).
  - The user clicks an enabled transition to **fire** it — tokens animate flowing from input places through the arc to output places.
  - Token movement should be smoothly animated along the arc paths (200–400ms animation).
  - After firing, re-evaluate which transitions are now enabled and update highlights.
  - Provide **Step Back** (undo last firing) and **Reset** (return to initial marking) buttons.
  - If a timed transition has a delay, show a visual countdown/progress indicator on the transition before it completes firing.
- Display a **firing log** panel at the bottom showing a history of which transitions fired and when.

### 3. Fast Simulation (Automatic Execution)

- A **"Run Simulation"** mode with controls:
  - **Play / Pause / Stop** buttons.
  - **Speed slider** (from slow step-by-step ~1 firing/sec to fast ~100+ firings/sec).
  - **Max steps** input (stop after N firings).
  - **Max time** input (stop after N simulated time units for timed nets).
- When multiple transitions are enabled simultaneously, resolve conflicts by:
  - **Priority-based**: Fire the highest-priority transition first.
  - **Random**: If equal priority, choose randomly.
- During fast simulation, update the canvas in real-time showing token counts changing.
- At very high speeds, skip animation and just update token counts numerically.

### 4. Simple Performance Analysis

- After a simulation run, display a **statistics panel/modal** with:
  - **Per-place stats**: min tokens, max tokens, average tokens over time.
  - **Per-transition stats**: total firings, average firing rate, throughput.
  - **Timeline chart**: A line chart (use Recharts or Chart.js) showing token count over time for selected places.
  - **Reachability info**: List of distinct markings visited during the simulation (up to a reasonable limit, e.g. 1000).
- Allow exporting stats as CSV.

### 5. File Management (JSON Export/Import)

- **Save as `.hps`**: Export the entire net (places, transitions, arcs, positions, properties, initial marking) as a downloadable `.hps` file. The `.hps` file is actually JSON internally, but uses the custom extension to brand the format and associate it with this tool.
- **Load `.hps`**: Import a previously saved `.hps` file to restore the net on canvas. The file input should accept both `.hps` and `.json` extensions for compatibility.
- **Save/Load to browser** (optional): Also offer quick save/load using in-memory state (not localStorage), so the user doesn't lose work if they accidentally switch tools.
- **Export as PNG/SVG**: Export the current canvas view as an image.

### 6. Preloaded Sample Nets

Include at least **5 built-in example nets** accessible from a dropdown/modal:

1. **Simple Sequence**: 3 places, 2 transitions in a linear chain. (Beginner example)
2. **Producer-Consumer**: Classic pattern with a buffer place of limited capacity.
3. **Mutual Exclusion**: Two processes sharing a critical section (semaphore pattern).
4. **Dining Philosophers** (3 philosophers): Classic deadlock-prone scenario.
5. **Reader-Writer**: Multiple readers, single writer with priority.

Each sample should load with proper labels, initial tokens, and a brief description tooltip.

---

## UI / UX Design Guidelines

- **Modern, clean, dark theme** as default with an optional light theme toggle. Use a professional color palette (think Figma or draw.io aesthetic).
- **Layout**: 
  - Top: Menu bar (File, Edit, View, Simulation, Help) + simulation controls.
  - Left: Vertical toolbar with tool icons and tooltips.
  - Center: Canvas (takes majority of space).
  - Right: Collapsible properties panel.
  - Bottom: Collapsible log / statistics panel.
- **Responsive**: Must work on desktop screens (1280px+). Tablet support is a nice-to-have.
- **Animations**: Smooth, non-distracting. Token flow along arcs should feel natural.
- **Accessibility**: Proper focus management, keyboard navigation for toolbar, ARIA labels.
- **Empty state**: When canvas is empty, show a centered hint: "Click a tool to start building your Petri Net, or load a sample from the menu."

---

## Technical Constraints

- **Framework**: Next.js App Router + React 18+ + TypeScript.
- **Styling**: Tailwind CSS. Use `shadcn/ui` components for buttons, dialogs, dropdowns, sliders, inputs, tooltips, and tabs.
- **Canvas rendering**: Use HTML5 `<canvas>` with a rendering library like `roughjs` for a hand-drawn feel, OR use clean SVG-based rendering. Choose whichever gives the best performance for 50+ elements on screen.
- **State management**: Use React Context or Zustand for the Petri net model state. The data model should be cleanly separated from rendering.
- **No external backend**: Everything runs in the browser. No APIs, no database, no auth.
- **Performance**: Smooth interaction with nets of up to ~100 places and ~100 transitions.

---

## Data Model (Suggested Schema)

```typescript
interface PetriNet {
  id: string;
  name: string;
  description?: string;
  places: Place[];
  transitions: Transition[];
  arcs: Arc[];
  annotations: Annotation[];
}

interface Place {
  id: string;
  label: string;
  x: number;
  y: number;
  tokens: number;        // current token count
  initialTokens: number; // for reset
  capacity: number;      // 0 = unlimited
}

interface Transition {
  id: string;
  label: string;
  x: number;
  y: number;
  delay: number;     // ms, 0 = immediate
  priority: number;  // higher = fires first in conflict
  enabled?: boolean; // computed
}

interface Arc {
  id: string;
  sourceId: string;  // place or transition ID
  targetId: string;  // place or transition ID
  weight: number;
  type: 'normal' | 'inhibitor' | 'read';
  bendPoints: { x: number; y: number }[];
}

interface Annotation {
  id: string;
  type: 'text' | 'rectangle' | 'line';
  x: number;
  y: number;
  content?: string;
  width?: number;
  height?: number;
}
```

---

## Simulation Engine Logic

```
function getEnabledTransitions(net: PetriNet): Transition[] {
  // For each transition, check:
  //   1. Every input arc (place→transition):
  //      - Normal: place.tokens >= arc.weight
  //      - Inhibitor: place.tokens < arc.weight
  //      - Read: place.tokens >= arc.weight (but won't consume)
  //   2. Every output arc (transition→place):
  //      - If place.capacity > 0: place.tokens + arc.weight <= place.capacity
  // Return all transitions where ALL conditions are met.
}

function fireTransition(net: PetriNet, transitionId: string): PetriNet {
  // 1. For each input Normal arc: place.tokens -= arc.weight
  // 2. For each input Read arc: do nothing (tokens checked but not consumed)
  // 3. For each output arc: place.tokens += arc.weight
  // 4. Return updated net
}
```

---

## Priority of Implementation

Build in this order:

1. **Canvas with pan/zoom and grid** — get the foundation right.
2. **Place and Transition creation** — click to add, drag to move.
3. **Arc drawing** — connect elements with validation.
4. **Properties panel** — edit labels, tokens, weights, capacity, delay.
5. **Token Game mode** — step-by-step manual firing with animation.
6. **Fast Simulation** — auto-run with speed control.
7. **JSON save/load + samples**.
8. **Performance analysis & statistics**.
9. **Annotations, undo/redo, keyboard shortcuts**.
10. **Export as image (PNG/SVG)**.

---

## Reference

This project is inspired by [HPSim (HOldPetriSim)](https://github.com/Uzuul23/HOldPetriSim), a classic Windows desktop Petri Net tool written in C++. The goal is to bring its full functionality to the modern web with a contemporary UX — no installation required, no login, no backend.
