import type { PetriNet } from '@/types/petriNet';
import { parseHpsFile } from './hpsParser';
import { writeHpsFile } from './hpsWriter';

// ── Binary .hps format (HOldPetriSim compatibility) ────────────────

export function serializeBinaryHps(net: PetriNet): ArrayBuffer {
  return writeHpsFile(net);
}

export function deserializeAuto(buffer: ArrayBuffer): PetriNet {
  return parseHpsFile(buffer);
}

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

export function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}
