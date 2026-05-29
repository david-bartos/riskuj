import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const apiPort = process.env.PORT ?? "3001";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": `http://localhost:${apiPort}`
    }
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.ts"
  }
});
