import CodeMirror from "@uiw/react-codemirror";
import {
    Check,
    Copy,
    CornerDownLeft,
    Maximize2,
    Minimize2,
} from "lucide-react";
import { useState } from "react";

import { InputGroupButton } from "@/components/ui/input-group";
import { cn } from "@/lib/utils";

export type EditorResult = {
    state: "running" | "success" | "error";
    text: string;
    durationMs?: number;
};

type CodeInputProps = {
    code: string;
    expanded: boolean;
    extensions: React.ComponentProps<typeof CodeMirror>["extensions"];
    language: string;
    placeholder: string;
    busy: boolean;
    onChange: (code: string) => void;
    onCursorChange: (cursor: { line: number; column: number }) => void;
    onRun?: () => void;
};

export function CodeInput({
    busy,
    code,
    expanded,
    extensions,
    language,
    onChange,
    onCursorChange,
    onRun,
    placeholder,
}: CodeInputProps) {
    return (
        <div
            className={cn("min-h-0", expanded && "flex-1")}
            onKeyDownCapture={(event) => {
                if (onRun && event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
                    event.preventDefault();
                    if (!busy) onRun();
                }
            }}
        >
            <CodeMirror
                basicSetup={{
                    autocompletion: false,
                    foldGutter: false,
                    highlightActiveLine: false,
                    highlightActiveLineGutter: true,
                    lineNumbers: true,
                }}
                className={cn(
                    "text-sm [&_.cm-content]:py-3 [&_.cm-editor]:bg-transparent [&_.cm-editor]:font-mono [&_.cm-focused]:outline-none [&_.cm-gutters]:border-r [&_.cm-gutters]:border-border [&_.cm-gutters]:bg-muted/30 [&_.cm-gutters]:text-muted-foreground [&_.cm-line]:px-3",
                    expanded && "h-full [&_.cm-editor]:h-full",
                )}
                extensions={extensions}
                height={expanded ? "100%" : "28rem"}
                onChange={onChange}
                onCreateEditor={(view) => {
                    view.contentDOM.setAttribute(
                        "aria-label",
                        `${language} code editor`,
                    );
                }}
                onUpdate={(update) => {
                    if (!update.docChanged && !update.selectionSet) return;
                    const head = update.state.selection.main.head;
                    const line = update.state.doc.lineAt(head);
                    onCursorChange({
                        line: line.number,
                        column: head - line.from + 1,
                    });
                }}
                placeholder={placeholder}
                value={code}
            />
        </div>
    );
}

export function CodeOutput({
    fileName,
    result,
    runningLabel,
}: {
    fileName: string;
    result?: EditorResult;
    runningLabel: string;
}) {
    if (!result) return null;

    return (
        <div
            aria-label={`${fileName} output`}
            aria-live="polite"
            className="max-h-48 shrink-0 overflow-auto border-t bg-muted/30 px-4 py-3"
            role="region"
        >
            <div className="mb-2 flex justify-between text-xs text-muted-foreground">
                <span>Output</span>
                {result.durationMs !== undefined ? (
                    <span>{result.durationMs} ms</span>
                ) : null}
            </div>
            <pre
                className={cn(
                    "font-mono text-xs leading-5 whitespace-pre-wrap",
                    result.state === "error" && "text-destructive",
                )}
            >
                {result.state === "running" ? runningLabel : result.text}
            </pre>
        </div>
    );
}

export function CopyButton({
    code,
    fileName,
}: {
    code: string;
    fileName: string;
}) {
    const [copied, setCopied] = useState(false);

    return (
        <InputGroupButton
            aria-label={`Copy ${fileName}`}
            onClick={async () => {
                try {
                    await navigator.clipboard.writeText(code);
                    setCopied(true);
                    window.setTimeout(() => setCopied(false), 1500);
                } catch {
                    setCopied(false);
                }
            }}
            type="button"
        >
            {copied ? <Check /> : <Copy />}
        </InputGroupButton>
    );
}

export function EnlargeButton({
    expanded,
    onToggle,
}: {
    expanded: boolean;
    onToggle: () => void;
}) {
    return (
        <InputGroupButton
            aria-label={expanded ? "Collapse editor" : "Enlarge editor"}
            onClick={onToggle}
            type="button"
        >
            {expanded ? <Minimize2 /> : <Maximize2 />}
        </InputGroupButton>
    );
}

export function RunButton({
    busy,
    fileName,
    onRun,
}: {
    busy: boolean;
    fileName: string;
    onRun: () => void;
}) {
    return (
        <InputGroupButton
            aria-label={`Run ${fileName}`}
            className="ml-1"
            disabled={busy}
            onClick={onRun}
            size="sm"
            type="button"
            variant="default"
        >
            {busy ? "Running" : "Run"} <CornerDownLeft />
        </InputGroupButton>
    );
}
