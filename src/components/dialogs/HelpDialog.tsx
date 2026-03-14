'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

interface HelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HelpDialog({ open, onOpenChange }: HelpDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl w-[90vw]">
        <DialogHeader>
          <DialogTitle>How HPSim Works</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-4 pr-4 text-sm">
            <section>
              <h4 className="font-semibold mb-1">What is a Petri Net?</h4>
              <p className="text-muted-foreground">
                A Petri net is a mathematical model for describing concurrent systems.
                It consists of <strong>places</strong> (circles), <strong>transitions</strong> (rectangles),
                and <strong>arcs</strong> (arrows) connecting them. Places hold <strong>tokens</strong> (dots)
                that represent resources or conditions.
              </p>
            </section>

            <Separator />

            <section>
              <h4 className="font-semibold mb-1">Building a Net</h4>
              <ul className="text-muted-foreground space-y-1.5 list-disc pl-4">
                <li>Use the <Badge variant="outline" className="text-xs h-5 mx-0.5">Place</Badge> tool to create places (circles) on the canvas.</li>
                <li>Use the <Badge variant="outline" className="text-xs h-5 mx-0.5">Transition</Badge> tool to create transitions (rectangles).</li>
                <li>Use the <Badge variant="outline" className="text-xs h-5 mx-0.5">Arc</Badge> tool to connect places to transitions and vice versa. Click the source, then click the target.</li>
                <li>Use the <Badge variant="outline" className="text-xs h-5 mx-0.5">Token</Badge> tool to add tokens to places. Hold <Badge variant="outline" className="text-xs h-5 mx-0.5">Shift</Badge> to remove.</li>
                <li>Use the <Badge variant="outline" className="text-xs h-5 mx-0.5">Text</Badge> tool to add text annotations to the canvas.</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h4 className="font-semibold mb-1">Editing</h4>
              <ul className="text-muted-foreground space-y-1.5 list-disc pl-4">
                <li>Use the <Badge variant="outline" className="text-xs h-5 mx-0.5">Select</Badge> tool to click and drag elements. Shift+click to multi-select.</li>
                <li>Drag on empty space to rubber-band select multiple elements.</li>
                <li>Select an element and edit its properties in the right panel.</li>
                <li>Hold <Badge variant="outline" className="text-xs h-5 mx-0.5">Space</Badge> and drag to pan the canvas. Scroll to zoom.</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h4 className="font-semibold mb-1">Simulation</h4>
              <p className="text-muted-foreground mb-1.5">
                Go to <strong>Simulation &gt; Start Token Game</strong> to simulate your net interactively.
              </p>
              <ul className="text-muted-foreground space-y-1.5 list-disc pl-4">
                <li><strong>Token Game:</strong> Click enabled transitions (highlighted) to fire them manually. A transition is enabled when all input places have enough tokens.</li>
                <li><strong>Fast Simulation:</strong> Automatically fires transitions as fast as possible, showing statistics.</li>
                <li><strong>Analysis:</strong> View reachability and other properties during simulation.</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h4 className="font-semibold mb-1">File Format</h4>
              <p className="text-muted-foreground">
                HPSim supports both JSON and binary <code>.hps</code> files. Use <strong>File &gt; Save As</strong> to choose
                the format. The binary format is compatible with the desktop HOldPetriSim application.
              </p>
            </section>

            <Separator />

            <section>
              <h4 className="font-semibold mb-1">Arc Types</h4>
              <ul className="text-muted-foreground space-y-1.5 list-disc pl-4">
                <li><strong>Normal:</strong> Consumes tokens from the source place and produces tokens in the target place.</li>
                <li><strong>Inhibitor:</strong> The transition is enabled only when the connected place has <em>no</em> tokens.</li>
                <li><strong>Read:</strong> Tests for tokens without consuming them.</li>
              </ul>
            </section>

            <Separator />

            <p className="text-xs text-muted-foreground pt-1">
              HPSim v1.0 — A web-based Petri net editor and simulator.
            </p>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
