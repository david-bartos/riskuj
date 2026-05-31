import type { ReactNode } from "react";

type LayoutProps = {
  children: ReactNode;
  currentPath: string;
  onNavigate: (path: string) => void;
  showPlayShortcut?: boolean;
};

const navItems = [
  { label: "Domů", path: "/" },
  { label: "Editor", path: "/admin" },
  { label: "Riskuj 6.6", path: "/play/riskuj-2026-06-06" }
];

export function Layout({ children, currentPath, onNavigate, showPlayShortcut = true }: LayoutProps) {
  const visibleNavItems = showPlayShortcut
    ? navItems
    : navItems.filter((item) => !item.path.startsWith("/play/"));

  return (
    <div className="app-shell">
      <header className="app-header">
        <button
          className="brand-mark"
          type="button"
          onClick={() => onNavigate("/")}
        >
          Riskuj!
        </button>
        <nav className="app-nav" aria-label="Hlavní navigace">
          {visibleNavItems.map((item) => (
            <button
              aria-current={currentPath === item.path ? "page" : undefined}
              className="nav-link"
              key={item.path}
              type="button"
              onClick={() => onNavigate(item.path)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
}
