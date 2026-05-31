import { useEffect, useState } from "react";
import InteractiveTooltips from "./components/InteractiveTooltips";
import { AdminPage } from "./routes/AdminPage";
import { PlayPage } from "./routes/PlayPage";

type Route =
  | { name: "admin" }
  | { name: "play"; gameId: string };

function parseRoute(pathname: string): Route {
  const playMatch = pathname.match(/^\/play\/([^/]+)$/);
  if (playMatch) {
    return { name: "play", gameId: decodeURIComponent(playMatch[1]) };
  }

  return { name: "admin" };
}

export default function App() {
  const [path, setPath] = useState(() => window.location.pathname);
  const route = parseRoute(path);
  const [runningGameId, setRunningGameId] = useState(() => {
    const initialRoute = parseRoute(window.location.pathname);
    return initialRoute.name === "play" ? initialRoute.gameId : "";
  });

  useEffect(() => {
    const handlePopState = () => setPath(window.location.pathname);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = (nextPath: string) => {
    const nextRoute = parseRoute(nextPath);
    if (nextRoute.name === "play") {
      setRunningGameId(nextRoute.gameId);
    }

    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, "", nextPath);
    }
    setPath(nextPath);
  };

  const playGameId = route.name === "play" ? route.gameId : runningGameId;

  return (
    <>
      <InteractiveTooltips />
      {route.name === "admin" ? (
        <AdminPage
          runningGameId={runningGameId}
          onNavigate={navigate}
          onResumeGame={() => {
            if (runningGameId) {
              navigate(`/play/${encodeURIComponent(runningGameId)}`);
            }
          }}
        />
      ) : null}
      {playGameId ? (
        <div hidden={route.name !== "play"}>
          <PlayPage
            key={playGameId}
            gameId={playGameId}
            isActive={route.name === "play"}
            onExit={() => navigate("/")}
          />
        </div>
      ) : null}
    </>
  );
}
