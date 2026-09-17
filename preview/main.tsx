import { useState } from "react";
import { createRoot } from "react-dom/client";
import { InputGroup } from "@/components/ui/input-group";
import { TypeScriptEditor } from "@/registry/code/ui/language-editors";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  blockDemos,
  type BlockDemo,
  type PreviewFile,
} from "./registry-preview";
import "./styles/build.css";

function Demo({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-5">
      <div className="flex max-w-3xl flex-col gap-2">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {description && (
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="relative min-h-[420px] overflow-hidden rounded-xl border bg-background p-3 sm:p-6">
        {children}
      </div>
    </div>
  );
}

function CodePanel({
  file,
  defaultOpen = false,
}: {
  file: PreviewFile;
  defaultOpen?: boolean;
}) {
  const [code, setCode] = useState(file.source);
  const [cursor, setCursor] = useState({ line: 1, column: 1 });
  const [expanded, setExpanded] = useState(false);

  return (
    <details open={defaultOpen} className="group min-w-0">
      <summary className="flex cursor-pointer items-center justify-between gap-4 bg-muted/30 px-4 py-3 text-sm select-none transition-colors hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-ring focus-visible:-outline-offset-2">
        <code className="min-w-0 break-all text-xs text-muted-foreground">{file.path}</code>
        <span className="text-muted-foreground/60 text-xs group-open:hidden">
          show
        </span>
        <span className="hidden text-muted-foreground/60 text-xs group-open:inline">
          hide
        </span>
      </summary>
      {expanded && (
        <button
          aria-label="Collapse editor"
          className="fixed inset-0 z-40 cursor-default bg-background/80 backdrop-blur-sm"
          onClick={() => setExpanded(false)}
          type="button"
        />
      )}
      <div className={expanded ? "fixed inset-4 z-50" : "border-t"}>
        <InputGroup className={expanded ? "h-full bg-background" : "rounded-none border-0"}>
          <TypeScriptEditor
            busy={false}
            code={code}
            cursor={cursor}
            expanded={expanded}
            fileName={file.path}
            onChange={setCode}
            onCursorChange={setCursor}
            onToggleExpanded={() => setExpanded((current) => !current)}
            runtimeLabel="TypeScript"
          />
        </InputGroup>
      </div>
    </details>
  );
}

function BlockSection({ demo }: { demo: BlockDemo }) {
  return (
    <section className="flex min-w-0 flex-col gap-4">
      <Demo title={demo.title} description={demo.description}>
        {demo.Component ? (
          <demo.Component />
        ) : (
          <p className="text-muted-foreground flex h-full items-center justify-center p-8 text-center text-sm">
            Source available below. This item needs props or a server host; use
            its demo when available.
          </p>
        )}
      </Demo>
      <div className="min-w-0 overflow-hidden rounded-xl border divide-y">
        {demo.files.map((file, index) => (
          <CodePanel key={file.path} file={file} defaultOpen={index === 0} />
        ))}
      </div>
    </section>
  );
}

function App() {
  const areas = [...new Set(blockDemos.map((demo) => demo.area))];

  return (
    <div className="mx-auto flex min-h-svh max-w-6xl flex-col px-4 pb-16 antialiased sm:px-8">
      <header className="flex flex-col gap-4 border-b py-12 sm:py-16">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">edcn registry</h1>
        <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
          A custom registry for distributing code using shadcn.
        </p>
      </header>
      <Tabs defaultValue={areas[0]} className="min-w-0 flex-1 gap-10 pt-6">
        <div className="overflow-x-auto pb-1">
          <TabsList aria-label="Registry areas">
            {areas.map((area) => (
              <TabsTrigger key={area} value={area}>
                {area.charAt(0).toUpperCase() + area.slice(1)}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <main className="min-w-0">
          {areas.map((area) => (
            <TabsContent
              key={area}
              value={area}
              keepMounted
              className="data-[hidden]:hidden"
            >
              <div className="flex flex-col gap-14 sm:gap-16">
                {blockDemos
                  .filter((demo) => demo.area === area)
                  .sort((a, b) => Number(!!b.Component) - Number(!!a.Component))
                  .map((demo) => (
                    <BlockSection key={demo.name} demo={demo} />
                  ))}
              </div>
            </TabsContent>
          ))}
        </main>
      </Tabs>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
