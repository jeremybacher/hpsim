/**
 * Parser for the HOldPetriSim binary .hps format (MFC CArchive serialization).
 *
 * Format overview:
 * - Little-endian throughout
 * - Starts with object count (WORD, or 0xFFFF + DWORD if >= 0xFFFF)
 * - Objects prefixed with MFC class tags
 * - 90-byte document footer after all objects
 *
 * ID scheme:
 * - Transitions: IDs start at 0
 * - Places (Positions): IDs start at 1,000,000
 * - Connectors (Arcs): IDs start at 2,000,000
 */

import type { PetriNet, Place, Transition, Arc, Position, ArcType, Annotation } from '@/types/petriNet';

const FIRST_POSITION = 1_000_000;
const FIRST_CONNECTOR = 2_000_000;

// ── Binary Reader ──────────────────────────────────────────────────

class BinaryReader {
  private view: DataView;
  private offset = 0;

  constructor(buffer: ArrayBuffer) {
    this.view = new DataView(buffer);
  }

  get pos() { return this.offset; }
  get remaining() { return this.view.byteLength - this.offset; }

  private checkBounds(n: number, label: string) {
    if (this.offset + n > this.view.byteLength) {
      throw new Error(
        `Buffer overrun: ${label} needs ${n} bytes at offset ${this.offset}, ` +
        `but only ${this.remaining} bytes remain (buffer size: ${this.view.byteLength})`
      );
    }
  }

  readByte(): number {
    this.checkBounds(1, 'readByte');
    const v = this.view.getUint8(this.offset);
    this.offset += 1;
    return v;
  }

  readWord(): number {
    this.checkBounds(2, 'readWord');
    const v = this.view.getUint16(this.offset, true);
    this.offset += 2;
    return v;
  }

  readDword(): number {
    this.checkBounds(4, 'readDword');
    const v = this.view.getUint32(this.offset, true);
    this.offset += 4;
    return v;
  }

  /** Read signed 32-bit integer (for coordinates, which can be negative) */
  readInt32(): number {
    this.checkBounds(4, 'readInt32');
    const v = this.view.getInt32(this.offset, true);
    this.offset += 4;
    return v;
  }

  readDouble(): number {
    this.checkBounds(8, 'readDouble');
    const v = this.view.getFloat64(this.offset, true);
    this.offset += 8;
    return v;
  }

  readBytes(n: number): Uint8Array {
    this.checkBounds(n, `readBytes(${n})`);
    const arr = new Uint8Array(this.view.buffer, this.offset, n);
    this.offset += n;
    return arr;
  }

