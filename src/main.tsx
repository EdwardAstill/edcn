import { createRoot } from "react-dom/client";
import { HelloWorld } from "@/registry/base-nova/blocks/hello-world/hello-world";
import { ExampleForm } from "@/registry/base-nova/blocks/example-form/example-form";
import { ExampleCard } from "@/registry/base-nova/blocks/example-with-css/example-card";
import { PokemonGrid } from "./pokemon-grid";
import "../styles/build.css";

function Demo({
  title,
  minHeight,
  children,
}: {
  title: string;
  minHeight: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-[450px] flex-col gap-4 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm text-muted-foreground sm:pl-3">{title}</h2>
      </div>
      <div
        className="relative flex min-h-[400px] items-center justify-center"
        style={{ minHeight }}
      >
        {children}
      </div>
    </div>
  );
}

function App() {
  return (
    <div className="mx-auto flex min-h-svh max-w-3xl flex-col gap-8 px-4 py-8 antialiased">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Base UI Registry</h1>
        <p className="text-muted-foreground">
          A custom registry for distributing code using shadcn.
        </p>
      </header>
      <main className="flex flex-1 flex-col gap-8">
        <Demo title="A simple hello world component" minHeight="400px">
          <HelloWorld />
        </Demo>
        <Demo title="A contact form with Zod validation." minHeight="500px">
          <ExampleForm />
        </Demo>
        <Demo
          title="A complex component showing hooks, libs and components."
          minHeight="400px"
        >
          <PokemonGrid />
        </Demo>
        <Demo title="A login form with a CSS file." minHeight="400px">
          <ExampleCard />
        </Demo>
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
