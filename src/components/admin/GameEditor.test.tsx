import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import GameEditor, { normalizeGame, prepareGameForSave } from "./GameEditor";
import type { Game } from "../../types/game";
import { riskuj20260606Game } from "../../data/riskuj-2026-06-06";
import { validateGame as validateServerGame } from "../../../server/gameValidation";

const gameFixture: Game = {
  id: "test-game",
  title: "Testovací hra",
  teams: [],
  rounds: [],
  createdAt: "2026-05-30T10:00:00.000Z",
  updatedAt: "2026-05-30T10:00:00.000Z",
  categories: [{ id: "cat-1", title: "Pop" }],
  questions: [
    {
      id: "question-1",
      categoryId: "cat-1",
      points: 100,
      prompt: "Původní otázka",
      answer: "Původní odpověď"
    }
  ],
  listeningGenres: [{ id: "genre-1", title: "Rock" }],
  listeningItems: [
    {
      id: "listen-1",
      genreId: "genre-1",
      title: "Song",
      artist: "Artist",
      prompt: "Poznej skladbu",
      answer: "Song"
    }
  ],
  commonDenominator: {
    answer: "Společná odpověď",
    clues: [{ id: "clue-1", text: "První indicie" }]
  }
};

describe("GameEditor", () => {
  it("umožní z prázdné hry přidat a uložit všechna tři kola", () => {
    const onSave = vi.fn();
    const emptyGame: Game = {
      id: "empty-game",
      title: "Prázdná hra",
      teams: [{ id: "team-a", name: "Tým A" }],
      rounds: []
    };

    render(<GameEditor initialGame={emptyGame} onSave={onSave} />);

    fireEvent.click(screen.getByRole("button", { name: "Přidat kolo" }));
    fireEvent.click(screen.getByRole("button", { name: "Přidat kolo" }));
    fireEvent.click(screen.getByRole("button", { name: "Přidat kolo" }));

    expect(screen.getAllByLabelText("Typ kola")).toHaveLength(3);

    fireEvent.click(screen.getByRole("button", { name: "Přidat poslechový track" }));
    fireEvent.change(screen.getByLabelText("Žánr / sloupec"), { target: { value: "Pop" } });
    fireEvent.change(screen.getByLabelText("Interpret"), { target: { value: "Ewa Farna" } });
    fireEvent.change(screen.getByLabelText("Název skladby"), {
      target: { value: "Měls mě vůbec rád" }
    });

    fireEvent.click(screen.getByRole("button", { name: "Přidat položku" }));
    fireEvent.change(screen.getByLabelText("Clues"), {
      target: { value: "Queen\nABBA\nAqua" }
    });
    fireEvent.change(screen.getByLabelText("Správná odpověď"), {
      target: { value: "Krátké názvy kapel" }
    });
    fireEvent.change(screen.getByLabelText("Vysvětlení pro moderátora"), {
      target: { value: "Všechny clues jsou jednoslovné kapely." }
    });

    fireEvent.click(screen.getByRole("button", { name: "Uložit hru" }));

    const savedGame = onSave.mock.calls[0][0] as Game;
    expect(savedGame.rounds.map((round) => round.type)).toEqual([
      "question",
      "listening",
      "common-denominator"
    ]);
  });

  it("vytvoří poslechový track s audio assetem z prázdné hry", async () => {
    const onSave = vi.fn();
    const emptyGame: Game = {
      id: "empty-game",
      title: "Prázdná hra",
      teams: [{ id: "team-a", name: "Tým A" }],
      rounds: []
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({
          id: "audio-test",
          src: "/uploads/audio-test.mp3",
          title: "audio-test",
          fileName: "audio-test.mp3",
          mimeType: "audio/mpeg"
        })
      })
    );

    render(<GameEditor initialGame={emptyGame} onSave={onSave} />);

    fireEvent.click(screen.getByRole("button", { name: "Přidat kolo" }));
    fireEvent.change(screen.getByLabelText("Typ kola"), { target: { value: "listening" } });
    fireEvent.click(screen.getByRole("button", { name: "Přidat poslechový track" }));

    fireEvent.change(screen.getByLabelText("Žánr / sloupec"), { target: { value: "Pop" } });
    fireEvent.change(screen.getByLabelText("Interpret"), { target: { value: "Ewa Farna" } });
    fireEvent.change(screen.getByLabelText("Název skladby"), {
      target: { value: "Měls mě vůbec rád" }
    });
    fireEvent.change(screen.getByLabelText("MP3 soubor"), {
      target: {
        files: [new File(["ID3"], "audio-test.mp3", { type: "audio/mpeg" })]
      }
    });

    await screen.findByText("/uploads/audio-test.mp3");
    fireEvent.click(screen.getByRole("button", { name: "Uložit hru" }));

    await waitFor(() => expect(onSave).toHaveBeenCalled());
    const savedGame = onSave.mock.calls[0][0] as Game;
    const listeningRound = savedGame.rounds[0];

    expect(listeningRound.type).toBe("listening");
    if (listeningRound.type !== "listening") {
      throw new Error("Expected listening round");
    }
    expect(listeningRound.tracks[0]).toMatchObject({
      artist: "Ewa Farna",
      title: "Měls mě vůbec rád",
      audio: { src: "/uploads/audio-test.mp3" }
    });
  });

  it("vytvoří položku společného jmenovatele z prázdné hry", () => {
    const onSave = vi.fn();
    const emptyGame: Game = {
      id: "empty-game",
      title: "Prázdná hra",
      teams: [{ id: "team-a", name: "Tým A" }],
      rounds: []
    };

    render(<GameEditor initialGame={emptyGame} onSave={onSave} />);

    fireEvent.click(screen.getByRole("button", { name: "Přidat kolo" }));
    fireEvent.change(screen.getByLabelText("Typ kola"), {
      target: { value: "common-denominator" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Přidat položku" }));

    fireEvent.change(screen.getByLabelText("Clues"), {
      target: { value: "Queen\nABBA\nAqua" }
    });
    fireEvent.change(screen.getByLabelText("Správná odpověď"), {
      target: { value: "Krátké názvy kapel" }
    });
    fireEvent.change(screen.getByLabelText("Vysvětlení pro moderátora"), {
      target: { value: "Všechny clues jsou jednoslovné kapely." }
    });
    fireEvent.change(screen.getByLabelText("Nápověda"), {
      target: { value: "Počítejte slova." }
    });
    fireEvent.click(screen.getByRole("button", { name: "Uložit hru" }));

    const savedGame = onSave.mock.calls[0][0] as Game;
    const round = savedGame.rounds[0];

    expect(round.type).toBe("common-denominator");
    if (round.type !== "common-denominator") {
      throw new Error("Expected common denominator round");
    }
    expect(round.items?.[0]).toMatchObject({
      clues: [
        { text: "Queen", prompt: "Queen" },
        { text: "ABBA", prompt: "ABBA" },
        { text: "Aqua", prompt: "Aqua" }
      ],
      answer: "Krátké názvy kapel",
      moderatorNote: "Všechny clues jsou jednoslovné kapely.",
      hint: "Počítejte slova."
    });
  });

  it("před startem umožní upravit šest názvů týmů a uloží je", () => {
    const onSave = vi.fn();
    render(<GameEditor initialGame={gameFixture} onSave={onSave} />);

    expect(screen.getAllByLabelText(/Název týmu/i)).toHaveLength(6);

    fireEvent.change(screen.getByDisplayValue("Tým 1"), {
      target: { value: "Hospoda Sever" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Uložit hru" }));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0][0].teams[0].name).toBe("Hospoda Sever");
    expect(onSave.mock.calls[0][0].teams).toHaveLength(6);
  });

  it("umožní změnit text otázky prvního kola", () => {
    render(<GameEditor initialGame={gameFixture} onSave={vi.fn()} />);

    const input = screen.getByLabelText("Zadání otázky 100 bodů v kategorii Pop");
    fireEvent.change(input, { target: { value: "Nová otázka" } });

    expect(screen.getByDisplayValue("Nová otázka")).toBeInTheDocument();
  });

  it("při uložení předá upravenou hru", () => {
    const onSave = vi.fn();
    render(<GameEditor initialGame={gameFixture} onSave={onSave} />);

    fireEvent.change(screen.getByLabelText("Zadání otázky 100 bodů v kategorii Pop"), {
      target: { value: "Nová otázka" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Uložit hru" }));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0][0].questions[0].prompt).toBe("Nová otázka");
  });

  it("neuloží hru bez názvu a zobrazí českou chybu", () => {
    const onSave = vi.fn();
    render(<GameEditor initialGame={gameFixture} onSave={onSave} />);

    fireEvent.change(screen.getByLabelText("Název hry"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Uložit hru" }));

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText("Název hry nesmí být prázdný.")).toBeInTheDocument();
  });

  it("zobrazí ovládání pro JSON import a export", () => {
    render(<GameEditor initialGame={gameFixture} onSave={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Exportovat JSON" })).toBeInTheDocument();
    expect(screen.getByLabelText("Importovat JSON hry")).toBeInTheDocument();
  });

  it("importuje JSON hru a předá ji k uložení", async () => {
    const onSave = vi.fn();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<GameEditor initialGame={gameFixture} onSave={onSave} />);

    const importedGame: Game = {
      ...gameFixture,
      id: "importovana-hra",
      title: "Importovaná hra",
      questions: [
        {
          ...gameFixture.questions![0],
          id: "import-question-1",
          prompt: "Importovaná otázka"
        }
      ]
    };
    const file = new File(
      [
        JSON.stringify({
          format: "riskuj-game/v1",
          exportedAt: "2026-05-30T12:00:00.000Z",
          game: importedGame
        })
      ],
      "hra.json",
      { type: "application/json" }
    );

    fireEvent.change(screen.getByLabelText("Importovat JSON hry"), {
      target: { files: [file] }
    });

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledTimes(1);
    });
    expect(onSave.mock.calls[0][0].title).toBe("Importovaná hra");
    expect(onSave.mock.calls[0][0].questions[0].prompt).toBe("Importovaná otázka");
  });

  it("uloží audio prvního kola do canonical rounds", () => {
    const audio = { id: "audio-question", src: "/uploads/question.mp3", title: "Question" };
    const savedGame = prepareGameForSave(
      normalizeGame({
        ...gameFixture,
        questions: [{ ...gameFixture.questions![0], audio }]
      })
    );

    const questionRound = savedGame.rounds.find((round) => round.type === "question");

    expect(questionRound?.questions[0].audio).toEqual(audio);
    expect(questionRound?.questions[0].audio?.src).toBe("/uploads/question.mp3");
  });

  it("uloží audio poslechové položky do tracks v canonical rounds", () => {
    const audio = { id: "audio-track", src: "/uploads/track.mp3", title: "Track" };
    const savedGame = prepareGameForSave(
      normalizeGame({
        ...gameFixture,
        listeningItems: [{ ...gameFixture.listeningItems![0], audio }]
      })
    );

    const listeningRound = savedGame.rounds.find((round) => round.type === "listening");

    expect(listeningRound?.tracks[0].audio).toEqual(audio);
    expect(listeningRound?.tracks[0].audioUrl).toBe("/uploads/track.mp3");
    expect(listeningRound?.items?.[0]).toMatchObject({
      title: "Song",
      trackTitleAnswer: "Song",
      artistAnswer: "Artist",
      audio: { src: "/uploads/track.mp3" },
      audioUrl: "/uploads/track.mp3"
    });
  });

  it("doplní poslechovému tracku prompt a answer pro backend validaci", () => {
    const audio = { id: "audio-track", src: "/uploads/track.mp3", title: "Track" };
    const savedGame = prepareGameForSave(
      normalizeGame({
        id: "empty-game",
        title: "Prázdná hra",
        teams: [],
        rounds: [
          {
            id: "round-poslech",
            type: "listening",
            title: "Poslechové kolo",
            categories: [{ id: "genre-1", title: "Pop" }],
            tracks: []
          }
        ],
        listeningGenres: [{ id: "genre-1", title: "Pop" }],
        listeningItems: [
          {
            id: "listen-1",
            genreId: "genre-1",
            categoryId: "genre-1",
            artist: "Ewa Farna",
            title: "Měls mě vůbec rád",
            prompt: "",
            answer: "",
            audio
          }
        ]
      })
    );

    const listeningRound = savedGame.rounds.find((round) => round.type === "listening");

    expect(listeningRound?.type).toBe("listening");
    if (listeningRound?.type !== "listening") {
      throw new Error("Missing listening round");
    }
    expect(listeningRound.tracks[0]).toMatchObject({
      prompt: "Poznej interpreta a název skladby.",
      answer: "Ewa Farna - Měls mě vůbec rád"
    });
    expect(listeningRound.items?.[0]).toMatchObject({
      prompt: "Poznej interpreta a název skladby.",
      answer: "Ewa Farna - Měls mě vůbec rád"
    });
    expect(validateServerGame(savedGame)).toEqual([]);
  });

  it("uloží audio indicie do třetího kola v canonical rounds", () => {
    const audio = { id: "audio-clue", src: "/uploads/clue.mp3", title: "Clue" };
    const savedGame = prepareGameForSave(
      normalizeGame({
        ...gameFixture,
        commonDenominator: {
          answer: "Společná odpověď",
          clues: [{ ...gameFixture.commonDenominator!.clues[0], audio }]
        }
      })
    );

    const commonRound = savedGame.rounds.find((round) => round.type === "common-denominator");

    expect(commonRound?.clues[0].audio).toEqual(audio);
    expect(commonRound?.clues[0].audio?.src).toBe("/uploads/clue.mp3");
  });

  it("umožní upravit a uložit všech 6 společných jmenovatelů ze seed hry", () => {
    const onSave = vi.fn();
    const { container } = render(<GameEditor initialGame={riskuj20260606Game} onSave={onSave} />);

    const commonTitleInputs = Array.from(container.querySelectorAll("input")).filter((input) =>
      input.value.startsWith("Společný jmenovatel")
    );

    expect(commonTitleInputs).toHaveLength(6);

    fireEvent.change(commonTitleInputs[5], {
      target: { value: "Finálový jmenovatel" }
    });
    fireEvent.click(container.querySelector('button[type="submit"]')!);

    const savedGame = onSave.mock.calls[0][0] as Game;
    const commonRound = savedGame.rounds.find((round) => round.type === "common-denominator");

    expect(commonRound?.type).toBe("common-denominator");
    if (commonRound?.type !== "common-denominator") {
      throw new Error("Missing common-denominator round");
    }
    expect(commonRound.items).toHaveLength(6);
    expect(commonRound.items?.[5].title).toBe("Finálový jmenovatel");
  });
});
