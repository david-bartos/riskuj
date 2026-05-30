import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import GameEditor from "./GameEditor";
import type { Game } from "../../types/game";

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
});
