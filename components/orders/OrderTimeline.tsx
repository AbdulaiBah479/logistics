import { format } from "date-fns";
import type { OrderStatus } from "@/lib/generated/prisma/client";
import { OrderStatusBadge } from "./OrderStatusBadge";

export interface TimelineEvent {
  status: OrderStatus;
  note?: string | null;
  createdAt: string | Date;
}

export function OrderTimeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">No activity yet.</p>;
  }

  return (
    <ol className="flex flex-col gap-4">
      {events.map((event, i) => (
        <li key={i} className="flex items-start gap-3">
          <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-zinc-400 dark:bg-zinc-600" />
          <div className="flex flex-1 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <OrderStatusBadge status={event.status} />
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {format(new Date(event.createdAt), "PPp")}
              </span>
            </div>
            {event.note && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">{event.note}</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
