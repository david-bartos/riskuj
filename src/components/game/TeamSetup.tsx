import type { Team } from "../../types/game";

type TeamSetupProps = {
  teams: Team[];
  onChange: (teams: Team[]) => void;
};

export function TeamSetup({ teams, onChange }: TeamSetupProps) {
  function updateTeamName(teamId: string, name: string) {
    onChange(teams.map((team) => (team.id === teamId ? { ...team, name } : team)));
  }

  return (
    <section className="team-setup" aria-label="Nastavení týmů">
      <h2>Týmy</h2>
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
