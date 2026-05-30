import type { Question, QuestionPoints } from "../../types/game";

export type ScoreTileState = "available" | "active" | "used" | "disabled";

type ScoreTileProps = {
  points: QuestionPoints;
  question?: Question;
  state: ScoreTileState;
  categoryTitle: string;
  onSelect: (questionId: string) => void;
};

export function ScoreTile({
  points,
  question,
  state,
  categoryTitle,
  onSelect
}: ScoreTileProps) {
  const isDisabled = state === "used" || state === "disabled" || !question;
  const isActive = state === "active";
  const availableLabel = `${categoryTitle}, otázka za ${points} bodů`;
  const label =
    state === "active"
      ? `Vybráno: ${categoryTitle}, otázka za ${points} bodů`
      : state === "used"
        ? `Použito: ${categoryTitle} za ${points} bodů`
        : state === "disabled"
          ? `${categoryTitle} za ${points} bodů není dostupné`
          : availableLabel;

  return (
    <button
      type="button"
      className="score-tile"
      data-state={state}
      aria-label={label}
      aria-pressed={isActive ? "true" : undefined}
      disabled={isDisabled}
      onClick={() => {
        if (question) {
          onSelect(question.id);
        }
      }}
    >
      {question ? points : "-"}
    </button>
  );
}
