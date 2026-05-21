import Link from "next/link";
import { AlertTriangle, Banknote, CalendarDays, PackageCheck, ReceiptText, Search, ShoppingCart } from "lucide-react";
import { AppShell, Card, PageTitle, inputClass } from "@/app/components";
import { formatCurrency, formatDecimal } from "@/lib/format";
import { getDashboardData } from "@/lib/queries";
import { endOfDay, formatDateInput, startOfDay } from "@/lib/time";

export const dynamic = "force-dynamic";

type HomeProps = {
  searchParams?: Promise<{
    from?: string;
    to?: string;
  }>;
};

function parseDate(value: string | undefined) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function addDays(date: Date, amount: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount);
  return copy;
}

function getPeriod(params?: { from?: string; to?: string }) {
  const today = startOfDay(new Date());
  const from = parseDate(params?.from);
  const to = parseDate(params?.to);
  const start = startOfDay(from ?? today);
  const end = endOfDay(to ?? from ?? today);

  return start <= end ? { start, end } : { start: startOfDay(end), end: endOfDay(start) };
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(new Date(`${value}T00:00:00`));
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const period = getPeriod(params);
  const data = await getDashboardData(period);
  const maxRevenue = Math.max(...data.revenueByDay.map((day) => day.totalCents), 1);
  const maxChannelCount = Math.max(...data.channels.map((channel) => channel.count), 1);
  const totalChannelCount = data.channels.reduce((sum, channel) => sum + channel.count, 0);
  const periodLabel = `${new Intl.DateTimeFormat("pt-BR").format(period.start)} ate ${new Intl.DateTimeFormat("pt-BR").format(period.end)}`;
  const today = startOfDay(new Date());
  const shortcuts = [
    { label: "Hoje", from: today, to: today },
    { label: "7 dias", from: addDays(today, -6), to: today },
    { label: "30 dias", from: addDays(today, -29), to: today },
    { label: "Este mes", from: new Date(today.getFullYear(), today.getMonth(), 1), to: today },
  ];
  const metrics = [
    { label: "Faturado no periodo", value: formatCurrency(data.revenueCents), icon: Banknote },
    { label: "Vendas no periodo", value: data.totalOrders, icon: ShoppingCart },
    { label: "Vendas abertas", value: data.openOrders, icon: ShoppingCart },
    { label: "Vendas finalizadas", value: data.closedOrders, icon: PackageCheck },
    { label: "Ticket medio", value: formatCurrency(data.averageTicketCents), icon: ReceiptText },
  ];

  return (
    <AppShell>
      <PageTitle eyebrow="Operacao" title="Painel do restaurante">
        Acompanhe faturamento, canais de venda e estoque com filtro por intervalo de tempo.
      </PageTitle>

      <Card className="mb-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <CalendarDays className="text-accent" size={20} />
              <h2 className="text-xl font-bold">Faturamento por periodo</h2>
            </div>
            <p className="text-muted text-sm">Mostrando vendas de {periodLabel}.</p>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <div className="flex flex-wrap gap-2">
              {shortcuts.map((shortcut) => (
                <Link
                  key={shortcut.label}
                  href={`/?from=${formatDateInput(shortcut.from)}&to=${formatDateInput(shortcut.to)}`}
                  className="filter-chip rounded-md border px-3 py-2 text-sm font-semibold"
                >
                  {shortcut.label}
                </Link>
              ))}
            </div>
            <form className="grid gap-2 sm:grid-cols-[160px_160px_auto]">
              <label className="text-soft grid gap-1 text-sm font-medium">
                Inicio
                <input name="from" type="date" className={inputClass} defaultValue={formatDateInput(period.start)} />
              </label>
              <label className="text-soft grid gap-1 text-sm font-medium">
                Fim
                <input name="to" type="date" className={inputClass} defaultValue={formatDateInput(period.end)} />
              </label>
              <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 sm:self-end">
                <Search size={16} /> Filtrar
              </button>
            </form>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.label}>
              <div className="flex items-center justify-between">
                <p className="text-muted text-sm font-medium">{metric.label}</p>
                <Icon className="text-accent" size={20} />
              </div>
              <strong className="mt-4 block text-2xl font-bold">{metric.value}</strong>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold">Faturamento por dia</h3>
              <p className="text-muted text-sm">Somente vendas finalizadas entram no faturamento.</p>
            </div>
            <strong className="text-accent text-2xl font-bold tabular-nums">{formatCurrency(data.revenueCents)}</strong>
          </div>
          {data.revenueByDay.length ? (
            <div className="grid gap-3">
              {data.revenueByDay.map((day) => (
                <div key={day.date} className="grid gap-2 sm:grid-cols-[72px_1fr_120px] sm:items-center">
                  <span className="text-muted text-sm font-semibold tabular-nums">{formatShortDate(day.date)}</span>
                  <div className="revenue-track h-3 overflow-hidden rounded-full">
                    <div className="revenue-bar h-full rounded-full" style={{ width: `${Math.max(8, (day.totalCents / maxRevenue) * 100)}%` }} />
                  </div>
                  <strong className="text-sm tabular-nums sm:text-right">{formatCurrency(day.totalCents)}</strong>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state rounded-lg border p-4">
              <p className="font-semibold">Nenhum faturamento neste periodo.</p>
              <p className="text-muted mt-1 text-sm">Finalize vendas no caixa ou selecione outro intervalo.</p>
            </div>
          )}
        </Card>

        <Card>
          <div className="mb-4">
            <h3 className="text-lg font-bold">Vendas por canal</h3>
            <p className="text-muted text-sm">Compare local, delivery e retirada no periodo.</p>
          </div>
          <div className="mb-5 flex justify-center">
            <div
              className="donut-chart"
              style={{
                background: `conic-gradient(var(--chart-local) 0 ${totalChannelCount ? (data.channels[0].count / totalChannelCount) * 100 : 0}%, var(--chart-delivery) 0 ${totalChannelCount ? ((data.channels[0].count + data.channels[1].count) / totalChannelCount) * 100 : 0}%, var(--chart-takeout) 0 100%)`,
              }}
            >
              <div>
                <strong>{totalChannelCount}</strong>
                <span>vendas</span>
              </div>
            </div>
          </div>
          <div className="grid gap-3">
            {data.channels.map((channel) => (
              <div key={channel.channel} className="channel-row grid gap-2 rounded-md border p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className={`channel-dot channel-dot-${channel.channel.toLowerCase()}`} />
                    <span className="font-semibold">{channel.label}</span>
                  </div>
                  <strong className="tabular-nums">{channel.count}</strong>
                </div>
                <div className="revenue-track h-2 overflow-hidden rounded-full">
                  <div className={`channel-bar channel-bar-${channel.channel.toLowerCase()} h-full rounded-full`} style={{ width: `${Math.max(channel.count ? 8 : 0, (channel.count / maxChannelCount) * 100)}%` }} />
                </div>
                <p className="text-muted text-sm">Faturado: {formatCurrency(channel.revenueCents)}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold">Vendas recentes</h3>
            <a className="text-accent text-sm font-semibold" href="/vendas">Abrir caixa</a>
          </div>
          <div className="overflow-x-auto">
            <table className="text-left text-sm">
              <thead className="table-head border-b">
                <tr>
                  <th className="py-3">Venda</th>
                  <th>Cliente/Mesa</th>
                  <th>Status</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders.map((order) => (
                  <tr key={order.id} className="table-row border-b">
                    <td className="py-3 font-semibold">#{order.number}</td>
                    <td>{order.customerName || order.tableLabel || "Balcao"}</td>
                    <td>{order.status === "OPEN" ? "Aberta" : order.status === "CLOSED" ? "Finalizada" : "Cancelada"}</td>
                    <td className="font-semibold">{formatCurrency(order.totalCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="text-warning" size={20} />
            <h3 className="text-lg font-bold">Estoque baixo</h3>
          </div>
          <div className="space-y-3">
            {data.lowStock.length ? (
              data.lowStock.map((product) => (
                <div key={product.id} className="warning-panel rounded-md border p-3">
                  <p className="font-semibold">{product.name}</p>
                  <p className="text-muted text-sm">
                    Atual: {formatDecimal(product.quantity)} {product.unit} | minimo: {formatDecimal(product.minQuantity)} {product.unit}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-muted text-sm">Nenhum produto abaixo do minimo.</p>
            )}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
