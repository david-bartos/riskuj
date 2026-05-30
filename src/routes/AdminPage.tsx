import { useEffect, useMemo, useState } from "react";
import type {
  AudioAsset,
  CommonDenominatorRound,
  Game,
  ListeningRound,
  QuestionRound
} from "../types/game";

type AudioTarget =
  | { kind: "question"; roundId: string; itemId: string; label: string }
  | { kind: "listening"; roundId: string; itemId: string; label: string }
  | { kind: "common-denominator"; roundId: string; clueId: string; label: string };

const targetKey = (target: AudioTarget) => {
  if (target.kind === "common-denominator") {
    return `${target.kind}:${target.roundId}:${target.clueId}`;
  }

  return `${target.kind}:${target.roundId}:${target.itemId}`;
};

function buildAudioTargets(game: Game): AudioTarget[] {
  return game.rounds.flatMap((round) => {
    if (round.type === "question") {
      return round.items.map((item) => {
        const category = round.categories.find(
          (candidate) => candidate.id === item.categoryId
        );
        return {
          kind: "question" as const,
          roundId: round.id,
          itemId: item.id,
          label: `${round.title}: ${category?.title ?? "Otázka"} za ${item.points}`
        };
      });
    }

    if (round.type === "listening") {
      return round.items.map((item) => ({
        kind: "listening" as const,
        roundId: round.id,
        itemId: item.id,
        label: `${round.title}: poslech za ${item.points}`
      }));
    }

    return round.clues.map((clue, index) => ({
      kind: "common-denominator" as const,
      roundId: round.id,
      clueId: clue.id,
      label: `${round.title}: nápověda ${index + 1}`
    }));
  });
}

function findAudio(game: Game, target: AudioTarget | null) {
  if (!target) {
    return undefined;
  }

  const round = game.rounds.find((candidate) => candidate.id === target.roundId);
  if (!round) {
    return undefined;
  }

  if (target.kind === "question" && round.type === "question") {
    return round.items.find((item) => item.id === target.itemId)?.audio;
  }

  if (target.kind === "listening" && round.type === "listening") {
    return round.items.find((item) => item.id === target.itemId)?.audio;
  }

  if (target.kind === "common-denominator" && round.type === "common-denominator") {
    return round.clues.find((clue) => clue.id === target.clueId)?.audio;
  }

  return undefined;
}

function attachAudioToTarget(
  game: Game,
  target: AudioTarget | null,
  asset: AudioAsset
): Game {
  if (!target) {
    return game;
  }

  return {
    ...game,
    rounds: game.rounds.map((round) => {
      if (round.id !== target.roundId) {
        return round;
      }

      if (target.kind === "question" && round.type === "question") {
        return {
          ...round,
          items: round.items.map((item) =>
            item.id === target.itemId ? { ...item, audio: asset } : item
          )
        } satisfies QuestionRound;
      }

      if (target.kind === "listening" && round.type === "listening") {
        return {
          ...round,
          items: round.items.map((item) =>
            item.id === target.itemId ? { ...item, audio: asset } : item
          )
        } satisfies ListeningRound;
      }

      if (
        target.kind === "common-denominator" &&
        round.type === "common-denominator"
      ) {
        return {
          ...round,
          clues: round.clues.map((clue) =>
            clue.id === target.clueId ? { ...clue, audio: asset } : clue
          )
        } satisfies CommonDenominatorRound;
      }

      return round;
    })
  };
}

