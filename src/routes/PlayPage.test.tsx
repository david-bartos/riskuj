import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { demoGame } from "../data/demoGame";
import PlayPage from "./PlayPage";

const playSfxMock = vi.hoisted(() => vi.fn());

vi.mock("../audio/sfx", () => ({
  playSfx: playSfxMock
}));

describe("PlayPage", () => {
  beforeEach(() => {
    playSfxMock.mockClear();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        if (String(input) === "/api/games/riskuj-2026-06-06") {
          return Response.json(demoGame);
        }

        return new Response("not found", { status: 404 });
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("odpovědi nejsou v presenter DOM před explicitním odkrytím", async () => {
    render(<PlayPage gameId="riskuj-2026-06-06" />);

    await screen.findByRole("heading", { name: demoGame.title });

    expect(document.body.textContent).not.toContain(
      "Doplnit správnou odpověď podle finálního zadání."
    );
    expect(document.body.textContent).not.toContain("Doplnit interpret 1");
    expect(document.body.textContent).not.toContain("Doplnit název skladby 1");
    expect(document.body.textContent).not.toContain("Doplnit odpověď 1");
    expect(document.body.textContent).not.toContain("Obsah otázky není v dostupném");
  });

  it("Enter posune otázku přes zadání, odpověď a správné skórování", async () => {
    render(<PlayPage gameId="riskuj-2026-06-06" />);

    await screen.findByRole("heading", { name: demoGame.title });
    fireEvent.click(screen.getByRole("button", { name: /Hudební otázky 1 za 1 000 Kč/i }));

    expect(screen.getByText("Dlaždice je vybraná")).toBeInTheDocument();
    expect(screen.queryByText(/Doplnit otázku 1/i)).not.toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Enter" });
    expect(await screen.findByText(/Doplnit otázku 1/i)).toBeInTheDocument();
    expect(screen.queryByText("Doplnit správnou odpověď podle finálního zadání.")).not.toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Enter" });
    expect(
      await screen.findByText("Doplnit správnou odpověď podle finálního zadání.")
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Správně" }));

    const scoreboard = screen.getByRole("region", { name: "Skóre týmů" });
    expect(within(scoreboard).getByText("1 000 Kč")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Hudební otázky 1 za 1 000 Kč/i })).toBeDisabled();
  });

  it("špatná odpověď skóre nemění", async () => {
    render(<PlayPage gameId="riskuj-2026-06-06" />);

    await screen.findByRole("heading", { name: demoGame.title });
    fireEvent.click(screen.getByRole("button", { name: /Hudební otázky 1 za 10 000 Kč/i }));
    fireEvent.keyDown(window, { key: "Enter" });
    fireEvent.keyDown(window, { key: "Enter" });
    fireEvent.click(screen.getByRole("button", { name: "Špatně" }));

    const scoreboard = screen.getByRole("region", { name: "Skóre týmů" });
    expect(within(scoreboard).getAllByText("0 Kč")).toHaveLength(6);
  });

  it("poslech přehraje MP3 a odpověď odhalí až po Enter", async () => {
    render(<PlayPage gameId="riskuj-2026-06-06" />);

    await screen.findByRole("heading", { name: demoGame.title });
    fireEvent.click(screen.getAllByRole("button", { name: /Pop: poslech/i })[0]);
    fireEvent.keyDown(window, { key: "Enter" });

    expect(await screen.findByLabelText("Přehrát audio ukázku")).toHaveAttribute(
      "src",
      "/uploads/riskuj-66-listen-01.mp3"
    );
    expect(document.body.textContent).not.toContain("Doplnit interpret 1");
    expect(document.body.textContent).not.toContain("Doplnit název skladby 1");

    fireEvent.keyDown(window, { key: "Enter" });
    expect(await screen.findByText(/Doplnit interpret 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Doplnit název skladby 1/i)).toBeInTheDocument();
  });

  it("společný jmenovatel odhalí finální odpověď až po Enter", async () => {
    render(<PlayPage gameId="riskuj-2026-06-06" />);

    await screen.findByRole("heading", { name: demoGame.title });
    fireEvent.click(screen.getByRole("button", { name: /Společný jmenovatel 1/i }));
    fireEvent.keyDown(window, { key: "Enter" });

    expect(await screen.findByText("Doplnit indicii 2 pro společný jmenovatel 1.")).toBeInTheDocument();
    expect(document.body.textContent).not.toContain("Doplnit odpověď 1");

    fireEvent.keyDown(window, { key: "Enter" });
    expect(await screen.findByText("Doplnit odpověď 1")).toBeInTheDocument();
  });
});
