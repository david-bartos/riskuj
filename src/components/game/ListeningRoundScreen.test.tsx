import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ListeningItem } from "../../types/game";
import ListeningRoundScreen from "./ListeningRoundScreen";

const item: ListeningItem = {
  id: "listen-1",
  genreId: "pop",
  categoryId: "pop",
  prompt: "Poznej interpreta a název skladby.",
  artist: "Queen",
  artistAnswer: "Queen",
  trackTitle: "Bohemian Rhapsody",
  trackTitleAnswer: "Bohemian Rhapsody",
  answer: "Queen - Bohemian Rhapsody",
  audio: {
    id: "audio-1",
    src: "/uploads/queen.mp3",
    title: "queen-bohemian-rhapsody.mp3"
  }
};

describe("ListeningRoundScreen", () => {
  it("před odkrytím nerenderuje interpreta, název skladby ani technický název audia", () => {
    render(<ListeningRoundScreen item={item} answerVisible={false} />);

    expect(screen.getByText("Poznej interpreta a název skladby.")).toBeInTheDocument();
    expect(screen.getByLabelText("Přehrát audio ukázku")).toHaveAttribute(
      "src",
      "/uploads/queen.mp3"
    );
    expect(document.body.textContent).not.toContain("Queen");
    expect(document.body.textContent).not.toContain("Bohemian Rhapsody");
    expect(document.body.textContent).not.toContain("queen-bohemian-rhapsody.mp3");
  });

  it("po odkrytí zobrazí interpreta a název skladby", () => {
    render(<ListeningRoundScreen item={item} answerVisible />);

    expect(screen.getByText("Interpret: Queen")).toBeInTheDocument();
    expect(screen.getByText("Název: Bohemian Rhapsody")).toBeInTheDocument();
  });

  it("nespadne bez MP3", () => {
    render(<ListeningRoundScreen item={{ ...item, audio: undefined }} answerVisible={false} />);

    expect(screen.getByText("Bez audia")).toBeInTheDocument();
    expect(screen.queryByLabelText("Přehrát audio ukázku")).not.toBeInTheDocument();
  });
});
