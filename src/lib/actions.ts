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
});

function revalidateApp() {
  revalidatePath("/");
  revalidatePath("/ordens");
  revalidatePath("/estoque");
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
  });

  await prisma.product.create({ data: parsed });
  revalidateApp();
}

export async function createStockMovement(formData: FormData) {
  const productId = String(formData.get("productId") || "");
  const type = z.enum(["IN", "OUT", "ADJUST"]).parse(formData.get("type"));
  const quantity = new Prisma.Decimal(decimalFromForm(formData.get("quantity")));
  const reason = String(formData.get("reason") || "");

  await prisma.$transaction(async (tx) => {
    await tx.stockMovement.create({ data: { productId, type, quantity, reason } });

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
  const notes = String(formData.get("notes") || "").trim() || null;
  const discountCents = moneyToCents(formData.get("discount"));
  const surchargeCents = moneyToCents(formData.get("surcharge"));

  const weightKg = new Prisma.Decimal(decimalFromForm(formData.get("weightKg")));
  const pricePerKgCents = moneyToCents(formData.get("pricePerKg"));
  const weightTotalCents = Math.round(weightKg.toNumber() * pricePerKgCents);

  const productId = String(formData.get("productId") || "");
  const productQuantity = new Prisma.Decimal(decimalFromForm(formData.get("productQuantity")));
  const manualDescription = String(formData.get("manualDescription") || "").trim();
  const manualQuantity = new Prisma.Decimal(decimalFromForm(formData.get("manualQuantity")));
  const manualUnitPriceCents = moneyToCents(formData.get("manualUnitPrice"));

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

  const subtotalCents =
    (weightKg.gt(0) && pricePerKgCents > 0 ? weightTotalCents : 0) +
    itemLines.reduce((sum, item) => sum + Number(item.totalCents), 0);
  const totalCents = Math.max(0, subtotalCents - discountCents + surchargeCents);

  await prisma.serviceOrder.create({
    data: {
      customerName,
      tableLabel,
      notes,
      subtotalCents,
      discountCents,
      surchargeCents,
      totalCents,
      weightLines:
        weightKg.gt(0) && pricePerKgCents > 0
          ? { create: { weightKg, pricePerKgCents, totalCents: weightTotalCents } }
          : undefined,
      items: itemLines.length ? { create: itemLines } : undefined,
    },
  });

  revalidateApp();
  redirect("/ordens");
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
          reason: `Baixa automatica da OS #${order.number}`,
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
