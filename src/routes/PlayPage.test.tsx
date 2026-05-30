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

    expect(screen.queryByText("Karel Gott")).not.toBeInTheDocument();
    expect(screen.queryByText("Bohemian Rhapsody")).not.toBeInTheDocument();
    expect(screen.queryByText("Queen")).not.toBeInTheDocument();
    expect(screen.queryByText(/Uznat/i)).not.toBeInTheDocument();
  });

  it("Enter odhalí prompt a druhý Enter odpověď pro běžnou otázku", async () => {
    render(<PlayPage gameId="demo-hudebni-riskuj" />);

    await screen.findByRole("heading", { name: demoGame.title });
    fireEvent.click(screen.getByRole("button", { name: /České hity za 100/i }));

    expect(screen.queryByText(/Lady Carneval/i)).not.toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Enter" });
    expect(await screen.findByText(/Lady Carneval/i)).toBeInTheDocument();
    expect(screen.queryByText("Karel Gott")).not.toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Enter" });
    expect(await screen.findByText("Karel Gott")).toBeInTheDocument();
  });

  it("zobrazí audio u poslechové položky bez úniku názvu a interpreta před odpovědí", async () => {
    render(<PlayPage gameId="demo-hudebni-riskuj" />);

    await screen.findByRole("heading", { name: demoGame.title });
    fireEvent.click(screen.getByRole("button", { name: /Poslech za 100/i }));
    fireEvent.keyDown(window, { key: "Enter" });

    expect(await screen.findByLabelText("Přehrát audio ukázku")).toBeInTheDocument();
    expect(screen.queryByText("Shallow")).not.toBeInTheDocument();
    expect(screen.queryByText("Lady Gaga a Bradley Cooper")).not.toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Enter" });
    expect(await screen.findByText(/Shallow/i)).toBeInTheDocument();
    expect(screen.getByText(/Lady Gaga a Bradley Cooper/i)).toBeInTheDocument();
  });

  it("před odhalením odpovědi nevykreslí původní název uploadu do audio src", async () => {
    const gameWithUploadedAudio = structuredClone(demoGame);
    const listeningRound = gameWithUploadedAudio.rounds.find(
      (round) => round.type === "listening"
    );
    if (!listeningRound || listeningRound.type !== "listening") {
      throw new Error("Missing listening round in test fixture");
    }

    const updatedListeningItem = {
      ...listeningRound.tracks[0],
      audio: {
        id: "uploaded-secret-track",
        src: "/uploads/11111111-1111-4111-8111-111111111111.mp3",
        title: "Hudební ukázka",
        originalName: "Queen - Bohemian Rhapsody.mp3",
        displayName: "Hudební ukázka",
        mimeType: "audio/mpeg" as const
      },
      trackTitleAnswer: "Bohemian Rhapsody",
      artistAnswer: "Queen"
    };
    listeningRound.tracks[0] = updatedListeningItem;
    listeningRound.items = [updatedListeningItem, ...listeningRound.tracks.slice(1)];

    vi.mocked(fetch).mockImplementationOnce(async () =>
      Response.json(gameWithUploadedAudio)
    );

    render(<PlayPage gameId="demo-hudebni-riskuj" />);

    await screen.findByRole("heading", { name: demoGame.title });
    fireEvent.click(screen.getByRole("button", { name: /Poslech za 100/i }));
    fireEvent.keyDown(window, { key: "Enter" });

    const audio = await screen.findByLabelText("Přehrát audio ukázku");
    expect(audio).toHaveAttribute(
      "src",
      "/uploads/11111111-1111-4111-8111-111111111111.mp3"
    );
    expect(audio.getAttribute("src")?.toLowerCase()).not.toContain("queen");
    expect(audio.getAttribute("src")?.toLowerCase()).not.toContain("bohemian");
    expect(document.body.textContent).not.toContain("Queen");
    expect(document.body.textContent).not.toContain("Bohemian Rhapsody");
  });

  it("umožní ručně přičíst body vybranému týmu po odhalení odpovědi", async () => {
    render(<PlayPage gameId="demo-hudebni-riskuj" />);

    await screen.findByRole("heading", { name: demoGame.title });
    fireEvent.click(screen.getByRole("button", { name: /České hity za 100/i }));
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

  it("neumožní znovu vybrat dokončenou položku z tabule", async () => {
    render(<PlayPage gameId="demo-hudebni-riskuj" />);

    await screen.findByRole("heading", { name: demoGame.title });
    const tile = screen.getByRole("button", { name: /České hity za 100/i });
    fireEvent.click(tile);
    fireEvent.keyDown(window, { key: "Enter" });
    fireEvent.keyDown(window, { key: "Enter" });
    fireEvent.click(screen.getByRole("button", { name: "Zpět na tabuli" }));

    expect(tile).toBeDisabled();

    fireEvent.click(tile);
    fireEvent.keyDown(window, { key: "Enter" });

    expect(screen.queryByText(/Lady Carneval/i)).not.toBeInTheDocument();
  });

  it("odhaluje nápovědy společného jmenovatele a finální odpověď až ve fázi odpovědi", async () => {
    render(<PlayPage gameId="demo-hudebni-riskuj" />);

    await screen.findByRole("heading", { name: demoGame.title });
    fireEvent.click(
      screen.getByRole("button", { name: /Společný jmenovatel/i })
    );

    expect(screen.queryByText(/Finální odpověď/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Queen$/i)).not.toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Enter" });
    expect(await screen.findByText(/Nápověda 1/i)).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Enter" });
    await waitFor(() => {
      expect(screen.getByText(/Finální odpověď/i)).toBeInTheDocument();
    });
  });
});