  /**
   * Read MFC CString, supporting both ANSI and Unicode formats.
   *
   * ANSI format:
   *   BYTE length (or 0xFF + WORD, or 0xFF + 0xFFFF + DWORD)
   *   followed by `length` bytes of Latin-1 text.
   *
   * Unicode format (from MFC Unicode builds):
   *   BYTE length prefix (same encoding as ANSI)
   *   then if length > 0: BYTE(0xFF) + WORD(0xFFFE) Unicode marker
   *   followed by `length * 2` bytes of UTF-16LE text.
   */
  readCString(): string {
    const startOff = this.offset;
    let length = this.readByte();

    // Check for Unicode CString: the entire sequence 0xFF 0xFFFE at the start
    // means this is a Unicode CString where the marker comes first.
    // This happens when MFC writes: length_prefix, then 0xFF + 0xFFFE marker, then UTF-16 data.
    // But if the length byte is 0xFF and next WORD is 0xFFFE, it's the Unicode marker itself.
    if (length === 0xFF) {
      const nextWord = this.readWord();
      if (nextWord === 0xFFFE) {
        // Unicode CString marker detected (0xFF + 0xFFFE)
        // Read the actual character count using standard length prefix
        let charCount = this.readByte();
        if (charCount === 0xFF) {
          charCount = this.readWord();
          if (charCount === 0xFFFF) {
            charCount = this.readDword();
          }
        }
        if (charCount === 0) return '';
        // Skip the inner Unicode marker if present (some MFC versions repeat it)
        const peekByte = this.view.getUint8(this.offset);
        if (peekByte === 0xFF && this.remaining >= 3) {
          const peekWord = this.view.getUint16(this.offset + 1, true);
          if (peekWord === 0xFFFE) {
            this.offset += 3; // skip redundant inner marker
          }
        }
        const byteCount = charCount * 2;
        if (byteCount > this.remaining) {
          throw new Error(
            `Unicode CString at offset ${startOff}: ${charCount} chars (${byteCount} bytes) ` +
            `exceeds remaining buffer (${this.remaining} bytes).`
          );
        }
        const bytes = this.readBytes(byteCount);
        return new TextDecoder('utf-16le').decode(bytes);
      } else if (nextWord === 0xFFFF) {
        length = this.readDword();
      } else {
        length = nextWord;
      }
    }

    // Check for Unicode marker after ANSI length prefix
    // Format: BYTE(length) [if length > 0: BYTE(0xFF) + WORD(0xFFFE)] then length*2 UTF-16 bytes
    if (length > 0 && this.remaining >= 3) {
      const peekByte = this.view.getUint8(this.offset);
      if (peekByte === 0xFF) {
        const peekWord = this.view.getUint16(this.offset + 1, true);
        if (peekWord === 0xFFFE) {
          // Unicode marker after length prefix
          this.offset += 3; // skip 0xFF + 0xFFFE
          const byteCount = length * 2;
          if (byteCount > this.remaining) {
            throw new Error(
              `Unicode CString at offset ${startOff}: ${length} chars (${byteCount} bytes) ` +
              `exceeds remaining buffer (${this.remaining} bytes).`
            );
          }
          const bytes = this.readBytes(byteCount);
          return new TextDecoder('utf-16le').decode(bytes);
        }
      }
    }

    // Standard ANSI CString
    if (length > this.remaining) {
      throw new Error(
        `CString length ${length} at offset ${startOff} exceeds remaining buffer (${this.remaining} bytes). ` +
        `File may be corrupted or not in HOldPetriSim binary format.`
      );
    }
    const bytes = this.readBytes(length);
    // Try UTF-8 first (handles files saved with UTF-8 encoded strings),
    // fall back to Windows-1252 for legacy HOldPetriSim files
    try {
      const decoded = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
      return decoded;
    } catch {
      return new TextDecoder('windows-1252').decode(bytes);
    }
  }

  /** Read MFC CArray<CPoint> */
  readPointArray(): Array<{ x: number; y: number }> {
    const startOff = this.offset;
    let count = this.readWord();
    if (count === 0xFFFF) {
      count = this.readDword();
    }
    const bytesNeeded = count * 8;
    if (bytesNeeded > this.remaining) {
      throw new Error(
        `Point array count ${count} at offset ${startOff} requires ${bytesNeeded} bytes, ` +
        `but only ${this.remaining} bytes remain. File may be corrupted.`
      );
    }
    const points: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < count; i++) {
      const x = this.readInt32();
      const y = this.readInt32();
      points.push({ x, y });
    }
    return points;
  }

  /** Skip n bytes */
  skip(n: number) {
    this.checkBounds(n, `skip(${n})`);
    this.offset += n;
  }
}

// ── Parsed object types ────────────────────────────────────────────

interface ParsedPosition {
  className: 'CHPosition';
  tokens: number;
  tokensMax: number;
  tokensStart: number;
  rect: { left: number; top: number; right: number; bottom: number };
  ident: number;
}

interface ParsedTransition {
  className: 'CHTransition';
  rect: { left: number; top: number; right: number; bottom: number };
  ident: number;
  startDelay: number;
  timeMode: number;
  rangeDelay: number;
}

interface ParsedConnector {
  className: 'CHConnector';
  rect: { left: number; top: number; right: number; bottom: number };
  ident: number;
  from: number;
  to: number;
  weight: number;
  typ: number; // 0=Normal, 1=Inhibitor, 2=Test
  points: Array<{ x: number; y: number }>;
}

interface ParsedLabel {
  className: 'CHLabel';
  text: string;
  rect: { top: number; left: number; bottom: number; right: number };
  owner: number;
  subIdent: number;
  visible: boolean;
}

interface ParsedRect {
  className: 'CHRect';
  rect: { left: number; top: number; right: number; bottom: number };
}

interface ParsedText {
  className: 'CHText';
  rect: { top: number; left: number; bottom: number; right: number };
  text: string;
}

interface ParsedLine {
  className: 'CHLine';
  rect: { left: number; top: number; right: number; bottom: number };
}

interface ParsedPoly {
  className: 'CHPoly';
  rect: { left: number; top: number; right: number; bottom: number };
  points: Array<{ x: number; y: number }>;
}

interface ParsedGroup {
  className: 'CHGroup';
  rect: { left: number; top: number; right: number; bottom: number };
  children: ParsedObject[];
}

