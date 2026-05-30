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

  it("klik na dlaždici otevře prompt a Enter odhalí odpověď pro běžnou otázku", async () => {
    render(<PlayPage gameId="demo-hudebni-riskuj" />);

    await screen.findByRole("heading", { name: demoGame.title });
    fireEvent.click(screen.getByRole("button", { name: /České hity za 100/i }));

    expect(await screen.findByText(/Lady Carneval/i)).toBeInTheDocument();
    expect(screen.queryByText("Karel Gott")).not.toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Enter" });
    expect(await screen.findByText("Karel Gott")).toBeInTheDocument();
  });

  it("zobrazí audio u poslechové položky bez úniku názvu a interpreta před odpovědí", async () => {
    render(<PlayPage gameId="demo-hudebni-riskuj" />);

    await screen.findByRole("heading", { name: demoGame.title });
    fireEvent.click(screen.getByRole("button", { name: /Poslech za 100/i }));

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

    fireEvent.change(screen.getByLabelText("Bodovaný tým"), {
      target: { value: "team-1" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Správně" }));

    const scoreboard = screen.getByRole("region", { name: "Skóre týmů" });
    expect(within(scoreboard).getByText("Tým 1")).toBeInTheDocument();
    expect(within(scoreboard).getByText("100")).toBeInTheDocument();
  });

  it("přehraje zvuk při otevření otázky a správném vyhodnocení", async () => {
    render(<PlayPage gameId="demo-hudebni-riskuj" />);

    await screen.findByRole("heading", { name: demoGame.title });
    fireEvent.click(screen.getByRole("button", { name: /České hity za 100/i }));

    expect(playSfxMock).toHaveBeenCalledWith("open");

    fireEvent.keyDown(window, { key: "Enter" });
    fireEvent.click(screen.getByRole("button", { name: "Správně" }));

    expect(playSfxMock).toHaveBeenCalledWith("correct");
    expect(
      screen.getByRole("button", { name: /České hity za 100/i })
    ).toBeDisabled();
  });

  it("přehraje zvuk při špatném vyhodnocení", async () => {
    render(<PlayPage gameId="demo-hudebni-riskuj" />);

    await screen.findByRole("heading", { name: demoGame.title });
    fireEvent.click(screen.getByRole("button", { name: /Zahraniční rock za 200/i }));
    fireEvent.keyDown(window, { key: "Enter" });
    fireEvent.click(screen.getByRole("button", { name: "Špatně" }));

    expect(playSfxMock).toHaveBeenCalledWith("wrong");
    expect(
      screen.getByRole("button", { name: /Zahraniční rock za 200/i })
    ).toBeDisabled();
  });

  it("umí vypnout zvukové efekty pro moderátora", async () => {
    render(<PlayPage gameId="demo-hudebni-riskuj" />);

    await screen.findByRole("heading", { name: demoGame.title });
    fireEvent.click(screen.getByRole("button", { name: "Zvuk zapnutý" }));
    fireEvent.click(screen.getByRole("button", { name: /České hity za 200/i }));

    expect(playSfxMock).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Zvuk vypnutý" })).toBeInTheDocument();
  });

  it("zobrazí ovládání celé obrazovky v češtině", async () => {
    render(<PlayPage gameId="demo-hudebni-riskuj" />);

    await screen.findByRole("heading", { name: demoGame.title });

    expect(
      screen.getByRole("button", { name: "Celá obrazovka" })
    ).toBeInTheDocument();
  });

  it("neumožní znovu vybrat dokončenou položku z tabule", async () => {
    render(<PlayPage gameId="demo-hudebni-riskuj" />);

    await screen.findByRole("heading", { name: demoGame.title });
    const tile = screen.getByRole("button", { name: /České hity za 100/i });
    fireEvent.click(tile);
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

    expect(await screen.findByText(/Nápověda 1/i)).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Enter" });
    await waitFor(() => {
      expect(screen.getByText(/Finální odpověď/i)).toBeInTheDocument();
    });
  });
});
