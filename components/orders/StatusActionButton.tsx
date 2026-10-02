"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function StatusActionButton({
  orderId,
  toStatus,
  label,
  confirmMessage,
  variant = "primary",
}: {
  orderId: string;
  toStatus: string;
  label: string;
  confirmMessage?: string;
  variant?: "primary" | "danger";
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (confirmMessage && !window.confirm(confirmMessage)) return;

    setIsSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.set("toStatus", toStatus);

    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Action failed.");
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    router.refresh();
  }

  const styles =
    variant === "danger"
      ? "bg-red-600 hover:bg-red-500 text-white"
      : "bg-zinc-900 hover:bg-zinc-700 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300";

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={handleClick}
        disabled={isSubmitting}
        className={`rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50 ${styles}`}
      >
        {isSubmitting ? "Working..." : label}
      </button>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
