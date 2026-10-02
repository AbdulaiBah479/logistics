import Link from "next/link";
import { RiderStatusToggle } from "@/components/riders/RiderStatusToggle";
import { prisma } from "@/lib/prisma";

export default async function RidersListPage() {
  const [riders, orderStats] = await Promise.all([
    prisma.rider.findMany({
      include: { user: true, _count: { select: { orders: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.groupBy({
      by: ["riderId"],
      where: { riderId: { not: null }, status: "DELIVERED" },
      _avg: { rating: true },
      _sum: { deliveryFee: true },
    }),
  ]);
  const statsByRider = new Map(orderStats.map((s) => [s.riderId as string, s]));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Riders</h1>
        <Link
          href="/dashboard/riders/new"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          + New rider
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Vehicle</th>
              <th className="px-4 py-3 font-medium">Orders</th>
              <th className="px-4 py-3 font-medium">Rating</th>
              <th className="px-4 py-3 font-medium">Earnings</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {riders.map((rider) => {
              const stats = statsByRider.get(rider.id);
              return (
                <tr
                  key={rider.id}
                  className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 dark:border-zinc-900 dark:hover:bg-zinc-900"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/riders/${rider.id}`}
                      className="font-medium text-zinc-900 underline dark:text-zinc-50"
                    >
                      {rider.user.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{rider.phone}</td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                    {rider.vehicleType}
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                    {rider._count.orders}
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                    {stats?._avg.rating != null ? `★ ${stats._avg.rating.toFixed(1)}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                    Le {(stats?._sum.deliveryFee ?? 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <RiderStatusToggle riderId={rider.id} isActive={rider.isActive} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
