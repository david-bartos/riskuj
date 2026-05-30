import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { demoGame } from "../../data/demoGame";
import type { Game } from "../../types/game";
import { GameBoard } from "./GameBoard";

describe("GameBoard", () => {
  it("renders category headers from the demo game", () => {
    render(
      <GameBoard
        game={demoGame}
        currentQuestionId={null}
        revealedQuestionIds={[]}
        onSelectQuestion={vi.fn()}
      />
    );

    for (const category of demoGame.categories) {
      expect(screen.getByText(category.title)).toBeInTheDocument();
    }
  });

  it("keeps used demo questions visible but disabled and dimmed", () => {
    render(
      <GameBoard
        game={demoGame}
        currentQuestionId={null}
        revealedQuestionIds={["ceske-hity-200"]}
        onSelectQuestion={vi.fn()}
      />
    );

    const usedTile = screen.getByRole("button", {
      name: "Použito: České hity za 200 bodů"
    });

    expect(usedTile).toBeInTheDocument();
    expect(usedTile).toBeDisabled();
    expect(usedTile).toHaveAttribute("data-state", "used");
  });

  it("selects available demo questions by id", () => {
    const onSelectQuestion = vi.fn();

    render(
      <GameBoard
        game={demoGame}
        currentQuestionId={null}
        revealedQuestionIds={[]}
        onSelectQuestion={onSelectQuestion}
      />
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Zahraniční rock, otázka za 300 bodů"
      })
    );

    expect(onSelectQuestion).toHaveBeenCalledTimes(1);
    expect(onSelectQuestion).toHaveBeenCalledWith("zahranicni-rock-300");
  });

  it("renders sparse boards with visible disabled cells", () => {
    const sparseGame: Game = {
      ...demoGame,
      questions: demoGame.questions.filter(
        (question) => question.id !== "zahranicni-rock-300"
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

    const board = screen.getByRole("grid", {
      name: "Herní tabule Hudební Riskuj"
    });

    expect(within(board).getAllByRole("button")).toHaveLength(25);
    expect(
      screen.getByRole("button", {
        name: "Zahraniční rock za 300 bodů není dostupné"
      })
    ).toBeDisabled();
  });
});
