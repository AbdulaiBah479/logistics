import type { OrderStatus } from "@/lib/generated/prisma/client";
import { estimateDurationMinutes, haversineDistanceKm } from "@/lib/distance";
import { suggestDeliveryFee } from "@/lib/earnings";
import { recordAndSendNotification } from "@/lib/notify";
import { prisma } from "@/lib/prisma";
import { generateTrackingCode } from "@/lib/trackingCode";
import type { CreateOrderInput } from "@/lib/validations";

export const orderListInclude = {
  customer: true,
  rider: { include: { user: true } },
} as const;

export const orderDetailInclude = {
  customer: true,
  rider: { include: { user: true } },
  createdBy: true,
  events: { orderBy: { createdAt: "asc" as const } },
  notifications: { orderBy: { createdAt: "asc" as const } },
} as const;

export interface OrderListFilters {
  status?: string | null;
  riderId?: string | null;
  q?: string | null;
}

export function listOrders(filters: OrderListFilters) {
  return prisma.order.findMany({
    where: {
      ...(filters.status ? { status: filters.status as OrderStatus } : {}),
      ...(filters.riderId ? { riderId: filters.riderId } : {}),
      ...(filters.q
        ? {
            OR: [
              { trackingCode: { contains: filters.q, mode: "insensitive" as const } },
              {
                customer: {
                  name: { contains: filters.q, mode: "insensitive" as const },
                },
              },
            ],
          }
        : {}),
    },
    include: orderListInclude,
    orderBy: { createdAt: "desc" },
  });
}

export function getOrderDetail(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: orderDetailInclude,
  });
}

/**
 * Shared order-creation path used by both the single-order API route and the CSV batch
 * importer. Runs the DB writes in one transaction, then sends the "order received"
 * notification afterward — sending is an external call and shouldn't block or roll back order
 * creation.
 */
export async function createOrder(input: CreateOrderInput, createdById: string) {
  const distanceKm = haversineDistanceKm(
    input.pickupLat,
    input.pickupLng,
    input.dropoffLat,
    input.dropoffLng,
  );
  const estimatedDurationMinutes = estimateDurationMinutes(distanceKm);
  const trackingCode = generateTrackingCode();

  const { order, customer } = await prisma.$transaction(async (tx) => {
    let customer = await tx.customer.findFirst({
      where: { phone: input.customerPhone },
    });
    if (!customer) {
      customer = await tx.customer.create({
        data: { name: input.customerName, phone: input.customerPhone },
      });
    }

    const order = await tx.order.create({
      data: {
        trackingCode,
        status: "PENDING",
        customerId: customer.id,
        createdById,
        packageDescription: input.packageDescription,
        codAmount: input.codAmount,
        deliveryFee: input.deliveryFee ?? suggestDeliveryFee(distanceKm),
        scheduledFor: input.scheduledFor,
        pickupAddress: input.pickupAddress,
        pickupLat: input.pickupLat,
        pickupLng: input.pickupLng,
        dropoffAddress: input.dropoffAddress,
        dropoffLat: input.dropoffLat,
        dropoffLng: input.dropoffLng,
        estimatedDistanceKm: distanceKm,
        estimatedDurationMinutes,
      },
      include: orderListInclude,
    });

    await tx.orderEvent.create({
      data: { orderId: order.id, status: "PENDING", createdById },
    });

    return { order, customer };
  }, { timeout: 15000 });

  await recordAndSendNotification(order.id, "PENDING", customer, order.trackingCode);

  return order;
}
