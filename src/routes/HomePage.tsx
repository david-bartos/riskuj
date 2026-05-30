type HomePageProps = {
  onNavigate: (path: string) => void;
};

export function HomePage({ onNavigate }: HomePageProps) {
  return (
    <section className="hero-panel" aria-labelledby="home-title">
      <p className="eyebrow">Český hudební kvíz pro večery s publikem</p>
      <h1 id="home-title">Hudební RISKuj!</h1>
      <p className="hero-logo" aria-hidden="true">
        RISKuj!
      </p>
      <p className="hero-copy">
        Retro soutěžní atmosféra, výrazné kontrasty a ovládání připravené pro
        projekci v klubovně, třídě i na pódiu.
      </p>
      <div className="action-row">
        <button
          className="button-primary"
          type="button"
          onClick={() => onNavigate("/admin")}
        >
          Editor hry
        </button>
        <button
          className="button-secondary"
          type="button"
          onClick={() => onNavigate("/play/riskuj-2026-06-06")}
        >
          Spustit hru
        </button>
      </div>
    </section>
  );
}
