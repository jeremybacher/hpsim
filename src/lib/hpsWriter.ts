/**
 * Writer for the HOldPetriSim binary .hps format (MFC CArchive serialization).
 * Exports our PetriNet model to the binary format compatible with HPSim/HOldPetriSim.
 */

import type { PetriNet, Place, Transition, Arc, ArcType } from '@/types/petriNet';

const FIRST_POSITION = 1_000_000;
const FIRST_CONNECTOR = 2_000_000;
const DRAW_VERSION = 0x2712; // 10002 decimal = schema version

// Default sizes for elements
const POSITION_SIZE = 25; // Normal
const TRANSITION_WIDTH = 12;
const TRANSITION_HEIGHT = 40;

// ── Binary Writer ──────────────────────────────────────────────────

class BinaryWriter {
  private buffer: ArrayBuffer;
  private view: DataView;
  private offset = 0;
  private capacity: number;

  constructor(initialCapacity = 16384) {
    this.capacity = initialCapacity;
    this.buffer = new ArrayBuffer(this.capacity);
    this.view = new DataView(this.buffer);
  }

  private ensureCapacity(needed: number) {
    while (this.offset + needed > this.capacity) {
      this.capacity *= 2;
      const newBuffer = new ArrayBuffer(this.capacity);
      new Uint8Array(newBuffer).set(new Uint8Array(this.buffer));
      this.buffer = newBuffer;
      this.view = new DataView(this.buffer);
    }
  }

  writeByte(v: number) {
    this.ensureCapacity(1);
    this.view.setUint8(this.offset, v & 0xFF);
    this.offset += 1;
  }

  writeWord(v: number) {
    this.ensureCapacity(2);
    this.view.setUint16(this.offset, v & 0xFFFF, true);
    this.offset += 2;
  }

  writeDword(v: number) {
    this.ensureCapacity(4);
    this.view.setUint32(this.offset, v >>> 0, true);
    this.offset += 4;
  }

  writeDouble(v: number) {
    this.ensureCapacity(8);
    this.view.setFloat64(this.offset, v, true);
    this.offset += 8;
  }

  writeBytes(bytes: Uint8Array) {
    this.ensureCapacity(bytes.length);
    new Uint8Array(this.buffer, this.offset, bytes.length).set(bytes);
    this.offset += bytes.length;
  }

  /** Write MFC CString (Latin-1 for ASCII-safe, Unicode for non-ASCII) */
  writeCString(s: string) {
    // Check if string is Latin-1 safe (all chars <= 0xFF)
    const hasNonLatin1 = [...s].some((ch) => ch.charCodeAt(0) > 0xFF);

    if (!hasNonLatin1) {
      // Write as ANSI (Latin-1)
      const bytes = new Uint8Array(s.length);
      for (let i = 0; i < s.length; i++) {
        bytes[i] = s.charCodeAt(i) & 0xFF;
      }
      if (bytes.length < 0xFF) {
        this.writeByte(bytes.length);
      } else if (bytes.length < 0xFFFE) {
        this.writeByte(0xFF);
        this.writeWord(bytes.length);
      } else {
        this.writeByte(0xFF);
        this.writeWord(0xFFFF);
        this.writeDword(bytes.length);
      }
      this.writeBytes(bytes);
    } else {
      // Write as Unicode CString: 0xFF + 0xFFFE marker, then length, then UTF-16LE data
      const utf16 = new Uint8Array(s.length * 2);
      for (let i = 0; i < s.length; i++) {
        const code = s.charCodeAt(i);
        utf16[i * 2] = code & 0xFF;
        utf16[i * 2 + 1] = (code >> 8) & 0xFF;
      }
      this.writeByte(0xFF);
      this.writeWord(0xFFFE);
      if (s.length < 0xFF) {
        this.writeByte(s.length);
      } else if (s.length < 0xFFFE) {
        this.writeByte(0xFF);
        this.writeWord(s.length);
      } else {
        this.writeByte(0xFF);
        this.writeWord(0xFFFF);
        this.writeDword(s.length);
      }
      this.writeBytes(utf16);
    }
  }

