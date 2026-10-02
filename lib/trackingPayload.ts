import { prisma } from "@/lib/prisma";
import { computeSimulatedPosition } from "@/lib/tracking";

export async function getPublicTrackingPayload(trackingCode: string) {
  const order = await prisma.order.findUnique({
    where: { trackingCode },
    include: {
      rider: { include: { user: true } },
      events: { orderBy: { createdAt: "asc" } },
      notifications: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!order) return null;

  const position = computeSimulatedPosition(order);

  return {
    trackingCode: order.trackingCode,
    status: order.status,
    packageDescription: order.packageDescription,
    pickupAddress: order.pickupAddress,
    pickupLat: order.pickupLat,
    pickupLng: order.pickupLng,
    dropoffAddress: order.dropoffAddress,
    dropoffLat: order.dropoffLat,
    dropoffLng: order.dropoffLng,
    failureReason: order.failureReason,
    proofOfDeliveryPhotoUrl: order.proofOfDeliveryPhotoUrl,
    createdAt: order.createdAt,
    rider: order.rider
      ? { name: order.rider.user.name, vehicleType: order.rider.vehicleType }
      : null,
    position,
    rating: order.rating,
    ratingComment: order.ratingComment,
    timeline: order.events.map((e) => ({
      status: e.status,
      note: e.note,
      createdAt: e.createdAt,
    })),
    notifications: order.notifications.map((n) => ({
      channel: n.channel,
      message: n.message,
      deliveryMode: n.deliveryMode,
      createdAt: n.createdAt,
    })),
  };
}

export type PublicTrackingPayload = NonNullable<Awaited<ReturnType<typeof getPublicTrackingPayload>>>;
