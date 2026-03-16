# CLAUDE.md

Read `.claude/CONTEXT.md` first for full project architecture, tech stack, and design decisions.

## Quick Reference

- **Stack**: Next.js 16 + React 19 + TypeScript + Tailwind 4 + shadcn/ui + Zustand/Immer
- **Run**: `npm run dev` (port 3000)
- **Build**: `npm run build`
- **Path alias**: `@/*` maps to `./src/*`

## Rules

### Code Style

- All components use `'use client'` directive (client-side SPA).
- Use shadcn/ui components (`src/components/ui/`) for all UI elements. Never use plain HTML `<button>`, `<input>`, `<textarea>`, or `<table>` outside of SVG canvas components.
- shadcn/ui here uses `@base-ui/react` primitives, NOT Radix. Key difference: no `asChild` prop on triggers. Check the actual component file in `src/components/ui/` before using.
- Use `toast()` from `sonner` for notifications. Never use `alert()` or `confirm()`.
- Use `AlertDialog` from shadcn for destructive action confirmations.
- SVG canvas components (`src/components/canvas/`) use raw SVG elements - this is correct, not a shadcn violation.

### State Management

- Single Zustand store: `useStore` from `@/store/useStore`.
- Always use selectors: `useStore((s) => s.field)` - never `useStore()` without a selector.
- Mutations go through Immer: `set((state) => { state.foo = bar; })`.
- Call `pushSnapshot()` before any mutation that should be undoable.

### Simulation Engine

- `src/engine/` files must have ZERO React imports. Pure functions only.
- Core: `getEnabledTransitions(net, marking)` and `fireTransition(net, marking, transitionId)`.
- These are the source of truth for simulation correctness.

### File Format

- `.hps` files use the binary HOldPetriSim MFC CArchive format.
- `deserializeAuto()` opens files. `serializeBinaryHps()` saves them.
- Canvas state is auto-saved to localStorage and restored on load.

### Types

- All Petri Net types in `src/types/petriNet.ts`.
- Editor types in `src/types/editor.ts`.
- Simulation types in `src/types/simulation.ts`.
- When adding new element properties, update the type, the store slice, the properties panel, and the serialization.
