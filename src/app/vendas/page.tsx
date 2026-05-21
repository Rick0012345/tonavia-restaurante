import { Check, Clock, X } from "lucide-react";
import { AppShell, Card, PageTitle, SectionTabs } from "@/app/components";
import { VendaRapidaForm } from "@/app/vendas/VendaRapidaForm";
import { cancelServiceOrder, closeServiceOrder, createServiceOrder } from "@/lib/actions";
import { formatCurrency, formatDecimal } from "@/lib/format";
import { getOrdersData } from "@/lib/queries";

export const dynamic = "force-dynamic";

type SalesTab = "nova" | "abertas" | "historico";

type SalesPageProps = {
  searchParams?: Promise<{
    aba?: string;
  }>;
};

function getActiveTab(value: string | undefined): SalesTab {
  if (value === "abertas" || value === "historico") return value;
  return "nova";
}

export default async function SalesPage({ searchParams }: SalesPageProps) {
  const params = await searchParams;
  const activeTab = getActiveTab(params?.aba);
  const { orders, products } = await getOrdersData();
  const openOrders = orders.filter((order) => order.status === "OPEN");
  const finishedToday = orders.filter((order) => order.status === "CLOSED").slice(0, 6);
  const tabs = [
    { href: "/vendas?aba=nova", label: "Nova venda", description: "Pesar, conferir e salvar" },
    { href: "/vendas?aba=abertas", label: "Em aberto", description: `${openOrders.length} aguardando pagamento` },
    { href: "/vendas?aba=historico", label: "Historico", description: "Ultimas vendas registradas" },
  ];

  return (
    <AppShell>
      <PageTitle eyebrow="Caixa" title="Venda de self-service">
        Registre o prato por peso, adicione bebidas ou extras e veja o total antes de salvar.
      </PageTitle>

      <div className="mb-6 grid gap-3 md:grid-cols-3">
        <Card className="py-4">
          <p className="text-muted text-sm font-medium">Vendas em aberto</p>
          <strong className="mt-2 block text-2xl font-bold tabular-nums">{openOrders.length}</strong>
        </Card>
        <Card className="py-4">
          <p className="text-muted text-sm font-medium">Ultimas finalizadas</p>
          <strong className="mt-2 block text-2xl font-bold tabular-nums">{finishedToday.length}</strong>
        </Card>
        <Card className="py-4">
          <p className="text-muted text-sm font-medium">Atalho do fluxo</p>
          <strong className="mt-2 block text-lg font-bold">Pesar, conferir, salvar</strong>
        </Card>
      </div>

      <SectionTabs active={`/vendas?aba=${activeTab}`} tabs={tabs} />

      {activeTab === "nova" ? (
        <Card>
          <div className="mb-4">
            <h2 className="text-xl font-bold">Nova venda</h2>
            <p className="text-muted mt-1 text-sm">Feito para o ritmo do caixa: poucos campos, total visivel e nomes do restaurante.</p>
          </div>
          <VendaRapidaForm products={products} action={createServiceOrder} />
        </Card>
      ) : null}

      {activeTab === "abertas" ? (
        <Card>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">Vendas em aberto</h2>
                <p className="text-muted text-sm">Finalize quando o cliente pagar.</p>
              </div>
              <Clock className="text-accent" size={22} />
            </div>
            <div className="space-y-4">
              {openOrders.length ? (
                openOrders.map((order) => (
                  <article key={order.id} className="sale-card rounded-lg border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-bold">Venda #{order.number}</h3>
                        <p className="text-muted text-sm">{order.customerName || order.tableLabel || "Balcao"}</p>
                      </div>
                      <div className="text-right">
                        <span className="status-chip rounded-md px-2 py-1 text-xs font-semibold">Aberta</span>
                        <p className="text-accent mt-2 text-xl font-bold tabular-nums">{formatCurrency(order.totalCents)}</p>
                      </div>
                    </div>
                    <div className="text-soft mt-3 grid gap-2 text-sm">
                      {order.weightLines.map((line) => (
                        <p key={line.id}>
                          Prato: {formatDecimal(line.weightKg)} kg x {formatCurrency(line.pricePerKgCents)}
                        </p>
                      ))}
                      {order.items.map((item) => (
                        <p key={item.id}>
                          {item.description}: {formatDecimal(item.quantity)} x {formatCurrency(item.unitPriceCents)}
                        </p>
                      ))}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <form action={closeServiceOrder}>
                        <input type="hidden" name="id" value={order.id} />
                        <button className="inline-flex h-10 items-center gap-2 rounded-md bg-emerald-700 px-3 text-sm font-semibold text-white hover:bg-emerald-800">
                          <Check size={16} /> Receber e finalizar
                        </button>
                      </form>
                      <form action={cancelServiceOrder}>
                        <input type="hidden" name="id" value={order.id} />
                        <button className="nav-link inline-flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-semibold">
                          <X size={16} /> Cancelar
                        </button>
                      </form>
                    </div>
                  </article>
                ))
              ) : (
                <div className="empty-state rounded-lg border p-4">
                  <p className="font-semibold">Nenhuma venda em aberto.</p>
                  <p className="text-muted mt-1 text-sm">Quando salvar uma venda, ela aparece aqui para finalizar no pagamento.</p>
                </div>
              )}
            </div>
        </Card>
      ) : null}

      {activeTab === "historico" ? (
        <Card>
            <h2 className="mb-4 text-xl font-bold">Historico rapido</h2>
            <div className="overflow-x-auto">
              <table className="text-left text-sm">
                <thead className="table-head border-b">
                  <tr>
                    <th className="py-3">Venda</th>
                    <th>Cliente/mesa</th>
                    <th>Status</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 8).map((order) => (
                    <tr key={order.id} className="table-row border-b">
                      <td className="py-3 font-semibold">#{order.number}</td>
                      <td>{order.customerName || order.tableLabel || "Balcao"}</td>
                      <td>{order.status === "OPEN" ? "Aberta" : order.status === "CLOSED" ? "Finalizada" : "Cancelada"}</td>
                      <td className="font-semibold tabular-nums">{formatCurrency(order.totalCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        </Card>
      ) : null}
    </AppShell>
  );
}
