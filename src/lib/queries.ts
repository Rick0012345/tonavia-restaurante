import { prisma } from "@/lib/db";

type DashboardPeriod = {
  start: Date;
  end: Date;
};

export async function getDashboardData(period: DashboardPeriod) {
  const [orders, revenueOrders, products, recentOrders] = await Promise.all([
    prisma.serviceOrder.findMany({ where: { createdAt: { gte: period.start, lte: period.end } } }),
    prisma.serviceOrder.findMany({
      where: {
        status: "CLOSED",
        closedAt: { gte: period.start, lte: period.end },
      },
      orderBy: { closedAt: "asc" },
    }),
    prisma.product.findMany({ include: { category: true }, orderBy: { name: "asc" } }),
    prisma.serviceOrder.findMany({
      take: 8,
      where: { createdAt: { gte: period.start, lte: period.end } },
      orderBy: { createdAt: "desc" },
      include: { items: true, weightLines: true },
    }),
  ]);

  const revenueCents = revenueOrders.reduce((sum, order) => sum + order.totalCents, 0);
  const revenueByDay = revenueOrders.reduce<Record<string, number>>((days, order) => {
    const date = (order.closedAt ?? order.createdAt).toISOString().slice(0, 10);
    days[date] = (days[date] ?? 0) + order.totalCents;
    return days;
  }, {});
  const channelLabels = {
    LOCAL: "No local",
    DELIVERY: "Delivery",
    TAKEOUT: "Retirada",
  };
  const ordersByChannel = orders.reduce<Record<keyof typeof channelLabels, { count: number; revenueCents: number }>>(
    (channels, order) => {
      const channel = order.channel;
      channels[channel].count += 1;
      if (order.status === "CLOSED") {
        channels[channel].revenueCents += order.totalCents;
      }
      return channels;
    },
    {
      LOCAL: { count: 0, revenueCents: 0 },
      DELIVERY: { count: 0, revenueCents: 0 },
      TAKEOUT: { count: 0, revenueCents: 0 },
    },
  );

  return {
    revenueCents,
    openOrders: orders.filter((order) => order.status === "OPEN").length,
    closedOrders: revenueOrders.length,
    totalOrders: orders.length,
    averageTicketCents: revenueOrders.length ? Math.round(revenueCents / revenueOrders.length) : 0,
    revenueByDay: Object.entries(revenueByDay).map(([date, totalCents]) => ({ date, totalCents })),
    channels: Object.entries(ordersByChannel).map(([channel, values]) => ({
      channel,
      label: channelLabels[channel as keyof typeof channelLabels],
      ...values,
    })),
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
