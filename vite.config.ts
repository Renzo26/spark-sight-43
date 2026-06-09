// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  // Deploy fora do Lovable (VPS/Docker): BUILD_TARGET=node gera um servidor Node
  // standalone em `.output/server/index.mjs` (preset node-server do Nitro).
  // Dentro do Lovable o preset é forçado para Cloudflare e isto é ignorado.
  ...(process.env.BUILD_TARGET === "node" ? { nitro: { preset: "node-server" } } : {}),
});
