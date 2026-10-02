import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { RiderStatusToggle } from "@/components/riders/RiderStatusToggle";
import { prisma } from "@/lib/prisma";

export default async function RiderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const rider = await prisma.rider.findUnique({
    where: { id },
    include: {
      user: true,
      orders: { orderBy: { createdAt: "desc" }, include: { customer: true } },
    },
  });

  if (!rider) notFound();

  const deliveredOrders = rider.orders.filter((o) => o.status === "DELIVERED");
  const totalEarnings = deliveredOrders.reduce((sum, o) => sum + (o.deliveryFee ?? 0), 0);
  const ratedOrders = deliveredOrders.filter((o) => o.rating != null);
  const avgRating =
    ratedOrders.length > 0
      ? ratedOrders.reduce((sum, o) => sum + o.rating!, 0) / ratedOrders.length
      : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            {rider.user.name}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {rider.vehicleType} · {rider.phone} · {rider.user.email}
          </p>
        </div>
        <RiderStatusToggle riderId={rider.id} isActive={rider.isActive} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Delivered</p>
          <p className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            {deliveredOrders.length}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Avg. rating</p>
          <p className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            {avgRating != null ? `★ ${avgRating.toFixed(1)}` : "—"}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Total earnings</p>
          <p className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Le {totalEarnings.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="border-b border-zinc-200 px-5 py-3 text-sm font-semibold text-zinc-900 dark:border-zinc-800 dark:text-zinc-50">
          Orders ({rider.orders.length})
        </h2>
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">Tracking code</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rider.orders.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-400">
                  No orders assigned yet.
                </td>
              </tr>
            )}
            {rider.orders.map((order) => (
              <tr
                key={order.id}
                className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 dark:border-zinc-900 dark:hover:bg-zinc-900"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/dashboard/orders/${order.id}`}
                    className="font-medium text-zinc-900 underline dark:text-zinc-50"
                  >
                    {order.trackingCode}
                  </Link>
                </td>
                <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                  {order.customer.name}
                </td>
                <td className="px-4 py-3">
                  <OrderStatusBadge status={order.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
