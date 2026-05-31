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

  it("umožní přednastavit počet týmů a zachová existující názvy", () => {
    const onChange = vi.fn();

    render(<TeamSetup teams={demoGame.teams.slice(0, 2)} onChange={onChange} />);

    expect(screen.getByLabelText("Počet týmů")).toHaveValue(2);
    fireEvent.change(screen.getByLabelText("Počet týmů"), {
      target: { value: "4" }
    });

    expect(onChange).toHaveBeenCalledWith([
      demoGame.teams[0],
      demoGame.teams[1],
      expect.objectContaining({ id: "team-3", name: "Tým 3" }),
      expect.objectContaining({ id: "team-4", name: "Tým 4" })
    ]);
  });

  it("při snížení počtu týmů uloží jen první týmy", () => {
    const onChange = vi.fn();

    render(<TeamSetup teams={demoGame.teams} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText("Počet týmů"), {
      target: { value: "3" }
    });

    expect(onChange).toHaveBeenCalledWith(demoGame.teams.slice(0, 3));
  });
});
