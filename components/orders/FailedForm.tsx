"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function FailedForm({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reason.trim()) {
      setError("Please describe why the delivery failed.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.set("toStatus", "FAILED");
    formData.set("failureReason", reason.trim());

    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to record failed delivery.");
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Reason delivery failed
      </label>
      <input
        type="text"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="e.g. Customer unreachable after 3 attempts"
        className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-100"
      />
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-fit rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
      >
        {isSubmitting ? "Submitting..." : "Mark as failed"}
      </button>
    </form>
  );
}
