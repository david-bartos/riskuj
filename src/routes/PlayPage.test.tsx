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
        if (String(input) === "/api/games/demo-hudebni-riskuj") {
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
    render(<PlayPage gameId="demo-hudebni-riskuj" />);

    await screen.findByRole("heading", { name: demoGame.title });

    expect(document.body.textContent).not.toContain("Ivan Mládek");
    expect(document.body.textContent).not.toContain("Lenka Dusilová");
    expect(document.body.textContent).not.toContain("Pro Tebe");
    expect(document.body.textContent).not.toContain("Voda");
    expect(document.body.textContent).not.toContain("Uznat i kapelu Banjo Band.");
  });

  it("Enter posune otázku přes zadání, odpověď a správné skórování", async () => {
    render(<PlayPage gameId="demo-hudebni-riskuj" />);

    await screen.findByRole("heading", { name: demoGame.title });
    fireEvent.click(screen.getByRole("button", { name: /České hity za 1 000 Kč/i }));

    expect(screen.getByText("Dlaždice je vybraná")).toBeInTheDocument();
    expect(screen.queryByText(/Jožin z bažin/i)).not.toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Enter" });
    expect(await screen.findByText(/Jožin z bažin/i)).toBeInTheDocument();
    expect(screen.queryByText("Ivan Mládek")).not.toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Enter" });
    expect(await screen.findByText("Ivan Mládek")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Správně" }));

    const scoreboard = screen.getByRole("region", { name: "Skóre týmů" });
    expect(within(scoreboard).getByText("1 000 Kč")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /České hity za 1 000 Kč/i })).toBeDisabled();
  });

  it("špatná odpověď skóre nemění", async () => {
    render(<PlayPage gameId="demo-hudebni-riskuj" />);

    await screen.findByRole("heading", { name: demoGame.title });
    fireEvent.click(screen.getByRole("button", { name: /Rock za 10 000 Kč/i }));
    fireEvent.keyDown(window, { key: "Enter" });
    fireEvent.keyDown(window, { key: "Enter" });
    fireEvent.click(screen.getByRole("button", { name: "Špatně" }));

    const scoreboard = screen.getByRole("region", { name: "Skóre týmů" });
    expect(within(scoreboard).getAllByText("0 Kč")).toHaveLength(6);
  });

  it("poslech přehraje MP3 a odpověď odhalí až po Enter", async () => {
    render(<PlayPage gameId="demo-hudebni-riskuj" />);

    await screen.findByRole("heading", { name: demoGame.title });
    fireEvent.click(screen.getByRole("button", { name: /CZ pop/i }));
    fireEvent.keyDown(window, { key: "Enter" });

    expect(await screen.findByLabelText("Přehrát audio ukázku")).toHaveAttribute(
      "src",
      "/uploads/demo-placeholder.mp3"
    );
    expect(document.body.textContent).not.toContain("Lenka Dusilová");
    expect(document.body.textContent).not.toContain("Pro Tebe");

    fireEvent.keyDown(window, { key: "Enter" });
    expect(await screen.findByText(/Lenka Dusilová/i)).toBeInTheDocument();
    expect(screen.getByText(/Pro Tebe/i)).toBeInTheDocument();
  });

  it("společný jmenovatel odhalí finální odpověď až po Enter", async () => {
    render(<PlayPage gameId="demo-hudebni-riskuj" />);

    await screen.findByRole("heading", { name: demoGame.title });
    fireEvent.click(screen.getByRole("button", { name: /Společný jmenovatel 1/i }));
    fireEvent.keyDown(window, { key: "Enter" });

    expect(await screen.findByText("Vltava")).toBeInTheDocument();
    expect(document.body.textContent).not.toContain("Voda");

    fireEvent.keyDown(window, { key: "Enter" });
    expect(await screen.findByText("Voda")).toBeInTheDocument();
  });
});
