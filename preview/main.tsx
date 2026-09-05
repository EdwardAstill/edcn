import { createRoot } from "react-dom/client";
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
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {description && (
          <p className="text-muted-foreground text-sm">{description}</p>
        )}
      </div>
      <div className="relative min-h-[420px] overflow-hidden rounded-lg border">
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
  return (
    <details open={defaultOpen} className="group rounded-lg border">
      <summary className="flex cursor-pointer items-center justify-between px-4 py-2.5 text-sm select-none hover:bg-muted/50">
        <code className="text-muted-foreground">{file.path}</code>
        <span className="text-muted-foreground/60 text-xs group-open:hidden">
          show
        </span>
        <span className="hidden text-muted-foreground/60 text-xs group-open:inline">
          hide
        </span>
      </summary>
      <pre className="max-h-96 overflow-auto border-t bg-zinc-950 p-4 text-xs leading-relaxed text-zinc-100">
        <code>{file.source}</code>
      </pre>
    </details>
  );
}

function BlockSection({ demo }: { demo: BlockDemo }) {
  return (
    <section className="flex flex-col gap-3">
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
      {demo.files.map((file, index) => (
        <CodePanel key={file.path} file={file} defaultOpen={index === 0} />
      ))}
    </section>
  );
}

function App() {
  const areas = [...new Set(blockDemos.map((demo) => demo.area))];

  return (
    <div className="mx-auto flex min-h-svh max-w-3xl flex-col gap-10 px-4 py-8 antialiased">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">edcn registry</h1>
        <p className="text-muted-foreground">
          A custom registry for distributing code using shadcn.
        </p>
      </header>
      <Tabs defaultValue={areas[0]} className="flex-1 gap-8">
        <TabsList aria-label="Registry areas">
          {areas.map((area) => (
            <TabsTrigger key={area} value={area}>
              {area.charAt(0).toUpperCase() + area.slice(1)}
            </TabsTrigger>
          ))}
        </TabsList>
        <main>
          {areas.map((area) => (
            <TabsContent
              key={area}
              value={area}
              keepMounted
              className="data-[hidden]:hidden"
            >
              <div className="flex flex-col gap-10">
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
