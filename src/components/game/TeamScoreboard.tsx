import type { Team } from "../../types/game";
import type { TeamSessionScore } from "../../types/session";

type TeamScoreboardProps = {
  teams: Team[];
  scores: TeamSessionScore[];
  activeTeamId?: string;
  correctionStep?: number;
  onSelectTeam?: (teamId: string) => void;
  onAdjustScore?: (teamId: string, delta: number) => void;
};

function formatScore(score: number) {
  return `${new Intl.NumberFormat("cs-CZ").format(score).replace(/\u00a0/g, " ")} Kč`;
}

function scoreForTeam(scores: TeamSessionScore[], teamId: string) {
  return scores.find((entry) => entry.teamId === teamId)?.score ?? 0;
}

export function TeamScoreboard({
  teams,
  scores,
  activeTeamId,
  correctionStep = 1000,
  onSelectTeam,
  onAdjustScore
}: TeamScoreboardProps) {
  return (
    <section className="team-scoreboard" aria-label="Skóre týmů" role="region">
      {teams.map((team) => {
        const isActive = team.id === activeTeamId;
        return (
          <article className="team-scoreboard-tile" data-active={isActive ? "true" : "false"} key={team.id}>
            <button
              type="button"
              className="team-scoreboard-main"
              aria-label={`Vybrat ${team.name}`}
              aria-pressed={isActive}
              onClick={() => onSelectTeam?.(team.id)}
            >
              <span>{team.name}</span>
              <strong>{formatScore(scoreForTeam(scores, team.id))}</strong>
            </button>
            {onAdjustScore ? (
              <div className="team-scoreboard-adjust">
                <button
                  type="button"
                  aria-label={`Odečíst ${team.name}`}
                  onClick={() => onAdjustScore(team.id, -correctionStep)}
                >
                  -
                </button>
                <button
                  type="button"
                  aria-label={`Přičíst ${team.name}`}
                  onClick={() => onAdjustScore(team.id, correctionStep)}
                >
                  +
                </button>
              </div>
            ) : null}
          </article>
        );
      })}
    </section>
  );
}

export default TeamScoreboard;
