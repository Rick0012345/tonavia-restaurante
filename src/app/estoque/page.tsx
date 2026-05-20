import { AppShell, Card, Field, PageTitle, SubmitButton, inputClass } from "@/app/components";
import { createProduct, createStockMovement } from "@/lib/actions";
import { formatCurrency, formatDecimal } from "@/lib/format";
import { getStockData } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function StockPage() {
  const { products, categories, movements } = await getStockData();

  return (
    <AppShell>
      <PageTitle eyebrow="Estoque" title="Produtos e movimentacoes">
        Controle entradas, saidas, ajustes e veja rapidamente quais produtos precisam de reposicao.
      </PageTitle>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.3fr]">
        <div className="grid gap-6">
          <Card>
            <h3 className="mb-4 text-lg font-bold">Novo produto</h3>
            <form action={createProduct} className="grid gap-3">
              <Field label="Nome">
                <input name="name" required className={inputClass} placeholder="Ex: Suco natural" />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Categoria">
                  <select name="categoryId" className={inputClass} defaultValue="">
                    <option value="">Sem categoria</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Unidade">
                  <select name="unit" className={inputClass} defaultValue="UN">
                    <option value="UN">UN</option>
                    <option value="KG">KG</option>
                    <option value="G">G</option>
                    <option value="L">L</option>
                    <option value="ML">ML</option>
                  </select>
                </Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Preco venda">
                  <input name="salePrice" className={inputClass} inputMode="decimal" placeholder="0,00" />
                </Field>
                <Field label="Custo">
                  <input name="cost" className={inputClass} inputMode="decimal" placeholder="0,00" />
                </Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Qtd. atual">
                  <input name="quantity" className={inputClass} inputMode="decimal" placeholder="0" />
                </Field>
                <Field label="Estoque minimo">
                  <input name="minQuantity" className={inputClass} inputMode="decimal" placeholder="0" />
                </Field>
              </div>
              <label className="flex items-center gap-2 text-sm font-medium text-stone-700">
                <input name="isSellable" type="checkbox" defaultChecked className="size-4 accent-emerald-700" />
                Pode ser vendido na OS
              </label>
              <SubmitButton>Cadastrar produto</SubmitButton>
            </form>
          </Card>

          <Card>
            <h3 className="mb-4 text-lg font-bold">Movimentar estoque</h3>
            <form action={createStockMovement} className="grid gap-3">
              <Field label="Produto">
                <select name="productId" required className={inputClass}>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>{product.name}</option>
                  ))}
                </select>
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Tipo">
                  <select name="type" className={inputClass} defaultValue="IN">
                    <option value="IN">Entrada</option>
                    <option value="OUT">Saida</option>
                    <option value="ADJUST">Ajuste</option>
                  </select>
                </Field>
                <Field label="Quantidade">
                  <input name="quantity" required className={inputClass} inputMode="decimal" placeholder="1" />
                </Field>
              </div>
              <Field label="Motivo">
                <input name="reason" className={inputClass} placeholder="Compra, perda, inventario..." />
              </Field>
              <SubmitButton>Registrar movimento</SubmitButton>
            </form>
          </Card>
        </div>

        <div className="grid gap-6">
          <Card>
            <h3 className="mb-4 text-lg font-bold">Produtos</h3>
            <div className="overflow-x-auto">
              <table className="text-left text-sm">
                <thead className="border-b border-stone-200 text-stone-500">
                  <tr>
                    <th className="py-3">Produto</th>
                    <th>Categoria</th>
                    <th>Estoque</th>
                    <th>Minimo</th>
                    <th>Venda</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => {
                    const low = Number(product.quantity) <= Number(product.minQuantity);
                    return (
                      <tr key={product.id} className="border-b border-stone-100">
                        <td className="py-3 font-semibold">{product.name}</td>
                        <td>{product.category?.name || "-"}</td>
                        <td className={low ? "font-bold text-amber-700" : ""}>{formatDecimal(product.quantity)} {product.unit}</td>
                        <td>{formatDecimal(product.minQuantity)} {product.unit}</td>
                        <td>{formatCurrency(product.salePriceCents)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <h3 className="mb-4 text-lg font-bold">Ultimas movimentacoes</h3>
            <div className="space-y-3">
              {movements.map((movement) => (
                <div key={movement.id} className="flex items-center justify-between rounded-md border border-stone-200 p-3 text-sm">
                  <div>
                    <p className="font-semibold">{movement.product.name}</p>
                    <p className="text-stone-600">{movement.reason || "Sem observacao"}</p>
                  </div>
                  <span className="font-bold">{movement.type} {formatDecimal(movement.quantity)}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
