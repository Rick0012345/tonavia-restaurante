"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { decimalFromForm, moneyToCents } from "@/lib/format";

const productSchema = z.object({
  name: z.string().min(2),
  categoryId: z.string().optional(),
  unit: z.enum(["KG", "UN", "L", "ML", "G"]),
  salePriceCents: z.number().int().min(0),
  quantity: z.string(),
  minQuantity: z.string(),
  costCents: z.number().int().min(0).optional(),
  isSellable: z.boolean(),
  purchaseByPackage: z.boolean(),
  packageWeightKg: z.string().nullable(),
});

function revalidateApp() {
  revalidatePath("/");
  revalidatePath("/ordens");
  revalidatePath("/vendas");
  revalidatePath("/estoque");
  revalidatePath("/configuracoes");
}

async function getSettings() {
  return prisma.appSettings.upsert({
    where: { id: "global" },
    update: {},
    create: { id: "global", mealPriceCents: 2000 },
  });
}

export async function createProduct(formData: FormData) {
  const parsed = productSchema.parse({
    name: formData.get("name"),
    categoryId: String(formData.get("categoryId") || "") || undefined,
    unit: formData.get("unit"),
    salePriceCents: moneyToCents(formData.get("salePrice")),
    quantity: decimalFromForm(formData.get("quantity")),
    minQuantity: decimalFromForm(formData.get("minQuantity")),
    costCents: formData.get("cost") ? moneyToCents(formData.get("cost")) : undefined,
    isSellable: formData.get("isSellable") === "on",
    purchaseByPackage: formData.get("purchaseByPackage") === "on",
    packageWeightKg: formData.get("packageWeightKg") ? decimalFromForm(formData.get("packageWeightKg")) : null,
  });

  await prisma.product.create({ data: parsed });
  revalidateApp();
}

export async function updateProductPackageSettings(formData: FormData) {
  const productId = String(formData.get("productId") || "");
  const purchaseByPackage = formData.get("purchaseByPackage") === "on";
  const packageWeightKg = formData.get("packageWeightKg") ? decimalFromForm(formData.get("packageWeightKg")) : null;

  await prisma.product.update({
    where: { id: productId },
    data: {
      purchaseByPackage,
      packageWeightKg: purchaseByPackage ? packageWeightKg : null,
    },
  });

  revalidateApp();
}

export async function createStockMovement(formData: FormData) {
  const productId = String(formData.get("productId") || "");
  const type = z.enum(["IN", "OUT", "ADJUST"]).parse(formData.get("type"));
  const inputMode = z.enum(["UNIT", "PACKAGE"]).parse(formData.get("inputMode") || "UNIT");
  const inputQuantity = new Prisma.Decimal(decimalFromForm(formData.get("quantity")));
  const reason = String(formData.get("reason") || "");
  const product = await prisma.product.findUnique({ where: { id: productId } });

  if (!product) return;

  const packageWeightKg = product.packageWeightKg ? new Prisma.Decimal(product.packageWeightKg) : null;
  const quantity =
    inputMode === "PACKAGE" && packageWeightKg?.gt(0)
      ? inputQuantity.mul(packageWeightKg)
      : inputQuantity;

  await prisma.$transaction(async (tx) => {
    await tx.stockMovement.create({ data: { productId, type, quantity, inputQuantity, inputMode, reason } });

    if (type === "ADJUST") {
      await tx.product.update({ where: { id: productId }, data: { quantity } });
      return;
    }

    await tx.product.update({
      where: { id: productId },
      data: { quantity: type === "IN" ? { increment: quantity } : { decrement: quantity } },
    });
  });

  revalidateApp();
}

