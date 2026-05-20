import { startOfDay } from "@/lib/time";
import { prisma } from "@/lib/db";

export async function getDashboardData() {
  const today = startOfDay(new Date());
  const [orders, products, recentOrders] = await Promise.all([
    prisma.serviceOrder.findMany({ where: { createdAt: { gte: today } } }),
    prisma.product.findMany({ include: { category: true }, orderBy: { name: "asc" } }),
    prisma.serviceOrder.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: { items: true, weightLines: true },
    }),
  ]);

  const closed = orders.filter((order) => order.status === "CLOSED");
  const revenueCents = closed.reduce((sum, order) => sum + order.totalCents, 0);

  return {
    revenueCents,
    openOrders: orders.filter((order) => order.status === "OPEN").length,
    closedOrders: closed.length,
    averageTicketCents: closed.length ? Math.round(revenueCents / closed.length) : 0,
    lowStock: products.filter((product) => Number(product.quantity) <= Number(product.minQuantity)),
    recentOrders,
  };
}

export async function getOrdersData() {
  const [orders, products] = await Promise.all([
    prisma.serviceOrder.findMany({
      orderBy: { createdAt: "desc" },
      include: { items: { include: { product: true } }, weightLines: true },
    }),
    prisma.product.findMany({
      where: { isSellable: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return { orders, products };
}

export async function getStockData() {
  const [products, categories, movements] = await Promise.all([
    prisma.product.findMany({ include: { category: true }, orderBy: { name: "asc" } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.stockMovement.findMany({
      take: 12,
      orderBy: { createdAt: "desc" },
      include: { product: true },
    }),
  ]);

  return { products, categories, movements };
}
