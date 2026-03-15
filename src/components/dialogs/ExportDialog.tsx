'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useStore } from '@/store/useStore';
import { PLACE_RADIUS, TRANSITION_WIDTH, TRANSITION_HEIGHT } from '@/lib/constants';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Read a CSS custom property from the document root and resolve it
 * to an actual color string that works outside the page.
 */
function resolveVar(varName: string): string {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  if (!raw) return '#000000';

  // oklch values don't work in SVG style blocks in all renderers,
  // so we resolve them via a temporary element
  const tmp = document.createElement('div');
  tmp.style.color = raw;
  document.body.appendChild(tmp);
  const resolved = getComputedStyle(tmp).color;
  document.body.removeChild(tmp);
  return resolved;
}

/**
 * Build a <style> block that defines all the Tailwind utility classes
 * used in our SVG with explicit, resolved color values.
 */
function buildExportStyleBlock(): string {
  const fg = resolveVar('--foreground');
  const bg = resolveVar('--background');
  const mutedFg = resolveVar('--muted-foreground');

  return `
    .fill-foreground { fill: ${fg} !important; }
    .fill-background { fill: ${bg} !important; }
    .fill-muted-foreground { fill: ${mutedFg} !important; }
    .stroke-foreground { stroke: ${fg} !important; }
    .fill-muted-foreground\\/50 { fill: ${mutedFg}; opacity: 0.5; }
    text { font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
  `;
}

/**
 * Calculate a tight bounding box from the Zustand store data
 * (not from DOM getBBox which can be unreliable).
 */
function getContentBBoxFromStore(): { x: number; y: number; width: number; height: number } | null {
  const net = useStore.getState().net;

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  let hasContent = false;

  for (const place of Object.values(net.places)) {
    hasContent = true;
    const labelHalfW = Math.max(PLACE_RADIUS, place.label.length * 4);
    minX = Math.min(minX, place.position.x - labelHalfW);
    minY = Math.min(minY, place.position.y - PLACE_RADIUS);
    maxX = Math.max(maxX, place.position.x + labelHalfW);
    maxY = Math.max(maxY, place.position.y + PLACE_RADIUS + 50);
  }

  const halfTW = TRANSITION_WIDTH / 2;
  const halfTH = TRANSITION_HEIGHT / 2;
  for (const tr of Object.values(net.transitions)) {
    hasContent = true;
    const labelHalfW = Math.max(halfTW, tr.label.length * 4);
    minX = Math.min(minX, tr.position.x - labelHalfW);
    minY = Math.min(minY, tr.position.y - halfTH);
    maxX = Math.max(maxX, tr.position.x + labelHalfW);
    maxY = Math.max(maxY, tr.position.y + halfTH + 50);
  }

  for (const ann of Object.values(net.annotations)) {
    if (!ann.text) continue;
    hasContent = true;
    const halfW = Math.max(80, ann.text.length * 4);
    minX = Math.min(minX, ann.position.x - halfW);
    minY = Math.min(minY, ann.position.y - 14);
    maxX = Math.max(maxX, ann.position.x + halfW);
    maxY = Math.max(maxY, ann.position.y + 14);
  }

  for (const arc of Object.values(net.arcs)) {
    for (const bp of arc.bendPoints) {
      minX = Math.min(minX, bp.x);
      minY = Math.min(minY, bp.y);
      maxX = Math.max(maxX, bp.x);
      maxY = Math.max(maxY, bp.y);
    }
  }

  if (!hasContent) return null;

  const pad = 60;
  return {
    x: minX - pad,
    y: minY - pad,
    width: (maxX - minX) + pad * 2,
    height: (maxY - minY) + pad * 2,
  };
}

