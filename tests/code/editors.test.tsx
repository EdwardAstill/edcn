import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { CodeDemo } from "@/examples/code/code-demo";
import {
  JavaScriptEditor,
  PlainTextEditor,
} from "@/registry/code/ui/language-editors";

const editorProps = {
  code: "arbitrary text <not-markup>",
  cursor: { line: 1, column: 1 },
  expanded: false,
  fileName: "code",
  onChange: () => {},
  onCursorChange: () => {},
  onToggleExpanded: () => {},
};

test("plain text needs no runtime props and keeps copy and enlarge without Run", () => {
  const html = renderToStaticMarkup(<PlainTextEditor {...editorProps} />);
  expect(html).toContain('aria-label="Copy code"');
  expect(html).toContain('aria-label="Enlarge editor"');
  expect(html).toContain("Plain text");
  expect(html).not.toContain('aria-label="Run code"');
  expect(html).not.toContain('role="tab"');
});

test("language editors offer Run only when a run handler is supplied", () => {
  const props = { ...editorProps, busy: false, runtimeLabel: "JavaScript" };
  expect(renderToStaticMarkup(<JavaScriptEditor {...props} />)).not.toContain('aria-label="Run code"');
  expect(renderToStaticMarkup(<JavaScriptEditor {...props} onRun={() => {}} />)).toContain('aria-label="Run code"');
});

test("runnable demo keeps the bottom controls without file management", () => {
  const html = renderToStaticMarkup(<CodeDemo />);
  expect(html).toContain('aria-label="Copy code"');
  expect(html).toContain('aria-label="Run code"');
  expect(html).not.toContain('role="tab"');
  expect(html).not.toContain('aria-label="New tab"');
  expect(html).not.toContain('aria-label="Reset code runtime"');
});
