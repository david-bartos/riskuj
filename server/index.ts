import express from "express";
import { pathToFileURL } from "node:url";

export function createServer() {
  const app = express();

  app.use(express.json());

  app.get("/api/health", (_request, response) => {
    response.json({ status: "ok" });
  });

  return app;
}

const isDirectRun = process.argv[1]
  ? import.meta.url === pathToFileURL(process.argv[1]).href
  : false;

if (isDirectRun) {
  const port = Number(process.env.PORT ?? 3001);
  const app = createServer();

  app.listen(port, () => {
    console.log(`Riskuj API běží na http://localhost:${port}`);
  });
}
