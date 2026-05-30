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

    expect(document.body.textContent).not.toContain("The B-52s");
    expect(document.body.textContent).not.toContain("Kate Bush");
    expect(document.body.textContent).not.toContain("Running Up That Hill");
    expect(document.body.textContent).not.toContain("HUMAN");
  });

  it("první klik dlaždici ztmaví, druhý klik otevře otázku v dialogu a tlačítko odhalí odpověď", async () => {
    render(<PlayPage gameId="riskuj-2026-06-06" />);

    await screen.findByRole("heading", { name: demoGame.title });
    const tile = screen.getByRole("button", { name: /Hudební otázky 1 za 1 000 Kč/i });

    fireEvent.click(tile);

    expect(tile).toHaveAttribute("data-state", "selected");
    expect(screen.queryByRole("dialog", { name: /Otázka za 1 000 Kč/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/Legendární panák B 52/i)).not.toBeInTheDocument();

    fireEvent.click(tile);

    const dialog = await screen.findByRole("dialog", { name: /Otázka za 1 000 Kč/i });
    expect(within(dialog).getByText(/Legendární panák B 52/i)).toBeInTheDocument();
    expect(within(dialog).queryByText(/The B-52s/i)).not.toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: "Zobrazit odpověď" }));
    expect(await within(dialog).findByText(/The B-52s/i)).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: "Správně" }));

    const scoreboard = screen.getByRole("region", { name: "Skóre týmů" });
    expect(within(scoreboard).getByText("1 000 Kč")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Hudební otázky 1 za 1 000 Kč/i })).toBeDisabled();
  });

  it("Enter po kliknutí na focused dlaždici zůstane na otázce a nevybere dlaždici znovu", async () => {
    render(<PlayPage gameId="riskuj-2026-06-06" />);

    await screen.findByRole("heading", { name: demoGame.title });
    const tile = screen.getByRole("button", { name: /Hudební otázky 1 za 1 000 Kč/i });
    fireEvent.click(tile);

    expect(screen.getByText("Dlaždice je vybraná")).toBeInTheDocument();

    const shouldRunDefaultAction = fireEvent.keyDown(tile, { key: "Enter" });
    if (shouldRunDefaultAction) {
      fireEvent.click(tile);
    }

    expect(await screen.findByText(/Legendární panák B 52/i)).toBeInTheDocument();
    expect(screen.queryByText("Dlaždice je vybraná")).not.toBeInTheDocument();
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
    fireEvent.click(screen.getAllByRole("button", { name: /80\. a 90\. léta: poslech/i })[0]);
    fireEvent.keyDown(window, { key: "Enter" });

    expect(await screen.findByLabelText("Přehrát audio ukázku")).toHaveAttribute(
      "src",
      "/uploads/riskuj-66-listen-01.mp3"
    );
    expect(document.body.textContent).not.toContain("Kate Bush");
    expect(document.body.textContent).not.toContain("Running Up That Hill");

    fireEvent.keyDown(window, { key: "Enter" });
    expect(await screen.findByText(/Kate Bush/i)).toBeInTheDocument();
    expect(screen.getByText(/Running Up That Hill/i)).toBeInTheDocument();
  });

  it("společný jmenovatel odhalí finální odpověď až po Enter", async () => {
    render(<PlayPage gameId="riskuj-2026-06-06" />);

    await screen.findByRole("heading", { name: demoGame.title });
    fireEvent.click(screen.getByRole("button", { name: /Společný jmenovatel: Human/i }));
    fireEvent.keyDown(window, { key: "Enter" });

    expect(await screen.findByText("Bruce Springsteen")).toBeInTheDocument();
    expect(screen.queryByText("The Killers")).not.toBeInTheDocument();
    expect(document.body.textContent).not.toContain("HUMAN");

    fireEvent.keyDown(window, { key: "Enter" });
    expect(await screen.findByText("The Killers")).toBeInTheDocument();
    expect(screen.queryByText("Rag’n’Bone Man")).not.toBeInTheDocument();
    expect(document.body.textContent).not.toContain("HUMAN");

    fireEvent.keyDown(window, { key: "Enter" });
    expect(await screen.findByText("Rag’n’Bone Man")).toBeInTheDocument();
    expect(document.body.textContent).not.toContain("HUMAN");

    fireEvent.keyDown(window, { key: "Enter" });
    expect(await screen.findByText("HUMAN")).toBeInTheDocument();
  });
});
