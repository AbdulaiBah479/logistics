import type { OrderStatus } from "@/lib/generated/prisma/client";

const STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  ASSIGNED: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  PICKED_UP: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300",
  IN_TRANSIT: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  DELIVERED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  FAILED: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  CANCELLED: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Pending",
  ASSIGNED: "Assigned",
  PICKED_UP: "Picked up",
  IN_TRANSIT: "In transit",
  DELIVERED: "Delivered",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
