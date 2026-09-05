import { expect, test } from "bun:test";
import { dirname, resolve } from "node:path";

import manifest from "../../registry/code/registry.json";
import workerPlugin from "../../preview/worker-plugin";

test("worker URLs resolve in source and in the installed registry layout", async () => {
  const runtime = manifest.items.find((item) => item.name === "use-code-runtime")!;
  const hook = runtime.files.find((file) => file.type === "registry:hook")!;
  const area = new URL("../../registry/code/", import.meta.url).pathname;
  const source = await Bun.file(resolve(area, hook.path)).text();
  const references = [...source.matchAll(/new URL\("([^"]+)", import\.meta\.url\)/g)];
  expect(references).toHaveLength(2);

  for (const [, relative] of references) {
    const sourcePath = resolve(area, dirname(hook.path), relative);
    expect(await Bun.file(sourcePath).exists()).toBe(true);
    const worker = runtime.files.find((file) => resolve(area, file.path) === sourcePath)!;
    expect(worker).toBeDefined();
    expect(resolve(dirname(hook.target), relative)).toBe(resolve(worker.target));
  }
});

test("preview bundling replaces filesystem worker URLs with HTTP endpoints", async () => {
  const result = await Bun.build({
    entrypoints: [new URL("../../registry/code/hooks/use-code-runtime.ts", import.meta.url).pathname],
    target: "browser",
    plugins: [workerPlugin],
  });
  expect(result.success).toBe(true);
  const bundle = await result.outputs[0].text();
  expect(bundle).toContain("/workers/python-runtime.worker.js");
  expect(bundle).toContain("/workers/javascript-runtime.worker.js");
  expect(bundle).not.toContain("file://");
});
