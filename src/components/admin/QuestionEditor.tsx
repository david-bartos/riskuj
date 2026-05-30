import { useId, useState } from "react";
import type { AudioAsset, Game, ListeningGenre, ListeningItem, Question } from "../../types/game";

type AdminCommonDenominatorRound = NonNullable<Game["commonDenominator"]>;

type AudioAttachmentProps = {
  audio?: AudioAsset;
  audioAssets: AudioAsset[];
  label: string;
  onChange: (audio: AudioAsset | undefined) => void;
  onUploadAudio?: (file: File) => Promise<AudioAsset>;
};

function getAudioLabel(audio: AudioAsset) {
  return audio.displayName ?? audio.title ?? audio.originalName ?? audio.src;
}

function AudioAttachmentEditor({
  audio,
  audioAssets,
  label,
  onChange,
  onUploadAudio
}: AudioAttachmentProps) {
  const selectId = useId();
  const uploadId = useId();
  const [status, setStatus] = useState("");

  async function handleUpload(file: File | undefined) {
    if (!file || !onUploadAudio) {
      return;
    }

    setStatus("Nahrávám MP3...");
    try {
      const asset = await onUploadAudio(file);
      onChange(asset);
      setStatus("Audio je připojené.");
    } catch {
      setStatus("MP3 se nepodařilo nahrát.");
    }
  }

  return (
    <section className="audio-attachment" aria-label={label}>
      <div className="editor-grid">
        <label className="field-stack" htmlFor={selectId}>
          <span>Vybrat MP3 z knihovny</span>
          <select
            id={selectId}
            value={audio?.id ?? ""}
            onChange={(event) => {
              const asset = audioAssets.find((candidate) => candidate.id === event.target.value);
              onChange(asset);
            }}
          >
            <option value="">Bez audia</option>
            {audioAssets.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {getAudioLabel(asset)}
              </option>
            ))}
          </select>
        </label>

        <label className="field-stack" htmlFor={uploadId}>
          <span>Nahrát MP3 k položce</span>
          <input
            accept="audio/mpeg,.mp3"
            id={uploadId}
            type="file"
            onChange={(event) => void handleUpload(event.target.files?.[0])}
          />
        </label>
      </div>

      {audio ? (
        <div className="audio-preview" aria-label="Aktuální audio">
          <span>Aktuální audio: {getAudioLabel(audio)}</span>
          <audio aria-label="Náhled audio ukázky" controls src={audio.src} />
        </div>
      ) : null}
      {status ? <p role="status">{status}</p> : null}
    </section>
  );
}

type FirstRoundQuestionEditorProps = {
  question: Question;
  categoryTitle: string;
  audioAssets: AudioAsset[];
  onChange: (question: Question) => void;
  onUploadAudio?: (file: File) => Promise<AudioAsset>;
};

export function FirstRoundQuestionEditor({
  question,
  categoryTitle,
  audioAssets,
  onChange,
  onUploadAudio
}: FirstRoundQuestionEditorProps) {
  const suffix = `${question.points} bodů v kategorii ${categoryTitle}`;

  return (
    <article className="editor-card">
      <h4>{question.points} bodů</h4>
      <label className="field-stack">
        <span>{`Zadání otázky ${suffix}`}</span>
        <textarea
          value={question.prompt}
          onChange={(event) => onChange({ ...question, prompt: event.target.value })}
        />
      </label>
      <label className="field-stack">
        <span>{`Odpověď otázky ${suffix}`}</span>
        <input
          value={question.answer}
          onChange={(event) => onChange({ ...question, answer: event.target.value })}
        />
      </label>
      <label className="field-stack">
        <span>{`Poznámka moderátora otázky ${suffix}`}</span>
        <textarea
          value={question.moderatorNote ?? ""}
          onChange={(event) =>
            onChange({ ...question, moderatorNote: event.target.value || undefined })
          }
        />
      </label>
      <AudioAttachmentEditor
        audio={question.audio}
        audioAssets={audioAssets}
        label={`Audio otázky ${suffix}`}
        onChange={(audio) => onChange({ ...question, audio })}
        onUploadAudio={onUploadAudio}
      />
    </article>
  );
}

