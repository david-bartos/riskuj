import { useEffect, useState } from "react";
import { Layout } from "./components/Layout";
import { AdminPage } from "./routes/AdminPage";
import { HomePage } from "./routes/HomePage";
import { PlayPage } from "./routes/PlayPage";

type Route =
  | { name: "home" }
  | { name: "admin" }
  | { name: "play"; gameId: string };

function parseRoute(pathname: string): Route {
  if (pathname === "/admin") {
    return { name: "admin" };
  }

  const playMatch = pathname.match(/^\/play\/([^/]+)$/);
  if (playMatch) {
    return { name: "play", gameId: decodeURIComponent(playMatch[1]) };
  }

  return { name: "home" };
}

export default function App() {
  const [path, setPath] = useState(() => window.location.pathname);
  const route = parseRoute(path);

  useEffect(() => {
    const handlePopState = () => setPath(window.location.pathname);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = (nextPath: string) => {
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, "", nextPath);
    }
    setPath(nextPath);
  };

  let page = <HomePage onNavigate={navigate} />;

  if (route.name === "admin") {
    page = <AdminPage />;
  }

  if (route.name === "play") {
    page = <PlayPage gameId={route.gameId} onExit={() => navigate("/")} />;
  }

  return (
    <Layout currentPath={path} onNavigate={navigate}>
      {page}
    </Layout>
  );
}
