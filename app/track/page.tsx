"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function TrackSearchPage() {
  const router = useRouter();
  const [code, setCode] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = code.trim();
    if (trimmed) router.push(`/track/${encodeURIComponent(trimmed)}`);
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-24 dark:bg-black">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-md flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
      >
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Track your order</h1>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter tracking code (e.g. TRK-ABC12345)"
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-100"
        />
        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Track order
        </button>
      </form>
    </div>
  );
}
