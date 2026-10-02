import { format } from "date-fns";
import { notFound } from "next/navigation";
import { AssignRiderControl } from "@/components/orders/AssignRiderControl";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { OrderMap } from "@/components/map/OrderMap";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { OrderTimeline } from "@/components/orders/OrderTimeline";
import { RatingDisplay } from "@/components/orders/RatingDisplay";
import { StatusActionButton } from "@/components/orders/StatusActionButton";
import { getOrderDetail } from "@/lib/ordersRepo";
import { prisma } from "@/lib/prisma";
import { computeSimulatedPosition } from "@/lib/tracking";

const CANCELLABLE_STATUSES = ["PENDING", "ASSIGNED", "PICKED_UP", "IN_TRANSIT"];
const ASSIGNABLE_STATUSES = ["PENDING", "ASSIGNED"];

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrderDetail(id);
  if (!order) notFound();

  const position = computeSimulatedPosition(order);

  const activeRiders = ASSIGNABLE_STATUSES.includes(order.status)
    ? await prisma.rider.findMany({ where: { isActive: true }, include: { user: true } })
    : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            {order.trackingCode}
          </h1>
          <a
            href={`/track/${order.trackingCode}`}
            target="_blank"
            className="text-sm text-zinc-500 underline dark:text-zinc-400"
          >
            View public tracking page →
          </a>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
            <OrderMap
              pickup={{ lat: order.pickupLat, lng: order.pickupLng, label: order.pickupAddress }}
              dropoff={{
                lat: order.dropoffLat,
                lng: order.dropoffLng,
                label: order.dropoffAddress,
              }}
              position={position}
            />
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Timeline
            </h2>
            <OrderTimeline events={order.events} />
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Notification log
            </h2>
            {order.notifications.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">No notifications sent.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {order.notifications.map((n) => (
                  <li key={n.id} className="text-sm">
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">
                      [{n.channel}]
                    </span>{" "}
                    <span className="text-zinc-600 dark:text-zinc-400">{n.message}</span>
                    <span
                      className={`ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                        n.deliveryMode === "SENT"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                          : n.deliveryMode === "FAILED"
                            ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                            : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                      }`}
                    >
                      {n.deliveryMode}
                    </span>
                    <span className="ml-2 text-xs text-zinc-400 dark:text-zinc-500">
                      {format(new Date(n.createdAt), "PPp")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Messages
            </h2>
            <ChatPanel
              fetchUrl={`/api/orders/${order.id}/messages`}
              postUrl={`/api/orders/${order.id}/messages`}
              placeholder="Message the rider and customer…"
            />
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Customer
            </h2>
            <p className="text-sm text-zinc-700 dark:text-zinc-300">{order.customer.name}</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{order.customer.phone}</p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Package
            </h2>
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              {order.packageDescription}
            </p>
            {order.codAmount != null && (
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                COD: Le {order.codAmount.toLocaleString()}
              </p>
            )}
            {order.deliveryFee != null && (
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Rider fee: Le {order.deliveryFee.toLocaleString()}
              </p>
            )}
            {order.scheduledFor && (
              <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
                Scheduled for {format(new Date(order.scheduledFor), "PPp")}
              </p>
            )}
          </div>

          {order.rating != null && (
            <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
              <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Customer rating
              </h2>
              <RatingDisplay rating={order.rating} comment={order.ratingComment} />
            </div>
          )}

          <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Rider</h2>
            {order.rider ? (
              <>
                <p className="text-sm text-zinc-700 dark:text-zinc-300">
                  {order.rider.user.name}
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {order.rider.vehicleType} · {order.rider.phone}
                </p>
              </>
            ) : (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Not yet assigned</p>
            )}

            {ASSIGNABLE_STATUSES.includes(order.status) && (
              <div className="mt-3">
                <AssignRiderControl
                  orderId={order.id}
                  currentRiderId={order.riderId}
                  riders={activeRiders.map((r) => ({
                    id: r.id,
                    name: r.user.name,
                    vehicleType: r.vehicleType,
                  }))}
                />
              </div>
            )}
          </div>

          {order.proofOfDeliveryPhotoUrl && (
            <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
              <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Proof of delivery
              </h2>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={order.proofOfDeliveryPhotoUrl}
                alt="Proof of delivery"
                className="rounded-md border border-zinc-200 dark:border-zinc-800"
              />
            </div>
          )}

          {order.failureReason && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-5 dark:border-red-900 dark:bg-red-950/40">
              <h2 className="mb-2 text-sm font-semibold text-red-800 dark:text-red-300">
                Failure reason
              </h2>
              <p className="text-sm text-red-700 dark:text-red-400">{order.failureReason}</p>
            </div>
          )}

          {CANCELLABLE_STATUSES.includes(order.status) && (
            <StatusActionButton
              orderId={order.id}
              toStatus="CANCELLED"
              label="Cancel order"
              variant="danger"
              confirmMessage="Are you sure you want to cancel this order?"
            />
          )}
        </div>
      </div>
    </div>
  );
}
