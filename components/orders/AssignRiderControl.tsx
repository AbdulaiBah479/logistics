"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface AssignableRider {
  id: string;
  name: string;
  vehicleType: string;
}

export function AssignRiderControl({
  orderId,
  riders,
  currentRiderId,
}: {
  orderId: string;
  riders: AssignableRider[];
  currentRiderId?: string | null;
}) {
  const router = useRouter();
  const [riderId, setRiderId] = useState(currentRiderId ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAssign() {
    if (!riderId) return;
    setIsSubmitting(true);
    setError(null);

    const res = await fetch(`/api/orders/${orderId}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ riderId }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to assign rider.");
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <select
          value={riderId}
          onChange={(e) => setRiderId(e.target.value)}
          className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-100"
        >
          <option value="" disabled>
            Select a rider…
          </option>
          {riders.map((rider) => (
            <option key={rider.id} value={rider.id}>
              {rider.name} ({rider.vehicleType})
            </option>
          ))}
        </select>
        <button
          onClick={handleAssign}
          disabled={isSubmitting || !riderId}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {currentRiderId ? "Reassign" : "Assign"}
        </button>
      </div>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
