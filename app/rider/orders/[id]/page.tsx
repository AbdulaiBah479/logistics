import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { DeliveredForm } from "@/components/orders/DeliveredForm";
import { FailedForm } from "@/components/orders/FailedForm";
import { OrderMap } from "@/components/map/OrderMap";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { OrderTimeline } from "@/components/orders/OrderTimeline";
import { RatingDisplay } from "@/components/orders/RatingDisplay";
import { StatusActionButton } from "@/components/orders/StatusActionButton";
import { authOptions } from "@/lib/auth";
import { getOrderDetail } from "@/lib/ordersRepo";
import { computeSimulatedPosition } from "@/lib/tracking";

export default async function RiderOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const order = await getOrderDetail(id);

  if (!order || order.riderId !== session!.user.riderId) notFound();

  const position = computeSimulatedPosition(order);

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {order.trackingCode}
        </h1>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <OrderMap
          pickup={{ lat: order.pickupLat, lng: order.pickupLng, label: order.pickupAddress }}
          dropoff={{ lat: order.dropoffLat, lng: order.dropoffLng, label: order.dropoffAddress }}
          position={position}
        />
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Customer</h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">{order.customer.name}</p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{order.customer.phone}</p>
        <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
          {order.packageDescription}
        </p>
        {order.codAmount != null && (
          <p className="mt-1 text-sm font-medium text-amber-700 dark:text-amber-400">
            Collect Le {order.codAmount.toLocaleString()} on delivery
          </p>
        )}
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Route</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Pickup: {order.pickupAddress}</p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Dropoff: {order.dropoffAddress}
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Actions</h2>
        {order.status === "ASSIGNED" && (
          <StatusActionButton orderId={order.id} toStatus="PICKED_UP" label="Mark picked up" />
        )}
        {order.status === "PICKED_UP" && (
          <StatusActionButton
            orderId={order.id}
            toStatus="IN_TRANSIT"
            label="Start delivery (in transit)"
          />
        )}
        {order.status === "IN_TRANSIT" && (
          <div className="flex flex-col gap-6">
            <DeliveredForm orderId={order.id} />
            <FailedForm orderId={order.id} />
          </div>
        )}
        {["DELIVERED", "FAILED", "CANCELLED"].includes(order.status) && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            This order is complete — no further action needed.
          </p>
        )}
      </div>

      {order.deliveryFee != null && (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Your fee for this delivery
          </h2>
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            Le {order.deliveryFee.toLocaleString()}
          </p>
        </div>
      )}

      {order.rating != null && (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Customer rating
          </h2>
          <RatingDisplay rating={order.rating} comment={order.ratingComment} />
        </div>
      )}

      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Messages</h2>
        <ChatPanel
          fetchUrl={`/api/orders/${order.id}/messages`}
          postUrl={`/api/orders/${order.id}/messages`}
          placeholder="Message staff and the customer…"
        />
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Timeline</h2>
        <OrderTimeline events={order.events} />
      </div>
    </div>
  );
}
