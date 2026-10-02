"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { LocationPicker, type LocationValue } from "./LocationPicker";

export function OrderForm() {
  const router = useRouter();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [packageDescription, setPackageDescription] = useState("");
  const [codAmount, setCodAmount] = useState("");
  const [deliveryFee, setDeliveryFee] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  const [pickup, setPickup] = useState<LocationValue>({ address: "", lat: "", lng: "" });
  const [dropoff, setDropoff] = useState<LocationValue>({ address: "", lat: "", lng: "" });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName,
        customerPhone,
        packageDescription,
        codAmount: codAmount ? Number(codAmount) : undefined,
        deliveryFee: deliveryFee ? Number(deliveryFee) : undefined,
        scheduledFor: scheduledFor ? new Date(scheduledFor).toISOString() : undefined,
        pickupAddress: pickup.address,
        pickupLat: Number(pickup.lat),
        pickupLng: Number(pickup.lng),
        dropoffAddress: dropoff.address,
        dropoffLat: Number(dropoff.lat),
        dropoffLng: Number(dropoff.lng),
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to create order.");
      setIsSubmitting(false);
      return;
    }

    const { order } = await res.json();
    router.push(`/dashboard/orders/${order.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-2xl flex-col gap-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Customer name
          </label>
          <input
            required
            name="customerName"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-100"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Customer phone
          </label>
          <input
            required
            name="customerPhone"
            placeholder="+232 7X XXX XXX"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-100"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Package description
        </label>
        <input
          required
          name="packageDescription"
          value={packageDescription}
          onChange={(e) => setPackageDescription(e.target.value)}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-100"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Cash on delivery amount (Leones, optional)
          </label>
          <input
            type="number"
            min="0"
            name="codAmount"
            value={codAmount}
            onChange={(e) => setCodAmount(e.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-100"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Rider fee (Leones, optional — auto-calculated from distance if left blank)
          </label>
          <input
            type="number"
            min="0"
            name="deliveryFee"
            value={deliveryFee}
            onChange={(e) => setDeliveryFee(e.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-100"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Schedule for later (optional — leave blank to dispatch now)
        </label>
        <input
          type="datetime-local"
          name="scheduledFor"
          value={scheduledFor}
          onChange={(e) => setScheduledFor(e.target.value)}
          className="w-fit rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-100"
        />
      </div>

      <LocationPicker label="Pickup location" name="pickup" value={pickup} onChange={setPickup} />
      <LocationPicker
        label="Dropoff location"
        name="dropoff"
        value={dropoff}
        onChange={setDropoff}
      />

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-fit rounded-md bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {isSubmitting ? "Creating..." : "Create order"}
      </button>
    </form>
  );
}
