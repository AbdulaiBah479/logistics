"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RiderStatusToggle({
  riderId,
  isActive,
}: {
  riderId: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleToggle() {
    setIsSubmitting(true);
    await fetch(`/api/riders/${riderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    setIsSubmitting(false);
    router.refresh();
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isSubmitting}
      className={`rounded-full px-2.5 py-1 text-xs font-medium disabled:opacity-50 ${
        isActive
          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
          : "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
      }`}
    >
      {isActive ? "Active" : "Inactive"}
    </button>
  );
}
