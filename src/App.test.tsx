import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { demoGame } from "./data/demoGame";

describe("App", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "/");
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);

        if (url === "/api/games/demo-hudebni-riskuj") {
          return Response.json(demoGame);
        }

        if (url === "/api/audio-assets") {
          return Response.json([]);
        }

        return new Response("not found", { status: 404 });
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("zobrazí český titulek hudebního kvízu", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "Riskuj — hudební kvíz" })
    ).toBeInTheDocument();
  });

  it("zobrazí admin editor na /admin", async () => {
    window.history.pushState({}, "", "/admin");

    render(<App />);

    expect(
      await screen.findByRole("heading", { name: "Editor hry" })
    ).toBeInTheDocument();
  });
});
