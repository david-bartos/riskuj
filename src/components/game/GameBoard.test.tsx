import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Game } from "../../types/game";
import { GameBoard } from "./GameBoard";

const game: Game = {
  id: "demo",
  title: "Demo Riskuj",
  categories: [
    { id: "ceske-hity", title: "České hity" },
    { id: "filmove-pisne", title: "Filmové písně" }
  ],
  questions: [
    {
      id: "ceske-hity-100",
      categoryId: "ceske-hity",
      points: 100,
      prompt: "Který zpěvák nazpíval píseň Lady Carneval?",
      answer: "Karel Gott"
    },
    {
      id: "filmove-pisne-100",
      categoryId: "filmove-pisne",
      points: 100,
      prompt: "Ve kterém filmu zazněla píseň Šíleně smutná princezna?",
      answer: "Šíleně smutná princezna"
    },
    {
      id: "ceske-hity-200",
      categoryId: "ceske-hity",
      points: 200,
      prompt: "Kdo zpíval Slunečný hrob?",
      answer: "Blue Effect"
    },
    {
      id: "filmove-pisne-200",
      categoryId: "filmove-pisne",
      points: 200,
      prompt: "Která pohádka má píseň Není nutno?",
      answer: "Tři veteráni"
    }
  ]
};

describe("GameBoard", () => {
  it("renders category headers and score rows derived from the game", () => {
    render(
      <GameBoard
        game={game}
        currentQuestionId={null}
        revealedQuestionIds={[]}
        onSelectQuestion={vi.fn()}
      />
    );

    expect(screen.getByText("České hity")).toBeInTheDocument();
    expect(screen.getByText("Filmové písně")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /100 bodů/ })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: /200 bodů/ })).toHaveLength(2);
  });

  it("selects available questions by id", () => {
    const onSelectQuestion = vi.fn();

    render(
      <GameBoard
        game={game}
        currentQuestionId={null}
        revealedQuestionIds={[]}
        onSelectQuestion={onSelectQuestion}
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Filmové písně za 200 bodů" })
    );

    expect(onSelectQuestion).toHaveBeenCalledTimes(1);
    expect(onSelectQuestion).toHaveBeenCalledWith("filmove-pisne-200");
  });

  it("marks the active question and used questions with separate states", () => {
    render(
      <GameBoard
        game={game}
        currentQuestionId="ceske-hity-100"
        revealedQuestionIds={["filmove-pisne-200"]}
        onSelectQuestion={vi.fn()}
      />
    );

    expect(
      screen.getByRole("button", { name: "Vybráno: České hity za 100 bodů" })
    ).toHaveAttribute("data-state", "active");
    expect(
      screen.getByRole("button", { name: "Použito: Filmové písně za 200 bodů" })
    ).toBeDisabled();
  });

  it("renders sparse boards with visible disabled cells", () => {
    const sparseGame: Game = {
      ...game,
      questions: game.questions.filter(
        (question) => question.id !== "filmove-pisne-200"
      )
    };

    render(
      <GameBoard
        game={sparseGame}
        currentQuestionId={null}
        revealedQuestionIds={[]}
        onSelectQuestion={vi.fn()}
      />
    );

    const board = screen.getByRole("grid", { name: "Herní tabule Demo Riskuj" });

    expect(within(board).getAllByRole("button")).toHaveLength(4);
    expect(
      screen.getByRole("button", {
        name: "Filmové písně za 200 bodů není dostupné"
      })
    ).toBeDisabled();
  });
});
