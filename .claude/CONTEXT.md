# HPSim - Project Context

## What is this?

A browser-based Petri Net editor and simulator inspired by the desktop app HPSim/HOldPetriSim. Runs entirely client-side as a single-page Next.js application.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript |
| Styling | Tailwind CSS 4 + shadcn/ui (base-ui primitives) |
| State | Zustand + Immer (single store, 5 slices) |
| Rendering | SVG (not Canvas) - DOM nodes with native events |
| Icons | Lucide React |
| Charts | Recharts |
| IDs | nanoid |
| Themes | next-themes (light/dark via CSS class) |
| Toasts | Sonner |
| Export | html-to-image (PNG), XMLSerializer (SVG) |

## Architecture

### Folder Structure

```
src/
├── app/            # Next.js pages (layout.tsx, page.tsx)
├── components/
│   ├── ui/         # shadcn/ui primitives (Button, Dialog, Select, etc.)
│   ├── canvas/     # SVG rendering (Canvas, PlaceNode, TransitionNode, ArcPath, Grid, etc.)
│   ├── toolbar/    # Left sidebar tool buttons
│   ├── properties/ # Right sidebar property editors
│   ├── menubar/    # Top menu bar (File, Edit, View, Simulation, Help)
│   ├── simulation/ # SimulationControls, FiringLog
│   ├── analysis/   # AnalysisPanel (stats, reachability)
│   ├── dialogs/    # SampleNetsDialog, ExportDialog, ShortcutsDialog
│   └── layout/     # EditorLayout, EmptyState
├── store/          # Zustand slices
│   ├── useStore.ts        # Combined store (StoreState type)
│   ├── petriNetSlice.ts   # Places, transitions, arcs, annotations CRUD
│   ├── editorSlice.ts     # Tool, selection, view transform, pan/zoom
│   ├── simulationSlice.ts # Mode, firing log, marking history, speed
│   ├── historySlice.ts    # Undo/redo snapshot stack
│   └── analysisSlice.ts   # Stats, reachability markings
├── engine/         # Pure simulation logic (zero React imports)
│   ├── simulation.ts        # getEnabledTransitions(), fireTransition()
│   ├── conflictResolution.ts # Priority-based selection, maximal step
│   └── analysis.ts          # Stats computation, CSV export
├── lib/            # Utilities
│   ├── bezier.ts         # Bezier curve math, arc path building
│   ├── geometry.ts       # Distance, clipping, screen-to-world coords
│   ├── constants.ts      # Sizes, colors, defaults
│   ├── serialization.ts  # JSON + binary .hps file I/O
│   ├── hpsParser.ts      # Binary MFC CArchive .hps reader
│   ├── hpsWriter.ts      # Binary MFC CArchive .hps writer
│   └── utils.ts          # shadcn cn() utility
├── types/          # TypeScript interfaces
│   ├── petriNet.ts    # Place, Transition, Arc, Annotation, PetriNet, Marking
│   ├── editor.ts      # Tool, ViewTransform, SelectionBox, ArcDrawingState
│   └── simulation.ts  # SimulationMode, FiringRecord, PlaceStats, TransitionStats
└── hooks/          # Custom hooks (directory exists, hooks inline in Canvas for now)
```

### Key Design Decisions

- **SVG over Canvas**: Each element is a DOM node. Click/hover events work natively. CSS classes apply directly. Performance is fine for ~100 elements.
- **Single Zustand store**: All state in one `useStore` with Immer middleware. Slices are composed via `StateCreator`. Access via `useStore((s) => s.field)`.
- **Simulation engine is pure**: `src/engine/` has zero React imports. Functions take `(net, marking)` and return results. Fully testable.
- **Binary .hps compatibility**: Can import/export the MFC CArchive binary format used by the original HPSim desktop app. Auto-detects format on open.

### .hps File Format

Binary format (HOldPetriSim compat): MFC CArchive serialization with class tags, little-endian. Places start at ID 1,000,000, arcs at 2,000,000.

`deserializeAuto()` in `serialization.ts` parses binary `.hps` files. Canvas state is auto-saved to localStorage.

### Petri Net Model

- **Place**: circle, holds tokens, optional capacity
- **Transition**: rectangle, fires when all input places have enough tokens. Has delay and priority.
- **Arc**: connects place↔transition only. Types: normal (consumes/produces), inhibitor (enabled when source has < weight tokens), read (checks but doesn't consume).
- **Marking**: `Record<placeId, tokenCount>` - the state of all places at a point in time.

### Simulation Modes

- **Edit mode**: Full editor. Add/remove/move elements.
- **Token game**: Step-by-step. Click enabled transitions (green glow) to fire. Step back supported.
- **Fast simulation**: Auto-run with speed slider (1-1000 firings/sec). Priority-based conflict resolution with random tie-breaking. Deadlock detection.

### shadcn/ui Components in Use

Button, Input, Label, Textarea, Select, Dialog, AlertDialog, Tabs, Badge, Separator, ScrollArea, Slider, Tooltip, Menubar, Sonner (toasts), DropdownMenu.

All UI components live in `src/components/ui/` and use `@base-ui/react` primitives (not Radix). The API differs from Radix-based shadcn - notably no `asChild` prop on triggers.

## Sample Nets

5 prebuilt samples in `public/samples/`: Simple Sequence, Producer-Consumer, Mutual Exclusion, Dining Philosophers (3), Reader-Writer. All in JSON .hps format.
