import Link from "next/link";
import { Home, Package, ShoppingCart, UtensilsCrossed } from "lucide-react";
import { ThemeToggle } from "@/app/ThemeToggle";

export function AppShell({ children }: { children: React.ReactNode }) {
  const nav = [
    { href: "/", label: "Painel", icon: Home },
    { href: "/vendas", label: "Vendas", icon: ShoppingCart },
    { href: "/estoque", label: "Estoque", icon: Package },
  ];

  return (
    <div className="app-surface min-h-screen">
      <aside className="sidebar-panel fixed inset-y-0 left-0 hidden w-64 border-r px-5 py-6 shadow-sm lg:block">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-lg bg-emerald-700 text-white">
            <UtensilsCrossed size={22} />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">Tonavia</p>
            <h1 className="text-lg font-bold">Restaurante</h1>
          </div>
        </div>
        <nav className="mt-10 space-y-2">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="nav-link flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition"
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-8">
          <ThemeToggle />
        </div>
      </aside>
      <div className="lg:pl-64">
        <header className="mobile-header sticky top-0 z-10 border-b px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <strong>Tonavia</strong>
            <div className="flex flex-wrap items-center gap-2">
              {nav.map((item) => (
                <Link key={item.href} href={item.href} className="mobile-nav-link rounded-md px-3 py-2 text-sm shadow-sm">
                  {item.label}
                </Link>
              ))}
              <ThemeToggle />
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

export function PageTitle({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-2">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">{eyebrow}</p>
      <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
      {children ? <p className="text-muted max-w-3xl text-sm leading-6">{children}</p> : null}
    </div>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`card-surface rounded-lg border p-5 shadow-sm ${className}`}>{children}</section>;
}

export function SectionTabs({
  tabs,
  active,
}: {
  tabs: Array<{ href: string; label: string; description?: string }>;
  active: string;
}) {
  return (
    <nav className="section-tabs mb-6 grid gap-2 md:grid-cols-2 xl:grid-cols-4" aria-label="Navegacao da pagina">
      {tabs.map((tab) => (
        <Link key={tab.href} href={tab.href} className={`section-tab rounded-lg border p-4 ${active === tab.href ? "section-tab-active" : ""}`}>
          <span className="block font-bold">{tab.label}</span>
          {tab.description ? <span className="text-muted mt-1 block text-sm">{tab.description}</span> : null}
        </Link>
      ))}
    </nav>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="text-soft grid gap-1.5 text-sm font-medium">
      {label}
      {children}
    </label>
  );
}

export const inputClass =
  "form-control h-10 w-full rounded-md border px-3 text-sm outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100";

export function SubmitButton({ children }: { children: React.ReactNode }) {
  return (
    <button className="inline-flex h-10 items-center justify-center rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800">
      {children}
    </button>
  );
}
