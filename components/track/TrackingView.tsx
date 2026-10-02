"use client";

import { format } from "date-fns";
import { useEffect, useState } from "react";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { OrderMap } from "@/components/map/OrderMap";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { OrderTimeline } from "@/components/orders/OrderTimeline";
import { RatingDisplay } from "@/components/orders/RatingDisplay";
import { RatingWidget } from "@/components/orders/RatingWidget";
import type { PublicTrackingPayload } from "@/lib/trackingPayload";

const POLL_INTERVAL_MS = 6000;

export function TrackingView({
  trackingCode,
  initialData,
}: {
  trackingCode: string;
  initialData: PublicTrackingPayload;
}) {
  const [data, setData] = useState(initialData);

  async function refresh() {
    const res = await fetch(`/api/track/${trackingCode}`);
    if (res.ok) setData(await res.json());
  }

  useEffect(() => {
    const isFinal = ["DELIVERED", "FAILED", "CANCELLED"].includes(initialData.status);
    if (isFinal) return;

    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackingCode, initialData.status]);

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {data.trackingCode}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{data.packageDescription}</p>
        </div>
        <OrderStatusBadge status={data.status} />
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <OrderMap
          pickup={{ lat: data.pickupLat, lng: data.pickupLng, label: data.pickupAddress }}
          dropoff={{ lat: data.dropoffLat, lng: data.dropoffLng, label: data.dropoffAddress }}
          position={data.position}
        />
      </div>

      {data.rider && (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="mb-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Rider</h2>
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            {data.rider.name} · {data.rider.vehicleType}
          </p>
        </div>
      )}

      {data.failureReason && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/40">
          <h2 className="mb-1 text-sm font-semibold text-red-800 dark:text-red-300">
            Delivery attempt failed
          </h2>
          <p className="text-sm text-red-700 dark:text-red-400">{data.failureReason}</p>
        </div>
      )}

      {data.proofOfDeliveryPhotoUrl && (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Proof of delivery
          </h2>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={data.proofOfDeliveryPhotoUrl}
            alt="Proof of delivery"
            className="rounded-md border border-zinc-200 dark:border-zinc-800"
          />
        </div>
      )}

      {data.status === "DELIVERED" && (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Your feedback
          </h2>
          {data.rating != null ? (
            <RatingDisplay rating={data.rating} comment={data.ratingComment} />
          ) : (
            <RatingWidget trackingCode={trackingCode} onRated={refresh} />
          )}
        </div>
      )}

      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Message the team
        </h2>
        <ChatPanel
          fetchUrl={`/api/track/${trackingCode}/messages`}
          postUrl={`/api/track/${trackingCode}/messages`}
          placeholder="Ask a question about your delivery…"
        />
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Timeline</h2>
        <OrderTimeline events={data.timeline} />
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Notifications sent
        </h2>
        {data.notifications.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">None yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {data.notifications.map((n, i) => (
              <li key={i} className="text-sm">
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  [{n.channel}]
                </span>{" "}
                <span className="text-zinc-600 dark:text-zinc-400">{n.message}</span>
                {n.deliveryMode !== "SIMULATED" && (
                  <span
                    className={`ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                      n.deliveryMode === "SENT"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                        : "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                    }`}
                  >
                    {n.deliveryMode}
                  </span>
                )}
                <span className="ml-2 text-xs text-zinc-400 dark:text-zinc-500">
                  {format(new Date(n.createdAt), "PPp")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
