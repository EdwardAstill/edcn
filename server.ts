import index from "./index.html";

const server = Bun.serve({
  port: Number(process.env.PORT) || 3000,
  development: true,
  routes: {
    "/": index,
    // Serve generated registry JSON from public/r (e.g. /r/registry.json)
    "/r/*": { dir: "./public/r" },
  },
});

console.log(`Registry preview running at http://localhost:${server.port}`);

export { server };
