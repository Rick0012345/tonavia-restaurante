import Link from "next/link";
import { ClipboardList, Home, Package, UtensilsCrossed } from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const nav = [
    { href: "/", label: "Painel", icon: Home },
    { href: "/ordens", label: "Ordens", icon: ClipboardList },
    { href: "/estoque", label: "Estoque", icon: Package },
  ];

  return (
    <div className="min-h-screen bg-[#f6f2ea] text-stone-950">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-stone-200 bg-white/90 px-5 py-6 shadow-sm lg:block">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-lg bg-emerald-700 text-white">
            <UtensilsCrossed size={22} />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">Tonavia</p>
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
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-emerald-50 hover:text-emerald-900"
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b border-stone-200 bg-[#f6f2ea]/95 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between">
            <strong>Tonavia</strong>
            <div className="flex gap-2">
              {nav.map((item) => (
                <Link key={item.href} href={item.href} className="rounded-md bg-white px-3 py-2 text-sm shadow-sm">
                  {item.label}
                </Link>
              ))}
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
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-800">{eyebrow}</p>
      <h2 className="text-3xl font-bold tracking-tight text-stone-950">{title}</h2>
      {children ? <p className="max-w-3xl text-sm leading-6 text-stone-600">{children}</p> : null}
    </div>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-lg border border-stone-200 bg-white p-5 shadow-sm ${className}`}>{children}</section>;
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-stone-700">
      {label}
      {children}
    </label>
  );
}

export const inputClass =
  "h-10 rounded-md border border-stone-300 bg-white px-3 text-sm outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100";

export function SubmitButton({ children }: { children: React.ReactNode }) {
  return (
    <button className="inline-flex h-10 items-center justify-center rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800">
      {children}
    </button>
  );
}
