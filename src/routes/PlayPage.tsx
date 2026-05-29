type PlayPageProps = {
  gameId: string;
};

export function PlayPage({ gameId }: PlayPageProps) {
  return (
    <section className="page-panel page-panel-wide" aria-labelledby="play-title">
      <p className="eyebrow">Projekční režim</p>
      <h1 id="play-title">Herní režim</h1>
      <p className="game-code">Kód hry: {gameId}</p>
      <p className="page-copy">
        Tady bude velká herní tabule pro týmy, body a hudební otázky.
      </p>
    </section>
  );
}