  /** Write MFC CArray<CPoint> */
  writePointArray(points: Array<{ x: number; y: number }>) {
    if (points.length < 0xFFFF) {
      this.writeWord(points.length);
    } else {
      this.writeWord(0xFFFF);
      this.writeDword(points.length);
    }
    for (const p of points) {
      this.writeDword(Math.round(p.x));
      this.writeDword(Math.round(p.y));
    }
  }

  getBuffer(): ArrayBuffer {
    return this.buffer.slice(0, this.offset);
  }
}

// ── MFC class tag tracker ──────────────────────────────────────────

class ClassTagWriter {
  private classMap = new Map<string, number>(); // className -> tag index
  private nextTag = 1;
  private writer: BinaryWriter;

  constructor(writer: BinaryWriter) {
    this.writer = writer;
  }

  writeClassTag(className: string) {
    const existingTag = this.classMap.get(className);
    if (existingTag !== undefined) {
      // Back-reference
      this.writer.writeWord(0x8000 | existingTag);
      this.nextTag++; // object tag
    } else {
      // New class
      this.writer.writeWord(0xFFFF);
      this.writer.writeWord(DRAW_VERSION);
      const nameBytes = new TextEncoder().encode(className);
      this.writer.writeWord(nameBytes.length);
      this.writer.writeBytes(nameBytes);

      this.classMap.set(className, this.nextTag);
      this.nextTag++; // class definition tag
      this.nextTag++; // object tag
    }
  }
}

// ── Object serializers ─────────────────────────────────────────────

function writeRect(w: BinaryWriter, rect: { left: number; top: number; right: number; bottom: number }) {
  w.writeDword(Math.round(rect.left));
  w.writeDword(Math.round(rect.top));
  w.writeDword(Math.round(rect.right));
  w.writeDword(Math.round(rect.bottom));
}

function placeToRect(place: Place) {
  const r = POSITION_SIZE;
  return {
    left: Math.round(place.position.x - r),
    top: Math.round(place.position.y - r),
    right: Math.round(place.position.x + r),
    bottom: Math.round(place.position.y + r),
  };
}

function transitionToRect(tr: Transition) {
  return {
    left: Math.round(tr.position.x - TRANSITION_WIDTH / 2),
    top: Math.round(tr.position.y - TRANSITION_HEIGHT / 2),
    right: Math.round(tr.position.x + TRANSITION_WIDTH / 2),
    bottom: Math.round(tr.position.y + TRANSITION_HEIGHT / 2),
  };
}

function arcTypeToInt(t: ArcType): number {
  switch (t) {
    case 'inhibitor': return 1;
    case 'read': return 2;
    default: return 0;
  }
}

function writePosition(w: BinaryWriter, place: Place, ident: number) {
  w.writeDword(place.tokens); // tokens (current)
  w.writeDword(place.capacity); // tokensMax
  w.writeDword(place.tokens); // tokensStart
  w.writeDword(0); // tokensCount
  writeRect(w, placeToRect(place));
  w.writeDword(POSITION_SIZE); // size enum
  w.writeDword(ident);
  w.writeDword(0); // reserved
  for (let i = 0; i < 7; i++) w.writeByte(0); // reserved bytes
  w.writeDouble(0.0); // reserved double
}

function writeTransition(w: BinaryWriter, tr: Transition, ident: number) {
  w.writeDword(POSITION_SIZE); // size
  writeRect(w, transitionToRect(tr));
  w.writeDword(ident);
  w.writeDword(tr.delay); // delay (current)
  w.writeDword(tr.delay); // startDelay
  w.writeDword(0); // tokensCount
  w.writeDword(0); // rangeDelay
  w.writeDword(0); // reserved
  w.writeDword(0); // reserved
  w.writeByte(0); // reserved
  w.writeByte(0); // reserved
  w.writeByte(tr.delay > 0 ? 1 : 0); // timeMode: 0=Immediate, 1=Deterministic
  for (let i = 0; i < 6; i++) w.writeByte(0); // reserved
  w.writeDouble(0.0); // reserved
}

