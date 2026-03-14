# HPSim - Petri Net Editor & Simulator

A browser-based Petri Net editor and simulator inspired by the desktop app [HPSim/HOldPetriSim](https://github.com/Uzuul23/HOldPetriSim). Build, edit, and simulate Petri Nets entirely in your browser with no server required.

## Features

- **Visual Editor** - Create places, transitions, and arcs on an SVG canvas with pan/zoom
- **Token Game** - Step through simulation manually, clicking enabled transitions to fire
- **Fast Simulation** - Auto-run with adjustable speed (1-1000 firings/sec), deadlock detection
- **Properties Panel** - Edit labels, tokens, capacity, delay, priority, arc weight/type
- **Arc Types** - Normal, inhibitor, and read arcs with proper semantics
- **Undo/Redo** - Full snapshot-based history (Ctrl+Z / Ctrl+Y)
- **Save/Load** - JSON format and binary HOldPetriSim .hps format (import & export)
- **Sample Nets** - 5 prebuilt examples (Simple Sequence, Producer-Consumer, Mutual Exclusion, Dining Philosophers, Reader-Writer)
- **Performance Analysis** - Place/transition statistics, reachability markings, CSV export
- **Image Export** - PNG (configurable resolution) and SVG
- **Dark Mode** - Toggle via View menu
- **Keyboard Shortcuts** - Tool selection, undo/redo, delete, select all, canvas navigation

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- npm

### Install & Run

```bash
# Clone the repository
git clone <repo-url> hpsim
cd hpsim

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## Usage

### Creating a Net

1. Select the **Place** tool (P) and click on the canvas to add places
2. Select the **Transition** tool (T) and click to add transitions
3. Select the **Arc** tool (A), click a place then a transition (or vice versa) to connect them
4. Select the **Token** tool (K) and click places to add tokens (Shift+click to remove)

### Simulating

- Click **Token Game** in the bottom bar to enter step-by-step mode. Enabled transitions glow green - click them to fire.
- Click **Fast Simulation** for auto-run mode with a speed slider and play/pause controls.
- Use the **Analysis** dialog (Simulation menu) to see per-place and per-transition statistics.

### File Compatibility

HPSim supports two .hps file formats:

- **HPSim JSON** - Our native format, human-readable
- **HPSim Binary** - Compatible with the original [HOldPetriSim](https://github.com/Uzuul23/HOldPetriSim) desktop application (MFC CArchive format)

Open either format via File > Open. Save via File > Save As with your preferred format.

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| V / 1 | Select tool |
| P / 2 | Place tool |
| T / 3 | Transition tool |
| A / 4 | Arc tool |
| K / 5 | Token tool |
| X / 6 | Delete tool |
| Ctrl+Z | Undo |
| Ctrl+Y | Redo |
| Ctrl+A | Select all |
| Delete | Remove selected |
| Escape | Cancel / Deselect |
| Space+Drag | Pan canvas |
| Scroll | Zoom |

## Tech Stack

- [Next.js](https://nextjs.org/) 16 (App Router) + React 19 + TypeScript
- [Tailwind CSS](https://tailwindcss.com/) 4 + [shadcn/ui](https://ui.shadcn.com/)
- [Zustand](https://zustand-demo.pmnd.rs/) + [Immer](https://immerjs.github.io/immer/) for state management
- SVG for rendering (DOM-based, with native event handling)

## License

MIT
