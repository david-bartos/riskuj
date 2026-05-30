import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { demoGame } from "../../data/demoGame";
import TeamSetup from "./TeamSetup";

describe("TeamSetup", () => {
  it("umožní upravit šest názvů týmů před startem hry", () => {
    const onChange = vi.fn();

    render(<TeamSetup teams={demoGame.teams} onChange={onChange} />);

    expect(screen.getAllByLabelText(/Název týmu/i)).toHaveLength(6);
    fireEvent.change(screen.getByDisplayValue("Tým 1"), {
      target: { value: "Hospoda Sever" }
    });

    expect(onChange).toHaveBeenCalledWith([
      { ...demoGame.teams[0], name: "Hospoda Sever" },
      ...demoGame.teams.slice(1)
    ]);
  });
});
