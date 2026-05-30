import {
  fireEvent,
  render,
  screen,
  waitFor,
  within
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { demoGame } from "../data/demoGame";
import PlayPage from "./PlayPage";

describe("PlayPage", () => {
  beforeEach(() => {
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

  it("načte uloženou hru z backendu", async () => {
    render(<PlayPage gameId="demo-hudebni-riskuj" />);

    expect(
      await screen.findByRole("heading", { name: demoGame.title })
    ).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith("/api/games/demo-hudebni-riskuj");
  });

  it("odpovědi, názvy skladeb, interpreti a poznámky nejsou v DOM před answer reveal", async () => {
    render(<PlayPage gameId="demo-hudebni-riskuj" />);

    await screen.findByRole("heading", { name: demoGame.title });

    expect(screen.queryByText("Ivan Mládek")).not.toBeInTheDocument();
    expect(screen.queryByText("Bohemian Rhapsody")).not.toBeInTheDocument();
    expect(screen.queryByText("Queen")).not.toBeInTheDocument();
    expect(screen.queryByText(/Uznat/i)).not.toBeInTheDocument();
  });

  it("Enter odhalí prompt a druhý Enter odpověď pro běžnou otázku", async () => {
    render(<PlayPage gameId="demo-hudebni-riskuj" />);

    await screen.findByRole("heading", { name: demoGame.title });
    fireEvent.click(screen.getByRole("button", { name: /Český pop za 100/i }));

    expect(screen.queryByText(/Která zpěvačka/i)).not.toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Enter" });
    expect(await screen.findByText(/Která zpěvačka/i)).toBeInTheDocument();
    expect(screen.queryByText("Kabát")).not.toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Enter" });
    expect(await screen.findByText("Kabát")).toBeInTheDocument();
  });

  it("zobrazí audio u poslechové položky bez úniku názvu a interpreta před odpovědí", async () => {
    render(<PlayPage gameId="demo-hudebni-riskuj" />);

    await screen.findByRole("heading", { name: demoGame.title });
    fireEvent.click(screen.getByRole("button", { name: /Poslech za 100/i }));
    fireEvent.keyDown(window, { key: "Enter" });

    expect(await screen.findByLabelText("Přehrát audio ukázku")).toBeInTheDocument();
    expect(screen.queryByText("Bohemian Rhapsody")).not.toBeInTheDocument();
    expect(screen.queryByText("Queen")).not.toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Enter" });
    expect(await screen.findByText(/Bohemian Rhapsody/i)).toBeInTheDocument();
    expect(screen.getByText(/Queen/i)).toBeInTheDocument();
  });

  it("umožní ručně přičíst body vybranému týmu po odhalení odpovědi", async () => {
    render(<PlayPage gameId="demo-hudebni-riskuj" />);

    await screen.findByRole("heading", { name: demoGame.title });
    fireEvent.click(screen.getByRole("button", { name: /Český pop za 100/i }));
    fireEvent.keyDown(window, { key: "Enter" });
    fireEvent.keyDown(window, { key: "Enter" });

    fireEvent.change(screen.getByLabelText("Bodovaný tým"), {
      target: { value: "team-1" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Správně" }));

    const scoreboard = screen.getByRole("region", { name: "Skóre týmů" });
    expect(within(scoreboard).getByText("Tým 1")).toBeInTheDocument();
    expect(within(scoreboard).getByText("100")).toBeInTheDocument();
  });

  it("odhaluje nápovědy společného jmenovatele a finální odpověď až ve fázi odpovědi", async () => {
    render(<PlayPage gameId="demo-hudebni-riskuj" />);

    await screen.findByRole("heading", { name: demoGame.title });
    fireEvent.click(
      screen.getByRole("button", { name: /Společný jmenovatel/i })
    );

    expect(screen.queryByText(/Finální odpověď/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Písně se zvířetem v názvu/i)).not.toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Enter" });
    expect(await screen.findByText(/Nápověda 1/i)).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Enter" });
    await waitFor(() => {
      expect(screen.getByText(/Finální odpověď/i)).toBeInTheDocument();
    });
  });
});
