import type { BunPlugin } from "bun";

// Bun's HTML bundler leaves new URL(..., import.meta.url) worker references
// as filesystem URLs. Adapt only the preview; installed source stays portable.
export default {
  name: "preview-code-workers",
  setup(build) {
    build.onLoad({ filter: /[/\\]code[/\\]hooks[/\\]use-code-runtime\.ts$/ }, async ({ path }) => ({
      contents: (await Bun.file(path).text()).replace(
        /new URL\("\.\/(python|javascript)-runtime\.worker\.ts", import\.meta\.url\)/g,
        'new URL("/workers/$1-runtime.worker.js", window.location.href)',
      ),
      loader: "ts",
    }));
  },
} satisfies BunPlugin;
