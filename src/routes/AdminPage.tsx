export function AdminPage() {
  return (
    <section className="page-panel" aria-labelledby="admin-title">
      <p className="eyebrow">Příprava soutěže</p>
      <h1 id="admin-title">Editor hry</h1>
      <p className="page-copy">
        Zde vznikne administrační editor kol, kategorií a hudebních ukázek.
      </p>
      <div className="placeholder-grid" aria-label="Připravované části editoru">
        <span>Kategorie</span>
        <span>Otázky</span>
        <span>Hudební ukázky</span>
      </div>
    </section>
  );
}
