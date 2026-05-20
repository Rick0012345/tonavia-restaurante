import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const buffet = await prisma.category.upsert({
    where: { name: "Buffet" },
    update: {},
    create: { name: "Buffet" },
  });
  const bebidas = await prisma.category.upsert({
    where: { name: "Bebidas" },
    update: {},
    create: { name: "Bebidas" },
  });
  const insumos = await prisma.category.upsert({
    where: { name: "Insumos" },
    update: {},
    create: { name: "Insumos" },
  });

  for (const product of [
    { name: "Refrigerante lata", unit: "UN", salePriceCents: 700, quantity: 48, minQuantity: 12, categoryId: bebidas.id },
    { name: "Agua mineral", unit: "UN", salePriceCents: 500, quantity: 36, minQuantity: 10, categoryId: bebidas.id },
    { name: "Marmita self-service", unit: "UN", salePriceCents: 2200, quantity: 20, minQuantity: 5, categoryId: buffet.id },
    { name: "Arroz", unit: "KG", salePriceCents: 0, quantity: 25, minQuantity: 8, isSellable: false, categoryId: insumos.id },
  ] as const) {
    await prisma.product.upsert({
      where: { id: product.name.toLowerCase().replaceAll(" ", "-") },
      update: {},
      create: { id: product.name.toLowerCase().replaceAll(" ", "-"), ...product },
    });
  }
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
