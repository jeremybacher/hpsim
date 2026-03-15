import type { PetriNet } from '@/types/petriNet';
import { parseHpsFile, isBinaryHps } from './hpsParser';
import { writeHpsFile } from './hpsWriter';

const FILE_VERSION = 1;

interface SerializedFile {
  version: number;
  type: 'hpsim';
  net: PetriNet;
}

// ── JSON format (our native format) ────────────────────────────────

export function serializeJSON(net: PetriNet): string {
  const data: SerializedFile = {
    version: FILE_VERSION,
    type: 'hpsim',
    net,
  };
  return JSON.stringify(data, null, 2);
}

export function deserializeJSON(json: string): PetriNet {
  const data = JSON.parse(json) as SerializedFile;

  if (data.type !== 'hpsim') {
    throw new Error('Invalid file format: not an HPSim JSON file');
  }

  if (!data.net || !data.net.places || !data.net.transitions || !data.net.arcs) {
    throw new Error('Invalid file format: missing required net data');
  }

  if (!data.net.annotations) {
    data.net.annotations = {};
  }

  return data.net;
}

// ── Binary .hps format (HOldPetriSim compatibility) ────────────────

export function serializeBinaryHps(net: PetriNet): ArrayBuffer {
  return writeHpsFile(net);
}

export function deserializeBinaryHps(buffer: ArrayBuffer): PetriNet {
  return parseHpsFile(buffer);
}

// ── Auto-detect format and deserialize ─────────────────────────────

export function deserializeAuto(buffer: ArrayBuffer): PetriNet {
  const detectedBinary = isBinaryHps(buffer);

  if (detectedBinary) {
    // Try binary first, fall back to JSON if it fails
    try {
      return deserializeBinaryHps(buffer);
    } catch (binaryErr) {
      try {
        const text = new TextDecoder('utf-8').decode(buffer);
        return deserializeJSON(text);
      } catch {
        // Binary was the detected format, throw its error
        throw binaryErr;
      }
    }
  }

  // Try JSON first, fall back to binary if it fails
  try {
    const text = new TextDecoder('utf-8').decode(buffer);
    return deserializeJSON(text);
  } catch (jsonErr) {
    try {
      return deserializeBinaryHps(buffer);
    } catch {
      // JSON was the detected format, throw its error
      throw jsonErr;
    }
  }
}

// ── Legacy aliases for backward compat ─────────────────────────────

export const serialize = serializeJSON;
export const deserialize = deserializeJSON;

// ── File I/O helpers ───────────────────────────────────────────────

export function downloadFile(content: string, filename: string, mimeType: string = 'application/json;charset=utf-8') {
  const blob = new Blob([new TextEncoder().encode(content)], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadBinaryFile(buffer: ArrayBuffer, filename: string) {
  const blob = new Blob([buffer], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

export function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}