function writeConnector(
  w: BinaryWriter,
  arc: Arc,
  ident: number,
  fromIdent: number,
  toIdent: number,
  sourcePos: { x: number; y: number },
  targetPos: { x: number; y: number }
) {
  // Compute bounding rect from source/target
  const allX = [sourcePos.x, targetPos.x, ...arc.bendPoints.map((p) => p.x)];
  const allY = [sourcePos.y, targetPos.y, ...arc.bendPoints.map((p) => p.y)];
  const rect = {
    left: Math.min(...allX),
    top: Math.min(...allY),
    right: Math.max(...allX),
    bottom: Math.max(...allY),
  };

  writeRect(w, rect);

  // Arrow points (approximate)
  w.writeDword(Math.round(targetPos.x - 5));
  w.writeDword(Math.round(targetPos.y - 5));
  w.writeDword(Math.round(targetPos.x + 5));
  w.writeDword(Math.round(targetPos.y + 5));

  w.writeDword(ident);
  w.writeDword(fromIdent);
  w.writeDword(toIdent);
  w.writeDword(arc.weight);
  w.writeDword(0); // reserved
  w.writeWord(0); // reserved
  w.writeWord(arcTypeToInt(arc.arcType));
  w.writeWord(0); w.writeWord(0); w.writeWord(0); // reserved
  for (let i = 0; i < 5; i++) w.writeByte(0); // reserved
  w.writeDouble(0.0); // reserved

  // Write points array: source + bend points + target
  const points = [
    { x: Math.round(sourcePos.x), y: Math.round(sourcePos.y) },
    ...arc.bendPoints.map((p) => ({ x: Math.round(p.x), y: Math.round(p.y) })),
    { x: Math.round(targetPos.x), y: Math.round(targetPos.y) },
  ];
  w.writePointArray(points);
}

function writeLabel(w: BinaryWriter, text: string, ownerIdent: number, subIdent: number, rect: { top: number; left: number; bottom: number; right: number }) {
  w.writeCString(text);
  w.writeDword(Math.round(rect.top));
  w.writeDword(Math.round(rect.left));
  w.writeDword(Math.round(rect.bottom));
  w.writeDword(Math.round(rect.right));
  w.writeDword(ownerIdent);
  w.writeDword(subIdent);
  w.writeByte(1); // visible
  w.writeByte(0); // border
  w.writeByte(0); // empty
}

// ── Main export function ───────────────────────────────────────────

