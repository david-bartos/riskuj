import type { Team } from "../../types/game";

type TeamSetupProps = {
  teams: Team[];
  onChange: (teams: Team[]) => void;
};

const minTeamCount = 1;
const maxTeamCount = 8;
const teamColors = ["#ef4444", "#3b82f6", "#22c55e", "#f59e0b", "#a855f7", "#06b6d4", "#ec4899", "#14b8a6"];

function clampTeamCount(value: number) {
  if (Number.isNaN(value)) {
    return minTeamCount;
  }

  return Math.min(maxTeamCount, Math.max(minTeamCount, value));
}

function createTeam(index: number, existingIds: Set<string>): Team {
  const fallbackId = `team-${index + 1}`;
  let id = fallbackId;
  let suffix = index + 1;

  while (existingIds.has(id)) {
    suffix += 1;
    id = `team-${suffix}`;
  }

  existingIds.add(id);

  return {
    id,
    name: `Tým ${index + 1}`,
    color: teamColors[index % teamColors.length]
  };
}

export function TeamSetup({ teams, onChange }: TeamSetupProps) {
  function updateTeamName(teamId: string, name: string) {
    onChange(teams.map((team) => (team.id === teamId ? { ...team, name } : team)));
  }

  function updateTeamCount(count: number) {
    const nextCount = clampTeamCount(count);

    if (nextCount <= teams.length) {
      onChange(teams.slice(0, nextCount));
      return;
    }

    const existingIds = new Set(teams.map((team) => team.id));
    const nextTeams = [...teams];

    for (let index = teams.length; index < nextCount; index += 1) {
      nextTeams.push(createTeam(index, existingIds));
    }

    onChange(nextTeams);
  }

  return (
    <section className="team-setup" aria-label="Nastavení týmů">
      <div className="team-setup-header">
        <h2>Týmy</h2>
        <label className="field-stack team-count-field">
          <span>Počet týmů</span>
          <input
            min={minTeamCount}
            max={maxTeamCount}
            type="number"
            value={teams.length}
            onChange={(event) => updateTeamCount(Number(event.target.value))}
          />
        </label>
      </div>
      <div className="team-setup-grid">
        {teams.map((team, index) => (
          <label className="field-stack" key={team.id}>
            <span>Název týmu {index + 1}</span>
            <input
              type="text"
              value={team.name}
              onChange={(event) => updateTeamName(team.id, event.target.value)}
            />
          </label>
        ))}
      </div>
    </section>
  );
}

export default TeamSetup;
