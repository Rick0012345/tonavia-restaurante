import { AppShell, Card, Field, PageTitle, SectionTabs, SubmitButton, inputClass } from "@/app/components";
import { createProduct, createStockMovement, updateProductPackageSettings } from "@/lib/actions";
import { formatCurrency, formatDecimal } from "@/lib/format";
import { getStockData } from "@/lib/queries";

export const dynamic = "force-dynamic";

type StockTab = "produtos" | "novo" | "movimentar" | "historico";

type StockPageProps = {
  searchParams?: Promise<{
    aba?: string;
  }>;
};

function getActiveTab(value: string | undefined): StockTab {
  if (value === "novo" || value === "movimentar" || value === "historico") return value;
  return "produtos";
}

export default async function StockPage({ searchParams }: StockPageProps) {
  const params = await searchParams;
  const activeTab = getActiveTab(params?.aba);
  const { products, categories, movements } = await getStockData();
  const lowStockCount = products.filter((product) => Number(product.quantity) <= Number(product.minQuantity)).length;
  const tabs = [
    { href: "/estoque?aba=produtos", key: "produtos", label: "Estoque atual", description: `${products.length} produtos, ${lowStockCount} em alerta` },
    { href: "/estoque?aba=novo", key: "novo", label: "Adicionar produto", description: "Cadastre itens do caixa ou insumos" },
    { href: "/estoque?aba=movimentar", key: "movimentar", label: "Movimentar", description: "Entradas, saidas e ajustes" },
    { href: "/estoque?aba=historico", key: "historico", label: "Historico", description: "Ultimas movimentacoes" },
  ];

  return (
    <AppShell>
      <PageTitle eyebrow="Estoque" title="Produtos e movimentacoes">
        Controle entradas, saidas, ajustes e veja rapidamente quais produtos precisam de reposicao.
      </PageTitle>

      <SectionTabs
        active={`/estoque?aba=${activeTab}`}
        tabs={tabs.map((tab) => ({ href: tab.href, label: tab.label, description: tab.description }))}
      />

      {activeTab === "produtos" ? (
        <Card>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold">Estoque atual</h3>
              <p className="text-muted text-sm">Lista de produtos, quantidade disponivel e preco de venda.</p>
            </div>
            {lowStockCount ? <span className="warning-panel rounded-md border px-3 py-2 text-sm font-bold">{lowStockCount} em alerta</span> : null}
          </div>
          <div className="overflow-x-auto">
            <table className="text-left text-sm">
              <thead className="table-head border-b">
                <tr>
                  <th className="py-3">Produto</th>
                  <th>Categoria</th>
                  <th>Estoque</th>
                  <th>Minimo</th>
                  <th>Compra</th>
                  <th>Venda</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const low = Number(product.quantity) <= Number(product.minQuantity);
                  return (
                    <tr key={product.id} className="table-row border-b">
                      <td className="py-3 font-semibold">{product.name}</td>
                      <td>{product.category?.name || "-"}</td>
                      <td className={low ? "text-warning font-bold" : ""}>{formatDecimal(product.quantity)} {product.unit}</td>
                      <td>{formatDecimal(product.minQuantity)} {product.unit}</td>
                      <td>
                        <form action={updateProductPackageSettings} className="grid min-w-56 gap-2 py-2">
                          <input type="hidden" name="productId" value={product.id} />
                          <label className="text-soft flex items-center gap-2 text-xs font-semibold">
                            <input
                              name="purchaseByPackage"
                              type="checkbox"
                              defaultChecked={product.purchaseByPackage}
                              className="size-4 accent-emerald-700"
                            />
                            Compra por pacote
                          </label>
                          <div className="grid grid-cols-[1fr_auto] gap-2">
                            <input
                              name="packageWeightKg"
                              className={`${inputClass} h-9 tabular-nums`}
                              inputMode="decimal"
                              placeholder="kg/pct"
                              defaultValue={product.packageWeightKg ? formatDecimal(product.packageWeightKg) : ""}
                            />
                            <button className="inline-flex h-9 items-center justify-center rounded-md bg-emerald-700 px-3 text-xs font-semibold text-white hover:bg-emerald-800">
                              Salvar
                            </button>
                          </div>
                        </form>
                      </td>
                      <td>{formatCurrency(product.salePriceCents)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      {activeTab === "novo" ? (
        <Card>
          <div className="mb-4">
            <h3 className="text-lg font-bold">Adicionar produto</h3>
            <p className="text-muted text-sm">Cadastre bebidas, marmitas, sobremesas ou insumos usados pelo restaurante.</p>
          </div>
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
              <div className="muted-panel grid gap-3 rounded-lg border p-3 sm:grid-cols-[1fr_180px]">
                <label className="text-soft flex items-center gap-2 text-sm font-medium">
                  <input name="purchaseByPackage" type="checkbox" className="size-4 accent-emerald-700" />
                  Gerente compra este produto por pacote
                </label>
                <Field label="Kg por pacote">
                  <input name="packageWeightKg" className={inputClass} inputMode="decimal" placeholder="Ex: 2" />
                </Field>
              </div>
              <label className="text-soft flex items-center gap-2 text-sm font-medium">
                <input name="isSellable" type="checkbox" defaultChecked className="size-4 accent-emerald-700" />
                Pode ser vendido no caixa
              </label>
              <SubmitButton>Cadastrar produto</SubmitButton>
            </form>
        </Card>
      ) : null}

      {activeTab === "movimentar" ? (
        <Card>
          <div className="mb-4">
            <h3 className="text-lg font-bold">Movimentar estoque</h3>
            <p className="text-muted text-sm">Use para compras, perdas, inventario e ajustes de quantidade.</p>
          </div>
            <form action={createStockMovement} className="grid gap-3">
              <Field label="Produto">
                <select name="productId" required className={inputClass}>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                      {product.purchaseByPackage && product.packageWeightKg
                        ? ` - pacote ${formatDecimal(product.packageWeightKg)} kg`
                        : ""}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Tipo">
                  <select name="type" className={inputClass} defaultValue="IN">
                    <option value="IN">Entrada</option>
                    <option value="OUT">Saida</option>
                    <option value="ADJUST">Ajuste</option>
                  </select>
                </Field>
                <Field label="Como informar">
                  <select name="inputMode" className={inputClass} defaultValue="UNIT">
                    <option value="UNIT">Unidade base</option>
                    <option value="PACKAGE">Pacotes</option>
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
      ) : null}

      {activeTab === "historico" ? (
        <Card>
          <div className="mb-4">
            <h3 className="text-lg font-bold">Historico de movimentacoes</h3>
            <p className="text-muted text-sm">Ultimas entradas, saidas, ajustes e baixas por venda.</p>
          </div>
          <div className="space-y-3">
            {movements.map((movement) => (
              <div key={movement.id} className="card-surface flex items-center justify-between rounded-md border p-3 text-sm">
                <div>
                  <p className="font-semibold">{movement.product.name}</p>
                  <p className="text-muted">{movement.reason || "Sem observacao"}</p>
                </div>
                <span className="font-bold">{movement.type} {formatDecimal(movement.quantity)}</span>
                {movement.inputMode === "PACKAGE" && movement.inputQuantity ? (
                  <span className="text-muted text-xs">
                    informado: {formatDecimal(movement.inputQuantity)} pct, convertido para {formatDecimal(movement.quantity)} {movement.product.unit}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </AppShell>
  );
}
