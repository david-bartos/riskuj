import react from "@vitejs/plugin-react";
import type { PluginOption } from "vite";
import { defineConfig } from "vitest/config";
import hostingConfig from "./.openai/hosting.json";
import { sites } from "./build/sites-vite-plugin";

const apiPort = process.env.PORT ?? "3001";
const placeholderDatabaseId = "00000000-0000-4000-8000-000000000000";

export default defineConfig(async ({ command }) => {
  const plugins: PluginOption[] = [...react()];

  if (command === "build") {
    const { cloudflare } = await import("@cloudflare/vite-plugin");
    plugins.push(
      sites(),
      cloudflare({
        viteEnvironment: { name: "server" },
        config: {
          main: "./worker/index.ts",
          compatibility_date: "2026-07-31",
          compatibility_flags: ["nodejs_compat"],
          assets: {
            not_found_handling: "single-page-application",
            run_worker_first: ["/api/*", "/uploads/*", "/healthz"]
          },
          d1_databases: [
            {
              binding: hostingConfig.d1,
              database_name: "riskuj-sites",
              database_id: placeholderDatabaseId
            }
          ],
          r2_buckets: [
            {
              binding: hostingConfig.r2,
              bucket_name: "riskuj-sites-uploads"
            }
          ]
        }
      })
    );
  }

  return {
    plugins,
    server: {
      proxy: {
        "/api": `http://localhost:${apiPort}`,
        "/uploads": `http://localhost:${apiPort}`
      }
    },
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: "./src/test/setup.ts"
    }
  };
});