type ListeningItemEditorProps = {
  item: ListeningItem;
  genres: ListeningGenre[];
  audioAssets: AudioAsset[];
  onChange: (item: ListeningItem) => void;
  onUploadAudio?: (file: File) => Promise<AudioAsset>;
  onRemove: () => void;
};

export function ListeningItemEditor({
  item,
  genres,
  audioAssets,
  onChange,
  onUploadAudio,
  onRemove
}: ListeningItemEditorProps) {
  return (
    <article className="editor-card">
      <div className="section-heading-row">
        <h4>{item.title || "Nová poslechová položka"}</h4>
        <button className="danger-button button-compact" type="button" onClick={onRemove}>
          Smazat položku
        </button>
      </div>
      <div className="editor-grid">
        <label className="field-stack">
          <span>Žánr poslechové položky</span>
          <select
            value={item.genreId}
            onChange={(event) => onChange({ ...item, genreId: event.target.value })}
          >
            {genres.map((genre) => (
              <option key={genre.id} value={genre.id}>
                {genre.title || "Bez názvu"}
              </option>
            ))}
          </select>
        </label>
        <label className="field-stack">
          <span>Název skladby</span>
          <input
            value={item.title}
            onChange={(event) => onChange({ ...item, title: event.target.value })}
          />
        </label>
        <label className="field-stack">
          <span>Interpret</span>
          <input
            value={item.artist}
            onChange={(event) => onChange({ ...item, artist: event.target.value })}
          />
        </label>
      </div>
      <label className="field-stack">
        <span>Zadání poslechové položky</span>
        <textarea
          value={item.prompt}
          onChange={(event) => onChange({ ...item, prompt: event.target.value })}
        />
      </label>
      <label className="field-stack">
        <span>Odpověď poslechové položky</span>
        <input
          value={item.answer}
          onChange={(event) => onChange({ ...item, answer: event.target.value })}
        />
      </label>
      <AudioAttachmentEditor
        audio={item.audio}
        audioAssets={audioAssets}
        label="Audio poslechové položky"
        onChange={(audio) => onChange({ ...item, audio, audioUrl: audio?.src })}
        onUploadAudio={onUploadAudio}
      />
    </article>
  );
}

type CommonDenominatorEditorProps = {
  round: AdminCommonDenominatorRound;
  audioAssets: AudioAsset[];
  onChange: (round: AdminCommonDenominatorRound) => void;
  onUploadAudio?: (file: File) => Promise<AudioAsset>;
  onAddClue: () => void;
  onRemoveClue: (clueId: string) => void;
};

export function CommonDenominatorEditor({
  round,
  audioAssets,
  onChange,
  onUploadAudio,
  onAddClue,
  onRemoveClue
}: CommonDenominatorEditorProps) {
  return (
    <div className="item-list">
      <label className="field-stack">
        <span>Společný jmenovatel</span>
        <input
          value={round.answer}
          onChange={(event) => onChange({ ...round, answer: event.target.value })}
        />
      </label>
      {round.clues.map((clue, index) => (
        <div className="field-row" key={clue.id}>
          <div className="field-stack">
            <label className="field-stack">
              <span>{`Indicie ${index + 1}`}</span>
              <textarea
                value={clue.text ?? clue.prompt ?? ""}
                onChange={(event) =>
                  onChange({
                    ...round,
                    clues: round.clues.map((current) =>
                      current.id === clue.id
                        ? { ...current, text: event.target.value, prompt: event.target.value }
                        : current
                    )
                  })
                }
              />
            </label>
            <AudioAttachmentEditor
              audio={clue.audio}
              audioAssets={audioAssets}
              label={`Audio indicie ${index + 1}`}
              onChange={(audio) =>
                onChange({
                  ...round,
                  clues: round.clues.map((current) =>
                    current.id === clue.id ? { ...current, audio } : current
                  )
                })
              }
              onUploadAudio={onUploadAudio}
            />
          </div>
          <button
            className="danger-button button-compact"
            type="button"
            onClick={() => onRemoveClue(clue.id)}
          >
            Smazat indicii
          </button>
        </div>
      ))}
      <button className="button-compact" type="button" onClick={onAddClue}>
        Přidat indicii
      </button>
    </div>
  );
}
