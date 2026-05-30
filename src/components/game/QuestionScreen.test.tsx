import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import QuestionScreen from "./QuestionScreen";
import type { Category, Question } from "../../types/game";

const category: Category = {
  id: "ceske-hity",
  title: "České hity"
};

const question: Question = {
  id: "ceske-hity-100",
  categoryId: "ceske-hity",
  points: 100,
  prompt: "Který zpěvák proslavil píseň Jožin z bažin?",
  answer: "Ivan Mládek",
  audio: {
    id: "audio-ceske-hity-100",
    src: "/uploads/demo-placeholder.mp3",
    title: "Ukázka českého hitu"
  }
};

function renderQuestionScreen() {
  const onComplete = vi.fn();
  const onBackToBoard = vi.fn();

  render(
    <QuestionScreen
      category={category}
      question={question}
      onComplete={onComplete}
      onBackToBoard={onBackToBoard}
    />
  );

  return { onBackToBoard, onComplete };
}

describe("QuestionScreen", () => {
  it("nezobrazí odpověď před odkrytím", () => {
    renderQuestionScreen();

    expect(screen.getByRole("heading", { name: "České hity" })).toBeInTheDocument();
    expect(screen.getByText("100 bodů")).toBeInTheDocument();
    expect(
      screen.getByText("Který zpěvák proslavil píseň Jožin z bažin?")
    ).toBeInTheDocument();
    expect(screen.queryByText("Ivan Mládek")).not.toBeInTheDocument();
  });

  it("po kliknutí na Zobrazit odpověď odpověď vykreslí", () => {
    renderQuestionScreen();

    fireEvent.click(screen.getByRole("button", { name: "Zobrazit odpověď" }));

    expect(screen.getByText("Ivan Mládek")).toBeInTheDocument();
  });

  it("po odkrytí odešle výsledek správně", () => {
    const { onComplete } = renderQuestionScreen();

    fireEvent.click(screen.getByRole("button", { name: "Zobrazit odpověď" }));
    fireEvent.click(screen.getByRole("button", { name: "Správně" }));

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith("correct");
  });

  it("po odkrytí odešle výsledek špatně", () => {
    const { onComplete } = renderQuestionScreen();

    fireEvent.click(screen.getByRole("button", { name: "Zobrazit odpověď" }));
    fireEvent.click(screen.getByRole("button", { name: "Špatně" }));

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith("wrong");
  });

  it("před odkrytím neumožní vyhodnocení odpovědi", () => {
    const { onComplete } = renderQuestionScreen();

    expect(screen.getByRole("button", { name: "Správně" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Špatně" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Správně" }));
    fireEvent.click(screen.getByRole("button", { name: "Špatně" }));

    expect(onComplete).not.toHaveBeenCalled();
  });

  it("zobrazí volitelnou audio oblast", () => {
    renderQuestionScreen();

    expect(screen.getByRole("region", { name: "Hudební ukázka" })).toBeInTheDocument();
    expect(screen.getByText("Ukázka českého hitu")).toBeInTheDocument();
  });

  it("tlačítko Zpět na tabuli zavolá callback", () => {
    const { onBackToBoard } = renderQuestionScreen();

    fireEvent.click(screen.getByRole("button", { name: "Zpět na tabuli" }));

    expect(onBackToBoard).toHaveBeenCalledTimes(1);
  });
});
