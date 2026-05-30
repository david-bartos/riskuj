import type { CommonDenominatorItem } from "../../types/game";

type CommonDenominatorRoundScreenProps = {
  item: CommonDenominatorItem;
  visibleClueIds: string[];
  answerVisible: boolean;
};

export function CommonDenominatorRoundScreen({
  item,
  visibleClueIds,
  answerVisible
}: CommonDenominatorRoundScreenProps) {
  return (
    <>
      <h2>{item.title}</h2>
      <ol className="clue-list">
        {item.clues
          .filter((clue) => visibleClueIds.includes(clue.id))
          .map((clue, index) => (
            <li key={clue.id}>
              <strong>Nápověda {index + 1}</strong>
              <span>{clue.text ?? clue.prompt}</span>
              {clue.audio ? (
                <audio aria-label="Přehrát audio ukázku" controls src={clue.audio.src} />
              ) : null}
            </li>
          ))}
      </ol>
      {answerVisible ? (
        <div className="answer-panel">
          <h3>Finální odpověď</h3>
          <p>{item.answer}</p>
          {item.hint ? <p>{item.hint}</p> : null}
        </div>
      ) : null}
    </>
  );
}

export default CommonDenominatorRoundScreen;
