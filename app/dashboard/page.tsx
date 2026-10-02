import Link from "next/link";
import { prisma } from "@/lib/prisma";

async function getStats() {
  const [statusGroups, activeRiders, totalRiders] = await Promise.all([
    prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.rider.count({ where: { isActive: true } }),
    prisma.rider.count(),
  ]);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const deliveredToday = await prisma.order.count({
    where: { status: "DELIVERED", deliveredAt: { gte: todayStart } },
  });

  const counts = Object.fromEntries(statusGroups.map((g) => [g.status, g._count._all]));
  const totalOrders = statusGroups.reduce((sum, g) => sum + g._count._all, 0);

  return { counts, totalOrders, activeRiders, totalRiders, deliveredToday };
}

export default async function DashboardOverviewPage() {
  const stats = await getStats();

  const cards = [
    { label: "Total orders", value: stats.totalOrders },
    { label: "Pending", value: stats.counts.PENDING ?? 0 },
    { label: "In transit", value: stats.counts.IN_TRANSIT ?? 0 },
    { label: "Delivered today", value: stats.deliveredToday },
    { label: "Active riders", value: `${stats.activeRiders} / ${stats.totalRiders}` },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Overview</h1>
        <Link
          href="/dashboard/orders/new"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          + New order
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <Link
          href="/dashboard/orders"
          className="text-sm font-medium text-zinc-900 underline dark:text-zinc-50"
        >
          View all orders →
        </Link>
        <Link
          href="/dashboard/riders"
          className="text-sm font-medium text-zinc-900 underline dark:text-zinc-50"
        >
          Manage riders →
        </Link>
      </div>
    </div>
  );
}