export default function AdminPage() {
  const [game, setGame] = useState<Game | null>(null);
  const [assets, setAssets] = useState<AudioAsset[]>([]);
  const [selectedTargetKey, setSelectedTargetKey] = useState("");
  const [status, setStatus] = useState("Načítám editor.");

  useEffect(() => {
    let isMounted = true;

    async function loadEditor() {
      try {
        const [gameResponse, assetsResponse] = await Promise.all([
          fetch("/api/games/demo-hudebni-riskuj"),
          fetch("/api/audio-assets")
        ]);

        if (!gameResponse.ok || !assetsResponse.ok) {
          throw new Error("Editor data request failed");
        }

        const loadedGame = (await gameResponse.json()) as Game;
        const loadedAssets = (await assetsResponse.json()) as AudioAsset[];

        if (!isMounted) {
          return;
        }

        setGame(loadedGame);
        setAssets(loadedAssets);
        setSelectedTargetKey(targetKey(buildAudioTargets(loadedGame)[0]));
        setStatus("");
      } catch {
        if (isMounted) {
          setStatus("Editor se nepodařilo načíst.");
        }
      }
    }

    void loadEditor();

    return () => {
      isMounted = false;
    };
  }, []);

  const targets = useMemo(() => (game ? buildAudioTargets(game) : []), [game]);
  const selectedTarget =
    targets.find((target) => targetKey(target) === selectedTargetKey) ?? null;
  const currentAudio = game ? findAudio(game, selectedTarget) : undefined;

  async function handleUpload(file: File | undefined) {
    if (!file || !game) {
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setStatus("Nahrávám MP3.");
    const response = await fetch("/api/audio-assets", {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      setStatus("MP3 se nepodařilo nahrát.");
      return;
    }

    const asset = (await response.json()) as AudioAsset;
    setAssets((currentAssets) => [...currentAssets, asset]);
    setGame((currentGame) =>
      currentGame ? attachAudioToTarget(currentGame, selectedTarget, asset) : currentGame
    );
    setStatus("Audio je připojené k položce.");
  }

  function handleSelectAsset(assetId: string) {
    const asset = assets.find((candidate) => candidate.id === assetId);
    if (!asset) {
      return;
    }

    setGame((currentGame) =>
      currentGame ? attachAudioToTarget(currentGame, selectedTarget, asset) : currentGame
    );
    setStatus("Audio z knihovny je připojené.");
  }

  async function handleSave() {
    if (!game) {
      return;
    }

    setStatus("Ukládám hru.");
    const response = await fetch(`/api/games/${game.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(game)
    });

    setStatus(response.ok ? "Hra je uložená." : "Hru se nepodařilo uložit.");
  }

  return (
    <main className="admin-editor">
      <h1>Editor hry</h1>

      {!game ? (
        <p className="status-message">{status}</p>
      ) : (
        <div className="editor-grid">
          <label className="editor-field">
            <span>Položka pro audio</span>
            <select
              value={selectedTargetKey}
              onChange={(event) => setSelectedTargetKey(event.target.value)}
            >
              {targets.map((target) => (
                <option key={targetKey(target)} value={targetKey(target)}>
                  {target.label}
                </option>
              ))}
            </select>
          </label>

          <label className="editor-field">
            <span>Nahrát MP3 k vybrané položce</span>
            <input
              accept="audio/mpeg,.mp3"
              type="file"
              onChange={(event) => void handleUpload(event.target.files?.[0])}
            />
          </label>

          <label className="editor-field">
            <span>Vybrat z nahraných MP3</span>
            <select
              value=""
              onChange={(event) => handleSelectAsset(event.target.value)}
            >
              <option value="">Vyberte audio asset</option>
              {assets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.originalName}
                </option>
              ))}
            </select>
          </label>

          <section className="audio-preview" aria-label="Aktuální audio">
            <h2>Aktuální audio</h2>
            {currentAudio ? (
              <>
                <dl>
                  <div>
                    <dt>Název v editoru</dt>
                    <dd>{currentAudio.displayName ?? currentAudio.originalName}</dd>
                  </div>
                  <div>
                    <dt>Soubor</dt>
                    <dd>{currentAudio.originalName}</dd>
                  </div>
                  <div>
                    <dt>URL</dt>
                    <dd>{currentAudio.src}</dd>
                  </div>
                </dl>
                <audio
                  aria-label="Náhled audio ukázky"
                  controls
                  src={currentAudio.src}
                />
              </>
            ) : (
              <p>Vybraná položka zatím nemá audio.</p>
            )}
          </section>

          {assets.length > 0 && (
            <section className="asset-list" aria-label="Audio knihovna">
              <h2>Knihovna MP3</h2>
              {assets.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => handleSelectAsset(asset.id)}
                >
                  {asset.originalName}
                </button>
              ))}
            </section>
          )}

          <div className="editor-actions">
            <button type="button" onClick={() => void handleSave()}>
              Uložit hru
            </button>
            {status && <p className="status-message">{status}</p>}
          </div>
        </div>
      )}
    </main>
  );
}
