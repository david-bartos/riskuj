import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { CommonDenominatorItem } from "../../types/game";
import CommonDenominatorRoundScreen from "./CommonDenominatorRoundScreen";

const item: CommonDenominatorItem = {
  id: "common-1",
  title: "Sada 1",
  value: 5000,
  clues: [
    { id: "clue-1", text: "Bohemian Rhapsody" },
    { id: "clue-2", text: "Freddie Mercury" },
    { id: "clue-3", text: "We Will Rock You" }
  ],
  answer: "Queen"
};

describe("CommonDenominatorRoundScreen", () => {
  it("před finálním odkrytím nerenderuje odpověď do DOM", () => {
    render(
      <CommonDenominatorRoundScreen
        item={item}
        visibleClueIds={["clue-1"]}
        answerVisible={false}
      />
    );

    expect(screen.getByText("Bohemian Rhapsody")).toBeInTheDocument();
    expect(screen.queryByText("Freddie Mercury")).not.toBeInTheDocument();
    expect(document.body.textContent).not.toContain("Queen");
  });

  it("po odkrytí zobrazí odpověď", () => {
    render(
      <CommonDenominatorRoundScreen
        item={item}
        visibleClueIds={["clue-1", "clue-2", "clue-3"]}
        answerVisible
      />
    );

    expect(screen.getByText("Queen")).toBeInTheDocument();
  });
});
