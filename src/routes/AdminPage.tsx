import { useEffect, useRef, useState } from "react";
import { gamesClient, type GameSummary } from "../api/gamesClient";
import GameEditor, { createEmptyGame } from "../components/admin/GameEditor";
import type { AudioAsset, Game } from "../types/game";

export function AdminPage() {
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

  async function handleSave(nextGame: Game) {
    setIsSaving(true);
    setError(null);
    setStatus(null);

    try {
      const savedGame = await gamesClient.saveGame(nextGame);
      setGame(savedGame);
      setSelectedGameId(savedGame.id);
      setGames((currentGames) => {
        const summary = {
          id: savedGame.id,
          title: savedGame.title,
          updatedAt: savedGame.updatedAt,
          roundCount: savedGame.rounds.length
        };
        const existingIndex = currentGames.findIndex((current) => current.id === savedGame.id);
        if (existingIndex === -1) {
          return [...currentGames, summary];
        }
        return currentGames.map((current) => (current.id === savedGame.id ? summary : current));
      });
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
        <p className="intro-text">
          Upravte otázky, poslechové ukázky a třetí kolo. Hru můžete také vyexportovat nebo
          nahradit importem z JSON souboru.
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
