import type { ReactNode } from "react";

type LayoutProps = {
  children: ReactNode;
  currentPath: string;
  onNavigate: (path: string) => void;
};

const navItems = [
  { label: "Domů", path: "/" },
  { label: "Editor", path: "/admin" },
  { label: "Demo hra", path: "/play/demo" }
];

export function Layout({ children, currentPath, onNavigate }: LayoutProps) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <button
          className="brand-mark"
          type="button"
          onClick={() => onNavigate("/")}
        >
          Hudební RISKuj!
        </button>
        <nav className="app-nav" aria-label="Hlavní navigace">
          {navItems.map((item) => (
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
