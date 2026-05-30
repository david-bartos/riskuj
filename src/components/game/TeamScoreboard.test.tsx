import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { demoGame } from "../../data/demoGame";
import TeamScoreboard from "./TeamScoreboard";

const scores = demoGame.teams.map((team, index) => ({
  teamId: team.id,
  score: index * 1000
}));

describe("TeamScoreboard", () => {
  it("zobrazí týmy a skóre jako horní dlaždice", () => {
    render(<TeamScoreboard teams={demoGame.teams} scores={scores} />);

    const scoreboard = screen.getByRole("region", { name: "Skóre týmů" });
    expect(within(scoreboard).getByText("Tým 1")).toBeInTheDocument();
    expect(within(scoreboard).getByText("0 Kč")).toBeInTheDocument();
    expect(within(scoreboard).getByText("Tým 6")).toBeInTheDocument();
    expect(within(scoreboard).getByText("5 000 Kč")).toBeInTheDocument();
  });

  it("označí aktivní tým a zavolá ruční korekce skóre", () => {
    const onAdjustScore = vi.fn();
    const onSelectTeam = vi.fn();

    render(
      <TeamScoreboard
        teams={demoGame.teams}
        scores={scores}
        activeTeamId="team-2"
        onAdjustScore={onAdjustScore}
        onSelectTeam={onSelectTeam}
      />
    );

    const activeTile = screen.getByRole("button", { name: "Vybrat Tým 2" });
    expect(activeTile).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(activeTile);
    expect(onSelectTeam).toHaveBeenCalledWith("team-2");

    fireEvent.click(screen.getByRole("button", { name: "Přičíst Tým 2" }));
    expect(onAdjustScore).toHaveBeenCalledWith("team-2", 1000);

    fireEvent.click(screen.getByRole("button", { name: "Odečíst Tým 2" }));
    expect(onAdjustScore).toHaveBeenCalledWith("team-2", -1000);
  });
});