export function ExportDialog({ open, onOpenChange }: ExportDialogProps) {
  const [format, setFormat] = useState<'svg' | 'png'>('png');
  const [scale, setScale] = useState('2');

  const handleFormatChange = (value: string | null) => {
    if (value) setFormat(value as 'svg' | 'png');
  };

  const handleScaleChange = (value: string | null) => {
    if (value) setScale(value);
  };

  const handleExport = async () => {
    const netName = useStore.getState().net.name || 'petri-net';
    const baseName = netName.replace(/\.hps$/i, '').replace(/[^\w\s-]/g, '').trim() || 'petri-net';
    const svgElement = document.querySelector('svg.w-full.h-full') as SVGSVGElement | null;
    if (!svgElement) {
      toast.error('No canvas found to export');
      return;
    }

    const contentBox = getContentBBoxFromStore();
    if (!contentBox) {
      toast.error('Nothing to export');
      return;
    }

    // Clone SVG
    const clone = svgElement.cloneNode(true) as SVGSVGElement;
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    // Remove grid elements and grid defs
    clone.querySelectorAll('use').forEach((el) => el.remove());
    // Remove grid-related patterns/rects from defs
    clone.querySelectorAll('#grid-minor, #grid-major, #grid-bg').forEach((el) => el.remove());

    // Inject a <style> block with resolved CSS variable values
    const styleEl = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    styleEl.textContent = buildExportStyleBlock();
    clone.insertBefore(styleEl, clone.firstChild);

    // Remove pan/zoom transform and set viewBox to content
    const gTransform = clone.querySelector('g[transform]');
    if (gTransform) {
      gTransform.setAttribute('transform', '');
    }
    clone.setAttribute('viewBox', `${contentBox.x} ${contentBox.y} ${contentBox.width} ${contentBox.height}`);
    clone.setAttribute('width', String(Math.round(contentBox.width)));
    clone.setAttribute('height', String(Math.round(contentBox.height)));
    clone.removeAttribute('class');
    clone.removeAttribute('style');

    // Add background rect
    const bg = resolveVar('--background');
    const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bgRect.setAttribute('x', String(contentBox.x));
    bgRect.setAttribute('y', String(contentBox.y));
    bgRect.setAttribute('width', String(contentBox.width));
    bgRect.setAttribute('height', String(contentBox.height));
    bgRect.setAttribute('fill', bg);
    if (gTransform) {
      gTransform.insertBefore(bgRect, gTransform.firstChild);
    }

    const w = Math.round(contentBox.width);
    const h = Math.round(contentBox.height);

    if (format === 'svg') {
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(clone);
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${baseName}.svg`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('SVG exported successfully');
    } else {
      try {
        const pixelRatio = parseInt(scale);
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(clone);
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = URL.createObjectURL(svgBlob);

        await new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = w * pixelRatio;
            canvas.height = h * pixelRatio;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              reject(new Error('Could not create canvas context'));
              return;
            }

            // Fill background
            ctx.fillStyle = bg;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            canvas.toBlob((blob) => {
              if (!blob) {
                reject(new Error('Failed to create PNG'));
                return;
              }
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${baseName}.png`;
              a.click();
              URL.revokeObjectURL(url);
              resolve();
            }, 'image/png');
          };
          img.onerror = () => reject(new Error('Failed to render SVG'));
          img.src = svgUrl;
        });

        URL.revokeObjectURL(svgUrl);
        toast.success(`PNG exported at ${scale}x resolution`);
      } catch (err) {
        toast.error('Export failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
      }
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Export Image</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Format</Label>
            <Select value={format} onValueChange={handleFormatChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="png">PNG (raster)</SelectItem>
                <SelectItem value="svg">SVG (vector)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {format === 'png' && (
            <div className="space-y-2">
              <Label>Resolution Scale</Label>
              <Select value={scale} onValueChange={handleScaleChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1x (standard)</SelectItem>
                  <SelectItem value="2">2x (retina)</SelectItem>
                  <SelectItem value="3">3x (high-res)</SelectItem>
                  <SelectItem value="4">4x (print)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <Separator />

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleExport}>Export</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
