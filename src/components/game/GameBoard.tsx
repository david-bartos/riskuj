import { useMemo } from "react";
import type { CSSProperties } from "react";
import type { Game, Question, QuestionPoints } from "../../types/game";
import { ScoreTile, type ScoreTileState } from "./ScoreTile";

type GameBoardProps = {
  game: Game;
  currentQuestionId?: string | null;
  revealedQuestionIds: string[];
  onSelectQuestion: (questionId: string) => void;
};

function getQuestionKey(categoryId: string, points: QuestionPoints) {
  return `${categoryId}:${points}`;
}

function getTileState(
  question: Question | undefined,
  currentQuestionId: string | null | undefined,
  revealedQuestionIds: Set<string>
): ScoreTileState {
  if (!question) {
    return "disabled";
  }

  if (revealedQuestionIds.has(question.id)) {
    return "used";
  }

  if (question.id === currentQuestionId) {
    return "active";
  }

  return "available";
}

export function GameBoard({
  game,
  currentQuestionId,
  revealedQuestionIds,
  onSelectQuestion
}: GameBoardProps) {
  const questions = game.questions ?? [];
  const categories = game.categories ?? [];
  const pointRows = useMemo(
    () =>
      Array.from(new Set(questions.map((question) => question.points))).sort(
        (first, second) => first - second
      ),
    [questions]
  );
  const questionsByCell = useMemo(
    () =>
      new Map(
        questions.map((question) => [
          getQuestionKey(question.categoryId, question.points),
          question
        ])
      ),
    [questions]
  );
  const revealedIds = useMemo(
    () => new Set(revealedQuestionIds),
    [revealedQuestionIds]
  );

  return (
    <section className="game-board-panel" aria-labelledby="game-board-title">
      <h2 id="game-board-title">{game.title}</h2>
      <div
        className="game-board"
        role="grid"
        aria-label={`Herní tabule ${game.title}`}
        style={{ "--board-columns": categories.length } as CSSProperties}
      >
        {categories.map((category) => (
          <div className="category-tile" role="columnheader" key={category.id}>
            {category.title}
          </div>
        ))}

        {pointRows.flatMap((points) =>
          categories.map((category) => {
            const question = questionsByCell.get(getQuestionKey(category.id, points));

            return (
              <ScoreTile
                key={`${category.id}-${points}`}
                points={points}
                question={question}
                state={getTileState(question, currentQuestionId, revealedIds)}
                categoryTitle={category.title}
                onSelect={onSelectQuestion}
              />
            );
          })
        )}
      </div>
    </section>
  );
}
