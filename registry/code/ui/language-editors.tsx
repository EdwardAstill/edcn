import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import type { ComponentType } from "react";

import {
    CodeInput,
    CodeOutput,
    CopyButton,
    EnlargeButton,
    type EditorResult,
    RunButton,
} from "./editor-primitives";
import { InputGroupAddon, InputGroupText } from "@/components/ui/input-group";
import type { Language } from "@/registry/code/hooks/use-code-runtime";

const pythonExtensions = [python()];
const javaScriptExtensions = [javascript()];
const typeScriptExtensions = [javascript({ typescript: true })];

export type LanguageEditorProps = {
    busy: boolean;
    code: string;
    cursor: { line: number; column: number };
    expanded: boolean;
    fileName: string;
    result?: EditorResult;
    runtimeLabel: string;
    onChange: (code: string) => void;
    onCursorChange: (cursor: { line: number; column: number }) => void;
    onRun: () => void;
    onToggleExpanded: () => void;
};

type ConfiguredEditorProps = LanguageEditorProps & {
    extensions: ReturnType<typeof python>[];
    language: string;
    placeholder: string;
};

function LanguageEditor({
    busy,
    code,
    cursor,
    expanded,
    extensions,
    fileName,
    language,
    onChange,
    onCursorChange,
    onRun,
    onToggleExpanded,
    placeholder,
    result,
    runtimeLabel,
}: ConfiguredEditorProps) {
    return (
        <>
            <CodeInput
                busy={busy}
                code={code}
                expanded={expanded}
                extensions={extensions}
                language={language}
                onChange={onChange}
                onCursorChange={onCursorChange}
                onRun={onRun}
                placeholder={placeholder}
            />
            <CodeOutput
                fileName={fileName}
                result={result}
                runningLabel={runtimeLabel}
            />
            <InputGroupAddon align="block-end" className="border-t">
                <InputGroupText>
                    Line {cursor.line}, Column {cursor.column}
                </InputGroupText>
                <InputGroupText className="ml-2 hidden sm:inline-flex">
                    {runtimeLabel}
                </InputGroupText>
                <div className="ml-auto flex items-center gap-1">
                    <CopyButton code={code} fileName={fileName} />
                    <EnlargeButton
                        expanded={expanded}
                        onToggle={onToggleExpanded}
                    />
                    <RunButton busy={busy} fileName={fileName} onRun={onRun} />
                </div>
            </InputGroupAddon>
        </>
    );
}

export function PythonEditor(props: LanguageEditorProps) {
    return (
        <LanguageEditor
            {...props}
            extensions={pythonExtensions}
            language="Python"
            placeholder={'# Start writing Python…\nprint("Hello, world!")'}
        />
    );
}

export function JavaScriptEditor(props: LanguageEditorProps) {
    return (
        <LanguageEditor
            {...props}
            extensions={javaScriptExtensions}
            language="JavaScript"
            placeholder={
                '// Start writing JavaScript…\nconsole.log("Hello, world!")'
            }
        />
    );
}

export function TypeScriptEditor(props: LanguageEditorProps) {
    return (
        <LanguageEditor
            {...props}
            extensions={typeScriptExtensions}
            language="TypeScript"
            placeholder={
                '// Start writing TypeScript…\nconsole.log("Hello, world!")'
            }
        />
    );
}

export const languageEditors: Record<
    Language,
    ComponentType<LanguageEditorProps>
> = {
    python: PythonEditor,
    javascript: JavaScriptEditor,
    typescript: TypeScriptEditor,
};