export async function createServiceOrder(formData: FormData) {
  const customerName = String(formData.get("customerName") || "").trim() || null;
  const tableLabel = String(formData.get("tableLabel") || "").trim() || null;
  const channel = z.enum(["LOCAL", "DELIVERY", "TAKEOUT"]).parse(formData.get("channel") || "LOCAL");
  const notes = String(formData.get("notes") || "").trim() || null;
  const discountCents = moneyToCents(formData.get("discount"));
  const surchargeCents = moneyToCents(formData.get("surcharge"));

  const productId = String(formData.get("productId") || "");
  const productQuantity = new Prisma.Decimal(decimalFromForm(formData.get("productQuantity")));
  const manualDescription = String(formData.get("manualDescription") || "").trim();
  const manualQuantity = new Prisma.Decimal(decimalFromForm(formData.get("manualQuantity")));
  const manualUnitPriceCents = moneyToCents(formData.get("manualUnitPrice"));
  const mealQuantity = new Prisma.Decimal(decimalFromForm(formData.get("mealQuantity")));
  const addManualToMenu = formData.get("addManualToMenu") === "on";
  const settings = await getSettings();
  const mealTotalCents = Math.round(mealQuantity.toNumber() * settings.mealPriceCents);

  const product = productId ? await prisma.product.findUnique({ where: { id: productId } }) : null;
  const itemLines: Prisma.ServiceOrderItemCreateWithoutServiceOrderInput[] = [];

  if (product && productQuantity.gt(0)) {
    itemLines.push({
      product: { connect: { id: product.id } },
      description: product.name,
      quantity: productQuantity,
      unitPriceCents: product.salePriceCents,
      totalCents: Math.round(productQuantity.toNumber() * product.salePriceCents),
    });
  }

  if (manualDescription && manualQuantity.gt(0) && manualUnitPriceCents > 0) {
    itemLines.push({
      description: manualDescription,
      quantity: manualQuantity,
      unitPriceCents: manualUnitPriceCents,
      totalCents: Math.round(manualQuantity.toNumber() * manualUnitPriceCents),
    });
  }

  const manualProductData =
    addManualToMenu && manualDescription && manualUnitPriceCents > 0
      ? {
          name: manualDescription,
          unit: "UN" as const,
          salePriceCents: manualUnitPriceCents,
          quantity: new Prisma.Decimal(0),
          minQuantity: new Prisma.Decimal(0),
          isSellable: true,
        }
      : null;

  const subtotalCents =
    (mealQuantity.gt(0) ? mealTotalCents : 0) +
    itemLines.reduce((sum, item) => sum + Number(item.totalCents), 0);
  const totalCents = Math.max(0, subtotalCents - discountCents + surchargeCents);

  await prisma.$transaction(async (tx) => {
    if (manualProductData) {
      await tx.product.create({ data: manualProductData });
    }

    await tx.serviceOrder.create({
      data: {
        customerName,
        tableLabel,
        channel,
        notes,
        subtotalCents,
        discountCents,
        surchargeCents,
        totalCents,
        mealLines: mealQuantity.gt(0)
          ? { create: { quantity: mealQuantity, unitPriceCents: settings.mealPriceCents, totalCents: mealTotalCents } }
          : undefined,
        items: itemLines.length ? { create: itemLines } : undefined,
      },
    });
  });

  revalidateApp();
  redirect("/vendas");
}

export async function closeServiceOrder(formData: FormData) {
  const id = String(formData.get("id") || "");
  const order = await prisma.serviceOrder.findUnique({ where: { id }, include: { items: true } });

  if (!order || order.status !== "OPEN") return;

  await prisma.$transaction(async (tx) => {
    for (const item of order.items) {
      if (!item.productId) continue;
      await tx.product.update({
        where: { id: item.productId },
        data: { quantity: { decrement: item.quantity } },
      });
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          type: "SALE",
          quantity: item.quantity,
          serviceOrderId: order.id,
          reason: `Baixa automatica da venda #${order.number}`,
        },
      });
    }

    await tx.serviceOrder.update({
      where: { id },
      data: { status: "CLOSED", closedAt: new Date() },
    });
  });

  revalidateApp();
}

export async function cancelServiceOrder(formData: FormData) {
  await prisma.serviceOrder.update({
    where: { id: String(formData.get("id") || "") },
    data: { status: "CANCELED" },
  });
  revalidateApp();
}

export async function updateAppSettings(formData: FormData) {
  await prisma.appSettings.upsert({
    where: { id: "global" },
    update: { mealPriceCents: moneyToCents(formData.get("mealPrice")) },
    create: { id: "global", mealPriceCents: moneyToCents(formData.get("mealPrice")) || 2000 },
  });

  revalidateApp();
}
