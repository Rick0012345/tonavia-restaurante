export function formatCurrency(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

export function formatDecimal(value: unknown, fractionDigits = 3) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: fractionDigits,
  }).format(Number(value ?? 0));
}

export function moneyToCents(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").replace(/\./g, "").replace(",", ".").trim();
  return Math.round((Number(raw) || 0) * 100);
}

export function decimalFromForm(value: FormDataEntryValue | null) {
  return String(value ?? "0").replace(",", ".").trim() || "0";
}
