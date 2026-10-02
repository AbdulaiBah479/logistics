"use client";

import { format } from "date-fns";
import { useEffect, useRef, useState } from "react";

export interface ChatMessage {
  id: string;
  senderRole: "STAFF" | "RIDER" | "CUSTOMER";
  senderName: string;
  body: string;
  createdAt: string;
}

const POLL_INTERVAL_MS = 5000;

export function ChatPanel({
  fetchUrl,
  postUrl,
  placeholder,
  isFinal,
}: {
  fetchUrl: string;
  postUrl: string;
  placeholder: string;
  isFinal?: boolean;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function load() {
    const res = await fetch(fetchUrl);
    if (res.ok) {
      const data = await res.json();
      setMessages(data.messages);
    }
  }

  useEffect(() => {
    // Initial fetch on mount — messages aren't server-prefetched since this panel is reused
    // across authenticated (staff/rider) and public (customer) contexts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    if (isFinal) return;
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchUrl, isFinal]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send() {
    const trimmed = body.trim();
    if (!trimmed) return;
    setIsSubmitting(true);
    setError(null);

    const res = await fetch(postUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: trimmed }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      setError(errBody.error ?? "Failed to send message.");
      setIsSubmitting(false);
      return;
    }

    setBody("");
    setIsSubmitting(false);
    load();
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex max-h-64 flex-col gap-3 overflow-y-auto">
        {messages.length === 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No messages yet.</p>
        )}
        {messages.map((m) => (
          <div key={m.id} className="text-sm">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">{m.senderName}</span>{" "}
            <span className="text-xs text-zinc-400 dark:text-zinc-500">
              {format(new Date(m.createdAt), "p")}
            </span>
            <p className="text-zinc-600 dark:text-zinc-400">{m.body}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      {!isFinal && (
        <div className="flex gap-2">
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") send();
            }}
            placeholder={placeholder}
            className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-100"
          />
          <button
            onClick={send}
            disabled={isSubmitting}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Send
          </button>
        </div>
      )}
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
