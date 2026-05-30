import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Question } from "../../types/game";
import { ScoreTile } from "./ScoreTile";

const question: Question = {
  id: "ceske-hity-100",
  categoryId: "ceske-hity",
  points: 100,
  prompt: "Který zpěvák nazpíval píseň Lady Carneval?",
  answer: "Karel Gott"
};

describe("ScoreTile", () => {
  it("renders an available score tile and calls onSelect with the question id", () => {
    const onSelect = vi.fn();

    render(
      <ScoreTile
        points={100}
        question={question}
        state="available"
        categoryTitle="České hity"
        onSelect={onSelect}
      />
    );

    const tile = screen.getByRole("button", {
      name: "České hity za 100 bodů"
    });

    expect(tile).toHaveTextContent("100");
    expect(tile).toHaveAttribute("data-state", "available");

    fireEvent.click(tile);

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("ceske-hity-100");
  });

  it("renders the active score tile as selected while keeping it clickable", () => {
    const onSelect = vi.fn();

    render(
      <ScoreTile
        points={100}
        question={question}
        state="active"
        categoryTitle="České hity"
        onSelect={onSelect}
      />
    );

    const tile = screen.getByRole("button", {
      name: "Vybráno: České hity za 100 bodů"
    });

    expect(tile).toHaveAttribute("aria-pressed", "true");
    expect(tile).toHaveAttribute("data-state", "active");
    expect(tile).not.toBeDisabled();

    fireEvent.click(tile);

    expect(onSelect).toHaveBeenCalledWith("ceske-hity-100");
  });

  it("keeps used score tiles visible but disabled", () => {
    const onSelect = vi.fn();

    render(
      <ScoreTile
        points={100}
        question={question}
        state="used"
        categoryTitle="České hity"
        onSelect={onSelect}
      />
    );

    const tile = screen.getByRole("button", {
      name: "Použito: České hity za 100 bodů"
    });

    expect(tile).toHaveTextContent("100");
    expect(tile).toBeDisabled();
    expect(tile).toHaveAttribute("data-state", "used");

    fireEvent.click(tile);

    expect(onSelect).not.toHaveBeenCalled();
  });

  it("renders missing board cells as disabled empty tiles", () => {
    const onSelect = vi.fn();

    render(
      <ScoreTile
        points={500}
        state="disabled"
        categoryTitle="České hity"
        onSelect={onSelect}
      />
    );

    const tile = screen.getByRole("button", {
      name: "České hity za 500 bodů není dostupné"
    });

    expect(tile).toHaveTextContent("-");
    expect(tile).toBeDisabled();
    expect(tile).toHaveAttribute("data-state", "disabled");
  });
});
