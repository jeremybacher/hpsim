'use client';

import { useStore } from '@/store/useStore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ArcType } from '@/types/petriNet';

export function PropertiesPanel() {
  const net = useStore((s) => s.net);
  const selectedIds = useStore((s) => s.selectedIds);
  const updatePlace = useStore((s) => s.updatePlace);
  const updateTransition = useStore((s) => s.updateTransition);
  const updateArc = useStore((s) => s.updateArc);
  const updateAnnotation = useStore((s) => s.updateAnnotation);
  const pushSnapshot = useStore((s) => s.pushSnapshot);
  const mode = useStore((s) => s.mode);

  if (mode !== 'edit') {
    return (
      <div className="hidden md:block w-60 border-l bg-card p-3">
        <Badge variant="secondary" className="mb-2">Simulation Mode</Badge>
        <p className="text-sm text-muted-foreground">Properties are read-only during simulation.</p>
      </div>
    );
  }

  if (selectedIds.length === 0) {
    return (
      <ScrollArea className="hidden md:block w-60 border-l bg-card">
        <div className="p-3 space-y-3">
          <h3 className="font-semibold text-sm">Net Properties</h3>
          <div className="space-y-2">
            <Label className="text-xs">Name</Label>
            <Input
              value={net.name}
              onChange={(e) => {
                useStore.setState((s) => { s.net.name = e.target.value; });
              }}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Description</Label>
            <Textarea
              value={net.description}
              onChange={(e) => {
                useStore.setState((s) => { s.net.description = e.target.value; });
              }}
              className="text-sm min-h-[60px]"
            />
          </div>
          <Separator />
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>Places</span>
              <Badge variant="outline" className="text-xs h-5">{Object.keys(net.places).length}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Transitions</span>
              <Badge variant="outline" className="text-xs h-5">{Object.keys(net.transitions).length}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Arcs</span>
              <Badge variant="outline" className="text-xs h-5">{Object.keys(net.arcs).length}</Badge>
            </div>
          </div>
        </div>
      </ScrollArea>
    );
  }

  if (selectedIds.length > 1) {
    return (
      <div className="hidden md:block w-60 border-l bg-card p-3">
        <Badge variant="secondary">{selectedIds.length} selected</Badge>
      </div>
    );
  }

  const id = selectedIds[0];
  const place = net.places[id];
  const transition = net.transitions[id];
  const arc = net.arcs[id];
  const annotation = net.annotations[id];

  if (place) {
    return (
      <ScrollArea className="hidden md:block w-60 border-l bg-card">
        <div className="p-3 space-y-3">
          <div className="space-y-1">
            <h3 className="font-semibold text-sm">Place</h3>
            <p className="text-xs text-muted-foreground break-words">{place.label}</p>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Label</Label>
            <Input
              value={place.label}
              onChange={(e) => {
                pushSnapshot();
                updatePlace(id, { label: e.target.value });
              }}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Initial Tokens</Label>
            <Input
              type="number"
              min={0}
              value={place.tokens}
              onChange={(e) => {
                pushSnapshot();
                updatePlace(id, { tokens: Math.max(0, parseInt(e.target.value) || 0) });
              }}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Capacity (0 = unlimited)</Label>
            <Input
              type="number"
              min={0}
              value={place.capacity}
              onChange={(e) => {
                pushSnapshot();
                updatePlace(id, { capacity: Math.max(0, parseInt(e.target.value) || 0) });
              }}
              className="h-8 text-sm"
            />
          </div>
          <Separator />
          <div className="text-xs text-muted-foreground">
            <p>Position: ({Math.round(place.position.x)}, {Math.round(place.position.y)})</p>
          </div>
        </div>
      </ScrollArea>
    );
  }

  if (transition) {
    return (
      <ScrollArea className="hidden md:block w-60 border-l bg-card">
        <div className="p-3 space-y-3">
          <div className="space-y-1">
            <h3 className="font-semibold text-sm">Transition</h3>
            <p className="text-xs text-muted-foreground break-words">{transition.label}</p>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Label</Label>
            <Input
              value={transition.label}
              onChange={(e) => {
                pushSnapshot();
                updateTransition(id, { label: e.target.value });
              }}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Delay (ms)</Label>
            <Input
              type="number"
              min={0}
              value={transition.delay}
              onChange={(e) => {
                pushSnapshot();
                updateTransition(id, { delay: Math.max(0, parseInt(e.target.value) || 0) });
              }}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Priority</Label>
            <Input
              type="number"
              min={0}
              value={transition.priority}
              onChange={(e) => {
                pushSnapshot();
                updateTransition(id, { priority: Math.max(0, parseInt(e.target.value) || 0) });
              }}
              className="h-8 text-sm"
            />
          </div>
          <Separator />
          <div className="text-xs text-muted-foreground">
            <p>Position: ({Math.round(transition.position.x)}, {Math.round(transition.position.y)})</p>
          </div>
        </div>
      </ScrollArea>
    );
  }

  if (arc) {
    return (
      <ScrollArea className="hidden md:block w-60 border-l bg-card">
        <div className="p-3 space-y-3">
          <h3 className="font-semibold text-sm">Arc</h3>
          <div className="space-y-2">
            <Label className="text-xs">Weight</Label>
            <Input
              type="number"
              min={1}
              value={arc.weight}
              onChange={(e) => {
                pushSnapshot();
                updateArc(id, { weight: Math.max(1, parseInt(e.target.value) || 1) });
              }}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Type</Label>
            <Select
              value={arc.arcType}
              onValueChange={(value) => {
                if (!value) return;
                pushSnapshot();
                updateArc(id, { arcType: value as ArcType });
              }}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="inhibitor">Inhibitor</SelectItem>
                <SelectItem value="read">Read</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <div className="text-xs text-muted-foreground">
            <p>Bend points: {arc.bendPoints.length}</p>
          </div>
        </div>
      </ScrollArea>
    );
  }

  if (annotation) {
    return (
      <ScrollArea className="hidden md:block w-60 border-l bg-card">
        <div className="p-3 space-y-3">
          <h3 className="font-semibold text-sm">Text Annotation</h3>
          <div className="space-y-2">
            <Label className="text-xs">Text</Label>
            <Textarea
              value={annotation.text || ''}
              onChange={(e) => {
                pushSnapshot();
                updateAnnotation(id, { text: e.target.value });
              }}
              className="text-sm min-h-[60px]"
              placeholder="Enter annotation text..."
            />
          </div>
          <Separator />
          <div className="text-xs text-muted-foreground">
            <p>Position: ({Math.round(annotation.position.x)}, {Math.round(annotation.position.y)})</p>
          </div>
        </div>
      </ScrollArea>
    );
  }

  return (
    <div className="hidden md:block w-60 border-l bg-card p-3">
      <p className="text-sm text-muted-foreground">No properties available.</p>
    </div>
  );
}
