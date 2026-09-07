import { useState } from "react";

import { InputGroup } from "@/components/ui/input-group";
import { PlainTextEditor } from "@/registry/code/ui/language-editors";
export const description =
  "Plain-text editing with copy and enlarge controls; no runtime required.";

export function PlainTextDemo() {
  const [code, setCode] = useState("Write or paste any text here.\nNo language or runtime is required.");
  const [cursor, setCursor] = useState({ line: 1, column: 1 });
  const [expanded, setExpanded] = useState(false);

  return (
    <main className="flex min-h-svh justify-center bg-background px-4 py-10 text-foreground sm:py-16">
      {expanded ? (
        <button
          aria-label="Collapse editor"
          className="fixed inset-0 z-40 cursor-default bg-background/80 backdrop-blur-sm"
          onClick={() => setExpanded(false)}
          type="button"
        />
      ) : null}
      <div
        className="w-full max-w-3xl"
        style={
          expanded
            ? {
                inset: "1rem",
                maxWidth: "none",
                position: "fixed",
                width: "auto",
                zIndex: 50,
              }
            : undefined
        }
      >
        <InputGroup className={expanded ? "h-full" : undefined}>
          <PlainTextEditor
            code={code}
            cursor={cursor}
            expanded={expanded}
            fileName="code"
            onChange={setCode}
            onCursorChange={setCursor}
            onToggleExpanded={() => setExpanded((current) => !current)}
          />
        </InputGroup>
      </div>
    </main>
  );
}
