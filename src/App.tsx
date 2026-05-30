import AdminPage from "./routes/AdminPage";
import PlayPage from "./routes/PlayPage";

export default function App() {
  const playMatch = window.location.pathname.match(/^\/play\/([^/]+)$/);

  if (window.location.pathname === "/admin") {
    return <AdminPage />;
  }

  if (playMatch) {
    return <PlayPage gameId={decodeURIComponent(playMatch[1])} />;
  }

  return (
    <main className="app-shell">
      <section className="intro-panel" aria-labelledby="app-title">
        <p className="intro-kicker">Česká retro soutěž pro hudební večery</p>
        <h1 id="app-title">Riskuj — hudební kvíz</h1>
        <p className="intro-text">
          Základ aplikace je připravený pro herní tabuli, moderátorské ovládání
          a práci s hudebními ukázkami.
        </p>
        <nav className="home-actions" aria-label="Rychlé odkazy">
          <a href="/admin">Editor</a>
          <a href="/play/demo-hudebni-riskuj">Spustit demo</a>
        </nav>
      </section>
    </main>
  );
}
