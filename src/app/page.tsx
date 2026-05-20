import { AlertTriangle, Banknote, ClipboardList, PackageCheck, ReceiptText } from "lucide-react";
import { AppShell, Card, PageTitle } from "@/app/components";
import { formatCurrency, formatDecimal } from "@/lib/format";
import { getDashboardData } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function Home() {
  const data = await getDashboardData();
  const metrics = [
    { label: "Faturado hoje", value: formatCurrency(data.revenueCents), icon: Banknote },
    { label: "OS abertas", value: data.openOrders, icon: ClipboardList },
    { label: "OS finalizadas", value: data.closedOrders, icon: PackageCheck },
    { label: "Ticket medio", value: formatCurrency(data.averageTicketCents), icon: ReceiptText },
  ];

  return (
    <AppShell>
      <PageTitle eyebrow="Operacao" title="Painel do restaurante">
        Acompanhe faturamento, ordens recentes e alertas de estoque em uma visao pronta para o caixa.
      </PageTitle>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold">Ordens recentes</h3>
            <a className="text-accent text-sm font-semibold" href="/ordens">Ver ordens</a>
          </div>
          <div className="overflow-x-auto">
            <table className="text-left text-sm">
              <thead className="table-head border-b">
                <tr>
                  <th className="py-3">OS</th>
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
