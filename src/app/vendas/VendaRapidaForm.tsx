"use client";

import { Banknote, Bike, Calculator, Minus, Plus, Scale, ShoppingBasket, Store, Ticket } from "lucide-react";
import { useMemo, useState } from "react";
import { Field, SubmitButton, inputClass } from "@/app/components";
import { formatCurrency } from "@/lib/format";

type ProductOption = {
  id: string;
  name: string;
  salePriceCents: number;
};

type VendaRapidaFormProps = {
  products: ProductOption[];
  action: (formData: FormData) => Promise<void>;
};

function moneyToCents(value: string) {
  const normalized = value.replace(/\./g, "").replace(",", ".");
  const number = Number.parseFloat(normalized || "0");
  return Number.isFinite(number) ? Math.round(number * 100) : 0;
}

function decimalValue(value: string) {
  const number = Number.parseFloat(value.replace(",", ".") || "0");
  return Number.isFinite(number) ? number : 0;
}

export function VendaRapidaForm({ products, action }: VendaRapidaFormProps) {
  const [weightKg, setWeightKg] = useState("");
  const [pricePerKg, setPricePerKg] = useState("");
  const [productId, setProductId] = useState("");
  const [productQuantity, setProductQuantity] = useState("1");
  const [manualQuantity, setManualQuantity] = useState("1");
  const [manualUnitPrice, setManualUnitPrice] = useState("");
  const [discount, setDiscount] = useState("");
  const [surcharge, setSurcharge] = useState("");

  const selectedProduct = products.find((product) => product.id === productId);
  const estimate = useMemo(() => {
    const buffetTotal = decimalValue(weightKg) * moneyToCents(pricePerKg);
    const productTotal = selectedProduct ? decimalValue(productQuantity) * selectedProduct.salePriceCents : 0;
    const manualTotal = decimalValue(manualQuantity) * moneyToCents(manualUnitPrice);
    return Math.max(0, Math.round(buffetTotal + productTotal + manualTotal - moneyToCents(discount) + moneyToCents(surcharge)));
  }, [discount, manualQuantity, manualUnitPrice, pricePerKg, productQuantity, selectedProduct, surcharge, weightKg]);

  return (
    <form action={action} className="grid gap-4">
      <div className="quick-sale-panel rounded-lg border p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-muted text-sm font-medium">Total previsto</p>
            <strong className="block text-3xl font-bold tabular-nums">{formatCurrency(estimate)}</strong>
          </div>
          <div className="flex size-12 items-center justify-center rounded-lg bg-emerald-700 text-white">
            <Calculator size={24} />
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Comanda ou mesa">
          <input name="tableLabel" className={inputClass} placeholder="Ex: Mesa 04, Comanda 18" />
        </Field>
        <Field label="Cliente">
          <input name="customerName" className={inputClass} placeholder="Opcional" />
        </Field>
      </div>

      <section className="sale-step rounded-lg border p-4">
        <div className="mb-4 flex items-center gap-3">
          <div className="step-icon flex size-10 items-center justify-center rounded-md">
            <Store size={20} />
          </div>
          <div>
            <h3 className="font-bold">Tipo de venda</h3>
            <p className="text-muted text-sm">Separe o que foi consumido no local, delivery ou retirada.</p>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <label className="channel-option">
            <input type="radio" name="channel" value="LOCAL" defaultChecked />
            <Store size={18} />
            <span>No local</span>
          </label>
          <label className="channel-option">
            <input type="radio" name="channel" value="DELIVERY" />
            <Bike size={18} />
            <span>Delivery</span>
          </label>
          <label className="channel-option">
            <input type="radio" name="channel" value="TAKEOUT" />
            <ShoppingBasket size={18} />
            <span>Retirada</span>
          </label>
        </div>
      </section>

      <section className="sale-step rounded-lg border p-4">
        <div className="mb-4 flex items-center gap-3">
          <div className="step-icon flex size-10 items-center justify-center rounded-md">
            <Scale size={20} />
          </div>
          <div>
            <h3 className="font-bold">Prato self-service</h3>
            <p className="text-muted text-sm">Informe o peso da balanca e o valor do buffet por kg.</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Peso do prato">
            <div className="input-with-suffix">
              <input
                name="weightKg"
                className={`${inputClass} pr-12 text-lg font-bold tabular-nums`}
                inputMode="decimal"
                placeholder="0,450"
                value={weightKg}
                onChange={(event) => setWeightKg(event.target.value)}
              />
              <span>kg</span>
            </div>
          </Field>
          <Field label="Preco do buffet">
            <div className="input-with-suffix">
              <input
                name="pricePerKg"
                className={`${inputClass} pr-16 text-lg font-bold tabular-nums`}
                inputMode="decimal"
                placeholder="69,90"
                value={pricePerKg}
                onChange={(event) => setPricePerKg(event.target.value)}
              />
              <span>/ kg</span>
            </div>
          </Field>
        </div>
      </section>

      <section className="sale-step rounded-lg border p-4">
        <div className="mb-4 flex items-center gap-3">
          <div className="step-icon flex size-10 items-center justify-center rounded-md">
            <ShoppingBasket size={20} />
          </div>
          <div>
            <h3 className="font-bold">Bebida ou item pronto</h3>
            <p className="text-muted text-sm">Use para refrigerante, agua, marmita pronta ou outro produto cadastrado.</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
          <Field label="Produto">
            <select name="productId" className={inputClass} value={productId} onChange={(event) => setProductId(event.target.value)}>
              <option value="">Sem produto</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} - {formatCurrency(product.salePriceCents)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Quantidade">
            <input
              name="productQuantity"
              className={`${inputClass} tabular-nums`}
              inputMode="decimal"
              value={productQuantity}
              onChange={(event) => setProductQuantity(event.target.value)}
            />
          </Field>
        </div>
      </section>

      <section className="sale-step rounded-lg border p-4">
        <div className="mb-4 flex items-center gap-3">
          <div className="step-icon flex size-10 items-center justify-center rounded-md">
            <Ticket size={20} />
          </div>
          <div>
            <h3 className="font-bold">Extra rapido</h3>
            <p className="text-muted text-sm">Use quando o item ainda nao esta cadastrado no estoque.</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_96px_132px]">
          <Field label="Descricao">
            <input name="manualDescription" className={inputClass} placeholder="Ex: Sobremesa" />
          </Field>
          <Field label="Qtd.">
            <input
              name="manualQuantity"
              className={`${inputClass} tabular-nums`}
              inputMode="decimal"
              value={manualQuantity}
              onChange={(event) => setManualQuantity(event.target.value)}
            />
          </Field>
          <Field label="Valor un.">
            <input
              name="manualUnitPrice"
              className={`${inputClass} tabular-nums`}
              inputMode="decimal"
              placeholder="8,00"
              value={manualUnitPrice}
              onChange={(event) => setManualUnitPrice(event.target.value)}
            />
          </Field>
        </div>
      </section>

      <section className="muted-panel rounded-lg border p-4">
        <div className="mb-4 flex items-center gap-3">
          <div className="step-icon flex size-10 items-center justify-center rounded-md">
            <Banknote size={20} />
          </div>
          <div>
            <h3 className="font-bold">Ajustes e observacao</h3>
            <p className="text-muted text-sm">Desconto, taxa de embalagem ou alguma anotacao para o caixa.</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Desconto">
            <div className="input-with-icon">
              <Minus size={16} />
              <input
                name="discount"
                className={`${inputClass} pl-9 tabular-nums`}
                inputMode="decimal"
                placeholder="0,00"
                value={discount}
                onChange={(event) => setDiscount(event.target.value)}
              />
            </div>
          </Field>
          <Field label="Acrescimo ou taxa">
            <div className="input-with-icon">
              <Plus size={16} />
              <input
                name="surcharge"
                className={`${inputClass} pl-9 tabular-nums`}
                inputMode="decimal"
                placeholder="0,00"
                value={surcharge}
                onChange={(event) => setSurcharge(event.target.value)}
              />
            </div>
          </Field>
        </div>
        <Field label="Observacao">
          <textarea name="notes" className={`${inputClass} mt-3 h-20 py-2`} placeholder="Opcional" />
        </Field>
      </section>

      <SubmitButton>Salvar venda</SubmitButton>
    </form>
  );
}
