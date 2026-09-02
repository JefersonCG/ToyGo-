import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const fromRepoRoot = (path: string) => fileURLToPath(new URL(`../../${path}`, import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@toygo/application": fromRepoRoot("packages/application/src/index.ts"),
      "@toygo/domain": fromRepoRoot("packages/domain/src/index.ts"),
      "@toygo/ui-skins": fromRepoRoot("packages/ui-skins/src/index.ts")
    }
  },
  server: {
    port: 5173,
    strictPort: true
  }
});
