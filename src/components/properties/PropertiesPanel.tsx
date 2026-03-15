'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { useTranslation } from '@/lib/i18n';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ArcType } from '@/types/petriNet';

function NumericInput({ value, min = 0, onCommit }: { value: number; min?: number; onCommit: (v: number) => void }) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => { setDraft(String(value)); }, [value]);
  return (
    <Input
      type="number"
      min={min}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        const parsed = parseInt(draft);
        const final = isNaN(parsed) ? min : Math.max(min, parsed);
        onCommit(final);
        setDraft(String(final));
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          (e.target as HTMLInputElement).blur();
        }
      }}
      className="h-8 text-sm"
    />
  );
}

export function PropertiesPanel() {
  const { t } = useTranslation();
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
      <div data-tour="properties" className="hidden md:block w-60 border-l bg-card p-3">
        <Badge variant="secondary" className="mb-2">{t('props.simulationMode')}</Badge>
        <p className="text-sm text-muted-foreground">{t('props.readOnly')}</p>
      </div>
    );
  }

  if (selectedIds.length === 0) {
    return (
      <ScrollArea data-tour="properties" className="hidden md:block w-60 border-l bg-card">
        <div className="p-3 space-y-3">
          <h3 className="font-semibold text-sm">{t('props.netProperties')}</h3>
          <div className="space-y-2">
            <Label className="text-xs">{t('props.name')}</Label>
            <Input
              value={net.name}
              onChange={(e) => {
                useStore.setState((s) => { s.net.name = e.target.value; });
              }}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">{t('props.description')}</Label>
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
              <span>{t('props.places')}</span>
              <Badge variant="outline" className="text-xs h-5">{Object.keys(net.places).length}</Badge>
            </div>
            <div className="flex justify-between">
              <span>{t('props.transitions')}</span>
              <Badge variant="outline" className="text-xs h-5">{Object.keys(net.transitions).length}</Badge>
            </div>
            <div className="flex justify-between">
              <span>{t('props.arcs')}</span>
              <Badge variant="outline" className="text-xs h-5">{Object.keys(net.arcs).length}</Badge>
            </div>
          </div>
        </div>
      </ScrollArea>
    );
  }

  if (selectedIds.length > 1) {
    return (
      <div data-tour="properties" className="hidden md:block w-60 border-l bg-card p-3">
        <Badge variant="secondary">{selectedIds.length} {t('props.selected')}</Badge>
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
      <ScrollArea data-tour="properties" className="hidden md:block w-60 border-l bg-card">
        <div className="p-3 space-y-3">
          <div className="space-y-1">
            <h3 className="font-semibold text-sm">{t('props.place')}</h3>
            <p className="text-xs text-muted-foreground break-words">{place.label}</p>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">{t('props.label')}</Label>
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
            <Label className="text-xs">{t('props.initialTokens')}</Label>
            <NumericInput value={place.tokens} min={0} onCommit={(v) => { pushSnapshot(); updatePlace(id, { tokens: v }); }} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">{t('props.capacity')}</Label>
            <NumericInput value={place.capacity} min={0} onCommit={(v) => { pushSnapshot(); updatePlace(id, { capacity: v }); }} />
          </div>
          <Separator />
          <div className="text-xs text-muted-foreground">
            <p>{t('props.position')}: ({Math.round(place.position.x)}, {Math.round(place.position.y)})</p>
          </div>
        </div>
      </ScrollArea>
    );
  }

  if (transition) {
    return (
      <ScrollArea data-tour="properties" className="hidden md:block w-60 border-l bg-card">
        <div className="p-3 space-y-3">
          <div className="space-y-1">
            <h3 className="font-semibold text-sm">{t('props.transition')}</h3>
            <p className="text-xs text-muted-foreground break-words">{transition.label}</p>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">{t('props.label')}</Label>
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
            <Label className="text-xs">{t('props.delay')}</Label>
            <NumericInput value={transition.delay} min={0} onCommit={(v) => { pushSnapshot(); updateTransition(id, { delay: v }); }} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">{t('props.priority')}</Label>
            <NumericInput value={transition.priority} min={0} onCommit={(v) => { pushSnapshot(); updateTransition(id, { priority: v }); }} />
          </div>
          <Separator />
          <div className="text-xs text-muted-foreground">
            <p>{t('props.position')}: ({Math.round(transition.position.x)}, {Math.round(transition.position.y)})</p>
          </div>
        </div>
      </ScrollArea>
    );
  }

  if (arc) {
    return (
      <ScrollArea data-tour="properties" className="hidden md:block w-60 border-l bg-card">
        <div className="p-3 space-y-3">
          <h3 className="font-semibold text-sm">{t('props.arc')}</h3>
          <div className="space-y-2">
            <Label className="text-xs">{t('props.weight')}</Label>
            <NumericInput value={arc.weight} min={1} onCommit={(v) => { pushSnapshot(); updateArc(id, { weight: v }); }} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">{t('props.type')}</Label>
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
                <SelectItem value="normal">{t('props.type.normal')}</SelectItem>
                <SelectItem value="inhibitor">{t('props.type.inhibitor')}</SelectItem>
                <SelectItem value="read">{t('props.type.read')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <div className="text-xs text-muted-foreground">
            <p>{t('props.bendPoints')}: {arc.bendPoints.length}</p>
          </div>
        </div>
      </ScrollArea>
    );
  }

  if (annotation) {
    return (
      <ScrollArea data-tour="properties" className="hidden md:block w-60 border-l bg-card">
        <div className="p-3 space-y-3">
          <h3 className="font-semibold text-sm">{t('props.annotation')}</h3>
          <div className="space-y-2">
            <Label className="text-xs">{t('props.text')}</Label>
            <Textarea
              value={annotation.text || ''}
              onChange={(e) => {
                pushSnapshot();
                updateAnnotation(id, { text: e.target.value });
              }}
              className="text-sm min-h-[60px]"
              placeholder={t('props.textPlaceholder')}
            />
          </div>
          <Separator />
          <div className="text-xs text-muted-foreground">
            <p>{t('props.position')}: ({Math.round(annotation.position.x)}, {Math.round(annotation.position.y)})</p>
          </div>
        </div>
      </ScrollArea>
    );
  }

  return (
    <div data-tour="properties" className="hidden md:block w-60 border-l bg-card p-3">
      <p className="text-sm text-muted-foreground">{t('props.noProperties')}</p>
    </div>
  );
}
