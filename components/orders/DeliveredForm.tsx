"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function DeliveredForm({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setError("A proof-of-delivery photo is required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.set("toStatus", "DELIVERED");
    formData.set("photo", file);

    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to mark as delivered.");
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Proof-of-delivery photo
      </label>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="text-sm"
      />
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-fit rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
      >
        {isSubmitting ? "Submitting..." : "Mark delivered"}
      </button>
    </form>
  );
}
