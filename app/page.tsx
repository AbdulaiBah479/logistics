"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [code, setCode] = useState("");

  function handleTrack(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = code.trim();
    if (trimmed) {
      router.push(`/track/${encodeURIComponent(trimmed)}`);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-4 py-24 dark:bg-black">
      <div className="w-full max-w-lg text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          SME Delivery Tracker
        </h1>
        <p className="mt-3 text-zinc-600 dark:text-zinc-400">
          Dispatch riders and track last-mile deliveries in real time.
        </p>

        <form
          onSubmit={handleTrack}
          className="mt-8 flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm sm:flex-row dark:border-zinc-800 dark:bg-zinc-950"
        >
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter tracking code (e.g. TRK-ABC12345)"
            className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-100"
          />
          <button
            type="submit"
            className="rounded-md bg-zinc-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Track order
          </button>
        </form>

        <p className="mt-6 text-sm text-zinc-500 dark:text-zinc-400">
          Business or rider?{" "}
          <a href="/login" className="font-medium text-zinc-900 underline dark:text-zinc-50">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
