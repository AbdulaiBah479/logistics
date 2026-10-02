import Link from "next/link";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import type { OrderStatus } from "@/lib/generated/prisma/client";
import { listOrders } from "@/lib/ordersRepo";

const STATUSES: OrderStatus[] = [
  "PENDING",
  "ASSIGNED",
  "PICKED_UP",
  "IN_TRANSIT",
  "DELIVERED",
  "FAILED",
  "CANCELLED",
];

export default async function OrdersListPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status, q } = await searchParams;
  const orders = await listOrders({ status, q });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Orders</h1>
        <div className="flex gap-3">
          <Link
            href="/dashboard/orders/import"
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            Import CSV
          </Link>
          <Link
            href="/dashboard/orders/new"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            + New order
          </Link>
        </div>
      </div>

      <form method="get" className="flex flex-wrap gap-3">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search tracking code or customer"
          className="w-64 rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-100"
        />
        <select
          name="status"
          defaultValue={status ?? ""}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-100"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          Filter
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">Tracking code</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Rider</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Scheduled</th>
              <th className="px-4 py-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-400">
                  No orders found.
                </td>
              </tr>
            )}
            {orders.map((order) => (
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
                <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                  {order.rider?.user.name ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <OrderStatusBadge status={order.status} />
                </td>
                <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                  {order.scheduledFor ? (
                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                      {new Date(order.scheduledFor).toLocaleString()}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                  {new Date(order.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
