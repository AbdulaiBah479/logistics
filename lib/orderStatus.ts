import type { OrderStatus } from "@/lib/generated/prisma/client";

/** Which Order timestamp column a given status transition should stamp. */
export const STATUS_TIMESTAMP_FIELD: Partial<Record<OrderStatus, string>> = {
  ASSIGNED: "assignedAt",
  PICKED_UP: "pickedUpAt",
  IN_TRANSIT: "inTransitAt",
  DELIVERED: "deliveredAt",
  FAILED: "failedAt",
  CANCELLED: "cancelledAt",
};
