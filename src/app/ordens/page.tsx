import { Check, X } from "lucide-react";
import { AppShell, Card, Field, PageTitle, SubmitButton, inputClass } from "@/app/components";
import { cancelServiceOrder, closeServiceOrder, createServiceOrder } from "@/lib/actions";
import { formatCurrency, formatDecimal } from "@/lib/format";
import { getOrdersData } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const { orders, products } = await getOrdersData();

  return (
    <AppShell>
      <PageTitle eyebrow="Faturamento" title="Ordens de servico">
        Registre vendas por peso, itens avulsos ou uma cobranca mista na mesma OS.
      </PageTitle>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.35fr]">
        <Card>
          <h3 className="mb-4 text-lg font-bold">Nova ordem</h3>
          <form action={createServiceOrder} className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Cliente">
                <input name="customerName" className={inputClass} placeholder="Opcional" />
              </Field>
              <Field label="Mesa/comanda">
                <input name="tableLabel" className={inputClass} placeholder="Ex: Mesa 04" />
              </Field>
            </div>

            <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
              <h4 className="mb-3 font-semibold">Self-service por peso</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Peso em kg">
                  <input name="weightKg" className={inputClass} inputMode="decimal" placeholder="0,450" />
                </Field>
                <Field label="Preco por kg">
                  <input name="pricePerKg" className={inputClass} inputMode="decimal" placeholder="69,90" />
                </Field>
              </div>
            </div>

            <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
              <h4 className="mb-3 font-semibold">Item do estoque</h4>
              <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
                <Field label="Produto">
                  <select name="productId" className={inputClass} defaultValue="">
                    <option value="">Nenhum</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} - {formatCurrency(product.salePriceCents)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Quantidade">
                  <input name="productQuantity" className={inputClass} inputMode="decimal" placeholder="1" />
                </Field>
              </div>
            </div>

            <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
              <h4 className="mb-3 font-semibold">Item manual</h4>
              <div className="grid gap-3 sm:grid-cols-[1fr_100px_130px]">
                <Field label="Descricao">
                  <input name="manualDescription" className={inputClass} placeholder="Ex: Sobremesa" />
                </Field>
                <Field label="Qtd.">
                  <input name="manualQuantity" className={inputClass} inputMode="decimal" placeholder="1" />
                </Field>
                <Field label="Preco unit.">
                  <input name="manualUnitPrice" className={inputClass} inputMode="decimal" placeholder="8,00" />
                </Field>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Desconto">
                <input name="discount" className={inputClass} inputMode="decimal" placeholder="0,00" />
              </Field>
              <Field label="Acrescimo/taxa">
                <input name="surcharge" className={inputClass} inputMode="decimal" placeholder="0,00" />
              </Field>
            </div>
            <Field label="Observacoes">
              <textarea name="notes" className={`${inputClass} h-20 py-2`} placeholder="Opcional" />
            </Field>
            <SubmitButton>Criar OS</SubmitButton>
          </form>
        </Card>

        <Card>
          <h3 className="mb-4 text-lg font-bold">Lista de ordens</h3>
          <div className="space-y-4">
            {orders.map((order) => (
              <article key={order.id} className="rounded-lg border border-stone-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h4 className="text-lg font-bold">OS #{order.number}</h4>
                    <p className="text-sm text-stone-600">{order.customerName || order.tableLabel || "Balcao"}</p>
                  </div>
                  <div className="text-right">
                    <span className="rounded-md bg-stone-100 px-2 py-1 text-xs font-semibold">
                      {order.status === "OPEN" ? "Aberta" : order.status === "CLOSED" ? "Finalizada" : "Cancelada"}
                    </span>
                    <p className="mt-2 text-xl font-bold text-emerald-800">{formatCurrency(order.totalCents)}</p>
                  </div>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-stone-700">
                  {order.weightLines.map((line) => (
                    <p key={line.id}>
                      Buffet: {formatDecimal(line.weightKg)} kg x {formatCurrency(line.pricePerKgCents)} = {formatCurrency(line.totalCents)}
                    </p>
                  ))}
                  {order.items.map((item) => (
                    <p key={item.id}>
                      {item.description}: {formatDecimal(item.quantity)} x {formatCurrency(item.unitPriceCents)} = {formatCurrency(item.totalCents)}
                    </p>
                  ))}
                  <p>Subtotal: {formatCurrency(order.subtotalCents)} | Desconto: {formatCurrency(order.discountCents)} | Acrescimo: {formatCurrency(order.surchargeCents)}</p>
                </div>
                {order.status === "OPEN" ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <form action={closeServiceOrder}>
                      <input type="hidden" name="id" value={order.id} />
                      <button className="inline-flex h-9 items-center gap-2 rounded-md bg-emerald-700 px-3 text-sm font-semibold text-white hover:bg-emerald-800">
                        <Check size={16} /> Finalizar
                      </button>
                    </form>
                    <form action={cancelServiceOrder}>
                      <input type="hidden" name="id" value={order.id} />
                      <button className="inline-flex h-9 items-center gap-2 rounded-md border border-stone-300 px-3 text-sm font-semibold hover:bg-stone-50">
                        <X size={16} /> Cancelar
                      </button>
                    </form>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
