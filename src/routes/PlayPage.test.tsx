import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { demoGame } from "../data/demoGame";
import PlayPage from "./PlayPage";

const playSfxMock = vi.hoisted(() => vi.fn());

vi.mock("../audio/sfx", () => ({
  playSfx: playSfxMock
}));

const presenterEffects = {
  questionSelected: { id: "effect-select", src: "/uploads/effect-select.mp3", title: "select" },
  questionOpened: { id: "effect-open", src: "/uploads/effect-open.mp3", title: "open" },
  answerRevealed: { id: "effect-answer", src: "/uploads/effect-answer.mp3", title: "answer" },
  correctAnswer: { id: "effect-correct", src: "/uploads/effect-correct.mp3", title: "correct" },
  wrongAnswer: { id: "effect-wrong", src: "/uploads/effect-wrong.mp3", title: "wrong" },
  placementRevealed: { id: "effect-place", src: "/uploads/effect-place.mp3", title: "place" },
  firstPlaceRevealed: { id: "effect-first", src: "/uploads/effect-first.mp3", title: "first" }
};

function stubGame(game: typeof demoGame) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      if (String(input) === "/api/games/riskuj-2026-06-06") {
        return Response.json(game);
      }

      return new Response("not found", { status: 404 });
    })
  );
}

