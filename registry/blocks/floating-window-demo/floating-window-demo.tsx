import * as React from "react";

import { FloatingWindow } from "@/registry/ui/floating-window";
import { Button } from "@/registry/ui/button";

export function FloatingWindowDemo() {
  return (
    <div className="absolute inset-0">
      <FloatingWindow
        title="Notes"
        defaultPosition={{ x: 16, y: 16 }}
        defaultSize={{ width: 280, height: 170 }}
      >
        <p className="text-sm text-muted-foreground">
          Drag the title bar to move me. Grab any edge or corner to resize.
        </p>
      </FloatingWindow>
      <FloatingWindow
        title="Counter"
        defaultPosition={{ x: 340, y: 60 }}
        defaultSize={{ width: 230, height: 160 }}
        minWidth={190}
        minHeight={130}
      >
        <Counter />
      </FloatingWindow>
    </div>
  );
}

function Counter() {
  const [count, setCount] = React.useState(0);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3">
      <span className="text-2xl font-bold tabular-nums">{count}</span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCount((count) => count - 1)}
        >
          -1
        </Button>
        <Button size="sm" onClick={() => setCount((count) => count + 1)}>
          +1
        </Button>
      </div>
    </div>
  );
}
