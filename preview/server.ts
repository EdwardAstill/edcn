import index from "./index.html";

const server = Bun.serve({
  port: Number(process.env.PORT) || 3000,
  development: true,
  routes: {
    "/": index,
    // Serve generated registry JSON from public/r (e.g. /r/registry.json)
    "/r/*": { dir: "./public/r" },
    "/workers/:name": async (request) => {
      const name = request.params.name;
      if (!/^(python|javascript)-runtime\.worker\.js$/.test(name)) {
        return new Response("Not found", { status: 404 });
      }
      const result = await Bun.build({
        entrypoints: [new URL(`../registry/code/hooks/${name.replace(/\.js$/, ".ts")}`, import.meta.url).pathname],
        target: "browser",
      });
      if (!result.success) {
        console.error(result.logs);
        return new Response("Worker build failed", { status: 500 });
      }
      return new Response(result.outputs[0], {
        headers: { "Content-Type": "text/javascript", "Cache-Control": "no-store" },
      });
    },
  },
});

console.log(`Registry preview running at http://localhost:${server.port}`);

export { server };
