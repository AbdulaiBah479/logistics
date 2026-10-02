import { format } from "date-fns";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function RiderEarningsPage() {
  const session = await getServerSession(authOptions);
  const riderId = session!.user.riderId!;

  const deliveries = await prisma.order.findMany({
    where: { riderId, status: "DELIVERED" },
    orderBy: { deliveredAt: "desc" },
    select: {
      id: true,
      trackingCode: true,
      deliveryFee: true,
      deliveredAt: true,
      rating: true,
      customer: { select: { name: true } },
    },
  });

  const total = deliveries.reduce((sum, d) => sum + (d.deliveryFee ?? 0), 0);
  const now = new Date();
  const thisMonthTotal = deliveries
    .filter(
      (d) =>
        d.deliveredAt &&
        d.deliveredAt.getMonth() === now.getMonth() &&
        d.deliveredAt.getFullYear() === now.getFullYear(),
    )
    .reduce((sum, d) => sum + (d.deliveryFee ?? 0), 0);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Earnings</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Total earned</p>
          <p className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Le {total.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">This month</p>
          <p className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Le {thisMonthTotal.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Deliveries</p>
          <p className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            {deliveries.length}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">Tracking code</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Delivered</th>
              <th className="px-4 py-3 font-medium">Rating</th>
              <th className="px-4 py-3 font-medium">Fee</th>
            </tr>
          </thead>
          <tbody>
            {deliveries.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-400">
                  No deliveries yet.
                </td>
              </tr>
            )}
            {deliveries.map((d) => (
              <tr
                key={d.id}
                className="border-b border-zinc-100 last:border-0 dark:border-zinc-900"
              >
                <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                  {d.trackingCode}
                </td>
                <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                  {d.customer.name}
                </td>
                <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                  {d.deliveredAt ? format(d.deliveredAt, "PP") : "—"}
                </td>
                <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                  {d.rating != null ? `★ ${d.rating}` : "—"}
                </td>
                <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                  Le {(d.deliveryFee ?? 0).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
