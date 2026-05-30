import AdminPage from "./routes/AdminPage";

export default function App() {
  if (window.location.pathname === "/admin") {
    return <AdminPage />;
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
      </section>
    </main>
  );
}
