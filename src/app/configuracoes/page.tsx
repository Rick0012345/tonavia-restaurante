import { Settings, UtensilsCrossed } from "lucide-react";
import { AppShell, Card, Field, PageTitle, SubmitButton, inputClass } from "@/app/components";
import { updateAppSettings } from "@/lib/actions";
import { formatCurrency } from "@/lib/format";
import { getAppSettings } from "@/lib/queries";

export const dynamic = "force-dynamic";

function centsToInput(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",");
}

export default async function SettingsPage() {
  const settings = await getAppSettings();

  return (
    <AppShell>
      <PageTitle eyebrow="Configuracoes" title="Regras do restaurante">
        Ajustes que o gerente muda sem precisar alterar o codigo do sistema.
      </PageTitle>

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <div className="mb-4 flex items-center gap-3">
            <div className="step-icon flex size-10 items-center justify-center rounded-md">
              <UtensilsCrossed size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold">Preco da refeicao</h2>
              <p className="text-muted text-sm">Valor unico usado na venda rapida.</p>
            </div>
          </div>
          <strong className="text-accent block text-3xl font-bold tabular-nums">{formatCurrency(settings.mealPriceCents)}</strong>
        </Card>

        <Card>
          <div className="mb-4 flex items-center gap-2">
            <Settings className="text-accent" size={20} />
            <h2 className="text-lg font-bold">Alterar valor</h2>
          </div>
          <form action={updateAppSettings} className="grid gap-4">
            <Field label="Preco unico da refeicao">
              <input
                name="mealPrice"
                required
                className={`${inputClass} tabular-nums`}
                inputMode="decimal"
                defaultValue={centsToInput(settings.mealPriceCents)}
              />
            </Field>
            <SubmitButton>Salvar configuracao</SubmitButton>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}