type ParsedObject = ParsedPosition | ParsedTransition | ParsedConnector |
  ParsedLabel | ParsedRect | ParsedText | ParsedLine | ParsedPoly | ParsedGroup;

interface DocumentFooter {
  sizeDoc: { cx: number; cy: number };
  grid: number;
  stopTime: number;
  stopStep: number;
  simSpeed: number;
  showLabel: boolean;
  gridVisible: boolean;
}

// ── Object deserializers ───────────────────────────────────────────

function readRect(r: BinaryReader) {
  return {
    left: r.readInt32(),
    top: r.readInt32(),
    right: r.readInt32(),
    bottom: r.readInt32(),
  };
}

function readPosition(r: BinaryReader): ParsedPosition {
  const tokens = r.readDword();
  const tokensMax = r.readDword();
  const tokensStart = r.readDword();
  r.readDword(); // tokensCount
  const rect = readRect(r);
  r.readDword(); // size
  const ident = r.readDword();
  r.readDword(); // reserved
  r.readBytes(7); // reserved bytes
  r.readDouble(); // reserved double
  return { className: 'CHPosition', tokens, tokensMax, tokensStart, rect, ident };
}

function readTransition(r: BinaryReader): ParsedTransition {
  r.readDword(); // size
  const rect = readRect(r);
  const ident = r.readDword();
  r.readDword(); // delay
  const startDelay = r.readDword();
  r.readDword(); // tokensCount
  const rangeDelay = r.readDword();
  r.readDword(); // reserved
  r.readDword(); // reserved
  r.readByte(); // reserved
  r.readByte(); // reserved
  const timeMode = r.readByte();
  r.readBytes(6); // reserved
  r.readDouble(); // reserved
  return { className: 'CHTransition', rect, ident, startDelay, timeMode, rangeDelay };
}

function readConnector(r: BinaryReader): ParsedConnector {
  const rect = readRect(r);
  r.readInt32(); r.readInt32(); // arrow1
  r.readInt32(); r.readInt32(); // arrow2
  const ident = r.readDword();
  const from = r.readDword();
  const to = r.readDword();
  const weight = r.readDword();
  r.readDword(); // reserved
  r.readWord(); // reserved
  const typ = r.readWord();
  r.readWord(); r.readWord(); r.readWord(); // reserved
  r.readBytes(5); // reserved
  r.readDouble(); // reserved
  const points = r.readPointArray();
  return { className: 'CHConnector', rect, ident, from, to, weight, typ, points };
}

function readLabel(r: BinaryReader): ParsedLabel {
  const text = r.readCString();
  const top = r.readInt32();
  const left = r.readInt32();
  const bottom = r.readInt32();
  const right = r.readInt32();
  const owner = r.readDword();
  const subIdent = r.readDword();
  const visible = r.readByte() !== 0;
  r.readByte(); // border
  r.readByte(); // empty
  return { className: 'CHLabel', text, rect: { top, left, bottom, right }, owner, subIdent, visible };
}

function readCHRect(r: BinaryReader): ParsedRect {
  const rect = readRect(r);
  r.readDword(); // innerColor
  r.readDword(); // borderColor
  r.readWord(); // penStyle
  r.readWord(); // penWidth
  r.readWord(); // rectStyle
  r.readWord(); // roundX
  r.readWord(); // roundY
  r.readByte(); // empty
  return { className: 'CHRect', rect };
}

function readCHLine(r: BinaryReader): ParsedLine {
  const rect = readRect(r);
  r.readWord(); // penStyle
  r.readWord(); // penWidth
  r.readDword(); // color
  return { className: 'CHLine', rect };
}

function readCHText(r: BinaryReader): ParsedText {
  const top = r.readInt32();
  const left = r.readInt32();
  const bottom = r.readInt32();
  const right = r.readInt32();
  r.readDword(); // color
  // LOGFONT: 5 DWORDs + 8 BYTEs + 32 bytes face name
  r.readDword(); r.readDword(); r.readDword(); r.readDword(); r.readDword();
  r.readBytes(8);
  r.readBytes(32);
  const text = r.readCString();
  return { className: 'CHText', rect: { top, left, bottom, right }, text };
}

function readCHPoly(r: BinaryReader): ParsedPoly {
  const rect = readRect(r);
  r.readDword(); // penColor
  r.readDword(); // fillColor
  r.readWord(); // polyStyle
  r.readWord(); // penStyle
  r.readWord(); // penWidth
  r.readByte(); // empty
  const points = r.readPointArray();
  return { className: 'CHPoly', rect, points };
}

