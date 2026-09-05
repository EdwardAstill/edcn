import { FileCode2, Plus, RotateCcw, X } from "lucide-react";
import { useRef, useState } from "react";

import type { EditorResult } from "@/registry/code/ui/editor-primitives";
import { languageEditors } from "@/registry/code/ui/language-editors";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
} from "@/components/ui/input-group";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  type Language,
  RuntimeResetError,
  useCodeRuntime,
} from "@/registry/code/hooks/use-code-runtime";

export const description =
  "Runnable code playground: file tabs, rename, run in Pyodide or JS workers, and live output.";

type FileTab = { id: string; name: string; code: string };

const examples: FileTab[] = [
  {
    id: "main",
    name: "main.py",
    code: `from datetime import datetime

name = "Perth"
print(f"Hello, {name}!")
print(datetime.now().strftime("%A, %d %B"))`,
  },
  {
    id: "javascript",
    name: "script.js",
    code: `const values = [12, 18, 23, 31, 42]

console.log("Total:", values.reduce((total, value) => total + value, 0))`,
  },
  {
    id: "typescript",
    name: "types.ts",
    code: `type Person = { name: string; city: string }

const person: Person = { name: "Ada", city: "Perth" }
console.log(\`Hello, \${person.name} from \${person.city}!\`)`,
  },
];

const languageDetails: Record<
  Language,
  { extension: string; label: string; placeholder: string }
> = {
  python: {
    extension: "py",
    label: "Python",
    placeholder: '# Start writing Python…\nprint("Hello, world!")',
  },
  javascript: {
    extension: "js",
    label: "JavaScript",
    placeholder: '// Start writing JavaScript…\nconsole.log("Hello, world!")',
  },
  typescript: {
    extension: "ts",
    label: "TypeScript",
    placeholder: '// Start writing TypeScript…\nconsole.log("Hello, world!")',
  },
};

function getLanguage(filename: string): Language {
  const extension = filename.toLowerCase().split(".").pop();
  if (extension === "js") return "javascript";
  if (extension === "ts") return "typescript";
  return "python";
}

function usesSameRuntime(first: Language, second: Language) {
  return first === "python" ? second === "python" : second !== "python";
}

