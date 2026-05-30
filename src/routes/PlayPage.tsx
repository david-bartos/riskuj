import { GameBoard } from "../components/game/GameBoard";
import { demoGame } from "../data/demoGame";
import { useGameSession } from "../hooks/useGameSession";

type PlayPageProps = {
  gameId: string;
};

export function PlayPage({ gameId }: PlayPageProps) {
  const session = useGameSession(gameId);

  return (
    <section
      className="page-panel page-panel-wide play-page"
      aria-labelledby="play-title"
    >
      <p className="eyebrow">Demo hra</p>
      <h1 id="play-title">Herní tabule</h1>
      <p className="game-code">Kód hry: {gameId}</p>
      <p className="page-copy">
        Vyberte políčko s bodovou hodnotou. Použitá políčka zůstanou na tabuli
        viditelná a ztlumená.
      </p>
      <GameBoard
        game={demoGame}
        currentQuestionId={session.currentQuestionId}
        revealedQuestionIds={session.revealedQuestionIds}
        onSelectQuestion={session.selectTile}
      />
    </section>
  );
}
