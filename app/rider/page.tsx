import { getServerSession } from "next-auth";
import Link from "next/link";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ACTIVE_STATUSES = ["ASSIGNED", "PICKED_UP", "IN_TRANSIT"];

export default async function MyOrdersPage() {
  const session = await getServerSession(authOptions);
  const riderId = session!.user.riderId!;

  const orders = await prisma.order.findMany({
    where: { riderId },
    include: { customer: true },
    orderBy: { createdAt: "desc" },
  });

  const active = orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
  const history = orders.filter((o) => !ACTIVE_STATUSES.includes(o.status));

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Active deliveries
        </h1>
        {active.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No active deliveries.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {active.map((order) => (
              <OrderRow key={order.id} order={order} />
            ))}
          </div>
        )}
      </section>

      {history.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">History</h2>
          <div className="flex flex-col gap-3">
            {history.map((order) => (
              <OrderRow key={order.id} order={order} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function OrderRow({
  order,
}: {
  order: {
    id: string;
    trackingCode: string;
    status: import("@/lib/generated/prisma/client").OrderStatus;
    dropoffAddress: string;
    customer: { name: string };
  };
}) {
  return (
    <Link
      href={`/rider/orders/${order.id}`}
      className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
    >
      <div>
        <p className="font-medium text-zinc-900 dark:text-zinc-50">{order.trackingCode}</p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {order.customer.name} → {order.dropoffAddress}
        </p>
      </div>
      <OrderStatusBadge status={order.status} />
    </Link>
  );
}
