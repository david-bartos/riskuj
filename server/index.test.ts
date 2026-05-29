import request from "supertest";
import { describe, expect, it } from "vitest";
import { createServer } from "./index";

describe("server", () => {
  it("vrací JSON stav aplikace na /api/health", async () => {
    const app = createServer();

    const response = await request(app).get("/api/health").expect(200);

    expect(response.body).toEqual({ status: "ok" });
    expect(response.headers["content-type"]).toContain("application/json");
  });
});