export function CodeDemo() {
  const [tabs, setTabs] = useState<FileTab[]>(examples);
  const [activeTabId, setActiveTabId] = useState("main");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [results, setResults] = useState<Record<string, EditorResult>>({});
  const [cursor, setCursor] = useState({ line: 1, column: 1 });
  const [expanded, setExpanded] = useState(false);
  const nextTabNumber = useRef(1);
  const { language: runningLanguage, reset, run, status } = useCodeRuntime();

  const activeTab = tabs.find((tab) => tab.id === activeTabId)!;
  const activeLanguage = getLanguage(activeTab.name);
  const ActiveEditor = languageEditors[activeLanguage];
  const language = languageDetails[activeLanguage];
  const result = results[activeTabId];
  const busy = status === "loading" || status === "running";

  const createTab = () => {
    const number = nextTabNumber.current++;
    return {
      id: `untitled-${number}`,
      name: `untitled_${number}.${language.extension}`,
      code: language.placeholder,
    };
  };

  const addTab = () => {
    const tab = createTab();
    setTabs((current) => [...current, tab]);
    setActiveTabId(tab.id);
    setCursor({ line: 1, column: 1 });
  };

  const closeTab = (id: string) => {
    const closedIndex = tabs.findIndex((tab) => tab.id === id);
    let remaining = tabs.filter((tab) => tab.id !== id);
    if (!remaining.length) remaining = [createTab()];

    setTabs(remaining);
    setResults((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
    if (activeTabId === id) {
      setActiveTabId(remaining[Math.min(closedIndex, remaining.length - 1)].id);
      setCursor({ line: 1, column: 1 });
    }
  };

  const startRenaming = (tab: FileTab) => {
    setRenameValue(tab.name);
    setRenamingId(tab.id);
  };

  const commitRename = (id: string) => {
    const name = renameValue.trim();
    if (name) {
      setTabs((current) =>
        current.map((tab) => (tab.id === id ? { ...tab, name } : tab)),
      );
    }
    setRenamingId(null);
  };

  const updateCode = (code: string) => {
    setTabs((current) =>
      current.map((tab) => (tab.id === activeTabId ? { ...tab, code } : tab)),
    );
  };

  const runCode = async () => {
    const tab = activeTab;
    setResults((current) => ({
      ...current,
      [tab.id]: { state: "running", text: "" },
    }));

    try {
      const next = await run(tab.code, getLanguage(tab.name));
      setResults((current) => ({
        ...current,
        [tab.id]: {
          state: "success",
          text: next.output || "Completed without output.",
          durationMs: next.durationMs,
        },
      }));
    } catch (error) {
      if (error instanceof RuntimeResetError) return;
      setResults((current) => ({
        ...current,
        [tab.id]: {
          state: "error",
          text: error instanceof Error ? error.message : String(error),
        },
      }));
    }
  };

  const busyLanguage = runningLanguage
    ? languageDetails[runningLanguage].label
    : language.label;
  const runtimeReady =
    status === "ready" &&
    runningLanguage !== null &&
    usesSameRuntime(activeLanguage, runningLanguage);
  const runtimeLabel =
    status === "loading"
      ? `Loading ${busyLanguage}…`
      : status === "running"
        ? `Running ${busyLanguage}…`
        : runtimeReady
          ? `${language.label} ready`
          : language.label;

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
          <InputGroupAddon align="block-start" className="border-b p-0">
            <Tabs
              className="min-w-0 flex-1 gap-0 overflow-x-auto"
              onValueChange={(id) => {
                setActiveTabId(id);
                setCursor({ line: 1, column: 1 });
              }}
              value={activeTabId}
            >
              <TabsList
                aria-label="Code files"
                className="h-10 gap-0 rounded-none p-0"
                variant="line"
              >
                {tabs.map((tab) => (
                  <div
                    className="relative flex h-10 shrink-0 items-center"
                    key={tab.id}
                  >
                    {renamingId === tab.id ? (
                      <input
                        aria-label={`Rename ${tab.name}`}
                        autoFocus
                        className="mx-1 h-7 w-32 rounded-md bg-transparent px-2 font-mono text-xs text-foreground outline-none ring-1 ring-input focus:ring-ring"
                        onBlur={() => commitRename(tab.id)}
                        onChange={(event) => setRenameValue(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            commitRename(tab.id);
                          }
                          if (event.key === "Escape") setRenamingId(null);
                        }}
                        value={renameValue}
                      />
                    ) : (
                      <TabsTrigger
                        className="h-10 max-w-44 rounded-none px-3 pr-8 font-mono text-xs"
                        onDoubleClick={() => startRenaming(tab)}
                        title="Double-click to rename"
                        value={tab.id}
                      >
                        <FileCode2 className="size-3.5" />
                        <span className="truncate">{tab.name}</span>
                      </TabsTrigger>
                    )}
                    {renamingId !== tab.id ? (
                      <InputGroupButton
                        aria-label={`Close ${tab.name}`}
                        className="absolute right-1 size-6 opacity-55 hover:opacity-100"
                        onClick={() => closeTab(tab.id)}
                        type="button"
                      >
                        <X />
                      </InputGroupButton>
                    ) : null}
                  </div>
                ))}
              </TabsList>
            </Tabs>

            <div className="ml-auto flex shrink-0 items-center gap-1 px-2">
              <InputGroupButton
                aria-label="New tab"
                onClick={addTab}
                type="button"
              >
                <Plus />
              </InputGroupButton>
              <InputGroupButton
                aria-label="Reset code runtime"
                onClick={() => {
                  reset();
                  setResults({});
                }}
                type="button"
              >
                <RotateCcw />
              </InputGroupButton>
            </div>
          </InputGroupAddon>

          <ActiveEditor
            busy={busy}
            code={activeTab.code}
            cursor={cursor}
            expanded={expanded}
            fileName={activeTab.name}
            onChange={updateCode}
            onCursorChange={setCursor}
            onRun={() => void runCode()}
            onToggleExpanded={() => setExpanded((current) => !current)}
            result={result}
            runtimeLabel={runtimeLabel}
          />
        </InputGroup>
      </div>
    </main>
  );
}