// ── MFC class tag system ───────────────────────────────────────────

interface ClassTag {
  name: string;
  schema: number;
}

function readObjectList(r: BinaryReader): ParsedObject[] {
  // Read object count
  let objectCount = r.readWord();
  if (objectCount === 0xFFFF) {
    objectCount = r.readDword();
  }

  if (objectCount > 100000) {
    throw new Error(
      `Unreasonable object count: ${objectCount}. File may not be in HOldPetriSim binary format.`
    );
  }

  const classTags: Map<number, ClassTag> = new Map();
  let nextTag = 1;
  const objects: ParsedObject[] = [];

  for (let i = 0; i < objectCount; i++) {
    const markerOffset = r.pos;
    const classMarker = r.readWord();
    let className: string;

    if (classMarker === 0xFFFF) {
      // New class definition
      const schema = r.readWord();
      const nameLen = r.readWord();
      if (nameLen > 256) {
        throw new Error(
          `Class name length ${nameLen} at offset ${markerOffset} is unreasonable. ` +
          `File may be corrupted or not in HOldPetriSim binary format.`
        );
      }
      const nameBytes = r.readBytes(nameLen);
      className = new TextDecoder('latin1').decode(nameBytes);

      classTags.set(nextTag, { name: className, schema });
      nextTag++; // class definition tag
      nextTag++; // object tag
    } else if ((classMarker & 0x8000) !== 0) {
      // Back-reference to existing class
      const tagIndex = classMarker & 0x7FFF;
      const tag = classTags.get(tagIndex);
      if (!tag) {
        throw new Error(
          `Unknown class tag ${tagIndex} (marker 0x${classMarker.toString(16)}) ` +
          `at offset ${markerOffset}, object #${i}. Known tags: ${[...classTags.entries()].map(([k, v]) => `${k}=${v.name}`).join(', ')}`
        );
      }
      className = tag.name;
      nextTag++; // object tag
    } else if (classMarker === 0x0000) {
      // NULL object - skip
      continue;
    } else {
      throw new Error(
        `Unexpected class marker 0x${classMarker.toString(16)} at offset ${markerOffset}, ` +
        `object #${i}/${objectCount}. File may be corrupted or not in HOldPetriSim binary format.`
      );
    }

    // Deserialize based on class name
    let obj: ParsedObject | null = null;
    switch (className) {
      case 'CHPosition':
        obj = readPosition(r);
        break;
      case 'CHTransition':
        obj = readTransition(r);
        break;
      case 'CHConnector':
        obj = readConnector(r);
        break;
      case 'CHLabel':
        obj = readLabel(r);
        break;
      case 'CHRect':
        obj = readCHRect(r);
        break;
      case 'CHText':
        obj = readCHText(r);
        break;
      case 'CHLine':
        obj = readCHLine(r);
        break;
      case 'CHPoly':
        obj = readCHPoly(r);
        break;
      case 'CHGroup': {
        const rect = readRect(r);
        const children = readObjectList(r);
        obj = { className: 'CHGroup', rect, children };
        break;
      }
      default:
        throw new Error(`Unknown class "${className}" at offset ${r.pos}, object #${i}`);
    }

    if (obj) objects.push(obj);
  }

  return objects;
}

function readFooter(r: BinaryReader): DocumentFooter {
  const cx = r.readDword();
  const cy = r.readDword();
  r.readDword(); // nextFreeConnectorIdent
  r.readDword(); // nextFreePositionIdent
  r.readDword(); // nextFreeTransitionIdent
  const grid = r.readDword();
  r.readDword(); // stepCount
  const stopTime = r.readDword();
  const stopStep = r.readDword();
  const simSpeed = r.readDword();
  r.readDword(); // simTime
  r.readDword(); // simSampleTime
  r.readDword(); // backColor
  r.readBytes(28); // 7 reserved DWORDs
  const showLabel = r.readByte() !== 0;
  const gridVisible = r.readByte() !== 0;
  r.readBytes(8); // remaining reserved bytes

  return { sizeDoc: { cx, cy }, grid, stopTime, stopStep, simSpeed, showLabel, gridVisible };
}

// ── Convert parsed objects to PetriNet ─────────────────────────────

function convertArcType(typ: number): ArcType {
  switch (typ) {
    case 1: return 'inhibitor';
    case 2: return 'read';
    default: return 'normal';
  }
}

