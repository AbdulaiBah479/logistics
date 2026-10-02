"use client";

import { useState } from "react";

export function RatingWidget({
  trackingCode,
  onRated,
}: {
  trackingCode: string;
  onRated: () => void;
}) {
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (selected === 0) {
      setError("Choose a star rating first.");
      return;
    }
    setIsSubmitting(true);
    setError(null);

    const res = await fetch(`/api/track/${trackingCode}/rating`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: selected, comment: comment || undefined }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to submit rating.");
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    onRated();
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">How was your delivery?</p>
      <div className="flex gap-1 text-2xl">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setSelected(star)}
            className={
              star <= (hovered || selected)
                ? "text-amber-500 leading-none"
                : "text-zinc-300 leading-none dark:text-zinc-700"
            }
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Anything you'd like to add? (optional)"
        rows={2}
        className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-100"
      />
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <button
        onClick={submit}
        disabled={isSubmitting}
        className="w-fit rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {isSubmitting ? "Submitting..." : "Submit rating"}
      </button>
    </div>
  );
}
