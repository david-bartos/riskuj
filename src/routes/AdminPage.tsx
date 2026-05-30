import { useEffect, useState } from "react";
import { gamesClient, type GameSummary } from "../api/gamesClient";
import GameEditor, { createEmptyGame } from "../components/admin/GameEditor";
import type { Game } from "../types/game";

export default function AdminPage() {
  const [games, setGames] = useState<GameSummary[]>([]);
  const [selectedGameId, setSelectedGameId] = useState("");
  const [game, setGame] = useState<Game | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadInitialGame() {
      try {
        setIsLoading(true);
        const summaries = await gamesClient.listGames();
        if (!isMounted) {
          return;
        }

        setGames(summaries);
        const firstGame = summaries[0];
        if (firstGame) {
          const loadedGame = await gamesClient.loadGame(firstGame.id);
          if (!isMounted) {
            return;
          }
          setSelectedGameId(firstGame.id);
          setGame(loadedGame);
        } else {
          setGame(createEmptyGame());
        }
      } catch (loadError) {
        if (!isMounted) {
          return;
        }
        const detail = loadError instanceof Error ? loadError.message : "neznámá chyba";
        setError(`Hry se nepodařilo načíst. ${detail}`);
        setGame(createEmptyGame());
      } finally {
        if (isMounted) {
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
    setSelectedGameId(gameId);
    setStatus(null);
    setError(null);

    if (!gameId) {
      return;
    }

    try {
      setIsLoading(true);
      setGame(await gamesClient.loadGame(gameId));
    } catch (loadError) {
      const detail = loadError instanceof Error ? loadError.message : "neznámá chyba";
      setError(`Hru se nepodařilo načíst. ${detail}`);
    } finally {
      setIsLoading(false);
    }
  }

  function handleCreateNewGame() {
    setSelectedGameId("");
    setError(null);
    setStatus("Nová hra je připravená k úpravám.");
    setGame(createEmptyGame());
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
        const summary = { id: savedGame.id, title: savedGame.title };
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
        <p className="intro-text">Upravte otázky, poslechové ukázky a třetí kolo.</p>
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
      {game ? <GameEditor initialGame={game} isSaving={isSaving} onSave={handleSave} /> : null}
    </main>
  );
}
