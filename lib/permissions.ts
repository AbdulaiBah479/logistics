import type { OrderStatus, Role } from "@/lib/generated/prisma/client";

export const STAFF_ROLES: Role[] = ["ADMIN", "DISPATCHER"];

export class UnauthorizedError extends Error {}
export class ForbiddenError extends Error {}

export function requireRole(role: Role | undefined, allowed: Role[]): void {
  if (!role) throw new UnauthorizedError("Not authenticated");
  if (!allowed.includes(role)) throw new ForbiddenError("Not authorized for this action");
}

/** Transitions a rider may perform on an order assigned to them, via /api/orders/[id]/status. */
export const RIDER_ALLOWED_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  ASSIGNED: ["PICKED_UP"],
  PICKED_UP: ["IN_TRANSIT"],
  IN_TRANSIT: ["DELIVERED", "FAILED"],
};

/** Transitions staff may perform on any order, via /api/orders/[id]/status (assignment itself is a separate endpoint). */
export const STAFF_ALLOWED_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  PENDING: ["CANCELLED"],
  ASSIGNED: ["CANCELLED"],
  PICKED_UP: ["CANCELLED"],
  IN_TRANSIT: ["CANCELLED"],
};

export function isRiderTransitionAllowed(from: OrderStatus, to: OrderStatus): boolean {
  return RIDER_ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export function isStaffTransitionAllowed(from: OrderStatus, to: OrderStatus): boolean {
  return STAFF_ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}