describe("PlayPage", () => {
  beforeEach(() => {
    playSfxMock.mockClear();
    stubGame(demoGame);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });


  it("v presenteru ukazuje jen titul Riskuj a přepínače kol v jednom horním řádku", async () => {
    render(<PlayPage gameId="riskuj-2026-06-06" />);

    const heading = await screen.findByRole("heading", { name: "Riskuj!" });
    const header = heading.closest("header");
    expect(header).not.toBeNull();
    expect(within(header as HTMLElement).queryByText("6.6.")).not.toBeInTheDocument();
    expect(within(header as HTMLElement).queryByRole("button", { name: "Zpět ze hry" })).not.toBeInTheDocument();
    expect(within(header as HTMLElement).getByRole("button", { name: "Konec" })).toBeInTheDocument();
    expect(within(header as HTMLElement).getByRole("button", { name: "Admin" })).toBeInTheDocument();

    const roundTabs = within(header as HTMLElement).getByRole("tablist", { name: "Kola soutěže" });
    expect(within(roundTabs).getByRole("tab", { name: "1" })).toHaveAttribute("aria-selected", "true");
    expect(within(roundTabs).getByRole("tab", { name: "2" })).toHaveAttribute("aria-selected", "false");
    expect(within(roundTabs).getByRole("tab", { name: "3" })).toHaveAttribute("aria-selected", "false");
  });

  it("neopakuje přepínače kol pod headerem, pod titulkem zůstává jen skóre týmů", async () => {
    render(<PlayPage gameId="riskuj-2026-06-06" />);

    await screen.findByRole("heading", { name: "Riskuj!" });
    expect(screen.getAllByRole("tablist", { name: "Kola soutěže" })).toHaveLength(1);
    expect(screen.getByRole("region", { name: "Skóre týmů" })).toBeInTheDocument();
  });

  it("zobrazuje vždy jen jedno soutěžní kolo a přepíná ho tlačítky 1 2 3", async () => {
    render(<PlayPage gameId="riskuj-2026-06-06" />);

    await screen.findByRole("heading", { name: "Riskuj!" });
    expect(screen.getByRole("heading", { name: /1\. kolo/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /2\. kolo/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /3\. kolo/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "2" }));
    expect(screen.queryByRole("heading", { name: /1\. kolo/i })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /2\. kolo/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "3" }));
    expect(screen.queryByRole("heading", { name: /2\. kolo/i })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /3\. kolo/i })).toBeInTheDocument();
  });

  it("odpovědi nejsou v presenter DOM před explicitním odkrytím", async () => {
    render(<PlayPage gameId="riskuj-2026-06-06" />);

    await screen.findByRole("heading", { name: "Riskuj!" });

    expect(document.body.textContent).not.toContain("The B-52s");
    expect(document.body.textContent).not.toContain("Kate Bush");
    expect(document.body.textContent).not.toContain("Running Up That Hill");
    expect(document.body.textContent).not.toContain("HUMAN");
  });

  it("první klik dlaždici ztmaví, druhý klik otevře otázku v dialogu a tlačítko odhalí odpověď", async () => {
    render(<PlayPage gameId="riskuj-2026-06-06" />);

    await screen.findByRole("heading", { name: "Riskuj!" });
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

    const team1Button = within(dialog).getByRole("button", {
      name: "Tým 1"
    });
    expect(within(dialog).queryByText(/Přičíst Tým 1/i)).not.toBeInTheDocument();
    expect(within(dialog).queryAllByRole("button", { name: /1 000 Kč/i })).toHaveLength(0);
    expect(team1Button).toHaveStyle({ backgroundColor: demoGame.teams[0].color });
    fireEvent.click(team1Button);

    const scoreboard = screen.getByRole("region", { name: "Skóre týmů" });
    expect(within(scoreboard).getByText("1 000 Kč")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Hudební otázky 1 za 1 000 Kč/i })).toHaveAttribute(
      "data-state",
      "awarded"
    );
  });

  it("přehrává zapnuté zvukové efekty pro označení, otevření, odpověď a skórování", async () => {
    stubGame({
      ...demoGame,
      soundEffects: {
        enabled: true,
        effects: presenterEffects
      }
    });

    render(<PlayPage gameId="riskuj-2026-06-06" />);

    await screen.findByRole("heading", { name: "Riskuj!" });
    const tile = screen.getByRole("button", { name: /Hudební otázky 1 za 1 000 Kč/i });

    fireEvent.click(tile);
    expect(playSfxMock).toHaveBeenLastCalledWith(presenterEffects.questionSelected);

    fireEvent.click(tile);
    expect(playSfxMock).toHaveBeenLastCalledWith(presenterEffects.questionOpened);

    const dialog = await screen.findByRole("dialog", { name: /Otázka za 1 000 Kč/i });
    fireEvent.click(within(dialog).getByRole("button", { name: "Zobrazit odpověď" }));
    expect(playSfxMock).toHaveBeenLastCalledWith(presenterEffects.answerRevealed);

    fireEvent.click(within(dialog).getByRole("button", { name: "Tým 1" }));
    expect(playSfxMock).toHaveBeenLastCalledWith(presenterEffects.correctAnswer);
  });

  it("přehrává zvuk pro špatnou odpověď a respektuje vypnuté efekty", async () => {
    stubGame({
      ...demoGame,
      soundEffects: {
        enabled: true,
        effects: presenterEffects
      }
    });

    render(<PlayPage gameId="riskuj-2026-06-06" />);

    await screen.findByRole("heading", { name: "Riskuj!" });
    const tile = screen.getByRole("button", { name: /Hudební otázky 1 za 1 000 Kč/i });
    fireEvent.click(tile);
    fireEvent.click(tile);
    fireEvent.click(await screen.findByRole("button", { name: "Zobrazit odpověď" }));
    fireEvent.click(
      within(await screen.findByRole("dialog", { name: /Otázka za 1 000 Kč/i })).getByRole(
        "button",
        { name: "Nikdo neuhodl" }
      )
    );

    expect(playSfxMock).toHaveBeenLastCalledWith(presenterEffects.wrongAnswer);

    playSfxMock.mockClear();
    stubGame({
      ...demoGame,
      soundEffects: {
        enabled: false,
        effects: presenterEffects
      }
    });

    render(<PlayPage gameId="riskuj-2026-06-06" />);

    await screen.findAllByRole("heading", { name: "Riskuj!" });
    fireEvent.click(screen.getAllByRole("button", { name: /Hudební otázky 1 za 1 000 Kč/i })[1]);
    expect(playSfxMock).not.toHaveBeenCalled();
  });

  it("finální dialog odkrývá pořadí od posledního po první a používá zvláštní efekt pro vítěze", async () => {
    stubGame({
      ...demoGame,
      soundEffects: {
        enabled: true,
        effects: presenterEffects
      }
    });

    render(<PlayPage gameId="riskuj-2026-06-06" />);

    await screen.findByRole("heading", { name: "Riskuj!" });
    const tile = screen.getByRole("button", { name: /Hudební otázky 1 za 1 000 Kč/i });
    fireEvent.click(tile);
    fireEvent.click(tile);
    fireEvent.click(await screen.findByRole("button", { name: "Zobrazit odpověď" }));
    fireEvent.click(
      within(await screen.findByRole("dialog", { name: /Otázka za 1 000 Kč/i })).getByRole(
        "button",
        { name: "Tým 1" }
      )
    );

    fireEvent.click(screen.getByRole("button", { name: "Konec" }));
    const finalDialog = await screen.findByRole("dialog", { name: "Konečné pořadí" });
    expect(within(finalDialog).getByText("Postupně odkryjte umístění od posledního místa.")).toBeInTheDocument();

    fireEvent.click(within(finalDialog).getByRole("button", { name: "Odkrýt další umístění" }));
    expect(within(finalDialog).getByText("2. místo")).toBeInTheDocument();
    expect(within(finalDialog).getAllByText("0 Kč")).toHaveLength(1);
    expect(within(finalDialog).getByText("Tým 2")).toBeInTheDocument();
    expect(playSfxMock).toHaveBeenLastCalledWith(presenterEffects.placementRevealed);

    fireEvent.click(within(finalDialog).getByRole("button", { name: "Odkrýt další umístění" }));
    expect(within(finalDialog).getByText("1. místo")).toBeInTheDocument();
    expect(within(finalDialog).getByText("Tým 1")).toBeInTheDocument();
    expect(playSfxMock).toHaveBeenLastCalledWith(presenterEffects.firstPlaceRevealed);
  });


  it("umožní označit otázku jako neuhodnutou a později opravit přiřazení jinému týmu", async () => {
    render(<PlayPage gameId="riskuj-2026-06-06" />);

    await screen.findByRole("heading", { name: "Riskuj!" });
    const tile = screen.getByRole("button", { name: /Hudební otázky 1 za 1 000 Kč/i });

    fireEvent.click(tile);
    fireEvent.click(tile);
    fireEvent.click(await screen.findByRole("button", { name: "Zobrazit odpověď" }));

    const firstDialog = await screen.findByRole("dialog", { name: /Otázka za 1 000 Kč/i });
    fireEvent.click(within(firstDialog).getByRole("button", { name: "Nikdo neuhodl" }));

    expect(tile).toHaveAttribute("data-state", "unanswered");
    const scoreboard = screen.getByRole("region", { name: "Skóre týmů" });
    expect(within(scoreboard).getAllByText("0 Kč")).toHaveLength(6);

    fireEvent.click(tile);
    const correctionDialog = await screen.findByRole("dialog", { name: /Otázka za 1 000 Kč/i });
    expect(within(correctionDialog).getByText(/The B-52s/i)).toBeInTheDocument();
    fireEvent.click(
      within(correctionDialog).getByRole("button", { name: "Tým 2" })
    );

    expect(within(scoreboard).getByText("1 000 Kč")).toBeInTheDocument();
    expect(tile).toHaveAttribute("data-state", "awarded");
  });

  it("přeřazení správné odpovědi odečte body původnímu týmu a přičte je novému", async () => {
    render(<PlayPage gameId="riskuj-2026-06-06" />);

    await screen.findByRole("heading", { name: "Riskuj!" });
    const tile = screen.getByRole("button", { name: /Hudební otázky 1 za 1 000 Kč/i });

    fireEvent.click(tile);
    fireEvent.click(tile);
    fireEvent.click(await screen.findByRole("button", { name: "Zobrazit odpověď" }));
    fireEvent.click(
      within(await screen.findByRole("dialog", { name: /Otázka za 1 000 Kč/i })).getByRole(
        "button",
        { name: "Tým 1" }
      )
    );

    fireEvent.click(tile);
    fireEvent.click(
      within(await screen.findByRole("dialog", { name: /Otázka za 1 000 Kč/i })).getByRole(
        "button",
        { name: "Tým 2" }
      )
    );

    const scoreboard = screen.getByRole("region", { name: "Skóre týmů" });
    expect(within(scoreboard).getAllByText("0 Kč")).toHaveLength(5);
    expect(within(scoreboard).getByText("1 000 Kč")).toBeInTheDocument();
  });

  it("Enter po kliknutí na focused dlaždici zůstane na otázce a nevybere dlaždici znovu", async () => {
    render(<PlayPage gameId="riskuj-2026-06-06" />);

    await screen.findByRole("heading", { name: "Riskuj!" });
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

  it("neuhodnutá otázka skóre nemění", async () => {
    render(<PlayPage gameId="riskuj-2026-06-06" />);

    await screen.findByRole("heading", { name: "Riskuj!" });
    fireEvent.click(screen.getByRole("button", { name: /Hudební otázky 1 za 10 000 Kč/i }));
    fireEvent.keyDown(window, { key: "Enter" });
    fireEvent.keyDown(window, { key: "Enter" });
    fireEvent.click(screen.getByRole("button", { name: "Nikdo neuhodl" }));

    const scoreboard = screen.getByRole("region", { name: "Skóre týmů" });
    expect(within(scoreboard).getAllByText("0 Kč")).toHaveLength(6);
  });

  it("poslech přehraje MP3 a odpověď odhalí až po Enter", async () => {
    render(<PlayPage gameId="riskuj-2026-06-06" />);

    await screen.findByRole("heading", { name: "Riskuj!" });
    fireEvent.click(screen.getByRole("tab", { name: "2" }));
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

    await screen.findByRole("heading", { name: "Riskuj!" });
    fireEvent.click(screen.getByRole("tab", { name: "3" }));
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

