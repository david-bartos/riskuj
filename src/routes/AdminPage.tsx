import { useEffect, useRef, useState } from "react";
import { gamesClient, type GameSummary } from "../api/gamesClient";
import GameEditor, { createEmptyGame } from "../components/admin/GameEditor";
import type { AudioAsset, Game } from "../types/game";

type AdminPageProps = {
  runningGameId?: string;
  onNavigate?: (path: string) => void;
  onResumeGame?: () => void;
};

function createSummary(game: Game): GameSummary {
  return {
    id: game.id,
    title: game.title,
    updatedAt: game.updatedAt ?? game.createdAt ?? "",
    roundCount: game.rounds.length
  };
}

function upsertSummary(summaries: GameSummary[], summary: GameSummary) {
  const existingIndex = summaries.findIndex((current) => current.id === summary.id);

  if (existingIndex === -1) {
    return [summary, ...summaries];
  }

  return summaries.map((current) => (current.id === summary.id ? summary : current));
}

export function AdminPage({ runningGameId = "", onNavigate, onResumeGame }: AdminPageProps) {
  const [games, setGames] = useState<GameSummary[]>([]);
  const [selectedGameId, setSelectedGameId] = useState("");
  const [game, setGame] = useState<Game | null>(null);
  const [audioAssets, setAudioAssets] = useState<AudioAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const loadRequestId = useRef(0);

  useEffect(() => {
    let isMounted = true;
    const requestId = ++loadRequestId.current;

    async function loadInitialGame() {
      try {
        setIsLoading(true);
        const [summaries, assets] = await Promise.all([
          gamesClient.listGames(),
          gamesClient.listAudioAssets()
        ]);
        if (!isMounted || requestId !== loadRequestId.current) {
          return;
        }

        setGames(summaries);
        setAudioAssets(assets);
        const firstGame = summaries[0];
        if (firstGame) {
          const loadedGame = await gamesClient.loadGame(firstGame.id);
          if (!isMounted || requestId !== loadRequestId.current) {
            return;
          }
          setSelectedGameId(firstGame.id);
          setGame(loadedGame);
        } else {
          setGame(createEmptyGame());
        }
      } catch (loadError) {
        if (!isMounted || requestId !== loadRequestId.current) {
          return;
        }
        const detail = loadError instanceof Error ? loadError.message : "neznámá chyba";
        setError(`Hry se nepodařilo načíst. ${detail}`);
        setGame(createEmptyGame());
      } finally {
        if (isMounted && requestId === loadRequestId.current) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialGame();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSelectGame(gameId: string) {
    const requestId = ++loadRequestId.current;
    setSelectedGameId(gameId);
    setStatus(null);
    setError(null);

    if (!gameId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const loadedGame = await gamesClient.loadGame(gameId);
      if (requestId === loadRequestId.current) {
        setGame(loadedGame);
      }
    } catch (loadError) {
      if (requestId === loadRequestId.current) {
        const detail = loadError instanceof Error ? loadError.message : "neznámá chyba";
        setError(`Hru se nepodařilo načíst. ${detail}`);
      }
    } finally {
      if (requestId === loadRequestId.current) {
        setIsLoading(false);
      }
    }
  }

  function handleCreateNewGame() {
    loadRequestId.current += 1;
    setSelectedGameId("");
    setIsLoading(false);
    setError(null);
    setStatus("Nová hra je připravená k úpravám.");
    setGame(createEmptyGame());
  }

  async function handleUploadAudio(file: File) {
    const asset = await gamesClient.uploadAudio(file);
    setAudioAssets((currentAssets) => [...currentAssets, asset]);
    return asset;
  }

  function handleStartTest() {
    if (!selectedGameId) {
      return;
    }

    if (runningGameId && runningGameId !== selectedGameId) {
      const shouldStart = window.confirm(
        "Už je rozehraná jiná hra. Spuštěním nové hry se aktuální průběh nahradí. Pokračovat?"
      );

      if (!shouldStart) {
        return;
      }
    }

    const playPath = `/play/${encodeURIComponent(selectedGameId)}`;
    if (onNavigate) {
      onNavigate(playPath);
      return;
    }

    window.history.pushState({}, "", playPath);
  }

  async function handleSave(nextGame: Game) {
    setIsSaving(true);
    setError(null);
    setStatus(null);

    try {
      const savedGame = await gamesClient.saveGame(nextGame);
      const savedSummary = createSummary(savedGame);
      setGame(savedGame);
      setSelectedGameId(savedGame.id);
      try {
        const refreshedGames = await gamesClient.listGames();
        setGames(upsertSummary(refreshedGames, savedSummary));
      } catch {
        setGames((currentGames) => upsertSummary(currentGames, savedSummary));
      }
      setStatus("Hra byla uložená.");
    } catch (saveError) {
      const detail = saveError instanceof Error ? saveError.message : "neznámá chyba";
      setError(`Hru se nepodařilo uložit. ${detail}`);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <p className="intro-kicker">Moderátorský pult</p>
        <h1>Editor hry</h1>
        <p className="intro-text">Upravte otázky, poslechové ukázky a třetí kolo.</p>
        <p className="intro-text">
          Hru můžete také vyexportovat nebo nahradit importem z JSON souboru.
        </p>
      </header>

      <section className="admin-toolbar" aria-label="Správa her">
        <label className="field-stack">
          <span>Načíst existující hru</span>
          <select
            value={selectedGameId}
            onChange={(event) => void handleSelectGame(event.target.value)}
          >
            <option value="">Nová nebo nevybraná hra</option>
            {games.map((summary) => (
              <option key={summary.id} value={summary.id}>
                {summary.title}
              </option>
            ))}
          </select>
        </label>
        <button type="button" onClick={handleCreateNewGame}>
          Nová hra
        </button>
        {runningGameId ? (
          <button
            type="button"
            onClick={() => {
              if (onResumeGame) {
                onResumeGame();
                return;
              }

              const playPath = `/play/${encodeURIComponent(runningGameId)}`;
              window.history.pushState({}, "", playPath);
            }}
          >
            Vrátit se do hry
          </button>
        ) : null}
        <button type="button" disabled={!selectedGameId} onClick={handleStartTest}>
          Spustit hru
        </button>
      </section>

      {isLoading ? <p role="status">Načítám hry...</p> : null}
      {error ? (
        <p className="form-message form-message-error" role="alert">
          {error}
        </p>
      ) : null}
      {status ? (
        <p className="form-message" role="status">
          {status}
        </p>
      ) : null}
      {game ? (
        <GameEditor
          initialGame={game}
          audioAssets={audioAssets}
          isSaving={isSaving}
          onSave={handleSave}
          onUploadAudio={handleUploadAudio}
        />
      ) : null}
    </main>
  );
}

export default AdminPage;