export function writeHpsFile(net: PetriNet): ArrayBuffer {
  const w = new BinaryWriter();
  const tags = new ClassTagWriter(w);

  // Assign idents
  const placeIdents = new Map<string, number>();
  const transitionIdents = new Map<string, number>();
  const connectorIdents = new Map<string, number>();

  const places = Object.values(net.places);
  const transitions = Object.values(net.transitions);
  const arcs = Object.values(net.arcs);

  let placeIdentCounter = FIRST_POSITION + 1;
  for (const place of places) {
    placeIdents.set(place.id, placeIdentCounter++);
  }

  let transitionIdentCounter = 1; // must start at 1, not 0 (owner=0 means "no owner" in parser)
  for (const tr of transitions) {
    transitionIdents.set(tr.id, transitionIdentCounter++);
  }

  let connectorIdentCounter = FIRST_CONNECTOR + 1;
  for (const arc of arcs) {
    connectorIdents.set(arc.id, connectorIdentCounter++);
  }

  // Count objects: each place/transition has 2 labels, each arc has 0 labels, plus the element itself
  const totalObjects = places.length * 3 + transitions.length * 3 + arcs.length;

  // Write object count
  if (totalObjects < 0xFFFF) {
    w.writeWord(totalObjects);
  } else {
    w.writeWord(0xFFFF);
    w.writeDword(totalObjects);
  }

  // Write places and their labels
  for (const place of places) {
    const ident = placeIdents.get(place.id)!;
    const rect = placeToRect(place);

    // Position object
    tags.writeClassTag('CHPosition');
    writePosition(w, place, ident);

    // Label A (name)
    tags.writeClassTag('CHLabel');
    writeLabel(w, place.label, ident, 0, {
      top: rect.bottom + 2,
      left: rect.left - 10,
      bottom: rect.bottom + 18,
      right: rect.right + 10,
    });

    // Label B (capacity info)
    tags.writeClassTag('CHLabel');
    const capacityText = place.capacity > 0 ? `K=${place.capacity}` : '';
    writeLabel(w, capacityText, ident, 1, {
      top: rect.bottom + 18,
      left: rect.left - 10,
      bottom: rect.bottom + 34,
      right: rect.right + 10,
    });
  }

  // Write transitions and their labels
  for (const tr of transitions) {
    const ident = transitionIdents.get(tr.id)!;
    const rect = transitionToRect(tr);

    // Transition object
    tags.writeClassTag('CHTransition');
    writeTransition(w, tr, ident);

    // Label A (name)
    tags.writeClassTag('CHLabel');
    writeLabel(w, tr.label, ident, 0, {
      top: rect.bottom + 2,
      left: rect.left - 20,
      bottom: rect.bottom + 18,
      right: rect.right + 20,
    });

    // Label B (delay info)
    tags.writeClassTag('CHLabel');
    const delayText = tr.delay > 0 ? `d=${tr.delay}` : '';
    writeLabel(w, delayText, ident, 1, {
      top: rect.bottom + 18,
      left: rect.left - 20,
      bottom: rect.bottom + 34,
      right: rect.right + 20,
    });
  }

  // Write arcs
  for (const arc of arcs) {
    const ident = connectorIdents.get(arc.id)!;
    const fromIdent = placeIdents.get(arc.sourceId) ?? transitionIdents.get(arc.sourceId) ?? 0;
    const toIdent = placeIdents.get(arc.targetId) ?? transitionIdents.get(arc.targetId) ?? 0;

    const sourcePos = net.places[arc.sourceId]?.position ?? net.transitions[arc.sourceId]?.position ?? { x: 0, y: 0 };
    const targetPos = net.places[arc.targetId]?.position ?? net.transitions[arc.targetId]?.position ?? { x: 0, y: 0 };

    tags.writeClassTag('CHConnector');
    writeConnector(w, arc, ident, fromIdent, toIdent, sourcePos, targetPos);
  }

  // Write document footer (90 bytes)
  // Calculate document bounds
  const allPositions = [
    ...places.map((p) => p.position),
    ...transitions.map((t) => t.position),
  ];
  const maxX = allPositions.length > 0 ? Math.max(...allPositions.map((p) => p.x)) + 200 : 1000;
  const maxY = allPositions.length > 0 ? Math.max(...allPositions.map((p) => p.y)) + 200 : 800;

  w.writeDword(Math.round(maxX)); // sizeDoc.cx
  w.writeDword(Math.round(maxY)); // sizeDoc.cy
  w.writeDword(connectorIdentCounter); // nextFreeConnectorIdent
  w.writeDword(placeIdentCounter); // nextFreePositionIdent
  w.writeDword(transitionIdentCounter); // nextFreeTransitionIdent
  w.writeDword(10); // grid
  w.writeDword(0); // stepCount
  w.writeDword(0); // stopTime
  w.writeDword(0); // stopStep
  w.writeDword(50); // simSpeed
  w.writeDword(0); // simTime
  w.writeDword(100); // simSampleTime
  w.writeDword(0x00FFFFFF); // backColor (white)
  for (let i = 0; i < 7; i++) w.writeDword(0); // reserved
  w.writeByte(1); // showLabel
  w.writeByte(1); // gridVisible
  w.writeByte(0); // alignNo
  w.writeByte(1); // alignDo
  w.writeByte(0); // popupMessage
  w.writeByte(0); // popupExplorer
  for (let i = 0; i < 4; i++) w.writeByte(0); // reserved

  return w.getBuffer();
}