function rectCenter(rect: { left: number; top: number; right: number; bottom: number }): Position {
  return {
    x: (rect.left + rect.right) / 2,
    y: (rect.top + rect.bottom) / 2,
  };
}

export function parseHpsFile(buffer: ArrayBuffer): PetriNet {
  const reader = new BinaryReader(buffer);
  const objects = readObjectList(reader);

  // Read footer if there's enough data remaining
  let footer: DocumentFooter | null = null;
  if (reader.remaining >= 90) {
    footer = readFooter(reader);
  }

  // Collect all objects (including from groups)
  const allObjects: ParsedObject[] = [];
  function flatten(objs: ParsedObject[]) {
    for (const obj of objs) {
      allObjects.push(obj);
      if (obj.className === 'CHGroup') {
        flatten(obj.children);
      }
    }
  }
  flatten(objects);

  // Extract typed objects
  const positions = allObjects.filter((o): o is ParsedPosition => o.className === 'CHPosition');
  const transitions = allObjects.filter((o): o is ParsedTransition => o.className === 'CHTransition');
  const connectors = allObjects.filter((o): o is ParsedConnector => o.className === 'CHConnector');
  const labels = allObjects.filter((o): o is ParsedLabel => o.className === 'CHLabel');

  // Build label lookup: ident -> { nameLabel, infoLabel }
  const labelMap = new Map<number, { name: string; info: string }>();
  for (const label of labels) {
    if (label.owner === 0) continue;
    const existing = labelMap.get(label.owner) || { name: '', info: '' };
    if (label.subIdent === 0) {
      existing.name = label.text;
    } else {
      existing.info = label.text;
    }
    labelMap.set(label.owner, existing);
  }

  // Build ID maps for connectors to look up source/target
  const identToId = new Map<number, string>();

  // Convert places
  const places: Record<string, Place> = {};
  for (let i = 0; i < positions.length; i++) {
    const pos = positions[i];
    const id = `p${i + 1}`;
    const nameInfo = labelMap.get(pos.ident);
    identToId.set(pos.ident, id);
    places[id] = {
      id,
      type: 'place',
      label: nameInfo?.name || `P${i + 1}`,
      position: rectCenter(pos.rect),
      tokens: pos.tokensStart,
      capacity: pos.tokensMax,
    };
  }

  // Convert transitions
  const transitionsMap: Record<string, Transition> = {};
  for (let i = 0; i < transitions.length; i++) {
    const tr = transitions[i];
    const id = `t${i + 1}`;
    const nameInfo = labelMap.get(tr.ident);
    identToId.set(tr.ident, id);
    transitionsMap[id] = {
      id,
      type: 'transition',
      label: nameInfo?.name || `T${i + 1}`,
      position: rectCenter(tr.rect),
      delay: tr.startDelay,
      priority: 0,
    };
  }

  // Convert arcs
  const arcs: Record<string, Arc> = {};
  for (let i = 0; i < connectors.length; i++) {
    const conn = connectors[i];
    const id = `a${i + 1}`;
    const sourceId = identToId.get(conn.from);
    const targetId = identToId.get(conn.to);
    if (!sourceId || !targetId) continue;

    // Convert bend points (exclude first and last which are connection endpoints)
    const bendPoints: Position[] = conn.points.length > 2
      ? conn.points.slice(1, -1).map((p) => ({ x: p.x, y: p.y }))
      : [];

    arcs[id] = {
      id,
      type: 'arc',
      arcType: convertArcType(conn.typ),
      sourceId,
      targetId,
      weight: conn.weight,
      bendPoints,
    };
  }

  return {
    name: 'Imported Net',
    description: 'Imported from HOldPetriSim .hps file',
    places,
    transitions: transitionsMap,
    arcs,
    annotations: {},
  };
}

/** Detect if an ArrayBuffer contains a binary MFC .hps file (not JSON) */
export function isBinaryHps(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength === 0) return false;

  const bytes = new Uint8Array(buffer, 0, Math.min(buffer.byteLength, 20));

  // Skip UTF-8 BOM if present (0xEF 0xBB 0xBF)
  let start = 0;
  if (bytes.length >= 3 && bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
    start = 3;
  }

  for (let i = start; i < bytes.length; i++) {
    const byte = bytes[i];
    if (byte === 0x20 || byte === 0x0A || byte === 0x0D || byte === 0x09) continue;
    if (byte === 0x7B) return false; // '{' = JSON
    return true; // Binary
  }
  return true;
}
